# Data Review Reason Template Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add review-only reasons to the 数据与复盘 hub and keep the generated dashboard template in `build-data.ps1` synchronized with the current product layout.

**Architecture:** Keep the current static dashboard architecture. Add `reviewOnlyReason` fields to data-review cards, render them in the shared card component, then mechanically sync the `New-DashboardHtml` here-string in `build-data.ps1` from `index.html`.

**Tech Stack:** Static HTML, PowerShell generator template, Node assertion tests.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions for both `index.html` and `build-data.ps1`:

```js
const build = fs.readFileSync("build-data.ps1", "utf8");

for (const [name, text] of [["index.html", html], ["build-data.ps1", build]]) {
  assert.ok(text.includes('data-tab="decisionHome"'), `${name} should keep the five-menu decision home`);
  assert.ok(text.includes('data-tab="dataReview"'), `${name} should keep the data review hub`);
  assert.ok(text.includes("function renderDataReview"), `${name} should render the data review hub`);
  assert.ok(text.includes("reviewOnlyReason"), `${name} should carry review-only reasons on data review cards`);
  assert.ok(text.includes("仅复盘原因"), `${name} should show why low-frequency tools are review-only`);
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-p0-product-dashboard-html.mjs`

Expected: FAIL because `reviewOnlyReason` is missing and `build-data.ps1` is stale.

### Task 2: Implement Review-Only Reasons

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Render reason in cards**

Add this line inside `decisionCardHtml(card)` after the existing detail paragraph:

```js
${card.reviewOnlyReason ? `<p class="mini">仅复盘原因：${esc(card.reviewOnlyReason)}</p>` : ''}
```

- [ ] **Step 2: Add reasons to data review cards**

Add `reviewOnlyReason` to each item returned by `dataReviewCards()`.

### Task 3: Sync Build Template

**Files:**
- Modify: `build-data.ps1`

- [ ] **Step 1: Replace `New-DashboardHtml` here-string**

Mechanically replace the here-string content in `build-data.ps1` with the current `index.html` content after Task 2.

### Task 4: Verify And Commit

**Files:**
- Test: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Run full verification**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
node test-three-formula-gate-html.mjs
node test-worldcup-dashboard-html.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
git diff --check
git status -sb
```

Expected: all tests pass and only intended files are modified.

- [ ] **Step 2: Commit and push**

Run:

```powershell
git add index.html build-data.ps1 test-p0-product-dashboard-html.mjs docs/superpowers/plans/2026-06-17-data-review-reason-template-sync.md
git commit -m "Explain data review-only tools"
git push
```
