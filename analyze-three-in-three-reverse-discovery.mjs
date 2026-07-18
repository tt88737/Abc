import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));

export function numbersFromRecord(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

function sortRows(rows) {
  return rows
    .filter(row => Number(row?.issue || 0) > 0 && numbersFromRecord(row).length === 6)
    .sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      return dateCompare || Number(a.issue || 0) - Number(b.issue || 0);
    });
}

function combos(nums, size) {
  const sorted = [...nums].sort((a, b) => Number(a) - Number(b));
  const result = [];
  function walk(start, picked) {
    if (picked.length === size) {
      result.push(picked.slice());
      return;
    }
    for (let idx = start; idx <= sorted.length - (size - picked.length); idx += 1) {
      picked.push(sorted[idx]);
      walk(idx + 1, picked);
      picked.pop();
    }
  }
  walk(0, []);
  return result;
}

function hitCount(pool, row) {
  const set = new Set(pool);
  return numbersFromRecord(row).filter(num => set.has(num)).length;
}

export function combinationStats(pool, history) {
  const recent100 = history.slice(-100);
  const recent10 = history.slice(-10);
  const recent20 = history.slice(-20);
  return {
    hit3Count: recent100.filter(row => hitCount(pool, row) >= 3).length,
    recent10Frequency: recent10.reduce((sum, row) => sum + hitCount(pool, row), 0),
    recent20Frequency: recent20.reduce((sum, row) => sum + hitCount(pool, row), 0),
    lastIssueOverlap: history.length ? hitCount(pool, history.at(-1)) : 0,
    last3Overlap: new Set(history.slice(-3).flatMap(numbersFromRecord)).size
      ? pool.filter(num => new Set(history.slice(-3).flatMap(numbersFromRecord)).has(num)).length
      : 0,
  };
}

export function featureSnapshot(pool, history = []) {
  const nums = [...pool].sort((a, b) => Number(a) - Number(b));
  const oddCount = nums.filter(num => Number(num) % 2 === 1).length;
  const evenCount = nums.length - oddCount;
  const smallCount = nums.filter(num => Number(num) <= 24).length;
  const zones = new Set(nums.map(num => Math.floor((Number(num) - 1) / 10)));
  const tails = new Set(nums.map(num => Number(num) % 10));
  const stats = combinationStats(nums, history);
  return {
    size: nums.length,
    nums,
    oddCount,
    evenCount,
    smallCount,
    bigCount: nums.length - smallCount,
    zoneCount: zones.size,
    tailCount: tails.size,
    ...stats,
  };
}

function rankFrequency(history) {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));
  history.forEach((row, idx) => {
    for (const num of numbersFromRecord(row)) {
      counts.set(num, (counts.get(num) || 0) + 1);
      lastSeen.set(num, idx);
    }
  });
  return ALL_NUMS.slice().sort((a, b) =>
    (counts.get(b) || 0) - (counts.get(a) || 0)
    || (lastSeen.get(b) || -1) - (lastSeen.get(a) || -1)
    || Number(a) - Number(b));
}

function candidatePools(history, sampleSize) {
  const pools = new Map();
  const ranked = rankFrequency(history);
  function add(pool, reason) {
    if (pool.length !== 6) return;
    const key = pool.slice().sort((a, b) => Number(a) - Number(b)).join(' ');
    if (!pools.has(key)) pools.set(key, {pool: key.split(' '), reasons: new Set()});
    pools.get(key).reasons.add(reason);
  }

  for (const row of history.slice(-sampleSize)) {
    add(numbersFromRecord(row), 'historical-draw');
  }

  for (const row of history.slice(-Math.min(sampleSize, 8))) {
    for (const triple of combos(numbersFromRecord(row), 3)) {
      add(triple.concat(ranked.filter(num => !triple.includes(num)).slice(0, 3)), 'triple-plus-hot');
    }
  }

  add(rankFrequency(history.slice(-5)).slice(0, 6), 'hot-5');
  add(rankFrequency(history.slice(-10)).slice(0, 6), 'hot-10');
  add(rankFrequency(history.slice(-20)).slice(0, 6), 'hot-20');

  return [...pools.values()].map(item => ({
    pool: item.pool,
    reasons: [...item.reasons],
  }));
}

function average(rows, key) {
  return rows.length ? Math.round((rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length) * 100) / 100 : 0;
}

function profile(rows) {
  return {
    count: rows.length,
    avgRecent10Frequency: average(rows, 'recent10Frequency'),
    avgRecent20Frequency: average(rows, 'recent20Frequency'),
    avgLastIssueOverlap: average(rows, 'lastIssueOverlap'),
    avgLast3Overlap: average(rows, 'last3Overlap'),
    avgOddCount: average(rows, 'oddCount'),
    avgSmallCount: average(rows, 'smallCount'),
    avgZoneCount: average(rows, 'zoneCount'),
    avgTailCount: average(rows, 'tailCount'),
  };
}

export function analyzeReverseDiscovery(records, options = {}) {
  const source = String(options.source || 'am');
  const sampleSize = Number(options.sampleSize || 25);
  const maxCandidates = Number(options.maxCandidates || 120);
  const rows = sortRows(records.filter(row => String(row?.source || '') === source));
  const evaluated = [];

  for (let idx = 20; idx < rows.length; idx += 1) {
    const target = rows[idx];
    const history = rows.slice(0, idx);
    for (const candidate of candidatePools(history, sampleSize).slice(0, maxCandidates)) {
      const matches = hitCount(candidate.pool, target);
      const snapshot = featureSnapshot(candidate.pool, history);
      evaluated.push({
        issue: Number(target.issue || 0),
        date: target.date || '',
        pool: candidate.pool,
        reasons: candidate.reasons,
        matches,
        success: matches >= 3,
        ...snapshot,
      });
    }
  }

  const successes = evaluated.filter(item => item.success);
  const misses = evaluated.filter(item => !item.success);
  const grouped = new Map();
  for (const item of successes) {
    const key = item.pool.join(' ');
    if (!grouped.has(key)) grouped.set(key, {pool: item.pool, successCount: 0, reasons: new Set(), featureRows: []});
    const row = grouped.get(key);
    row.successCount += 1;
    item.reasons.forEach(reason => row.reasons.add(reason));
    row.featureRows.push(item);
  }

  const topHistoricalPools = [...grouped.values()]
    .sort((a, b) => b.successCount - a.successCount || a.pool.join(' ').localeCompare(b.pool.join(' ')))
    .slice(0, 30)
    .map(item => ({
      pool: item.pool,
      successCount: item.successCount,
      reasons: [...item.reasons],
      profile: profile(item.featureRows),
    }));

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '反向发现：采样开奖前历史可形成的6码池，统计哪些池在目标期中三，并总结成功池的开奖前特征。',
    totalRecords: rows.length,
    evaluatedPools: evaluated.length,
    successPools: successes.length,
    successRate: evaluated.length ? Math.round((successes.length / evaluated.length) * 10000) / 100 : 0,
    successProfiles: [
      {name: '成功池特征均值', ...profile(successes)},
      {name: '失败池特征均值', ...profile(misses)},
    ],
    topHistoricalPools,
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 6码复式反向发现',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `澳门可用记录：${report.totalRecords} 期`,
    '',
    `采样6码池：${report.evaluatedPools}，成功池：${report.successPools}，样本成功率：${report.successRate}%`,
    '',
    '## 成功池与失败池特征',
    '',
    '| 类型 | 样本数 | 近10期频次均值 | 近20期频次均值 | 上期重叠 | 近3期重叠 | 单数均值 | 小号均值 | 区间数 | 尾数数 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const row of report.successProfiles) {
    lines.push(`| ${row.name} | ${row.count} | ${row.avgRecent10Frequency} | ${row.avgRecent20Frequency} | ${row.avgLastIssueOverlap} | ${row.avgLast3Overlap} | ${row.avgOddCount} | ${row.avgSmallCount} | ${row.avgZoneCount} | ${row.avgTailCount} |`);
  }

  lines.push('');
  lines.push('## 历史成功次数最高的6码池');
  lines.push('');
  lines.push('| 排名 | 6码池 | 成功次数 | 来源 | 特征摘要 |');
  lines.push('| --- | --- | --- | --- | --- |');
  report.topHistoricalPools.forEach((item, idx) => {
    const p = item.profile;
    lines.push(`| ${idx + 1} | ${item.pool.join(' ')} | ${item.successCount} | ${item.reasons.join(', ')} | 近10频次${p.avgRecent10Frequency} / 上期重叠${p.avgLastIssueOverlap} / 区间${p.avgZoneCount} / 尾数${p.avgTailCount} |`);
  });

  lines.push('');
  lines.push('## 使用说明');
  lines.push('');
  lines.push('- 这不是推荐公式，是寻找成功样本共同特征。');
  lines.push('- 如果成功池和失败池特征差异很小，说明这些特征不足以形成可靠规律。');
  lines.push('- 后续应优先把差异明显的特征转成 walk-forward 公式再验证。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzeReverseDiscovery(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-reverse-discovery-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-reverse-discovery-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-reverse-discovery-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_REVERSE_DISCOVERY_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  console.log(`Evaluated=${report.evaluatedPools} Success=${report.successPools} Rate=${report.successRate}%`);
  for (const row of report.successProfiles) {
    console.log(`${row.name}: count=${row.count} recent10=${row.avgRecent10Frequency} lastIssue=${row.avgLastIssueOverlap} last3=${row.avgLast3Overlap} zones=${row.avgZoneCount} tails=${row.avgTailCount}`);
  }
  for (const item of report.topHistoricalPools.slice(0, 10)) {
    console.log(`${item.pool.join(' ')} success=${item.successCount} reasons=${item.reasons.join(',')}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
