import assert from 'node:assert/strict';
import fs from 'node:fs';

const files = [
  ['index.html', fs.readFileSync('index.html', 'utf8')],
  ['build-data.ps1', fs.readFileSync('build-data.ps1', 'utf8')],
];

for (const [name, text] of files) {
  assert.ok(text.includes('data-tab="positionStage8"'), `${name} should expose position stage 8 as an independent menu`);
  assert.ok(text.includes('正六码固定8码'), `${name} should label the menu as 正六码固定8码`);
  assert.ok(text.includes('function renderPositionStage8'), `${name} should define position stage 8 renderer`);
  assert.ok(text.includes('positionStage8CurrentRows(selected, yearPlan.year, currentWindow.start, currentWindow.end)'), `${name} should filter current window rows by current year`);
  assert.ok(text.includes("String(row.date || '').startsWith(`${year}-`)"), `${name} should avoid mixing same issue across years`);
  assert.ok(text.includes('ensurePositionStage8Data'), `${name} should load position stage 8 data`);
  assert.ok(text.includes('data/positive-position-stage8-report.json'), `${name} should load position fixed 8 JSON report`);
  assert.ok(text.includes('data/positive-position-stage8-report.js'), `${name} should load position fixed 8 JS fallback`);
  assert.ok(text.includes('__POSITIVE_POSITION_STAGE8_REPORT__'), `${name} should use position fixed 8 global fallback`);
  assert.ok(!text.includes('data/three-in-three-position-stage8-report.json'), `${name} should not load old report path`);
  assert.ok(!text.includes('__THREE_IN_THREE_POSITION_STAGE8_REPORT__'), `${name} should not use old global fallback`);
}

const reportPath = fs.existsSync('data/positive-position-stage8-report.json')
  ? 'data/positive-position-stage8-report.json'
  : 'data/three-in-three-position-stage8-report.json';
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const sources = Array.isArray(report.sources) ? report.sources : [report];
assert.ok(sources.some(item => item.source === 'am'), 'position stage 8 report should include Macau source');
assert.ok(sources.some(item => item.source === 'hk'), 'position stage 8 report should include Hong Kong source');

console.log('position stage 8 dashboard menu ok');
