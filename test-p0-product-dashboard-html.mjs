import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const build = fs.readFileSync("build-data.ps1", "utf8");

function topNavHtml() {
  const match = html.match(/<nav class="tabs">([\s\S]*?)<\/nav>/);
  assert.ok(match, "dashboard should render a top tab nav");
  return match[1];
}

const navHtml = topNavHtml();

assert.ok(html.includes("renderDecisionHome"), "homepage should define a decision-first home renderer");
assert.ok(html.includes("今日重点"), "homepage should expose today's focus");
assert.ok(html.includes("数据健康"), "homepage should expose data health");
assert.ok(html.includes("三中三推荐"), "homepage should expose three-in-three recommendation entry");
assert.ok(html.includes("闯三关判断"), "homepage should expose gate challenge decision entry");
assert.ok(html.includes("世界杯比分"), "homepage should expose World Cup score entry");
assert.equal((navHtml.match(/data-tab=/g) || []).length, 5, "top nav should expose only five primary menus");
assert.ok(navHtml.includes('data-tab="decisionHome"'), "top nav should keep decision home");
assert.ok(navHtml.includes('data-tab="threeFormulaGate"'), "top nav should expose three-in-three recommendation");
assert.ok(navHtml.includes('data-tab="gateChallenge"'), "top nav should expose gate challenge decision");
assert.ok(navHtml.includes('data-tab="worldcupAnalysis"'), "top nav should expose World Cup scores");
assert.ok(navHtml.includes('data-tab="dataReview"'), "top nav should expose data review hub");
assert.ok(!navHtml.includes('data-tab="historyPattern"'), "history pattern should move under data review");
assert.ok(!navHtml.includes('data-tab="recommendationTrack"'), "recommendation tracking should move under data review");
assert.ok(!navHtml.includes('data-tab="window5"'), "5-period window should move under data review");
assert.ok(!navHtml.includes('data-tab="threeWindow5"'), "three-in-three 5-period window should move under data review");
assert.ok(!navHtml.includes('data-tab="patternWatch"'), "advanced analysis should move under data review");
assert.ok(!navHtml.includes('data-tab="manualFetch"'), "manual fetch should move under data review");
assert.ok(html.includes("renderDataReview"), "dashboard should define a data review hub renderer");
assert.ok(html.includes("dataReviewCards"), "data review hub should list legacy review and data tools");
assert.ok(html.includes("topLevelTabFor"), "dashboard should map hidden legacy tabs to top-level nav state");
assert.ok(html.includes("buildDataHealthCards"), "homepage should calculate data health cards");
assert.ok(html.includes("dataFreshnessState"), "homepage should classify data freshness");
assert.ok(html.includes("sourceHealthCard"), "homepage should derive lottery source health from latest draw date");
assert.ok(html.includes("worldcupHealthCard"), "homepage should derive World Cup health from generated status");
assert.ok(html.includes("ensureWorldcupLiveData"), "homepage should load World Cup live data before rendering summary cards");
assert.ok(html.includes("worldcup2026-live-data.json"), "homepage should load World Cup JSON data directly");
assert.ok(html.includes("worldcup2026-live-data.js"), "homepage should fall back to World Cup script data");
assert.ok(html.includes("可能过期"), "homepage should expose stale data state");
assert.ok(html.includes("未加载"), "homepage should expose unloaded data state");
assert.ok(html.includes("数据源异常"), "homepage should expose data source error state");
assert.ok(html.includes("buildTodayFocusCards"), "homepage should calculate today's focus cards");
assert.ok(html.includes("signalLevelClass"), "homepage should style cards by signal level");
assert.ok(html.includes("buildTodaySignalAdvice"), "homepage should calculate a single daily signal advice");
assert.ok(html.includes("今日总建议"), "homepage should expose the daily signal advice");
assert.ok(html.includes("signalLevel"), "homepage cards should carry a signalLevel field");
assert.ok(html.includes("强观察"), "homepage should expose strong-watch signal level");
assert.ok(html.includes("弱观察"), "homepage should expose weak-watch signal level");
assert.ok(html.includes("仅复盘"), "homepage should expose review-only signal level");
assert.ok(html.includes("暂停"), "homepage should expose pause signal level");
assert.ok(html.includes("recent10HitRate"), "three-in-three signal should use recent 10-period hit rate");
assert.ok(html.includes("currentMiss >= maxMiss"), "three-in-three signal should pause when current miss reaches historical max");
assert.ok(html.includes("recentPass3Rate"), "gate challenge signal should use recent third-stage pass rate");
assert.ok(html.includes("trackedCount > 0"), "World Cup signal should promote tracked matches");
assert.ok(html.includes("watchCount > 0"), "World Cup signal should downgrade watch-only matches");
assert.ok(html.includes("threeFormulaHomeSummary"), "homepage should summarize real three-in-three recommendation data");
assert.ok(html.includes("gateChallengeHomeSummary"), "homepage should summarize real gate challenge state");
assert.ok(html.includes("return {label: '暂停'"), "gate challenge decision label should render as Chinese text, not escaped HTML entities");
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

for (const [name, text] of [["index.html", html], ["build-data.ps1", build]]) {
  assert.ok(text.includes('data-tab="decisionHome"'), `${name} should keep the five-menu decision home`);
  assert.ok(text.includes('data-tab="dataReview"'), `${name} should keep the data review hub`);
  assert.ok(text.includes("function renderDataReview"), `${name} should render the data review hub`);
  assert.ok(text.includes("reviewOnlyReason"), `${name} should carry review-only reasons on data review cards`);
  assert.ok(text.includes("仅复盘原因"), `${name} should show why low-frequency tools are review-only`);
  assert.ok(text.includes("sample:"), `${name} review summaries should carry sample context`);
  assert.ok(text.includes("复盘口径"), `${name} should render review sample context`);
  assert.ok(text.includes("最近 10 期"), `${name} should label three-in-three review sample`);
  assert.ok(text.includes("全部已识别闯关记录"), `${name} should label gate review sample`);
  assert.ok(text.includes("已完赛比分校验"), `${name} should label World Cup review sample`);
}

console.log("p0 product dashboard html ok");
