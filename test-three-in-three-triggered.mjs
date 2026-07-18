import assert from 'node:assert/strict';
import {
  analyzeTriggeredThreeInThree,
  shouldTrigger,
  triggeredHitCount,
} from './analyze-three-in-three-triggered.mjs';

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

assert.equal(triggeredHitCount(['01', '02', '03', '07', '08', '09'], record(1, [1, 2, 3, 4, 5, 6], 7)), 3);
assert.equal(shouldTrigger({missStreak: 20, previousShape: {smallCount: 2, zoneCount: 4}}, 'miss>=20'), true);
assert.equal(shouldTrigger({missStreak: 5, previousShape: {smallCount: 5, zoneCount: 4}}, 'prevSmall>=5'), true);
assert.equal(shouldTrigger({missStreak: 5, previousShape: {smallCount: 2, zoneCount: 2}}, 'prevZone<=2'), true);

const rows = Array.from({length: 30}, (_, idx) => {
  const issue = idx + 1;
  const base = 4 + (idx % 20);
  return record(issue, [1, 2, 3, base, base + 1, base + 2], 49, `2026-01-${String(issue).padStart(2, '0')}`);
});

const report = analyzeTriggeredThreeInThree(rows, {source: 'am'});
assert.equal(report.source, 'am');
assert.ok(report.rules.length > 0);
assert.ok(report.rules.every(rule => rule.poolSize === 6));
assert.ok(report.rules.some(rule => rule.triggeredDraws > 0));
assert.ok(report.rules.every(rule => rule.byYear && Object.keys(rule.byYear).length > 0));

console.log('test-three-in-three-triggered passed');
