import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");

assert.ok(html.includes("renderDecisionHome"), "homepage should define a decision-first home renderer");
assert.ok(html.includes("今日重点"), "homepage should expose today's focus");
assert.ok(html.includes("数据健康"), "homepage should expose data health");
assert.ok(html.includes("三中三推荐"), "homepage should expose three-in-three recommendation entry");
assert.ok(html.includes("闯三关判断"), "homepage should expose gate challenge decision entry");
assert.ok(html.includes("世界杯比分"), "homepage should expose World Cup score entry");
assert.ok(html.includes("buildDataHealthCards"), "homepage should calculate data health cards");
assert.ok(html.includes("dataFreshnessState"), "homepage should classify data freshness");
assert.ok(html.includes("sourceHealthCard"), "homepage should derive lottery source health from latest draw date");
assert.ok(html.includes("worldcupHealthCard"), "homepage should derive World Cup health from generated status");
assert.ok(html.includes("可能过期"), "homepage should expose stale data state");
assert.ok(html.includes("未加载"), "homepage should expose unloaded data state");
assert.ok(html.includes("数据源异常"), "homepage should expose data source error state");
assert.ok(html.includes("buildTodayFocusCards"), "homepage should calculate today's focus cards");
assert.ok(html.includes("threeFormulaHomeSummary"), "homepage should summarize real three-in-three recommendation data");
assert.ok(html.includes("gateChallengeHomeSummary"), "homepage should summarize real gate challenge state");
assert.ok(html.includes("worldcupHomeSummary"), "homepage should summarize real World Cup pick counts");
assert.ok(html.includes("threeFormulaGateAnalysis('am')"), "homepage should derive three-in-three summary from existing formula analysis");
assert.ok(html.includes("gateAnalysis('am')"), "homepage should derive gate summary from existing gate analysis");
assert.ok(html.includes("trackedCount"), "homepage should expose World Cup tracked count");
assert.ok(html.includes("复盘摘要"), "homepage should expose review summary");
assert.ok(html.includes("buildReviewSummaryCards"), "homepage should calculate review summary cards");
assert.ok(html.includes("threeFormulaReviewSummary"), "homepage should summarize recent three-in-three review");
assert.ok(html.includes("gateChallengeReviewSummary"), "homepage should summarize gate challenge review");
assert.ok(html.includes("worldcupReviewSummary"), "homepage should summarize World Cup hit review");
assert.ok(html.includes("completedScoreChecks"), "homepage should use World Cup completed score checks for review");

console.log("p0 product dashboard html ok");
