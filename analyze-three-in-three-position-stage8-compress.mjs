import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {analyzePositionStage8} from './analyze-three-in-three-position-stage8.mjs';

const PHASES = [
  {id: '001-115', start: 1, end: 115},
  {id: '116-230', start: 116, end: 230},
  {id: '231-365', start: 231, end: 365},
];

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

function displayYear(record) {
  const date = String(record?.date || '');
  return date.length >= 4 ? date.slice(0, 4) : String(record?.year || '');
}

export function stage8CompressHitCount(pool, record) {
  const set = new Set(pool || []);
  return positives(record).filter(num => set.has(num)).length;
}

function recentFrequency(history) {
  const scores = new Map();
  history.slice(-30).forEach((row, idx) => {
    const weight = idx + 1;
    for (const num of positives(row)) scores.set(num, (scores.get(num) || 0) + weight);
  });
  return scores;
}

export function compressPositionStagePools(positionPools, history = [], mode = 'position-overlap') {
  const scores = new Map();
  const add = (num, score) => scores.set(num, (scores.get(num) || 0) + score);
  const freq = recentFrequency(history);

  positionPools.forEach((pool, posIdx) => {
    pool.forEach((num, idx) => {
      if (mode === 'position-overlap') add(num, 100);
      else if (mode === 'recent-contribution') add(num, (freq.get(num) || 0) + 20);
      else if (mode === 'position-balanced') add(num, 80 - idx + (posIdx + 1));
      else add(num, 50);
    });
  });

  for (const [num, score] of freq.entries()) {
    if (scores.has(num)) scores.set(num, scores.get(num) + score);
  }

  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
    .slice(0, 6)
    .map(([num]) => num)
    .sort((a, b) => Number(a) - Number(b));
}

function ruleDefs() {
  return [
    {id: 'position-overlap', name: '位置8码重叠优先'},
    {id: 'recent-contribution', name: '近期贡献优先'},
    {id: 'position-balanced', name: '位置覆盖均衡'},
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
    if (evaluations.slice(idx, idx + size).some(row => row.hit)) hitWindows += 1;
  }
  const windows = evaluations.length - size + 1;
  return {windows, hitWindows, hitRate: roundRate(hitWindows, windows)};
}

function summarize(rule, evaluations) {
  const hits = evaluations.filter(row => row.hit).length;
  const byYear = {};
  for (const year of [...new Set(evaluations.map(row => row.year))].sort()) {
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
    id: rule.id,
    name: rule.name,
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

export function analyzePositionStage8Compress(records, options = {}) {
  const source = String(options.source || 'am');
  const rows = sortRows(records.filter(row => String(row?.source || '') === source));
  const stage8 = analyzePositionStage8(records, {source});
  const rules = [];

  for (const rule of ruleDefs()) {
    const evaluations = [];
    for (const row of rows) {
      const issue = Number(row.issue || 0);
      const year = displayYear(row);
      const phaseDef = PHASES.find(phase => issue >= phase.start && issue <= phase.end);
      if (!phaseDef) continue;
      const yearPlan = stage8.years.find(item => item.year === year);
      const phasePlan = yearPlan?.phases.find(item => item.id === phaseDef.id);
      if (!phasePlan || phasePlan.positions.some(pos => !pos.pool?.length)) continue;
      const positionPools = phasePlan.positions.map(pos => pos.pool);
      const history = rows.filter(item => displayYear(item) === year && Number(item.issue || 0) < issue);
      const pool = compressPositionStagePools(positionPools, history, rule.id);
      const matchCount = stage8CompressHitCount(pool, row);
      evaluations.push({
        issue,
        date: row.date || '',
        year,
        phase: phaseDef.id,
        pool,
        positives: positives(row),
        matchCount,
        hit: matchCount >= 3,
      });
    }
    rules.push(summarize(rule, evaluations));
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '基于P1-P6位置阶段8码，合并压缩成固定6码复式；当期前6正码命中>=3算三中三。',
    rules: rules.sort((a, b) => b.hitRate - a.hitRate || a.maxMissStreak - b.maxMissStreak || a.id.localeCompare(b.id)),
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 位置阶段8码压缩6码验证',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    '| 排名 | 压缩规则 | 可评估期数 | 命中 | 命中率 | 最大连挂 | 3期窗口 | 5期窗口 | 10期窗口 | 最新6码 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  report.rules.forEach((row, idx) => {
    lines.push(`| ${idx + 1} | ${row.name} | ${row.evaluatedDraws} | ${row.hits} | ${row.hitRate}% | ${row.maxMissStreak} | ${row.windows['3'].hitRate}% | ${row.windows['5'].hitRate}% | ${row.windows['10'].hitRate}% | ${row.latestPool.join(' ')} |`);
  });
  lines.push('');
  lines.push('## 最优规则分年表现');
  const best = report.rules[0];
  if (best) {
    lines.push('');
    lines.push(`最优规则：${best.name}`);
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
  const report = analyzePositionStage8Compress(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-position-stage8-compress-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-position-stage8-compress-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-position-stage8-compress-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_POSITION_STAGE8_COMPRESS_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const row of report.rules) {
    console.log(`${row.name}: ${row.hits}/${row.evaluatedDraws} ${row.hitRate}% maxMiss=${row.maxMissStreak} latest=${row.latestPool.join(' ')}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
