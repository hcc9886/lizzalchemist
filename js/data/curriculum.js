import { UNITS_A } from './units-a.js';
import { UNITS_B } from './units-b.js';
import { UNITS_C } from './units-c.js';
import { UNITS_D } from './units-d.js';

export const TRACKS = [
  { id: 'a', name: '零基础 · 火与物质', desc: '完全没学过化学也能开始。从火、空气、水讲起，建立物质观与实验常识。', persona: 'zero', color: 'gold', units: UNITS_A },
  { id: 'b', name: '中学核心 · 元素与反应', desc: '原子、摩尔、酸碱、氧化还原、速率平衡、热化学与有机入门——中学化学的完整地图。', persona: 'middle', color: 'emerald', units: UNITS_B },
  { id: 'c', name: '大学进阶 · 热力学与结构', desc: '热力学、动力学、平衡与电化学、结构化学、分析化学与计算光谱——化学的深层逻辑。', persona: 'college', color: 'blue', units: UNITS_C },
  { id: 'd', name: '兴趣与科研 · 应用与课题', desc: '材料、环境、能源、药物四大前沿方向，最后一个单元带你完成完整科研课题。', persona: 'adult', color: 'purple', units: UNITS_D }
];

export const ALL_UNITS = TRACKS.flatMap(t => t.units);

export function unitById(id) {
  return ALL_UNITS.find(u => u.id === id) || null;
}

export function trackOf(unit) {
  return TRACKS.find(t => t.units.some(u => u.id === unit.id)) || null;
}

export function nextUnit(id) {
  const i = ALL_UNITS.findIndex(u => u.id === id);
  return i >= 0 && i < ALL_UNITS.length - 1 ? ALL_UNITS[i + 1] : null;
}

export function prevUnit(id) {
  const i = ALL_UNITS.findIndex(u => u.id === id);
  return i > 0 ? ALL_UNITS[i - 1] : null;
}

export const PERSONA_RECOMMEND = {
  zero: 'a', middle: 'b', college: 'c', adult: 'd', teacher: 'b'
};
