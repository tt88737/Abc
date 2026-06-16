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
assert.ok(html.includes("buildTodayFocusCards"), "homepage should calculate today's focus cards");
assert.ok(html.includes("threeFormulaHomeSummary"), "homepage should summarize real three-in-three recommendation data");
assert.ok(html.includes("gateChallengeHomeSummary"), "homepage should summarize real gate challenge state");
assert.ok(html.includes("worldcupHomeSummary"), "homepage should summarize real World Cup pick counts");
assert.ok(html.includes("threeFormulaGateAnalysis('am')"), "homepage should derive three-in-three summary from existing formula analysis");
assert.ok(html.includes("gateAnalysis('am')"), "homepage should derive gate summary from existing gate analysis");
assert.ok(html.includes("trackedCount"), "homepage should expose World Cup tracked count");

console.log("p0 product dashboard html ok");
