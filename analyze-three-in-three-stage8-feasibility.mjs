import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  buildFiveIssueWindows,
  findFullCoverStagePool,
} from './analyze-three-in-three-stage8-window.mjs';

const CHECKS = [
  {year: '2022', start: 116, end: 230},
  {year: '2023', start: 231, end: 365},
  {year: '2024', start: 116, end: 230},
  {year: '2025', start: 116, end: 230},
  {year: '2026', start: 116, end: 230},
];

export function analyzeStage8Feasibility(records, options = {}) {
  const source = String(options.source || 'am');
  const nodeLimit = Number(options.nodeLimit || 200000);
  const rows = records.filter(row => String(row?.source || '') === source);
  const items = CHECKS.map(check => {
    const yearRows = rows
      .filter(row => String(row.date || '').startsWith(`${check.year}-`))
      .sort((a, b) => Number(a.issue || 0) - Number(b.issue || 0));
    const windows = buildFiveIssueWindows(yearRows).filter(win => win.start >= check.start && win.end <= check.end);
    const result = findFullCoverStagePool(windows, 8, {nodeLimit});
    return {...check, ...result};
  });
  return {
    generatedAt: new Date().toISOString(),
    source,
    nodeLimit,
    rule: '硬约束可行性：阶段固定8码必须覆盖阶段内全部5期窗口；每个窗口内至少有1期前6正码命中8码>=3。',
    items,
  };
}

function markdownReport(report) {
  const lines = [
    '# 三中三 阶段8码五期必开硬约束验证',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `节点上限：${report.nodeLimit}`,
    '',
    '| 年份 | 阶段 | 可行 | 覆盖 | 8码/最佳已知码 | 漏窗口 | 搜索节点 |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const item of report.items) {
    const misses = item.missWindows.map(win => `${win.start}-${win.end}`).join(', ') || '-';
    lines.push(`| ${item.year} | ${item.start}-${item.end} | ${item.feasible ? '可行' : '未找到可行解'} | ${item.coveredWindows}/${item.totalWindows} ${item.hitRate}% | ${item.pool.join(' ')} | ${misses} | ${item.nodes} |`);
  }
  lines.push('');
  lines.push('## 结论');
  lines.push('');
  lines.push('- 本报告坚持“五期窗口必开”硬约束，不用覆盖率替代可行性。');
  lines.push('- `未找到可行解` 表示在当前节点上限内没有找到8码全覆盖方案；不能视为阶段规律成立。');
  lines.push('- 若要进一步确认某阶段绝对不可行，需要提高节点上限或引入更强的约束求解器。');
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzeStage8Feasibility(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-stage8-feasibility-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-stage8-feasibility-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-stage8-feasibility-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_STAGE8_FEASIBILITY_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const item of report.items) {
    console.log(`${item.year} ${item.start}-${item.end}: feasible=${item.feasible} covered=${item.coveredWindows}/${item.totalWindows} pool=${item.pool.join(' ')} nodes=${item.nodes}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
