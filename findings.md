# Findings

## Current State

- Branch `main` is clean at `ed4599b perf: load dashboard data by tab`.
- Data files are compacted; largest files are `page-parse-cache.json` 2.54 MB and `records.json/js` 2.36 MB each.
- Dashboard now loads heavy data by tab instead of loading all full data at once.

## Candidate Optimizations

- Build profile sometimes shows `parse-pages` around 50-63 seconds after conflict/cache churn, but normal cache-hit builds were around a few seconds earlier. Need evidence before changing parser/cache.
- `api/cron-fetch.js` exists but Vercel deployment did not include it; cron has been routed through `manual-fetch.js` as a workaround. This is operational, not a code optimization target for now.

## Build Cache Evidence

- Reading `data/page-parse-cache.json` as raw text took about 0.08s.
- Converting that 2.5 MB JSON with PowerShell `ConvertFrom-Json` timed out after 60s.
- Listing 26 page HTML files took about 0.05s.
- Root cause for slow `parse-pages` is large-object `ConvertFrom-Json`, not file IO or regex parsing alone.
- Candidate fix: split page parse cache into a small index plus one compact records JSON file per page.
- After implementing split cache, second cache-hit build measured `parse-pages` at about 1.5s.
- Added `source|issue` record lookup for game settlement. `game-settle-existing` dropped from about 2.0s to about 0.46s, and `game-predictions` from about 2.16s to about 1.28s.
