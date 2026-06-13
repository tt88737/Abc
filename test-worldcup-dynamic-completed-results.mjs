import assert from "node:assert/strict";
import fs from "node:fs";

const script = fs.readFileSync("update-worldcup2026-data.mjs", "utf8");
const data = JSON.parse(fs.readFileSync("worldcup2026-live-data.json", "utf8"));

assert.ok(script.includes("async function fetchCompletedWorldCupResults"), "worldcup updater should define a dynamic completed-result fetcher");
assert.ok(script.includes("mergeCompletedWorldCupResults"), "worldcup updater should merge dynamic results with static fallback results");
assert.ok(script.includes("completedResultSource"), "worldcup updater should expose completed-result source diagnostics");
assert.ok(script.includes("scores-fixtures") || script.includes("fifa.com/en/match-centre"), "worldcup updater should query a FIFA score/results endpoint");
assert.ok(script.includes("https://app-live-m.500.com/"), "worldcup updater should query 500 live score data for completed results");
assert.ok(script.includes("fetch500CompletedWorldCupResults"), "worldcup updater should define a 500 completed-result fetcher");
assert.ok(script.includes("parse500CompletedResults"), "worldcup updater should parse completed score records from 500 live data");
assert.ok(script.includes("completedWorldCupResultsFallback"), "static completed results should be kept as fallback, not the only source");
assert.ok(!script.includes("const completedScoreChecks = buildCompletedScoreChecks(completedWorldCupResults);"), "completed score checks should not be built from static results only");
assert.ok(data.status.sources.some(source => /完赛|赛果|比分/.test(source.name)), "generated data should include completed-result source diagnostics");
assert.ok(data.status.sources.some(source => source.url === "https://app-live-m.500.com/" && /500.*(完赛|比分)/.test(source.name)), "generated data should include 500 completed-score source diagnostics");

console.log("worldcup dynamic completed results shell ok");
