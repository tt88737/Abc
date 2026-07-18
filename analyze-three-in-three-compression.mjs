import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
const WINDOWS = [3, 5, 10];

function positiveNumbers(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

export function compressionHitCount(pool, record) {
  const poolSet = new Set(pool || []);
  return positiveNumbers(record).filter(num => poolSet.has(num)).length;
}

function displayYear(record) {
  const date = String(record?.date || '');
  return date.length >= 4 ? date.slice(0, 4) : String(record?.year || '');
}

function sortRows(rows) {
  return rows
    .filter(row => Number(row?.issue || 0) > 0 && positiveNumbers(row).length === 6)
    .sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      return dateCompare || Number(a.issue || 0) - Number(b.issue || 0);
    });
}

function rankHistory(history, mode = 'hot') {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));
  history.forEach((row, idx) => {
    for (const num of positiveNumbers(row)) {
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

function recentMotherPool(history, size = 12) {
  const picked = [];
  for (let idx = history.length - 1; idx >= 0; idx -= 1) {
    for (const num of positiveNumbers(history[idx])) {
      if (!picked.includes(num)) picked.push(num);
      if (picked.length === size) return picked.sort((a, b) => Number(a) - Number(b));
    }
  }
  return picked.sort((a, b) => Number(a) - Number(b));
}

function hotMotherPool(history, size = 12) {
  return rankHistory(history.slice(-10), 'hot')
    .slice(0, size)
    .sort((a, b) => Number(a) - Number(b));
}

function takeUnique(size, ...lists) {
  const picked = [];
  for (const list of lists) {
    for (const num of list) {
      if (!picked.includes(num)) picked.push(num);
      if (picked.length === size) return picked.sort((a, b) => Number(a) - Number(b));
    }
  }
  return picked.sort((a, b) => Number(a) - Number(b));
}

export function compressHot(motherPool, history, size = 6) {
  const allowed = new Set(motherPool || []);
  const hot = rankHistory(history, 'hot').filter(num => allowed.has(num));
  return takeUnique(size, hot, motherPool || []);
}

function compressRecent(motherPool, history, size = 6) {
  const allowed = new Set(motherPool || []);
  const recent = [];
  for (let idx = history.length - 1; idx >= 0; idx -= 1) {
    for (const num of positiveNumbers(history[idx])) {
      if (allowed.has(num) && !recent.includes(num)) recent.push(num);
      if (recent.length === size) return recent.sort((a, b) => Number(a) - Number(b));
    }
  }
  return takeUnique(size, recent, motherPool || []);
}

function zone(num) {
  return Math.floor((Number(num) - 1) / 10);
}

export function compressBalanced(motherPool, history, size = 6) {
  const hot = compressHot(motherPool, history, motherPool.length);
  const selected = [];
  for (let targetZone = 0; targetZone < 5; targetZone += 1) {
    const pick = hot.find(num => zone(num) === targetZone && !selected.includes(num));
    if (pick) selected.push(pick);
  }
  return takeUnique(size, selected, hot, motherPool || []);
}

function compressHotCold(motherPool, history, size = 6) {
  const allowed = new Set(motherPool || []);
  const hot = rankHistory(history, 'hot').filter(num => allowed.has(num)).slice(0, 3);
  const cold = rankHistory(history, 'cold').filter(num => allowed.has(num)).slice(0, 3);
  return takeUnique(size, hot, cold, motherPool || []);
}

function formulas() {
  const motherDefs = [
    {id: 'recent12', name: '近期重号12码', minHistory: 2, build: history => recentMotherPool(history, 12)},
    {id: 'hot10-12', name: '近10期热码12码', minHistory: 10, build: history => hotMotherPool(history, 12)},
  ];
  const compressionDefs = [
    {id: 'hot6', name: '热度压缩6码', build: compressHot},
    {id: 'balanced6', name: '五区均衡压缩6码', build: compressBalanced},
    {id: 'recent6', name: '近期重复压缩6码', build: compressRecent},
    {id: 'hotcold6', name: '热冷混合压缩6码', build: compressHotCold},
  ];
  return motherDefs.flatMap(mother => compressionDefs.map(compression => ({
    id: `${mother.id}-${compression.id}`,
    name: `${mother.name} -> ${compression.name}`,
    poolSize: 6,
    minHistory: mother.minHistory,
    build(history) {
      const motherPool = mother.build(history);
      if (motherPool.length !== 12) return [];
      return compression.build(motherPool, history, 6);
    },
  })));
}

function roundRate(value, total) {
  return total ? Math.round((value / total) * 10000) / 100 : 0;
}

function maxMissStreak(evaluations) {
  let current = 0;
  let max = 0;
  for (const item of evaluations) {
    if (item.hit) current = 0;
    else {
      current += 1;
      max = Math.max(max, current);
    }
  }
  return max;
}

function windowHitRate(evaluations, size) {
  if (evaluations.length < size) return {windows: 0, hitWindows: 0, hitRate: 0};
  let hitWindows = 0;
  for (let idx = 0; idx <= evaluations.length - size; idx += 1) {
    if (evaluations.slice(idx, idx + size).some(item => item.hit)) hitWindows += 1;
  }
  const windows = evaluations.length - size + 1;
  return {windows, hitWindows, hitRate: roundRate(hitWindows, windows)};
}

function summarize(formula, evaluations, windows) {
  const hits = evaluations.filter(item => item.hit).length;
  const byYear = {};
  for (const year of [...new Set(evaluations.map(item => item.year))].sort()) {
    const rows = evaluations.filter(item => item.year === year);
    const yearHits = rows.filter(item => item.hit).length;
    byYear[year] = {
      evaluatedDraws: rows.length,
      hits: yearHits,
      hitRate: roundRate(yearHits, rows.length),
      maxMissStreak: maxMissStreak(rows),
    };
  }
  return {
    id: formula.id,
    name: formula.name,
    poolSize: formula.poolSize,
    evaluatedDraws: evaluations.length,
    hits,
    hitRate: roundRate(hits, evaluations.length),
    maxMissStreak: maxMissStreak(evaluations),
    windows: Object.fromEntries(windows.map(size => [String(size), windowHitRate(evaluations, size)])),
    byYear,
    latestPool: evaluations.at(-1)?.pool || [],
    latestEvaluations: evaluations.slice(-10),
  };
}

export function analyzeThreeInThreeCompression(records, options = {}) {
  const source = String(options.source || 'am');
  const windows = options.windows || WINDOWS;
  const rows = sortRows(records.filter(row => String(row?.source || '') === source));
  const summaries = [];

  for (const formula of formulas()) {
    const evaluations = [];
    for (let idx = 0; idx < rows.length; idx += 1) {
      if (idx < formula.minHistory) continue;
      const target = rows[idx];
      const history = rows.slice(0, idx);
      const pool = formula.build(history);
      if (pool.length !== 6) continue;
      const count = compressionHitCount(pool, target);
      evaluations.push({
        issue: Number(target.issue || 0),
        date: target.date || '',
        year: displayYear(target),
        pool,
        positives: positiveNumbers(target),
        matchCount: count,
        hit: count >= 3,
      });
    }
    summaries.push(summarize(formula, evaluations, windows));
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '先用开奖前历史生成12码母池，再压缩成6码；当期前6正码命中>=3算三中三；特别号忽略。',
    totalRecords: rows.length,
    formulas: summaries.sort((a, b) => b.hitRate - a.hitRate || a.maxMissStreak - b.maxMissStreak || a.id.localeCompare(b.id)),
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 12码压缩6码扫描',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `澳门可用记录：${report.totalRecords} 期`,
    '',
    '## 总览',
    '',
    '| 排名 | 公式 | 可评估期数 | 命中 | 命中率 | 最大连挂 | 3期窗口 | 5期窗口 | 10期窗口 | 最新6码 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  report.formulas.forEach((item, idx) => {
    lines.push(`| ${idx + 1} | ${item.name} | ${item.evaluatedDraws} | ${item.hits} | ${item.hitRate}% | ${item.maxMissStreak} | ${item.windows['3']?.hitRate || 0}% | ${item.windows['5']?.hitRate || 0}% | ${item.windows['10']?.hitRate || 0}% | ${item.latestPool.join(' ')} |`);
  });
  lines.push('');
  lines.push('## 说明');
  lines.push('');
  lines.push('- 这一步验证 12 码母池是否能被压缩成可观察的 6 码。');
  lines.push('- 如果压缩后仍接近基础固定6码水平，说明三中三不能直接做固定6码推荐。');
  lines.push('- 结果只用于规律研究，不接入当前页面菜单。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const recordsPath = path.join(root, 'data', 'records.json');
  const payload = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  const report = analyzeThreeInThreeCompression(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-compression-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-compression-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-compression-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_COMPRESSION_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const item of report.formulas) {
    console.log(`${item.name}: ${item.hits}/${item.evaluatedDraws} ${item.hitRate}% maxMiss=${item.maxMissStreak} latest=${item.latestPool.join(' ')}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
