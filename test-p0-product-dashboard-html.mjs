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
const removedTokens = {
  formulaGate: "three" + "FormulaGate",
  formula: "three" + "Formula",
  window: "three" + "Window",
  compound: "three" + "Compound",
  compoundFile: "three" + "-compound",
};

assert.ok(html.includes("renderDecisionHome"), "homepage should define a decision-first home renderer");
assert.equal((navHtml.match(/data-tab=/g) || []).length, 5, "top nav should expose five primary menus");
assert.ok(navHtml.includes('data-tab="decisionHome"'), "top nav should keep decision home");
assert.ok(navHtml.includes('data-tab="gateChallenge"'), "top nav should expose gate challenge decision");
assert.ok(navHtml.includes('data-tab="fixed8Pattern"'), "top nav should expose fixed 8 pattern");
assert.ok(navHtml.includes('data-tab="positionStage8"'), "top nav should expose position stage 8 pattern");
assert.ok(navHtml.includes('data-tab="manualFetch"'), "top nav should expose manual fetch");
assert.ok(!navHtml.includes('data-tab="window5"'), "top nav should not expose removed 5-period window");
assert.ok(!navHtml.includes('data-tab="dataReview"'), "top nav should not expose data review hub");
assert.ok(!navHtml.includes(`data-tab="${removedTokens.formulaGate}"`), "top nav should not expose removed recommendation");
assert.ok(!navHtml.includes('data-tab="worldcupAnalysis"'), "top nav should not expose World Cup scores");

for (const [name, text] of [["index.html", html], ["build-data.ps1", build]]) {
  assert.ok(text.includes('data-tab="decisionHome"'), `${name} should keep decision home`);
  assert.ok(text.includes('data-tab="fixed8Pattern"'), `${name} should expose fixed 8 as a primary menu`);
  assert.ok(text.includes('data-tab="positionStage8"'), `${name} should expose position stage 8 as a primary menu`);
  assert.ok(text.includes('data-tab="manualFetch"'), `${name} should expose manual fetch as a primary menu`);
  assert.ok(text.includes("reviewOnlyReason"), `${name} should carry review-only reasons on data review cards`);
  assert.ok(text.includes("sample:"), `${name} review summaries should carry sample context`);
  assert.ok(text.includes("diagnosis:"), `${name} data health cards should carry diagnosis context`);
  assert.ok(text.includes("gateChallengeHomeSummary"), `${name} should summarize real gate challenge state`);
  assert.ok(text.includes("fixed8HomeSummary"), `${name} should summarize fixed 8 state on the homepage`);
  assert.ok(text.includes("fixed8HomeSummary();"), `${name} should calculate fixed 8 focus state`);
  assert.ok(text.includes("tab: 'fixed8Pattern'"), `${name} should link fixed 8 from today's focus cards`);
  assert.ok(text.includes("gateChallengeReviewSummary"), `${name} should summarize gate challenge review`);
  assert.ok(text.includes("gateChallengeReviewReason"), `${name} should derive a gate challenge review judgement`);

  assert.ok(!text.includes(removedTokens.formula), `${name} should not keep removed formula code`);
  assert.ok(!text.includes(removedTokens.window), `${name} should not keep removed window code`);
  assert.ok(!text.includes(removedTokens.compound), `${name} should not keep removed compound state code`);
  assert.ok(!text.includes(removedTokens.compoundFile), `${name} should not reference removed compound files`);

  assert.ok(!text.includes('data-tab="worldcupAnalysis"'), `${name} should not expose World Cup tab`);
  assert.ok(!text.includes('data-tab="window5"'), `${name} should not expose removed 5-period window`);
  assert.ok(!text.includes("renderWindow5"), `${name} should not render removed 5-period window`);
  assert.ok(!text.includes("data/window5-state"), `${name} should not load removed 5-period window state`);
  assert.ok(!text.includes("__WINDOW5_STATE__"), `${name} should not reference removed 5-period window global`);
  assert.ok(!text.includes("function renderDataReview"), `${name} should not render removed data review hub`);
  assert.ok(!text.includes("renderWorldcupAnalysis"), `${name} should not render World Cup module`);
  assert.ok(!text.includes("worldcup2026-dashboard.html"), `${name} should not embed World Cup dashboard`);
  assert.ok(!text.includes("ensureWorldcupLiveData"), `${name} should not load World Cup data`);
  assert.ok(!text.includes("worldcup2026-live-data"), `${name} should not reference World Cup live data files`);
  assert.ok(!text.includes("WORLDCUP2026_LIVE_DATA"), `${name} should not reference World Cup globals`);
  assert.ok(!text.includes("worldcupHomeSummary"), `${name} should not summarize World Cup picks`);
  assert.ok(!text.includes("worldcupReviewSummary"), `${name} should not summarize World Cup review`);
  assert.ok(!text.includes("worldcupHealthCard"), `${name} should not show World Cup health`);
  assert.ok(!text.includes(".embedded-page"), `${name} should not keep removed embedded page styles`);
}

console.log("p0 product dashboard html ok");
