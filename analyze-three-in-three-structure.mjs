import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
const WINDOWS = [3, 5, 10];
const ZONES = [
  num => Number(num) >= 1 && Number(num) <= 10,
  num => Number(num) >= 11 && Number(num) <= 20,
  num => Number(num) >= 21 && Number(num) <= 30,
  num => Number(num) >= 31 && Number(num) <= 40,
  num => Number(num) >= 41 && Number(num) <= 49,
];

function positiveNumbers(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

export function structureHitCount(pool, record) {
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

export function buildRecentPool(history, size) {
  const picked = [];
  for (let idx = history.length - 1; idx >= 0; idx -= 1) {
    for (const num of positiveNumbers(history[idx])) {
      if (!picked.includes(num)) picked.push(num);
      if (picked.length === size) return picked.sort((a, b) => Number(a) - Number(b));
    }
  }
  return picked.sort((a, b) => Number(a) - Number(b));
}

function fillPool(primary, fallback, size) {
  const picked = [];
  for (const num of primary.concat(fallback, ALL_NUMS)) {
    if (!picked.includes(num)) picked.push(num);
    if (picked.length === size) return picked.sort((a, b) => Number(a) - Number(b));
  }
  return picked.sort((a, b) => Number(a) - Number(b));
}

function zoneBalancedPool(history, size) {
  const ranked = rankHistory(history, 'hot');
  const perZone = size === 10 ? [2, 2, 2, 2, 2] : [3, 3, 2, 2, 2];
  const primary = [];
  ZONES.forEach((predicate, idx) => {
    primary.push(...ranked.filter(predicate).slice(0, perZone[idx]));
  });
  return fillPool(primary, ranked, size);
}

function parityBalancedPool(history, size) {
  const ranked = rankHistory(history, 'hot');
  const oddCount = Math.floor(size / 2);
  const evenCount = size - oddCount;
  const odd = ranked.filter(num => Number(num) % 2 === 1).slice(0, oddCount);
  const even = ranked.filter(num => Number(num) % 2 === 0).slice(0, evenCount);
  return fillPool(odd.concat(even), ranked, size);
}

function formulas() {
  const defs = [];
  for (const size of [10, 12]) {
    defs.push(
      {id: `recent-${size}`, name: `近期重号池${size}码`, poolSize: size, minHistory: 2, build: history => buildRecentPool(history, size)},
      {id: `hot-10-${size}`, name: `近10期热码${size}码`, poolSize: size, minHistory: 10, build: history => rankHistory(history.slice(-10), 'hot').slice(0, size).sort((a, b) => Number(a) - Number(b))},
      {id: `hot-20-${size}`, name: `近20期热码${size}码`, poolSize: size, minHistory: 20, build: history => rankHistory(history.slice(-20), 'hot').slice(0, size).sort((a, b) => Number(a) - Number(b))},
      {id: `cold-20-${size}`, name: `近20期冷码${size}码`, poolSize: size, minHistory: 20, build: history => rankHistory(history.slice(-20), 'cold').slice(0, size).sort((a, b) => Number(a) - Number(b))},
      {id: `zone-20-${size}`, name: `近20期五区均衡${size}码`, poolSize: size, minHistory: 20, build: history => zoneBalancedPool(history.slice(-20), size)},
      {id: `parity-20-${size}`, name: `近20期单双均衡${size}码`, poolSize: size, minHistory: 20, build: history => parityBalancedPool(history.slice(-20), size)},
    );
  }
  return defs;
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

export function analyzeThreeInThreeStructure(records, options = {}) {
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
      if (pool.length !== formula.poolSize) continue;
      const count = structureHitCount(pool, target);
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
    rule: '每期生成10或12码候选池；当期前6正码命中>=3算结构覆盖；特别号忽略；只使用开奖前历史。',
    totalRecords: rows.length,
    formulas: summaries.sort((a, b) => b.hitRate - a.hitRate || a.maxMissStreak - b.maxMissStreak || a.id.localeCompare(b.id)),
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 10-12码候选池结构扫描',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `澳门可用记录：${report.totalRecords} 期`,
    '',
    '## 总览',
    '',
    '| 排名 | 公式 | 候选池 | 可评估期数 | 命中 | 命中率 | 最大连挂 | 3期窗口 | 5期窗口 | 10期窗口 | 最新候选池 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  report.formulas.forEach((item, idx) => {
    lines.push(`| ${idx + 1} | ${item.name} | ${item.poolSize} | ${item.evaluatedDraws} | ${item.hits} | ${item.hitRate}% | ${item.maxMissStreak} | ${item.windows['3']?.hitRate || 0}% | ${item.windows['5']?.hitRate || 0}% | ${item.windows['10']?.hitRate || 0}% | ${item.latestPool.join(' ')} |`);
  });

  lines.push('');
  lines.push('## 结论使用方式');
  lines.push('');
  lines.push('- 这一步只判断候选池是否有结构优势，不产生6码推荐。');
  lines.push('- 如果 12 码候选池命中率仍然低或最大连挂过长，就不值得继续压缩成6码。');
  lines.push('- 如果某类候选池稳定，再研究从 10-12 码压缩成固定6码。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const recordsPath = path.join(root, 'data', 'records.json');
  const payload = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  const report = analyzeThreeInThreeStructure(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-structure-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-structure-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-structure-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_STRUCTURE_REPORT__ = ${json};\n`, 'utf8');
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
