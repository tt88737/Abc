# Worldcup Trackable First Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the World Cup score dashboard default to trackable matches only, with watch and avoid matches folded into secondary panels.

**Architecture:** Keep the existing static `worldcup2026-dashboard.html` and model data unchanged. Split the current mixed top list into action buckets from `jcMatches`: default visible rows for `可跟踪`, and collapsed `<details>` sections for `观察` and `回避`.

**Tech Stack:** Static HTML, inline JavaScript renderer, Node assertion tests.

---

### Task 1: Add Regression Coverage

**Files:**
- Modify: `test-worldcup-dashboard-html.mjs`

- [ ] **Step 1: Write the failing test**

Add assertions:

```js
assert.ok(html.includes('id="trackableOnlyMatches"'), "dashboard should use a dedicated visible container for trackable matches");
assert.ok(html.includes('id="watchMatches"'), "dashboard should keep watch matches in a secondary container");
assert.ok(html.includes('id="avoidMatches"'), "dashboard should keep avoid matches in a secondary container");
assert.ok(html.includes('<details class="reference-panel worldcup-secondary-tier">'), "watch and avoid tiers should be folded by default");
assert.ok(html.includes('model.betAction === "可跟踪"'), "top trackable list should only show trackable matches");
assert.ok(html.includes('model.betAction === "观察"'), "watch list should only show watch matches");
assert.ok(html.includes('model.betAction === "回避"'), "avoid list should only show avoid matches");
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node test-worldcup-dashboard-html.mjs`

Expected: FAIL because these containers and exact filters do not exist yet.

### Task 2: Implement Trackable First Buckets

**Files:**
- Modify: `worldcup2026-dashboard.html`

- [ ] **Step 1: Update top section markup**

Replace the single `trackableMatches` container with:

```html
<div class="score-decision-list" id="trackableOnlyMatches"></div>
<details class="reference-panel worldcup-secondary-tier">
  <summary>观察比赛<small>默认收起，只在复盘或等待首发时查看</small></summary>
  <div class="score-decision-list" id="watchMatches"></div>
</details>
<details class="reference-panel worldcup-secondary-tier">
  <summary>回避比赛<small>默认收起，只看风险原因</small></summary>
  <div class="score-decision-list" id="avoidMatches"></div>
</details>
```

- [ ] **Step 2: Split rendering logic**

Keep `renderTrackableMatches()` as the public renderer, but have it call a shared row builder and fill:

```js
const trackableRows = ordered.filter(item => item.model && item.model.betAction === "可跟踪").slice(0, 5);
const watchRows = ordered.filter(item => item.model && item.model.betAction === "观察").slice(0, 8);
const avoidRows = ordered.filter(item => item.model && item.model.betAction === "回避").slice(0, 8);
```

- [ ] **Step 3: Preserve empty states**

Each bucket must show a short empty state when no rows exist.

### Task 3: Verify And Commit

**Files:**
- Test: `test-worldcup-dashboard-html.mjs`

- [ ] **Step 1: Run focused test**

Run: `node test-worldcup-dashboard-html.mjs`

Expected: PASS.

- [ ] **Step 2: Run full verification**

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

- [ ] **Step 3: Commit and push**

Run:

```powershell
git add worldcup2026-dashboard.html test-worldcup-dashboard-html.mjs docs/superpowers/plans/2026-06-17-worldcup-trackable-first-layout.md
git commit -m "Prioritize trackable World Cup matches"
git push
```
