import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const ALL_NUMS = Array.from({length: 49}, (_, idx) => String(idx + 1).padStart(2, '0'));

function positives(record) {
  return (record?.balls || [])
    .slice(0, 6)
    .map(ball => String(Number(ball?.numberText || ball?.number || 0)).padStart(2, '0'))
    .filter(num => num !== '00');
}

function sortRows(rows) {
  return rows
    .filter(row => Number(row?.issue || 0) > 0 && positives(row).length === 6)
    .sort((a, b) => {
      const dateCompare = String(a.date || '').localeCompare(String(b.date || ''));
      return dateCompare || Number(a.issue || 0) - Number(b.issue || 0);
    });
}

function drawShape(record) {
  const nums = positives(record).map(Number);
  return {
    smallCount: nums.filter(num => num <= 24).length,
    zoneCount: new Set(nums.map(num => Math.floor((num - 1) / 10))).size,
    oddCount: nums.filter(num => num % 2 === 1).length,
  };
}

function rankHistory(history) {
  const counts = new Map(ALL_NUMS.map(num => [num, 0]));
  const lastSeen = new Map(ALL_NUMS.map(num => [num, -1]));
  history.forEach((row, idx) => {
    for (const num of positives(row)) {
      counts.set(num, (counts.get(num) || 0) + 1);
      lastSeen.set(num, idx);
    }
  });
  return ALL_NUMS.slice().sort((a, b) =>
    (counts.get(b) || 0) - (counts.get(a) || 0)
    || (lastSeen.get(b) || -1) - (lastSeen.get(a) || -1)
    || Number(a) - Number(b));
}

function unique(...lists) {
  const out = [];
  for (const list of lists) {
    for (const num of list) {
      if (!out.includes(num)) out.push(num);
    }
  }
  return out;
}

function hot5Pool(history) {
  return rankHistory(history.slice(-5)).slice(0, 6).sort((a, b) => Number(a) - Number(b));
}

function hot10Pool(history) {
  return rankHistory(history.slice(-10)).slice(0, 6).sort((a, b) => Number(a) - Number(b));
}

function carryHot10Pool(history) {
  return unique(positives(history.at(-1) || {}), rankHistory(history.slice(-10)))
    .slice(0, 6)
    .sort((a, b) => Number(a) - Number(b));
}

export function triggeredHitCount(pool, record) {
  const set = new Set(pool || []);
  return positives(record).filter(num => set.has(num)).length;
}

export function shouldTrigger(state, triggerId) {
  const shape = state.previousShape || {};
  if (triggerId === 'miss>=20') return Number(state.missStreak || 0) >= 20;
  if (triggerId === 'miss>=30') return Number(state.missStreak || 0) >= 30;
  if (triggerId === 'prevSmall>=5') return Number(shape.smallCount || 0) >= 5;
  if (triggerId === 'prevZone<=2') return Number(shape.zoneCount || 0) <= 2;
  if (triggerId === 'prevOdd>=5') return Number(shape.oddCount || 0) >= 5;
  if (triggerId === 'miss>=20-or-prevSmall>=5') return shouldTrigger(state, 'miss>=20') || shouldTrigger(state, 'prevSmall>=5');
  if (triggerId === 'prevSmall>=5-or-prevZone<=2') return shouldTrigger(state, 'prevSmall>=5') || shouldTrigger(state, 'prevZone<=2');
  return false;
}

function formulas() {
  return [
    {id: 'hot5', name: '近5期热码前6', minHistory: 5, build: hot5Pool},
    {id: 'hot10', name: '近10期热码前6', minHistory: 10, build: hot10Pool},
    {id: 'carryHot10', name: '上期延续+近10期热度6码', minHistory: 10, build: carryHot10Pool},
  ];
}

function triggers() {
  return [
    {id: 'miss>=20', name: '连挂>=20'},
    {id: 'miss>=30', name: '连挂>=30'},
    {id: 'prevSmall>=5', name: '上期小号>=5'},
    {id: 'prevZone<=2', name: '上期区间数<=2'},
    {id: 'prevOdd>=5', name: '上期单数>=5'},
    {id: 'miss>=20-or-prevSmall>=5', name: '连挂>=20 或 上期小号>=5'},
    {id: 'prevSmall>=5-or-prevZone<=2', name: '上期小号>=5 或 上期区间数<=2'},
  ];
}

function roundRate(value, total) {
  return total ? Math.round((value / total) * 10000) / 100 : 0;
}

function maxMissStreak(evaluations) {
  let cur = 0;
  let max = 0;
  for (const row of evaluations) {
    if (row.hit) cur = 0;
    else {
      cur += 1;
      max = Math.max(max, cur);
    }
  }
  return max;
}

export function analyzeTriggeredThreeInThree(records, options = {}) {
  const source = String(options.source || 'am');
  const rows = sortRows(records.filter(row => String(row?.source || '') === source));
  const output = [];

  for (const formula of formulas()) {
    const allEvaluations = [];
    for (let idx = 1; idx < rows.length; idx += 1) {
      if (idx < formula.minHistory) continue;
      const history = rows.slice(0, idx);
      const target = rows[idx];
      const pool = formula.build(history);
      if (pool.length !== 6) continue;
      const hit = triggeredHitCount(pool, target) >= 3;
      allEvaluations.push({
        issue: Number(target.issue || 0),
        date: target.date || '',
        year: String(target.date || '').slice(0, 4),
        pool,
        hit,
        previousShape: drawShape(rows[idx - 1]),
      });
    }

    for (const trigger of triggers()) {
      const triggered = [];
      for (let idx = 0; idx < allEvaluations.length; idx += 1) {
        const previous = allEvaluations.slice(0, idx);
        const state = {
          missStreak: maxTrailingMiss(previous),
          previousShape: allEvaluations[idx].previousShape,
        };
        if (shouldTrigger(state, trigger.id)) {
          triggered.push({...allEvaluations[idx], triggerState: state});
        }
      }
      const hits = triggered.filter(row => row.hit).length;
      const byYear = {};
      for (const year of [...new Set(allEvaluations.map(row => row.year).filter(Boolean))].sort()) {
        const yearAll = allEvaluations.filter(row => row.year === year);
        const yearTriggered = triggered.filter(row => row.year === year);
        const yearHits = yearTriggered.filter(row => row.hit).length;
        byYear[year] = {
          evaluatedDraws: yearAll.length,
          triggeredDraws: yearTriggered.length,
          hits: yearHits,
          hitRate: roundRate(yearHits, yearTriggered.length),
          coverageRate: roundRate(yearTriggered.length, yearAll.length),
          maxTriggeredMissStreak: maxMissStreak(yearTriggered),
        };
      }
      output.push({
        id: `${formula.id}:${trigger.id}`,
        formula: formula.name,
        trigger: trigger.name,
        triggerId: trigger.id,
        poolSize: 6,
        evaluatedDraws: allEvaluations.length,
        triggeredDraws: triggered.length,
        skippedDraws: allEvaluations.length - triggered.length,
        hits,
        hitRate: roundRate(hits, triggered.length),
        coverageRate: roundRate(triggered.length, allEvaluations.length),
        maxTriggeredMissStreak: maxMissStreak(triggered),
        byYear,
        latestPool: allEvaluations.at(-1)?.pool || [],
        latestTriggered: triggered.at(-1) || null,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    source,
    sourceName: source === 'am' ? '澳门' : source,
    rule: '触发式6码复式：只在走势条件满足时出手；触发期正码前6命中>=3算中；非触发期空过。',
    totalRecords: rows.length,
    rules: output
      .filter(row => row.triggeredDraws > 0)
      .sort((a, b) => b.hitRate - a.hitRate || b.triggeredDraws - a.triggeredDraws || a.id.localeCompare(b.id)),
  };
}

function maxTrailingMiss(evaluations) {
  let streak = 0;
  for (let idx = evaluations.length - 1; idx >= 0; idx -= 1) {
    if (evaluations[idx].hit) break;
    streak += 1;
  }
  return streak;
}

function markdownReport(report) {
  const lines = [
    '# 三中三 触发式6码复式验证',
    '',
    `生成时间：${report.generatedAt}`,
    '',
    `规则：${report.rule}`,
    '',
    `澳门可用记录：${report.totalRecords} 期`,
    '',
    '| 排名 | 6码公式 | 触发条件 | 触发期数 | 命中 | 命中率 | 出手覆盖 | 触发内最大连挂 | 最新6码 |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ];
  report.rules.forEach((row, idx) => {
    lines.push(`| ${idx + 1} | ${row.formula} | ${row.trigger} | ${row.triggeredDraws} | ${row.hits} | ${row.hitRate}% | ${row.coverageRate}% | ${row.maxTriggeredMissStreak} | ${row.latestPool.join(' ')} |`);
  });
  lines.push('');
  lines.push('## 说明');
  lines.push('');
  lines.push('- 出手覆盖越低，代表空过越多；命中率必须结合触发期数一起看。');
  lines.push('- 小样本高命中不能直接当规律，优先看样本数、命中率、触发内最大连挂是否同时改善。');
  lines.push('');
  lines.push('## 重点规则分年表现');
  lines.push('');
  const focus = report.rules.find(row => row.triggerId === 'prevSmall>=5-or-prevZone<=2' && row.formula === '上期延续+近10期热度6码') || report.rules[0];
  if (focus) {
    lines.push(`重点规则：${focus.formula} + ${focus.trigger}`);
    lines.push('');
    lines.push('| 年份 | 触发期数 | 命中 | 命中率 | 出手覆盖 | 触发内最大连挂 |');
    lines.push('| --- | --- | --- | --- | --- | --- |');
    for (const [year, row] of Object.entries(focus.byYear || {})) {
      lines.push(`| ${year} | ${row.triggeredDraws} | ${row.hits} | ${row.hitRate}% | ${row.coverageRate}% | ${row.maxTriggeredMissStreak} |`);
    }
  }
  return `${lines.join('\n')}\n`;
}

function runCli() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const payload = JSON.parse(fs.readFileSync(path.join(root, 'data', 'records.json'), 'utf8'));
  const report = analyzeTriggeredThreeInThree(payload.records || [], {source: 'am'});
  const jsonPath = path.join(root, 'data', 'three-in-three-triggered-report.json');
  const jsPath = path.join(root, 'data', 'three-in-three-triggered-report.js');
  const mdPath = path.join(root, 'docs', 'three-in-three-triggered-report.md');
  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(jsonPath, `${json}\n`, 'utf8');
  fs.writeFileSync(jsPath, `window.__THREE_IN_THREE_TRIGGERED_REPORT__ = ${json};\n`, 'utf8');
  fs.writeFileSync(mdPath, markdownReport(report), 'utf8');
  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${jsPath}`);
  console.log(`Saved: ${mdPath}`);
  for (const row of report.rules.slice(0, 15)) {
    console.log(`${row.formula} + ${row.trigger}: ${row.hits}/${row.triggeredDraws} ${row.hitRate}% cover=${row.coverageRate}% maxMiss=${row.maxTriggeredMissStreak} latest=${row.latestPool.join(' ')}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli();
}
