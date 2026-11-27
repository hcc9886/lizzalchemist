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

export const LEVELS = [
  { id: 0, code: 'L0', name: '启蒙观察', desc: '从火、空气、水与溶液认识物质，先建立观察、表达与安全习惯。', color: 'gold', unitIds: ['a1', 'a2', 'a3', 'a4', 'a5'] },
  { id: 1, code: 'L1', name: '基础建构', desc: '用原子、摩尔、pH 与电子转移搭建化学语言，开始定量计算。', color: 'emerald', unitIds: ['b1', 'b2', 'b3', 'b4', 'b6'] },
  { id: 2, code: 'L2', name: '机理进阶', desc: '从速率、平衡、热力学、动力学、电化学与结构解释“为什么”。', color: 'blue', unitIds: ['b5', 'b7', 'c1', 'c2', 'c3', 'c4'] },
  { id: 3, code: 'L3', name: '研究应用', desc: '用测量、光谱、材料、环境、能源、药物与完整课题解决真实问题。', color: 'purple', unitIds: ['c5', 'c6', 'd1', 'd2', 'd3', 'd4', 'd5'] }
];

export function unitById(id) {
  return ALL_UNITS.find(u => u.id === id) || null;
}

export function levelById(id) {
  return LEVELS.find(l => l.id === Number(id)) || null;
}

export function unitsAtLevel(id) {
  const level = levelById(id);
  return level ? level.unitIds.map(unitById).filter(Boolean) : [];
}

export function unitLevel(unitOrId) {
  const id = typeof unitOrId === 'string' ? unitOrId : unitOrId && unitOrId.id;
  return LEVELS.find(l => l.unitIds.includes(id)) || null;
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
