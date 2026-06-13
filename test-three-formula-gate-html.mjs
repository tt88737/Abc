import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const build = fs.readFileSync("build-data.ps1", "utf8");

for (const [name, text] of [["index.html", html], ["build-data.ps1", build]]) {
  assert.ok(text.includes('data-tab="threeFormulaGate"'), `${name} should expose the three-hit formula gate menu tab`);
  assert.ok(text.includes("function threeFormulaGateAnalysis"), `${name} should analyze fixed three-hit formula groups`);
  assert.ok(text.includes("function threeFormulaGroupPoolAt"), `${name} should build formula-group pools from A/B/C/D draws`);
  assert.ok(text.includes("function renderThreeFormulaGate"), `${name} should render the three-hit formula page`);
  assert.ok(text.includes("threeFormulaGate: renderThreeFormulaGate"), `${name} should wire the renderer`);
  assert.ok(text.includes("threeFormulaGate: async () =>"), `${name} should preload records for the formula page`);
  assert.ok(text.includes("&#19977;&#20013;&#19977;&#20844;&#24335;"), `${name} should show the Three-hit Formula title`);
  assert.ok(text.includes("&#22266;&#23450;&#20844;&#24335;&#32452;&#38383;&#20851;"), `${name} should describe fixed formula group gating`);
  assert.ok(text.includes("&#24403;&#21069;&#20027;&#35266;&#23519;&#27744;"), `${name} should show current main observation pool`);
  assert.ok(text.includes("&#20844;&#24335;&#32452;&#20998;&#23618;"), `${name} should show formula group tiers`);
  assert.ok(text.includes("&#21382;&#21490;&#38383;&#20851;&#22797;&#30424;"), `${name} should show historical gate replay`);
  assert.ok(text.includes("&#31532;&#19968;&#20851; / &#31532;&#20108;&#20851; / &#31532;&#19977;&#20851;"), `${name} should show gate progression metrics`);
  assert.ok(text.includes("same-position-drift"), `${name} should include the same-position drift formula group`);
  assert.ok(text.includes("inner-pair-structure"), `${name} should include the inner pair structure formula group`);
  assert.ok(text.includes("special-anchor"), `${name} should include the special anchor formula group`);
  assert.ok(text.includes("cross-period-mix"), `${name} should include the cross period mix formula group`);
}

console.log("three formula gate html shell ok");
