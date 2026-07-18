import assert from 'node:assert/strict';
import {
  analyzeTrendShape,
  drawShape,
  overlapCount,
  trendBucket,
} from './analyze-three-in-three-trend-shape.mjs';

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

assert.equal(overlapCount(record(1, [1, 2, 3, 4, 5, 6]), record(2, [1, 2, 9, 10, 11, 12])), 2);

const shape = drawShape(record(1, [1, 3, 5, 31, 33, 35]));
assert.deepEqual(shape, {
  oddCount: 6,
  evenCount: 0,
  smallCount: 3,
  bigCount: 3,
  zoneCount: 2,
  tailCount: 3,
  consecutivePairs: 0,
  sameTailPairs: 3,
});

assert.equal(trendBucket({missStreak: 12, previousOverlap: 4, oddCount: 6}).includes('miss>=10'), true);

const rows = [
  record(1, [1, 2, 3, 4, 5, 6], 49, '2026-01-01'),
  record(2, [1, 2, 3, 7, 8, 9], 49, '2026-01-02'),
  record(3, [1, 2, 3, 10, 11, 12], 49, '2026-01-03'),
  record(4, [1, 2, 3, 13, 14, 15], 49, '2026-01-04'),
  record(5, [1, 2, 3, 16, 17, 18], 49, '2026-01-05'),
  record(6, [1, 2, 3, 19, 20, 21], 49, '2026-01-06'),
  record(7, [1, 2, 3, 22, 23, 24], 49, '2026-01-07'),
  record(8, [1, 2, 3, 25, 26, 27], 49, '2026-01-08'),
  record(9, [1, 2, 3, 28, 29, 30], 49, '2026-01-09'),
  record(10, [1, 2, 3, 31, 32, 33], 49, '2026-01-10'),
  record(11, [1, 2, 3, 34, 35, 36], 49, '2026-01-11'),
  record(12, [1, 2, 3, 37, 38, 39], 49, '2026-01-12'),
];

const report = analyzeTrendShape(rows, {source: 'am'});
assert.equal(report.source, 'am');
assert.ok(report.formulas.length > 0);
assert.ok(report.buckets.length > 0);

console.log('test-three-in-three-trend-shape passed');
