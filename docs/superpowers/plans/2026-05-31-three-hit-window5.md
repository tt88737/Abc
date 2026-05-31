# Three Hit Window5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent `三中三5期窗口` dashboard tab for five-issue window observation of three-hit-three combinations.

**Architecture:** Keep the existing single-file generator pattern. Add client-side analysis helpers in `build-data.ps1` that derive a number pool from first-six flat numbers, build ranked three-number combinations, and evaluate each five-issue window as hit when any recommended combination appears in one draw.

**Tech Stack:** PowerShell generator, static HTML/CSS/JavaScript dashboard, existing `test-build-data.ps1` integration test.

---

### Task 1: Test Coverage

**Files:**
- Modify: `test-build-data.ps1`

- [ ] Add assertions that the dashboard emits `data-tab="threeWindow5"`, `function renderThreeWindow5()`, `function threeWindowAnalysis(source)`, `function buildThreeHitCombos(records)`, and `function threeHitWindowCoverage(rows, combos)`.
- [ ] Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data.ps1`.
- [ ] Expected result before implementation: FAIL because the new tab is missing.

### Task 2: Dashboard Implementation

**Files:**
- Modify: `build-data.ps1`

- [ ] Add the `三中三5期窗口` nav button after `5期窗口`.
- [ ] Add JavaScript helpers for first-six flat numbers, combination generation, overlap-aware top combo selection, and five-issue window hit evaluation.
- [ ] Add `renderThreeWindow5()` with Macau/Hong Kong source switching, current window, number pool, combo pool, stats, and window details.
- [ ] Add `threeWindow5: renderThreeWindow5` to the renderers map.

### Task 3: Verification

**Files:**
- Generated: `dashboard.html`
- Generated: `report.html`
- Generated: `data/*.json`

- [ ] Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data.ps1`; expected PASS.
- [ ] Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1`; expected successful generation.
- [ ] Run a Node syntax check against the embedded dashboard script and verify `data-tab="threeWindow5"` is present.
