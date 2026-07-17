import assert from 'node:assert/strict';
import {formatCurrentStatus} from './show-fixed-8-current.mjs';

const report = {
  items: [
    {
      source: 'am',
      year: '2026',
      mode: 'fixed-block',
      currentWindow: {
        start: 196,
        end: 200,
        count: 2,
        expected: 5,
        recommendedPool: ['01', '02', '04', '05', '09', '16', '41', '48'],
        hits: [],
        covered: false,
        remainingDraws: 3,
        tracking: {
          status: 'watch-current-window',
          rule: 'fixed-8-cross-year-stage',
          completedMissStreak: 0,
        },
        nextAction: 'watch-current-window',
        switchSignal: 'active-window-not-covered-yet',
      },
    },
  ],
};

assert.equal(formatCurrentStatus(report, {source: 'am', year: '2026'}), [
  '澳门 2026 固定8码三阶段',
  '当前窗口：196-200',
  '推荐8码：01 02 04 05 09 16 41 48',
  '已开：2/5，剩余：3',
  '命中：暂无',
  '状态：继续观察当前窗口',
  '动作：继续观察当前窗口',
  '规则：固定8码·跨年同阶段',
].join('\n'));

console.log('show fixed 8 current ok');
