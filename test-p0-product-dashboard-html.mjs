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

console.log("p0 product dashboard html ok");
