# 开奖记录数据看板

本项目用于本地采集澳门、香港开奖记录，解析为结构化数据，并生成可直接部署的静态看板。

当前保留的核心功能：
- 总控台
- 固定八码
- 正六码固定8码
- 手动采集

## 页面入口

- `index.html`：主看板，包含总控台、固定八码和正六码固定8码。
- `kjjl.html`：原始开奖记录页面。

## 本地运行

采集数据：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\fetch-all.ps1
```

重新构建本地数据和页面：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1
```

查看构建耗时：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1 -Profile
```

## 关键文件

- `build-data.ps1`：解析 `pages/*.html`，生成结构化数据、报告数据和静态首页。
- `fetch-all.ps1`：统一采集入口。
- `fetch-am.ps1`：单来源采集脚本。
- `api/manual-fetch.js`：Vercel API，用于从页面或定时任务触发 GitHub Actions 手动采集。
- `analyze-fixed-8-window-pattern.mjs`：固定八码阶段窗口报告生成器。
- `show-fixed-8-current.mjs`：命令行查看当前固定八码推荐。
- `analyze-positive-position-stage8.mjs`：正六码每个位置独立阶段固定8码报告生成器。
- `data/records.json` / `data/records.js`：结构化开奖记录。
- `data/dashboard-summary.json` / `data/dashboard-summary.js`：首页轻量摘要。
- `data/fixed-8-pattern-report.json` / `data/fixed-8-pattern-report.js`：固定八码报告。
- `docs/fixed-8-pattern-report.md`：固定八码报告 Markdown 版。
- `data/positive-position-stage8-report.json` / `data/positive-position-stage8-report.js`：正六码固定8码报告。
- `docs/positive-position-stage8-report.md`：正六码固定8码报告 Markdown 版。

## 测试

推荐回归命令：

```powershell
node .\test-fixed-8-window-pattern.mjs
node .\test-fixed-8-dashboard-menu.mjs
node .\test-show-fixed-8-current.mjs
node .\test-position-stage8-dashboard-menu.mjs
node .\test-positive-position-stage8.mjs
node .\test-p0-product-dashboard-html.mjs
node .\test-no-three-in-three.mjs
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data-performance-shape.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data.ps1
```

采集和缓存相关测试：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-fetch-am.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-page-parse-cache.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-vercel-cron-fetch.ps1
```

## 线上运行

- `vercel.json`：配置定时任务。
- `.github/workflows/daily-fetch.yml`：自动采集 workflow。
- `.github/workflows/manual-fetch.yml`：页面手动采集触发的 workflow。

仓库权限需要允许 workflow 写入：

```text
Settings -> Actions -> General -> Workflow permissions -> Read and write permissions
```

Vercel 页面手动采集需要配置：

```text
GITHUB_TOKEN=GitHub Personal Access Token
GITHUB_OWNER=tt88737
GITHUB_REPO=Abc
GITHUB_REF=main
CRON_SECRET=定时任务密钥
MANUAL_FETCH_SECRET=页面手动采集管理密钥
```

## 本地运行产物

以下目录用于测试、缓存或本地临时输出，不应作为业务模块依赖：

- `test-output/`
- `test-data-output/`
- `test-page-parse-cache-output/`
- `logs/`
- `snapshots/`
