// 化学品库（配置驱动）：每种化学品一个完整详情 schema。
// InChIKey 留空(null)的条目在详情页按 CAS/名称经 PubChem PUG-REST 补全（本地数据优先生效）。
// 安全红线：仅作教学展示，不提供任何危险操作配方。

function C(o) {
  return Object.assign({
    alias: [], smiles: null, inchikey: null, odor: '无气味',
    props: {}, ghs: { pictos: [], signal: '', h: [], p: [] },
    uses: [], dosage: '', reactions: [], storage: '', spill: '', waste: '',
    teaching: '', grade_level: 1, tags: []
  }, o);
}

const PICTOS = {
  GHS01: '爆炸', GHS02: '易燃', GHS03: '氧化', GHS04: '高压气体', GHS05: '腐蚀',
  GHS06: '急性毒性', GHS07: '刺激性', GHS08: '健康危害', GHS09: '环境危害'
};
export const GHS_NAMES = PICTOS;

export const CHEMICALS = {
  /* ————— 空气与常见气体 ————— */
  water: C({
    id: 'water', name: '水', en: 'Water', alias: ['蒸馏水', '纯水'], formula: 'H₂O', mw: 18.02, cas: '7732-18-5',
    smiles: 'O', inchikey: 'LFQSCWFLJHTTHZ-UHFFFAOYSA-N',
    appearance: '无色透明液体', odor: '无气味',
    props: { density: '1.00 g/cm³（4 ℃ 最大）', mp: '0 ℃', bp: '100 ℃', solubility: '—（本身是溶剂）', ph: '7（25 ℃）', corrosive: false, volatile: false },
    uses: ['最常用溶剂', '洗涤仪器', '排水法收集气体'], dosage: '视实验而定',
    reactions: [
      { eq: '2H₂O --通电--> 2H₂↑ + O₂↑', note: '电解水：负极氢气体积约是正极氧气的 2 倍，证明水由氢、氧元素组成。' },
      { eq: 'CaO + H₂O → Ca(OH)₂', note: '生石灰遇水剧烈放热，可用作自热食品加热包。' }
    ],
    storage: '普通容器', spill: '擦干即可', waste: '直接排放',
    teaching: '许多"变蓝/变红"的颜色其实是水合离子显色，水本身参与了很多反应却常被忽略——它是最低调的参与者。',
    grade_level: 0, tags: ['溶剂', '基础']
  }),
  o2: C({
    id: 'o2', name: '氧气', en: 'Oxygen', formula: 'O₂', mw: 32.00, cas: '7782-44-7',
    smiles: 'O=O',
    appearance: '无色无味气体', odor: '无气味',
    props: { density: '1.43 g/L（标准状况）', mp: '-218 ℃', bp: '-183 ℃', solubility: '不易溶于水（1 L 水约溶 30 mL）', ph: '—', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS04'], signal: '警告', h: ['H280：内含加压气体，受热可能爆炸'], p: ['P410+P403：防日晒，存放通风处'] },
    uses: ['供给呼吸', '助燃', '炼钢', '气焊'], dosage: '—',
    reactions: [
      { eq: 'C + O₂ →(点燃) CO₂', note: '木炭在氧气中剧烈燃烧、发出白光；在空气中只是红热。' },
      { eq: '3Fe + 2O₂ →(点燃) Fe₃O₄', note: '铁丝在纯氧中火星四射，生成黑色固体——集气瓶底要放少量水或沙。' },
      { eq: 'S + O₂ →(点燃) SO₂', note: '硫在氧气中发出明亮蓝紫色火焰。' }
    ],
    storage: '钢瓶存放，远离油脂和可燃物', spill: '—', waste: '—',
    teaching: '"助燃"不等于"可燃"——氧气本身不能燃烧，但能让别的物质烧得更旺。检验氧气用带火星木条复燃。',
    grade_level: 1, tags: ['气体', '助燃']
  }),
  h2: C({
    id: 'h2', name: '氢气', en: 'Hydrogen', formula: 'H₂', mw: 2.02, cas: '1333-74-0',
    smiles: '[H][H]',
    appearance: '无色无味气体', odor: '无气味',
    props: { density: '0.09 g/L（最轻的气体）', mp: '-259 ℃', bp: '-253 ℃', solubility: '难溶于水', ph: '—', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS02', 'GHS04'], signal: '危险', h: ['H220：极易燃气体', 'H280：内含加压气体'], p: ['P210：远离热源/火花/明火'] },
    uses: ['清洁能源', '冶炼金属', '化工原料', '充探空气球'], dosage: '—',
    reactions: [
      { eq: '2H₂ + O₂ →(点燃) 2H₂O', note: '点燃前必须验纯！不纯的氢气点燃可能爆炸。安静燃烧产生淡蓝色火焰。' },
      { eq: 'H₂ + CuO →(Δ) Cu + H₂O', note: '黑色氧化铜变红，管口出现水珠——氢气还原氧化铜。' }
    ],
    storage: '钢瓶，严禁烟火', spill: '—', waste: '—',
    teaching: '验纯方法：收集一试管氢气靠近火焰，"噗"的一声是纯气，尖锐爆鸣声则不纯，需再验。',
    grade_level: 1, tags: ['气体', '易燃']
  }),
  co2: C({
    id: 'co2', name: '二氧化碳', en: 'Carbon dioxide', formula: 'CO₂', mw: 44.01, cas: '124-38-9',
    smiles: 'O=C=O',
    appearance: '无色无味气体', odor: '无气味',
    props: { density: '1.98 g/L（比空气大）', mp: '-56 ℃（加压）', bp: '-78.5 ℃（升华）', solubility: '能溶于水（1:1）', ph: '—（溶于水成碳酸显酸性）', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS04'], signal: '警告', h: ['H280：内含加压气体'], p: ['P410+P403'] },
    uses: ['灭火', '碳酸饮料', '制冷（干冰）', '光合作用原料'], dosage: '—',
    reactions: [
      { eq: 'CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O', note: '澄清石灰水变浑浊——检验 CO₂ 的标准方法。' },
      { eq: 'CO₂ + H₂O → H₂CO₃', note: '紫色石蕊变红；碳酸不稳定，加热又褪色。' },
      { eq: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑', note: '实验室制 CO₂：不能用稀硫酸（微溶硫酸钙会盖住大理石表面使反应停止）。' }
    ],
    storage: '钢瓶', spill: '—', waste: '—',
    teaching: 'CO₂ 不能供给呼吸（不是有毒！），高浓度会让人缺氧窒息。密度比空气大是它沉在窨井底部致人晕倒的原因。',
    grade_level: 1, tags: ['气体', '酸性氧化物']
  }),
  co: C({
    id: 'co', name: '一氧化碳', en: 'Carbon monoxide', formula: 'CO', mw: 28.01, cas: '630-08-0',
    smiles: '[C-]#[O+]',
    appearance: '无色无味气体', odor: '无气味（正因无味更危险）',
    props: { density: '1.25 g/L', mp: '-199 ℃', bp: '-191.5 ℃', solubility: '难溶于水', ph: '—', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS02', 'GHS06', 'GHS08'], signal: '危险', h: ['H301：吞咽有毒', 'H331：吸入有毒', 'H373：长期或反复接触损害器官'], p: ['P261：避免吸入', 'P304+P340：移至空气新鲜处'] },
    uses: ['工业还原剂（炼铁）', '燃料（水煤气）'], dosage: '—',
    reactions: [
      { eq: 'Fe₂O₃ + 3CO →(高温) 2Fe + 3CO₂', note: '高炉炼铁的核心反应，红棕色粉末逐渐变黑。' },
      { eq: '2CO + O₂ →(点燃) 2CO₂', note: '蓝色火焰；CO 不完全燃烧的产物就是 CO 自己。' }
    ],
    storage: '钢瓶，严防泄漏', spill: '立即通风', waste: '点燃转化为 CO₂',
    teaching: 'CO 中毒机理：与血红蛋白结合能力是 O₂ 的 200 多倍。煤气中毒急救第一步是开窗通风，而不是先救人。',
    grade_level: 2, tags: ['气体', '剧毒', '还原剂']
  }),
  n2: C({
    id: 'n2', name: '氮气', en: 'Nitrogen', formula: 'N₂', mw: 28.01, cas: '7727-37-9',
    smiles: 'N#N',
    appearance: '无色无味气体', odor: '无气味',
    props: { density: '1.25 g/L', mp: '-210 ℃', bp: '-196 ℃', solubility: '难溶于水', ph: '—', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS04'], signal: '警告', h: ['H280：内含加压气体（窒息风险）'], p: ['P410+P403'] },
    uses: ['保护气（充氮食品包装）', '化工原料（合成氨）', '液氮冷冻'], dosage: '—',
    reactions: [{ eq: 'N₂ + 3H₂ ⇌(高温高压催化剂) 2NH₃', note: '哈伯法合成氨——养活世界一半人口的反应。' }],
    storage: '钢瓶', spill: '—', waste: '—',
    teaching: 'N₂ 化学性质稳定的关键是 N≡N 三键键能极高。它虽占空气 78%，却常被忽略。',
    grade_level: 1, tags: ['气体', '稳定']
  }),
  nh3: C({
    id: 'nh3', name: '氨', en: 'Ammonia', formula: 'NH₃', mw: 17.03, cas: '7664-41-7',
    smiles: 'N',
    appearance: '无色气体', odor: '强烈刺激性气味（化肥味）',
    props: { density: '0.76 g/L（比空气小）', mp: '-78 ℃', bp: '-33.5 ℃', solubility: '极易溶于水（1:700）', ph: '—', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS04', 'GHS05', 'GHS06'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H331：吸入有毒', 'H400：对水生生物毒性极大'], p: ['P261：避免吸入', 'P305+P351+P338：入眼立即冲洗'] },
    uses: ['制冷剂', '化肥原料', '实验室碱气'], dosage: '—',
    reactions: [
      { eq: 'NH₃ + HCl → NH₄Cl', note: '两瓶气体靠近产生白烟——检验氨的经典现象。' },
      { eq: 'NH₃ + H₂O ⇌ NH₃·H₂O ⇌ NH₄⁺ + OH⁻', note: '氨水显弱碱性，使酚酞变红。' }
    ],
    storage: '耐压容器，通风阴凉', spill: '撤离并通风', waste: '水吸收',
    teaching: '喷泉实验的原理就是氨极易溶于水造成瓶内压强骤降。闻气体必须"扇闻"。',
    grade_level: 2, tags: ['气体', '碱性']
  }),
  ch4: C({
    id: 'ch4', name: '甲烷', en: 'Methane', alias: ['天然气', '沼气主要成分'], formula: 'CH₄', mw: 16.04, cas: '74-82-8',
    smiles: 'C',
    appearance: '无色无味气体', odor: '无气味（商品气加臭剂便于发现泄漏）',
    props: { density: '0.72 g/L（比空气小）', mp: '-182 ℃', bp: '-161.5 ℃', solubility: '极难溶于水', ph: '—', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS02', 'GHS04'], signal: '危险', h: ['H220：极易燃气体', 'H280：内含加压气体'], p: ['P210：远离热源/火花/明火'] },
    uses: ['燃料', '化工原料（合成氨、甲醇）'], dosage: '—',
    reactions: [
      { eq: 'CH₄ + 2O₂ →(点燃) CO₂ + 2H₂O', note: '明亮蓝色火焰；是天然气的完全燃烧。' }
    ],
    storage: '钢瓶/管道燃气，通风', spill: '关阀通风禁明火', waste: '—',
    teaching: '可燃气体点燃前都要验纯。最简式 CH₄ 是有机物里氢含量最高的，燃烧产物干净，是"清洁能源"。',
    grade_level: 1, tags: ['气体', '有机物', '易燃']
  }),
  cl2: C({
    id: 'cl2', name: '氯气', en: 'Chlorine', formula: 'Cl₂', mw: 70.90, cas: '7782-50-5',
    smiles: 'ClCl',
    appearance: '黄绿色气体', odor: '强烈刺激性窒息气味',
    props: { density: '3.21 g/L（比空气大）', mp: '-101 ℃', bp: '-34.6 ℃', solubility: '可溶于水（1:2）', ph: '—', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS05', 'GHS06', 'GHS09'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H331：吸入有毒', 'H400：对水生生物毒性极大'], p: ['P260：不要吸入', 'P305+P351+P338：入眼立即冲洗'] },
    uses: ['自来水消毒', '制盐酸、漂白粉', '合成 PVC'], dosage: '—',
    reactions: [
      { eq: 'Cl₂ + 2NaOH → NaCl + NaClO + H₂O', note: '烧碱尾气吸收；也是 84 消毒液有效成分的来源。' },
      { eq: 'Cl₂ + H₂O ⇌ HCl + HClO', note: '氯水杀菌漂白的本质是 HClO。' }
    ],
    storage: '钢瓶，通风防漏', spill: '撤离、逆风向疏散', waste: '碱液吸收',
    teaching: '⚠ 安全教学：84 消毒液与洁厕灵混用会产生氯气，家中绝不能混用。历史上氯气曾用作化学武器，一战 "黄绿烟" 即它。',
    grade_level: 2, tags: ['气体', '剧毒', '卤素']
  }),
  so2: C({
    id: 'so2', name: '二氧化硫', en: 'Sulfur dioxide', formula: 'SO₂', mw: 64.06, cas: '7446-09-5',
    smiles: 'O=S=O',
    appearance: '无色气体', odor: '刺激性气味',
    props: { density: '2.86 g/L', mp: '-76 ℃', bp: '-10 ℃', solubility: '易溶于水（1:40）', ph: '—', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS05', 'GHS06'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H331：吸入有毒'], p: ['P261：避免吸入'] },
    uses: ['制硫酸', '纸浆漂白', '食品（少量 SO₂ 作防腐，需严控限量）'], dosage: '—',
    reactions: [
      { eq: 'S + O₂ →(点燃) SO₂', note: '硫在空气中淡蓝色火焰，氧气中蓝紫色。' },
      { eq: 'SO₂ + H₂O ⇌ H₂SO₃', note: '亚硫酸——酸雨的"前半生"。' }
    ],
    storage: '钢瓶', spill: '通风撤离', waste: '碱液吸收',
    teaching: '酸雨 pH<5.6，主要祸首是 SO₂ 与氮氧化物。SO₂ 使品红褪色（可逆），这是它区别于氯水的检验法。',
    grade_level: 2, tags: ['气体', '污染物']
  }),
  hcl_g: C({
    id: 'hcl_g', name: '氯化氢', en: 'Hydrogen chloride', formula: 'HCl', mw: 36.46, cas: '7647-01-0',
    smiles: 'Cl',
    appearance: '无色气体', odor: '刺激性气味（在空气中成白雾）',
    props: { density: '1.63 g/L', mp: '-114 ℃', bp: '-85 ℃', solubility: '极易溶于水（1:500）', ph: '—', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS05', 'GHS06'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H331：吸入有毒'], p: ['P260', 'P305+P351+P338'] },
    uses: ['溶于水得盐酸', '工业氯化'], dosage: '—',
    reactions: [{ eq: 'HCl + NH₃ → NH₄Cl', note: '白烟：浓盐酸与浓氨水瓶口靠近的演示。' }],
    storage: '钢瓶', spill: '通风撤离', waste: '水吸收',
    teaching: '浓盐酸瓶口"白雾"是 HCl 与水蒸气形成的小液滴（雾），不是烟（固体小颗粒）。',
    grade_level: 2, tags: ['气体', '酸性']
  }),

  /* ————— 酸 ————— */
  hcl: C({
    id: 'hcl', name: '盐酸', en: 'Hydrochloric acid', alias: ['氢氯酸'], formula: 'HCl（水溶液）', mw: 36.46, cas: '7647-01-0',
    smiles: 'Cl',
    appearance: '无色透明液体（工业品因含铁显黄色）', odor: '刺激性酸味',
    props: { density: '1.19 g/cm³（浓，38%）', mp: '—', bp: '挥发', solubility: '与水任意比混溶', ph: '<1（浓）', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS05', 'GHS07'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H335：可致呼吸道刺激'], p: ['P280：戴防护手套/护目镜', 'P305+P351+P338：入眼立即用水冲洗'] },
    uses: ['除铁锈', '实验室制 CO₂、H₂', '与碱中和', '检验碳酸盐'], dosage: '一般取 5–10 mL',
    reactions: [
      { eq: 'Fe₂O₃ + 6HCl → 2FeCl₃ + 3H₂O', note: '铁锈消失、溶液变黄——除锈原理。' },
      { eq: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑', note: '大理石表面冒气泡。' }
    ],
    storage: '玻璃瓶密封，阴凉处（挥发出 HCl 使瓶口结白雾）', spill: '大量撒碳酸钠中和后冲洗', waste: '用石灰乳中和后排放',
    teaching: '浓盐酸敞口放置会变稀（挥发出 HCl），溶质质量分数下降——"敞口变质"考题常客。',
    grade_level: 1, tags: ['酸', '挥发']
  }),
  h2so4: C({
    id: 'h2so4', name: '硫酸', en: 'Sulfuric acid', formula: 'H₂SO₄', mw: 98.08, cas: '7664-93-9',
    smiles: 'OS(=O)(=O)O',
    appearance: '无色油状黏稠液体', odor: '无气味',
    props: { density: '1.84 g/cm³（浓）', mp: '10 ℃', bp: '338 ℃', solubility: '与水任意比混溶（剧烈放热）', ph: '<1（浓）', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS05', 'GHS07'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H290：可能腐蚀金属'], p: ['P280', 'P301+P330+P331：吞咽后漱口，勿催吐', 'P305+P351+P338'] },
    uses: ['稀释配制稀硫酸', '金属除锈', '干燥剂（浓）', '蓄电池'], dosage: '稀硫酸一般 5–10 mL',
    reactions: [
      { eq: 'Zn + H₂SO₄(稀) → ZnSO₄ + H₂↑', note: '实验室制氢气。' },
      { eq: 'BaCl₂ + H₂SO₄ → BaSO₄↓ + 2HCl', note: '白色沉淀不溶于酸——检验硫酸根。' }
    ],
    storage: '密封玻璃瓶，远离金属与有机物', spill: '先用布吸干再用大量水冲，最后涂 3% NaHCO₃', waste: '石灰乳中和',
    teaching: '稀释浓硫酸铁律：酸入水、沿壁缓加、边加边搅（"酸入水"绝不"水入酸"！）。浓硫酸的三大特性：吸水性（干燥剂）、脱水性（蔗糖变黑面包）、强氧化性。',
    grade_level: 2, tags: ['酸', '腐蚀', '强氧化剂']
  }),
  hno3: C({
    id: 'hno3', name: '硝酸', en: 'Nitric acid', formula: 'HNO₃', mw: 63.01, cas: '7697-37-2',
    smiles: 'O[N+](=O)[O-]',
    appearance: '无色液体（久置微黄——分解出 NO₂）', odor: '刺激性气味',
    props: { density: '1.40 g/cm³（浓，68%）', mp: '-42 ℃', bp: '83 ℃（纯）', solubility: '与水任意比混溶', ph: '<1（浓）', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS03', 'GHS05', 'GHS07'], signal: '危险', h: ['H290：可能腐蚀金属', 'H314：造成严重皮肤灼伤', 'H335：可致呼吸道刺激'], p: ['P280', 'P305+P351+P338'] },
    uses: ['制化肥（硝铵）', '染料炸药工业', '王水成分'], dosage: '—',
    reactions: [{ eq: 'Cu + 4HNO₃(浓) → Cu(NO₃)₂ + 2NO₂↑ + 2H₂O', note: '与铜剧烈反应产生红棕色 NO₂——稀硝酸产生无色 NO。' }],
    storage: '棕色瓶避光阴凉（见光易分解）', spill: '碳酸钠覆盖中和', waste: '石灰乳中和',
    teaching: '硝酸无论浓稀都有强氧化性，与金属反应不产生 H₂——这是它与盐酸/稀硫酸的关键区别。',
    grade_level: 3, tags: ['酸', '强氧化剂']
  }),
  ch3cooh: C({
    id: 'ch3cooh', name: '乙酸', en: 'Acetic acid', alias: ['醋酸', '冰醋酸（纯品）'], formula: 'CH₃COOH', mw: 60.05, cas: '64-19-7',
    smiles: 'CC(=O)O',
    appearance: '无色液体（纯品低于 16.6 ℃ 凝结成冰状）', odor: '强烈醋味',
    props: { density: '1.05 g/cm³', mp: '16.6 ℃', bp: '117.9 ℃', solubility: '与水任意比混溶', ph: '≈2.4（0.1 mol/L）', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS02', 'GHS05'], signal: '危险', h: ['H226：易燃液体和蒸气', 'H314：造成严重皮肤灼伤'], p: ['P210：远离明火'] },
    uses: ['食醋主要成分（3–5%）', '化工原料', '除水垢'], dosage: '—',
    reactions: [{ eq: 'CH₃COOH + NaHCO₃ → CH₃COONa + H₂O + CO₂↑', note: '醋与小苏打反应——家用去污/蒸蛋糕起泡原理。' }],
    storage: '密封远离火源', spill: '水冲洗', waste: '稀释排放',
    teaching: '弱酸（部分电离），但酸的通性一样不少。生活中"陈醋越陈越香"是酯化反应慢慢进行的结果。',
    grade_level: 2, tags: ['酸', '有机物']
  }),

  /* ————— 碱 ————— */
  naoh: C({
    id: 'naoh', name: '氢氧化钠', en: 'Sodium hydroxide', alias: ['烧碱', '火碱', '苛性钠'], formula: 'NaOH', mw: 40.00, cas: '1310-73-2',
    smiles: '[Na+].[OH-]',
    appearance: '白色片状/粒状固体，易潮解', odor: '无气味',
    props: { density: '2.13 g/cm³', mp: '318 ℃', bp: '1390 ℃', solubility: '极易溶（109 g/100 g 水，20 ℃），溶解放热', ph: '14（浓溶液）', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS05'], signal: '危险', h: ['H290：可能腐蚀金属', 'H314：造成严重皮肤灼伤'], p: ['P280', 'P305+P351+P338', 'P405：上锁保管'] },
    uses: ['吸收 CO₂/SO₂ 等酸性气体', '制肥皂', '造纸', '滴定碱标液'], dosage: '固体一般 < 2 g，溶液 5–10 mL',
    reactions: [
      { eq: '2NaOH + CO₂ → Na₂CO₃ + H₂O', note: 'NaOH 敞口吸收 CO₂ 变质（滴加稀盐酸检验气泡）。' },
      { eq: 'NaOH + HCl → NaCl + H₂O', note: '中和反应：酸碱恰好中和 pH=7，放热。' }
    ],
    storage: '密封塑料瓶（不可用玻璃塞！NaOH 腐蚀玻璃生成 Na₂SiO₃ 使塞子粘住）', spill: '固体扫起回收，残液大量水冲', waste: '中和至中性排放',
    teaching: '潮解+吸收 CO₂ 是它"变质"的双重原因。手感滑腻感就是腐蚀皮肤的表现——实验必须戴手套。',
    grade_level: 1, tags: ['碱', '腐蚀']
  }),
  ca_oh2: C({
    id: 'ca_oh2', name: '氢氧化钙', en: 'Calcium hydroxide', alias: ['熟石灰', '消石灰', '石灰水（饱和溶液）'], formula: 'Ca(OH)₂', mw: 74.09, cas: '1305-62-0',
    smiles: '[Ca+2].[OH-].[OH-]',
    appearance: '白色粉末状固体', odor: '无气味',
    props: { density: '2.24 g/cm³', mp: '580 ℃（脱水）', bp: '—', solubility: '微溶（0.165 g/100 g 水，20 ℃）', ph: '≈12.4（饱和石灰水）', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS07'], signal: '警告', h: ['H315：造成皮肤刺激', 'H318：造成严重眼损伤'], p: ['P280', 'P305+P351+P338'] },
    uses: ['检验 CO₂（澄清石灰水）', '改良酸性土壤', '砌砖抹墙', '配制波尔多液'], dosage: '石灰水 5 mL 足够',
    reactions: [
      { eq: 'Ca(OH)₂ + CO₂ → CaCO₃↓ + H₂O', note: '石灰水变浑浊；石灰浆刷墙后变硬同此理。' },
      { eq: 'CaO + H₂O → Ca(OH)₂', note: '生石灰消化放热。' }
    ],
    storage: '密封防潮（吸收 CO₂ 变质）', spill: '扫净冲洗', waste: '掩埋/中和',
    teaching: '微溶却举足轻重：中学检验 CO₂ 只认石灰水，不认 NaOH（NaOH 吸收 CO₂ 无现象）。',
    grade_level: 1, tags: ['碱', '微溶']
  }),
  nh3w: C({
    id: 'nh3w', name: '氨水', en: 'Ammonia water', alias: ['氢氧化铵'], formula: 'NH₃·H₂O', mw: 35.05, cas: '1336-21-6',
    smiles: 'N.O',
    appearance: '无色透明液体', odor: '强烈刺激性氨味',
    props: { density: '0.91 g/cm³（25%）', mp: '—', bp: '挥发（放出 NH₃）', solubility: '与水任意比混溶', ph: '≈11.6（1 mol/L）', corrosive: true, volatile: true },
    ghs: { pictos: ['GHS05', 'GHS07'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H335：可致呼吸道刺激'], p: ['P261：避免吸入', 'P305+P351+P338'] },
    uses: ['唯一可加热分解的常见碱（检验铝/氢氧化物两性）', '化肥', '实验室喷泉实验'], dosage: '5–10 mL',
    reactions: [{ eq: 'NH₃·H₂O →(Δ) NH₃↑ + H₂O', note: '氨水受热分解逸出氨气。' }],
    storage: '密封阴凉（挥发出 NH₃ 使浓度下降）', spill: '通风、水冲', waste: '稀酸中和',
    teaching: '氨水中真正电离的是 NH₃·H₂O，不能写成 NH₄OH 为主——命名规范考点。',
    grade_level: 2, tags: ['碱', '挥发']
  }),

  /* ————— 盐 ————— */
  nacl: C({
    id: 'nacl', name: '氯化钠', en: 'Sodium chloride', alias: ['食盐', '盐'], formula: 'NaCl', mw: 58.44, cas: '7647-14-5',
    smiles: '[Na+].[Cl-]',
    appearance: '白色晶体', odor: '无气味',
    props: { density: '2.16 g/cm³', mp: '801 ℃', bp: '1413 ℃', solubility: '36 g/100 g 水（20 ℃，受温度影响小）', ph: '7', corrosive: false, volatile: false },
    uses: ['食用调味', '配制生理盐水（0.9%）', '电解制 NaOH/Cl₂', '融雪剂'], dosage: '配制 5% 溶液：5 g 溶于 95 g 水',
    reactions: [{ eq: '2NaCl + 2H₂O --通电--> 2NaOH + H₂↑ + Cl₂↑', note: '氯碱工业——食盐电解出三种基础化工原料。' }],
    storage: '普通密封', spill: '回收', waste: '—',
    teaching: '"5% NaCl"计算：溶质 5 g + 水 95 g = 100 g 溶液，不是 5 g 加 5 g！溶解度曲线最平缓的常见盐，结晶用蒸发而非降温。',
    grade_level: 0, tags: ['盐', '基础']
  }),
  kcl: C({
    id: 'kcl', name: '氯化钾', en: 'Potassium chloride', formula: 'KCl', mw: 74.55, cas: '7447-40-7',
    smiles: '[K+].[Cl-]',
    appearance: '白色晶体', odor: '无气味',
    props: { density: '1.98 g/cm³', mp: '770 ℃', bp: '—', solubility: '34.2 g/100 g 水（20 ℃）', ph: '7', corrosive: false, volatile: false },
    uses: ['钾肥（K₂O 标记）', '低钠盐成分', '缓冲液'], dosage: '—',
    reactions: [{ eq: 'KCl + AgNO₃ → AgCl↓ + KNO₃', note: '白色沉淀不溶于稀硝酸——Cl⁻ 检验。' }],
    storage: '普通密封', spill: '回收', waste: '—',
    teaching: '焰色反应透过蓝色钴玻璃观察呈紫色——区别 K⁺ 与 Na⁺。',
    grade_level: 1, tags: ['盐', '化肥']
  }),
  cacl2: C({
    id: 'cacl2', name: '氯化钙', en: 'Calcium chloride', formula: 'CaCl₂', mw: 110.98, cas: '10043-52-4',
    smiles: '[Cl-].[Cl-].[Ca+2]',
    appearance: '白色固体（易潮解）', odor: '无气味',
    props: { density: '2.15 g/cm³', mp: '782 ℃', bp: '—', solubility: '74.5 g/100 g 水（20 ℃），溶解放热', ph: '≈9（弱碱性）', corrosive: false, volatile: false },
    uses: ['干燥剂（不能干燥 NH₃，会与其结合）', '融雪剂', '制冷剂'], dosage: '—',
    reactions: [{ eq: 'CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl', note: '白色沉淀。' }],
    storage: '密封防潮', spill: '回收', waste: '—',
    teaching: '潮解 ≠ 溶解：潮解是固体表面吸收空气水分逐步溶解。用它干燥气体时要避开氨气。',
    grade_level: 1, tags: ['盐', '干燥剂']
  }),
  nh4cl: C({
    id: 'nh4cl', name: '氯化铵', en: 'Ammonium chloride', formula: 'NH₄Cl', mw: 53.49, cas: '12125-02-0',
    smiles: '[Cl-].[NH4+]',
    appearance: '白色晶体', odor: '无气味',
    props: { density: '1.53 g/cm³', mp: '338 ℃（升华分解）', bp: '—', solubility: '37.2 g/100 g 水（20 ℃）', ph: '≈5（弱酸性）', corrosive: false, volatile: false },
    uses: ['氮肥', '干电池电解质', '焊接除锈助焊剂'], dosage: '—',
    reactions: [{ eq: 'NH₄Cl + NaOH →(Δ) NaCl + NH₃↑ + H₂O', note: '润湿红色石蕊试纸变蓝——检验铵根离子的标准方法。' }],
    storage: '密封阴凉防潮', spill: '回收', waste: '—',
    teaching: '铵态氮肥不能与碱（草木灰、熟石灰）混用，否则氨逸出肥效降低。',
    grade_level: 1, tags: ['盐', '铵盐', '化肥']
  }),
  na2co3: C({
    id: 'na2co3', name: '碳酸钠', en: 'Sodium carbonate', alias: ['纯碱', '苏打', '块碱'], formula: 'Na₂CO₃', mw: 105.99, cas: '497-19-8',
    smiles: '[Na+].[Na+].[O-]C(=O)[O-]',
    appearance: '白色粉末', odor: '无气味',
    props: { density: '2.53 g/cm³', mp: '851 ℃', bp: '—', solubility: '21.5 g/100 g 水（20 ℃）', ph: '≈11.6（碱性！）', corrosive: false, volatile: false },
    uses: ['玻璃造纸洗涤工业', '中和酸', '面食去酸'], dosage: '—',
    reactions: [
      { eq: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑', note: '滴盐酸冒气泡。' },
      { eq: 'Na₂CO₃ + Ca(OH)₂ → CaCO₃↓ + 2NaOH', note: '工业制烧碱的古老方法。' }
    ],
    storage: '密封防潮', spill: '回收', waste: '—',
    teaching: '"纯碱不是碱"——它是盐，但因水解显碱性，能去油污。与 NaHCO₃ 鉴别：加 CaCl₂/滴酚酞或加热（Na₂CO₃ 热稳定）。',
    grade_level: 1, tags: ['盐', '碳酸盐']
  }),
  nahco3: C({
    id: 'nahco3', name: '碳酸氢钠', en: 'Sodium bicarbonate', alias: ['小苏打', '酸式碳酸钠'], formula: 'NaHCO₃', mw: 84.01, cas: '144-55-8',
    smiles: '[Na+].C(=O)(O)[O-]',
    appearance: '白色细小晶体', odor: '无气味',
    props: { density: '2.20 g/cm³', mp: '270 ℃（分解）', bp: '—', solubility: '9.6 g/100 g 水（20 ℃，比纯碱小）', ph: '≈8.3（弱碱性）', corrosive: false, volatile: false },
    uses: ['发酵粉', '治疗胃酸过多', '灭火器干粉', '中和酸（处理硫酸泄漏）'], dosage: '—',
    reactions: [
      { eq: '2NaHCO₃ →(Δ) Na₂CO₃ + H₂O + CO₂↑', note: '受热分解——与 Na₂CO₃ 的鉴别方法。' },
      { eq: 'NaHCO₃ + HCl → NaCl + H₂O + CO₂↑', note: '与胃酸反应——抗酸药原理。' }
    ],
    storage: '密封阴凉', spill: '回收', waste: '—',
    teaching: '等浓度时碱性弱于纯碱；溶解度小于纯碱——"侯氏制碱法"正是利用这一点析出 NaHCO₃。',
    grade_level: 1, tags: ['盐', '碳酸盐']
  }),
  caco3: C({
    id: 'caco3', name: '碳酸钙', en: 'Calcium carbonate', alias: ['石灰石', '大理石', '贝壳主要成分'], formula: 'CaCO₃', mw: 100.09, cas: '1317-65-3',
    smiles: 'O=C([O-])[O-].[Ca+2]',
    appearance: '白色固体（大理石常带纹理）', odor: '无气味',
    props: { density: '2.71 g/cm³', mp: '825 ℃（分解）', bp: '—', solubility: '不溶（0.0013 g/100 g 水）', ph: '—', corrosive: false, volatile: false },
    uses: ['实验室制 CO₂ 原料', '建筑材料', '补钙剂', '造纸填料'], dosage: '取黄豆粒大小数粒',
    reactions: [
      { eq: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑', note: '冒出大量气泡。' },
      { eq: 'CaCO₃ →(高温) CaO + CO₂↑', note: '石灰石煅烧——人类最古老的"化学工艺"之一。' }
    ],
    storage: '普通', spill: '回收', waste: '—',
    teaching: '不能用稀硫酸制 CO₂：生成的 CaSO₄ 微溶盖在大理石表面，反应"哑火"。',
    grade_level: 0, tags: ['盐', '碳酸盐']
  }),
  cuso4: C({
    id: 'cuso4', name: '硫酸铜', en: 'Copper(II) sulfate', alias: ['无水硫酸铜'], formula: 'CuSO₄', mw: 159.61, cas: '7758-98-3',
    smiles: '[Cu+2].[O-]S(=O)(=O)[O-]',
    appearance: '白色粉末', odor: '无气味',
    props: { density: '3.60 g/cm³', mp: '560 ℃（分解）', bp: '—', solubility: '20.7 g/100 g 水（20 ℃）', ph: '≈4（酸性）', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS07', 'GHS09'], signal: '警告', h: ['H302：吞咽有害', 'H319：造成眼刺激', 'H410：对水生生物毒性极大'], p: ['P273：避免释放入环境'] },
    uses: ['检验水（白→蓝）', '配制波尔多液', '镀铜'], dosage: '数粒即可',
    reactions: [
      { eq: 'CuSO₄ + 5H₂O → CuSO₄·5H₂O', note: '白色粉末变蓝色晶体——检验有机物中含水的经典现象。' },
      { eq: 'Fe + CuSO₄ → FeSO₄ + Cu', note: '"湿法炼铜"：铁钉表面覆盖红色铜，溶液蓝色变浅绿。' }
    ],
    storage: '密封（防吸水）', spill: '回收，不可入下水道', waste: '重金属盐，统一回收处理',
    teaching: '无水硫酸铜是检验"水存在"的专属试剂（白→蓝）；它有毒，切勿用于食物演示。',
    grade_level: 1, tags: ['盐', '重金属盐']
  }),
  cuso4_5: C({
    id: 'cuso4_5', name: '五水硫酸铜', en: 'Copper(II) sulfate pentahydrate', alias: ['胆矾', '蓝矾'], formula: 'CuSO₄·5H₂O', mw: 249.69, cas: '7758-99-8',
    smiles: null,
    appearance: '蓝色晶体', odor: '无气味',
    props: { density: '2.28 g/cm³', mp: '110 ℃（失结晶水）', bp: '—', solubility: '31.6 g/100 g 水（20 ℃）', ph: '≈4', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS07', 'GHS09'], signal: '警告', h: ['H302：吞咽有害', 'H319：造成眼刺激', 'H410：对水生生物毒性极大'], p: ['P273'] },
    uses: ['结晶水演示', '配制 Cu²⁺ 溶液'], dosage: '数粒',
    reactions: [{ eq: 'CuSO₄·5H₂O →(Δ) CuSO₄ + 5H₂O↑', note: '蓝色晶体加热变白，试管口出现水珠——结晶水不是"湿"的，是化学结合的水。' }],
    storage: '密封', spill: '回收', waste: '重金属盐回收',
    teaching: '胆矾是纯净物（五水硫酸铜一种物质），质量守恒计算中 5H₂O 参与质量——易错点。',
    grade_level: 1, tags: ['盐', '结晶水']
  }),
  feso4: C({
    id: 'feso4', name: '硫酸亚铁', en: 'Iron(II) sulfate', alias: ['绿矾（七水物）'], formula: 'FeSO₄', mw: 151.91, cas: '7720-78-7',
    smiles: '[Fe+2].[O-]S(=O)(=O)[O-]',
    appearance: '浅绿色晶体（水溶液浅绿）', odor: '无气味',
    props: { density: '3.65 g/cm³', mp: '64 ℃（七水物分解）', bp: '—', solubility: '易溶', ph: '≈4', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS07'], signal: '警告', h: ['H302：吞咽有害', 'H315：造成皮肤刺激'], p: ['P280'] },
    uses: ['补铁剂', '制蓝黑墨水', '净水絮凝剂'], dosage: '—',
    reactions: [{ eq: 'FeSO₄ + 2NaOH → Fe(OH)₂↓ + Na₂SO₄', note: '先白色絮状沉淀，随即变灰绿、最终变红褐色 Fe(OH)₃——"白→灰绿→红褐"必背现象链。' }],
    storage: '密封避光（Fe²⁺ 易被氧化为 Fe³⁺）', spill: '回收', waste: '回收处理',
    teaching: '浅绿色是 Fe²⁺ 的"名片色"，黄色是 Fe³⁺——溶液颜色是判断铁价态的第一线索。',
    grade_level: 2, tags: ['盐', '铁盐']
  }),
  kno3: C({
    id: 'kno3', name: '硝酸钾', en: 'Potassium nitrate', alias: ['硝石', '火硝'], formula: 'KNO₃', mw: 101.10, cas: '7757-79-1',
    smiles: '[K+].[O-][N+](=O)O',
    appearance: '无色/白色晶体', odor: '无气味',
    props: { density: '2.11 g/cm³', mp: '334 ℃', bp: '400 ℃（分解）', solubility: '31.6 g/100 g 水（20 ℃）；20→80 ℃ 飙升至 169 g', ph: '7', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS03'], signal: '警告', h: ['H272：可能加剧火灾'], p: ['P210：远离热源'] },
    uses: ['黑火药成分（一硝二磺三木炭）', '复合肥', '溶解度曲线教学标配'], dosage: '—',
    reactions: [{ eq: '2KNO₃ + S + 3C →(点燃) K₂S + N₂↑ + 3CO₂↑', note: '黑火药爆炸原理——中国炼丹家的重要发现。' }],
    storage: '阴凉避火，远离硫磺木炭', spill: '回收', waste: '—',
    teaching: '溶解度受温度影响巨大，是"冷却热饱和溶液结晶"教学的第一案例——也是溶解度曲线陡升的代表。',
    grade_level: 1, tags: ['盐', '氧化剂', '黑火药']
  }),
  agno3: C({
    id: 'agno3', name: '硝酸银', en: 'Silver nitrate', formula: 'AgNO₃', mw: 169.87, cas: '7761-88-8',
    smiles: '[Ag+].[O-][N+](=O)O',
    appearance: '无色/白色晶体', odor: '无气味',
    props: { density: '4.35 g/cm³', mp: '212 ℃', bp: '444 ℃（分解）', solubility: '122 g/100 g 水（20 ℃）', ph: '≈5', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS03', 'GHS05', 'GHS09'], signal: '危险', h: ['H272：可能加剧火灾', 'H314：造成严重皮肤灼伤', 'H400：对水生生物毒性极大'], p: ['P280', 'P273'] },
    uses: ['检验 Cl⁻', '镀银', '照相感光材料'], dosage: '2–3 滴稀溶液',
    reactions: [{ eq: 'AgNO₃ + NaCl → AgCl↓ + NaNO₃', note: '白色沉淀，不溶于稀硝酸——Cl⁻ 的专属检验。' }],
    storage: '棕色瓶避光（见光分解出银）', spill: '回收（皮肤沾上会变黑，数天褪）', waste: '重金属回收',
    teaching: '碰到皮肤变黑是 AgNO₃ 见光分解出银——无大碍但会留印数日。检验 Cl⁻ 必须加稀硝酸排除 CO₃²⁻ 等干扰。',
    grade_level: 2, tags: ['盐', '贵重试剂']
  }),
  bacl2: C({
    id: 'bacl2', name: '氯化钡', en: 'Barium chloride', formula: 'BaCl₂', mw: 208.23, cas: '10361-37-2',
    smiles: '[Ba+2].[Cl-].[Cl-]',
    appearance: '白色晶体', odor: '无气味',
    props: { density: '3.86 g/cm³', mp: '962 ℃', bp: '1560 ℃', solubility: '35.7 g/100 g 水（20 ℃）', ph: '≈7', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS06'], signal: '危险', h: ['H301：吞咽有毒'], p: ['P264：洗后洗手', 'P301+P310：吞咽立即就医'] },
    uses: ['检验 SO₄²⁻', '硫酸根定量'], dosage: '2–3 滴',
    reactions: [{ eq: 'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl', note: '白色沉淀不溶于稀硝酸——SO₄²⁻ 专属检验。' }],
    storage: '上锁保管（剧毒）', spill: '回收，可用 Na₂SO₄ 转化为无毒 BaSO₄', waste: '剧毒物统一回收',
    teaching: '⚠ 剧毒！可溶性钡盐中毒用硫酸镁溶液洗胃解毒（生成不溶 BaSO₄）。检验 SO₄²⁻ 先加稀盐酸排除 Ag⁺/CO₃²⁻ 干扰。',
    grade_level: 2, tags: ['盐', '剧毒']
  }),
  baso4: C({
    id: 'baso4', name: '硫酸钡', en: 'Barium sulfate', alias: ['钡餐'], formula: 'BaSO₄', mw: 233.39, cas: '7727-43-7',
    smiles: '[Ba+2].[O-]S(=O)(=O)[O-]',
    appearance: '白色粉末', odor: '无气味',
    props: { density: '4.49 g/cm³', mp: '1580 ℃', bp: '—', solubility: '不溶（0.00024 g/100 g 水），也不溶于酸', ph: '—', corrosive: false, volatile: false },
    uses: ['"钡餐"X 光造影', '白色颜料', '鉴定 SO₄²⁻ 的沉淀'], dosage: '—',
    reactions: [{ eq: 'Ba(OH)₂ + H₂SO₄ → BaSO₄↓ + 2H₂O', note: '生成不溶且不溶于酸的白色沉淀。' }],
    storage: '普通', spill: '回收', waste: '—',
    teaching: 'BaSO₄ 不溶于酸所以能做钡餐（BaCl₂ 溶于水剧毒所以不能！）——"不溶性"是安全的关键。',
    grade_level: 1, tags: ['盐', '沉淀']
  }),
  agcl: C({
    id: 'agcl', name: '氯化银', en: 'Silver chloride', formula: 'AgCl', mw: 143.32, cas: '7783-90-6',
    smiles: '[Ag+].[Cl-]',
    appearance: '白色沉淀', odor: '无气味',
    props: { density: '5.56 g/cm³', mp: '455 ℃', bp: '—', solubility: '极难溶，不溶于稀硝酸', ph: '—', corrosive: false, volatile: false },
    uses: ['Cl⁻ 检验的沉淀', '感光材料'], dosage: '—',
    reactions: [{ eq: '2AgCl →(光照) 2Ag + Cl₂↑', note: '白色沉淀见光变灰黑（分解出银微粒）。' }],
    storage: '避光', spill: '回收', waste: '回收',
    teaching: '"白色沉淀 + 不溶于稀硝酸" = AgCl 或 BaSO₄，先加盐酸再加 AgNO₃ 可区分。',
    grade_level: 2, tags: ['盐', '沉淀']
  }),
  fecl3: C({
    id: 'fecl3', name: '氯化铁', en: 'Iron(III) chloride', formula: 'FeCl₃', mw: 162.20, cas: '7705-08-0',
    smiles: 'Cl[Fe](Cl)Cl',
    appearance: '棕黑色固体（水溶液黄色）', odor: '无气味',
    props: { density: '2.90 g/cm³', mp: '306 ℃', bp: '315 ℃（升华）', solubility: '易溶', ph: '≈2', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS05', 'GHS07'], signal: '危险', h: ['H302：吞咽有害', 'H314：造成严重皮肤灼伤'], p: ['P280'] },
    uses: ['净化水絮凝剂', '蚀刻电路板', 'KSCN 显色检验'], dosage: '2–3 滴',
    reactions: [{ eq: 'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl', note: '红褐色沉淀。' }],
    storage: '密封防潮', spill: '回收', waste: '回收',
    teaching: 'Fe³⁺ 遇 KSCN 变血红色，是灵敏度极高的检验；Fe³⁺+Cu 反应（蚀刻电路板的原理）。',
    grade_level: 2, tags: ['盐', '铁盐']
  }),

  /* ————— 氧化剂与过氧化物 ————— */
  kmno4: C({
    id: 'kmno4', name: '高锰酸钾', en: 'Potassium permanganate', alias: ['灰锰氧', 'PP粉'], formula: 'KMnO₄', mw: 158.03, cas: '7722-64-7',
    smiles: '[K+].[O-][Mn](=O)(=O)=O',
    appearance: '紫黑色细长结晶', odor: '无气味',
    props: { density: '2.70 g/cm³', mp: '240 ℃（分解）', bp: '—', solubility: '6.4 g/100 g 水（20 ℃），紫色溶液', ph: '—', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS03', 'GHS06', 'GHS09'], signal: '危险', h: ['H272：可能加剧火灾', 'H302：吞咽有害', 'H311：皮肤接触会中毒', 'H410：对水生生物毒性极大'], p: ['P210：远离热源/火源', 'P280：戴防护手套'] },
    uses: ['实验室制氧气', '消毒（0.1% 稀液）', '氧化剂滴定'], dosage: '约 2 g，铺满试管底部',
    reactions: [
      { eq: '2KMnO₄ →(Δ) K₂MnO₄ + MnO₂ + O₂↑', note: '紫黑色固体逐渐变黑，产生使带火星木条复燃的气体——本站工作台实验的主角。' }
    ],
    storage: '密封避光，远离可燃物与还原剂（浓硫酸+有机物接触剧烈反应）', spill: '大量用沙土覆盖', waste: '不可入下水道，统一回收',
    teaching: '试管口必须放棉花挡住粉末，否则粉末随气流进入导管堵塞/带入水槽使水变紫。停车时先撤导管后熄灯，防止水倒吸炸裂试管。',
    grade_level: 1, tags: ['氧化剂', '制氧']
  }),
  kclo3: C({
    id: 'kclo3', name: '氯酸钾', en: 'Potassium chlorate', formula: 'KClO₃', mw: 122.55, cas: '3811-04-9',
    smiles: '[K+].[O-]Cl(=O)=O',
    appearance: '白色晶体', odor: '无气味',
    props: { density: '2.32 g/cm³', mp: '356 ℃（分解）', bp: '—', solubility: '7.3 g/100 g 水（20 ℃）', ph: '—', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS03', 'GHS06'], signal: '危险', h: ['H271：可能引起燃烧或爆炸', 'H302：吞咽有害'], p: ['P210', 'P280'] },
    uses: ['制氧气（需 MnO₂ 催化）', '火柴头药料'], dosage: '—',
    reactions: [{ eq: '2KClO₃ →(MnO₂, Δ) 2KCl + 3O₂↑', note: 'MnO₂ 作催化剂使分解温度大幅降低——催化剂"改变速率、质量化学性质不变"的经典。' }],
    storage: '阴凉避光，严禁与红磷/硫/木炭混放研磨（爆炸！）', spill: '大量水溶解冲洗', waste: '统一回收',
    teaching: '⚠ 安全教学：KClO₃ 与红磷/硫磺接触研磨会爆炸——黑火药三成分绝不混合。催化剂 MnO₂ 在反应前后质量与化学性质不变。',
    grade_level: 1, tags: ['氧化剂', '制氧']
  }),
  mno2: C({
    id: 'mno2', name: '二氧化锰', en: 'Manganese dioxide', formula: 'MnO₂', mw: 86.94, cas: '1313-13-9',
    smiles: 'O=[Mn]=O',
    appearance: '黑色粉末', odor: '无气味',
    props: { density: '5.03 g/cm³', mp: '535 ℃（分解）', bp: '—', solubility: '不溶于水', ph: '—', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS07'], signal: '警告', h: ['H302：吞咽有害', 'H332：吸入有害'], p: ['P261'] },
    uses: ['H₂O₂/KClO₃ 分解的催化剂', '干电池去极化剂'], dosage: '少量（约 0.5 g）',
    reactions: [
      { eq: '2H₂O₂ →(MnO₂) 2H₂O + O₂↑', note: '加入 MnO₂ 立即剧烈冒泡——催化剂加快分解速率。' },
      { eq: 'MnO₂ + 4HCl(浓) →(Δ) MnCl₂ + Cl₂↑ + 2H₂O', note: '实验室制氯气（大学线，仅讲解不演示）。' }
    ],
    storage: '普通密封', spill: '回收', waste: '回收',
    teaching: '催化剂是中学化学最容易被误解的概念：它不改变产物量、自身质量不变，只改变"路走得多快"。',
    grade_level: 1, tags: ['催化剂', '黑色粉末']
  }),
  h2o2: C({
    id: 'h2o2', name: '过氧化氢', en: 'Hydrogen peroxide', alias: ['双氧水'], formula: 'H₂O₂', mw: 34.01, cas: '7722-84-1',
    smiles: 'OO',
    appearance: '无色透明液体', odor: '微弱特殊气味',
    props: { density: '1.11 g/cm³（30%）', mp: '-0.4 ℃（纯）', bp: '150 ℃（纯，受热分解）', solubility: '与水任意比混溶', ph: '≈4.5（稀）', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS05', 'GHS07'], signal: '危险', h: ['H302：吞咽有害', 'H314：造成严重皮肤灼伤'], p: ['P280', 'P305+P351+P338'] },
    uses: ['制氧气（绿色环保路线）', '伤口消毒（3%）', '漂白'], dosage: '5–10 mL（3–5%）',
    reactions: [{ eq: '2H₂O₂ →(MnO₂) 2H₂O + O₂↑', note: '加入 MnO₂ 剧烈冒泡；不加则缓慢分解——催化剂对比实验首选。' }],
    storage: '棕色瓶避光阴凉，远离金属杂质与热源', spill: '大量水稀释', waste: '稀释排放',
    teaching: '"绿色制氧"：产物只有水和氧气，无残渣。O 元素从 -1 价变 0 价和 -2 价，同一反应里"歧化"。',
    grade_level: 1, tags: ['氧化剂', '制氧']
  }),
  naclo: C({
    id: 'naclo', name: '次氯酸钠', en: 'Sodium hypochlorite', alias: ['84消毒液有效成分'], formula: 'NaClO', mw: 74.44, cas: '7681-52-9',
    smiles: '[Na+].[O-]Cl',
    appearance: '微黄色溶液（商品 84 消毒液为水溶液，含 5% 左右 NaClO）', odor: '刺激性氯味',
    props: { density: '≈1.1 g/cm³（商品液）', mp: '—', bp: '—', solubility: '易溶于水', ph: '≈11（碱性）', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS05', 'GHS07', 'GHS09'], signal: '危险', h: ['H314：造成严重皮肤灼伤', 'H400：对水生生物毒性极大'], p: ['P280：戴手套护目镜', 'P273：远离环境释放'] },
    uses: ['环境消毒', '漂白衣物'], dosage: '需按说明稀释（一般 1:100）',
    reactions: [{ eq: 'NaClO + 2HCl → NaCl + Cl₂↑ + H₂O', note: '⚠ 安全教学：与洁厕灵（含盐酸）混用产生剧毒氯气——家庭清洁剂绝对不能混用！' }],
    storage: '阴凉避光（遇光分解失效），远离酸性物品', spill: '大量水稀释冲洗', waste: '按危废处理',
    teaching: '安全红线知识：84+洁厕灵=氯气（剧毒）。消毒液与酒精也不能混用（生成有毒物质）。家庭存放务必分开放置。',
    grade_level: 0, tags: ['消毒', '家庭安全']
  }),

  /* ————— 氧化物 ————— */
  cuo: C({
    id: 'cuo', name: '氧化铜', en: 'Copper(II) oxide', alias: ['黑色氧化铜'], formula: 'CuO', mw: 79.55, cas: '1317-38-0',
    smiles: 'O=[Cu]',
    appearance: '黑色粉末', odor: '无气味',
    props: { density: '6.3 g/cm³', mp: '1326 ℃', bp: '—', solubility: '不溶于水，溶于酸', ph: '—', corrosive: false, volatile: false },
    uses: ['还原反应演示（H₂/CO/C 还原 CuO）', '玻璃着色'], dosage: '一药匙（铺薄层）',
    reactions: [
      { eq: 'H₂ + CuO →(Δ) Cu + H₂O', note: '黑色粉末逐渐变红，管口凝出水珠。' },
      { eq: 'CO + CuO →(Δ) Cu + CO₂', note: '黑色变红；尾气必须点燃处理（CO 有毒）。' }
    ],
    storage: '普通密封', spill: '回收', waste: '重金属回收',
    teaching: '"变红"是 CuO 被还原的标志。实验顺序铁律：先通气排空气，再加热；先停加热，再停气。',
    grade_level: 2, tags: ['氧化物', '还原演示']
  }),
  cao: C({
    id: 'cao', name: '氧化钙', en: 'Calcium oxide', alias: ['生石灰'], formula: 'CaO', mw: 56.08, cas: '1305-78-8',
    smiles: 'O=[Ca]',
    appearance: '白色/灰白色块状固体', odor: '无气味',
    props: { density: '3.32 g/cm³', mp: '2572 ℃', bp: '2850 ℃', solubility: '遇水剧烈反应', ph: '—（遇水成强碱）', corrosive: true, volatile: false },
    ghs: { pictos: ['GHS05'], signal: '危险', h: ['H314：造成严重皮肤灼伤'], p: ['P280', 'P305+P351+P338'] },
    uses: ['食品干燥剂', '自热米饭加热包', '建筑材料（煅烧制）'], dosage: '—',
    reactions: [{ eq: 'CaO + H₂O → Ca(OH)₂', note: '剧烈放热，水可沸腾——自热包原理。' }],
    storage: '密封防潮', spill: '不可直接碰水，干扫', waste: '—',
    teaching: '食品干燥剂里生石灰遇水放热——误食或入眼后果严重（碱灼伤），警示孩子不要拆包玩耍。',
    grade_level: 1, tags: ['氧化物', '干燥剂']
  }),
  fe2o3: C({
    id: 'fe2o3', name: '氧化铁', en: 'Iron(III) oxide', alias: ['铁锈主要成分', '铁红'], formula: 'Fe₂O₃', mw: 159.69, cas: '1309-37-1',
    smiles: null,
    appearance: '红棕色粉末', odor: '无气味',
    props: { density: '5.24 g/cm³', mp: '1565 ℃（分解）', bp: '—', solubility: '不溶于水，溶于酸', ph: '—', corrosive: false, volatile: false },
    uses: ['炼铁原料', '红色油漆颜料', '抛光粉'], dosage: '—',
    reactions: [
      { eq: 'Fe₂O₃ + 3CO →(高温) 2Fe + 3CO₂', note: '高炉炼铁核心反应。' },
      { eq: 'Fe₂O₃ + 6HCl → 2FeCl₃ + 3H₂O', note: '盐酸除铁锈，溶液变黄。' }
    ],
    storage: '普通', spill: '回收', waste: '—',
    teaching: '铁生锈条件：同时接触 O₂ 和 H₂O。防锈三招：保持干燥、涂油刷漆、镀保护层/牺牲阳极。',
    grade_level: 1, tags: ['氧化物', '炼铁']
  }),
  fe3o4: C({
    id: 'fe3o4', name: '四氧化三铁', en: 'Iron(II,III) oxide', alias: ['磁铁矿', '磁性氧化铁'], formula: 'Fe₃O₄', mw: 231.53, cas: '1317-61-9',
    smiles: null,
    appearance: '黑色晶体（有磁性）', odor: '无气味',
    props: { density: '5.18 g/cm³', mp: '1594 ℃', bp: '—', solubility: '不溶', ph: '—', corrosive: false, volatile: false },
    uses: ['磁性材料', '黑色颜料', 'Fe 在 O₂ 中燃烧产物'], dosage: '—',
    reactions: [{ eq: '3Fe + 2O₂ →(点燃) Fe₃O₄', note: '铁丝在氧气中火星四射，瓶底放水/沙防炸裂。' }],
    storage: '普通', spill: '回收', waste: '—',
    teaching: '初中最易写错的化学式之一：铁在氧气中燃烧生成 Fe₃O₄ 而不是 Fe₂O₃！',
    grade_level: 1, tags: ['氧化物', '磁性']
  }),
  al2o3: C({
    id: 'al2o3', name: '氧化铝', en: 'Aluminium oxide', formula: 'Al₂O₃', mw: 101.96, cas: '1344-28-1',
    smiles: null,
    appearance: '白色粉末', odor: '无气味',
    props: { density: '3.97 g/cm³', mp: '2054 ℃', bp: '—', solubility: '不溶于水', ph: '—', corrosive: false, volatile: false },
    uses: ['耐火材料', '刚玉/红蓝宝石主要成分', '铝表面保护膜'], dosage: '—',
    reactions: [{ eq: '2Al₂O₃ --电解--> 4Al + 3O₂↑', note: '电解铝工业（冰晶石降低熔点）。' }],
    storage: '普通', spill: '回收', waste: '—',
    teaching: '铝"抗腐蚀"的秘密：表面致密 Al₂O₃ 薄膜自动修复。这层膜让铝能与稀盐酸短暂"抗拒"反应。',
    grade_level: 2, tags: ['氧化物']
  }),

  /* ————— 金属与非金属单质 ————— */
  fe: C({
    id: 'fe', name: '铁', en: 'Iron', formula: 'Fe', mw: 55.85, cas: '7439-89-6',
    smiles: '[Fe]',
    appearance: '银灰色金属（粉为黑色）', odor: '无气味',
    props: { density: '7.87 g/cm³', mp: '1535 ℃', bp: '2750 ℃', solubility: '不溶于水', ph: '—', corrosive: false, volatile: false },
    uses: ['结构材料', '还原剂实验', '磁场应用'], dosage: '铁钉/铁粉少量',
    reactions: [
      { eq: 'Fe + CuSO₄ → FeSO₄ + Cu', note: '铁钉上长出红色铜——湿法炼铜。' },
      { eq: 'Fe + 2HCl → FeCl₂ + H₂↑', note: '产生气泡，溶液渐变浅绿。' }
    ],
    storage: '干燥防锈', spill: '回收', waste: '回收',
    teaching: '铁与稀盐酸/稀硫酸产生 Fe²⁺（浅绿色）不产 Fe³⁺（黄色）——价态控制考点。',
    grade_level: 1, tags: ['金属', '活动性 H 前']
  }),
  zn: C({
    id: 'zn', name: '锌', en: 'Zinc', formula: 'Zn', mw: 65.38, cas: '7440-66-6',
    smiles: '[Zn]',
    appearance: '银白色金属', odor: '无气味',
    props: { density: '7.14 g/cm³', mp: '419.5 ℃', bp: '907 ℃', solubility: '不溶于水', ph: '—', corrosive: false, volatile: false },
    uses: ['实验室制 H₂', '原电池负极', '镀锌防锈', '干电池外壳'], dosage: '锌粒数粒',
    reactions: [{ eq: 'Zn + H₂SO₄(稀) → ZnSO₄ + H₂↑', note: '锌粒表面冒气泡。' }],
    storage: '干燥', spill: '回收', waste: '回收',
    teaching: '制 H₂ 选锌：速率适中（Mg 太快难控、Fe 太慢）。锌在活动性顺序中位于 H 前。',
    grade_level: 1, tags: ['金属', '制氢']
  }),
  cu: C({
    id: 'cu', name: '铜', en: 'Copper', formula: 'Cu', mw: 63.55, cas: '7440-50-8',
    smiles: '[Cu]',
    appearance: '紫红色金属', odor: '无气味',
    props: { density: '8.96 g/cm³', mp: '1083 ℃', bp: '2562 ℃', solubility: '不溶于水', ph: '—', corrosive: false, volatile: false },
    uses: ['导线', '制作合金（黄铜/青铜）', '电极'], dosage: '铜片/铜丝',
    reactions: [
      { eq: 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag', note: '铜丝上长出银白色"银树"，溶液变蓝。' },
      { eq: '2Cu + O₂ →(Δ) 2CuO', note: '红色变黑。' }
    ],
    storage: '普通', spill: '回收', waste: '回收',
    teaching: 'Cu 在活动性顺序 H 之后：不与稀盐酸/稀硫酸反应，但能与硝酸/浓硫酸反应（大学线）。',
    grade_level: 1, tags: ['金属', 'H 后']
  }),
  mg: C({
    id: 'mg', name: '镁', en: 'Magnesium', formula: 'Mg', mw: 24.31, cas: '7439-95-4',
    smiles: '[Mg]',
    appearance: '银白色金属条', odor: '无气味',
    props: { density: '1.74 g/cm³', mp: '649 ℃', bp: '1090 ℃', solubility: '不溶于水', ph: '—', corrosive: false, volatile: false },
    uses: ['照明弹/烟花', '轻合金（航空航天）', '还原剂'], dosage: '一小段镁条（打磨）',
    reactions: [
      { eq: '2Mg + O₂ →(点燃) 2MgO', note: '剧烈燃烧，发出耀眼白光——绝不裸眼直视！' },
      { eq: 'Mg + 2HCl → MgCl₂ + H₂↑', note: '剧烈冒泡，是镁与酸反应速率快的教学演示。' }
    ],
    storage: '远离火源，砂纸打磨后立即使用', spill: '回收', waste: '回收',
    teaching: '镁条燃烧实验的铁律：必须用坩埚钳夹持、下方垫石棉网、绝不对着人。镁条燃烧的"白色固体"是 MgO。',
    grade_level: 1, tags: ['金属', '易燃']
  }),
  al: C({
    id: 'al', name: '铝', en: 'Aluminium', formula: 'Al', mw: 26.98, cas: '7429-90-5',
    smiles: '[Al]',
    appearance: '银白色金属', odor: '无气味',
    props: { density: '2.70 g/cm³', mp: '660 ℃', bp: '2467 ℃', solubility: '不溶于水', ph: '—', corrosive: false, volatile: false },
    uses: ['导线（轻量替代铜）', '易拉罐', '铝合金'], dosage: '铝片/铝箔',
    reactions: [{ eq: '2Al + Fe₂O₃ →(点燃) Al₂O₃ + 2Fe', note: '铝热反应——焊接铁轨，火花飞溅（仅观看视频，不现场演示）。' }],
    storage: '普通', spill: '回收', waste: '回收',
    teaching: '铝表面致密氧化膜是它" seeming 不活泼"的原因。铝箔燃烧实验必须先打磨去掉膜。',
    grade_level: 1, tags: ['金属']
  }),
  s: C({
    id: 's', name: '硫', en: 'Sulfur', alias: ['硫磺'], formula: 'S', mw: 32.06, cas: '7704-34-9',
    smiles: '[S]',
    appearance: '淡黄色粉末/块', odor: '燃烧时有刺激性气味',
    props: { density: '2.07 g/cm³', mp: '115 ℃', bp: '445 ℃', solubility: '不溶于水，微溶酒精，易溶 CS₂', ph: '—', corrosive: false, volatile: false },
    uses: ['制硫酸', '橡胶硫化', '火药'], dosage: '少量（约 0.2 g）',
    reactions: [{ eq: 'S + O₂ →(点燃) SO₂', note: '空气中淡蓝色火焰，氧气中蓝紫色——"同物不同景"经典。' }],
    storage: '远离氧化剂', spill: '回收', waste: '回收',
    teaching: '硫燃烧的集气瓶底放少量 NaOH 溶液吸收 SO₂，防污染——"瓶底放液"不只是防炸裂。',
    grade_level: 1, tags: ['非金属', '易燃']
  }),
  p_red: C({
    id: 'p_red', name: '红磷', en: 'Red phosphorus', formula: 'P₄（红磷以 P 表示）', mw: 30.97, cas: '7723-14-0',
    smiles: '[P]',
    appearance: '暗红色粉末', odor: '无气味',
    props: { density: '2.34 g/cm³', mp: '416 ℃（升华）', bp: '—', solubility: '不溶于水/CS₂', ph: '—', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS02'], signal: '警告', h: ['H228：易燃固体'], p: ['P210：远离热源'] },
    uses: ['测定空气中 O₂ 含量实验', '安全火柴侧面涂层', '阻燃剂'], dosage: '红磷过量（约 0.5 g）',
    reactions: [{ eq: '4P + 5O₂ →(点燃) 2P₂O₅', note: '大量白烟（P₂O₅ 固体小颗粒）——消耗 O₂ 使瓶内气压降低，进水约 1/5。' }],
    storage: '阴凉避火，与氯酸钾隔离', spill: '回收', waste: '回收',
    teaching: '"白烟不是白雾"：P₂O₅ 是固体颗粒（烟）。实验成功关键：装置气密性好、红磷足量、冷却后再读数。',
    grade_level: 1, tags: ['非金属', '易燃']
  }),
  c_carbon: C({
    id: 'c_carbon', name: '碳', en: 'Carbon', alias: ['木炭', '活性炭', '石墨'], formula: 'C', mw: 12.01, cas: '7440-44-0',
    smiles: '[C]',
    appearance: '黑色固体（木炭多孔、石墨片状有光泽）', odor: '无气味',
    props: { density: '2.26 g/cm³（石墨）', mp: '常压约 3652 ℃（升华）', bp: '—', solubility: '不溶', ph: '—', corrosive: false, volatile: false },
    uses: ['燃料', '吸附色素异味（活性炭）', '电极（石墨）', '铅笔芯'], dosage: '木炭小块',
    reactions: [
      { eq: 'C + O₂ →(点燃) CO₂', note: '发出白光，放热。' },
      { eq: 'C + 2CuO →(高温) 2Cu + CO₂↑', note: '黑色粉末变红——碳的还原性。' }
    ],
    storage: '干燥', spill: '回收', waste: '—',
    teaching: '活性炭的吸附是物理变化（孔隙表面捕获），与"漂白"（化学氧化）本质不同。',
    grade_level: 0, tags: ['非金属', '吸附']
  }),
  i2: C({
    id: 'i2', name: '碘', en: 'Iodine', formula: 'I₂', mw: 253.81, cas: '7553-56-2',
    smiles: 'II',
    appearance: '紫黑色固体（有金属光泽）', odor: '刺激性碘味',
    props: { density: '4.93 g/cm³', mp: '114 ℃', bp: '184 ℃', solubility: '微溶于水，易溶于酒精（碘酒）', ph: '—', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS07', 'GHS09'], signal: '警告', h: ['H312：皮肤接触有害', 'H332：吸入有害', 'H400：对水生生物毒性极大'], p: ['P273'] },
    uses: ['检验淀粉（变蓝）', '消毒（碘酒）', '加碘盐（KIO₃）'], dosage: '1–2 粒晶体',
    reactions: [{ eq: 'I₂ + 淀粉 → 蓝色复合物', note: '米饭/馒头/土豆遇碘酒变蓝——检验淀粉最灵敏的方法。' }],
    storage: '棕色瓶密封（易升华）', spill: '回收', waste: '回收',
    teaching: '"升华"在中学指固体直接变气体：碘管加热出现紫色蒸气、管壁凝回晶体——经典升华演示。',
    grade_level: 1, tags: ['非金属', '检验']
  }),

  /* ————— 有机物 ————— */
  ethanol: C({
    id: 'ethanol', name: '乙醇', en: 'Ethanol', alias: ['酒精'], formula: 'C₂H₅OH', mw: 46.07, cas: '64-17-5',
    smiles: 'CCO',
    appearance: '无色透明液体', odor: '特殊醇香',
    props: { density: '0.789 g/cm³', mp: '-117 ℃', bp: '78.5 ℃', solubility: '与水任意比混溶', ph: '7', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS02', 'GHS07'], signal: '危险', h: ['H225：高度易燃液体和蒸气', 'H319：造成眼刺激'], p: ['P210：远离热源/火花/明火', 'P233：保持容器密闭'] },
    uses: ['酒精灯燃料', '消毒（75%）', '溶剂（碘酒/酚酞液）'], dosage: '—',
    reactions: [{ eq: 'C₂H₅OH + 3O₂ →(点燃) 2CO₂ + 3H₂O', note: '淡蓝色火焰放热——酒精灯的工作反应。' }],
    storage: '密封阴凉远离火源', spill: '擦干通风', waste: '少量可稀释排放',
    teaching: '医用消毒酒精是 75% 而非纯酒精：太高反而使菌体表面蛋白凝固形成保护壳。',
    grade_level: 0, tags: ['有机物', '易燃']
  }),
  methanol: C({
    id: 'methanol', name: '甲醇', en: 'Methanol', alias: ['木精'], formula: 'CH₃OH', mw: 32.04, cas: '67-56-1',
    smiles: 'CO',
    appearance: '无色透明液体', odor: '微弱醇味（似酒精，难以区分——危险！）',
    props: { density: '0.792 g/cm³', mp: '-98 ℃', bp: '64.7 ℃', solubility: '与水任意比混溶', ph: '7', corrosive: false, volatile: true },
    ghs: { pictos: ['GHS02', 'GHS06', 'GHS08'], signal: '危险', h: ['H225：高度易燃液体和蒸气', 'H301：吞咽有毒', 'H311：皮肤接触会中毒', 'H331：吸入有毒', 'H370：损害器官（眼/神经）'], p: ['P210', 'P301+P310：吞咽立即就医'] },
    uses: ['工业酒精成分', '化工原料（甲醛/醋酸）'], dosage: '—（禁止饮用！）',
    reactions: [{ eq: '2CH₃OH + 3O₂ →(点燃) 2CO₂ + 4H₂O', note: '可燃，但绝不用于实验燃烧演示（毒性）。' }],
    storage: '上锁保管，与食用酒精严格分开', spill: '通风', waste: '危废回收',
    teaching: '⚠ 工业酒精（含甲醇）严禁饮用：10 mL 可致失明，30 mL 以上可致死。"假酒"事故的元凶就是甲醇。',
    grade_level: 2, tags: ['有机物', '剧毒', '易燃']
  }),
  sucrose: C({
    id: 'sucrose', name: '蔗糖', en: 'Sucrose', alias: ['白糖', '食糖'], formula: 'C₁₂H₂₂O₁₁', mw: 342.30, cas: '57-50-1',
    smiles: null,
    appearance: '无色/白色晶体', odor: '甜味',
    props: { density: '1.587 g/cm³', mp: '186 ℃（分解）', bp: '—', solubility: '203.9 g/100 g 水（20 ℃，极高）', ph: '7', corrosive: false, volatile: false },
    uses: ['甜味剂', '浓硫酸脱水性演示'], dosage: '—',
    reactions: [{ eq: 'C₁₂H₂₂O₁₁ --浓硫酸--> 12C + 11H₂O', note: '浓硫酸把糖"脱"成黑面包（脱水性，非吸水性！）——体积膨胀冒热气。' }],
    storage: '密封防潮防蚁', spill: '回收', waste: '—',
    teaching: '蔗糖是二糖，水解得葡萄糖+果糖。溶解度巨大，是"饱和溶液浓度也可以很高"的例子。',
    grade_level: 0, tags: ['有机物', '生活']
  }),
  glucose: C({
    id: 'glucose', name: '葡萄糖', en: 'Glucose', formula: 'C₆H₁₂O₆', mw: 180.16, cas: '50-99-7',
    smiles: null,
    appearance: '白色晶体粉末', odor: '微甜',
    props: { density: '1.54 g/cm³', mp: '146 ℃', bp: '—', solubility: '91 g/100 g 水（20 ℃）', ph: '7', corrosive: false, volatile: false },
    uses: ['输液营养', '新陈代谢演示'], dosage: '—',
    reactions: [{ eq: 'C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O', note: '缓慢氧化供能——人体"发动机"的燃料方程。' }],
    storage: '密封阴凉', spill: '回收', waste: '—',
    teaching: '光合作用把 CO₂+H₂O 变成 C₆H₁₂O₆，呼吸作用把它变回去——自然界最大的化学循环。',
    grade_level: 1, tags: ['有机物', '生命']
  }),
  starch: C({
    id: 'starch', name: '淀粉', en: 'Starch', alias: ['（C₆H₁₀O₅）ₙ'], formula: '（C₆H₁₀O₅）ₙ', mw: null, cas: '9005-84-9',
    smiles: null,
    appearance: '白色粉末', odor: '无气味',
    props: { density: '≈1.5 g/cm³', mp: '—', bp: '—', solubility: '不溶于冷水（热水成糊）', ph: '7', corrosive: false, volatile: false },
    uses: ['碘检验演示', '主食成分'], dosage: '少量',
    reactions: [{ eq: '淀粉 + I₂ → 蓝色', note: '遇碘变蓝是淀粉的专属检验，唾液淀粉酶把它水解成麦芽糖（甜）。' }],
    storage: '干燥防霉', spill: '回收', waste: '—',
    teaching: '"淀粉遇碘变蓝"中起作用的是 I₂ 本身，加碘盐里是 KIO₃（不含 I₂）所以盐不变蓝——常见误区。',
    grade_level: 0, tags: ['有机物', '检验']
  }),
  glycerol: C({
    id: 'glycerol', name: '甘油', en: 'Glycerol', alias: ['丙三醇'], formula: 'C₃H₈O₃', mw: 92.09, cas: '56-81-5',
    smiles: 'OCC(O)CO',
    appearance: '无色黏稠液体', odor: '微甜',
    props: { density: '1.26 g/cm³', mp: '18 ℃', bp: '290 ℃', solubility: '与水任意比混溶', ph: '7', corrosive: false, volatile: false },
    uses: ['护肤品保湿', '硝化甘油原料（炸药）', '润版液'], dosage: '—',
    reactions: [],
    storage: '密封', spill: '擦干', waste: '—',
    teaching: '吸湿性让它成为保湿剂。别看它温柔，与浓硝酸反应生成硝化甘油——诺贝尔的起点。',
    grade_level: 2, tags: ['有机物']
  }),

  /* ————— 指示剂与检验用品 ————— */
  phen: C({
    id: 'phen', name: '酚酞', en: 'Phenolphthalein', formula: 'C₂₀H₁₄O₄', mw: 318.32, cas: '77-09-8',
    smiles: null,
    appearance: '白色粉末（配成无色酒精溶液使用）', odor: '无气味',
    props: { density: '—', mp: '261 ℃', bp: '—', solubility: '不溶于水，溶于酒精', ph: '变色范围 8.2–10（无色→红）', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS08'], signal: '警告', h: ['H351：怀疑致癌（动物实验）'], p: ['P202：使用前阅读全部注意事项'] },
    uses: ['酸碱中和滴定指示剂', '检验碱性'], dosage: '2–3 滴',
    reactions: [{ eq: '酚酞 --碱--> 变红（pH > 8.2）', note: '遇酸不变色（无色），遇碱变红——"酸中无、碱中红"。' }],
    storage: '棕色瓶避光', spill: '回收', waste: '回收',
    teaching: '滴定终点判断：最后一滴使溶液由无色变浅红且 30 s 不褪色。酚酞在浓碱中反而褪色（生成无色羧酸盐）——"变红又褪色"之谜。',
    grade_level: 1, tags: ['指示剂']
  }),
  litmus: C({
    id: 'litmus', name: '石蕊', en: 'Litmus', alias: ['石蕊试液', '紫甘蓝汁替代品'], formula: '（天然染料混合物）', mw: null, cas: null,
    smiles: null,
    appearance: '紫色粉末/紫色溶液', odor: '无气味',
    props: { density: '—', mp: '—', bp: '—', solubility: '溶于水/酒精', ph: '变色范围 4.5–8.3（红—紫—蓝）', corrosive: false, volatile: false },
    uses: ['酸碱粗判', '二氧化碳溶于水显酸性的验证'], dosage: '2–3 滴',
    reactions: [{ eq: '石蕊 --酸--> 红；--碱--> 蓝', note: '"酸红碱蓝"。CO₂ 溶于水使紫色石蕊变红，加热又褪色（碳酸不稳定）。' }],
    storage: '避光密封', spill: '回收', waste: '—',
    teaching: '石蕊遇中性不变色仍是紫色——"紫色石蕊变红"才是酸性证据。家庭可用紫甘蓝汁自制指示剂（安全环保）。',
    grade_level: 0, tags: ['指示剂']
  }),
  mo: C({
    id: 'mo', name: '甲基橙', en: 'Methyl orange', formula: 'C₁₄H₁₄N₃NaO₃S', mw: 327.33, cas: '547-58-0',
    smiles: null,
    appearance: '橙黄色粉末（水溶液橙黄）', odor: '无气味',
    props: { density: '—', mp: '300 ℃（分解）', bp: '—', solubility: '微溶于水', ph: '变色范围 3.1–4.4（红—橙—黄）', corrosive: false, volatile: false },
    ghs: { pictos: ['GHS07'], signal: '警告', h: ['H302：吞咽有害'], p: ['P264'] },
    uses: ['强酸滴定强碱/弱碱的指示剂'], dosage: '2–3 滴',
    reactions: [{ eq: '甲基橙 pH<3.1 红；3.1–4.4 橙；>4.4 黄', note: '"由橙变红"是滴定终点（碱被酸过量一点点）。' }],
    storage: '密封', spill: '回收', waste: '回收',
    teaching: '选指示剂看 pH 跃迁范围：强酸强碱互滴酚酞/甲基橙均可；强酸滴弱碱（终点偏酸）选甲基橙。',
    grade_level: 2, tags: ['指示剂']
  }),
  ph_paper: C({
    id: 'ph_paper', name: 'pH 试纸', en: 'pH test paper', alias: ['广范pH试纸'], formula: '—', mw: null, cas: null,
    smiles: null,
    appearance: '黄色纸条 + 标准比色卡', odor: '无气味',
    props: { density: '—', mp: '—', bp: '—', solubility: '—', ph: '测量范围 1–14（广范）', corrosive: false, volatile: false },
    uses: ['粗测溶液 pH（整数）'], dosage: '每次一小段',
    reactions: [],
    storage: '密封避潮', spill: '—', waste: '—',
    teaching: '正确用法：玻璃棒蘸液滴在试纸上，与比色卡比对。错误用法：把试纸浸入溶液（污染整瓶）或先用水润湿（稀释被测液，测弱酸偏低弱碱偏高）。',
    grade_level: 0, tags: ['检验', 'pH']
  })
};

export const CHEM_COUNT = Object.keys(CHEMICALS).length;
export function chemById(id) { return CHEMICALS[id] || null; }
export function chemSearch(q) {
  q = q.toLowerCase();
  return Object.values(CHEMICALS).filter(c =>
    c.name.toLowerCase().includes(q) || (c.en || '').toLowerCase().includes(q) ||
    c.formula.toLowerCase().includes(q) || c.alias.some(a => a.toLowerCase().includes(q)));
}
/* GHS 象形图中文渲染（详情页用） */
export function ghsHTML(c) {
  if (!c.ghs || !c.ghs.pictos.length) return '<span class="muted">无 GHS 分类（一般 classroom 安全品）</span>';
  const p = c.ghs.pictos.map(k => `<span class="chip" title="${k}">◆ ${PICTOS[k] || k}</span>`).join(' ');
  const h = c.ghs.h.map(x => `<li>${x}</li>`).join('');
  const pp = c.ghs.p.map(x => `<li>${x}</li>`).join('');
  return `${p}<br><b>信号词：</b>${c.ghs.signal || '—'}<br><b>H 码：</b><ul style="margin:4px 0 0 16px">${h}</ul><b>P 码：</b><ul style="margin:4px 0 0 16px">${pp}</ul>`;
}
