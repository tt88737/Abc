import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
const ROLLING_WINDOWS = [3, 5, 10];
const PHASES = [
  {id: '001-115', start: 1, end: 115},
  {id: '116-230', start: 116, end: 230},
  {id: '231-365', start: 231, end: 365},
];

export function positiveNumbers(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

export function hitCount(pool, record) {
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

export function rankByFrequency(history, mode = 'hot') {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));

  history.forEach((row, idx) => {
    for (const num of positiveNumbers(row)) {
      counts.set(num, (counts.get(num) || 0) + 1);
      lastSeen.set(num, idx);
    }
  });

  return ALL_NUMS.slice().sort((a, b) => {
    const countDiff = (counts.get(b) || 0) - (counts.get(a) || 0);
    if (mode === 'hot') return countDiff || Number(a) - Number(b);
    const coldDiff = (counts.get(a) || 0) - (counts.get(b) || 0);
    if (coldDiff) return coldDiff;
    const missDiff = (lastSeen.get(a) || -1) - (lastSeen.get(b) || -1);
    return missDiff || Number(a) - Number(b);
  });
}

function takeUnique(...lists) {
  const picked = [];
  for (const list of lists) {
    for (const num of list) {
      if (!picked.includes(num)) picked.push(num);
      if (picked.length === 6) return picked.sort((a, b) => Number(a) - Number(b));
    }
  }
  return picked.sort((a, b) => Number(a) - Number(b));
}

function poolForFormula(formula, history, target) {
  if (formula.type === 'hot' || formula.type === 'cold') {
    if (history.length < formula.lookback) return null;
    return rankByFrequency(history.slice(-formula.lookback), formula.type).slice(0, 6).sort((a, b) => Number(a) - Number(b));
  }

  if (formula.type === 'mix') {
    if (history.length < formula.lookback) return null;
    const basis = history.slice(-formula.lookback);
    const hot = rankByFrequency(basis, 'hot');
    const cold = rankByFrequency(basis, 'cold');
    return takeUnique(hot.slice(0, 3), cold.slice(0, 3), hot, cold);
  }

  if (formula.type === 'stage') {
    const issue = Number(target?.issue || 0);
    const phase = PHASES.find(item => issue >= item.start && issue <= item.end);
    if (!phase) return null;
    const basis = history.filter(row => {
      const rowIssue = Number(row?.issue || 0);
      return rowIssue >= phase.start && rowIssue <= phase.end;
    });
    if (basis.length < formula.minBasis) return null;
    return rankByFrequency(basis, 'hot').slice(0, 6).sort((a, b) => Number(a) - Number(b));
  }

  return null;
}

function formulas(minStageBasis) {
  return [
    {id: 'hot-5', name: '近5期热码前6', type: 'hot', lookback: 5},
    {id: 'hot-10', name: '近10期热码前6', type: 'hot', lookback: 10},
    {id: 'hot-20', name: '近20期热码前6', type: 'hot', lookback: 20},
    {id: 'hot-30', name: '近30期热码前6', type: 'hot', lookback: 30},
    {id: 'cold-5', name: '近5期冷码前6', type: 'cold', lookback: 5},
    {id: 'cold-10', name: '近10期冷码前6', type: 'cold', lookback: 10},
    {id: 'cold-20', name: '近20期冷码前6', type: 'cold', lookback: 20},
    {id: 'cold-30', name: '近30期冷码前6', type: 'cold', lookback: 30},
    {id: 'mix-10-3h3c', name: '近10期 3热+3冷', type: 'mix', lookback: 10},
    {id: 'mix-20-3h3c', name: '近20期 3热+3冷', type: 'mix', lookback: 20},
    {id: 'mix-30-3h3c', name: '近30期 3热+3冷', type: 'mix', lookback: 30},
    {id: 'stage-fixed-6-walk-forward', name: '阶段内累计热度6码滚动扫描', type: 'stage', minBasis: minStageBasis},
  ];
}

function maxMissStreak(evaluations) {
  let current = 0;
  let max = 0;
  for (const item of evaluations) {
    if (item.hit) {
      current = 0;
    } else {
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

function roundRate(value, total) {
  return total ? Math.round((value / total) * 10000) / 100 : 0;
}

function summarizeFormula(formula, evaluations, windows) {
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

export function analyzeThreeInThree(records, options = {}) {
  const source = String(options.source || 'am');
  const windows = options.windows || ROLLING_WINDOWS;
  const minStageBasis = Number(options.minStageBasis || 10);
  const rows = sortRows(records.filter(row => String(row?.source || '') === source));
  const result = [];

  for (const formula of formulas(minStageBasis)) {
    const evaluations = [];
    for (let idx = 0; idx < rows.length; idx += 1) {
      const target = rows[idx];
      const history = rows.slice(0, idx);
      const pool = poolForFormula(formula, history, target);
      if (!pool || pool.length !== 6) continue;
      const count = hitCount(pool, target);
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
    result.push(summarizeFormula(formula, evaluations, windows));
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '每期推荐6码；当期前6个正码命中>=3算三中三；特别号忽略；每期只使用开奖前历史数据。',
    totalRecords: rows.length,
    formulas: result.sort((a, b) => b.hitRate - a.hitRate || a.maxMissStreak - b.maxMissStreak || a.id.localeCompare(b.id)),
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 12类公式澳门历史扫描',
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
  lines.push('## 分年表现');
  for (const item of report.formulas) {
    lines.push('');
    lines.push(`### ${item.name}`);
    lines.push('');
    lines.push('| 年份 | 可评估期数 | 命中 | 命中率 | 最大连挂 |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const [year, row] of Object.entries(item.byYear)) {
      lines.push(`| ${year} | ${row.evaluatedDraws} | ${row.hits} | ${row.hitRate}% | ${row.maxMissStreak} |`);
    }
  }

  lines.push('');
  lines.push('## 说明');
  lines.push('');
  lines.push('- 这是规律扫描，不是最终推荐。');
  lines.push('- 阶段内累计热度6码使用 `001-115 / 116-230 / 231-365`，每一期只统计当前阶段内已开奖历史。');
  lines.push('- 冷码公式会把 01-49 中近 N 期出现次数最低的号码排前，次数相同按更久未出、号码更小排序。');
  lines.push('- 窗口命中率表示任意连续 N 期内至少出现一次三中三。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const recordsPath = path.join(root, 'data', 'records.json');
  const payload = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  const report = analyzeThreeInThree(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-pattern-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-pattern-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-pattern-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_PATTERN_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const item of report.formulas.slice(0, 12)) {
    console.log(`${item.name}: ${item.hits}/${item.evaluatedDraws} ${item.hitRate}% maxMiss=${item.maxMissStreak} latest=${item.latestPool.join(' ')}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
