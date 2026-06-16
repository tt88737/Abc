# Worldcup Review Reason Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the homepage World Cup review summary show the main review reason, not only hit counts.

**Architecture:** Keep completed match review data unchanged. Derive a compact reason string in `worldcupReviewSummary()` from `completedScoreChecks`, render optional `reason` text in `reviewCardHtml()`, and sync the same template change into `build-data.ps1`.

**Tech Stack:** Static HTML, PowerShell generator template, Node assertion tests.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions inside the existing `index.html` / `build-data.ps1` loop:

```js
assert.ok(text.includes("worldcupReviewReason"), `${name} should derive a World Cup review reason`);
assert.ok(text.includes("复盘判断"), `${name} should render review judgement text`);
assert.ok(text.includes("未中原因"), `${name} should explain miss reason in World Cup review`);
assert.ok(text.includes("半中原因"), `${name} should explain partial-hit reason in World Cup review`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-p0-product-dashboard-html.mjs`

Expected: FAIL because `worldcupReviewReason` and `复盘判断` are not implemented yet.

### Task 2: Implement Review Reason Summary

**Files:**
- Modify: `index.html`
- Modify: `build-data.ps1`

- [ ] **Step 1: Add helper**

Add `worldcupReviewReason(completedScoreChecks, counts)` before `worldcupReviewSummary()`.

- [ ] **Step 2: Add reason to World Cup review summary**

Return `reason: worldcupReviewReason(completedScoreChecks, counts)` from `worldcupReviewSummary()`.

- [ ] **Step 3: Render optional review reason**

Add this line inside `reviewCardHtml(card)` after the detail paragraph:

```js
${card.reason ? `<p class="mini">复盘判断：${esc(card.reason)}</p>` : ''}
```

- [ ] **Step 4: Sync generator template**

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
git add index.html build-data.ps1 test-p0-product-dashboard-html.mjs docs/superpowers/plans/2026-06-17-worldcup-review-reason-summary.md
git commit -m "Summarize World Cup review reasons"
git push
```
