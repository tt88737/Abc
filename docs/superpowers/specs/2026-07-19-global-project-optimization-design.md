# Global Project Optimization Design

## Goal

Clean the project in phases while preserving the currently useful product behavior:

- dashboard/home page
- fixed eight dashboard
- positive six position fixed 8 dashboard
- manual fetch
- local build and online deployment paths

This first phase removes obsolete research modules and renames the active positive-position fixed 8 module so the repository no longer looks like it still contains the removed compound recommendation feature.

## Scope

In scope:

- Delete obsolete three-in-three research scripts, generated reports, documentation, and tests.
- Keep the active positive six position fixed 8 feature.
- Rename the active positive-position fixed 8 files and browser globals from old three-in-three naming to positive-position naming.
- Update `build-data.ps1`, `index.html`, README, and tests to use the new names.
- Keep Macau and Hong Kong source support.
- Verify local and online-compatible build paths still work.

Out of scope:

- Changing fixed eight business rules.
- Changing positive-position fixed 8 calculation behavior.
- Restoring deleted compound recommendation modules.
- Reworking UI layout beyond names, paths, and broken references.
- Splitting `build-data.ps1` into multiple files in this phase.

## Keep List

Core files and behaviors to keep:

- `build-data.ps1`
- `index.html`
- `fetch-all.ps1`
- `fetch-am.ps1`
- `api/manual-fetch.js`
- `.github/workflows/daily-fetch.yml`
- `.github/workflows/manual-fetch.yml`
- `vercel.json`
- `analyze-fixed-8-window-pattern.mjs`
- `show-fixed-8-current.mjs`
- fixed eight data and docs
- records data and dashboard summary data

The current position fixed 8 feature is kept, but renamed.

## Delete List

Remove obsolete research chains that are no longer product modules:

- `analyze-three-in-three-compression.mjs`
- `analyze-three-in-three-cooccurrence.mjs`
- `analyze-three-in-three-pattern.mjs`
- `analyze-three-in-three-position-model.mjs`
- `analyze-three-in-three-position-stage8-compress.mjs`
- `analyze-three-in-three-reverse-discovery.mjs`
- `analyze-three-in-three-stage8-exact-check.mjs`
- `analyze-three-in-three-stage8-feasibility.mjs`
- `analyze-three-in-three-stage8-window.mjs`
- `analyze-three-in-three-structure.mjs`
- `analyze-three-in-three-trend-shape.mjs`
- `analyze-three-in-three-triggered.mjs`
- matching `test-three-in-three-*.mjs` files except the active position fixed 8 test after renaming
- matching `data/three-in-three-*-report.json/js` files except the active position fixed 8 report after renaming
- matching `docs/three-in-three-*-report.md` research reports except the active position fixed 8 report after renaming

## Rename Map

Active feature renames:

- `analyze-three-in-three-position-stage8.mjs` -> `analyze-positive-position-stage8.mjs`
- `test-three-in-three-position-stage8.mjs` -> `test-positive-position-stage8.mjs`
- `data/three-in-three-position-stage8-report.json` -> `data/positive-position-stage8-report.json`
- `data/three-in-three-position-stage8-report.js` -> `data/positive-position-stage8-report.js`
- `docs/three-in-three-position-stage8-report.md` -> `docs/positive-position-stage8-report.md`
- browser global `__THREE_IN_THREE_POSITION_STAGE8_REPORT__` -> `__POSITIVE_POSITION_STAGE8_REPORT__`

Internal UI ids such as `positionStage8` may stay because they describe the current feature without referencing the removed module.

## Data Flow

The first phase keeps the existing data flow:

1. `fetch-all.ps1` updates source pages when needed.
2. `build-data.ps1` parses pages into `data/records.json/js`.
3. `build-data.ps1` runs fixed eight analysis.
4. `build-data.ps1` runs positive-position fixed 8 analysis.
5. `build-data.ps1` writes `index.html`.
6. Static JSON is loaded first, with JS global fallback for local/static hosting compatibility.

## Validation

Required checks before implementation is considered complete:

- `powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1`
- `node .\test-fixed-8-window-pattern.mjs`
- `node .\test-fixed-8-dashboard-menu.mjs`
- `node .\test-show-fixed-8-current.mjs`
- `node .\test-position-stage8-dashboard-menu.mjs`
- `node .\test-positive-position-stage8.mjs`
- `node .\test-p0-product-dashboard-html.mjs`
- `node .\test-no-three-in-three.mjs`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data.ps1`
- `powershell -NoProfile -ExecutionPolicy Bypass -File .\test-vercel-cron-fetch.ps1`
- `git diff --check`

The position fixed 8 report must contain both `am` and `hk` sources.

## Acceptance Criteria

- The dashboard still opens from `index.html`.
- Fixed eight and positive six position fixed 8 menus still render.
- Selecting Macau and Hong Kong in positive six position fixed 8 shows generated data.
- No old compound recommendation menu or data replay menu is restored.
- Core product files no longer reference obsolete three-in-three names.
- Build and tests pass locally.
