# Lottery Review Reason Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make 三中三 and 闯三关 homepage review cards show a product judgement, not only metrics.

**Architecture:** Keep existing formulas and metrics unchanged. Add `threeFormulaReviewReason(metrics)` and `gateChallengeReviewReason(all)` helpers, return their text as `reason`, and reuse the existing `reviewCardHtml()` `复盘判断` rendering.

**Tech Stack:** Static HTML, PowerShell generator template, Node assertion tests.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions inside the existing `index.html` / `build-data.ps1` loop:

```js
assert.ok(text.includes("threeFormulaReviewReason"), `${name} should derive a three-in-three review judgement`);
assert.ok(text.includes("gateChallengeReviewReason"), `${name} should derive a gate challenge review judgement`);
assert.ok(text.includes("三中三复盘判断"), `${name} should explain three-in-three review judgement`);
assert.ok(text.includes("闯三关复盘判断"), `${name} should explain gate review judgement`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-p0-product-dashboard-html.mjs`

Expected: FAIL because the two helpers are not implemented yet.

### Task 2: Implement Lottery Review Judgements

**Files:**
- Modify: `index.html`
- Modify: `build-data.ps1`

- [ ] **Step 1: Add helpers**

Add `threeFormulaReviewReason(metrics)` before `threeFormulaReviewSummary()` and `gateChallengeReviewReason(all)` before `gateChallengeReviewSummary()`.

- [ ] **Step 2: Return reason fields**

Add `reason` to both review summary return objects and fallback objects.

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

Expected: all tests pass.

- [ ] **Step 2: Commit and push**

Run:

```powershell
git add index.html build-data.ps1 test-p0-product-dashboard-html.mjs docs/superpowers/plans/2026-06-17-lottery-review-reason-summary.md
git commit -m "Summarize lottery review reasons"
git push
```
