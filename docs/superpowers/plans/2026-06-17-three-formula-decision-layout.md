# Three Formula Decision Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the 三中三推荐专项页 top section from a dense formula table into a decision-first layout with `推荐 / 风险 / 公式来源` sections.

**Architecture:** Keep all existing formula, walk-forward, replay, and table logic in `index.html`. Replace only the top recommendation renderer `threeFormulaCurrentHtml(analysis)` and add small helper functions for signal level, risk text, and formula source rows.

**Tech Stack:** Static HTML, vanilla JavaScript, Node structure tests, existing PowerShell smoke tests.

---

### Task 1: Add Failing Tests For Three Formula Decision Layout

**Files:**
- Modify: `test-three-formula-gate-html.mjs`

- [ ] **Step 1: Add decision-layout assertions**

Inside the existing loop in `test-three-formula-gate-html.mjs`, after:

```js
  assert.ok(text.includes("walk-forward &#36817;10&#26399;") || text.includes("近期表现"), `${name} should prioritize recent 10-draw walk-forward hit rate`);
```

add:

```js
  assert.ok(text.includes("function threeFormulaDecisionLevel"), `${name} should classify three-in-three recommendation signal level`);
  assert.ok(text.includes("function threeFormulaRiskText"), `${name} should explain recommendation risk`);
  assert.ok(text.includes("function threeFormulaSourceRows"), `${name} should render formula source rows`);
  assert.ok(text.includes("推荐"), `${name} should expose a recommendation-first section`);
  assert.ok(text.includes("风险"), `${name} should expose a risk section`);
  assert.ok(text.includes("公式来源"), `${name} should expose a formula-source section`);
  assert.ok(text.includes("信号等级"), `${name} should show recommendation signal level`);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node test-three-formula-gate-html.mjs
```

Expected: FAIL with `should classify three-in-three recommendation signal level`.

### Task 2: Add Three Formula Decision Helpers

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add helper functions before `threeFormulaCurrentHtml(analysis)`**

Insert:

```js
    function threeFormulaDecisionLevel(metrics, nums) {
      const recent10HitRate = Number(metrics?.recent10HitRate || 0);
      const recent10Hits = Number(metrics?.recent10Hits || 0);
      const recent10Total = Number(metrics?.recent10Total || 0);
      const currentMiss = Number(metrics?.currentMiss || 0);
      const maxMiss = Number(metrics?.maxMiss || 0);
      if (!asArray(nums).length) return '暂停';
      if (maxMiss > 0 && currentMiss >= maxMiss) return '暂停';
      if (recent10HitRate >= 0.3 && currentMiss < maxMiss) return '强观察';
      if (recent10Total >= 10 && recent10Hits === 0) return '仅复盘';
      return '弱观察';
    }
    function threeFormulaRiskText(metrics) {
      const currentMiss = Number(metrics?.currentMiss || 0);
      const maxMiss = Number(metrics?.maxMiss || 0);
      const recent10HitRate = Number(metrics?.recent10HitRate || 0);
      if (maxMiss > 0 && currentMiss >= maxMiss) return `当前漏 ${esc(currentMiss)} 已达到最大连挂 ${esc(maxMiss)}，暂停强推荐。`;
      if (recent10HitRate >= 0.3) return `近 10 期 ${gateRate(recent10HitRate)}，当前漏 ${esc(currentMiss)} / 最大连挂 ${esc(maxMiss)}。`;
      return `近 10 期 ${gateRate(recent10HitRate)}，只做弱观察，不做强推荐。`;
    }
    function threeFormulaSourceRows(ranked) {
      return asArray(ranked).slice(0, 6).map(item => `<tr><td>${numberChips([item.num])}</td><td>${esc(asArray(item.formulas).slice(0, 3).join(' / '))}</td></tr>`).join('');
    }
```

### Task 3: Replace The Top Three Formula Recommendation Panel

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace the return template in `threeFormulaCurrentHtml(analysis)`**

Keep the existing variable setup inside the function, but replace:

```js
      const topReasons = recommendation.ranked.slice(0, 6).map(item => `<tr><td>${numberChips([item.num])}</td><td>${esc(item.formulas.slice(0, 3).join(' / '))}</td></tr>`).join('');
      return `<section class="panel full"><h2>...
```

with:

```js
      const metrics = optimized.best?.metrics || {};
      const decisionLevel = threeFormulaDecisionLevel(metrics, optimized.compound);
      const topReasons = threeFormulaSourceRows(recommendation.ranked);
      return `<section class="panel full"><h2>三中三推荐</h2><div class="grid compact-grid">
        <section class="panel wide">
          <h2>推荐</h2>
          <div class="mini ${signalLevelClass(decisionLevel)}">信号等级：${esc(decisionLevel)}</div>
          <div class="metric">${numberChips(optimized.compound)}</div>
          <p class="muted">walk-forward 只使用开奖前历史选择公式；下期最多 6 码复式。</p>
          <div class="table-scroll"><table class="compact-table"><tbody>${optimizedSingles || singles}</tbody></table></div>
        </section>
        <section class="panel">
          <h2>风险</h2>
          <div class="metric ${signalLevelClass(decisionLevel)}">${esc(decisionLevel)}</div>
          <p class="muted">${threeFormulaRiskText(metrics)}</p>
          <p class="mini">完整回测 ${gateRate(metrics.hitRate || 0)}；近 100 期 ${gateRate(metrics.recentHitRate || 0)}。</p>
        </section>
        <section class="panel">
          <h2>公式来源</h2>
          <p class="muted">${optimized.best.name}<br>${esc(optimized.best.id)}</p>
          <details open><summary>号码来源公式</summary><div class="table-scroll"><table class="compact-table"><tbody>${topReasons}</tbody></table></div></details>
        </section>
      </div></section>`;
```

The old secondary rows for backup pools and active pools can be removed from the top recommendation panel because the lower formula tier table still preserves formula details.

### Task 4: Verify And Commit

**Files:**
- Modify: `index.html`
- Modify: `test-three-formula-gate-html.mjs`
- Create: `docs/superpowers/plans/2026-06-17-three-formula-decision-layout.md`

- [ ] **Step 1: Run focused tests**

Run:

```powershell
node test-three-formula-gate-html.mjs
node test-p0-product-dashboard-html.mjs
```

Expected: both commands exit with code 0.

- [ ] **Step 2: Run related smoke tests**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
```

Expected: both commands exit with code 0.

- [ ] **Step 3: Run World Cup shell test**

Run:

```powershell
node test-worldcup-dashboard-html.mjs
```

Expected: exits with code 0.

- [ ] **Step 4: Check diff and whitespace**

Run:

```powershell
git diff --check
git status -sb
```

Expected: no whitespace errors. Status should only include `index.html`, `test-three-formula-gate-html.mjs`, and this plan file.

- [ ] **Step 5: Commit and push**

Run:

```powershell
git add index.html test-three-formula-gate-html.mjs docs/superpowers/plans/2026-06-17-three-formula-decision-layout.md
git commit -m "Clarify three formula decision layout"
git push
```

Expected: commit and push succeed. If push is rejected by an automatic fetch commit, run `git fetch origin`, `git rebase origin/main`, rerun the tests above, then `git push`.
