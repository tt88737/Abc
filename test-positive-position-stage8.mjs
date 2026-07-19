import assert from 'node:assert/strict';
import {
  analyzeAllPositionStage8,
  analyzePositionStage8,
  bestPositionStagePool,
  buildPositionWindows,
  positionWindowCovered,
} from './analyze-positive-position-stage8.mjs';

function record(issue, positives, special = 49, date = '2026-01-01') {
  return {
    source: 'am',
    issue,
    date,
    balls: positives.concat([special]).map((number, index) => ({
      index,
      number,
      numberText: String(number).padStart(2, '0'),
    })),
  };
}

function sourceRecord(source, issue, positives, special = 49, date = '2026-01-01') {
  return {
    ...record(issue, positives, special, date),
    source,
  };
}

const rows = [
  record(1, [1, 11, 21, 31, 41, 6]),
  record(2, [2, 12, 22, 32, 42, 7]),
  record(3, [3, 13, 23, 33, 43, 8]),
  record(4, [4, 14, 24, 34, 44, 9]),
  record(5, [5, 15, 25, 35, 45, 10]),
  record(6, [6, 16, 26, 36, 46, 11]),
  record(7, [7, 17, 27, 37, 47, 12]),
  record(8, [8, 18, 28, 38, 48, 13]),
  record(9, [9, 19, 29, 39, 49, 14]),
  record(10, [10, 20, 30, 40, 1, 15]),
];

const p1Windows = buildPositionWindows(rows, 0);
assert.equal(p1Windows.length, 2);
assert.equal(positionWindowCovered(p1Windows[0], ['03', '44']), true);
assert.equal(positionWindowCovered(p1Windows[0], ['11', '12']), false);

const p2Windows = buildPositionWindows(rows, 1);
const p2Best = bestPositionStagePool(p2Windows, 8);
assert.equal(p2Best.fullCovered, true);
assert.equal(p2Best.pool.length <= 8, true);

const report = analyzePositionStage8(rows, {source: 'am'});
assert.equal(report.source, 'am');
assert.equal(report.years.length, 1);
assert.equal(report.years[0].phases.length, 3);
assert.equal(report.years[0].phases[0].positions.length, 6);

const multiReport = analyzeAllPositionStage8([
  sourceRecord('am', 1, [1, 2, 3, 4, 5, 6], 49, '2026-01-01'),
  sourceRecord('hk', 1, [7, 8, 9, 10, 11, 12], 49, '2026-01-01'),
]);
assert.deepEqual(multiReport.sources.map(item => item.source), ['am', 'hk']);
assert.equal(multiReport.sources.find(item => item.source === 'hk').years.length, 1);

console.log('test-positive-position-stage8 passed');
