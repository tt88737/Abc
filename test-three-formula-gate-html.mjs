import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const build = fs.readFileSync("build-data.ps1", "utf8");

for (const [name, text] of [["index.html", html], ["build-data.ps1", build]]) {
  assert.ok(text.includes('data-tab="threeFormulaGate"'), `${name} should expose the three-hit formula gate menu tab`);
  assert.ok(text.includes("function threeFormulaGateAnalysis"), `${name} should analyze fixed three-hit formula groups`);
  assert.ok(text.includes("function threeFormulaGroupPoolAt"), `${name} should build formula-group pools from A/B/C/D draws`);
  assert.ok(text.includes("function renderThreeFormulaGate"), `${name} should render the three-hit formula page`);
  assert.ok(text.includes("const htmlText"), `${name} should render trusted internal HTML entities without double escaping`);
  assert.ok(text.includes("htmlText(nextRecalcIssue"), `${name} should not double-escape sync status recalculation text`);
  assert.ok(text.includes("threeFormulaGate: renderThreeFormulaGate"), `${name} should wire the renderer`);
  assert.ok(text.includes("threeFormulaGate: async () =>"), `${name} should preload records for the formula page`);
  assert.ok(text.includes("&#19977;&#20013;&#19977;&#20844;&#24335;"), `${name} should show the Three-hit Formula title`);
  assert.ok(text.includes("&#22266;&#23450;&#20844;&#24335;&#32452;&#38383;&#20851;"), `${name} should describe fixed formula group gating`);
  assert.ok(text.includes("&#19979;&#26399;&#19977;&#20013;&#19977;&#25512;&#33616;") || text.includes("三中三推荐"), `${name} should show next-draw three-hit recommendation panel`);
  assert.ok(text.includes("function threeFormulaNextRecommendation"), `${name} should build next-draw three-hit recommendations`);
  assert.ok(text.includes("function threeFormulaOptimizedRecommendation"), `${name} should search optimized formula recommendations by rolling backtest`);
  assert.ok(text.includes("function threeFormulaBacktestCandidate"), `${name} should backtest candidate formulas without future data`);
  assert.ok(text.includes("function threeFormulaWalkForwardRecommendation"), `${name} should build recommendations with walk-forward selection`);
  assert.ok(text.includes("function threeFormulaWalkForwardMetrics"), `${name} should validate optimized formulas without future draw leakage`);
  assert.ok(text.includes("walk-forward"), `${name} should label the optimized recommendation as walk-forward`);
  assert.ok(text.includes("endIndex"), `${name} should score historical picks only from prior draws`);
  assert.ok(text.includes("&#19979;&#26399;6&#30721;&#22797;&#24335;") || text.includes("下期 6 码复式"), `${name} should show next-draw 6-number compound recommendation`);
  assert.ok(text.includes("walk-forward 6&#30721;&#22797;&#24335;") || text.includes("walk-forward 只使用开奖前历史选择公式"), `${name} should show walk-forward 6-number compound recommendation`);
  assert.ok(text.includes("&#20844;&#24335;&#21333;&#24335;&#25512;&#33616;") || text.includes("单式组合"), `${name} should show formula-based single-ticket recommendations`);
  assert.ok(text.includes("walk-forward &#22238;&#27979;") || text.includes("完整回测"), `${name} should show walk-forward backtest hit rate`);
  assert.ok(text.includes("walk-forward &#36817;10&#26399;") || text.includes("近期表现"), `${name} should prioritize recent 10-draw walk-forward hit rate`);
  assert.ok(text.includes("recent10HitRate"), `${name} should compute recent 10-draw metrics`);
  assert.ok(text.includes("&#26368;&#22823;&#36830;&#25346;") || text.includes("最大连挂"), `${name} should show optimized max miss streak`);
  assert.ok(text.includes(".slice(0, 6)"), `${name} should cap compound recommendations to six numbers`);
  assert.ok(text.includes("&#20844;&#24335;&#32452;&#20998;&#23618;"), `${name} should show formula group tiers`);
  assert.ok(text.includes("&#21382;&#21490;&#38383;&#20851;&#22797;&#30424;"), `${name} should show historical gate replay`);
  assert.ok(text.includes("&#31532;&#19968;&#20851; / &#31532;&#20108;&#20851; / &#31532;&#19977;&#20851;"), `${name} should show gate progression metrics`);
  assert.ok(text.includes("same-position-drift"), `${name} should include the same-position drift formula group`);
  assert.ok(text.includes("inner-pair-structure"), `${name} should include the inner pair structure formula group`);
  assert.ok(text.includes("special-anchor"), `${name} should include the special anchor formula group`);
  assert.ok(text.includes("cross-period-mix"), `${name} should include the cross period mix formula group`);
}

console.log("three formula gate html shell ok");
