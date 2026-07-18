import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
const WINDOWS = [3, 5, 10];
const PHASES = [
  {id: '001-115', start: 1, end: 115},
  {id: '116-230', start: 116, end: 230},
  {id: '231-365', start: 231, end: 365},
];

function positiveNumbers(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

export function combos(nums, size) {
  const sorted = [...nums].sort((a, b) => Number(a) - Number(b));
  const out = [];
  function walk(start, picked) {
    if (picked.length === size) {
      out.push(picked.slice());
      return;
    }
    for (let idx = start; idx <= sorted.length - (size - picked.length); idx += 1) {
      picked.push(sorted[idx]);
      walk(idx + 1, picked);
      picked.pop();
    }
  }
  walk(0, []);
  return out;
}

export function cooccurrenceHitCount(pool, record) {
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

function rankFrequency(history) {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));
  history.forEach((row, idx) => {
    for (const num of positiveNumbers(row)) {
      counts.set(num, (counts.get(num) || 0) + 1);
      lastSeen.set(num, idx);
    }
  });
  return ALL_NUMS.slice().sort((a, b) =>
    (counts.get(b) || 0) - (counts.get(a) || 0)
    || (lastSeen.get(b) || -1) - (lastSeen.get(a) || -1)
    || Number(a) - Number(b));
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

function rankedComboKeys(history, size) {
  const scores = new Map();
  const lastSeen = new Map();
  history.forEach((row, idx) => {
    for (const combo of combos(positiveNumbers(row), size)) {
      const key = combo.join('-');
      scores.set(key, (scores.get(key) || 0) + 1);
      lastSeen.set(key, idx);
    }
  });
  return [...scores.entries()].sort((a, b) =>
    b[1] - a[1]
    || (lastSeen.get(b[0]) || -1) - (lastSeen.get(a[0]) || -1)
    || a[0].localeCompare(b[0]));
}

export function buildTriplePool(history, poolSize = 6) {
  const ranked = rankedComboKeys(history, 3);
  const groups = ranked.map(([key]) => key.split('-'));
  return takeUnique(poolSize, ...groups, rankFrequency(history));
}

export function buildPairNetworkPool(history, poolSize = 6) {
  const pairScores = rankedComboKeys(history, 2);
  const numberScores = new Map(ALL_NUMS.map(num => [num, 0]));
  pairScores.forEach(([key, count], idx) => {
    const recentWeight = pairScores.length - idx;
    for (const num of key.split('-')) {
      numberScores.set(num, (numberScores.get(num) || 0) + count * 100 + recentWeight);
    }
  });
  const ranked = [...numberScores.entries()]
    .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
    .map(([num]) => num);
  return takeUnique(poolSize, ranked, rankFrequency(history));
}

function buildRecentCarryPool(history, poolSize = 6) {
  const last = positiveNumbers(history.at(-1) || {});
  const pairPool = buildPairNetworkPool(history, poolSize);
  return takeUnique(poolSize, last, pairPool, rankFrequency(history));
}

function buildStageNetworkPool(history, target, poolSize = 6) {
  const issue = Number(target?.issue || 0);
  const phase = PHASES.find(item => issue >= item.start && issue <= item.end);
  if (!phase) return [];
  const basis = history.filter(row => {
    const rowIssue = Number(row?.issue || 0);
    return rowIssue >= phase.start && rowIssue <= phase.end;
  });
  if (basis.length < 10) return [];
  return buildPairNetworkPool(basis, poolSize);
}

function formulas() {
  return [
    {id: 'triple-10', name: '近10期高频三码组反推6码', minHistory: 10, build: history => buildTriplePool(history.slice(-10), 6)},
    {id: 'triple-20', name: '近20期高频三码组反推6码', minHistory: 20, build: history => buildTriplePool(history.slice(-20), 6)},
    {id: 'triple-30', name: '近30期高频三码组反推6码', minHistory: 30, build: history => buildTriplePool(history.slice(-30), 6)},
    {id: 'pair-10', name: '近10期对子共现网络6码', minHistory: 10, build: history => buildPairNetworkPool(history.slice(-10), 6)},
    {id: 'pair-20', name: '近20期对子共现网络6码', minHistory: 20, build: history => buildPairNetworkPool(history.slice(-20), 6)},
    {id: 'pair-30', name: '近30期对子共现网络6码', minHistory: 30, build: history => buildPairNetworkPool(history.slice(-30), 6)},
    {id: 'carry-pair-10', name: '上期延续+近10期对子网络6码', minHistory: 10, build: history => buildRecentCarryPool(history.slice(-10), 6)},
    {id: 'stage-pair-network', name: '阶段内对子共现网络6码', minHistory: 10, build: (history, target) => buildStageNetworkPool(history, target, 6)},
  ];
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
    poolSize: 6,
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

export function analyzeThreeInThreeCooccurrence(records, options = {}) {
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
      const pool = formula.build(history, target);
      if (pool.length !== 6) continue;
      const count = cooccurrenceHitCount(pool, target);
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
    rule: '用开奖前历史统计三码组/对子共现，反推6码复式；当期前6正码命中>=3算三中三；特别号忽略。',
    totalRecords: rows.length,
    formulas: summaries.sort((a, b) => b.hitRate - a.hitRate || a.maxMissStreak - b.maxMissStreak || a.id.localeCompare(b.id)),
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 6码复式共现组合扫描',
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
  lines.push('- 这是6码复式规律扫描，不使用12码观察池。');
  lines.push('- 三码组公式先统计历史正码中高频三数组合，再合并成6码。');
  lines.push('- 对子网络公式统计两个号码同时出现的强度，再选网络权重最高的6码。');
  lines.push('- 所有公式只使用目标期开奖前的数据。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const recordsPath = path.join(root, 'data', 'records.json');
  const payload = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  const report = analyzeThreeInThreeCooccurrence(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-cooccurrence-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-cooccurrence-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-cooccurrence-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_COOCCURRENCE_REPORT__ = ${json};\n`, 'utf8');
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
