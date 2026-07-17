import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const SOURCE_NAMES = {
  am: '澳门',
  hk: '香港',
};

const FIXED8_TEXT = {
  'cross-year-stage': '跨年同阶段公式',
  'same-year-stage': '本年阶段公式',
  'fixed-8-cross-year-stage': '固定8码·跨年同阶段',
  'fixed-8-same-year-stage': '固定8码·本年阶段',
  'watch-current-window': '继续观察当前窗口',
  'continue-current-stage': '当前窗口已覆盖，继续沿用',
  'completed-window-miss': '完整窗口未命中，触发重算',
  'recalculate-next-stage-8-codes': '重算下一阶段8码',
  'stage-decay': '阶段衰减，需复核公式',
  'active-window-not-covered-yet': '当前窗口尚未覆盖',
  'current-window-covered': '当前窗口已覆盖',
  'no-current-draws': '当前窗口尚未开奖',
};

function fixed8Text(value) {
  return FIXED8_TEXT[value] || String(value || '-');
}

function latestYearForSource(report, source) {
  return (report.items || [])
    .filter(item => item.source === source && item.mode === 'fixed-block')
    .map(item => String(item.year || ''))
    .filter(Boolean)
    .sort()
    .at(-1);
}

export function formatCurrentStatus(report, options = {}) {
  const source = options.source || 'am';
  const year = String(options.year || latestYearForSource(report, source) || '');
  const item = (report.items || []).find(row => row.source === source && row.year === year && row.mode === 'fixed-block');
  if (!item?.currentWindow) {
    return `${SOURCE_NAMES[source] || source} ${year || '-'} 固定8码三阶段\n当前状态：暂无数据`;
  }

  const current = item.currentWindow;
  const hits = (current.hits || []).map(hit => `${hit.issue}:${hit.num}`).join(' ');
  return [
    `${SOURCE_NAMES[source] || source} ${year} 固定8码三阶段`,
    `当前窗口：${current.start}-${current.end}`,
    `推荐8码：${(current.recommendedPool || []).join(' ')}`,
    `已开：${current.count}/${current.expected || 5}，剩余：${current.remainingDraws}`,
    `命中：${hits || '暂无'}`,
    `状态：${fixed8Text(current.tracking?.status)}`,
    `动作：${fixed8Text(current.nextAction)}`,
    `规则：${fixed8Text(current.tracking?.rule)}`,
  ].join('\n');
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const reportPath = path.join(root, 'data', 'fixed-8-pattern-report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const source = process.argv[2] || 'am';
  const year = process.argv[3] || '';
  console.log(formatCurrentStatus(report, {source, year}));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
