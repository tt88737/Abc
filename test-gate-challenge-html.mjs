import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync("index.html", "utf8");

assert.ok(html.includes('data-tab="gateChallenge"'), "gate challenge tab should be visible in the main menu");
assert.ok(html.includes("function gateDecisionState"), "gate challenge should derive a current decision state");
assert.ok(html.includes("function gateTierLabel"), "gate challenge should classify formulas into main, backup, and excluded tiers");
assert.ok(html.includes("function gateRunReplayRows"), "gate challenge should render historical gate-run replay rows");
assert.ok(html.includes("function gateCurrentAdviceHtml"), "gate challenge should render concrete current advice");
assert.ok(html.includes("gateChallenge: renderGateChallenge"), "gate challenge renderer should be wired to the tab map");

assert.ok(html.includes("&#24403;&#21069;&#38383;&#20851;&#21028;&#26029;"), "gate challenge should show the current gate decision panel");
assert.ok(html.includes("&#20844;&#24335;&#20998;&#23618;"), "gate challenge should show formula tiers");
assert.ok(html.includes("&#21382;&#21490;&#38383;&#19977;&#20851;&#22797;&#30424;"), "gate challenge should show historical three-gate replay");
assert.ok(html.includes("&#26412;&#26399;&#25191;&#34892;&#24314;&#35758;"), "gate challenge should show actionable current-period advice");

assert.ok(html.includes("&#20027;&#20844;&#24335;"), "gate challenge should label the main formula tier");
assert.ok(html.includes("&#22791;&#29992;&#20844;&#24335;"), "gate challenge should label the backup formula tier");
assert.ok(html.includes("&#25490;&#38500;&#20844;&#24335;"), "gate challenge should label formulas that should not be used");
assert.ok(html.includes("&#32487;&#32493; / &#38477;&#27880;&#35266;&#23519; / &#26242;&#20572;"), "gate challenge should expose the decision vocabulary");

assert.ok(html.includes("&#26412;&#26399;&#26159;&#21542;&#36866;&#21512;&#24320;&#31532;&#19968;&#20851;"), "gate challenge should explicitly say whether to start the first gate this period");
assert.ok(html.includes("&#26159;&#21542;&#32493;&#31532;&#20108;&#20851;"), "gate challenge should explicitly say whether to continue to the second gate");
assert.ok(html.includes("&#26159;&#21542;&#20914;&#31532;&#19977;&#20851;"), "gate challenge should explicitly say whether to attack the third gate");
assert.ok(html.includes("&#20027;&#35266;&#23519;&#21495;&#30721;"), "gate challenge should explicitly show main observation numbers");
assert.ok(html.includes("&#25193;&#23637;&#38450;&#23432;&#21495;&#30721;"), "gate challenge should explicitly show defensive extension numbers");
assert.ok(html.includes("&#35302;&#21457;&#26465;&#20214;"), "gate challenge should show trigger conditions");
assert.ok(html.includes("&#26242;&#20572;&#26465;&#20214;"), "gate challenge should show stop conditions");

console.log("gate challenge html optimization shell ok");
