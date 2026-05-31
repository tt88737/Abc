# 开奖记录数据看板

这是一个静态数据看板项目，用于采集澳门 / 香港开奖记录，生成可部署到 Vercel 的静态页面。

## 页面入口

- `index.html`：数据看板首页，包含看板、游戏、5期窗口、三中三5期窗口、日报。
- `kjjl.html`：原始开奖记录页面。
- `report.html`：独立日报页面。

## 自动采集

项目通过 GitHub Actions 定时运行 `.github/workflows/daily-fetch.yml`：

- 每天北京时间 `21:45` 执行一次。
- 运行 `build-data.ps1` 重新解析 `pages/*.html` 并生成数据。
- 如果生成文件有变化，自动提交到 `main`。
- Vercel 绑定 GitHub 仓库后会自动重新部署。

也可以在 GitHub 的 `Actions -> Daily Fetch -> Run workflow` 手动触发。

## 关键文件

- `build-data.ps1`：根据 `pages/*.html` 生成 `data/*.json`、`index.html`、`report.html`。
- `fetch-am.ps1`：从来源页面抓取开奖记录和相关页面，主要用于本地手动采集。
- `pages/`：采集回来的源页面，是生成结构化数据的输入。
- `data/records.json`：结构化开奖记录。
- `data/game-predictions.json`：游戏推荐记录和结算状态。
- `data/window5-state.json`：5期窗口覆盖池状态。
- `test-build-data.ps1`：主构建回归测试。
- `test-fetch-am.ps1`：采集脚本测试。
- `test-sanzhong-coverage.ps1`：三中三组合覆盖测试。

## 本地生成

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1
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
