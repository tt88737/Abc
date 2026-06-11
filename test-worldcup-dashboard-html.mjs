import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("worldcup2026-dashboard.html", "utf8");
const indexHtml = fs.readFileSync("index.html", "utf8");

assert.match(html, /<title>[^<]+<\/title>/, "dashboard should have a valid closed title tag");
assert.ok(!html.includes("?/title>"), "dashboard should not contain a broken title close marker");
assert.ok(html.includes("<body>"), "dashboard should contain a body tag");
assert.ok(html.indexOf("<body>") > html.indexOf("</head>"), "body should start after head closes");
assert.ok(html.includes('id="jcMatches"'), "dashboard should include current betting match container");
assert.ok(html.includes('class="decision-grid"'), "dashboard should use a compact decision-first layout");
assert.ok(html.includes('id="reliabilitySummary"'), "dashboard should include reliability summary container");
assert.ok(html.includes("finalPicks"), "dashboard should render final pick tiers from reliability summary");
assert.ok(html.includes("赛前主推候选"), "dashboard should label pre-lineup main picks clearly");
assert.ok(html.includes("等首发确认"), "dashboard should expose lineup confirmation state");
assert.ok(html.includes("观察备选"), "dashboard should label watch picks clearly");
assert.ok(html.includes("比赛可靠性简报"), "dashboard should render reliability brief section");
assert.ok(html.includes('id="comboBrief"'), "dashboard should include a compact combo brief");
assert.ok(html.includes("天气"), "dashboard should expose venue weather context");
assert.ok(html.includes("weather.temperatureC"), "dashboard should render forecast temperature");
assert.ok(html.includes("<details"), "secondary football context should be folded away");
assert.ok(!html.includes('class="side-stack"'), "dashboard should not use the old busy side stack layout");
assert.ok(!html.includes('id="scoreCombos"'), "dashboard should not render the duplicated score combo detail container");
assert.ok(!html.includes("四串一比分推荐"), "dashboard should not render duplicated score combo detail section");
assert.ok(!html.includes("function renderScoreCombos"), "dashboard should not keep duplicated score combo detail renderer");
assert.ok(!html.includes("16注明细"), "dashboard should not expose ticket-level combo details");
assert.ok(!html.includes('class="combo-wrap"'), "dashboard should not keep duplicated combo detail layout");
assert.ok(indexHtml.includes("worldcup-embed-panel"), "main dashboard should use a dedicated worldcup embed panel");
assert.ok(indexHtml.includes("const resizeFrame = () =>"), "main dashboard should resize the worldcup iframe to its rendered content");
assert.ok(indexHtml.includes("scrollHeight"), "worldcup iframe height should be based on child document scroll height");
assert.ok(!indexHtml.includes("min-height: calc(100vh - 190px)"), "worldcup iframe should not keep the old short viewport height");
assert.ok(html.includes(".market-best-row > * { min-width: 0; overflow-wrap: anywhere; }"), "best reliable match rows should wrap instead of being clipped");
assert.ok(html.includes("主推理由"), "dashboard should expose main score rationale");
assert.ok(html.includes("博冷理由"), "dashboard should expose upset score rationale");
assert.ok(html.includes("战术场景"), "dashboard should expose tactical scenario");
assert.ok(html.includes("校验"), "dashboard should expose non-leading market check status");
assert.ok(html.includes("analystVerdict"), "dashboard should render analyst verdict fields");
assert.ok(html.includes('value === "可跟踪"') && html.includes('return "action-bet"'), "trackable action should render with the positive action style");
assert.ok(html.includes('value === "观察"') && html.includes('return "action-watch"'), "watch action should render with the neutral action style");
assert.ok(html.includes('return "action-avoid"'), "avoid action should render with the risk action style");
["SP", "赔率", "盘口", "低赔", "市场风险", "marketSummary", "marketWatch"].forEach(text => {
  assert.ok(!html.includes(text), `dashboard should not expose official-market wording: ${text}`);
});

console.log("worldcup dashboard html shell ok");
