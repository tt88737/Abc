import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const build = fs.readFileSync('build-data.ps1', 'utf8');

for (const [name, text] of [['index.html', html], ['build-data.ps1', build]]) {
  assert.ok(text.includes('data-tab="fixed8Pattern"'), `${name} should expose fixed 8 as an independent top menu`);
  assert.ok(text.includes('function renderFixed8Pattern'), `${name} should define fixed 8 renderer`);
  assert.ok(text.includes('ensureFixed8PatternData'), `${name} should load fixed 8 report data`);
  assert.ok(text.includes('function fixed8HistoryPhaseRows'), `${name} should render fixed 8 historical validation rows`);
  assert.ok(text.includes('历史三阶段验证'), `${name} should show fixed 8 historical validation section`);
  assert.ok(text.includes('data/fixed-8-pattern-report.json'), `${name} should load fixed 8 JSON report`);
  assert.ok(text.includes('data/fixed-8-pattern-report.js'), `${name} should load fixed 8 JS fallback`);
  assert.ok(text.includes('__FIXED8_PATTERN_REPORT__'), `${name} should use fixed 8 global fallback`);
  assert.ok(text.includes('跨年同阶段公式'), `${name} should localize cross-year stage label`);
  assert.ok(text.includes('继续观察当前窗口'), `${name} should localize watch-current-window status`);
  assert.ok(text.includes('固定8码·跨年同阶段'), `${name} should localize fixed 8 rule label`);
  assert.ok(text.includes('当前阶段暂无前置完整窗口'), `${name} should avoid dash-only empty basis text`);
  assert.ok(text.includes('阶段 ${fixed8WindowRange(currentPhase.start, currentPhase.end)}'), `${name} should describe same-year phase basis`);
  assert.ok(text.includes('暂无</span>'), `${name} should render empty number groups as readable text`);
}

console.log('fixed 8 dashboard menu ok');
