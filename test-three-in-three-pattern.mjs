import assert from 'node:assert/strict';
import {
  analyzeThreeInThree,
  hitCount,
  positiveNumbers,
  rankByFrequency,
} from './analyze-three-in-three-pattern.mjs';

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

const row = record(1, [1, 2, 3, 4, 5, 6], 7);
assert.deepEqual(positiveNumbers(row), ['01', '02', '03', '04', '05', '06']);
assert.equal(hitCount(['01', '02', '03', '07', '08', '09'], row), 3);
assert.equal(hitCount(['07', '08', '09', '10', '11', '12'], row), 0, 'special number must be ignored');

const ranked = rankByFrequency([
  record(1, [1, 2, 3, 4, 5, 6]),
  record(2, [1, 2, 3, 7, 8, 9]),
], 'hot');
assert.deepEqual(ranked.slice(0, 3), ['01', '02', '03']);

const report = analyzeThreeInThree([
  record(1, [1, 2, 3, 4, 5, 6], 49, '2026-01-01'),
  record(2, [1, 2, 3, 7, 8, 9], 49, '2026-01-02'),
  record(3, [1, 2, 3, 10, 11, 12], 49, '2026-01-03'),
  record(4, [1, 2, 3, 13, 14, 15], 49, '2026-01-04'),
  record(5, [1, 2, 3, 16, 17, 18], 49, '2026-01-05'),
  record(6, [1, 2, 3, 19, 20, 21], 49, '2026-01-06'),
], {source: 'am', windows: [3], minStageBasis: 3});

assert.equal(report.source, 'am');
assert.equal(report.formulas.length, 12);
const stage = report.formulas.find(item => item.id === 'stage-fixed-6-walk-forward');
assert.ok(stage.evaluatedDraws > 0);
assert.ok(stage.hits > 0);

console.log('test-three-in-three-pattern passed');
