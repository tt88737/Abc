import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");
const build = fs.readFileSync("build-data.ps1", "utf8");

for (const source of [
  ["index.html", html],
  ["build-data.ps1", build],
]) {
  const [name, text] = source;
  assert.ok(text.includes("function syncStatusPanel"), `${name} should define the shared sync status panel`);
  assert.ok(text.includes("function syncStatusRow"), `${name} should define sync status rows`);
  assert.ok(text.includes("&#31574;&#30053;&#21516;&#27493;&#29366;&#24577;"), `${name} should show strategy sync status`);
  assert.ok(text.includes("&#26368;&#26032;&#25968;&#25454;&#26399;&#21495;"), `${name} should show latest data issue`);
  assert.ok(text.includes("&#19978;&#27425;&#37325;&#31639;&#26399;&#21495;"), `${name} should show last recalculation issue`);
  assert.ok(text.includes("&#19979;&#27425;&#37325;&#31639;&#26399;&#21495;"), `${name} should show next recalculation issue`);
  assert.ok(text.includes("&#26412;&#26399;&#26159;&#21542;&#24050;&#32435;&#20837;"), `${name} should show whether the current draw is included`);
  assert.ok(text.includes("&#27744;&#23376;&#26410;&#21464;&#21407;&#22240;"), `${name} should show why a pool did not change`);
  assert.ok(text.includes("syncStatusPanel('gateChallenge'"), `${name} should wire sync status into gate challenge`);
  assert.ok(!text.includes("syncStatusPanel('window5'"), `${name} should not wire removed 5-window page`);
  assert.ok(!text.includes("syncStatusPanel('historyPattern'"), `${name} should not wire removed history pattern page`);
  assert.ok(!text.includes("syncStatusPanel('recommendationTrack'"), `${name} should not wire removed recommendation tracking`);
}

console.log("strategy sync status html shell ok");
