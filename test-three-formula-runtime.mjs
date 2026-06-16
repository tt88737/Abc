import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html = fs.readFileSync('index.html', 'utf8');
const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(script, 'index.html should contain an app script');

const recordsPayload = JSON.parse(fs.readFileSync('data/records.json', 'utf8'));
const app = {innerHTML: ''};
const buttons = [{dataset: {tab: 'threeFormulaGate'}, classList: {toggle() {}}, addEventListener() {}, textContent: '三中三公式'}];

const context = {
  console,
  location: {protocol: 'http:'},
  window: {},
  setTimeout: (fn) => {
    Promise.resolve().then(fn);
    return 1;
  },
  clearTimeout() {},
  fetch: async () => ({ok: true, json: async () => recordsPayload}),
  document: {
    getElementById: (id) => id === 'app' ? app : {value: 'am', addEventListener() {}},
    querySelectorAll: () => buttons,
    querySelector: () => ({textContent: '三中三公式'}),
    createElement: () => ({}),
    head: {appendChild() {}}
  }
};
context.window = context;

vm.createContext(context);
vm.runInContext(`${script}
;window.__threeFormulaRuntime = {
  ensureRecordsData,
  renderThreeFormulaGate,
  threeFormulaRandomBaseline,
  threeFormulaObservationScore,
  threeFormulaObservationDecision
};`, context, {filename: 'index.html'});

const baseline = context.__threeFormulaRuntime.threeFormulaRandomBaseline();
assert.ok(baseline > 0.02 && baseline < 0.03, `random baseline should be around 2.4%, got ${baseline}`);

const strongScore = context.__threeFormulaRuntime.threeFormulaObservationDecision({
  total: 120,
  hitRate: baseline + 0.08,
  recentTotal: 100,
  recentHitRate: baseline + 0.07,
  recent10Total: 10,
  recent10Hits: 3,
  recent10HitRate: 0.3,
  currentMiss: 1,
  maxMiss: 8
}, ['01', '02', '03', '04', '05', '06']);
assert.equal(strongScore.level, '强观察');
assert.ok(strongScore.observationScore >= 70, `strong observation score should be high, got ${strongScore.observationScore}`);
assert.ok(strongScore.edge > 0, 'strong observation should be above random baseline');

const reviewScore = context.__threeFormulaRuntime.threeFormulaObservationDecision({
  total: 120,
  hitRate: baseline - 0.01,
  recentTotal: 100,
  recentHitRate: baseline - 0.01,
  recent10Total: 10,
  recent10Hits: 0,
  recent10HitRate: 0,
  currentMiss: 3,
  maxMiss: 8
}, ['01', '02', '03', '04', '05', '06']);
assert.equal(reviewScore.level, '仅复盘');
assert.ok(reviewScore.reason.includes('最近窗口 0 命中'));

const pausedScore = context.__threeFormulaRuntime.threeFormulaObservationDecision({
  total: 120,
  hitRate: baseline + 0.04,
  recentTotal: 100,
  recentHitRate: baseline + 0.04,
  recent10Total: 10,
  recent10Hits: 2,
  recent10HitRate: 0.2,
  currentMiss: 8,
  maxMiss: 8
}, ['01', '02', '03', '04', '05', '06']);
assert.equal(pausedScore.level, '暂停');
assert.ok(pausedScore.reason.includes('当前连挂达到历史风险上沿'));

await context.__threeFormulaRuntime.ensureRecordsData();
const started = Date.now();
context.__threeFormulaRuntime.renderThreeFormulaGate();
const elapsed = Date.now() - started;

assert.ok(!app.innerHTML.includes('&#21152;&#36733;&#20013;'), 'three formula page should not remain in loading state');
assert.ok(app.innerHTML.includes('walk-forward 只使用开奖前历史选择公式') || app.innerHTML.includes('下期 6 码复式'), 'three formula page should render walk-forward recommendation');
assert.ok(elapsed < 2000, `three formula page should render quickly, took ${elapsed}ms`);
console.log(`three formula runtime render ok: ${elapsed}ms`);
