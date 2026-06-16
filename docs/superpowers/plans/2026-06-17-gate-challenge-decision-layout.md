# Gate Challenge Decision Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the 闯三关 page show explicit first, second, and third gate actions instead of a dense generic advice table.

**Architecture:** Keep existing formula and replay logic unchanged. Add one small rendering helper that derives row-level action labels from the existing active formula stage and decision state, then use it inside the current advice panel. Mirror the same HTML template change in `build-data.ps1`.

**Tech Stack:** Static `index.html`, PowerShell HTML generator template, Node assertion tests.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `test-three-formula-gate-html.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions inside the existing loop:

```js
  assert.ok(text.includes("function gateChallengeDecisionRows"), `${name} should render gate action rows for each checkpoint`);
  assert.ok(text.includes("&#26159;&#21542;&#24320;&#31532;&#19968;&#20851;") || text.includes("是否开第一关"), `${name} should show whether to open the first gate`);
  assert.ok(text.includes("&#26159;&#21542;&#32493;&#31532;&#20108;&#20851;") || text.includes("是否续第二关"), `${name} should show whether to continue the second gate`);
  assert.ok(text.includes("&#26159;&#21542;&#20914;&#31532;&#19977;&#20851;") || text.includes("是否冲第三关"), `${name} should show whether to attempt the third gate`);
  assert.ok(text.includes("&#24403;&#21069;&#21160;&#20316;") || text.includes("当前动作"), `${name} should show the current action`);
  assert.ok(text.includes("&#26242;&#20572;&#65292;&#19981;&#24320;&#31532;&#19968;&#20851;") || text.includes("暂停，不开第一关"), `${name} should expose an explicit first-gate pause action`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-three-formula-gate-html.mjs`

Expected: FAIL because `gateChallengeDecisionRows` is not implemented yet.

### Task 2: Implement Decision Rows

**Files:**
- Modify: `index.html`
- Modify: `build-data.ps1`

- [ ] **Step 1: Add helper**

Add `gateChallengeDecisionRows(active, decision)` after `gateCurrentAdviceHtml` dependencies and before it is used. It should return table rows for:

```js
是否开第一关
是否续第二关
是否冲第三关
当前动作
```

- [ ] **Step 2: Update current advice panel**

Change `gateCurrentAdviceHtml(analysis)` to use `gateChallengeDecisionRows(active, decision)` before the number-pool rows.

- [ ] **Step 3: Mirror generator template**

Copy the same helper and panel change into `build-data.ps1` so future data builds preserve the layout.

### Task 3: Verify And Commit

**Files:**
- Test: `test-three-formula-gate-html.mjs`
- Test: `test-p0-product-dashboard-html.mjs`
- Test: `test-worldcup-dashboard-html.mjs`

- [ ] **Step 1: Run focused test**

Run: `node test-three-formula-gate-html.mjs`

Expected: PASS.

- [ ] **Step 2: Run full dashboard verification**

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

Expected: all tests pass and only intended files are modified before commit.

- [ ] **Step 3: Commit and push**

Run:

```powershell
git add index.html build-data.ps1 test-three-formula-gate-html.mjs docs/superpowers/plans/2026-06-17-gate-challenge-decision-layout.md
git commit -m "Clarify gate challenge decisions"
git push
```
