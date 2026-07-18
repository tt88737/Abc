import assert from 'node:assert/strict';
import {
  analyzeThreeInThreeStructure,
  buildRecentPool,
  structureHitCount,
} from './analyze-three-in-three-structure.mjs';

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

assert.equal(
  structureHitCount(['01', '02', '03', '07'], record(1, [1, 2, 3, 4, 5, 6], 7)),
  3,
  'only the first six positive numbers should count',
);

assert.deepEqual(
  buildRecentPool([
    record(1, [1, 2, 3, 4, 5, 6]),
    record(2, [1, 2, 3, 7, 8, 9]),
  ], 5),
  ['01', '02', '03', '07', '08'],
);

const report = analyzeThreeInThreeStructure([
  record(1, [1, 2, 3, 4, 5, 6], 49, '2026-01-01'),
  record(2, [1, 2, 3, 7, 8, 9], 49, '2026-01-02'),
  record(3, [1, 2, 3, 10, 11, 12], 49, '2026-01-03'),
  record(4, [1, 2, 3, 13, 14, 15], 49, '2026-01-04'),
], {source: 'am', windows: [3]});

assert.equal(report.source, 'am');
assert.ok(report.formulas.length >= 10);
assert.ok(report.formulas.every(item => item.poolSize === 10 || item.poolSize === 12));
assert.ok(report.formulas.some(item => item.hits > 0));

console.log('test-three-in-three-structure passed');
