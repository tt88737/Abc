import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
const PHASES = [
  {id: '001-115', start: 1, end: 115},
  {id: '116-230', start: 116, end: 230},
  {id: '231-365', start: 231, end: 365},
];

function positiveAt(record, positionIndex) {
  const ball = (record?.balls || [])[positionIndex] || {};
  const num = String(Number(ball.numberText || ball.number || 0)).padStart(2, '0');
  return num === '00' ? '' : num;
}

function sortRows(rows) {
  return rows
    .filter(row => Number(row?.issue || 0) > 0 && (row?.balls || []).length >= 6)
    .sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
}

function displayYear(record) {
  const date = String(record?.date || '');
  return date.length >= 4 ? date.slice(0, 4) : String(record?.year || '');
}

function sourceName(source) {
  if (source === 'am') return '\u6fb3\u95e8';
  if (source === 'hk') return '\u9999\u6e2f';
  return source;
}

export function buildPositionWindows(rows, positionIndex) {
  const byIssue = new Map();
  for (const row of rows) byIssue.set(Number(row.issue || 0), row);
  const maxIssue = Math.max(0, ...byIssue.keys());
  const windows = [];

  for (let start = 1; start <= maxIssue; start += 5) {
    const nums = [];
    const draws = [];
    for (let issue = start; issue <= start + 4; issue += 1) {
      if (!byIssue.has(issue)) continue;
      const row = byIssue.get(issue);
      const num = positiveAt(row, positionIndex);
      if (!num) continue;
      draws.push({issue, num});
      nums.push(num);
    }
    if (draws.length === 5) {
      windows.push({
        start,
        end: start + 4,
        position: positionIndex + 1,
        draws,
        nums: [...new Set(nums)].sort((a, b) => Number(a) - Number(b)),
      });
    }
  }

  return windows;
}

export function positionWindowCovered(window, pool) {
  const poolSet = new Set(pool || []);
  return (window?.draws || []).some(draw => poolSet.has(draw.num));
}

function bitCount(mask) {
  let count = 0;
  let value = mask;
  while (value > 0n) {
    value &= value - 1n;
    count += 1;
  }
  return count;
}

function numberMasks(windows) {
  const masks = new Map(ALL_NUMS.map(num => [num, 0n]));
  windows.forEach((win, idx) => {
    const bit = 1n << BigInt(idx);
    for (const num of win.nums) {
      masks.set(num, (masks.get(num) || 0n) | bit);
    }
  });
  return masks;
}

export function bestPositionStagePool(windows, poolSize = 8) {
  const totalMask = windows.length ? (1n << BigInt(windows.length)) - 1n : 0n;
  const masks = numberMasks(windows);
  const candidates = ALL_NUMS
    .map(num => ({num, mask: masks.get(num) || 0n, cover: bitCount(masks.get(num) || 0n)}))
    .filter(item => item.cover > 0)
    .sort((a, b) => b.cover - a.cover || Number(a.num) - Number(b.num));

  let bestPool = candidates.slice(0, poolSize).map(item => item.num).sort((a, b) => Number(a) - Number(b));
  let bestCoveredMask = bestPool.reduce((mask, num) => mask | (masks.get(num) || 0n), 0n);
  let bestCovered = bitCount(bestCoveredMask);
  const memo = new Set();

  function maybeUpdate(pool, coveredMask) {
    const covered = bitCount(coveredMask);
    const sorted = pool.slice().sort((a, b) => Number(a) - Number(b));
    if (
      covered > bestCovered
      || (covered === bestCovered && sorted.length < bestPool.length)
      || (covered === bestCovered && sorted.length === bestPool.length && sorted.join(' ') < bestPool.join(' '))
    ) {
      bestPool = sorted;
      bestCovered = covered;
      bestCoveredMask = coveredMask;
    }
  }

  function firstUncovered(coveredMask) {
    for (let idx = 0; idx < windows.length; idx += 1) {
      const bit = 1n << BigInt(idx);
      if ((coveredMask & bit) === 0n) return idx;
    }
    return -1;
  }

  function dfs(pool, coveredMask) {
    maybeUpdate(pool, coveredMask);
    if (coveredMask === totalMask) return pool.slice().sort((a, b) => Number(a) - Number(b));
    if (pool.length >= poolSize) return null;
    const uncoveredIdx = firstUncovered(coveredMask);
    if (uncoveredIdx < 0) return pool.slice().sort((a, b) => Number(a) - Number(b));
    const key = `${pool.length}|${coveredMask.toString()}`;
    if (memo.has(key)) return null;
    memo.add(key);

    const nums = windows[uncoveredIdx].nums
      .filter(num => !pool.includes(num))
      .map(num => ({num, gain: bitCount((masks.get(num) || 0n) & ~coveredMask)}))
      .sort((a, b) => b.gain - a.gain || Number(a.num) - Number(b.num));

    for (const item of nums) {
      const nextMask = coveredMask | (masks.get(item.num) || 0n);
      const result = dfs(pool.concat(item.num), nextMask);
      if (result) return result;
    }
    return null;
  }

  const fullPool = dfs([], 0n);
  const pool = (fullPool || bestPool).slice().sort((a, b) => Number(a) - Number(b));
  const paddedPool = padPoolToSize(pool, candidates.map(item => item.num), poolSize);
  const coveredMask = paddedPool.reduce((mask, num) => mask | (masks.get(num) || 0n), 0n);
  const coveredWindows = bitCount(coveredMask);

  return {
    pool: paddedPool,
    totalWindows: windows.length,
    coveredWindows,
    hitRate: windows.length ? Math.round((coveredWindows / windows.length) * 10000) / 100 : 0,
    fullCovered: windows.length > 0 && coveredWindows === windows.length && paddedPool.length === poolSize,
    missWindows: windows
      .filter((_, idx) => (coveredMask & (1n << BigInt(idx))) === 0n)
      .map(win => ({start: win.start, end: win.end, nums: win.nums})),
  };
}

function padPoolToSize(pool, rankedNums, poolSize) {
  const out = pool.slice();
  for (const num of rankedNums.concat(ALL_NUMS)) {
    if (!out.includes(num)) out.push(num);
    if (out.length >= poolSize) break;
  }
  return out.slice(0, poolSize).sort((a, b) => Number(a) - Number(b));
}

export function analyzePositionStage8(records, options = {}) {
  const source = String(options.source || 'am');
  const sourceRows = records.filter(row => String(row?.source || '') === source);
  const years = [...new Set(sourceRows.map(displayYear).filter(Boolean))].sort();
  const outputYears = [];

  for (const year of years) {
    const rows = sortRows(sourceRows.filter(row => displayYear(row) === year));
    const phases = PHASES.map(phase => {
      const phaseRows = rows.filter(row => Number(row.issue || 0) >= phase.start && Number(row.issue || 0) <= phase.end);
      const positions = Array.from({length: 6}, (_, idx) => {
        const windows = buildPositionWindows(phaseRows, idx);
        const best = bestPositionStagePool(windows, 8);
        return {
          position: idx + 1,
          pool: best.pool,
          totalWindows: best.totalWindows,
          coveredWindows: best.coveredWindows,
          hitRate: best.hitRate,
          fullCovered: best.fullCovered,
          missWindows: best.missWindows,
        };
      });
      return {
        ...phase,
        positions,
        fullCovered: positions.every(pos => pos.totalWindows === 0 || pos.fullCovered),
      };
    });
    outputYears.push({
      year,
      phases,
      fullCovered: phases.every(phase => phase.fullCovered),
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: sourceName(source),
    rule: 'Position fixed 8: P1-P6 each uses its own stage pool; a 5-issue window is covered when that position opens at least one number from its pool.',
    years: outputYears,
  };
}

export function analyzeAllPositionStage8(records, sources = ['am', 'hk']) {
  return {
    generatedAt: new Date().toISOString(),
    sources: sources.map(source => analyzePositionStage8(records, {source})),
  };
}

function markdownReport(report) {
  const reports = Array.isArray(report.sources) ? report.sources : [report];
  const lines = [
    '# Position Fixed 8 Window Validation',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '| Source | Year | Phase | Position | Pool | Coverage | Full | Miss Windows |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];

  for (const sourceReport of reports) {
    for (const year of sourceReport.years || []) {
      for (const phase of year.phases || []) {
        for (const pos of phase.positions || []) {
          const misses = pos.missWindows.slice(0, 8).map(win => `${win.start}-${win.end}`).join(', ');
          const more = pos.missWindows.length > 8 ? ` and ${pos.missWindows.length - 8} more` : '';
          lines.push(`| ${sourceReport.sourceName || sourceReport.source} | ${year.year} | ${phase.id} | P${pos.position} | ${pos.pool.join(' ')} | ${pos.coveredWindows}/${pos.totalWindows} ${pos.hitRate}% | ${pos.fullCovered ? 'yes' : 'no'} | ${misses ? `${misses}${more}` : '-'} |`);
        }
      }
    }
  }

  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- Each source is calculated independently.');
  lines.push('- P1-P6 each has its own fixed 8-number pool per phase.');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzeAllPositionStage8(payload.records || []);
  const jsonPath = path.join(root, 'data', 'positive-position-stage8-report.json');
  const jsPath = path.join(root, 'data', 'positive-position-stage8-report.js');
  const mdPath = path.join(root, 'docs', 'positive-position-stage8-report.md');
  const json = JSON.stringify(report, null, 2);

  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__POSITIVE_POSITION_STAGE8_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);

  for (const sourceReport of report.sources) {
    for (const year of sourceReport.years) {
      for (const phase of year.phases) {
        const text = phase.positions.map(pos => `P${pos.position}:${pos.fullCovered ? 'OK' : `${pos.coveredWindows}/${pos.totalWindows}`}`).join(' ');
        console.log(`${sourceReport.source} ${year.year} ${phase.id}: ${phase.fullCovered ? 'ALL_OK' : 'MISS'} ${text}`);
      }
    }
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
