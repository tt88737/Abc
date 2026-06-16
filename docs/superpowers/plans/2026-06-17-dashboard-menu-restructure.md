# Dashboard Menu Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce the dashboard top navigation from 10 mixed-priority entries to 5 decision-first entries while preserving all existing low-frequency tools under a new data review hub.

**Architecture:** Keep the existing single-file static dashboard architecture in `index.html`. Add one new renderer, `renderDataReview`, plus a small `topLevelTabFor` mapping so hidden legacy tabs still keep `数据与复盘` highlighted when opened from the hub.

**Tech Stack:** Static HTML, vanilla JavaScript, Node-based structure tests, existing PowerShell smoke tests.

---

### Task 1: Lock Menu Restructure With Tests

**Files:**
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Add failing assertions for the 5 top-level menu model**

Update `test-p0-product-dashboard-html.mjs` after `const html = ...` with this helper:

```js
function topNavHtml() {
  const match = html.match(/<nav class="tabs">([\s\S]*?)<\/nav>/);
  assert.ok(match, "dashboard should render a top tab nav");
  return match[1];
}

const navHtml = topNavHtml();
```

Then add these assertions after the existing menu label assertions:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
```

Expected: FAIL on `top nav should expose only five primary menus` or `dashboard should define a data review hub renderer`.

- [ ] **Step 3: Commit the failing test**

Do not commit a failing test by itself. Keep this change staged or unstaged and continue to Task 2 in the same working tree.

### Task 2: Implement 5 Top-Level Menus And Data Review Hub

**Files:**
- Modify: `index.html`
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Replace top nav buttons**

In `index.html`, replace the current `<nav class="tabs">` button list with:

```html
      <button class="active" data-tab="decisionHome">总控台</button>
      <button data-tab="threeFormulaGate">三中三推荐</button>
      <button data-tab="gateChallenge">闯三关判断</button>
      <button data-tab="worldcupAnalysis">世界杯比分</button>
      <button data-tab="dataReview">数据与复盘</button>
```

- [ ] **Step 2: Add data review card renderer**

Add these functions before `renderDecisionHome()`:

```js
    function dataReviewCards() {
      return [
        {title: '历史规律观察', action: '查看长期规律', detail: '查看长期规律、历史分布和时间段筛选。', tab: 'historyPattern'},
        {title: '推荐跟踪', action: '复盘推荐表现', detail: '跟踪既有推荐在开奖后的命中和遗漏。', tab: 'recommendationTrack'},
        {title: '5期窗口', action: '查看特别号窗口', detail: '查看特别号 5 期窗口覆盖表现。', tab: 'window5'},
        {title: '三中三5期窗口', action: '查看复式池窗口', detail: '查看三中三复式池窗口表现。', tab: 'threeWindow5'},
        {title: '高级分析', action: '查看统计分析', detail: '查看更复杂的规律统计和分布分析。', tab: 'patternWatch'},
        {title: '手动采集', action: '触发数据采集', detail: '生成或触发开奖记录采集任务。', tab: 'manualFetch'}
      ];
    }
    function renderDataReview() {
      const cards = dataReviewCards();
      app.innerHTML = `<div class="grid">
        <section class="panel full">
          <h2>数据与复盘</h2>
          <p class="muted">低频验证、窗口观察、高级分析和数据采集集中在这里。日常判断优先看总控台、三中三、闯三关和世界杯。</p>
        </section>
        ${cards.map(decisionCardHtml).join('')}
      </div>`;
      document.querySelectorAll('.decision-jump').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.targetTab));
      });
    }
```

- [ ] **Step 3: Add top-level tab mapping**

Add this constant before `switchTab(tab)`:

```js
    const topLevelTabFor = {
      historyPattern: 'dataReview',
      recommendationTrack: 'dataReview',
      window5: 'dataReview',
      threeWindow5: 'dataReview',
      patternWatch: 'dataReview',
      manualFetch: 'dataReview'
    };
```

Update the first line of `switchTab(tab)` from:

```js
      tabs.forEach(item => item.classList.toggle('active', item.dataset.tab === tab));
```

to:

```js
      const activeTopTab = topLevelTabFor[tab] || tab;
      tabs.forEach(item => item.classList.toggle('active', item.dataset.tab === activeTopTab));
```

- [ ] **Step 4: Register the data review renderer**

In the `renderers` object, add:

```js
      dataReview: renderDataReview,
```

No `tabDataLoaders.dataReview` entry is required because the hub only renders static cards.

- [ ] **Step 5: Run focused tests**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
node test-three-formula-gate-html.mjs
node test-worldcup-dashboard-html.mjs
```

Expected: all three commands exit with code 0 and print their existing OK messages.

- [ ] **Step 6: Run existing smoke tests**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
```

Expected: both commands exit with code 0.

- [ ] **Step 7: Check whitespace and status**

Run:

```powershell
git diff --check
git status -sb
```

Expected: no whitespace errors. Status should show only `index.html`, `test-p0-product-dashboard-html.mjs`, and this plan file if not already committed.

- [ ] **Step 8: Commit implementation**

Run:

```powershell
git add index.html test-p0-product-dashboard-html.mjs docs/superpowers/plans/2026-06-17-dashboard-menu-restructure.md
git commit -m "Restructure dashboard menu"
```

Expected: commit succeeds.

- [ ] **Step 9: Push all pending commits**

Run:

```powershell
git push
```

Expected: pushes the design doc commit plus the implementation commit to `origin/main`.
