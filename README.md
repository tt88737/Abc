# 开奖记录数据看板

这是一个静态数据看板项目，用于采集澳门 / 香港开奖记录，并生成可部署到 Vercel 的静态页面。

## 页面入口

- `index.html`：数据看板首页，包含看板、游戏、5期窗口、三中三5期窗口、规律观察、手动采集、日报。
- `kjjl.html`：原始开奖记录页面副本。
- `report.html`：独立日报页面。

## 采集逻辑

项目现在统一使用 `fetch-all.ps1` 作为采集入口：

1. 抓取澳门来源页，保存为 `pages/am.html` 及相关页面。
2. 抓取香港来源页，保存为 `pages/hk.html` 及相关页面。
3. 最后运行一次 `build-data.ps1`，根据 `pages/*.html` 生成结构化数据和页面。

这样本地定时任务、GitHub Actions 自动采集、Vercel 页面手动采集保持同一套逻辑。

## 自动采集

GitHub Actions 使用 `.github/workflows/daily-fetch.yml` 定时运行：

- 北京时间 `21:45`、`21:55`、`22:10` 兜底触发。
- 每次执行 `fetch-all.ps1 -SkipSnapshot`，先采集澳门和香港，再构建数据。
- 如果生成文件有变化，自动提交到 `main`。
- Vercel 绑定 GitHub 仓库后会自动重新部署。

手动也可以在 GitHub 的 `Actions -> Daily Fetch -> Run workflow` 触发。

## 页面手动采集

`index.html` 的“手动采集”菜单会调用 Vercel API：

- 点一次“立即采集”会同时采集澳门和香港。
- 下拉框用于修改某一个来源的采集网址。
- 需要在 Vercel 配置 `GITHUB_TOKEN` 环境变量，token 需要 `repo` 和 `workflow` 权限。

## 本地定时任务

安装本地 Windows 定时任务：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\install-task.ps1
```

默认每天北京时间 `21:45` 执行 `fetch-all.ps1`，执行超时限制为 15 分钟。

## 关键文件

- `fetch-all.ps1`：统一采集入口，一次采集澳门和香港，然后构建数据。
- `fetch-am.ps1`：单来源采集脚本，可通过参数指定来源 URL 和保存文件名。
- `build-data.ps1`：根据 `pages/*.html` 生成 `data/*.json`、`index.html`、`report.html`。
- `api/manual-fetch.js`：Vercel API，用于从页面触发 GitHub Actions。
- `.github/workflows/daily-fetch.yml`：自动采集 workflow。
- `.github/workflows/manual-fetch.yml`：页面手动采集 workflow。
- `pages/`：采集回来的源页面，是生成结构化数据的输入。
- `data/records.json`：结构化开奖记录。
- `data/game-predictions.json`：游戏推荐记录和结算状态。
- `data/window5-state.json`：5期窗口覆盖池状态。

## 本地生成

只重新构建数据：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1
```

采集澳门和香港并重新构建：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\fetch-all.ps1
```

## 本地测试

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-fetch-am.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-sanzhong-coverage.ps1
```

## 部署说明

Vercel 直接导入 GitHub 仓库即可。当前项目不需要构建命令，静态文件位于仓库根目录。

建议确认 GitHub 仓库设置：

`Settings -> Actions -> General -> Workflow permissions -> Read and write permissions`

## 不提交的运行产物

- `logs/`
- `snapshots/`
- `test-output/`
- `test-data-output/`
- `test-sanzhong-output/`
