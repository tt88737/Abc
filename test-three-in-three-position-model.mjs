import assert from 'node:assert/strict';
import {
  analyzePositionModel,
  buildPositionPool,
  mergeToSix,
  positionHitCount,
  positionNumbers,
} from './analyze-three-in-three-position-model.mjs';

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

const rows = [
  record(1, [1, 11, 21, 31, 41, 6]),
  record(2, [1, 12, 22, 32, 42, 7]),
  record(3, [1, 13, 23, 33, 43, 8]),
  record(4, [1, 14, 24, 34, 44, 9]),
  record(5, [1, 15, 25, 35, 45, 10]),
];

assert.deepEqual(positionNumbers(rows[0]), ['01', '11', '21', '31', '41', '06']);
assert.equal(positionHitCount(['01', '11', '21', '07', '08', '09'], rows[0]), 3);

const positionPool = buildPositionPool(rows, {lookback: 5, pickPerPosition: 1, mode: 'hot'});
assert.deepEqual(positionPool.map(item => item.nums[0]), ['01', '15', '25', '35', '45', '10']);

const merged = mergeToSix(positionPool, rows);
assert.equal(merged.length, 6);
assert.ok(merged.includes('01'));

const reportRows = Array.from({length: 30}, (_, idx) => {
  const issue = idx + 1;
  return record(issue, [1, 2 + (idx % 10), 3 + (idx % 10), 4 + (idx % 10), 5 + (idx % 10), 6 + (idx % 10)], 49, `2026-01-${String(issue).padStart(2, '0')}`);
});
const report = analyzePositionModel(reportRows, {source: 'am'});
assert.equal(report.source, 'am');
assert.ok(report.formulas.length > 0);
assert.ok(report.formulas.every(item => item.poolSize === 6));

console.log('test-three-in-three-position-model passed');
