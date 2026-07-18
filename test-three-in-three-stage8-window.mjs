import assert from 'node:assert/strict';
import {
  analyzeStage8Window,
  bestStagePool,
  buildFiveIssueWindows,
  exactBestStagePool,
  findFullCoverStagePool,
  stage8WindowCovered,
} from './analyze-three-in-three-stage8-window.mjs';

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
  record(1, [1, 2, 3, 4, 5, 6], 49),
  record(2, [9, 10, 11, 12, 13, 14], 1),
  record(3, [15, 16, 17, 18, 19, 20], 2),
  record(4, [21, 22, 23, 24, 25, 26], 3),
  record(5, [27, 28, 29, 30, 31, 32], 4),
];

const windows = buildFiveIssueWindows(rows);
assert.equal(windows.length, 1);
assert.equal(stage8WindowCovered(windows[0], ['01', '02', '03', '40', '41', '42', '43', '44']), true);
assert.equal(stage8WindowCovered(windows[0], ['07', '08', '33', '34', '35', '36', '37', '38']), false);

const best = bestStagePool(windows, 8);
assert.equal(best.pool.length, 8);
assert.equal(best.coveredWindows, 1);

const twoWindows = buildFiveIssueWindows([
  ...rows,
  record(6, [40, 41, 42, 7, 8, 9], 49),
  record(7, [40, 41, 42, 10, 11, 12], 49),
  record(8, [40, 41, 42, 13, 14, 15], 49),
  record(9, [40, 41, 42, 16, 17, 18], 49),
  record(10, [40, 41, 42, 19, 20, 21], 49),
]);
const exact = exactBestStagePool(twoWindows, 8, {candidateLimit: 12});
assert.equal(exact.pool.length, 8);
assert.equal(exact.coveredWindows, 2);

const feasible = findFullCoverStagePool(twoWindows, 8);
assert.equal(feasible.feasible, true);
assert.equal(feasible.coveredWindows, 2);
assert.equal(feasible.pool.length <= 8, true);

const impossibleWindows = buildFiveIssueWindows([
  record(1, [1, 2, 3, 4, 5, 6], 49),
  record(2, [1, 2, 3, 4, 5, 6], 49),
  record(3, [1, 2, 3, 4, 5, 6], 49),
  record(4, [1, 2, 3, 4, 5, 6], 49),
  record(5, [1, 2, 3, 4, 5, 6], 49),
  record(6, [7, 8, 9, 10, 11, 12], 49),
  record(7, [7, 8, 9, 10, 11, 12], 49),
  record(8, [7, 8, 9, 10, 11, 12], 49),
  record(9, [7, 8, 9, 10, 11, 12], 49),
  record(10, [7, 8, 9, 10, 11, 12], 49),
]);
const impossible = findFullCoverStagePool(impossibleWindows, 5);
assert.equal(impossible.feasible, false);

const report = analyzeStage8Window([
  ...rows,
  record(6, [1, 2, 3, 7, 8, 9], 49, '2026-01-06'),
  record(7, [1, 2, 3, 10, 11, 12], 49, '2026-01-07'),
  record(8, [1, 2, 3, 13, 14, 15], 49, '2026-01-08'),
  record(9, [1, 2, 3, 16, 17, 18], 49, '2026-01-09'),
  record(10, [1, 2, 3, 19, 20, 21], 49, '2026-01-10'),
], {source: 'am'});

assert.equal(report.source, 'am');
assert.ok(report.years.length > 0);
assert.ok(report.years[0].phases.length === 3);

console.log('test-three-in-three-stage8-window passed');
