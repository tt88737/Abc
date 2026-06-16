# Signal Convergence Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a unified homepage signal layer so 三中三、闯三关、世界杯 each show `强观察 / 弱观察 / 仅复盘 / 暂停`, and the homepage gives one clear `今日总建议`.

**Architecture:** Keep the existing static `index.html` dashboard and add a product judgement layer above existing data functions. The implementation only changes homepage summary/card rendering; it does not modify formulas, gate analysis, World Cup model, collection logic, or detail pages.

**Tech Stack:** Static HTML, vanilla JavaScript, Node-based HTML structure tests, existing PowerShell smoke tests.

---

### Task 1: Add Failing Tests For Homepage Signal Layer

**Files:**
- Modify: `test-p0-product-dashboard-html.mjs`

- [ ] **Step 1: Add signal convergence assertions**

Add these assertions after the existing line:

```js
assert.ok(html.includes("buildTodayFocusCards"), "homepage should calculate today's focus cards");
```

Insert:

```js
assert.ok(html.includes("signalLevelClass"), "homepage should style cards by signal level");
assert.ok(html.includes("buildTodaySignalAdvice"), "homepage should calculate a single daily signal advice");
assert.ok(html.includes("今日总建议"), "homepage should expose the daily signal advice");
assert.ok(html.includes("signalLevel"), "homepage cards should carry a signalLevel field");
assert.ok(html.includes("强观察"), "homepage should expose strong-watch signal level");
assert.ok(html.includes("弱观察"), "homepage should expose weak-watch signal level");
assert.ok(html.includes("仅复盘"), "homepage should expose review-only signal level");
assert.ok(html.includes("暂停"), "homepage should expose pause signal level");
assert.ok(html.includes("recent10HitRate"), "three-in-three signal should use recent 10-period hit rate");
assert.ok(html.includes("currentMiss >= maxMiss"), "three-in-three signal should pause when current miss reaches historical max");
assert.ok(html.includes("recentPass3Rate"), "gate challenge signal should use recent third-stage pass rate");
assert.ok(html.includes("trackedCount > 0"), "World Cup signal should promote tracked matches");
assert.ok(html.includes("watchCount > 0"), "World Cup signal should downgrade watch-only matches");
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
```

Expected: FAIL with `homepage should style cards by signal level` or `homepage should calculate a single daily signal advice`.

### Task 2: Implement Signal Levels In Homepage Summaries

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add signal level helpers**

Add these helper functions before `threeFormulaHomeSummary()`:

```js
    function signalLevelClass(level) {
      if (level === '强观察') return 'result-hit';
      if (level === '暂停') return 'result-miss';
      if (level === '仅复盘') return 'muted';
      return '';
    }
    function signalBadgeHtml(level) {
      return `<div class="mini ${signalLevelClass(level)}">信号等级：${esc(level || '弱观察')}</div>`;
    }
```

- [ ] **Step 2: Update `threeFormulaHomeSummary()` to return `signalLevel` and `reason`**

Replace the object returned inside the `try` block with:

```js
        const recent10HitRate = Number(metrics.recent10HitRate || 0);
        const recent10Hits = Number(metrics.recent10Hits || 0);
        const recent10Total = Number(metrics.recent10Total || 0);
        const currentMiss = Number(metrics.currentMiss || 0);
        const maxMiss = Number(metrics.maxMiss || 0);
        let signalLevel = '弱观察';
        if (maxMiss > 0 && currentMiss >= maxMiss) signalLevel = '暂停';
        else if (recent10HitRate >= 0.3 && currentMiss < maxMiss) signalLevel = '强观察';
        else if (recent10Total >= 10 && recent10Hits === 0) signalLevel = '仅复盘';
        else if (!nums.length) signalLevel = '暂停';
        return {
          signalLevel,
          action: nums.length ? `下期 6 码：${nums.join(' ')}` : '查看下期 6 码复式',
          detail: `当前公式组：${optimized.best?.name || '-'}；近 10 期 ${gateRate(recent10HitRate)}，命中 ${esc(recent10Hits)} / ${esc(recent10Total)}`,
          reason: `当前漏 ${esc(currentMiss)} / 最大连挂 ${esc(maxMiss)}`
        };
```

Replace the `catch` return with:

```js
        return {signalLevel: '暂停', action: '查看下期 6 码复式', detail: '进入专项页查看下期 6 码复式、单式组合和当前公式组。', reason: '三中三数据或公式暂不可用'};
```

- [ ] **Step 3: Update `gateChallengeHomeSummary()` to return `signalLevel` and `reason`**

Inside the `try` block, after `const nums = ...`, add:

```js
        const stage = Number(active?.all?.stage || 0);
        const recentPass3Rate = Number(active?.recent?.pass3Rate || 0);
        let signalLevel = '暂停';
        if (stage >= 2) signalLevel = '强观察';
        else if (stage >= 1 || recentPass3Rate >= 0.25) signalLevel = '弱观察';
```

Replace the returned object with:

```js
        return {
          signalLevel,
          action: decision.label || '查看当前关卡',
          detail: `本关号码池：${nums.join(' ') || '-'}；命中进下一关，未中重置观察。`,
          reason: `当前连续命中 ${esc(stage)} 关；近期第三关 ${gateRate(recentPass3Rate)}`
        };
```

Replace the `catch` return with:

```js
        return {signalLevel: '暂停', action: '查看当前关卡', detail: '按当前关卡判断第一关、第二关、第三关，未中后重置观察。', reason: '闯三关数据或公式暂不可用'};
```

- [ ] **Step 4: Update `worldcupHomeSummary()` to return `signalLevel` and `reason`**

After `const avoidCount = ...`, add:

```js
      const status = data.status || {};
      let signalLevel = '仅复盘';
      if (!status.updatedAtLocal || status.error || status.lastError) signalLevel = '暂停';
      else if (trackedCount > 0) signalLevel = '强观察';
      else if (watchCount > 0) signalLevel = '弱观察';
```

Replace the returned object with:

```js
      return {
        signalLevel,
        action: `可跟踪 ${trackedCount} 场 / 观察 ${watchCount} 场`,
        detail: `${summary.summaryText || data.status?.summary || '等待世界杯数据刷新'}；回避 ${avoidCount} 场。`,
        reason: `可跟踪 ${trackedCount}，观察 ${watchCount}，回避 ${avoidCount}`
      };
```

### Task 3: Render Daily Advice And Signal Badges

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Add `buildTodaySignalAdvice()`**

Add this function before `buildTodayFocusCards()`:

```js
    function buildTodaySignalAdvice(cards) {
      const strong = cards.filter(card => card.signalLevel === '强观察');
      const weak = cards.filter(card => card.signalLevel === '弱观察');
      const paused = cards.filter(card => card.signalLevel === '暂停');
      if (strong.length) return {level: '强观察', text: `今日优先观察：${strong.map(card => card.title).join('、')}`};
      if (weak.length) return {level: '弱观察', text: `今日仅弱观察：${weak.map(card => card.title).join('、')}`};
      if (paused.length) return {level: '暂停', text: '数据异常或条件不足，暂停推荐判断'};
      return {level: '仅复盘', text: '今日无强信号，建议只看复盘'};
    }
```

- [ ] **Step 2: Include `signalLevel` and `reason` in focus cards**

Replace the array returned by `buildTodayFocusCards()` with:

```js
      return [
        {title: '三中三推荐', signalLevel: threeSummary.signalLevel, action: threeSummary.action, detail: threeSummary.detail, reason: threeSummary.reason, tab: 'threeFormulaGate'},
        {title: '闯三关判断', signalLevel: gateSummary.signalLevel, action: gateSummary.action, detail: gateSummary.detail, reason: gateSummary.reason, tab: 'gateChallenge'},
        {title: '世界杯比分', signalLevel: cupSummary.signalLevel, action: cupSummary.action, detail: cupSummary.detail, reason: cupSummary.reason, tab: 'worldcupAnalysis'}
      ];
```

- [ ] **Step 3: Update `decisionCardHtml(card)`**

Replace the function body template with:

```js
      const buttonText = card.signalLevel === '暂停' ? '查看原因' : '进入';
      return `<article class="panel decision-card">
        <h2>${esc(card.title)}</h2>
        ${card.signalLevel ? signalBadgeHtml(card.signalLevel) : ''}
        <div class="metric ${signalLevelClass(card.signalLevel)}">${esc(card.action || '-')}</div>
        <p class="muted">${card.detail || '-'}</p>
        ${card.reason ? `<p class="mini">${esc(card.reason)}</p>` : ''}
        ${card.tab ? `<button class="primary decision-jump" type="button" data-target-tab="${esc(card.tab)}">${buttonText}</button>` : ''}
      </article>`;
```

- [ ] **Step 4: Render 今日总建议 in `renderDecisionHome()`**

After:

```js
      const reviewCards = buildReviewSummaryCards();
```

add:

```js
      const todayAdvice = buildTodaySignalAdvice(focusCards);
```

Then replace the first panel in `app.innerHTML` with:

```js
        <section class="panel full">
          <h2>今日总建议</h2>
          <div class="metric ${signalLevelClass(todayAdvice.level)}">${esc(todayAdvice.text)}</div>
          <p class="muted">先看信号等级，再进专项页。首页只做决策入口，不展开完整复盘。</p>
        </section>
        <section class="panel full">
          <h2>今日重点</h2>
          <p class="muted">强观察优先，弱观察谨慎，仅复盘和暂停不做强推荐。</p>
        </section>
```

### Task 4: Verify And Commit

**Files:**
- Modify: `index.html`
- Modify: `test-p0-product-dashboard-html.mjs`
- Create: `docs/superpowers/plans/2026-06-17-signal-convergence-optimization.md`

- [ ] **Step 1: Run focused tests**

Run:

```powershell
node test-p0-product-dashboard-html.mjs
node test-three-formula-gate-html.mjs
node test-worldcup-dashboard-html.mjs
```

Expected: all three commands exit with code 0.

- [ ] **Step 2: Run existing smoke tests**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
```

Expected: both commands exit with code 0.

- [ ] **Step 3: Check diff and whitespace**

Run:

```powershell
git diff --check
git status -sb
```

Expected: no whitespace errors. Status should show `index.html`, `test-p0-product-dashboard-html.mjs`, and this plan file.

- [ ] **Step 4: Commit and push**

Run:

```powershell
git add index.html test-p0-product-dashboard-html.mjs docs/superpowers/plans/2026-06-17-signal-convergence-optimization.md
git commit -m "Add homepage signal convergence"
git push
```

Expected: commit and push succeed. If push is rejected by an automatic fetch commit, run `git fetch origin`, `git rebase origin/main`, rerun the tests above, then `git push`.
