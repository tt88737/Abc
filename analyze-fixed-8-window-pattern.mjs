import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));
const DEFAULT_POOL_SIZE = 8;
const MODES = ['fixed-block', 'rolling-contiguous'];
const PRESET_THREE_PHASES = [
  {start: 1, end: 115},
  {start: 116, end: 230},
  {start: 231, end: 365},
];

export function specialNumber(record) {
  const balls = record?.balls || [];
  const ball = balls[6] || {};
  const raw = ball.numberText || ball.number || '';
  return String(Number(raw || 0)).padStart(2, '0');
}

function displayYear(record) {
  const date = String(record?.date || '');
  return date.length >= 4 ? date.slice(0, 4) : String(record?.year || '');
}

function latestIssue(rows) {
  return Math.max(0, ...rows.map(row => Number(row?.issue || 0)));
}

function sourceRowsFor(records, source) {
  return records.filter(record => String(record?.source || '') === source);
}

function rowsForYear(records, source, year) {
  return sourceRowsFor(records, source).filter(record => displayYear(record) === String(year));
}

export function buildWindows(rows, mode) {
  const byIssue = new Map();
  for (const row of rows) {
    const issue = Number(row?.issue || 0);
    if (issue > 0) byIssue.set(issue, row);
  }
  const maxIssue = Math.max(0, ...byIssue.keys());
  const windows = [];
  const starts = mode === 'rolling-contiguous'
    ? Array.from({length: Math.max(0, maxIssue - 4)}, (_, idx) => idx + 1)
    : Array.from({length: Math.ceil(maxIssue / 5)}, (_, idx) => idx * 5 + 1);

  for (const start of starts) {
    const chunk = [];
    for (let issue = start; issue <= start + 4; issue += 1) {
      if (byIssue.has(issue)) chunk.push(byIssue.get(issue));
    }
    if (chunk.length < 5) continue;
    const nums = [...new Set(chunk.map(specialNumber).filter(num => num !== '00'))]
      .sort((a, b) => Number(a) - Number(b));
    windows.push({start, end: start + 4, nums});
  }
  return windows;
}

function masksByNumber(windows) {
  const masks = new Map(ALL_NUMS.map(num => [num, 0n]));
  windows.forEach((win, idx) => {
    const bit = 1n << BigInt(idx);
    for (const num of win.nums) {
      if (masks.has(num)) masks.set(num, masks.get(num) | bit);
    }
  });
  return masks;
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

export function bestFixedPool(windows, poolSize = DEFAULT_POOL_SIZE) {
  if (!windows.length) return {pool: [], covered: 0};
  const masks = masksByNumber(windows);
  const candidates = ALL_NUMS
    .map(num => ({num, mask: masks.get(num), coverage: bitCount(masks.get(num))}))
    .filter(item => item.coverage > 0)
    .sort((a, b) => b.coverage - a.coverage || Number(a.num) - Number(b.num));
  const suffixUnion = Array(candidates.length + 1).fill(0n);
  for (let idx = candidates.length - 1; idx >= 0; idx -= 1) {
    suffixUnion[idx] = suffixUnion[idx + 1] | candidates[idx].mask;
  }

  let bestPool = [];
  let bestCovered = -1;

  function coveredMaskForPool(pool) {
    return pool.reduce((mask, num) => mask | (masks.get(num) || 0n), 0n);
  }

  function poolRecentScore(coveredMask) {
    return windows.reduce((score, _win, idx) => {
      const bit = 1n << BigInt(idx);
      return score + ((coveredMask & bit) ? idx + 1 : 0);
    }, 0);
  }

  function poolHitStrength(pool) {
    const poolSet = new Set(pool);
    return windows.reduce((score, win, idx) => {
      const hits = win.nums.filter(num => poolSet.has(num)).length;
      return score + hits * (idx + 1);
    }, 0);
  }

  function poolSpreadScore(pool) {
    const zones = new Set(pool.map(num => Math.floor((Number(num) - 1) / 10)));
    const tails = new Set(pool.map(num => Number(num) % 10));
    return zones.size * 10 + tails.size;
  }

  function tieScore(pool) {
    const coveredMask = coveredMaskForPool(pool);
    return [
      poolRecentScore(coveredMask),
      poolHitStrength(pool),
      poolSpreadScore(pool),
    ];
  }

  function better(pool, covered) {
    if (covered !== bestCovered) return covered > bestCovered;
    const currentScore = tieScore(pool);
    const bestScore = tieScore(bestPool);
    for (let idx = 0; idx < currentScore.length; idx += 1) {
      if (currentScore[idx] !== bestScore[idx]) return currentScore[idx] > bestScore[idx];
    }
    const current = pool.map(Number).sort((a, b) => a - b);
    const best = bestPool.map(Number).sort((a, b) => a - b);
    if (!best.length) return true;
    for (let idx = 0; idx < Math.min(current.length, best.length); idx += 1) {
      if (current[idx] !== best[idx]) return current[idx] < best[idx];
    }
    return current.length < best.length;
  }

  function optimisticBound(start, coveredMask, slots) {
    const gains = [];
    for (let idx = start; idx < candidates.length; idx += 1) {
      gains.push(bitCount(candidates[idx].mask & ~coveredMask));
    }
    gains.sort((a, b) => b - a);
    return bitCount(coveredMask) + gains.slice(0, slots).reduce((sum, gain) => sum + gain, 0);
  }

  function dfs(start, chosen, coveredMask) {
    const covered = bitCount(coveredMask);
    if (covered === windows.length) {
      if (better(chosen, covered)) {
        bestPool = chosen.slice().sort((a, b) => Number(a) - Number(b));
        bestCovered = covered;
      }
      return;
    }
    if (chosen.length === poolSize || start >= candidates.length) {
      if (better(chosen, covered)) {
        bestPool = chosen.slice().sort((a, b) => Number(a) - Number(b));
        bestCovered = covered;
      }
      return;
    }
    const slots = poolSize - chosen.length;
    if (bitCount(coveredMask | suffixUnion[start]) < bestCovered) return;
    if (optimisticBound(start, coveredMask, slots) < bestCovered) return;

    const next = [];
    for (let idx = start; idx < candidates.length; idx += 1) {
      const gain = bitCount(candidates[idx].mask & ~coveredMask);
      next.push({idx, gain, num: candidates[idx].num});
    }
    next.sort((a, b) => b.gain - a.gain || Number(a.num) - Number(b.num));

    for (const item of next) {
      if (item.idx < start) continue;
      const candidate = candidates[item.idx];
      dfs(item.idx + 1, chosen.concat(candidate.num), coveredMask | candidate.mask);
    }
  }

  dfs(0, [], 0n);
  return {pool: bestPool.slice(0, poolSize), covered: Math.max(0, bestCovered)};
}

function greedyPool(windows, poolSize = DEFAULT_POOL_SIZE) {
  const uncovered = new Set(windows.map((_, idx) => idx));
  const pool = [];
  while (uncovered.size > 0 && pool.length < poolSize) {
    let bestNum = '';
    let bestGain = 0;
    for (const num of ALL_NUMS) {
      if (pool.includes(num)) continue;
      let gain = 0;
      for (const idx of uncovered) {
        if (windows[idx].nums.includes(num)) gain += 1;
      }
      if (gain > bestGain || (gain === bestGain && gain > 0 && Number(num) < Number(bestNum || 99))) {
        bestNum = num;
        bestGain = gain;
      }
    }
    if (!bestNum || bestGain <= 0) break;
    pool.push(bestNum);
    for (const idx of [...uncovered]) {
      if (windows[idx].nums.includes(bestNum)) uncovered.delete(idx);
    }
  }
  return {
    pool: pool.sort((a, b) => Number(a) - Number(b)),
    covered: windows.length - uncovered.size,
  };
}

export function buildPhasePlan(windows, options = {}) {
  const poolSize = Number(options.poolSize || DEFAULT_POOL_SIZE);
  const phases = [];
  let index = 0;

  while (index < windows.length) {
    let bestEnd = index;
    let bestPool = [];
    for (let end = index; end < windows.length; end += 1) {
      const segment = windows.slice(index, end + 1);
      const best = greedyPool(segment, poolSize);
      if (best.covered === segment.length) {
        bestEnd = end;
        bestPool = best.pool;
        continue;
      }
      break;
    }

    const segment = windows.slice(index, bestEnd + 1);
    const poolSet = new Set(bestPool);
    phases.push({
      start: segment[0].start,
      end: segment[segment.length - 1].end,
      windowCount: segment.length,
      pool: bestPool,
      coveredWindows: segment.filter(win => win.nums.some(num => poolSet.has(num))).length,
    });
    index = bestEnd + 1;
  }

  return {
    phaseCount: phases.length,
    fullCovered: phases.every(phase => phase.coveredWindows === phase.windowCount),
    phases,
  };
}

export function buildPresetPhasePlan(windows, options = {}) {
  const poolSize = Number(options.poolSize || DEFAULT_POOL_SIZE);
  const phases = options.phases || PRESET_THREE_PHASES;
  const planned = phases.map(phase => {
    const segment = windows.filter(win => win.start >= phase.start && win.end <= phase.end);
    const best = bestFixedPool(segment, poolSize);
    const poolSet = new Set(best.pool);
    const coveredWindows = segment.filter(win => win.nums.some(num => poolSet.has(num))).length;
    const missWindows = segment
      .filter(win => !win.nums.some(num => poolSet.has(num)))
      .map(win => ({start: win.start, end: win.end, nums: win.nums}));
    return {
      start: phase.start,
      end: phase.end,
      windowCount: segment.length,
      pool: best.pool,
      coveredWindows,
      missCount: missWindows.length,
      fullCovered: missWindows.length === 0,
      missWindows,
    };
  });
  return {
    phaseCount: planned.length,
    fullCovered: planned.every(phase => phase.fullCovered),
    phases: planned,
  };
}

export function buildWalkForwardPlan(windows, options = {}) {
  const poolSize = Number(options.poolSize || DEFAULT_POOL_SIZE);
  const phases = options.phases || PRESET_THREE_PHASES;
  const evaluations = [];

  for (const phase of phases) {
    const segment = windows
      .filter(win => win.start >= phase.start && win.end <= phase.end)
      .sort((a, b) => a.start - b.start);
    for (let idx = 1; idx < segment.length; idx += 1) {
      const basis = segment.slice(0, idx);
      const target = segment[idx];
      const best = greedyPool(basis, poolSize);
      const hits = target.nums.filter(num => best.pool.includes(num));
      evaluations.push({
        phaseStart: phase.start,
        phaseEnd: phase.end,
        start: target.start,
        end: target.end,
        basisStart: basis[0].start,
        basisEnd: basis[basis.length - 1].end,
        basisWindowCount: basis.length,
        pool: best.pool,
        hits,
        covered: hits.length > 0,
      });
    }
  }

  const coveredWindows = evaluations.filter(item => item.covered).length;
  return {
    totalWindows: evaluations.length,
    coveredWindows,
    missCount: evaluations.length - coveredWindows,
    hitRate: evaluations.length ? Math.round((coveredWindows / evaluations.length) * 10000) / 100 : 0,
    evaluations,
  };
}

export function buildCrossYearStagePool(records, options) {
  const source = String(options.source || '');
  const year = String(options.year || '');
  const targetWindowStart = Number(options.targetWindowStart || 0);
  const poolSize = Number(options.poolSize || DEFAULT_POOL_SIZE);
  const phase = options.phase || PRESET_THREE_PHASES.find(item => item.start <= targetWindowStart && item.end >= targetWindowStart) || PRESET_THREE_PHASES[0];
  const scores = new Map(ALL_NUMS.map(num => [num, 0]));
  const historyYears = [...new Set(sourceRowsFor(records, source).map(displayYear).filter(Boolean))]
    .filter(item => item < year)
    .sort();

  let historyYearCount = 0;
  const poolFn = options.fast ? greedyPool : bestFixedPool;
  for (const historyYear of historyYears) {
    const yearWindows = buildWindows(rowsForYear(records, source, historyYear), 'fixed-block')
      .filter(win => win.start >= phase.start && win.end <= phase.end);
    if (!yearWindows.length) continue;
    historyYearCount += 1;
    const phasePool = poolFn(yearWindows, poolSize).pool;
    for (const num of phasePool) scores.set(num, scores.get(num) + 20);
    for (const win of yearWindows) {
      for (const num of win.nums) scores.set(num, scores.get(num) + 1);
    }
  }

  const currentWindows = buildWindows(rowsForYear(records, source, year), 'fixed-block')
    .filter(win => win.start >= phase.start && win.end < targetWindowStart);
  const currentPool = poolFn(currentWindows, poolSize).pool;
  for (const num of currentPool) scores.set(num, scores.get(num) + 30);
  for (const win of currentWindows) {
    for (const num of win.nums) scores.set(num, scores.get(num) + 2);
  }

  const pool = [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
    .slice(0, poolSize)
    .map(([num]) => num)
    .sort((a, b) => Number(a) - Number(b));

  return {
    phase: {start: phase.start, end: phase.end},
    pool,
    basis: {
      historyYearCount,
      currentWindowCount: currentWindows.length,
      currentBasisStart: currentWindows[0]?.start || null,
      currentBasisEnd: currentWindows.at(-1)?.end || null,
    },
  };
}

export function buildCrossYearWalkForwardPlan(records, options) {
  const source = String(options.source || '');
  const year = String(options.year || '');
  const poolSize = Number(options.poolSize || DEFAULT_POOL_SIZE);
  const phases = options.phases || PRESET_THREE_PHASES;
  const yearWindows = buildWindows(rowsForYear(records, source, year), 'fixed-block');
  const evaluations = [];

  for (const phase of phases) {
    const segment = yearWindows
      .filter(win => win.start >= phase.start && win.end <= phase.end)
      .sort((a, b) => a.start - b.start);
    for (let idx = 1; idx < segment.length; idx += 1) {
      const target = segment[idx];
      const built = buildCrossYearStagePool(records, {
        source,
        year,
        targetWindowStart: target.start,
        poolSize,
        phase,
        fast: true,
      });
      const hits = target.nums.filter(num => built.pool.includes(num));
      evaluations.push({
        phaseStart: phase.start,
        phaseEnd: phase.end,
        start: target.start,
        end: target.end,
        pool: built.pool,
        basis: built.basis,
        hits,
        covered: hits.length > 0,
      });
    }
  }

  const coveredWindows = evaluations.filter(item => item.covered).length;
  return {
    totalWindows: evaluations.length,
    coveredWindows,
    missCount: evaluations.length - coveredWindows,
    hitRate: evaluations.length ? Math.round((coveredWindows / evaluations.length) * 10000) / 100 : 0,
    evaluations,
  };
}

function poolForWindowStart(phasePlan, windowStart, fallbackPool) {
  const phase = (phasePlan?.phases || []).find(item => item.start <= windowStart && item.end >= windowStart);
  if (phase?.pool?.length) return phase.pool;
  const previous = (phasePlan?.phases || []).filter(item => item.start <= windowStart).at(-1);
  if (previous?.pool?.length) return previous.pool;
  return fallbackPool || [];
}

function currentWindowBasisPool(windows, windowStart, phases, fallbackPool, poolSize) {
  const phase = (phases || PRESET_THREE_PHASES).find(item => item.start <= windowStart && item.end >= windowStart);
  if (!phase) return {pool: fallbackPool || [], basisStart: null, basisEnd: null, basisWindowCount: 0};
  const basis = windows
    .filter(win => win.start >= phase.start && win.end < windowStart)
    .sort((a, b) => a.start - b.start);
  if (!basis.length) return {pool: fallbackPool || [], basisStart: null, basisEnd: null, basisWindowCount: 0};
  const best = bestFixedPool(basis, poolSize);
  return {
    pool: best.pool,
    basisStart: basis[0].start,
    basisEnd: basis[basis.length - 1].end,
    basisWindowCount: basis.length,
  };
}

function completedMissStreakBefore(windows, currentStart, pool) {
  const poolSet = new Set(pool || []);
  let streak = 0;
  const completed = windows
    .filter(win => win.end < currentStart)
    .sort((a, b) => b.start - a.start);
  for (const win of completed) {
    const covered = win.nums.some(num => poolSet.has(num));
    if (covered) break;
    streak += 1;
  }
  return streak;
}

function currentWindowState(rows, windows, phasePlan, fallbackPool, options = {}) {
  const issue = latestIssue(rows);
  if (!issue) {
    return {
      start: 1,
      end: 5,
      count: 0,
      expected: 5,
      basisStart: null,
      basisEnd: null,
      basisWindowCount: 0,
      pool: fallbackPool || [],
      hits: [],
      covered: false,
      remainingDraws: 5,
      nextAction: 'watch-current-window',
      switchSignal: 'no-current-draws',
    };
  }

  const naturalStart = Math.floor((issue - 1) / 5) * 5 + 1;
  const completed = windows.some(win => win.start === naturalStart && win.end === naturalStart + 4);
  const start = completed ? naturalStart + 5 : naturalStart;
  const end = start + 4;
  const basisPool = options.walkForward
    ? currentWindowBasisPool(windows, start, options.phases || PRESET_THREE_PHASES, fallbackPool, options.poolSize || DEFAULT_POOL_SIZE)
    : {pool: poolForWindowStart(phasePlan, start, fallbackPool), basisStart: null, basisEnd: null, basisWindowCount: 0};
  const pool = basisPool.pool;
  const crossYearPool = options.records && options.source && options.year
    ? buildCrossYearStagePool(options.records, {
      source: options.source,
      year: options.year,
      targetWindowStart: start,
      poolSize: options.poolSize || DEFAULT_POOL_SIZE,
    })
    : null;
  const recommendedPool = pool;
  const sameYearSet = new Set(pool);
  const crossYearReferencePool = crossYearPool?.pool?.length ? crossYearPool.pool : pool;
  const crossYearSet = new Set(crossYearReferencePool);
  const comparePools = {
    sameYearOnly: pool.filter(num => !crossYearSet.has(num)),
    crossYearOnly: crossYearReferencePool.filter(num => !sameYearSet.has(num)),
    intersection: pool.filter(num => crossYearSet.has(num)),
  };
  const poolSet = new Set(recommendedPool);
  const draws = rows
    .filter(row => Number(row.issue || 0) >= start && Number(row.issue || 0) <= end)
    .sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0))
    .map(row => ({issue: Number(row.issue || 0), num: specialNumber(row)}));
  const hits = draws.filter(draw => poolSet.has(draw.num));
  const count = draws.length;
  let nextAction = 'watch-current-window';
  let switchSignal = 'no-current-draws';
  if (hits.length > 0) {
    nextAction = 'continue-current-stage';
    switchSignal = 'current-window-covered';
  } else if (count >= 5) {
    nextAction = 'recalculate-next-stage-8-codes';
    switchSignal = 'completed-window-miss';
  } else if (count > 0) {
    nextAction = 'watch-current-window';
    switchSignal = 'active-window-not-covered-yet';
  }
  const missStreak = completedMissStreakBefore(windows, start, recommendedPool);
  let trackingStatus = nextAction;
  if (missStreak >= 2) trackingStatus = 'stage-decay';
  else if (count >= 5 && hits.length === 0) trackingStatus = 'completed-window-miss';

  return {
    start,
    end,
    count,
    expected: 5,
    basisStart: basisPool.basisStart,
    basisEnd: basisPool.basisEnd,
    basisWindowCount: basisPool.basisWindowCount,
    pool,
    crossYearPool,
    recommendedPool,
    recommendationMode: 'same-year-stage',
    comparePools,
    tracking: {
      status: trackingStatus,
      rule: 'fixed-8-same-year-stage',
      noChangeBeforeWindowEnd: true,
      recalcWhen: 'completed-window-miss',
      stageDecayWhen: 'two-completed-window-misses',
      completedMissStreak: missStreak,
    },
    hits,
    covered: hits.length > 0,
    remainingDraws: Math.max(0, 5 - count),
    nextAction,
    switchSignal,
  };
}

function analyzeWindowSet({source, year, mode, rows, records, windows, poolSize}) {
  const best = bestFixedPool(windows, poolSize);
  const poolSet = new Set(best.pool);
  const evaluated = windows.map(win => {
    const hits = win.nums.filter(num => poolSet.has(num));
    return {...win, hits, covered: hits.length > 0};
  });
  const missWindows = evaluated
    .filter(win => !win.covered)
    .map(win => ({start: win.start, end: win.end, nums: win.nums}));
  const total = windows.length;
  const covered = total - missWindows.length;
  const phasePlan = mode === 'fixed-block' ? buildPhasePlan(windows, {poolSize}) : null;
  const presetThreePhasePlan = mode === 'fixed-block' ? buildPresetPhasePlan(windows, {poolSize}) : null;
  const walkForwardPlan = mode === 'fixed-block' ? buildWalkForwardPlan(windows, {poolSize}) : null;
  const crossYearWalkForwardPlan = mode === 'fixed-block' ? buildCrossYearWalkForwardPlan(records, {
    source,
    year,
    poolSize,
    phases: PRESET_THREE_PHASES,
  }) : null;
  const activePlan = source === 'am' && presetThreePhasePlan?.fullCovered ? presetThreePhasePlan : phasePlan;
  return {
    source,
    year,
    mode,
    poolSize,
    pool: best.pool,
    totalWindows: total,
    coveredWindows: covered,
    missCount: missWindows.length,
    hitRate: total ? Math.round((covered / total) * 10000) / 100 : 0,
    fullCovered: total > 0 && missWindows.length === 0,
    missWindows,
    phasePlan,
    presetThreePhasePlan,
    walkForwardPlan,
    crossYearWalkForwardPlan,
    currentWindow: mode === 'fixed-block' ? currentWindowState(rows, windows, activePlan, best.pool, {
      walkForward: source === 'am',
      phases: PRESET_THREE_PHASES,
      poolSize,
      records,
      source,
      year,
    }) : null,
  };
}

export function analyzePattern(records, options = {}) {
  const poolSize = Number(options.poolSize || DEFAULT_POOL_SIZE);
  const grouped = new Map();
  for (const record of records) {
    const source = String(record?.source || '');
    const year = displayYear(record);
    if (!source || !year) continue;
    const key = `${source}:${year}`;
    if (!grouped.has(key)) grouped.set(key, {source, year, rows: []});
    grouped.get(key).rows.push(record);
  }

  const items = [];
  for (const group of [...grouped.values()].sort((a, b) => a.source.localeCompare(b.source) || a.year.localeCompare(b.year))) {
    const rows = group.rows.sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
    for (const mode of MODES) {
      items.push(analyzeWindowSet({
        source: group.source,
        year: group.year,
        mode,
        rows,
        records,
        windows: buildWindows(rows, mode),
        poolSize,
      }));
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    poolRule: `fixed-${poolSize}-codes`,
    modes: MODES,
    items,
  };
}

function markdownReport(report) {
  const lines = [
    '# 固定8码阶段窗口规律验证',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    '规则：固定 8 码是硬上限。若 8 码不能覆盖全部窗口，结论记为“不成立”，不自动扩码。',
    '',
    '| 来源 | 年份 | 窗口口径 | 8码池 | 覆盖 | 命中率 | 结论 | 漏窗口 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const item of report.items) {
    const modeName = item.mode === 'fixed-block' ? '固定分段' : '滚动连续';
    const verdict = item.fullCovered ? '成立' : '不成立';
    const misses = item.missWindows.slice(0, 12).map(win => `${win.start}-${win.end}`).join(', ');
    const more = item.missWindows.length > 12 ? ` 等${item.missWindows.length}个` : '';
    const missText = misses ? `${misses}${more}` : '-';
    lines.push(`| ${item.source} | ${item.year} | ${modeName} | ${item.pool.join(' ')} | ${item.coveredWindows}/${item.totalWindows} | ${item.hitRate}% | ${verdict} | ${missText} |`);
  }
  lines.push('');
  lines.push('说明：固定分段窗口指 `1-5、6-10、11-15...`；滚动连续窗口指 `1-5、2-6、3-7...`。');
  lines.push('');
  lines.push('## 固定分段阶段切换');
  lines.push('');
  lines.push('阶段切换仍然遵守每个阶段最多 8 码，不扩码。阶段越少，说明固定 8 码规律越稳定。');
  lines.push('');
  lines.push('| 来源 | 年份 | 阶段数 | 阶段窗口 | 阶段8码 |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const item of report.items.filter(row => row.mode === 'fixed-block')) {
    const phases = item.phasePlan?.phases || [];
    const phaseWindows = phases.map(phase => `${phase.start}-${phase.end}`).join(' / ');
    const phasePools = phases.map(phase => phase.pool.join(' ')).join(' / ');
    lines.push(`| ${item.source} | ${item.year} | ${phases.length} | ${phaseWindows || '-'} | ${phasePools || '-'} |`);
  }
  lines.push('');
  lines.push('## 固定三阶段验证');
  lines.push('');
  lines.push('三阶段边界固定为 `001-115 / 116-230 / 231-365`。每阶段仍然最多 8 码，澳门当前窗口优先使用该三阶段计划。');
  lines.push('');
  lines.push('| 来源 | 年份 | 可行 | 阶段窗口 | 阶段8码 |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const item of report.items.filter(row => row.mode === 'fixed-block')) {
    const plan = item.presetThreePhasePlan;
    const phases = plan?.phases || [];
    const phaseWindows = phases.map(phase => `${phase.start}-${phase.end}:${phase.coveredWindows}/${phase.windowCount}`).join(' / ');
    const phasePools = phases.map(phase => phase.pool.join(' ')).join(' / ');
    lines.push(`| ${item.source} | ${item.year} | ${plan?.fullCovered ? '可行' : '不可行'} | ${phaseWindows || '-'} | ${phasePools || '-'} |`);
  }
  lines.push('');
  lines.push('## 三阶段 Walk-Forward');
  lines.push('');
  lines.push('Walk-forward 只使用同一固定阶段内、目标窗口之前已经完成的窗口计算 8 码，用来区分前瞻可用性和事后拟合。');
  lines.push('');
  lines.push('| 来源 | 年份 | 可评估窗口 | 覆盖 | 命中率 | 漏窗口 |');
  lines.push('| --- | --- | --- | --- | --- | --- |');
  for (const item of report.items.filter(row => row.mode === 'fixed-block')) {
    const wf = item.walkForwardPlan;
    const misses = (wf?.evaluations || [])
      .filter(row => !row.covered)
      .slice(0, 12)
      .map(row => `${row.start}-${row.end}`)
      .join(', ');
    const more = wf?.missCount > 12 ? ` 等${wf.missCount}个` : '';
    lines.push(`| ${item.source} | ${item.year} | ${wf?.totalWindows || 0} | ${wf?.coveredWindows || 0}/${wf?.totalWindows || 0} | ${wf?.hitRate || 0}% | ${misses ? `${misses}${more}` : '-'} |`);
  }
  lines.push('');
  lines.push('## 算法公式');
  lines.push('');
  lines.push('- 每个窗口 `W_i` 是该 5 期内特别号集合。');
  lines.push('- 固定 8 码池 `P` 满足 `|P| <= 8`。');
  lines.push('- 窗口命中条件：`hit(W_i, P) = 1` 当且仅当 `W_i ∩ P` 非空。');
  lines.push('- 目标函数：在固定 8 码上限内最大化 `sum(hit(W_i, P))`。');
  lines.push('- 成立条件：`sum(hit(W_i, P)) == 窗口总数`；否则只记录漏窗口，不扩码。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const recordsPath = path.join(root, 'data', 'records.json');
  const recordsPayload = JSON.parse(fs.readFileSync(recordsPath, 'utf8'));
  const report = analyzePattern(recordsPayload.records || [], {poolSize: DEFAULT_POOL_SIZE});
  const jsonPath = path.join(root, 'data', 'fixed-8-pattern-report.json');
  const jsPath = path.join(root, 'data', 'fixed-8-pattern-report.js');
  const mdPath = path.join(root, 'docs', 'fixed-8-pattern-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__FIXED8_PATTERN_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
