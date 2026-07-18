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
  assert.ok(text.includes('data/three-in-three-position-stage8-report.json'), `${name} should load position stage 8 JSON report`);
  assert.ok(text.includes('data/three-in-three-position-stage8-report.js'), `${name} should load position stage 8 JS fallback`);
  assert.ok(text.includes('__THREE_IN_THREE_POSITION_STAGE8_REPORT__'), `${name} should use position stage 8 global fallback`);
}

console.log('position stage 8 dashboard menu ok');
