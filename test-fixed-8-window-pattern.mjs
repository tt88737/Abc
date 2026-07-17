import assert from 'node:assert/strict';
import {
  analyzePattern,
  buildWindows,
  buildPhasePlan,
  buildPresetPhasePlan,
  buildCrossYearWalkForwardPlan,
  buildWalkForwardPlan,
  buildCrossYearStagePool,
  specialNumber,
} from './analyze-fixed-8-window-pattern.mjs';

function record(source, year, issue, special) {
  return {
    source,
    date: `${year}-01-${String(issue).padStart(2, '0')}`,
    issue,
    balls: [
      {}, {}, {}, {}, {}, {},
      {numberText: String(special).padStart(2, '0')},
    ],
  };
}

const rows = [
  record('am', 2026, 1, 1),
  record('am', 2026, 2, 2),
  record('am', 2026, 3, 3),
  record('am', 2026, 4, 4),
  record('am', 2026, 5, 5),
  record('am', 2026, 6, 6),
  record('am', 2026, 7, 7),
  record('am', 2026, 8, 8),
  record('am', 2026, 9, 9),
  record('am', 2026, 10, 10),
];

assert.equal(specialNumber(rows[0]), '01');

const fixedWindows = buildWindows(rows, 'fixed-block');
assert.deepEqual(
  fixedWindows.map(win => `${win.start}-${win.end}:${win.nums.join(',')}`),
  ['1-5:01,02,03,04,05', '6-10:06,07,08,09,10'],
);

const rollingWindows = buildWindows(rows, 'rolling-contiguous');
assert.equal(rollingWindows.length, 6);
assert.equal(rollingWindows[0].start, 1);
assert.equal(rollingWindows[5].start, 6);

const analysis = analyzePattern(rows, {poolSize: 1});
const fixed = analysis.items.find(item => item.source === 'am' && item.year === '2026' && item.mode === 'fixed-block');
assert.equal(fixed.pool.length, 1);
assert.equal(fixed.fullCovered, false);
assert.equal(fixed.missCount, 1);
assert.deepEqual(fixed.missWindows, [{start: 6, end: 10, nums: ['06', '07', '08', '09', '10']}]);
assert.deepEqual(fixed.currentWindow, {
  start: 11,
  end: 15,
  count: 0,
  expected: 5,
  basisStart: 1,
  basisEnd: 10,
  basisWindowCount: 2,
  pool: ['01'],
  crossYearPool: {
    phase: {start: 1, end: 115},
    pool: ['01'],
    basis: {
      historyYearCount: 0,
      currentWindowCount: 2,
      currentBasisStart: 1,
      currentBasisEnd: 10,
    },
  },
  recommendedPool: ['01'],
  recommendationMode: 'cross-year-stage',
  comparePools: {
    sameYearOnly: [],
    crossYearOnly: [],
    intersection: ['01'],
  },
  tracking: {
    status: 'watch-current-window',
    rule: 'fixed-8-cross-year-stage',
    noChangeBeforeWindowEnd: true,
    recalcWhen: 'completed-window-miss',
    stageDecayWhen: 'two-completed-window-misses',
    completedMissStreak: 1,
  },
  hits: [],
  covered: false,
  remainingDraws: 5,
  nextAction: 'watch-current-window',
  switchSignal: 'no-current-draws',
});

const phasePlan = buildPhasePlan(fixedWindows, {poolSize: 1});
assert.equal(phasePlan.fullCovered, true);
assert.deepEqual(
  phasePlan.phases.map(phase => ({start: phase.start, end: phase.end, pool: phase.pool})),
  [
    {start: 1, end: 5, pool: ['01']},
    {start: 6, end: 10, pool: ['06']},
  ],
);

const presetPlan = buildPresetPhasePlan(fixedWindows, {
  poolSize: 1,
  phases: [
    {start: 1, end: 5},
    {start: 6, end: 10},
    {start: 11, end: 15},
  ],
});
assert.equal(presetPlan.fullCovered, true);
assert.deepEqual(
  presetPlan.phases.map(phase => ({start: phase.start, end: phase.end, windowCount: phase.windowCount, pool: phase.pool})),
  [
    {start: 1, end: 5, windowCount: 1, pool: ['01']},
    {start: 6, end: 10, windowCount: 1, pool: ['06']},
    {start: 11, end: 15, windowCount: 0, pool: []},
  ],
);

const walkRows = rows.concat([
  record('am', 2026, 11, 11),
  record('am', 2026, 12, 12),
  record('am', 2026, 13, 13),
  record('am', 2026, 14, 14),
  record('am', 2026, 15, 15),
]);
const walkWindows = buildWindows(walkRows, 'fixed-block');
const walkForward = buildWalkForwardPlan(walkWindows, {
  poolSize: 1,
  phases: [{start: 1, end: 15}],
});
assert.deepEqual(
  walkForward.evaluations.map(item => ({
    start: item.start,
    end: item.end,
    basisStart: item.basisStart,
    basisEnd: item.basisEnd,
    pool: item.pool,
    covered: item.covered,
  })),
  [
    {start: 6, end: 10, basisStart: 1, basisEnd: 5, pool: ['01'], covered: false},
    {start: 11, end: 15, basisStart: 1, basisEnd: 10, pool: ['01'], covered: false},
  ],
);
assert.equal(walkForward.coveredWindows, 0);
assert.equal(walkForward.totalWindows, 2);

const crossYearRows = [
  ...[1, 2, 3, 4, 5].map((issue, idx) => record('am', 2025, issue, ['01', '02', '03', '04', '05'][idx])),
  ...[6, 7, 8, 9, 10].map((issue, idx) => record('am', 2025, issue, ['06', '07', '08', '09', '10'][idx])),
  ...[1, 2, 3, 4, 5].map((issue, idx) => record('am', 2026, issue, ['01', '11', '12', '13', '14'][idx])),
  ...[6, 7, 8, 9, 10].map((issue, idx) => record('am', 2026, issue, ['15', '16', '17', '18', '19'][idx])),
];
const crossYearPool = buildCrossYearStagePool(crossYearRows, {
  source: 'am',
  year: '2026',
  targetWindowStart: 6,
  poolSize: 3,
  phase: {start: 1, end: 15},
});
assert.deepEqual(crossYearPool.pool, ['01', '02', '06']);
assert.equal(crossYearPool.basis.currentWindowCount, 1);
assert.equal(crossYearPool.basis.historyYearCount, 1);

const crossYearWalkForward = buildCrossYearWalkForwardPlan(crossYearRows, {
  source: 'am',
  year: '2026',
  poolSize: 3,
  phases: [{start: 1, end: 15}],
});
assert.deepEqual(
  crossYearWalkForward.evaluations.map(item => ({
    start: item.start,
    end: item.end,
    pool: item.pool,
    hits: item.hits,
    covered: item.covered,
  })),
  [
    {start: 6, end: 10, pool: ['01', '06', '11'], hits: [], covered: false},
  ],
);
assert.equal(crossYearWalkForward.coveredWindows, 0);
assert.equal(crossYearWalkForward.totalWindows, 1);

console.log('fixed 8 window pattern analysis ok');
