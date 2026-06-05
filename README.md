# 开奖记录五期窗口看板

这个项目用于采集澳门 / 香港开奖记录，生成结构化数据和静态看板。当前重点是观察五期窗口规律：

- 特别号 5 期窗口
- 三中三 5 期窗口
- 跨年复式池
- 高级规律观察
- 手动采集

下注推荐、推荐复盘、旧预测观察、日报、沙盘和选号小游戏已经删除，不再生成对应页面、数据或业务逻辑。

## 页面入口

- `index.html`：主看板，默认打开 `5期窗口`。
- `kjjl.html`：开奖记录页面。

## 采集和构建

统一采集入口：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\fetch-all.ps1
```

只重新构建本地数据和页面：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\build-data.ps1
```

`fetch-all.ps1` 会采集澳门和香港页面，然后调用 `build-data.ps1` 重新生成静态数据。

## 关键文件

- `build-data.ps1`：解析 `pages/*.html`，生成结构化数据、窗口状态和静态页面。
- `build-three-compound.py`：生成三中三 5 期窗口复式池状态。
- `fetch-all.ps1`：统一采集入口。
- `fetch-am.ps1`：单来源采集脚本。
- `api/manual-fetch.js`：Vercel API，用于从页面触发 GitHub Actions 手动采集。
- `data/records.json` / `data/records.js`：结构化开奖记录。
- `data/dashboard-summary.json` / `data/dashboard-summary.js`：首页轻量摘要。
- `data/window5-state.json` / `data/window5-state.js`：特别号 5 期窗口状态。
- `data/three-compound-state.json` / `data/three-compound-state.js`：三中三 5 期窗口状态。

## 已删除模块

以下模块已删除，构建时不应再生成：

- 下注推荐：`data/betting-snapshots.*`
- 推荐复盘：`data/game-predictions.*`
- 旧预测生成：`data/predictions.json`
- 旧预测观察：`data/prediction-observations.json`
- 旧 forecast：`data/forecast-evaluation.json`
- 独立日报：`report.html`
- 趋势、选号器、沙盘、小游戏等历史实验入口

## GitHub Actions

- `.github/workflows/daily-fetch.yml`：自动采集 workflow。
- `.github/workflows/manual-fetch.yml`：页面手动采集触发的 workflow。

需要确认仓库权限：

```text
Settings -> Actions -> General -> Workflow permissions -> Read and write permissions
```

Vercel 页面手动采集需要配置：

```text
GITHUB_TOKEN=GitHub Personal Access Token
GITHUB_OWNER=tt88737
GITHUB_REPO=Abc
GITHUB_REF=main
```

修改 Vercel 环境变量后需要重新部署。

## 测试

常用验证：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-dashboard-three-window-ui.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-three-compound-embed.ps1
powershell -NoProfile -ExecutionPolicy Bypass -File .\test-build-data-performance-shape.ps1
```

## 本地运行产物

以下目录用于本地运行、抓取快照或测试输出，不需要提交：

- `logs/`
- `snapshots/`
- `test-output/`
- `test-data-output/`
- `test-sanzhong-output/`
