# 澳门开奖记录本地抓取工具

## 文件说明

- `fetch-am.ps1`：抓取原站开奖记录并保存到本地。
- `index.html`：本地查看页，双击即可打开。
- `dashboard.html`：数据看板入口，包含看板、趋势、选号、游戏、日报。
- `dashboard.html` 已内嵌数据，直接双击打开即可，不依赖浏览器 `fetch` 读取本地 JSON。
- 游戏标签包含开奖记录挑战和下一期预测；预测记录保存在当前浏览器的 `localStorage`。
- 游戏标签包含“三中三每日推荐”：按每期前 6 个号码生成 10 组三码组合，仅作概率游戏参考。
- 游戏标签包含“特别号防连错”：只看每期最后一个特别号，固定列举 N=30-38 的全历史最优组合；同时按期号周期 `001-005`、`006-010` 等列出周期 8 码组合。
- 看板、趋势、选号、游戏、日报均在页面内提供统一的“来源”下拉，按澳门 / 香港分开统计和操作。
- 生肖筛选固定为十二生肖；历史页面里带有五行后缀的数据会自动归一到生肖本身。
- `report.html`：独立日报页面。
- `data/records.json`：从本地 HTML 解析出的结构化开奖记录。
- `build-data.ps1`：根据 `pages/*.html` 重新生成 `records.json`、`dashboard.html` 和 `report.html`。
- `pages/`：从首页按钮发现并抓回来的本地功能页面，例如香港记录、年份记录、更多期数。
- `assets/`：页面使用的 CSS、JS 等静态资源。
- `install-task.ps1`：安装 Windows 计划任务，每天晚上 9:45 自动抓取。
- `run-hidden.vbs`：计划任务使用的隐藏运行包装脚本，避免弹出 PowerShell 窗口。
- `run-now.ps1`：立即手动抓取一次。
- `logs/fetch.log`：抓取日志。
- `snapshots/`：每次抓取的历史快照。

## 第一次使用

在 PowerShell 中运行：

```powershell
cd C:\codex\test\am
powershell -ExecutionPolicy Bypass -File .\run-now.ps1
```

打开本地文件：

```text
C:\codex\test\am\index.html
```

打开数据工具：

```text
C:\codex\test\am\dashboard.html
```

打开日报：

```text
C:\codex\test\am\report.html
```

## 安装每天晚上 9:45 自动抓取

```powershell
cd C:\codex\test\am
powershell -ExecutionPolicy Bypass -File .\install-task.ps1
```

计划任务名称：

```text
Fetch-AM-Lottery-Records
```

## 手动触发计划任务

```powershell
Start-ScheduledTask -TaskName Fetch-AM-Lottery-Records
```

## 修改抓取时间

例如改成晚上 10:00：

```powershell
powershell -ExecutionPolicy Bypass -File .\install-task.ps1 -RunAt 22:00
```
