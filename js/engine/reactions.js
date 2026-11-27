export const REAGENTS = {
  water: { id: 'water', chem: 'water', name: '水', formula: 'H₂O', concentration: '纯水', volume: 20, mass: 20, phase: 'liquid', color: '#82b6e8', ph: 7 },
  hcl: { id: 'hcl', chem: 'hcl', name: '稀盐酸', formula: 'HCl', concentration: '1 mol/L', volume: 10, mass: 10.2, phase: 'liquid', color: '#b8d4e8', acid: 0.010 },
  h2so4: { id: 'h2so4', chem: 'h2so4', name: '稀硫酸', formula: 'H₂SO₄', concentration: '1 mol/L', volume: 10, mass: 10.7, phase: 'liquid', color: '#c8d8e8', acid: 0.020 },
  h2so4_conc: { id: 'h2so4_conc', chem: 'h2so4', name: '浓硫酸（安全教学）', formula: 'H₂SO₄', concentration: '约 98%', volume: 10, mass: 18.4, phase: 'liquid', color: '#d8cda9', acid: 0.180, danger: true },
  naoh: { id: 'naoh', chem: 'naoh', name: 'NaOH 溶液', formula: 'NaOH', concentration: '1 mol/L', volume: 10, mass: 10.4, phase: 'liquid', color: '#c6d8dd', base: 0.010 },
  caoh2: { id: 'caoh2', chem: 'ca_oh2', name: '石灰水', formula: 'Ca(OH)₂', concentration: '饱和溶液', volume: 10, mass: 10.0, phase: 'liquid', color: '#d8e4e6', base: 0.0023 },
  cuso4: { id: 'cuso4', chem: 'cuso4', name: 'CuSO₄ 溶液', formula: 'CuSO₄', concentration: '0.5 mol/L', volume: 10, mass: 10.8, phase: 'liquid', color: '#4f93c4' },
  fecl3: { id: 'fecl3', chem: 'fecl3', name: 'FeCl₃ 溶液', formula: 'FeCl₃', concentration: '0.5 mol/L', volume: 10, mass: 10.9, phase: 'liquid', color: '#c9a04a' },
  na2co3: { id: 'na2co3', chem: 'na2co3', name: 'Na₂CO₃ 溶液', formula: 'Na₂CO₃', concentration: '0.5 mol/L', volume: 10, mass: 10.6, phase: 'liquid', color: '#d4e2e8', base: 0.004 },
  cabbage: { id: 'cabbage', chem: 'litmus', name: '紫甘蓝汁', formula: '花青素', concentration: '教学指示剂', volume: 5, mass: 5, phase: 'liquid', color: '#7a4fa0' },
  phen: { id: 'phen', chem: 'phen', name: '酚酞指示剂', formula: '酚酞', concentration: '教学指示剂', volume: 2, mass: 2, phase: 'liquid', color: '#d8cda9' },
  fe: { id: 'fe', chem: 'fe', name: '铁钉', formula: 'Fe', concentration: '固体', volume: 0, mass: 2, phase: 'solid', color: '#7a8699', solid: 'nail' },
  zn: { id: 'zn', chem: 'zn', name: '锌粒', formula: 'Zn', concentration: '固体', volume: 0, mass: 2, phase: 'solid', color: '#9aa4b5', solid: 'pellets' },
  caco3: { id: 'caco3', chem: 'caco3', name: '大理石', formula: 'CaCO₃', concentration: '固体', volume: 0, mass: 2, phase: 'solid', color: '#d9d2bd', solid: 'chunks' }
};

const particle = (symbol, color, count = 6, side = 'reactants') => ({ symbol, color, count, side });

export const REACTIONS = {
  'caco3|hcl': {
    id: 'carbonate_acid', title: '碳酸盐遇酸', equation: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',
    macro: '大理石逐渐溶解，无色气泡从表面升起。', micro: '碳酸根与氢离子结合，生成水和二氧化碳；气泡把新的酸带到固体表面。',
    plain: '酸把大理石里的碳酸根“拆”出来，变成会冒泡的二氧化碳。', effects: { gas: 'CO₂', rate: 1, heat: 2 },
    particles: [particle('H⁺', '#f0c96a', 4), particle('CO₂', '#8fe0c6', 8, 'products')], products: 'CaCl₂、H₂O、CO₂'
  },
  'caco3|h2so4': {
    id: 'carbonate_acid', title: '碳酸盐遇酸', equation: 'CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂↑',
    macro: '先冒泡，随后气泡减少；微溶硫酸钙覆盖固体表面。', micro: '生成的 CaSO₄ 溶解度低，逐渐形成覆盖层，阻碍酸与内部碳酸钙接触。',
    plain: '不是反应停了，而是固体表面被一层难溶物“封住”了。', effects: { gas: 'CO₂', rate: 0.45, heat: 1 },
    particles: [particle('CO₂', '#8fe0c6', 6, 'products'), particle('CaSO₄', '#d8cfae', 5, 'products')], products: 'CaSO₄、H₂O、CO₂'
  },
  'h2so4|na2co3': {
    id: 'carbonate_acid', title: '碳酸盐遇酸', equation: 'Na₂CO₃ + H₂SO₄ → Na₂SO₄ + H₂O + CO₂↑',
    macro: '溶液中迅速冒出大量二氧化碳气泡。', micro: '碳酸根接受质子后分解为水和二氧化碳。',
    plain: '酸和碳酸钠相遇，会把二氧化碳“放出来”。', effects: { gas: 'CO₂', rate: 1.15, heat: 3 },
    particles: [particle('Na⁺', '#9fb8d0', 4), particle('CO₂', '#8fe0c6', 9, 'products')], products: 'Na₂SO₄、H₂O、CO₂'
  },
  'hcl|na2co3': {
    id: 'carbonate_acid', title: '碳酸盐遇酸', equation: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',
    macro: '气泡连续升起，酸与碳酸钠被消耗。', micro: 'H⁺ 与 CO₃²⁻ 反应生成 H₂CO₃，再分解为水和 CO₂。',
    plain: '两个氢离子“拆开”一个碳酸根，就得到水和二氧化碳。', effects: { gas: 'CO₂', rate: 1.1, heat: 3 },
    particles: [particle('H⁺', '#f0c96a', 5), particle('CO₂', '#8fe0c6', 9, 'products')], products: 'NaCl、H₂O、CO₂'
  },
  'fe|hcl': {
    id: 'metal_acid', title: '活泼金属与稀酸', equation: 'Fe + 2HCl → FeCl₂ + H₂↑',
    macro: '铁钉表面出现细密气泡，溶液逐渐呈浅绿色。', micro: '铁原子失去电子形成 Fe²⁺，氢离子得到电子形成氢气。',
    plain: '铁把酸里的氢“换”了出来，同时自己进入溶液。', effects: { gas: 'H₂', rate: 0.35, heat: 1, color: '#7fae8b' },
    particles: [particle('Fe', '#9aa4b5', 5), particle('H₂', '#8fe0c6', 7, 'products'), particle('Fe²⁺', '#78b58d', 5, 'products')], products: 'FeCl₂、H₂'
  },
  'h2so4|zn': {
    id: 'metal_acid', title: '活泼金属与稀酸', equation: 'Zn + H₂SO₄ → ZnSO₄ + H₂↑',
    macro: '锌粒溶解，氢气气泡密集上升。', micro: 'Zn 失去两个电子，H⁺ 得到电子；电子转移驱动反应。',
    plain: '锌比氢更活泼，所以能把酸里的氢置换出来。', effects: { gas: 'H₂', rate: 1, heat: 2 },
    particles: [particle('Zn', '#b8c2d0', 5), particle('H₂', '#8fe0c6', 9, 'products'), particle('Zn²⁺', '#9fb8d0', 4, 'products')], products: 'ZnSO₄、H₂'
  },
  'cuso4|naoh': {
    id: 'precipitate', title: '离子结合成沉淀', equation: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',
    macro: '生成蓝色絮状沉淀，逐渐沉到底部。', micro: 'Cu²⁺ 与 OH⁻ 结合成难溶的 Cu(OH)₂ 晶核，晶核聚集长大。',
    plain: '两种离子相遇后“抱团”变成不溶于水的固体。', effects: { precip: '#4f93c4', heat: 1 },
    particles: [particle('Cu²⁺', '#56a9df', 6), particle('OH⁻', '#8fe0c6', 8), particle('Cu(OH)₂', '#4f93c4', 6, 'products')], products: 'Cu(OH)₂、Na₂SO₄'
  },
  'fecl3|naoh': {
    id: 'precipitate', title: '离子结合成沉淀', equation: 'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl',
    macro: '生成红褐色沉淀，像铁锈一样。', micro: 'Fe³⁺ 与 OH⁻ 形成难溶氢氧化物，颗粒聚集后沉降。',
    plain: '铁离子和氢氧根结合，变成红褐色的固体小颗粒。', effects: { precip: '#b05a2a', heat: 1 },
    particles: [particle('Fe³⁺', '#d58b4f', 6), particle('OH⁻', '#8fe0c6', 8), particle('Fe(OH)₃', '#b05a2a', 6, 'products')], products: 'Fe(OH)₃、NaCl'
  },
  'caoh2|na2co3': {
    id: 'precipitate', title: '离子结合成沉淀', equation: 'Ca(OH)₂ + Na₂CO₃ → CaCO₃↓ + 2NaOH',
    macro: '澄清液体变浑浊，白色碳酸钙沉底。', micro: 'Ca²⁺ 与 CO₃²⁻ 结合成难溶 CaCO₃，溶液中留下 Na⁺ 和 OH⁻。',
    plain: '钙离子和碳酸根牵手生成白色沉淀。', effects: { precip: '#e8dfc8', heat: 0 },
    particles: [particle('Ca²⁺', '#9fb8d0', 5), particle('CO₃²⁻', '#d8cfae', 6), particle('CaCO₃', '#e8dfc8', 6, 'products')], products: 'CaCO₃、NaOH'
  },
  'cuso4|fe': {
    id: 'displacement', title: '湿法冶金', equation: 'Fe + CuSO₄ → FeSO₄ + Cu',
    macro: '铁钉表面覆盖红色铜，蓝色逐渐变浅。', micro: 'Fe 把电子转移给 Cu²⁺；Cu²⁺ 得到电子成为铜单质。',
    plain: '更活泼的铁把铜从溶液里“换”了出来。', effects: { deposit: '#c8843c', color: '#7fae8b', rate: 0.25 },
    particles: [particle('Fe', '#9aa4b5', 5), particle('Cu²⁺', '#56a9df', 6), particle('e⁻', '#f0c96a', 5), particle('Cu', '#d58b4f', 5, 'products')], products: 'FeSO₄、Cu'
  },
  'hcl|naoh': {
    id: 'neutralization', title: '酸碱中和', equation: 'HCl + NaOH → NaCl + H₂O（放热）',
    macro: '温度上升，酸与碱逐渐被消耗。', micro: 'H⁺ 与 OH⁻ 结合生成水；形成水分子释放能量。',
    plain: '酸里的氢离子和碱里的氢氧根结合，变成水并放热。', effects: { heat: 9 },
    particles: [particle('H⁺', '#f0c96a', 6), particle('OH⁻', '#8fe0c6', 6), particle('H₂O', '#9fb8d0', 5, 'products')], products: 'NaCl、H₂O'
  },
  'cabbage|hcl': {
    id: 'indicator', title: '指示剂显色', equation: '花青素 + H⁺ ⇌ 红色结构（示意）',
    macro: '紫甘蓝汁由紫变红。', micro: '酸性环境改变花青素分子的电子结构，吸收光的波长随之改变。',
    plain: '指示剂像一把“酸碱变色尺”，酸性区域显红色。', effects: { color: '#c65a41' },
    particles: [particle('H⁺', '#f0c96a', 7), particle('红色花青素', '#c65a41', 7, 'products')], products: '显色物种（教学示意）'
  },
  'cabbage|naoh': {
    id: 'indicator', title: '指示剂显色', equation: '花青素 + OH⁻ ⇌ 绿色结构（示意）',
    macro: '紫甘蓝汁由紫变绿。', micro: '碱性环境改变花青素结构，使其吸收另一部分可见光。',
    plain: '同一指示剂在不同酸碱环境里会换一种颜色。', effects: { color: '#3f9a5a' },
    particles: [particle('OH⁻', '#8fe0c6', 7), particle('绿色花青素', '#3f9a5a', 7, 'products')], products: '显色物种（教学示意）'
  },
  'phen|naoh': {
    id: 'indicator', title: '指示剂显色', equation: '酚酞（无色）⇌ 粉红色结构（碱性，示意）',
    macro: '无色酚酞变为粉红色。', micro: '碱性条件使酚酞形成共轭结构，吸收绿光后呈现粉红。',
    plain: '酚酞在碱性环境里显粉红色，是检验碱性的常用线索。', effects: { color: '#e88fb0' },
    particles: [particle('OH⁻', '#8fe0c6', 6), particle('粉红酚酞', '#e88fb0', 7, 'products')], products: '显色物种（教学示意）'
  },
  'h2so4_conc|water': {
    id: 'dilution', title: '浓硫酸稀释（安全教学）', equation: 'H₂SO₄ + H₂O → 水合 H⁺、HSO₄⁻（示意）',
    macro: '酸缓慢加入水中并搅拌时，温度升高但不会飞溅。', micro: '硫酸分子与水分子水合，离子水合过程释放大量热。',
    plain: '正确顺序是“酸入水”，让热量被大量水吸收。', effects: { heat: 18 },
    particles: [particle('H₂SO₄', '#d8cda9', 5), particle('H₂O', '#82b6e8', 12), particle('热', '#e8703a', 4, 'products')], products: '稀硫酸溶液'
  }
};

export const WATER_INTO_ACID = {
  id: 'water_into_acid', title: '安全熔断：水入浓硫酸',
  message: '水加入浓硫酸会剧烈放热并造成酸液飞溅。危险操作已拦截。',
  correct: '正确原则：酸入水、沿壁缓加、边加边搅。现实操作必须在教师指导下进行。'
};

export function pairKey(a, b) { return [a, b].sort().join('|'); }

export function addReagent(contents, id, portion = 1) {
  const def = REAGENTS[id];
  if (!def) return contents;
  const next = contents.map(c => ({ ...c }));
  const found = next.find(c => c.id === id);
  if (found) {
    found.volume += def.volume * portion;
    found.mass += def.mass * portion;
  } else next.push({ id, volume: def.volume * portion, mass: def.mass * portion });
  return next;
}

export function splitContents(contents, fraction = 0.25) {
  const f = Math.max(0, Math.min(1, fraction));
  const remaining = [], moved = [];
  for (const c of contents) {
    const mv = { id: c.id, volume: c.volume * f, mass: c.mass * f };
    const rm = { id: c.id, volume: c.volume - mv.volume, mass: c.mass - mv.mass };
    if (mv.volume > 0 || mv.mass > 0) moved.push(mv);
    if (rm.volume > 0 || rm.mass > 0) remaining.push(rm);
  }
  return { remaining, moved };
}

export function mergeContents(a, b) {
  const out = a.map(c => ({ ...c }));
  for (const c of b) {
    const found = out.find(x => x.id === c.id);
    if (found) { found.volume += c.volume; found.mass += c.mass; }
    else out.push({ ...c });
  }
  return out;
}

export function safetyCheck(contents, lastAdded, before = null) {
  if (lastAdded !== 'water' || !contents.some(c => c.id === 'h2so4_conc')) return null;
  if (before && !before.some(c => c.id === 'h2so4_conc')) return null;
  return WATER_INTO_ACID;
}

export function estimatePH(contents) {
  let acid = 0, base = 0;
  for (const c of contents) {
    const d = REAGENTS[c.id];
    const scale = d.phase === 'solid' ? 1 : c.volume / d.volume;
    acid += (d.acid || 0) * scale;
    base += (d.base || 0) * scale;
  }
  const volumeL = Math.max(0.001, contents.reduce((s, c) => s + c.volume, 0) / 1000);
  const net = acid - base;
  if (Math.abs(net) < 0.00005) return 7;
  if (net > 0) return Math.max(0, Math.min(6.9, -Math.log10(net / volumeL)));
  return Math.min(14, Math.max(7.1, 14 + Math.log10(-net / volumeL)));
}

export function measureMixture(contents) {
  return {
    volume: contents.reduce((s, c) => s + c.volume, 0),
    mass: contents.reduce((s, c) => s + c.mass, 0),
    ph: estimatePH(contents)
  };
}

export function analyzeMixture(contents, lastAdded = null) {
  const safety = safetyCheck(contents, lastAdded);
  if (safety) return { safety, reactions: [], effects: {}, measurement: measureMixture(contents) };
  const reactions = [];
  for (let i = 0; i < contents.length; i++) {
    for (let j = i + 1; j < contents.length; j++) {
      const r = REACTIONS[pairKey(contents[i].id, contents[j].id)];
      if (r) reactions.push(r);
    }
  }
  const effects = {};
  for (const r of reactions) Object.assign(effects, r.effects);
  for (const r of reactions) {
    if (r.effects.color) effects.color = r.effects.color;
    if (r.effects.precip) effects.precip = r.effects.precip;
    if (r.effects.gas) effects.gas = r.effects.gas;
  }
  effects.heat = reactions.reduce((s, r) => s + (r.effects.heat || 0), 0);
  effects.rate = Math.max(0, ...reactions.map(r => r.effects.rate || 0));
  return { safety: null, reactions, effects, measurement: measureMixture(contents) };
}
