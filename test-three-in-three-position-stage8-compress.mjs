import assert from 'node:assert/strict';
import {
  analyzePositionStage8Compress,
  compressPositionStagePools,
  stage8CompressHitCount,
} from './analyze-three-in-three-position-stage8-compress.mjs';

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

const positionPools = [
  ['01', '02', '03', '04', '05', '06', '07', '08'],
  ['01', '09', '10', '11', '12', '13', '14', '15'],
  ['01', '16', '17', '18', '19', '20', '21', '22'],
  ['02', '23', '24', '25', '26', '27', '28', '29'],
  ['03', '30', '31', '32', '33', '34', '35', '36'],
  ['04', '37', '38', '39', '40', '41', '42', '43'],
];

const compressed = compressPositionStagePools(positionPools, [], 'position-overlap');
assert.equal(compressed.length, 6);
assert.ok(compressed.includes('01'));
assert.ok(compressed.includes('02'));
assert.ok(compressed.includes('03'));
assert.ok(compressed.includes('04'));

assert.equal(stage8CompressHitCount(['01', '02', '03', '07', '08', '09'], record(1, [1, 2, 3, 4, 5, 6], 7)), 3);

const rows = Array.from({length: 30}, (_, idx) => {
  const issue = idx + 1;
  return record(issue, [1, 2 + (idx % 10), 3 + (idx % 10), 4 + (idx % 10), 5 + (idx % 10), 6 + (idx % 10)], 49, `2026-01-${String(issue).padStart(2, '0')}`);
});
const report = analyzePositionStage8Compress(rows, {source: 'am'});
assert.equal(report.source, 'am');
assert.ok(report.rules.length > 0);
assert.ok(report.rules.every(rule => rule.poolSize === 6));

console.log('test-three-in-three-position-stage8-compress passed');
