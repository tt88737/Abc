# Data Health Diagnosis Context Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make homepage data health cards explain the diagnosis scope without adding another noisy module.

**Architecture:** Keep the existing data health cards. Add a `diagnosis` field to lottery and World Cup health cards and render it as `诊断口径：...` in `healthCardHtml()`. Sync the same HTML template change into `build-data.ps1`.

**Tech Stack:** Static HTML, PowerShell generator template, Node assertion tests.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions inside the existing `index.html` / `build-data.ps1` loop:

```js
assert.ok(text.includes("diagnosis:"), `${name} data health cards should carry diagnosis context`);
assert.ok(text.includes("诊断口径"), `${name} should render data health diagnosis context`);
assert.ok(text.includes("最新开奖日期，超过 2 天标记可能过期"), `${name} should explain lottery freshness diagnosis`);
assert.ok(text.includes("世界杯更新时间，超过 1 天标记可能过期"), `${name} should explain World Cup freshness diagnosis`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-p0-product-dashboard-html.mjs`

Expected: FAIL because `diagnosis` and `诊断口径` are not implemented yet.

### Task 2: Implement Diagnosis Context

**Files:**
- Modify: `index.html`
- Modify: `build-data.ps1`

- [ ] **Step 1: Add diagnosis field**

Update `sourceHealthCard()` and `worldcupHealthCard()` to return a `diagnosis` string.

- [ ] **Step 2: Render diagnosis**

Add this line inside `healthCardHtml(card)` after the detail paragraph:

```js
${card.diagnosis ? `<p class="mini">诊断口径：${esc(card.diagnosis)}</p>` : ''}
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

Expected: all tests pass. Existing generated World Cup data changes may remain unstaged and should not be included in this commit.

- [ ] **Step 2: Commit and push**

Run:

```powershell
git add index.html build-data.ps1 test-p0-product-dashboard-html.mjs docs/superpowers/plans/2026-06-17-data-health-diagnosis-context.md
git commit -m "Add data health diagnosis context"
git push
```
