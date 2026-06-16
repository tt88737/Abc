import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('update-worldcup2026-data.mjs', 'utf8');
const match = source.match(/function parseJsonCandidates\(text\) \{[\s\S]*?\n\}/);
assert.ok(match, 'parseJsonCandidates function should exist');

const context = {};
vm.createContext(context);
vm.runInContext(`${match[0]}; globalThis.parseJsonCandidates = parseJsonCandidates;`, context);

const html = `
<html><body>
<script>
window.__INITIAL_STATE__ = {"home":{"zq":{"matches":[{"simpleleague":"世界杯","homesxname":"巴西","awaysxname":"摩洛哥","homescore":"2","awayscore":"1","status":"4","status_desc":"完场"}]}}};
</script>
</body></html>`;

const candidates = context.parseJsonCandidates(html);
assert.ok(
  candidates.some(candidate => candidate.includes('"homesxname":"巴西"') && candidate.includes('"status_desc":"完场"')),
  'parseJsonCandidates should extract assignment JSON from 500 live page state'
);

console.log('worldcup 500 state json parser ok');
