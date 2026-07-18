import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));

function positives(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

function sortRows(rows) {
  return rows
    .filter(row => Number(row?.issue || 0) > 0 && positives(row).length === 6)
    .sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      return dateCompare || Number(a.issue || 0) - Number(b.issue || 0);
    });
}

export function overlapCount(a, b) {
  const set = new Set(positives(a));
  return positives(b).filter(num => set.has(num)).length;
}

export function drawShape(record) {
  const nums = positives(record);
  const values = nums.map(Number).sort((a, b) => a - b);
  let consecutivePairs = 0;
  for (let idx = 1; idx < values.length; idx += 1) {
    if (values[idx] === values[idx - 1] + 1) consecutivePairs += 1;
  }
  const tails = nums.map(num => Number(num) % 10);
  let sameTailPairs = 0;
  for (let i = 0; i < tails.length; i += 1) {
    for (let j = i + 1; j < tails.length; j += 1) {
      if (tails[i] === tails[j]) sameTailPairs += 1;
    }
  }
  const oddCount = values.filter(num => num % 2 === 1).length;
  const smallCount = values.filter(num => num <= 24).length;
  return {
    oddCount,
    evenCount: values.length - oddCount,
    smallCount,
    bigCount: values.length - smallCount,
    zoneCount: new Set(values.map(num => Math.floor((num - 1) / 10))).size,
    tailCount: new Set(tails).size,
    consecutivePairs,
    sameTailPairs,
  };
}

function rankHistory(history, mode = 'hot') {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));
  history.forEach((row, idx) => {
    for (const num of positives(row)) {
      counts.set(num, (counts.get(num) || 0) + 1);
      lastSeen.set(num, idx);
    }
  });
  return ALL_NUMS.slice().sort((a, b) => {
    if (mode === 'cold') {
      return (counts.get(a) || 0) - (counts.get(b) || 0)
        || (lastSeen.get(a) || -1) - (lastSeen.get(b) || -1)
        || Number(a) - Number(b);
    }
    return (counts.get(b) || 0) - (counts.get(a) || 0)
      || (lastSeen.get(b) || -1) - (lastSeen.get(a) || -1)
      || Number(a) - Number(b);
  });
}

function recentCarryPair(history) {
  const last = positives(history.at(-1) || {});
  return takeUnique(last, rankHistory(history.slice(-10), 'hot')).slice(0, 6).sort((a, b) => Number(a) - Number(b));
}

function takeUnique(...lists) {
  const out = [];
  for (const list of lists) {
    for (const num of list) {
      if (!out.includes(num)) out.push(num);
    }
  }
  return out;
}

function hitCount(pool, row) {
  const set = new Set(pool);
  return positives(row).filter(num => set.has(num)).length;
}

function formulas() {
  return [
    {id: 'hot-5', name: '近5期热码前6', minHistory: 5, build: history => rankHistory(history.slice(-5), 'hot').slice(0, 6).sort((a, b) => Number(a) - Number(b))},
    {id: 'hot-10', name: '近10期热码前6', minHistory: 10, build: history => rankHistory(history.slice(-10), 'hot').slice(0, 6).sort((a, b) => Number(a) - Number(b))},
    {id: 'carry-hot-10', name: '上期延续+近10期热度6码', minHistory: 10, build: history => recentCarryPair(history)},
  ];
}

function missStreakBefore(evaluations) {
  let streak = 0;
  for (let idx = evaluations.length - 1; idx >= 0; idx -= 1) {
    if (evaluations[idx].hit) break;
    streak += 1;
  }
  return streak;
}

export function trendBucket(state) {
  const buckets = [];
  if (state.missStreak >= 30) buckets.push('miss>=30');
  else if (state.missStreak >= 20) buckets.push('miss>=20');
  else if (state.missStreak >= 10) buckets.push('miss>=10');
  else buckets.push('miss<10');

  if (state.previousOverlap >= 4) buckets.push('prevOverlap>=4');
  else if (state.previousOverlap <= 1) buckets.push('prevOverlap<=1');
  else buckets.push('prevOverlap2-3');

  if (state.oddCount >= 5) buckets.push('prevOdd>=5');
  if (state.oddCount <= 1) buckets.push('prevOdd<=1');
  if (state.smallCount >= 5) buckets.push('prevSmall>=5');
  if (state.smallCount <= 1) buckets.push('prevSmall<=1');
  if (state.zoneCount <= 2) buckets.push('prevZone<=2');
  if (state.tailCount <= 4) buckets.push('prevTail<=4');
  if (state.consecutivePairs >= 3) buckets.push('prevConsecutive>=3');
  if (state.sameTailPairs >= 2) buckets.push('prevSameTail>=2');
  return buckets;
}

function roundRate(value, total) {
  return total ? Math.round((value / total) * 10000) / 100 : 0;
}

function summarizeFormula(formula, evaluations) {
  const hits = evaluations.filter(row => row.hit).length;
  return {
    id: formula.id,
    name: formula.name,
    evaluatedDraws: evaluations.length,
    hits,
    hitRate: roundRate(hits, evaluations.length),
    latestPool: evaluations.at(-1)?.pool || [],
  };
}

export function analyzeTrendShape(records, options = {}) {
  const source = String(options.source || 'am');
  const rows = sortRows(records.filter(row => String(row?.source || '') === source));
  const formulaSummaries = [];
  const bucketMap = new Map();

  for (const formula of formulas()) {
    const evaluations = [];
    for (let idx = 1; idx < rows.length; idx += 1) {
      if (idx < formula.minHistory) continue;
      const target = rows[idx];
      const history = rows.slice(0, idx);
      const pool = formula.build(history);
      if (pool.length !== 6) continue;
      const count = hitCount(pool, target);
      const previous = rows[idx - 1];
      const shape = drawShape(previous);
      const state = {
        missStreak: missStreakBefore(evaluations),
        previousOverlap: idx >= 2 ? overlapCount(rows[idx - 2], previous) : 0,
        ...shape,
      };
      const hit = count >= 3;
      const evaluation = {
        formula: formula.id,
        issue: Number(target.issue || 0),
        date: target.date || '',
        pool,
        matchCount: count,
        hit,
        state,
      };
      evaluations.push(evaluation);
      for (const bucket of trendBucket(state)) {
        const key = `${formula.id}:${bucket}`;
        if (!bucketMap.has(key)) bucketMap.set(key, {formula: formula.id, formulaName: formula.name, bucket, total: 0, hits: 0});
        const item = bucketMap.get(key);
        item.total += 1;
        if (hit) item.hits += 1;
      }
    }
    formulaSummaries.push(summarizeFormula(formula, evaluations));
  }

  const buckets = [...bucketMap.values()]
    .map(item => ({...item, hitRate: roundRate(item.hits, item.total), lift: 0}))
    .map(item => {
      const formula = formulaSummaries.find(row => row.id === item.formula);
      return {...item, lift: Math.round((item.hitRate - (formula?.hitRate || 0)) * 100) / 100};
    })
    .filter(item => item.total >= 30 || rows.length < 30)
    .sort((a, b) => b.lift - a.lift || b.hitRate - a.hitRate || b.total - a.total);

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '走势形态反向分析：固定6码复式公式不变，按命中前的空窗、上期重叠、上期正码结构分桶，寻找触发条件。',
    totalRecords: rows.length,
    formulas: formulaSummaries.sort((a, b) => b.hitRate - a.hitRate),
    buckets,
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 6码复式走势形态反向分析',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `澳门可用记录：${report.totalRecords} 期`,
    '',
    '## 基础公式',
    '',
    '| 公式 | 可评估期数 | 命中 | 命中率 | 最新6码 |',
    '| --- | --- | --- | --- | --- |',
  ];
  for (const item of report.formulas) {
    lines.push(`| ${item.name} | ${item.evaluatedDraws} | ${item.hits} | ${item.hitRate}% | ${item.latestPool.join(' ')} |`);
  }
  lines.push('');
  lines.push('## 提升最高的走势桶');
  lines.push('');
  lines.push('| 排名 | 公式 | 走势桶 | 样本数 | 命中 | 命中率 | 相对基础提升 |');
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');
  report.buckets.slice(0, 40).forEach((item, idx) => {
    lines.push(`| ${idx + 1} | ${item.formulaName} | ${item.bucket} | ${item.total} | ${item.hits} | ${item.hitRate}% | ${item.lift}% |`);
  });
  lines.push('');
  lines.push('## 使用说明');
  lines.push('');
  lines.push('- 走势桶不是新推荐，只是判断某些状态下基础6码公式是否更值得观察。');
  lines.push('- 只有样本数足够、命中率提升明显、且最大空窗能下降的桶，才值得转成下一轮 walk-forward 触发公式。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzeTrendShape(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-trend-shape-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-trend-shape-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-trend-shape-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_TREND_SHAPE_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const item of report.formulas) {
    console.log(`${item.name}: ${item.hits}/${item.evaluatedDraws} ${item.hitRate}% latest=${item.latestPool.join(' ')}`);
  }
  for (const item of report.buckets.slice(0, 12)) {
    console.log(`${item.formulaName} ${item.bucket}: ${item.hits}/${item.total} ${item.hitRate}% lift=${item.lift}%`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
