# Three Formula Observation Scoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an observation-value scoring layer to 三中三 so the page explains whether the next 6-number compound is strong observation, weak observation, review-only, or paused.

**Architecture:** Keep the existing formula generation and walk-forward replay in `index.html`. Add small scoring helpers beside the current `threeFormulaCandidateScore` / `threeFormulaDecisionLevel` functions, then use the scoring result in candidate selection, homepage summary, and the 三中三 page top panel. Sync the same HTML logic into `build-data.ps1` because generated dashboards use that template.

**Tech Stack:** Plain HTML/CSS/JavaScript in `index.html`, PowerShell template sync in `build-data.ps1`, Node.js assertion tests, PowerShell build smoke tests.

---

## File Structure

- Modify `index.html`
  - Add random baseline and observation scoring helpers.
  - Update candidate selection sorting to prefer observation value instead of raw recent-10 rate.
  - Update 三中三 page text to show observation score, edge, risk, and downgrade reason.
  - Keep compound recommendation capped to 6 numbers.
- Modify `build-data.ps1`
  - Mirror the same `index.html` template changes so generated output has the same algorithm and UI.
- Modify `test-three-formula-gate-html.mjs`
  - Add shell assertions for the new helper functions and UI labels in both `index.html` and `build-data.ps1`.
- Modify `test-three-formula-runtime.mjs`
  - Expose new helpers through the VM and assert scoring behavior on controlled metric objects.
- Run existing tests
  - `node test-p0-product-dashboard-html.mjs`
  - `node test-three-formula-gate-html.mjs`
  - `node test-three-formula-runtime.mjs`
  - `node test-worldcup-dashboard-html.mjs`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1`
  - `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1`

## Task 1: Add Failing HTML Coverage

**Files:**
- Modify: `test-three-formula-gate-html.mjs`
- Test: `test-three-formula-gate-html.mjs`

- [ ] **Step 1: Add failing assertions**

Insert these assertions inside the existing `for (const [name, text] of ...)` loop after the current `threeFormulaRiskText` assertion:

```js
  assert.ok(text.includes("function threeFormulaRandomBaseline"), `${name} should calculate the random six-number three-hit baseline`);
  assert.ok(text.includes("function threeFormulaObservationScore"), `${name} should calculate observation value scoring`);
  assert.ok(text.includes("function threeFormulaObservationDecision"), `${name} should classify observation scoring into signal levels`);
  assert.ok(text.includes("observationScore"), `${name} should expose observationScore metrics`);
  assert.ok(text.includes("随机基线") || text.includes("&#38543;&#26426;&#22522;&#32447;"), `${name} should explain the random baseline`);
  assert.ok(text.includes("观察价值") || text.includes("&#35266;&#23519;&#20215;&#20540;"), `${name} should show observation value`);
  assert.ok(text.includes("降级原因") || text.includes("&#38477;&#32423;&#21407;&#22240;"), `${name} should show downgrade reason`);
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
node test-three-formula-gate-html.mjs
```

Expected: FAIL mentioning `threeFormulaRandomBaseline` or another new assertion.

- [ ] **Step 3: Commit failing test**

```powershell
git add test-three-formula-gate-html.mjs
git commit -m "test: cover three formula observation scoring shell"
```

## Task 2: Add Runtime Scoring Tests

**Files:**
- Modify: `test-three-formula-runtime.mjs`
- Test: `test-three-formula-runtime.mjs`

- [ ] **Step 1: Expose helpers in VM**

Replace the current VM export line:

```js
vm.runInContext(`${script}\n;window.__threeFormulaRuntime = {ensureRecordsData, renderThreeFormulaGate};`, context, {filename: 'index.html'});
```

with:

```js
vm.runInContext(`${script}
;window.__threeFormulaRuntime = {
  ensureRecordsData,
  renderThreeFormulaGate,
  threeFormulaRandomBaseline,
  threeFormulaObservationScore,
  threeFormulaObservationDecision
};`, context, {filename: 'index.html'});
```

- [ ] **Step 2: Add failing score assertions**

Add this block before `await context.__threeFormulaRuntime.ensureRecordsData();`:

```js
const baseline = context.__threeFormulaRuntime.threeFormulaRandomBaseline();
assert.ok(baseline > 0.02 && baseline < 0.03, `random baseline should be around 2.4%, got ${baseline}`);

const strongScore = context.__threeFormulaRuntime.threeFormulaObservationScore({
  total: 120,
  hitRate: baseline + 0.08,
  recentTotal: 100,
  recentHitRate: baseline + 0.07,
  recent10Total: 10,
  recent10Hits: 3,
  recent10HitRate: 0.3,
  currentMiss: 1,
  maxMiss: 8
}, ['01', '02', '03', '04', '05', '06']);
assert.equal(strongScore.level, '强观察');
assert.ok(strongScore.observationScore >= 70, `strong observation score should be high, got ${strongScore.observationScore}`);
assert.ok(strongScore.edge > 0, 'strong observation should be above random baseline');

const reviewScore = context.__threeFormulaRuntime.threeFormulaObservationDecision({
  total: 120,
  hitRate: baseline - 0.01,
  recentTotal: 100,
  recentHitRate: baseline - 0.01,
  recent10Total: 10,
  recent10Hits: 0,
  recent10HitRate: 0,
  currentMiss: 3,
  maxMiss: 8
}, ['01', '02', '03', '04', '05', '06']);
assert.equal(reviewScore.level, '仅复盘');
assert.ok(reviewScore.reason.includes('最近窗口 0 命中'));

const pausedScore = context.__threeFormulaRuntime.threeFormulaObservationDecision({
  total: 120,
  hitRate: baseline + 0.04,
  recentTotal: 100,
  recentHitRate: baseline + 0.04,
  recent10Total: 10,
  recent10Hits: 2,
  recent10HitRate: 0.2,
  currentMiss: 8,
  maxMiss: 8
}, ['01', '02', '03', '04', '05', '06']);
assert.equal(pausedScore.level, '暂停');
assert.ok(pausedScore.reason.includes('当前连挂达到历史风险上沿'));
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```powershell
node test-three-formula-runtime.mjs
```

Expected: FAIL because the scoring helpers are not defined.

- [ ] **Step 4: Commit failing runtime test**

```powershell
git add test-three-formula-runtime.mjs
git commit -m "test: cover three formula observation scoring runtime"
```

## Task 3: Implement Scoring Helpers

**Files:**
- Modify: `index.html`
- Test: `test-three-formula-runtime.mjs`

- [ ] **Step 1: Add helpers before `threeFormulaCandidateScore`**

Insert this code immediately before `function threeFormulaCandidateScore(def, metrics) {`:

```js
    function threeFormulaCombination(n, k) {
      if (k < 0 || k > n) return 0;
      const pick = Math.min(k, n - k);
      let out = 1;
      for (let i = 1; i <= pick; i++) out = out * (n - pick + i) / i;
      return out;
    }
    function threeFormulaRandomBaseline() {
      const total = threeFormulaCombination(49, 6);
      let hit = 0;
      for (let k = 3; k <= 6; k++) hit += threeFormulaCombination(6, k) * threeFormulaCombination(43, 6 - k);
      return total ? hit / total : 0;
    }
    function threeFormulaClampScore(value) {
      return Math.max(0, Math.min(100, Math.round(Number(value || 0))));
    }
    function threeFormulaObservationScore(metrics, nums) {
      const baseline = threeFormulaRandomBaseline();
      const hitRate = Number(metrics?.hitRate || 0);
      const recentHitRate = Number(metrics?.recentHitRate || 0);
      const recent10HitRate = Number(metrics?.recent10HitRate || 0);
      const recent10Hits = Number(metrics?.recent10Hits || 0);
      const currentMiss = Number(metrics?.currentMiss || 0);
      const maxMiss = Number(metrics?.maxMiss || 0);
      const count = asArray(nums).length;
      const edge = hitRate - baseline;
      const recentEdge = recentHitRate - baseline;
      const edgeScore = threeFormulaClampScore(50 + edge * 500);
      const recentScore = threeFormulaClampScore(recent10HitRate * 180 + recentEdge * 300 + recent10Hits * 6);
      const riskRatio = maxMiss > 0 ? currentMiss / maxMiss : 0;
      const riskScore = threeFormulaClampScore(100 - riskRatio * 100);
      const stabilityGap = Math.abs(recentHitRate - hitRate);
      const stabilityScore = threeFormulaClampScore(100 - stabilityGap * 250);
      const coverageScore = threeFormulaClampScore(count >= 6 ? 100 : count >= 3 ? 55 : 0);
      const observationScore = threeFormulaClampScore(edgeScore * 0.28 + recentScore * 0.28 + riskScore * 0.22 + stabilityScore * 0.12 + coverageScore * 0.10);
      return {baseline, edge, recentEdge, edgeScore, recentScore, riskScore, stabilityScore, coverageScore, observationScore};
    }
    function threeFormulaObservationDecision(metrics, nums) {
      const score = threeFormulaObservationScore(metrics, nums);
      const count = asArray(nums).length;
      const recent10Total = Number(metrics?.recent10Total || 0);
      const recent10Hits = Number(metrics?.recent10Hits || 0);
      const recent10HitRate = Number(metrics?.recent10HitRate || 0);
      const recentHitRate = Number(metrics?.recentHitRate || 0);
      const currentMiss = Number(metrics?.currentMiss || 0);
      const maxMiss = Number(metrics?.maxMiss || 0);
      if (count < 3) return {...score, level: '暂停', reason: '有效候选号不足 3 个'};
      if (maxMiss > 0 && currentMiss >= maxMiss) return {...score, level: '暂停', reason: '当前连挂达到历史风险上沿'};
      if (recent10Total >= 10 && recent10Hits === 0) return {...score, level: '仅复盘', reason: '最近窗口 0 命中'};
      if (recentHitRate <= score.baseline && recent10HitRate < 0.2) return {...score, level: '仅复盘', reason: '低于随机基线'};
      if (score.observationScore >= 70 && score.edge > 0 && recent10HitRate >= 0.2) return {...score, level: '强观察', reason: '高于随机基线且风险可控'};
      return {...score, level: '弱观察', reason: '有候选号码但观察价值不足'};
    }
```

- [ ] **Step 2: Update `threeFormulaCandidateScore`**

Replace the function body with:

```js
    function threeFormulaCandidateScore(def, metrics, nums = []) {
      const decision = threeFormulaObservationDecision(metrics, nums);
      const levelBonus = decision.level === '强观察' ? 500 : decision.level === '弱观察' ? 180 : decision.level === '仅复盘' ? -120 : -500;
      return decision.observationScore * 10 + levelBonus + metrics.recentHitRate * 200 - metrics.currentMiss * 8 - def.exprs.length * 0.25;
    }
```

- [ ] **Step 3: Run runtime test**

Run:

```powershell
node test-three-formula-runtime.mjs
```

Expected: PASS for scoring helper assertions, or FAIL later if candidate selection still calls the old function signature.

- [ ] **Step 4: Commit helper implementation**

```powershell
git add index.html
git commit -m "feat: add three formula observation scoring"
```

## Task 4: Use Observation Scoring in Candidate Selection

**Files:**
- Modify: `index.html`
- Test: `test-three-formula-runtime.mjs`

- [ ] **Step 1: Update candidate mapping**

Inside `threeFormulaSelectCandidateAt`, replace:

```js
        return {...def, metrics, current, score: threeFormulaCandidateScore(def, metrics)};
```

with:

```js
        const observation = threeFormulaObservationDecision(metrics, current.nums);
        return {...def, metrics, current, observation, score: threeFormulaCandidateScore(def, metrics, current.nums)};
```

- [ ] **Step 2: Update candidate sorting**

Replace the existing one-line sort:

```js
      }).filter(item => item.current.nums.length >= 3).sort((a, b) => b.metrics.recent10HitRate - a.metrics.recent10HitRate || b.score - a.score || b.metrics.recentHitRate - a.metrics.recentHitRate || a.metrics.maxMiss - b.metrics.maxMiss);
```

with:

```js
      }).filter(item => item.current.nums.length >= 3).sort((a, b) => b.score - a.score || b.observation.observationScore - a.observation.observationScore || b.metrics.recentHitRate - a.metrics.recentHitRate || a.metrics.maxMiss - b.metrics.maxMiss);
```

- [ ] **Step 3: Attach current observation to walk-forward recommendation**

Inside `threeFormulaWalkForwardRecommendation`, replace:

```js
      const best = {...selected, metrics: walkMetrics, selectedMetrics: selected.metrics};
```

with:

```js
      const observation = threeFormulaObservationDecision(walkMetrics, selected.current.nums);
      const best = {...selected, metrics: walkMetrics, selectedMetrics: selected.metrics, observation};
```

- [ ] **Step 4: Run runtime test**

Run:

```powershell
node test-three-formula-runtime.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit selection integration**

```powershell
git add index.html
git commit -m "feat: rank three formula candidates by observation value"
```

## Task 5: Update Page Decision Text

**Files:**
- Modify: `index.html`
- Test: `test-three-formula-gate-html.mjs`
- Test: `test-three-formula-runtime.mjs`

- [ ] **Step 1: Replace `threeFormulaDecisionLevel`**

Replace the current function with:

```js
    function threeFormulaDecisionLevel(metrics, nums) {
      return threeFormulaObservationDecision(metrics, nums).level;
    }
```

- [ ] **Step 2: Replace `threeFormulaRiskText`**

Replace the current function with:

```js
    function threeFormulaRiskText(metrics, nums = []) {
      const observation = threeFormulaObservationDecision(metrics, nums);
      const currentMiss = Number(metrics?.currentMiss || 0);
      const maxMiss = Number(metrics?.maxMiss || 0);
      return `降级原因：${esc(observation.reason)}；观察价值 ${esc(observation.observationScore)} / 100；随机基线 ${gateRate(observation.baseline)}；当前连挂 ${esc(currentMiss)} / ${esc(maxMiss)}。`;
    }
```

- [ ] **Step 3: Update risk panel call**

Inside `threeFormulaCurrentHtml`, replace:

```js
          <p class="muted">${threeFormulaRiskText(metrics)}</p>
```

with:

```js
          <p class="muted">${threeFormulaRiskText(metrics, optimized.compound)}</p>
```

- [ ] **Step 4: Add observation value line**

Inside `threeFormulaCurrentHtml`, after:

```js
      const decisionLevel = threeFormulaDecisionLevel(metrics, optimized.compound);
```

add:

```js
      const observation = optimized.best?.observation || threeFormulaObservationDecision(metrics, optimized.compound);
```

Then inside the recommendation panel, after the signal-level `<div>`, add:

```html
          <p class="mini">观察价值：${esc(observation.observationScore)} / 100；优势：${gateRate(Math.max(0, observation.edge))}</p>
```

- [ ] **Step 5: Run tests**

Run:

```powershell
node test-three-formula-gate-html.mjs
node test-three-formula-runtime.mjs
```

Expected: both PASS.

- [ ] **Step 6: Commit UI decision text**

```powershell
git add index.html test-three-formula-gate-html.mjs test-three-formula-runtime.mjs
git commit -m "feat: explain three formula observation value"
```

## Task 6: Sync `build-data.ps1` Template

**Files:**
- Modify: `build-data.ps1`
- Test: `test-three-formula-gate-html.mjs`
- Test: `test-build-three-compound-embed.ps1`

- [ ] **Step 1: Copy the updated dashboard template**

Find the embedded dashboard HTML in `build-data.ps1`. Apply the same function changes made in `index.html`:

- `threeFormulaCombination`
- `threeFormulaRandomBaseline`
- `threeFormulaClampScore`
- `threeFormulaObservationScore`
- `threeFormulaObservationDecision`
- updated `threeFormulaCandidateScore`
- updated `threeFormulaSelectCandidateAt`
- updated `threeFormulaWalkForwardRecommendation`
- updated `threeFormulaDecisionLevel`
- updated `threeFormulaRiskText`
- updated `threeFormulaCurrentHtml`

Use exact same JavaScript text as `index.html` for these functions so the shell test can compare behavior by string presence.

- [ ] **Step 2: Run template tests**

Run:

```powershell
node test-three-formula-gate-html.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
```

Expected: both PASS.

- [ ] **Step 3: Commit template sync**

```powershell
git add build-data.ps1
git commit -m "chore: sync three formula observation scoring template"
```

## Task 7: Full Regression Verification

**Files:**
- No source edits expected.
- Test all relevant dashboard suites.

- [ ] **Step 1: Run Node tests**

```powershell
node test-p0-product-dashboard-html.mjs
node test-three-formula-gate-html.mjs
node test-three-formula-runtime.mjs
node test-gate-challenge-html.mjs
node test-worldcup-dashboard-html.mjs
```

Expected: all PASS.

- [ ] **Step 2: Run PowerShell smoke tests**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
```

Expected: both PASS.

- [ ] **Step 3: Check whitespace and worktree**

```powershell
git diff --check
git status -sb
```

Expected: `git diff --check` has no output. `git status -sb` may still show the pre-existing uncommitted World Cup data files; do not include them in the algorithm commits unless the user explicitly asks.

- [ ] **Step 4: Final implementation commit if needed**

If Task 7 uncovered only test file updates or small fixups, commit them with:

```powershell
git add index.html build-data.ps1 test-three-formula-gate-html.mjs test-three-formula-runtime.mjs
git commit -m "fix: stabilize three formula observation scoring"
```

Skip this commit if there are no changes.

## Self-Review

Spec coverage:

- Observation scoring is implemented in Task 3.
- Random baseline is implemented in Task 3 and covered in Task 2.
- Candidate ranking uses the score in Task 4.
- Page explanation and downgrade reason are implemented in Task 5.
- No-future-data behavior remains based on existing `endIndex` and walk-forward flow; Task 4 preserves that flow.
- Template sync is covered in Task 6.
- Regression coverage is covered in Task 7.

Placeholder scan:

- The plan contains no `TBD`, `TODO`, or open-ended “add proper handling” items.
- Every code-changing step names exact functions and includes concrete code or exact replacement text.

Type consistency:

- `threeFormulaObservationDecision(metrics, nums)` returns `{baseline, edge, recentEdge, edgeScore, recentScore, riskScore, stabilityScore, coverageScore, observationScore, level, reason}`.
- `threeFormulaCandidateScore(def, metrics, nums)` consumes the same decision object.
- `threeFormulaRiskText(metrics, nums)` and `threeFormulaDecisionLevel(metrics, nums)` call the same decision helper.

