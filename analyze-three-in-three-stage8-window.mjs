import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
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
    .sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
}

function displayYear(record) {
  const date = String(record?.date || '');
  return date.length >= 4 ? date.slice(0, 4) : String(record?.year || '');
}

export function buildFiveIssueWindows(rows) {
  const byIssue = new Map();
  for (const row of rows) byIssue.set(Number(row.issue || 0), row);
  const maxIssue = Math.max(0, ...byIssue.keys());
  const windows = [];
  for (let start = 1; start <= maxIssue; start += 5) {
    const draws = [];
    for (let issue = start; issue <= start + 4; issue += 1) {
      if (byIssue.has(issue)) draws.push(byIssue.get(issue));
    }
    if (draws.length === 5) windows.push({start, end: start + 4, draws});
  }
  return windows;
}

function drawHitCount(poolSet, row) {
  return positives(row).filter(num => poolSet.has(num)).length;
}

export function stage8WindowCovered(window, pool) {
  const poolSet = new Set(pool || []);
  return (window?.draws || []).some(row => drawHitCount(poolSet, row) >= 3);
}

function combos(nums, size) {
  const sorted = [...new Set(nums)].sort((a, b) => Number(a) - Number(b));
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

function coverTriplesForWindow(window) {
  const seen = new Set();
  const triples = [];
  for (const row of window.draws || []) {
    for (const triple of combos(positives(row), 3)) {
      const key = triple.join(' ');
      if (!seen.has(key)) {
        seen.add(key);
        triples.push(triple);
      }
    }
  }
  return triples;
}

export function findFullCoverStagePool(windows, poolSize = 8, options = {}) {
  const orderedWindows = [...(windows || [])].sort((a, b) => a.start - b.start);
  const triplesByWindow = orderedWindows.map(win => ({
    window: win,
    triples: coverTriplesForWindow(win),
  }));
  const nodeLimit = Number(options.nodeLimit || 500000);
  let nodes = 0;
  let bestPool = [];
  let bestCovered = 0;
  const memo = new Set();

  function poolKey(pool, index) {
    return `${index}|${[...pool].sort((a, b) => Number(a) - Number(b)).join(',')}`;
  }

  function coveredByPool(pool) {
    const list = [...pool];
    return orderedWindows.filter(win => stage8WindowCovered(win, list)).length;
  }

  function updateBest(pool) {
    const covered = coveredByPool(pool);
    if (covered > bestCovered || (covered === bestCovered && pool.size < bestPool.length)) {
      bestCovered = covered;
      bestPool = [...pool].sort((a, b) => Number(a) - Number(b));
    }
  }

  function nextUncoveredIndex(pool, fromIndex) {
    const list = [...pool];
    for (let idx = fromIndex; idx < orderedWindows.length; idx += 1) {
      if (!stage8WindowCovered(orderedWindows[idx], list)) return idx;
    }
    for (let idx = 0; idx < fromIndex; idx += 1) {
      if (!stage8WindowCovered(orderedWindows[idx], list)) return idx;
    }
    return -1;
  }

  function dfs(pool, fromIndex) {
    nodes += 1;
    if (nodes > nodeLimit) return null;
    if (pool.size > poolSize) return null;
    updateBest(pool);
    const uncoveredIdx = nextUncoveredIndex(pool, fromIndex);
    if (uncoveredIdx < 0) {
      return [...pool].sort((a, b) => Number(a) - Number(b));
    }
    const key = poolKey(pool, uncoveredIdx);
    if (memo.has(key)) return null;
    memo.add(key);

    const triples = triplesByWindow[uncoveredIdx].triples
      .map(triple => {
        const added = triple.filter(num => !pool.has(num));
        return {triple, added};
      })
      .filter(item => pool.size + item.added.length <= poolSize)
      .sort((a, b) => a.added.length - b.added.length || a.triple.join(' ').localeCompare(b.triple.join(' ')));

    for (const item of triples) {
      const next = new Set(pool);
      item.triple.forEach(num => next.add(num));
      const result = dfs(next, uncoveredIdx + 1);
      if (result) return result;
    }
    return null;
  }

  const result = dfs(new Set(), 0);
  const pool = result || bestPool;
  const coveredWindows = coveredCount(orderedWindows, pool);
  return {
    feasible: Boolean(result),
    pool,
    totalWindows: orderedWindows.length,
    coveredWindows,
    hitRate: orderedWindows.length ? Math.round((coveredWindows / orderedWindows.length) * 10000) / 100 : 0,
    missWindows: orderedWindows.filter(win => !stage8WindowCovered(win, pool)).map(win => ({start: win.start, end: win.end})),
    nodes,
    nodeLimit,
  };
}

function candidateScores(windows) {
  const scores = new Map(ALL_NUMS.map(num => [num, 0]));
  for (const win of windows) {
    for (const row of win.draws) {
      for (const num of positives(row)) {
        scores.set(num, (scores.get(num) || 0) + 1);
      }
    }
  }
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
    .map(([num, score]) => ({num, score}));
}

export function bestStagePool(windows, poolSize = 8) {
  const candidates = candidateScores(windows).slice(0, 32).map(item => item.num);
  let bestPool = [];
  while (bestPool.length < poolSize) {
    let bestNum = '';
    let bestCovered = -1;
    let bestStrength = -1;
    for (const num of candidates) {
      if (bestPool.includes(num)) continue;
      const pool = bestPool.concat(num).sort((a, b) => Number(a) - Number(b));
      const covered = coveredCount(windows, pool);
      const strength = hitStrength(windows, pool);
      if (
        covered > bestCovered
        || (covered === bestCovered && strength > bestStrength)
        || (covered === bestCovered && strength === bestStrength && Number(num) < Number(bestNum || 99))
      ) {
        bestNum = num;
        bestCovered = covered;
        bestStrength = strength;
      }
    }
    if (!bestNum) break;
    bestPool.push(bestNum);
  }
  bestPool = bestPool.sort((a, b) => Number(a) - Number(b));
  const bestCovered = coveredCount(windows, bestPool);
  return {
    pool: bestPool,
    totalWindows: windows.length,
    coveredWindows: bestCovered,
    hitRate: windows.length ? Math.round((bestCovered / windows.length) * 10000) / 100 : 0,
    missWindows: windows.filter(win => !stage8WindowCovered(win, bestPool)).map(win => ({start: win.start, end: win.end})),
  };
}

export function exactBestStagePool(windows, poolSize = 8, options = {}) {
  const candidateLimit = Number(options.candidateLimit || 20);
  const candidates = candidateScores(windows).slice(0, candidateLimit).map(item => item.num);
  let bestPool = candidates.slice(0, poolSize).sort((a, b) => Number(a) - Number(b));
  let bestCovered = coveredCount(windows, bestPool);
  let bestStrength = hitStrength(windows, bestPool);

  function maybeUpdate(picked) {
    const pool = picked.slice().sort((a, b) => Number(a) - Number(b));
    const covered = coveredCount(windows, pool);
    const strength = hitStrength(windows, pool);
    if (
      covered > bestCovered
      || (covered === bestCovered && strength > bestStrength)
      || (covered === bestCovered && strength === bestStrength && pool.join(' ') < bestPool.join(' '))
    ) {
      bestPool = pool;
      bestCovered = covered;
      bestStrength = strength;
    }
  }

  function dfs(start, picked) {
    if (picked.length === poolSize) {
      maybeUpdate(picked);
      return;
    }
    if (candidates.length - start < poolSize - picked.length) return;
    for (let idx = start; idx < candidates.length; idx += 1) {
      dfs(idx + 1, picked.concat(candidates[idx]));
    }
  }

  dfs(0, []);
  return {
    pool: bestPool,
    totalWindows: windows.length,
    coveredWindows: bestCovered,
    hitRate: windows.length ? Math.round((bestCovered / windows.length) * 10000) / 100 : 0,
    missWindows: windows.filter(win => !stage8WindowCovered(win, bestPool)).map(win => ({start: win.start, end: win.end})),
    candidateLimit,
    exact: true,
  };
}

function coveredCount(windows, pool) {
  return windows.filter(win => stage8WindowCovered(win, pool)).length;
}

function hitStrength(windows, pool) {
  const set = new Set(pool);
  return windows.reduce((sum, win) => sum + win.draws.reduce((inner, row) => inner + drawHitCount(set, row), 0), 0);
}

export function analyzeStage8Window(records, options = {}) {
  const source = String(options.source || 'am');
  const sourceRows = records.filter(row => String(row?.source || '') === source);
  const years = [...new Set(sourceRows.map(displayYear).filter(Boolean))].sort();
  const outputYears = [];

  for (const year of years) {
    const rows = sortRows(sourceRows.filter(row => displayYear(row) === year));
    const windows = buildFiveIssueWindows(rows);
    const phases = PHASES.map(phase => {
      const segment = windows.filter(win => win.start >= phase.start && win.end <= phase.end);
      const best = bestStagePool(segment, 8);
      return {
        ...phase,
        pool: best.pool,
        totalWindows: best.totalWindows,
        coveredWindows: best.coveredWindows,
        hitRate: best.hitRate,
        fullCovered: best.totalWindows > 0 && best.coveredWindows === best.totalWindows,
        missWindows: best.missWindows,
      };
    });
    outputYears.push({
      year,
      totalWindows: windows.length,
      phases,
      fullCovered: phases.every(phase => phase.totalWindows === 0 || phase.fullCovered),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '阶段8码五期窗口：每个阶段固定8码；每个5期窗口内至少有1期前6正码命中阶段8码>=3，则窗口覆盖。',
    years: outputYears,
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 阶段8码五期窗口扫描',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    '| 年份 | 阶段 | 8码 | 覆盖 | 命中率 | 是否全覆盖 | 漏窗口 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const year of report.years) {
    for (const phase of year.phases) {
      const misses = phase.missWindows.slice(0, 10).map(win => `${win.start}-${win.end}`).join(', ');
      const more = phase.missWindows.length > 10 ? ` 等${phase.missWindows.length}个` : '';
      lines.push(`| ${year.year} | ${phase.id} | ${phase.pool.join(' ')} | ${phase.coveredWindows}/${phase.totalWindows} | ${phase.hitRate}% | ${phase.fullCovered ? '是' : '否'} | ${misses ? `${misses}${more}` : '-'} |`);
    }
  }
  lines.push('');
  lines.push('## 判断');
  lines.push('');
  lines.push('- 如果阶段8码无法稳定覆盖五期窗口，则不进入8压6。');
  lines.push('- 如果某些年份/阶段能全覆盖，再对这些阶段做8压6验证。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzeStage8Window(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-stage8-window-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-stage8-window-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-stage8-window-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_STAGE8_WINDOW_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const year of report.years) {
    const text = year.phases.map(phase => `${phase.id}:${phase.coveredWindows}/${phase.totalWindows} ${phase.hitRate}% ${phase.pool.join(' ')}`).join(' | ');
    console.log(`${year.year}: ${text}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
