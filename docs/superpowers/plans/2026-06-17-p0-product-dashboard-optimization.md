# P0 Product Dashboard Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the P0 product optimization from `docs/当前项目产品优化方案.md`: a decision-first homepage, clear Three-in-Three recommendation card, gate status card, World Cup priority recommendations, and unified data health hints.

**Architecture:** Keep the current static HTML/data architecture. Add lightweight summary helpers inside `index.html`, reuse existing generated JSON/JS files, and make only minimal additions to `worldcup2026-dashboard.html` for front-loaded World Cup decisions. Do not rewrite data generation in P0 unless a required field is missing.

**Tech Stack:** Static HTML/CSS/vanilla JavaScript, generated JSON/JS data files, PowerShell test scripts, Node.js HTML/runtime tests.

---

## File Structure

| File | Responsibility in this plan |
|---|---|
| `index.html` | Main homepage shell, navigation tabs, lottery decision helpers, Three-in-Three and gate cards |
| `worldcup2026-dashboard.html` | World Cup decision page layout and priority recommendation section |
| `docs/当前项目产品优化方案.md` | Approved product strategy reference |
| `test-dashboard-three-window-ui.ps1` | Existing homepage UI regression check |
| `test-three-formula-gate-html.mjs` | Existing Three-in-Three formula UI regression check |
| `test-worldcup-dashboard-html.mjs` | Existing World Cup dashboard UI regression check |
| `test-p0-product-dashboard-html.mjs` | New P0 product regression test for homepage decision-first structure |

## Scope

### Included

- Homepage total-control dashboard entry experience.
- Unified data health cards for lottery and World Cup data.
- Three-in-Three recommendation card focused on 6-code compound and single combinations.
- Gate status card focused on first/second/third gate state.
- World Cup top section that prioritizes currently trackable matches and risk state.

### Excluded

- Rewriting formula algorithms.
- Changing data collection sources.
- Adding new backend APIs.
- Rebuilding visual design system from scratch.
- Guaranteeing prediction accuracy.

## Task 1: Add P0 Homepage Regression Test

**Files:**
- Create: `test-p0-product-dashboard-html.mjs`
- Read: `index.html`

- [ ] **Step 1: Write the failing test**

Create `test-p0-product-dashboard-html.mjs`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
```

Expected: FAIL because `renderDecisionHome`, `buildDataHealthCards`, or the new labels do not exist yet.

- [ ] **Step 3: Commit only the failing test if desired**

Do not commit yet if working in one task batch. Keep the red test visible.

## Task 2: Add Homepage Decision Tab

**Files:**
- Modify: `index.html`
- Test: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Locate current tab navigation**

Run:

```powershell
rg -n "<nav class=\"tabs\"|data-tab|renderers|switchTab" index.html
```

Expected: shows the navigation around the top of `index.html` and renderer map near the bottom.

- [ ] **Step 2: Add a homepage tab**

In `index.html`, add a first nav button:

```html
<button class="active" data-tab="decisionHome">总控台</button>
```

Keep existing tabs after it. If an existing tab is currently active, remove its initial `active` class so only `decisionHome` starts active.

- [ ] **Step 3: Add renderer map entry**

In the `renderers` object, add:

```js
decisionHome: renderDecisionHome,
```

- [ ] **Step 4: Change default render call**

At the bottom where the initial tab is rendered, change the default from the old first module to:

```js
switchTab("decisionHome");
```

If the file currently calls `switchTab("window5")` or directly renders a module, replace only that default call.

- [ ] **Step 5: Run syntax-oriented checks**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
```

Expected: still FAIL because helper functions and rendered content are not implemented yet.

## Task 3: Add Data Health Helpers

**Files:**
- Modify: `index.html`
- Test: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Add helper functions near existing UI helper functions**

Add the following functions in `index.html` near other shared render helpers:

```js
function formatHealthTime(value) {
  return value ? esc(String(value)) : "-";
}

function sourceLatestText(sourceKey) {
  const bySource = summary?.bySource || {};
  const latest = bySource[sourceKey]?.latest || {};
  return latest.issue ? `${esc(latest.sourceName || sourceKey)} ${esc(latest.issue)}期 / ${esc(latest.date || "-")}` : `${esc(sourceKey)} 暂无最新记录`;
}

function worldcupHealthText() {
  const status = window.WORLDCUP2026_LIVE_DATA?.status || {};
  return status.updatedAtLocal ? `世界杯 ${esc(status.updatedAtLocal)} / ${esc(status.summary || "-")}` : "世界杯数据未加载";
}

function buildDataHealthCards() {
  return [
    {title: "澳门数据", state: summary?.bySource?.am?.latest ? "正常" : "待检查", detail: sourceLatestText("am")},
    {title: "香港数据", state: summary?.bySource?.hk?.latest ? "正常" : "待检查", detail: sourceLatestText("hk")},
    {title: "世界杯数据", state: window.WORLDCUP2026_LIVE_DATA?.status?.updatedAtLocal ? "正常" : "待检查", detail: worldcupHealthText()}
  ];
}
```

- [ ] **Step 2: Run the P0 test**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
```

Expected: still FAIL because `buildTodayFocusCards` and rendered labels are incomplete.

## Task 4: Add Today Focus Helpers

**Files:**
- Modify: `index.html`
- Test: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Add focus helper functions**

Add:

```js
function threeFormulaFocusText() {
  const selected = document.getElementById("three-formula-source")?.value || "am";
  return selected === "hk" ? "香港三中三公式待进入专项页查看" : "澳门三中三公式待进入专项页查看";
}

function gateFocusText() {
  return "按当前关卡判断是否进入第一关、第二关或第三关";
}

function worldcupFocusText() {
  const data = window.WORLDCUP2026_LIVE_DATA || {};
  const summaryText = data.reliabilitySummary?.summaryText || data.status?.summary || "等待世界杯数据刷新";
  return esc(summaryText);
}

function buildTodayFocusCards() {
  return [
    {title: "三中三推荐", action: "查看下期 6 码复式", detail: threeFormulaFocusText(), tab: "threeFormulaGate"},
    {title: "闯三关判断", action: "查看当前关卡", detail: gateFocusText(), tab: "gateChallenge"},
    {title: "世界杯比分", action: "查看可跟踪比赛", detail: worldcupFocusText(), tab: "worldcupAnalysis"}
  ];
}
```

- [ ] **Step 2: Keep helpers conservative**

Do not calculate formula results here yet. The homepage is an entry dashboard; exact recommendations stay inside the specialty tabs.

- [ ] **Step 3: Run the P0 test**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
```

Expected: still FAIL until `renderDecisionHome` exists and emits the labels.

## Task 5: Implement Decision-First Homepage Renderer

**Files:**
- Modify: `index.html`
- Test: `test-p0-product-dashboard-html.mjs`, `test-dashboard-three-window-ui.ps1`

- [ ] **Step 1: Add card rendering helpers**

Add:

```js
function decisionCardHtml(card) {
  return `<article class="panel decision-card" data-target-tab="${esc(card.tab || "")}">
    <h2>${esc(card.title)}</h2>
    <div class="metric">${esc(card.action || "-")}</div>
    <p class="muted">${card.detail || "-"}</p>
    ${card.tab ? `<button class="primary decision-jump" type="button" data-target-tab="${esc(card.tab)}">进入</button>` : ""}
  </article>`;
}

function healthCardHtml(card) {
  const levelClass = card.state === "正常" ? "result-hit" : "result-miss";
  return `<article class="panel">
    <h2>${esc(card.title)}</h2>
    <div class="metric ${levelClass}">${esc(card.state)}</div>
    <p class="muted">${card.detail || "-"}</p>
  </article>`;
}
```

- [ ] **Step 2: Add `renderDecisionHome`**

Add:

```js
function renderDecisionHome() {
  const focusCards = buildTodayFocusCards();
  const healthCards = buildDataHealthCards();
  app.innerHTML = `<div class="grid">
    <section class="panel full">
      <h2>今日重点</h2>
      <p class="muted">先看状态，再进专项页。首页只做决策入口，不展开完整复盘。</p>
    </section>
    ${focusCards.map(decisionCardHtml).join("")}
    <section class="panel full">
      <h2>数据健康</h2>
      <p class="muted">数据异常时，推荐结果自动降级为观察，避免使用旧数据做判断。</p>
    </section>
    ${healthCards.map(healthCardHtml).join("")}
    <section class="panel full">
      <h2>风险提醒</h2>
      <p class="muted">三中三最多展示 6 码复式；闯三关命中后进入下一关，未中重置；世界杯比分只做跟踪和复盘，不保证命中。</p>
    </section>
  </div>`;
  document.querySelectorAll(".decision-jump").forEach(button => {
    button.addEventListener("click", () => switchTab(button.dataset.targetTab));
  });
}
```

- [ ] **Step 3: Add minimal CSS**

Near existing CSS, add:

```css
.decision-card .metric { margin: 8px 0; }
.decision-jump { margin-top: 8px; }
```

If `.primary` already exists, reuse it. If not, add:

```css
button.primary, .primary { background: #0b42d8; color: #fff; border: 1px solid #0b42d8; border-radius: 6px; padding: 8px 12px; cursor: pointer; }
```

- [ ] **Step 4: Run tests**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
```

Expected: both pass.

- [ ] **Step 5: Commit**

Run:

```powershell
git add index.html test-p0-product-dashboard-html.mjs
git commit -m "Add decision-first homepage dashboard"
```

## Task 6: Tighten Three-in-Three Recommendation Card

**Files:**
- Modify: `index.html`
- Test: `test-three-formula-gate-html.mjs`, `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Locate current recommendation block**

Run:

```powershell
rg -n "下期三中三推荐|walk-forward|公式单式推荐|threeFormulaCurrentHtml|threeFormulaOptimizedRecommendation" index.html
```

Expected: finds the existing Three-in-Three formula recommendation HTML around the formula gate renderer.

- [ ] **Step 2: Rename the top recommendation label**

Ensure the visible top section contains:

```html
<h2>三中三推荐</h2>
```

Keep the existing 6-code compound, single combinations, selected formula group, and formula-source details.

- [ ] **Step 3: Add decision wording**

Inside the recommendation table, include these row labels:

```html
<th>下期 6 码复式</th>
<th>单式组合</th>
<th>当前公式组</th>
<th>近期表现</th>
```

Map them to the existing optimized recommendation data:

- `optimized.compound`
- `optimized.singles`
- `optimized.best.name`
- `optimized.best.metrics.recent10HitRate`, `recent10Hits`, `recent10Total`

- [ ] **Step 4: Preserve advanced details**

Keep formula source details inside `<details>` so the main card stays decision-first.

- [ ] **Step 5: Run tests**

Run:

```powershell
node test-three-formula-gate-html.mjs
node test-p0-product-dashboard-html.mjs
```

Expected: both pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add index.html
git commit -m "Clarify three-in-three recommendation card"
```

## Task 7: Tighten Gate Challenge Status Card

**Files:**
- Modify: `index.html`
- Test: `test-dashboard-three-window-ui.ps1`, `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Locate gate renderer**

Run:

```powershell
rg -n "renderGateChallenge|当前闯关判断|当前主观察池|gateCurrentAdviceHtml" index.html
```

- [ ] **Step 2: Rename decision card**

Change the gate top status title to:

```html
<h2>闯三关判断</h2>
```

- [ ] **Step 3: Add explicit state explanation**

Under the gate metric, add copy equivalent to:

```html
<p class="muted">第一关命中后进入第二关，第二关命中后进入第三关；任一关未中则重置观察。</p>
```

- [ ] **Step 4: Add current action labels**

Use existing `decision.label` and `active.current.nums` to show:

```html
<p><strong>当前动作：</strong>${decision.label}</p>
<p><strong>本关号码池：</strong>${numberChips(active?.current?.nums || [])}</p>
```

Do not change the formula calculation.

- [ ] **Step 5: Run tests**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
node test-p0-product-dashboard-html.mjs
```

Expected: both pass.

- [ ] **Step 6: Commit**

Run:

```powershell
git add index.html
git commit -m "Clarify gate challenge decision state"
```

## Task 8: Front-Load World Cup Trackable Matches

**Files:**
- Modify: `worldcup2026-dashboard.html`
- Test: `test-worldcup-dashboard-html.mjs`

- [ ] **Step 1: Add failing assertion to existing test**

In `test-worldcup-dashboard-html.mjs`, add assertions:

```js
assert.ok(html.includes("今日可跟踪比赛"), "World Cup dashboard should front-load trackable matches");
assert.ok(html.includes("renderTrackableMatches"), "World Cup dashboard should render trackable matches separately");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node test-worldcup-dashboard-html.mjs
```

Expected: FAIL until the section and function are added.

- [ ] **Step 3: Add top section in `worldcup2026-dashboard.html`**

Inside the main stack before `完赛比分校验`, add:

```html
<section class="section">
  <div class="section-head"><h2>今日可跟踪比赛</h2><small>可跟踪 / 观察 / 回避</small></div>
  <div class="score-decision-list" id="trackableMatches"></div>
</section>
```

- [ ] **Step 4: Add renderer function**

Add:

```js
function renderTrackableMatches() {
  const target = document.getElementById("trackableMatches");
  if (!target) return;
  const rows = jcMatches
    .filter(item => item.model && item.model.betAction !== "回避")
    .sort((a, b) => Number(b.model?.betScore || 0) - Number(a.model?.betScore || 0))
    .slice(0, 5);
  if (!rows.length) {
    target.innerHTML = `<div class="market-tier-empty">暂无达到可跟踪条件的世界杯比分，当前以观察为主。</div>`;
    return;
  }
  target.innerHTML = rows.map(item => {
    const model = item.model || {};
    return `<article class="score-row">
      <div><strong>${item.matchId || "-"}</strong><div class="note">${item.startTime || ""}</div></div>
      <div><div class="teams">${item.teams || "-"}</div><div class="model-meta"><span class="model-chip action-chip ${actionClass(model.betAction)}">${model.betAction || "观察"}</span><span class="model-chip">评分 ${model.betScore ?? "-"}</span></div></div>
      <div>${scoreSummaryText(item)}</div>
      <div class="score-risk">可靠 ${model.reliability ?? "-"}%<br>平局 ${Math.round((model.drawProbability || 0) * 100)}%</div>
      <div><div class="reason-lines"><span><b>主因</b> ${model.scoreRationale?.main || model.reason || "-"}</span><span><b>风险</b> ${model.risk || "-"}</span></div></div>
    </article>`;
  }).join("");
}
```

- [ ] **Step 5: Call renderer**

Where other render functions are called after data load, add:

```js
renderTrackableMatches();
```

- [ ] **Step 6: Run tests**

Run:

```powershell
node test-worldcup-dashboard-html.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add worldcup2026-dashboard.html test-worldcup-dashboard-html.mjs
git commit -m "Front-load World Cup trackable matches"
```

## Task 9: Final Verification

**Files:**
- Read/verify: all modified files

- [ ] **Step 1: Run full relevant test set**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
node test-three-formula-gate-html.mjs
node test-worldcup-dashboard-html.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
```

Expected: all commands exit 0.

- [ ] **Step 2: Check git status**

Run:

```powershell
git status --short
```

Expected: no uncommitted changes from P0 work. If generated World Cup data files are still modified from previous sync runs, do not include them unless the task explicitly regenerated them.

- [ ] **Step 3: Push**

Run:

```powershell
git push origin main
```

Expected: push succeeds. If rejected, run `git fetch origin main`, rebase, rerun tests, and push again.

## Self-Review Notes

- Spec coverage: P0 homepage, Three-in-Three recommendation, gate state, World Cup priority matches, and data health are all covered.
- No algorithm rewrites are included.
- No backend/API/database changes are included.
- The plan uses existing files and existing test style.
