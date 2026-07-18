import assert from 'node:assert/strict';
import {
  analyzeReverseDiscovery,
  combinationStats,
  featureSnapshot,
  numbersFromRecord,
} from './analyze-three-in-three-reverse-discovery.mjs';

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
assert.deepEqual(numbersFromRecord(row), ['01', '02', '03', '04', '05', '06']);

const history = [
  record(1, [1, 2, 3, 4, 5, 6]),
  record(2, [1, 2, 3, 7, 8, 9]),
  record(3, [1, 2, 10, 11, 12, 13]),
];
const pool = ['01', '02', '03', '10', '11', '12'];
const stats = combinationStats(pool, history);
assert.equal(stats.hit3Count, 3);
assert.equal(stats.recent10Frequency, 11);
assert.equal(stats.lastIssueOverlap, 5);

const snapshot = featureSnapshot(pool, history);
assert.equal(snapshot.size, 6);
assert.equal(snapshot.zoneCount >= 2, true);
assert.equal(snapshot.oddCount + snapshot.evenCount, 6);

const reportRows = Array.from({length: 25}, (_, idx) => {
  const issue = idx + 1;
  const tail = 4 + (idx % 40);
  return record(issue, [1, 2, 3, tail, Math.min(48, tail + 1), Math.min(49, tail + 2)], 49, `2026-01-${String(issue).padStart(2, '0')}`);
});
const report = analyzeReverseDiscovery(reportRows, {source: 'am', sampleSize: 20});

assert.equal(report.source, 'am');
assert.ok(report.successProfiles.length > 0);
assert.ok(report.topHistoricalPools.length > 0);

console.log('test-three-in-three-reverse-discovery passed');
