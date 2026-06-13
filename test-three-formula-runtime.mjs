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
vm.runInContext(`${script}\n;window.__threeFormulaRuntime = {ensureRecordsData, renderThreeFormulaGate};`, context, {filename: 'index.html'});

await context.__threeFormulaRuntime.ensureRecordsData();
const started = Date.now();
context.__threeFormulaRuntime.renderThreeFormulaGate();
const elapsed = Date.now() - started;

assert.ok(!app.innerHTML.includes('&#21152;&#36733;&#20013;'), 'three formula page should not remain in loading state');
assert.ok(app.innerHTML.includes('walk-forward 6&#30721;&#22797;&#24335;'), 'three formula page should render walk-forward recommendation');
assert.ok(elapsed < 2000, `three formula page should render quickly, took ${elapsed}ms`);
console.log(`three formula runtime render ok: ${elapsed}ms`);
