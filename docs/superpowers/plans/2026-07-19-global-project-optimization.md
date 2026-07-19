# Global Project Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove obsolete research modules and rename the active positive-position fixed 8 feature so the repository reflects only current product behavior.

**Architecture:** Keep the existing static-site generation architecture. `build-data.ps1` remains the build orchestrator, records data remains unchanged, fixed eight remains unchanged, and the active position fixed 8 analyzer is renamed without changing its algorithm.

**Tech Stack:** PowerShell build scripts, Node.js `.mjs` analysis scripts, static HTML/JSON/JS data files, Vercel serverless API, GitHub Actions.

---

## File Structure

Create:

- `analyze-positive-position-stage8.mjs`: renamed active position fixed 8 analyzer.
- `test-positive-position-stage8.mjs`: renamed unit test for the active analyzer.
- `data/positive-position-stage8-report.json`: generated report for Macau and Hong Kong.
- `data/positive-position-stage8-report.js`: generated JS fallback.
- `docs/positive-position-stage8-report.md`: generated Markdown report.

Modify:

- `build-data.ps1`: update analyzer path, data load paths, JS global, and empty-state command text.
- `index.html`: regenerated from `build-data.ps1`.
- `test-position-stage8-dashboard-menu.mjs`: assert new report paths and global.
- `test-no-three-in-three.mjs`: assert old names are absent from core product files and removed report paths.
- `README.md`: document current modules and remove obsolete research references.

Delete:

- Obsolete `analyze-three-in-three-*.mjs` scripts except the active analyzer after rename.
- Obsolete `test-three-in-three-*.mjs` tests except the active test after rename.
- Obsolete `data/three-in-three-*-report.json/js` reports except the active report after rename.
- Obsolete `docs/three-in-three-*-report.md` reports except the active report after rename.

Do not modify:

- `analyze-fixed-8-window-pattern.mjs`
- `show-fixed-8-current.mjs`
- `fetch-all.ps1`
- `fetch-am.ps1`
- `api/manual-fetch.js`
- `.github/workflows/*.yml`
- `vercel.json`

## Task 1: Add Failing Naming Tests

**Files:**

- Modify: `test-position-stage8-dashboard-menu.mjs`
- Modify: `test-no-three-in-three.mjs`

- [ ] **Step 1: Update dashboard menu test to expect new positive-position data names**

In `test-position-stage8-dashboard-menu.mjs`, replace old report path/global assertions:

```js
assert.ok(text.includes('data/positive-position-stage8-report.json'), `${name} should load position fixed 8 JSON report`);
assert.ok(text.includes('data/positive-position-stage8-report.js'), `${name} should load position fixed 8 JS fallback`);
assert.ok(text.includes('__POSITIVE_POSITION_STAGE8_REPORT__'), `${name} should use position fixed 8 global fallback`);
assert.ok(!text.includes('data/three-in-three-position-stage8-report.json'), `${name} should not load old report path`);
assert.ok(!text.includes('__THREE_IN_THREE_POSITION_STAGE8_REPORT__'), `${name} should not use old global fallback`);
```

Keep the existing independent menu and source assertions.

- [ ] **Step 2: Strengthen removed-module test**

In `test-no-three-in-three.mjs`, keep the concatenated token pattern and add old active filenames to `forbidden`:

```js
"three" + "-in-three-position-stage8",
"THREE" + "_IN_THREE_POSITION_STAGE8",
```

Keep `files` focused on core files:

```js
const files = [
  "build-data.ps1",
  "index.html",
  "test-p0-product-dashboard-html.mjs",
  "test-build-data.ps1",
  "README.md",
];
```

- [ ] **Step 3: Run tests and verify they fail for the expected reason**

Run:

```powershell
node .\test-position-stage8-dashboard-menu.mjs
node .\test-no-three-in-three.mjs
```

Expected:

- `test-position-stage8-dashboard-menu.mjs` fails because `build-data.ps1` and `index.html` still reference old report paths/globals.
- `test-no-three-in-three.mjs` fails because old position-stage8 names still exist in core files.

Do not change production code before observing this failure.

## Task 2: Rename Active Analyzer and Test

**Files:**

- Move: `analyze-three-in-three-position-stage8.mjs` -> `analyze-positive-position-stage8.mjs`
- Move: `test-three-in-three-position-stage8.mjs` -> `test-positive-position-stage8.mjs`
- Modify: `test-positive-position-stage8.mjs`

- [ ] **Step 1: Rename files with git**

Run:

```powershell
git mv analyze-three-in-three-position-stage8.mjs analyze-positive-position-stage8.mjs
git mv test-three-in-three-position-stage8.mjs test-positive-position-stage8.mjs
```

- [ ] **Step 2: Update test import**

In `test-positive-position-stage8.mjs`, change:

```js
} from './analyze-three-in-three-position-stage8.mjs';
```

to:

```js
} from './analyze-positive-position-stage8.mjs';
```

- [ ] **Step 3: Run renamed analyzer test**

Run:

```powershell
node .\test-positive-position-stage8.mjs
```

Expected: pass. This confirms the rename did not change analyzer behavior.

## Task 3: Rename Generated Data and Frontend Load Paths

**Files:**

- Modify: `analyze-positive-position-stage8.mjs`
- Modify: `build-data.ps1`
- Generated: `data/positive-position-stage8-report.json`
- Generated: `data/positive-position-stage8-report.js`
- Generated: `docs/positive-position-stage8-report.md`

- [ ] **Step 1: Update analyzer output filenames and global**

In `analyze-positive-position-stage8.mjs`, update CLI output paths:

```js
const jsonPath = path.join(root, 'data', 'positive-position-stage8-report.json');
const jsPath = path.join(root, 'data', 'positive-position-stage8-report.js');
const mdPath = path.join(root, 'docs', 'positive-position-stage8-report.md');
```

Update JS fallback writer:

```js
fs.writeFileSync(jsPath, `window.__POSITIVE_POSITION_STAGE8_REPORT__ = ${json};\n`, 'utf8');
```

- [ ] **Step 2: Update build orchestrator analyzer path**

In `build-data.ps1`, replace:

```powershell
$positionStage8Script = Join-Path $PSScriptRoot 'analyze-three-in-three-position-stage8.mjs'
```

with:

```powershell
$positionStage8Script = Join-Path $PSScriptRoot 'analyze-positive-position-stage8.mjs'
```

- [ ] **Step 3: Update browser data loader paths**

In `build-data.ps1`, replace:

```js
loadJsonOrScript('data/three-in-three-position-stage8-report.json', 'data/three-in-three-position-stage8-report.js', '__THREE_IN_THREE_POSITION_STAGE8_REPORT__')
```

with:

```js
loadJsonOrScript('data/positive-position-stage8-report.json', 'data/positive-position-stage8-report.js', '__POSITIVE_POSITION_STAGE8_REPORT__')
```

Also update the empty-state command text:

```html
请先运行 node analyze-positive-position-stage8.mjs。
```

- [ ] **Step 4: Run build**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1
```

Expected:

- `index.html` regenerated.
- `data/positive-position-stage8-report.json` exists.
- `data/positive-position-stage8-report.js` exists.
- `docs/positive-position-stage8-report.md` exists.

- [ ] **Step 5: Verify source coverage**

Run:

```powershell
node -e "const r=require('./data/positive-position-stage8-report.json'); console.log(r.sources.map(s=>s.source+':'+s.years.length).join(' '));"
```

Expected:

```text
am:7 hk:7
```

The exact year count may increase in future data, but both `am` and `hk` must be present and nonzero.

## Task 4: Delete Obsolete Research Files

**Files:**

- Delete obsolete scripts, tests, data reports, and docs listed below.

- [ ] **Step 1: Delete obsolete root scripts**

Run:

```powershell
git rm analyze-three-in-three-compression.mjs analyze-three-in-three-cooccurrence.mjs analyze-three-in-three-pattern.mjs analyze-three-in-three-position-model.mjs analyze-three-in-three-position-stage8-compress.mjs analyze-three-in-three-reverse-discovery.mjs analyze-three-in-three-stage8-exact-check.mjs analyze-three-in-three-stage8-feasibility.mjs analyze-three-in-three-stage8-window.mjs analyze-three-in-three-structure.mjs analyze-three-in-three-trend-shape.mjs analyze-three-in-three-triggered.mjs
```

- [ ] **Step 2: Delete obsolete tests**

Run:

```powershell
git rm test-three-in-three-compression.mjs test-three-in-three-cooccurrence.mjs test-three-in-three-pattern.mjs test-three-in-three-position-model.mjs test-three-in-three-position-stage8-compress.mjs test-three-in-three-reverse-discovery.mjs test-three-in-three-stage8-window.mjs test-three-in-three-structure.mjs test-three-in-three-trend-shape.mjs test-three-in-three-triggered.mjs
```

- [ ] **Step 3: Delete obsolete generated data**

Run:

```powershell
git rm data/three-in-three-compression-report.json data/three-in-three-compression-report.js data/three-in-three-cooccurrence-report.json data/three-in-three-cooccurrence-report.js data/three-in-three-pattern-report.json data/three-in-three-pattern-report.js data/three-in-three-position-model-report.json data/three-in-three-position-model-report.js data/three-in-three-position-stage8-compress-report.json data/three-in-three-position-stage8-compress-report.js data/three-in-three-reverse-discovery-report.json data/three-in-three-reverse-discovery-report.js data/three-in-three-stage8-exact-check-report.json data/three-in-three-stage8-exact-check-report.js data/three-in-three-stage8-feasibility-report.json data/three-in-three-stage8-feasibility-report.js data/three-in-three-stage8-window-report.json data/three-in-three-stage8-window-report.js data/three-in-three-structure-report.json data/three-in-three-structure-report.js data/three-in-three-trend-shape-report.json data/three-in-three-trend-shape-report.js data/three-in-three-triggered-report.json data/three-in-three-triggered-report.js
```

- [ ] **Step 4: Delete obsolete docs**

Run:

```powershell
git rm docs/three-in-three-compression-report.md docs/three-in-three-cooccurrence-report.md docs/three-in-three-pattern-report.md docs/three-in-three-position-model-report.md docs/three-in-three-position-stage8-compress-report.md docs/three-in-three-position-stage8-miss-window-acceptance.md docs/three-in-three-reverse-discovery-report.md docs/three-in-three-stage8-exact-check-report.md docs/three-in-three-stage8-feasibility-report.md docs/three-in-three-stage8-window-report.md docs/three-in-three-structure-report.md docs/three-in-three-trend-shape-report.md docs/three-in-three-triggered-report.md docs/three-in-three-window-observation.md
```

- [ ] **Step 5: Delete old active report paths after new reports exist**

Run:

```powershell
git rm data/three-in-three-position-stage8-report.json data/three-in-three-position-stage8-report.js docs/three-in-three-position-stage8-report.md
```

Expected: old report names are removed; new `positive-position-stage8` files remain.

## Task 5: Update README and Guard Tests

**Files:**

- Modify: `README.md`
- Modify: `test-position-stage8-dashboard-menu.mjs`
- Modify: `test-no-three-in-three.mjs`

- [ ] **Step 1: Rewrite README current module list**

In `README.md`, document only current product modules:

```markdown
当前保留的核心功能：
- 总控台
- 固定八码
- 正六码固定8码
- 手动采集
```

Add current positive-position files:

```markdown
- `analyze-positive-position-stage8.mjs`：正六码每个位置独立阶段固定8码报告生成器。
- `data/positive-position-stage8-report.json` / `data/positive-position-stage8-report.js`：正六码固定8码报告。
- `docs/positive-position-stage8-report.md`：正六码固定8码报告 Markdown 版。
```

Remove old research report references.

- [ ] **Step 2: Update recommended test commands**

Include:

```powershell
node .\test-position-stage8-dashboard-menu.mjs
node .\test-positive-position-stage8.mjs
```

Remove deleted `test-three-in-three-*.mjs` commands.

- [ ] **Step 3: Run naming tests**

Run:

```powershell
node .\test-position-stage8-dashboard-menu.mjs
node .\test-no-three-in-three.mjs
```

Expected: both pass.

## Task 6: Full Verification and Commit

**Files:**

- All changed files.

- [ ] **Step 1: Run local build**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1
```

Expected: exit code 0 and regenerated `index.html`.

- [ ] **Step 2: Run focused Node tests**

Run:

```powershell
node .\test-fixed-8-window-pattern.mjs
node .\test-fixed-8-dashboard-menu.mjs
node .\test-show-fixed-8-current.mjs
node .\test-position-stage8-dashboard-menu.mjs
node .\test-positive-position-stage8.mjs
node .\test-p0-product-dashboard-html.mjs
node .\test-no-three-in-three.mjs
```

Expected: all pass.

- [ ] **Step 3: Run PowerShell compatibility tests**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-vercel-cron-fetch.ps1
```

Expected: both pass.

- [ ] **Step 4: Run whitespace check**

Run:

```powershell
git diff --check
```

Expected: no errors. CRLF warnings are acceptable if no whitespace errors are reported.

- [ ] **Step 5: Inspect remaining old names**

Run:

```powershell
rg -n "three-in-three|THREE_IN_THREE" build-data.ps1 index.html README.md data docs *.mjs *.ps1 .github api
```

Expected: no matches in active product files, except explicit guard strings in `test-no-three-in-three.mjs` if the command includes test files.

- [ ] **Step 6: Commit implementation**

Run:

```powershell
git status --short
git add -A
git commit -m "Clean obsolete research modules"
```

Expected: implementation commit created on `main`.

- [ ] **Step 7: Push when requested**

Run only after user asks to push:

```powershell
git push origin main
```

Expected: `main -> main`.
