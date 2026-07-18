import assert from 'node:assert/strict';
import {
  analyzeThreeInThreeCompression,
  compressBalanced,
  compressHot,
  compressionHitCount,
} from './analyze-three-in-three-compression.mjs';

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

const mother = ['01', '02', '03', '04', '05', '06', '21', '22', '23', '24', '41', '42'];
const history = [
  record(1, [1, 2, 3, 21, 22, 41]),
  record(2, [1, 2, 4, 23, 24, 42]),
];

const hotCompressed = compressHot(mother, history, 6);
assert.equal(hotCompressed.length, 6);
assert.ok(hotCompressed.includes('01'));
assert.ok(hotCompressed.includes('02'));
assert.ok(hotCompressed.every(num => mother.includes(num)));
assert.equal(compressBalanced(mother, history, 6).length, 6);
assert.ok(compressBalanced(mother, history, 6).every(num => mother.includes(num)));
assert.equal(compressionHitCount(['01', '02', '03', '07', '08', '09'], record(3, [1, 2, 3, 4, 5, 6], 7)), 3);

const report = analyzeThreeInThreeCompression([
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
], {source: 'am', windows: [3]});

assert.equal(report.source, 'am');
assert.ok(report.formulas.length >= 4);
assert.ok(report.formulas.every(item => item.poolSize === 6));
assert.ok(report.formulas.some(item => item.hits > 0));

console.log('test-three-in-three-compression passed');
