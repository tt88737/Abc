import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));

export function positionNumbers(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

function sortRows(rows) {
  return rows
    .filter(row => Number(row?.issue || 0) > 0 && positionNumbers(row).length === 6)
    .sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      return dateCompare || Number(a.issue || 0) - Number(b.issue || 0);
    });
}

export function positionHitCount(pool, record) {
  const set = new Set(pool || []);
  return positionNumbers(record).filter(num => set.has(num)).length;
}

function neighborNums(num) {
  const value = Number(num);
  return [value - 1, value, value + 1]
    .filter(item => item >= 1 && item <= 49)
    .map(item => String(item).padStart(2, '0'));
}

function rankPosition(history, positionIndex, mode = 'hot') {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));
  history.forEach((row, idx) => {
    const num = positionNumbers(row)[positionIndex];
    if (!num) return;
    counts.set(num, (counts.get(num) || 0) + 1);
    lastSeen.set(num, idx);
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

export function buildPositionPool(history, options = {}) {
  const lookback = Number(options.lookback || 10);
  const pickPerPosition = Number(options.pickPerPosition || 1);
  const mode = String(options.mode || 'hot');
  const basis = history.slice(-lookback);
  return Array.from({length: 6}, (_, idx) => {
    let nums = [];
    if (mode === 'last') {
      nums = [positionNumbers(history.at(-1) || [])[idx]].filter(Boolean);
    } else if (mode === 'last-neighbor') {
      nums = neighborNums(positionNumbers(history.at(-1) || [])[idx] || '00');
    } else {
      nums = rankPosition(basis, idx, mode).slice(0, pickPerPosition);
    }
    return {position: idx + 1, nums};
  });
}

function recentGlobalRank(history) {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));
  history.forEach((row, idx) => {
    for (const num of positionNumbers(row)) {
      counts.set(num, (counts.get(num) || 0) + 1);
      lastSeen.set(num, idx);
    }
  });
  return ALL_NUMS.slice().sort((a, b) =>
    (counts.get(b) || 0) - (counts.get(a) || 0)
    || (lastSeen.get(b) || -1) - (lastSeen.get(a) || -1)
    || Number(a) - Number(b));
}

export function mergeToSix(positionPool, history = []) {
  const scores = new Map();
  const addScore = (num, score) => {
    if (!num || num === '00') return;
    scores.set(num, (scores.get(num) || 0) + score);
  };

  for (const item of positionPool) {
    item.nums.forEach((num, idx) => addScore(num, 100 - idx * 5));
  }

  const recentRank = recentGlobalRank(history.slice(-10));
  recentRank.forEach((num, idx) => addScore(num, Math.max(0, 49 - idx)));

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
    .slice(0, 6)
    .map(([num]) => num)
    .sort((a, b) => Number(a) - Number(b));
}

function formulas() {
  return [
    {id: 'pos-hot-5x1', name: '每位置近5期热码取1', minHistory: 5, build: history => mergeToSix(buildPositionPool(history, {lookback: 5, pickPerPosition: 1, mode: 'hot'}), history)},
    {id: 'pos-hot-10x1', name: '每位置近10期热码取1', minHistory: 10, build: history => mergeToSix(buildPositionPool(history, {lookback: 10, pickPerPosition: 1, mode: 'hot'}), history)},
    {id: 'pos-hot-20x1', name: '每位置近20期热码取1', minHistory: 20, build: history => mergeToSix(buildPositionPool(history, {lookback: 20, pickPerPosition: 1, mode: 'hot'}), history)},
    {id: 'pos-last', name: '每位置上期号码', minHistory: 1, build: history => mergeToSix(buildPositionPool(history, {mode: 'last'}), history)},
    {id: 'pos-last-neighbor', name: '每位置上期邻号压6', minHistory: 1, build: history => mergeToSix(buildPositionPool(history, {mode: 'last-neighbor'}), history)},
    {id: 'pos-hot-10x2-compress', name: '每位置近10期热码取2压6', minHistory: 10, build: history => mergeToSix(buildPositionPool(history, {lookback: 10, pickPerPosition: 2, mode: 'hot'}), history)},
    {id: 'pos-hot-20x2-compress', name: '每位置近20期热码取2压6', minHistory: 20, build: history => mergeToSix(buildPositionPool(history, {lookback: 20, pickPerPosition: 2, mode: 'hot'}), history)},
  ];
}

function roundRate(value, total) {
  return total ? Math.round((value / total) * 10000) / 100 : 0;
}

function maxMissStreak(evaluations) {
  let cur = 0;
  let max = 0;
  for (const row of evaluations) {
    if (row.hit) cur = 0;
    else {
      cur += 1;
      max = Math.max(max, cur);
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

function summarize(formula, evaluations) {
  const hits = evaluations.filter(row => row.hit).length;
  const byYear = {};
  for (const year of [...new Set(evaluations.map(row => row.year).filter(Boolean))].sort()) {
    const rows = evaluations.filter(row => row.year === year);
    const yearHits = rows.filter(row => row.hit).length;
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
    windows: {
      3: windowHitRate(evaluations, 3),
      5: windowHitRate(evaluations, 5),
      10: windowHitRate(evaluations, 10),
    },
    byYear,
    latestPool: evaluations.at(-1)?.pool || [],
    latestEvaluations: evaluations.slice(-10),
  };
}

export function analyzePositionModel(records, options = {}) {
  const source = String(options.source || 'am');
  const rows = sortRows(records.filter(row => String(row?.source || '') === source));
  const output = [];

  for (const formula of formulas()) {
    const evaluations = [];
    for (let idx = 0; idx < rows.length; idx += 1) {
      if (idx < formula.minHistory) continue;
      const target = rows[idx];
      const history = rows.slice(0, idx);
      const pool = formula.build(history);
      if (pool.length !== 6) continue;
      const count = positionHitCount(pool, target);
      evaluations.push({
        issue: Number(target.issue || 0),
        date: target.date || '',
        year: String(target.date || '').slice(0, 4),
        pool,
        positives: positionNumbers(target),
        matchCount: count,
        hit: count >= 3,
      });
    }
    output.push(summarize(formula, evaluations));
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '位置独立建模：P1-P6 分别按各自历史序列生成候选，再合并压缩成6码复式；当期前6正码命中>=3算中。',
    totalRecords: rows.length,
    formulas: output.sort((a, b) => b.hitRate - a.hitRate || a.maxMissStreak - b.maxMissStreak || a.id.localeCompare(b.id)),
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 位置独立建模6码复式验证',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `澳门可用记录：${report.totalRecords} 期`,
    '',
    '| 排名 | 公式 | 可评估期数 | 命中 | 命中率 | 最大连挂 | 3期窗口 | 5期窗口 | 10期窗口 | 最新6码 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  report.formulas.forEach((row, idx) => {
    lines.push(`| ${idx + 1} | ${row.name} | ${row.evaluatedDraws} | ${row.hits} | ${row.hitRate}% | ${row.maxMissStreak} | ${row.windows['3'].hitRate}% | ${row.windows['5'].hitRate}% | ${row.windows['10'].hitRate}% | ${row.latestPool.join(' ')} |`);
  });
  lines.push('');
  lines.push('## 最优公式分年表现');
  const best = report.formulas[0];
  if (best) {
    lines.push('');
    lines.push(`最优公式：${best.name}`);
    lines.push('');
    lines.push('| 年份 | 可评估期数 | 命中 | 命中率 | 最大连挂 |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const [year, row] of Object.entries(best.byYear || {})) {
      lines.push(`| ${year} | ${row.evaluatedDraws} | ${row.hits} | ${row.hitRate}% | ${row.maxMissStreak} |`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzePositionModel(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-position-model-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-position-model-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-position-model-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_POSITION_MODEL_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const row of report.formulas) {
    console.log(`${row.name}: ${row.hits}/${row.evaluatedDraws} ${row.hitRate}% maxMiss=${row.maxMissStreak} latest=${row.latestPool.join(' ')}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
