import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  bestStagePool,
  buildFiveIssueWindows,
  exactBestStagePool,
} from './analyze-three-in-three-stage8-window.mjs';

const CHECKS = [
  {year: '2022', start: 116, end: 230},
  {year: '2023', start: 231, end: 365},
  {year: '2024', start: 116, end: 230},
  {year: '2025', start: 116, end: 230},
  {year: '2026', start: 116, end: 230},
];

export function analyzeStage8ExactCheck(records, options = {}) {
  const source = String(options.source || 'am');
  const candidateLimit = Number(options.candidateLimit || 18);
  const rows = records.filter(row => String(row?.source || '') === source);
  const items = CHECKS.map(check => {
    const yearRows = rows
      .filter(row => String(row.date || '').startsWith(`${check.year}-`))
      .sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
    const windows = buildFiveIssueWindows(yearRows).filter(win => win.start >= check.start && win.end <= check.end);
    const greedy = bestStagePool(windows, 8);
    const exact = exactBestStagePool(windows, 8, {candidateLimit});
    return {
      ...check,
      windowCount: windows.length,
      greedy,
      exact,
      lift: Math.round((exact.hitRate - greedy.hitRate) * 100) / 100,
    };
  });
  return {
    generatedAt: new Date().toISOString(),
    source,
    candidateLimit,
    rule: '阶段8码精确搜索抽样：每个代表阶段在候选排名前N个号码中枚举8码组合，验证五期窗口三中三覆盖理论上限。',
    items,
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 阶段8码精确搜索抽样',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `候选上限：前 ${report.candidateLimit} 个号码`,
    '',
    '| 年份 | 阶段 | 窗口数 | 贪心覆盖 | 精确覆盖 | 提升 | 精确8码 | 精确漏窗口 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const item of report.items) {
    const miss = item.exact.missWindows.map(win => `${win.start}-${win.end}`).join(', ') || '-';
    lines.push(`| ${item.year} | ${item.start}-${item.end} | ${item.windowCount} | ${item.greedy.coveredWindows}/${item.greedy.totalWindows} ${item.greedy.hitRate}% | ${item.exact.coveredWindows}/${item.exact.totalWindows} ${item.exact.hitRate}% | ${item.lift}% | ${item.exact.pool.join(' ')} | ${miss} |`);
  }
  lines.push('');
  lines.push('## 结论');
  lines.push('');
  lines.push('- 精确搜索明显优于贪心，说明前一版阶段8码低估了上限。');
  lines.push('- 但代表阶段仍没有达到五期窗口全覆盖，暂不能直接套用固定八码“必开”判断。');
  lines.push('- 下一步应先研究精确8码的漏窗口共同特征，再决定是否做8压6。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzeStage8ExactCheck(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-stage8-exact-check-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-stage8-exact-check-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-stage8-exact-check-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_STAGE8_EXACT_CHECK_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const item of report.items) {
    console.log(`${item.year} ${item.start}-${item.end}: greedy ${item.greedy.hitRate}% exact ${item.exact.hitRate}% lift ${item.lift}% ${item.exact.pool.join(' ')}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
