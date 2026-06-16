# Review Summary Sample Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make homepage review summary cards more trustworthy by showing sample size and calculation scope.

**Architecture:** Keep current review summary functions and card layout. Add a `sample` field to each review summary object and render it as `复盘口径：...` in `reviewCardHtml()`. Sync the same change into `build-data.ps1`.

**Tech Stack:** Static HTML, PowerShell generator template, Node assertion tests.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions for both `index.html` and `build-data.ps1`:

```js
assert.ok(text.includes("sample:"), `${name} review summaries should carry sample context`);
assert.ok(text.includes("复盘口径"), `${name} should render review sample context`);
assert.ok(text.includes("最近 10 期"), `${name} should label three-in-three review sample`);
assert.ok(text.includes("全部已识别闯关记录"), `${name} should label gate review sample`);
assert.ok(text.includes("已完赛比分校验"), `${name} should label World Cup review sample`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-p0-product-dashboard-html.mjs`

Expected: FAIL because `sample` and `复盘口径` are not implemented yet.

### Task 2: Implement Sample Context

**Files:**
- Modify: `index.html`
- Modify: `build-data.ps1`

- [ ] **Step 1: Add sample field to review summaries**

Add `sample` to `threeFormulaReviewSummary()`, `gateChallengeReviewSummary()`, and `worldcupReviewSummary()`.

- [ ] **Step 2: Render sample field**

Add this line inside `reviewCardHtml(card)` after the detail paragraph:

```js
${card.sample ? `<p class="mini">复盘口径：${esc(card.sample)}</p>` : ''}
```

- [ ] **Step 3: Sync generator template**

Apply the same changes to `build-data.ps1`.

### Task 3: Verify And Commit

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
git add index.html build-data.ps1 test-p0-product-dashboard-html.mjs docs/superpowers/plans/2026-06-17-review-summary-sample-context.md
git commit -m "Add review summary sample context"
git push
```
