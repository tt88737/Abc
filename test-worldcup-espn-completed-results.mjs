import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync("update-worldcup2026-data.mjs", "utf8");
const functionNames = [
  "normalizeName",
  "pickField",
  "collectObjects",
  "canonicalTeamName",
  "parseEspnCompletedResults"
];

const snippets = [
  source.match(/function normalizeName\(value\) \{[\s\S]*?\n\}/)?.[0],
  source.match(/function pickField\(record, keys\) \{[\s\S]*?\n\}/)?.[0],
  source.match(/function collectObjects\(value, out = \[\]\) \{[\s\S]*?\n\}/)?.[0],
  source.match(/const englishTeamNames = \{[\s\S]*?\n\};/)?.[0],
  source.match(/const englishToLocalTeam = new Map[\s\S]*?\]\)\);/)?.[0],
  source.match(/const teamAliasNames = \{[\s\S]*?\n\};/)?.[0],
  source.match(/for \(const \[local, aliases\] of Object\.entries\(teamAliasNames\)\) \{[\s\S]*?\n\}/)?.[0],
  source.match(/function canonicalTeamName\(team\) \{[\s\S]*?\n\}/)?.[0],
  source.match(/function parseEspnCompletedResults\(text\) \{[\s\S]*?\n\}/)?.[0]
];

for (const [index, snippet] of snippets.entries()) {
  assert.ok(snippet, `required snippet ${index + 1} should exist`);
}

const context = {};
vm.createContext(context);
vm.runInContext(`${snippets.join("\n\n")}; globalThis.parseEspnCompletedResults = parseEspnCompletedResults;`, context);

for (const name of functionNames) {
  assert.equal(typeof context[name], "function", `${name} should be defined`);
}

const fixture = {
  events: [
    {
      id: "760415",
      name: "South Africa at Mexico",
      shortName: "RSA @ MEX",
      date: "2026-06-11T19:00Z",
      season: {type: 1},
      competitions: [
        {
          status: {type: {name: "STATUS_FULL_TIME", completed: true}},
          competitors: [
            {homeAway: "home", score: "2", team: {displayName: "Mexico", shortDisplayName: "Mexico"}},
            {homeAway: "away", score: "0", team: {displayName: "South Africa", shortDisplayName: "South Africa"}}
          ]
        }
      ]
    },
    {
      id: "760416",
      name: "Bosnia-Herzegovina at Canada",
      date: "2026-06-12T19:00Z",
      competitions: [
        {
          status: {type: {name: "STATUS_FULL_TIME", completed: true}},
          competitors: [
            {homeAway: "home", score: "1", team: {displayName: "Canada", shortDisplayName: "Canada"}},
            {homeAway: "away", score: "1", team: {displayName: "Bosnia-Herzegovina", shortDisplayName: "Bosnia-Herz"}}
          ]
        }
      ]
    },
    {
      id: "760421",
      name: "Türkiye at Australia",
      date: "2026-06-14T04:00Z",
      competitions: [
        {
          status: {type: {name: "STATUS_FULL_TIME", completed: true}},
          competitors: [
            {homeAway: "home", score: "2", team: {displayName: "Australia", shortDisplayName: "Australia"}},
            {homeAway: "away", score: "0", team: {displayName: "Türkiye", shortDisplayName: "Türkiye"}}
          ]
        }
      ]
    }
  ]
};

const results = context.parseEspnCompletedResults(JSON.stringify(fixture));

assert.equal(results.length, 3, "ESPN completed parser should return finished matches only");
assert.equal(
  JSON.stringify(results.map(item => ({home: item.home, away: item.away, actualScore: item.actualScore}))),
  JSON.stringify([
    {home: "墨西哥", away: "南非", actualScore: "2-0"},
    {home: "加拿大", away: "波黑", actualScore: "1-1"},
    {home: "澳大利亚", away: "土耳其", actualScore: "2-0"}
  ])
);
assert.ok(results.every(item => item.source === "espn-scoreboard-result"), "source should identify ESPN scoreboard");

console.log("worldcup espn completed results parser ok");
