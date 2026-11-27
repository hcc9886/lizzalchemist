// 器材库（配置驱动）：三级分类树 + 器材定义 + 容量"款型"扩展 + 接口/邻接规则
// 规模路线：首批中学核心款型（本文件 ~90 款）；架构支持持续扩到 450+（新增 def 即自动进入树/索引/图鉴）。
// 款-not-种：如"烧杯 100 mL"是烧杯的一个款，容量数组 capacities 展开成独立 SKU。

export const APPARATUS_TREE = {
  glass: { name: '玻璃仪器', children: {
    container: { name: '反应容器', items: ['test_tube', 'test_tube_rigid', 'beaker', 'flask_conical', 'flask_round', 'wide_mouth', 'specimen_bottle', 'reagent_bottle', 'watch_glass'] },
    measure: { name: '量取仪器', items: ['grad_cyl', 'volumetric_flask', 'pipette', 'burette', 'dropper', 'weighing_bottle', 'cuvette', 'gas_syringe', 'micro_syringe'] },
    connect: { name: '连接件', items: ['glass_tube', 'bent_glass_tube', 'stopper', 'stopper_two_hole', 'stopper_three_hole', 'glass_stopper', 'stopper_tube', 'stirring_rod'] },
    filter: { name: '过滤与分液', items: ['funnel', 'sep_funnel', 'gas_wash_bottle', 'wash_bottle'] },
    hot: { name: '高温仪器', items: ['evaporating_dish', 'crucible', 'porcelain_crucible', 'silica_crucible'] },
    grind: { name: '研磨', items: ['mortar'] }
  } },
  heating: { name: '加热与热源', children: {
    fire: { name: '热源', items: ['alcohol_lamp', 'bunsen_burner', 'blast_lamp', 'hotplate', 'heating_mantle', 'water_bath', 'oil_bath', 'sand_bath', 'electric_furnace', 'drying_oven', 'infrared_lamp'] },
    carrier: { name: '承热件', items: ['tripod', 'asbestos_net', 'heat_resistant_mat', 'clay_triangle', 'test_tube_holder', 'crucible_lid'] }
  } },
  support: { name: '支撑与固定', children: {
    main: { name: '主体', items: ['iron_stand', 'universal_stand'] },
    hold: { name: '夹持', items: ['clamp', 'ring', 'universal_clamp', 'burette_clamp', 'test_tube_rack', 'drying_rack'] }
  } },
  measure: { name: '测量仪器', children: {
    mass: { name: '质量', items: ['balance', 'analytical_balance', 'digital_platform_balance'] },
    temp: { name: '温度', items: ['thermometer', 'thermocouple'] },
    acid: { name: '酸度', items: ['ph_meter', 'ion_meter'] },
    electric: { name: '电学', items: ['ammeter', 'voltmeter', 'multimeter', 'galvanometer', 'resistance_box', 'rheostat', 'conductivity_meter', 'colorimeter'] },
    time: { name: '时间', items: ['stopwatch'] },
    pressure: { name: '压力与真空', items: ['barometer', 'pressure_gauge', 'vacuum_gauge'] },
    humidity: { name: '湿度', items: ['hygrometer'] }
  } },
  gas: { name: '气体实验', children: {
    collect: { name: '收集', items: ['gas_jar', 'trough', 'gas_bag'] },
    lead: { name: '导气与真空', items: ['rubber_tube', 'vacuum_pump'] }
  } },
  electro: { name: '电化学', children: {
    electrode: { name: '电极', items: ['electrode_c', 'electrode_cu', 'electrode_zn', 'electrode_fe'] },
    circuit: { name: '电路', items: ['wire', 'switch', 'bulb', 'u_tube'] }
  } },
  purification: { name: '分离与提纯', children: {
    distill: { name: '蒸馏与分馏', items: ['distilling_flask', 'condenser_liebig', 'condenser_sphere', 'condenser_allihn', 'distill_adapter', 'vacuum_adapter', 'receiving_flask', 'fractionating_column', 'dephlegmator', 'rotary_evaporator'] },
    filter: { name: '过滤与抽滤', items: ['buchner_funnel', 'filter_flask', 'glass_frit_funnel', 'gooch_crucible', 'filter_stick'] },
    extract: { name: '萃取与提取', items: ['thistle_funnel', 'pressure_equalizing_funnel', 'extraction_thimble', 'soxhlet_extractor'] },
    dry: { name: '干燥', items: ['drying_tube', 'desiccator', 'desiccant_tower'] },
    chroma: { name: '层析', items: ['chromatography_paper', 'chromatography_chamber', 'chromatography_column', 'tlc_plate', 'spotting_capillary'] }
  } },
  consumable: { name: '耗材与工具', children: {
    take: { name: '取用', items: ['spoon', 'tweezers', 'nichrome_spatula'] },
    clean: { name: '清洁', items: ['test_tube_brush'] },
    test: { name: '检验与辅助', items: ['match', 'splint', 'splint_fire', 'litmus_paper', 'ph_paper', 'filter_paper', 'cotton', 'weighing_paper', 'boiling_chips', 'pipette_filler', 'stopcock_key', 'crucible_tongs', 'silica_gel'] }
  } }
};

/*
 * 接口类型 iface.type：
 *   mouth  开口（可接塞子/导管/漏斗/温度计…）
 *   side   侧口/支管（蒸馏烧瓶、洗气瓶进出气）
 *   clamp  被夹持点（试管/烧瓶被铁夹夹住的位置）
 *   heat   加热点（热源应对准的位置）
 *   stand  固定点（夹子挂在铁架台立杆上）
 *   elec   电极接线柱
 * 坐标 dx/dy 相对器材中心（画布 px，画布坐标 y 向下）。
 */
function I(id, type, dx, dy) { return { id, type, dx, dy }; }

export const APPARATUS_DEFS = [
  /* ————— 玻璃仪器 · 反应容器 ————— */
  {
    id: 'test_tube', name: '试管', en: 'Test tube', alias: ['小试管'], kind: 'test_tube',
    category: ['glass', 'container'], w: 26, h: 96, liquid: true, solid: true, heat: true,
    capacities: [10, 20, 30],
    interfaces: [I('mouth', 'mouth', 0, -44), I('body', 'clamp', 0, 0), I('bottom', 'heat', 0, 40)],
    allowed_neighbors: ['stopper', 'stopper_tube', 'glass_tube', 'clamp', 'spoon', 'cotton', 'funnel', 'dropper', 'thermometer', 'alcohol_lamp'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['少量试剂反应容器', '加热固体（口略向下）', '收集少量气体'],
    notes: '加热时管口不得对人；加热固体须口略向下倾斜，防止冷凝水倒流炸裂。'
  },
  {
    id: 'beaker', name: '烧杯', en: 'Beaker', kind: 'beaker',
    category: ['glass', 'container'], w: 64, h: 78, liquid: true, solid: true, heat: true,
    capacities: [50, 100, 250, 500],
    interfaces: [I('mouth', 'mouth', 0, -34), I('side', 'heat', 0, 24)],
    allowed_neighbors: ['glass_tube', 'thermometer', 'stirring_rod', 'dropper', 'funnel', 'asbestos_net'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['配制溶液', '常温或垫石棉网加热液体', '反应容器'],
    notes: '加热必须垫石棉网，不可直接火焰加热（受热不均易炸裂）。'
  },
  {
    id: 'flask_conical', name: '锥形瓶', en: 'Erlenmeyer flask', alias: ['三角烧瓶'], kind: 'flask_conical',
    category: ['glass', 'container'], w: 60, h: 76, liquid: true, solid: true, heat: true,
    capacities: [100, 250],
    interfaces: [I('mouth', 'mouth', 0, -34), I('side', 'heat', 0, 20)],
    allowed_neighbors: ['stopper', 'stopper_tube', 'glass_tube', 'thermometer', 'asbestos_net'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['滴定受器', '制气发生器', '摇动混合不溅出'],
    notes: '壁厚耐震荡，滴定与制气最常用。'
  },
  {
    id: 'flask_round', name: '圆底烧瓶', en: 'Round-bottom flask', kind: 'flask_round',
    category: ['glass', 'container'], w: 64, h: 86, liquid: true, solid: true, heat: true,
    capacities: [100, 250],
    interfaces: [I('neck', 'mouth', 0, -40), I('belly', 'clamp', 0, 6), I('bottom', 'heat', 0, 32)],
    allowed_neighbors: ['stopper', 'stopper_tube', 'glass_tube', 'thermometer', 'clamp', 'asbestos_net'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['蒸馏与回流', '加热液体均匀受热'],
    notes: '必须夹持固定；蒸馏时装温度计水银球对准支管口下沿。'
  },
  {
    id: 'wide_mouth', name: '广口瓶', en: 'Wide-mouth bottle', kind: 'bottle',
    category: ['glass', 'container'], w: 50, h: 74, liquid: false, solid: true,
    capacities: [60, 125],
    interfaces: [I('mouth', 'mouth', 0, -32)],
    allowed_neighbors: ['stopper', 'spoon', 'tweezers'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['存放固体药品', '集气（瓶口向上排空气法）'],
    notes: '固体药品用广口瓶，取毕立即盖紧瓶塞。'
  },
  {
    id: 'reagent_bottle', name: '细口瓶', en: 'Reagent bottle', kind: 'bottle',
    category: ['glass', 'container'], w: 42, h: 76, liquid: true,
    capacities: [60, 125, 250],
    interfaces: [I('mouth', 'mouth', 0, -33)],
    allowed_neighbors: ['stopper', 'dropper'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['存放液体试剂', '倾倒液体'],
    notes: '倾倒时标签朝手心，瓶口紧挨受器口。'
  },
  {
    id: 'watch_glass', name: '表面皿', en: 'Watch glass', kind: 'watch_glass',
    category: ['glass', 'container'], w: 58, h: 18, liquid: true, solid: true,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 1,
    typical_uses: ['少量蒸发结晶', '盖烧杯防尘'],
    notes: '不可加热。'
  },
  /* ————— 玻璃仪器 · 量取 ————— */
  {
    id: 'grad_cyl', name: '量筒', en: 'Graduated cylinder', kind: 'grad_cyl',
    category: ['glass', 'measure'], w: 30, h: 92, liquid: true,
    capacities: [10, 50, 100, 250],
    interfaces: [I('mouth', 'mouth', 0, -42)],
    allowed_neighbors: ['dropper', 'glass_tube'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['量取液体体积', '读数视线与凹液面最低处相平'],
    notes: '不能加热、不能作反应容器、不能配制溶液。'
  },
  {
    id: 'volumetric_flask', name: '容量瓶', en: 'Volumetric flask', kind: 'volumetric',
    category: ['glass', 'measure'], w: 56, h: 82, liquid: true,
    capacities: [50, 100, 250, 500],
    interfaces: [I('mouth', 'mouth', 0, -36)],
    allowed_neighbors: ['stopper', 'dropper', 'glass_tube'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['配制准确浓度溶液（定容）'],
    notes: '只有一条刻度线；不能加热、不能长期存放溶液。'
  },
  {
    id: 'pipette', name: '移液管', en: 'Pipette', kind: 'pipette',
    category: ['glass', 'measure'], w: 12, h: 96, liquid: true,
    capacities: [5, 10, 25],
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 2,
    typical_uses: ['精确移取一定体积液体'],
    notes: '放液后停留 15 s，残留在管尖的少量液体按标示"吹"或"不吹"。'
  },
  {
    id: 'burette', name: '滴定管', en: 'Burette', kind: 'burette',
    category: ['glass', 'measure'], w: 14, h: 100, liquid: true,
    capacities: [25, 50],
    interfaces: [I('top', 'mouth', 0, -46)],
    allowed_neighbors: ['dropper'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['滴定：精确到 0.01 mL'],
    notes: '酸式/碱式滴定管不可混用；读数前等待 1–2 min 排气泡。'
  },
  {
    id: 'dropper', name: '胶头滴管', en: 'Dropper', alias: ['滴管'], kind: 'dropper',
    category: ['glass', 'measure'], w: 12, h: 60, liquid: true,
    interfaces: [I('tip', 'side', 0, 30), I('bulb', 'side', 0, -26)],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 0,
    typical_uses: ['滴加少量液体（悬空垂直，不伸入受器）'],
    notes: '不可倒持防液体倒流入胶头；用后即洗。'
  },
  /* ————— 玻璃仪器 · 连接 ————— */
  {
    id: 'glass_tube', name: '玻璃导管', en: 'Glass tube', kind: 'glass_tube',
    category: ['glass', 'connect'], w: 90, h: 10,
    interfaces: [I('l', 'side', -44, 0), I('r', 'side', 44, 0)],
    allowed_neighbors: ['stopper', 'rubber_tube', 'gas_wash_bottle', 'trough'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['导气导液', '连接塞子与水槽'],
    notes: '往塞孔里插要先蘸水旋转插入，勿用手握管前端。'
  },
  {
    id: 'stopper', name: '橡胶塞', en: 'Rubber stopper', kind: 'stopper',
    category: ['glass', 'connect'], w: 24, h: 28,
    interfaces: [I('bottom', 'side', 0, 14)],
    allowed_neighbors: ['test_tube', 'flask_conical', 'flask_round', 'volumetric_flask', 'wide_mouth', 'reagent_bottle'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['密封容器口'],
    notes: '选择与瓶口匹配的规格。'
  },
  {
    id: 'stopper_tube', name: '带导管的单孔橡胶塞', en: 'Stopper with delivery tube', kind: 'stopper_tube',
    category: ['glass', 'connect'], w: 76, h: 34,
    interfaces: [I('bottom', 'side', -30, 16), I('r', 'side', 38, -2)],
    allowed_neighbors: ['test_tube', 'flask_conical', 'flask_round', 'rubber_tube'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['制气装置密封并导出气体'],
    notes: '塞入深度约为塞子的 2/3，太浅漏气、太深难拔。'
  },
  {
    id: 'stirring_rod', name: '玻璃棒', en: 'Glass rod', kind: 'stirring_rod',
    category: ['glass', 'connect'], w: 100, h: 8,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 0,
    typical_uses: ['搅拌加速溶解', '引流', '蘸取液体（pH 试纸）'],
    notes: '搅拌不要碰容器壁。'
  },
  /* ————— 玻璃仪器 · 过滤分液 ————— */
  {
    id: 'funnel', name: '漏斗', en: 'Funnel', kind: 'funnel',
    category: ['glass', 'filter'], w: 56, h: 64,
    interfaces: [I('top', 'mouth', 0, -30), I('neck', 'side', 0, 30)],
    allowed_neighbors: ['filter_paper', 'beaker', 'flask_conical'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['过滤（一贴二低三靠）', '向小口容器倾倒液体'],
    notes: '滤纸边缘低于漏斗边缘；液面低于滤纸边缘。'
  },
  {
    id: 'sep_funnel', name: '分液漏斗', en: 'Separatory funnel', kind: 'sep_funnel',
    category: ['glass', 'filter'], w: 46, h: 88, liquid: true,
    capacities: [60, 125],
    interfaces: [I('top', 'mouth', 0, -40), I('neck', 'side', 0, 44)],
    allowed_neighbors: ['flask_conical', 'flask_round', 'stopper'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['萃取分液', '控制滴加速度（制气）'],
    notes: '分液时下层从下口放出、上层从上口倒出；放气时下口朝无人方向。'
  },
  {
    id: 'gas_wash_bottle', name: '洗气瓶', en: 'Gas washing bottle', kind: 'gas_wash_bottle',
    category: ['glass', 'filter'], w: 66, h: 66, liquid: true,
    interfaces: [I('in', 'side', -30, -18), I('out', 'side', 30, -14)],
    allowed_neighbors: ['glass_tube', 'rubber_tube'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['除杂（长进短出）', '干燥气体（装浓硫酸）'],
    notes: '导管"长进短出"，装反会被液体顶出。'
  },
  {
    id: 'wash_bottle', name: '洗瓶', en: 'Wash bottle', kind: 'wash_bottle',
    category: ['glass', 'filter'], w: 52, h: 62, liquid: true,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 1,
    typical_uses: ['蒸馏水洗涤仪器与沉淀'],
    notes: '挤压瓶身即可出水。'
  },
  /* ————— 玻璃仪器 · 高温 ————— */
  {
    id: 'evaporating_dish', name: '蒸发皿', en: 'Evaporating dish', kind: 'evaporating_dish',
    category: ['glass', 'hot'], w: 62, h: 24, liquid: true, solid: true, heat: true,
    interfaces: [I('bottom', 'heat', 0, 12)],
    allowed_neighbors: ['tripod', 'stirring_rod'],
    safety_level: 2, grade_level: 1,
    typical_uses: ['蒸发结晶（大量晶体出现即停火，余热蒸干）'],
    notes: '陶瓷耐热但不耐骤冷；用坩埚钳取放。'
  },
  {
    id: 'crucible', name: '坩埚', en: 'Crucible', kind: 'crucible',
    category: ['glass', 'hot'], w: 40, h: 34, solid: true, heat: true,
    interfaces: [I('bottom', 'heat', 0, 16)],
    allowed_neighbors: ['tripod', 'clamp'],
    safety_level: 2, grade_level: 2,
    typical_uses: ['高温灼烧固体（如分解碳酸钙）'],
    notes: '需泥三角+三脚架承托；灼热的坩埚不能直接放桌面。'
  },
  {
    id: 'mortar', name: '研钵', en: 'Mortar and pestle', kind: 'mortar',
    category: ['glass', 'grind'], w: 60, h: 34, solid: true,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 1,
    typical_uses: ['研磨固体（研不是捣）'],
    notes: '研磨KClO₃等敏感物严禁用力敲击。'
  },
  /* ————— 加热与热源 ————— */
  {
    id: 'alcohol_lamp', name: '酒精灯', en: 'Alcohol lamp', kind: 'alcohol_lamp',
    category: ['heating', 'fire'], w: 44, h: 52, heat: true,
    fsm: {
      off: { to: ['lit'] },
      lit: { to: ['off', 'heating'], enter: h => { h.flame = 1; } },
      heating: { to: ['lit', 'off'], enter: h => { h.flame = 1.25; } }
    },
    fsmInitial: 'off',
    interfaces: [I('wick', 'side', 0, -26), I('top', 'heat', 0, -34)],
    allowed_neighbors: ['match', 'test_tube', 'beaker', 'flask_conical', 'flask_round', 'evaporating_dish', 'crucible'],
    safety_level: 2, grade_level: 0,
    typical_uses: ['最常用热源，外焰温度最高'],
    notes: '两查两禁一不可：查灯芯/酒精量（1/4–2/3），禁止对火点燃、禁止吹灭，不可泼洒燃烧时加水。'
  },
  {
    id: 'bunsen_burner', name: '本生灯', en: 'Bunsen burner', kind: 'bunsen_burner',
    category: ['heating', 'fire'], w: 34, h: 62, heat: true,
    fsm: { off: { to: ['lit'] }, lit: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -34)],
    allowed_neighbors: [],
    safety_level: 2, grade_level: 2,
    typical_uses: ['煤气热源，可调空气比得蓝色火焰'],
    notes: '先划火柴后开气；回火立即关气。'
  },
  {
    id: 'hotplate', name: '电热板', en: 'Hot plate', kind: 'hotplate',
    category: ['heating', 'fire'], w: 70, h: 22, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -14)],
    allowed_neighbors: ['beaker', 'flask_conical'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['无明火加热（易燃液体环境更安全）'],
    notes: '加热易燃溶剂优先选它而非明火。'
  },
  {
    id: 'tripod', name: '三脚架', en: 'Tripod', kind: 'tripod',
    category: ['heating', 'carrier'], w: 70, h: 56,
    interfaces: [I('top', 'side', 0, -28)],
    allowed_neighbors: ['asbestos_net', 'evaporating_dish', 'crucible'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['承托石棉网/泥三角进行加热'],
    notes: '与酒精灯配合使用，灯外焰恰好触网底。'
  },
  {
    id: 'asbestos_net', name: '石棉网', en: 'Wire gauze', alias: ['金属网'], kind: 'asbestos_net',
    category: ['heating', 'carrier'], w: 76, h: 10,
    interfaces: [I('center', 'side', 0, 0)],
    allowed_neighbors: ['tripod', 'beaker', 'flask_conical', 'flask_round'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['使烧杯/烧瓶受热均匀'],
    notes: '破碎的网必须更换，防止局部过热。'
  },
  /* ————— 支撑固定 ————— */
  {
    id: 'iron_stand', name: '铁架台', en: 'Iron stand', kind: 'iron_stand',
    category: ['support', 'main'], w: 70, h: 150,
    interfaces: [I('pole', 'stand', 16, -60), I('pole2', 'stand', 16, -20)],
    allowed_neighbors: ['clamp', 'ring'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['固定夹持各类仪器'],
    notes: '重心在底座一侧，装置组合应落在底座上方。'
  },
  {
    id: 'clamp', name: '铁夹', en: 'Clamp', kind: 'clamp',
    category: ['support', 'hold'], w: 64, h: 26,
    interfaces: [I('head', 'side', 32, 0), I('tail', 'stand', -32, 0)],
    allowed_neighbors: ['iron_stand', 'test_tube', 'flask_round'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['夹持试管（口略向下）/ 烧瓶（颈部）'],
    notes: '松紧适度，以能转动又不滑落为宜。'
  },
  {
    id: 'ring', name: '铁圈', en: 'Iron ring', kind: 'ring',
    category: ['support', 'hold'], w: 54, h: 40,
    interfaces: [I('c', 'side', 0, 0)],
    allowed_neighbors: ['iron_stand', 'asbestos_net', 'funnel'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['承托漏斗或石棉网'],
    notes: '圈上放石棉网可代替三脚架。'
  },
  /* ————— 测量仪器 ————— */
  {
    id: 'balance', name: '托盘天平', en: 'Platform balance', kind: 'balance',
    category: ['measure', 'mass'], w: 92, h: 44,
    fsm: { idle: { to: ['weighing'] }, weighing: { to: ['idle'] } },
    fsmInitial: 'idle',
    interfaces: [],
    allowed_neighbors: ['wide_mouth', 'spoon'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['称量（左物右码，精确 0.1 g）'],
    notes: '先调零；药品不可直接放托盘（垫纸或小烧杯）；砝码用镊子。'
  },
  {
    id: 'thermometer', name: '温度计', en: 'Thermometer', kind: 'thermometer',
    category: ['measure', 'temp'], w: 10, h: 100,
    interfaces: [I('top', 'side', 0, -46)],
    allowed_neighbors: ['stopper_tube', 'clamp'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['测温（蒸馏时水银球对支管口）'],
    notes: '不能当搅拌棒，不能测超量程温度。'
  },
  {
    id: 'ph_meter', name: 'pH 计', en: 'pH meter', kind: 'ph_meter',
    category: ['measure', 'acid'], w: 54, h: 60,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 2,
    typical_uses: ['精确测 pH（先校准两点）'],
    notes: '电极玻璃泡薄脆，浸入勿碰杯底。'
  },
  {
    id: 'ammeter', name: '电流表', en: 'Ammeter', kind: 'meter',
    category: ['measure', 'electric'], w: 64, h: 52,
    interfaces: [I('l', 'elec', -26, -8), I('r', 'elec', 26, -8)],
    allowed_neighbors: ['wire'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['串联测电流，"+"进"−"出'],
    notes: '严禁直接接电源两端（会烧表）。'
  },
  {
    id: 'voltmeter', name: '电压表', en: 'Voltmeter', kind: 'meter',
    category: ['measure', 'electric'], w: 64, h: 52,
    interfaces: [I('l', 'elec', -26, -8), I('r', 'elec', 26, -8)],
    allowed_neighbors: ['wire'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['并联测电压'],
    notes: '量程选择"先大后小"。'
  },
  {
    id: 'stopwatch', name: '秒表', en: 'Stopwatch', kind: 'stopwatch',
    category: ['measure', 'time'], w: 46, h: 50,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 0,
    typical_uses: ['记录反应时间（速率实验）'],
    notes: ''
  },
  /* ————— 气体实验 ————— */
  {
    id: 'gas_jar', name: '集气瓶', en: 'Gas collecting jar', kind: 'gas_jar',
    category: ['gas', 'collect'], w: 52, h: 78, liquid: true,
    capacities: [125, 250],
    interfaces: [I('mouth', 'mouth', 0, -34)],
    allowed_neighbors: ['glass_tube', 'stopper', 'splint', 'tweezers'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['排水法/排空气法收集气体，瓶口毛玻璃片盖住'],
    notes: '排水法收集满后在水下盖玻璃片取出。'
  },
  {
    id: 'trough', name: '水槽', en: 'Water trough', kind: 'trough',
    category: ['gas', 'collect'], w: 150, h: 52, liquid: true,
    interfaces: [],
    allowed_neighbors: ['gas_jar', 'glass_tube'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['排水法收集气体的盛水容器'],
    notes: ''
  },
  {
    id: 'gas_bag', name: '集气袋', en: 'Gas bag', kind: 'gas_bag',
    category: ['gas', 'collect'], w: 56, h: 36,
    interfaces: [I('port', 'side', 0, 0)],
    allowed_neighbors: ['rubber_tube'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['直接收集气体便于携带'],
    notes: ''
  },
  {
    id: 'rubber_tube', name: '橡胶管', en: 'Rubber tube', kind: 'rubber_tube',
    category: ['gas', 'lead'], w: 60, h: 10,
    interfaces: [I('l', 'side', -28, 0), I('r', 'side', 28, 0)],
    allowed_neighbors: ['glass_tube', 'stopper_tube', 'gas_wash_bottle'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['柔性连接玻璃导管'],
    notes: '用止水夹可控制通断（启普发生器原理）。'
  },
  /* ————— 电化学 ————— */
  {
    id: 'electrode_c', name: '石墨电极', en: 'Carbon electrode', kind: 'electrode',
    category: ['electro', 'electrode'], w: 12, h: 80,
    interfaces: [I('top', 'elec', 0, -36)],
    allowed_neighbors: ['wire', 'u_tube'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['电解惰性阳极（电解水/食盐水）'],
    notes: ''
  },
  {
    id: 'electrode_cu', name: '铜电极', en: 'Copper electrode', kind: 'electrode',
    category: ['electro', 'electrode'], w: 12, h: 80,
    interfaces: [I('top', 'elec', 0, -36)],
    allowed_neighbors: ['wire', 'u_tube'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['铜锌原电池正极 / 电镀阳极'],
    notes: ''
  },
  {
    id: 'electrode_zn', name: '锌电极', en: 'Zinc electrode', kind: 'electrode',
    category: ['electro', 'electrode'], w: 12, h: 80,
    interfaces: [I('top', 'elec', 0, -36)],
    allowed_neighbors: ['wire', 'u_tube'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['铜锌原电池负极（被氧化）'],
    notes: ''
  },
  {
    id: 'electrode_fe', name: '铁电极', en: 'Iron electrode', kind: 'electrode',
    category: ['electro', 'electrode'], w: 12, h: 80,
    interfaces: [I('top', 'elec', 0, -36)],
    allowed_neighbors: ['wire', 'u_tube'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['电解饱和食盐水阴极 / 电解抛光'],
    notes: ''
  },
  {
    id: 'wire', name: '导线', en: 'Wire', kind: 'wire',
    category: ['electro', 'circuit'], w: 80, h: 8,
    interfaces: [I('l', 'elec', -36, 0), I('r', 'elec', 36, 0)],
    allowed_neighbors: ['electrode_c', 'electrode_cu', 'electrode_zn', 'electrode_fe', 'ammeter', 'voltmeter', 'switch', 'bulb'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['连接电路'],
    notes: ''
  },
  {
    id: 'switch', name: '开关', en: 'Switch', kind: 'switch',
    category: ['electro', 'circuit'], w: 44, h: 24,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('l', 'elec', -20, 0), I('r', 'elec', 20, 0)],
    allowed_neighbors: ['wire'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['控制电路通断'],
    notes: ''
  },
  {
    id: 'bulb', name: '小灯泡', en: 'Bulb', kind: 'bulb',
    category: ['electro', 'circuit'], w: 30, h: 44,
    interfaces: [I('l', 'elec', -14, 8), I('r', 'elec', 14, 8)],
    allowed_neighbors: ['wire'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['判断电解质导电性'],
    notes: ''
  },
  {
    id: 'u_tube', name: 'U 形管', en: 'U-tube', kind: 'u_tube',
    category: ['electro', 'circuit'], w: 56, h: 76, liquid: true,
    interfaces: [I('l', 'mouth', -20, -34), I('r', 'mouth', 20, -34)],
    allowed_neighbors: ['electrode_c', 'electrode_zn', 'stopper'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['电解实验（带盐桥 U 形管）'],
    notes: ''
  },
  /* ————— 耗材与工具 ————— */
  {
    id: 'spoon', name: '药匙', en: 'Spatula / medicine spoon', kind: 'spoon',
    category: ['consumable', 'take'], w: 62, h: 14,
    interfaces: [],
    allowed_neighbors: ['wide_mouth', 'test_tube'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['取粉末状固体（刮取/倾倒入试管）'],
    notes: '用前用纸擦净，用完立即擦净插回原瓶。'
  },
  {
    id: 'tweezers', name: '镊子', en: 'Tweezers', kind: 'tweezers',
    category: ['consumable', 'take'], w: 56, h: 14,
    interfaces: [],
    allowed_neighbors: ['wide_mouth', 'gas_jar'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['取块状固体或金属颗粒'],
    notes: '块状固体沿容器壁滑入，防打破容器。'
  },
  {
    id: 'match', name: '火柴', en: 'Match', kind: 'match',
    category: ['consumable', 'test'], w: 46, h: 10,
    interfaces: [],
    allowed_neighbors: ['alcohol_lamp', 'bunsen_burner'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['点燃热源', '检验气体可燃性'],
    notes: ''
  },
  {
    id: 'splint', name: '燃着木条', en: 'Burning splint', kind: 'splint',
    category: ['consumable', 'test'], w: 56, h: 10,
    interfaces: [],
    allowed_neighbors: ['gas_jar', 'wide_mouth'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['验满 O₂（复燃）/ 检验 H₂（噗声）'],
    notes: ''
  },
  {
    id: 'splint_fire', name: '带火星木条', en: 'Glowing splint', kind: 'splint_fire',
    category: ['consumable', 'test'], w: 56, h: 10,
    interfaces: [],
    allowed_neighbors: ['gas_jar', 'wide_mouth'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['检验 O₂：遇纯氧复燃'],
    notes: ''
  },
  {
    id: 'litmus_paper', name: '石蕊试纸', en: 'Litmus paper', kind: 'litmus_paper',
    category: ['consumable', 'test'], w: 40, h: 14,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 1,
    typical_uses: ['红→酸、蓝→碱'],
    notes: '试纸用玻璃棒蘸液测试，不可伸入溶液。'
  },
  {
    id: 'ph_paper', name: 'pH 试纸', en: 'pH paper', kind: 'ph_paper',
    category: ['consumable', 'test'], w: 40, h: 14,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 1,
    typical_uses: ['比色卡读 pH（1–14）'],
    notes: '广范试纸只能粗测整数 pH。'
  },
  {
    id: 'filter_paper', name: '滤纸', en: 'Filter paper', kind: 'filter_paper',
    category: ['consumable', 'test'], w: 44, h: 44,
    interfaces: [],
    allowed_neighbors: ['funnel'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['过滤（一贴二低三靠）'],
    notes: ''
  },
  {
    id: 'cotton', name: '棉花团', en: 'Cotton plug', kind: 'cotton',
    category: ['consumable', 'test'], w: 30, h: 22,
    interfaces: [],
    allowed_neighbors: ['test_tube'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['制 O₂ 时堵试管口，防粉末进导管'],
    notes: ''
  },
  /* ————— v4 扩容 · 玻璃仪器 ————— */
  {
    id: 'test_tube_rigid', name: '硬质试管', en: 'Borosilicate test tube', kind: 'test_tube',
    category: ['glass', 'container'], w: 26, h: 104, liquid: true, solid: true, heat: true,
    capacities: [10, 20],
    interfaces: [I('mouth', 'mouth', 0, -47), I('body', 'clamp', 0, 0), I('bottom', 'heat', 0, 42)],
    allowed_neighbors: ['stopper', 'stopper_two_hole', 'stopper_three_hole', 'clamp', 'spoon', 'dropper', 'alcohol_lamp'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['可直接加热的少量物质反应', '加热固体时管口略向下倾斜'],
    notes: '耐急冷温差仍有限；管口不得对人，加热前擦干外壁。'
  },
  {
    id: 'specimen_bottle', name: '标本瓶', en: 'Specimen bottle', kind: 'bottle',
    category: ['glass', 'container'], w: 54, h: 82, liquid: true, solid: true,
    capacities: [60, 125],
    interfaces: [I('mouth', 'mouth', 0, -36)],
    allowed_neighbors: ['stopper', 'glass_stopper', 'tweezers'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['展示与存放固体/液体标本', '收集气体时瓶口向上排空气'],
    notes: '取放后及时盖紧，避免内容物挥发或受潮。'
  },
  {
    id: 'weighing_bottle', name: '称量瓶', en: 'Weighing bottle', kind: 'bottle',
    category: ['glass', 'measure'], w: 34, h: 52, solid: true,
    capacities: [30, 50],
    interfaces: [I('mouth', 'mouth', 0, -22)],
    allowed_neighbors: ['stopper', 'balance', 'analytical_balance', 'drying_oven'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['准确称量易吸潮固体', '干燥恒重（重量分析）'],
    notes: '称量时瓶盖不能丢；热称量瓶须先在干燥器冷却。'
  },
  {
    id: 'cuvette', name: '比色皿', en: 'Spectrophotometer cuvette', kind: 'cuvette',
    category: ['glass', 'measure'], w: 24, h: 48, liquid: true,
    capacities: [2, 4],
    interfaces: [],
    allowed_neighbors: ['colorimeter'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['比色法/分光光度法测吸光度'],
    notes: '持握磨砂面，透光面用镜头纸擦净；比色皿需配套或成对校准。'
  },
  {
    id: 'gas_syringe', name: '气体注射器', en: 'Gas syringe', kind: 'syringe',
    category: ['glass', 'measure'], w: 86, h: 20,
    interfaces: [I('tip', 'side', 42, 0)],
    allowed_neighbors: ['rubber_tube'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['量取气体体积', '观察反应前后气体体积变化'],
    notes: '不得强推活塞产生高压；腐蚀性气体须用相容材质。'
  },
  {
    id: 'micro_syringe', name: '微量注射器', en: 'Micro syringe', kind: 'syringe',
    category: ['glass', 'measure'], w: 54, h: 12,
    interfaces: [I('tip', 'side', 26, 0)],
    allowed_neighbors: [],
    safety_level: 2, grade_level: 3,
    typical_uses: ['微量进样（色谱/反应研究）'],
    notes: '针尖尖锐，仅教学演示；用后按锐器规范回收，严禁用于人体注射。'
  },
  {
    id: 'bent_glass_tube', name: '弯玻璃导管', en: 'Bent delivery tube', kind: 'glass_tube',
    category: ['glass', 'connect'], w: 74, h: 44,
    interfaces: [I('l', 'side', -34, 20), I('r', 'side', 34, -20)],
    allowed_neighbors: ['stopper_two_hole', 'stopper_three_hole', 'rubber_tube'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['导气并改变管路方向', '洗气/排水集气装置连接'],
    notes: '玻璃管两端需烧圆；弯曲处不可反复折扭。'
  },
  {
    id: 'stopper_two_hole', name: '双孔橡胶塞', en: 'Two-hole rubber stopper', kind: 'stopper_tube',
    category: ['glass', 'connect'], w: 52, h: 28,
    interfaces: [I('bottom', 'side', 0, 14), I('a', 'mouth', -10, -14), I('b', 'mouth', 10, -14)],
    allowed_neighbors: ['test_tube_rigid', 'flask_conical', 'flask_round', 'glass_tube', 'bent_glass_tube'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['双导管密封连接', '制气装置同时导气与滴液'],
    notes: '塞子规格必须匹配瓶口，插入时蘸水旋转，勿强行挤压。'
  },
  {
    id: 'stopper_three_hole', name: '三孔橡胶塞', en: 'Three-hole rubber stopper', kind: 'stopper_tube',
    category: ['glass', 'connect'], w: 64, h: 28,
    interfaces: [I('bottom', 'side', 0, 14), I('a', 'mouth', -14, -14), I('b', 'mouth', 0, -14), I('c', 'mouth', 14, -14)],
    allowed_neighbors: ['test_tube_rigid', 'flask_conical', 'flask_round', 'glass_tube', 'bent_glass_tube', 'thermometer'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['三路导气/测温组合', '复杂制气与蒸馏装置密封'],
    notes: '各孔插入后应无缝隙；橡胶塞不耐强氧化剂与高温。'
  },
  {
    id: 'glass_stopper', name: '玻璃磨口塞', en: 'Ground glass stopper', kind: 'stopper',
    category: ['glass', 'connect'], w: 24, h: 28,
    interfaces: [I('bottom', 'side', 0, 14)],
    allowed_neighbors: ['reagent_bottle', 'volumetric_flask'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['磨口瓶密封', '容量瓶定容后倒转混匀'],
    notes: '磨口处保持洁净，涂润滑脂前确认试剂相容；不可强塞错配磨口。'
  },
  {
    id: 'porcelain_crucible', name: '瓷坩埚', en: 'Porcelain crucible', kind: 'crucible',
    category: ['glass', 'hot'], w: 42, h: 36, solid: true, heat: true,
    capacities: [10, 20],
    interfaces: [I('bottom', 'heat', 0, 17)],
    allowed_neighbors: ['clay_triangle', 'tripod', 'crucible_lid', 'crucible_tongs'],
    safety_level: 2, grade_level: 2,
    typical_uses: ['高温灼烧/灰化固体', '沉淀重量分析'],
    notes: '热坩埚用坩埚钳夹取，放于石棉网或耐火台冷却；不可骤冷。'
  },
  {
    id: 'silica_crucible', name: '石英坩埚', en: 'Quartz crucible', kind: 'crucible',
    category: ['glass', 'hot'], w: 42, h: 34, solid: true, heat: true,
    capacities: [10, 20],
    interfaces: [I('bottom', 'heat', 0, 16)],
    allowed_neighbors: ['clay_triangle', 'tripod', 'crucible_lid', 'crucible_tongs'],
    safety_level: 2, grade_level: 3,
    typical_uses: ['更高温耐腐蚀灼烧', '光谱分析样品处理'],
    notes: '石英耐温高但仍需防骤冷；避免与氢氟酸、强碱接触。'
  },
  /* ————— v4 扩容 · 加热与热源 ————— */
  {
    id: 'heating_mantle', name: '电热套', en: 'Heating mantle', kind: 'heating_mantle',
    category: ['heating', 'fire'], w: 72, h: 56, heat: true,
    capacities: [100, 250],
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -28)],
    allowed_neighbors: ['flask_round', 'distilling_flask'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['圆底烧瓶均匀加热', '蒸馏易燃溶剂时替代明火'],
    notes: '严禁空烧；降温后取下玻璃瓶，加热挥发性溶剂须在通风橱。'
  },
  {
    id: 'blast_lamp', name: '酒精喷灯', en: 'Alcohol blast lamp', kind: 'bunsen_burner',
    category: ['heating', 'fire'], w: 36, h: 78, heat: true,
    fsm: { off: { to: ['lit'] }, lit: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -40)],
    allowed_neighbors: ['test_tube_rigid'],
    safety_level: 2, grade_level: 2,
    typical_uses: ['玻璃加工与高温加热'],
    notes: '火焰温度高，必须由受训人员操作；熄灭按规程先关预热管再关燃料。'
  },
  {
    id: 'water_bath', name: '水浴锅', en: 'Water bath', kind: 'hotplate',
    category: ['heating', 'fire'], w: 90, h: 38, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -20)],
    allowed_neighbors: ['beaker', 'flask_round', 'thermometer'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['100 ℃ 以下均匀加热', '恒温溶解/反应'],
    notes: '水量以不溢出为准；加热易燃液体应避免明火并保持通风。'
  },
  {
    id: 'oil_bath', name: '油浴锅', en: 'Oil bath', kind: 'hotplate',
    category: ['heating', 'fire'], w: 90, h: 38, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -20)],
    allowed_neighbors: ['beaker', 'flask_round', 'thermometer'],
    safety_level: 2, grade_level: 2,
    typical_uses: ['100–250 ℃ 均匀加热', '回流与蒸馏'],
    notes: '不可用水浴替代；热油遇水会飞溅，容器外壁必须干燥。'
  },
  {
    id: 'sand_bath', name: '砂浴盘', en: 'Sand bath', kind: 'sand_bath',
    category: ['heating', 'fire'], w: 86, h: 34, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -18)],
    allowed_neighbors: ['beaker', 'flask_round', 'thermometer'],
    safety_level: 2, grade_level: 2,
    typical_uses: ['较高温均匀加热', '避免局部过热'],
    notes: '容器底部应接触干砂；砂层不可过厚，停止加热后余温仍高。'
  },
  {
    id: 'electric_furnace', name: '马弗炉', en: 'Muffle furnace', kind: 'furnace',
    category: ['heating', 'fire'], w: 84, h: 76, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 2, grade_level: 3,
    typical_uses: ['高温灼烧/灰化', '材料热处理'],
    notes: '炉膛高温且带电；取放必须使用长柄坩埚钳并待降温。'
  },
  {
    id: 'drying_oven', name: '烘箱', en: 'Drying oven', kind: 'furnace',
    category: ['heating', 'fire'], w: 84, h: 78, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [],
    allowed_neighbors: ['weighing_bottle'],
    safety_level: 2, grade_level: 2,
    typical_uses: ['玻璃仪器烘干', '固体恒重干燥'],
    notes: '挥发性/易燃溶剂不可入普通烘箱；热物品先冷却再称量。'
  },
  {
    id: 'infrared_lamp', name: '红外干燥灯', en: 'Infrared drying lamp', kind: 'infrared_lamp',
    category: ['heating', 'fire'], w: 56, h: 66, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('top', 'heat', 0, -34)],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 2,
    typical_uses: ['薄层板干燥', '局部温和加热'],
    notes: '灯管高温，避免直视与触碰；易燃物须保持安全距离。'
  },
  {
    id: 'clay_triangle', name: '泥三角', en: 'Clay triangle', kind: 'clay_triangle',
    category: ['heating', 'carrier'], w: 68, h: 48,
    interfaces: [I('top', 'side', 0, -20)],
    allowed_neighbors: ['tripod', 'crucible', 'porcelain_crucible', 'silica_crucible'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['承托坩埚直接加热'],
    notes: '泥三角需与三脚架配套，坩埚底部应落在三角中央。'
  },
  {
    id: 'test_tube_holder', name: '试管夹', en: 'Test tube holder', kind: 'test_tube_holder',
    category: ['heating', 'carrier'], w: 62, h: 26,
    interfaces: [],
    allowed_neighbors: ['test_tube', 'test_tube_rigid', 'alcohol_lamp'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['夹持试管加热'],
    notes: '夹在试管中上部，管口不得对人；不可夹持灼热玻璃后立即浸水。'
  },
  {
    id: 'heat_resistant_mat', name: '隔热垫', en: 'Heat-resistant mat', kind: 'asbestos_net',
    category: ['heating', 'carrier'], w: 86, h: 12,
    interfaces: [],
    allowed_neighbors: ['alcohol_lamp', 'beaker'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['放置热的玻璃容器', '保护台面'],
    notes: '必须标明耐温范围，破损或碳化后立即更换。'
  },
  {
    id: 'crucible_lid', name: '坩埚盖', en: 'Crucible lid', kind: 'watch_glass',
    category: ['heating', 'carrier'], w: 40, h: 8, heat: true,
    interfaces: [],
    allowed_neighbors: ['crucible', 'porcelain_crucible', 'silica_crucible'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['灼烧时减少粉尘与热量散失'],
    notes: '加热时留缝排气；冷却后及时盖严防吸潮。'
  },
  /* ————— v4 扩容 · 支撑固定与测量 ————— */
  {
    id: 'universal_stand', name: '重型实验支架', en: 'Heavy-duty support stand', kind: 'iron_stand',
    category: ['support', 'main'], w: 78, h: 160,
    interfaces: [I('pole', 'stand', 16, -65), I('pole2', 'stand', 16, -20)],
    allowed_neighbors: ['clamp', 'ring', 'universal_clamp', 'burette_clamp'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['支撑较大型装置', '固定冷凝管/分液漏斗'],
    notes: '底座应位于装置重心下方，夹具不宜悬臂过长。'
  },
  {
    id: 'burette_clamp', name: '滴定管夹', en: 'Burette clamp', alias: ['蝴蝶夹'], kind: 'clamp',
    category: ['support', 'hold'], w: 58, h: 30,
    interfaces: [I('head', 'side', 29, 0), I('tail', 'stand', -29, 0)],
    allowed_neighbors: ['iron_stand', 'universal_stand', 'burette'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['垂直固定滴定管'],
    notes: '滴定管须垂直且管尖伸入锥形瓶但不碰壁，夹持力度适中。'
  },
  {
    id: 'test_tube_rack', name: '试管架', en: 'Test tube rack', kind: 'test_tube_rack',
    category: ['support', 'hold'], w: 88, h: 52,
    interfaces: [],
    allowed_neighbors: ['test_tube', 'test_tube_rigid'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['暂存试管与试剂', '平行排列样品'],
    notes: '热试管不可直接插入塑料架；取放时握持管身。'
  },
  {
    id: 'universal_clamp', name: '万能夹', en: 'Universal clamp', kind: 'clamp',
    category: ['support', 'hold'], w: 76, h: 32,
    interfaces: [I('head', 'side', 38, 0), I('tail', 'stand', -38, 0)],
    allowed_neighbors: ['iron_stand', 'universal_stand', 'flask_round', 'condenser_liebig', 'condenser_sphere'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['多角度固定烧瓶/冷凝管'],
    notes: '夹具应垫软垫并避开磨口与薄弱玻璃。'
  },
  {
    id: 'drying_rack', name: '仪器晾干架', en: 'Glassware drying rack', kind: 'test_tube_rack',
    category: ['support', 'hold'], w: 110, h: 58,
    interfaces: [],
    allowed_neighbors: ['test_tube', 'grad_cyl', 'pipette'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['洗净玻璃仪器倒置沥干'],
    notes: '沥干后再烘干可节能并减少骤冷破裂风险。'
  },
  {
    id: 'analytical_balance', name: '分析天平', en: 'Analytical balance', kind: 'balance',
    category: ['measure', 'mass'], w: 80, h: 74,
    fsm: { idle: { to: ['weighing'] }, weighing: { to: ['idle'] } },
    fsmInitial: 'idle',
    interfaces: [],
    allowed_neighbors: ['weighing_bottle', 'beaker'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['万分之一天平精确称量', '重量分析'],
    notes: '先调水平与校准；热物、挥发物、腐蚀物不可直接放秤盘。'
  },
  {
    id: 'digital_platform_balance', name: '电子台秤', en: 'Digital platform balance', kind: 'balance',
    category: ['measure', 'mass'], w: 92, h: 30,
    fsm: { idle: { to: ['weighing'] }, weighing: { to: ['idle'] } },
    fsmInitial: 'idle',
    interfaces: [],
    allowed_neighbors: ['beaker', 'weighing_bottle'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['快速称量较大质量', '溶液配制'],
    notes: '使用前归零；不得超过量程，避免冲击称重台面。'
  },
  {
    id: 'thermocouple', name: '热电偶温度计', en: 'Thermocouple thermometer', kind: 'thermometer',
    category: ['measure', 'temp'], w: 10, h: 110,
    interfaces: [I('top', 'side', 0, -50)],
    allowed_neighbors: ['stopper_tube', 'universal_clamp', 'oil_bath', 'electric_furnace'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['高温与快速变化温度测量', '程序控温反馈'],
    notes: '热电偶丝与保护管有耐温上限，不可超量程使用。'
  },
  {
    id: 'ion_meter', name: '离子计', en: 'Ion-selective meter', kind: 'meter',
    category: ['measure', 'acid'], w: 62, h: 64,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 3,
    typical_uses: ['离子选择性电极定量测定'],
    notes: '需用标准溶液校准并控制离子强度与温度。'
  },
  {
    id: 'multimeter', name: '万用表', en: 'Digital multimeter', kind: 'meter',
    category: ['measure', 'electric'], w: 76, h: 96,
    interfaces: [I('com', 'elec', -24, 38), I('v', 'elec', 0, 38), I('a', 'elec', 24, 38)],
    allowed_neighbors: ['wire', 'resistance_box', 'rheostat'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['测量电压/电流/电阻'],
    notes: '测电流必须串联且使用电流插孔；未知量程先选最高档。'
  },
  {
    id: 'galvanometer', name: '灵敏电流计', en: 'Galvanometer', kind: 'meter',
    category: ['measure', 'electric'], w: 66, h: 54,
    interfaces: [I('l', 'elec', -26, -8), I('r', 'elec', 26, -8)],
    allowed_neighbors: ['wire'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['检测微弱电流方向', '电化学与电磁感应演示'],
    notes: '先机械调零，避免超过量程导致指针打表。'
  },
  {
    id: 'resistance_box', name: '电阻箱', en: 'Resistance box', kind: 'meter',
    category: ['measure', 'electric'], w: 64, h: 52,
    interfaces: [I('l', 'elec', -26, 0), I('r', 'elec', 26, 0)],
    allowed_neighbors: ['wire', 'ammeter', 'voltmeter'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['提供已知电阻', '伏安法测电阻'],
    notes: '实验前确认各旋钮阻值与允许电流，避免短路大电流。'
  },
  {
    id: 'rheostat', name: '滑动变阻器', en: 'Rheostat', kind: 'meter',
    category: ['measure', 'electric'], w: 70, h: 58,
    interfaces: [I('l', 'elec', -28, 18), I('r', 'elec', 28, 18), I('slider', 'elec', 0, -20)],
    allowed_neighbors: ['wire', 'multimeter'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['调节电流与分压', '限流保护电路'],
    notes: '闭合开关前滑片置于阻值最大端，接线需对应限流或分压方式。'
  },
  {
    id: 'conductivity_meter', name: '电导率仪', en: 'Conductivity meter', kind: 'meter',
    category: ['measure', 'electric'], w: 66, h: 68,
    interfaces: [],
    allowed_neighbors: ['beaker'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['比较溶液导电能力', '监测离子浓度变化'],
    notes: '电极需用待测液润洗，并控制温度；测后清洗电极。'
  },
  {
    id: 'colorimeter', name: '比色计', en: 'Colorimeter', kind: 'meter',
    category: ['measure', 'electric'], w: 62, h: 52,
    interfaces: [I('slot', 'side', 0, 22)],
    allowed_neighbors: ['cuvette'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['测溶液吸光度与浓度'],
    notes: '先用空白溶液调零，比色皿方向一致并保持透光面洁净。'
  },
  {
    id: 'barometer', name: '气压计', en: 'Barometer', kind: 'meter',
    category: ['measure', 'pressure'], w: 44, h: 74,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 2,
    typical_uses: ['测大气压', '气体摩尔体积实验修正压强'],
    notes: '保持竖直并避免阳光直晒与剧烈震动。'
  },
  {
    id: 'pressure_gauge', name: '压强表', en: 'Pressure gauge', kind: 'meter',
    category: ['measure', 'pressure'], w: 56, h: 56,
    interfaces: [I('port', 'side', 0, 24)],
    allowed_neighbors: ['vacuum_pump'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['监测体系压强', '减压蒸馏与气路安全'],
    notes: '量程必须覆盖预期压强；连接处应密封并避免玻璃接头受力。'
  },
  {
    id: 'vacuum_gauge', name: '真空表', en: 'Vacuum gauge', kind: 'meter',
    category: ['measure', 'pressure'], w: 52, h: 56,
    interfaces: [I('port', 'side', 0, 24)],
    allowed_neighbors: ['vacuum_pump', 'rotary_evaporator'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['监测减压蒸馏真空度'],
    notes: '先开冷却水再抽真空；停机时先解除真空再关泵。'
  },
  {
    id: 'hygrometer', name: '湿度计', en: 'Hygrometer', kind: 'meter',
    category: ['measure', 'humidity'], w: 48, h: 64,
    interfaces: [],
    allowed_neighbors: [],
    safety_level: 1, grade_level: 1,
    typical_uses: ['测空气相对湿度', '观察干燥环境'],
    notes: '远离热源与冷凝水，使用前按说明校准。'
  },
  {
    id: 'vacuum_pump', name: '真空泵', en: 'Vacuum pump', kind: 'vacuum_pump',
    category: ['gas', 'lead'], w: 74, h: 52,
    interfaces: [I('inlet', 'side', -34, 6)],
    allowed_neighbors: ['glass_tube', 'rubber_tube', 'pressure_gauge', 'vacuum_gauge', 'filter_flask', 'rotary_evaporator'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['抽滤与减压蒸馏', '建立低压气路'],
    notes: '挥发性蒸气不可直接进入油泵，应接冷阱与保护装置。'
  },
  /* ————— v4 扩容 · 分离与提纯 / 蒸馏 ————— */
  {
    id: 'distilling_flask', name: '蒸馏烧瓶', en: 'Distilling flask', kind: 'distilling_flask',
    category: ['purification', 'distill'], w: 76, h: 92, liquid: true, solid: true, heat: true,
    capacities: [100, 250],
    interfaces: [I('neck', 'mouth', 0, -40), I('side', 'side', 34, -4), I('belly', 'clamp', 0, 6), I('bottom', 'heat', 0, 32)],
    allowed_neighbors: ['stopper_tube', 'thermometer', 'heating_mantle', 'clamp', 'fractionating_column', 'dephlegmator'],
    safety_level: 2, grade_level: 2,
    typical_uses: ['常压/减压蒸馏', '分离沸点不同的液体'],
    notes: '蒸馏时体系不可密闭；温度计水银球上沿对准支管口下沿。'
  },
  {
    id: 'condenser_liebig', name: '直形冷凝管', en: 'Liebig condenser', kind: 'condenser',
    category: ['purification', 'distill'], w: 28, h: 132,
    interfaces: [I('top', 'mouth', 0, -62), I('bottom', 'mouth', 0, 62), I('in', 'side', -18, 40), I('out', 'side', 18, -40)],
    allowed_neighbors: ['glass_tube', 'rubber_tube', 'universal_clamp', 'distill_adapter', 'vacuum_adapter', 'soxhlet_extractor'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['蒸馏蒸气冷凝', '索氏提取回流'],
    notes: '冷却水“下进上出”；先开冷却水再加热，结束时先停热再关水。'
  },
  {
    id: 'condenser_sphere', name: '球形冷凝管', en: 'Allihn condenser', kind: 'condenser',
    category: ['purification', 'distill'], w: 48, h: 124,
    interfaces: [I('top', 'mouth', 0, -58), I('bottom', 'mouth', 0, 58), I('in', 'side', -28, 36), I('out', 'side', 28, -36)],
    allowed_neighbors: ['glass_tube', 'rubber_tube', 'universal_clamp', 'distill_adapter'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['回流冷凝', '较易挥发溶剂的回流'],
    notes: '主要用于回流而非蒸馏收集；冷却水方向同样下进上出。'
  },
  {
    id: 'condenser_allihn', name: '蛇形冷凝管', en: 'Coiled condenser', kind: 'condenser',
    category: ['purification', 'distill'], w: 40, h: 128,
    interfaces: [I('top', 'mouth', 0, -60), I('bottom', 'mouth', 0, 60), I('in', 'side', -24, 40), I('out', 'side', 24, -40)],
    allowed_neighbors: ['glass_tube', 'rubber_tube', 'universal_clamp', 'distill_adapter'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['高效回流冷凝', '低沸点溶剂回流'],
    notes: '内管弯折处易积液，安装保持倾斜；冷却水不得断流。'
  },
  {
    id: 'distill_adapter', name: '牛角管', en: 'Vacuum distillation adapter', alias: ['蒸馏接引管'], kind: 'adapter',
    category: ['purification', 'distill'], w: 68, h: 48,
    interfaces: [I('in', 'side', -30, -16), I('out', 'side', 30, 16), I('vac', 'mouth', 0, -24)],
    allowed_neighbors: ['condenser_liebig', 'condenser_sphere', 'condenser_allihn', 'receiving_flask', 'vacuum_pump'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['连接冷凝管与接收瓶', '减压蒸馏接真空系统'],
    notes: '接收瓶需固定，侧管接真空时须有保护与止逆装置。'
  },
  {
    id: 'vacuum_adapter', name: '真空接引管', en: 'Vacuum take-off adapter', kind: 'adapter',
    category: ['purification', 'distill'], w: 62, h: 44,
    interfaces: [I('in', 'side', -28, -14), I('out', 'side', 28, 14), I('vac', 'mouth', 0, -22)],
    allowed_neighbors: ['condenser_liebig', 'receiving_flask', 'vacuum_pump', 'vacuum_gauge'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['减压蒸馏更换接收瓶', '分段收集不同馏分'],
    notes: '切换接收瓶前先解除真空；接口不可承受侧向拉力。'
  },
  {
    id: 'receiving_flask', name: '接收瓶', en: 'Receiving flask', kind: 'flask_conical',
    category: ['purification', 'distill'], w: 56, h: 72, liquid: true,
    capacities: [50, 100],
    interfaces: [I('mouth', 'mouth', 0, -32)],
    allowed_neighbors: ['distill_adapter', 'vacuum_adapter', 'stopper'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['接收馏出液', '分馏分段收集'],
    notes: '瓶口不得密封；馏出液勿装过满，必要时冰浴冷却。'
  },
  {
    id: 'fractionating_column', name: '分馏柱', en: 'Fractionating column', kind: 'fractionating_column',
    category: ['purification', 'distill'], w: 30, h: 134, liquid: true,
    interfaces: [I('top', 'mouth', 0, -63), I('bottom', 'side', 0, 63), I('therm', 'side', 12, -42)],
    allowed_neighbors: ['distilling_flask', 'condenser_liebig', 'thermometer', 'dephlegmator'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['提高沸点接近混合物的分离效率'],
    notes: '需保温并保持回流平衡；填料不得装填过紧或超过规定高度。'
  },
  {
    id: 'dephlegmator', name: '分凝柱', en: 'Dephlegmator', kind: 'fractionating_column',
    category: ['purification', 'distill'], w: 34, h: 116, liquid: true,
    interfaces: [I('top', 'mouth', 0, -54), I('bottom', 'side', 0, 54), I('in', 'side', -22, 30), I('out', 'side', 22, -30)],
    allowed_neighbors: ['distilling_flask', 'condenser_liebig', 'thermometer'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['部分冷凝高沸点组分', '精细分离与回流比控制'],
    notes: '冷却水量影响分离效果；操作中避免柱内积液过多。'
  },
  {
    id: 'rotary_evaporator', name: '旋转蒸发仪', en: 'Rotary evaporator', kind: 'rotary_evaporator',
    category: ['purification', 'distill'], w: 150, h: 128, liquid: true, heat: true,
    fsm: { off: { to: ['on'] }, on: { to: ['off'] } },
    fsmInitial: 'off',
    interfaces: [I('condenser', 'mouth', 48, -54), I('receiver', 'mouth', 48, 54), I('vac', 'side', -66, 16)],
    allowed_neighbors: ['water_bath', 'vacuum_pump', 'receiving_flask'],
    safety_level: 2, grade_level: 3,
    typical_uses: ['低温减压蒸发溶剂', '回收与浓缩样品'],
    notes: '严禁密闭加热；先开冷凝水与真空再升温，结束先停转停热再缓释真空。'
  },
  /* ————— v4 扩容 · 分离与提纯 / 过滤萃取干燥 ————— */
  {
    id: 'buchner_funnel', name: '布氏漏斗', en: 'Büchner funnel', kind: 'buchner_funnel',
    category: ['purification', 'filter'], w: 64, h: 60,
    interfaces: [I('top', 'mouth', 0, -28), I('neck', 'side', 0, 30)],
    allowed_neighbors: ['filter_flask', 'filter_paper'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['减压过滤收集晶体', '快速分离沉淀'],
    notes: '滤纸直径需略小于漏斗底面并润湿贴紧；先开泵形成负压后再过滤。'
  },
  {
    id: 'filter_flask', name: '抽滤瓶', en: 'Filter flask', alias: ['布氏烧瓶'], kind: 'filter_flask',
    category: ['purification', 'filter'], w: 68, h: 88, liquid: true, solid: true,
    capacities: [125, 250],
    interfaces: [I('mouth', 'mouth', 0, -39), I('vac', 'side', 36, -6)],
    allowed_neighbors: ['buchner_funnel', 'glass_frit_funnel', 'filter_stick', 'vacuum_pump', 'rubber_tube'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['承接抽滤液', '连接真空泵过滤沉淀'],
    notes: '侧管只接真空，不可密封；抽滤结束先断开真空再关泵。'
  },
  {
    id: 'glass_frit_funnel', name: '砂芯漏斗', en: 'Sintered glass funnel', kind: 'buchner_funnel',
    category: ['purification', 'filter'], w: 58, h: 68,
    interfaces: [I('top', 'mouth', 0, -32), I('neck', 'side', 0, 34)],
    allowed_neighbors: ['filter_flask', 'vacuum_pump', 'filter_stick'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['过滤细小沉淀', '重量分析'],
    notes: '按孔径选择型号，使用后用适当溶剂清洗，不可用硬物刮擦砂芯。'
  },
  {
    id: 'gooch_crucible', name: '古氏坩埚', en: 'Gooch crucible', kind: 'crucible',
    category: ['purification', 'filter'], w: 40, h: 42, solid: true,
    capacities: [15, 30],
    interfaces: [I('top', 'mouth', 0, -20), I('bottom', 'side', 0, 21)],
    allowed_neighbors: ['filter_stick', 'asbestos_net', 'drying_oven'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['沉淀过滤、洗涤与恒重'],
    notes: '古氏坩埚需配适宜石棉层或玻璃纤维，干燥后恒重再计算。'
  },
  {
    id: 'filter_stick', name: '玻璃过滤棒', en: 'Glass filter stick', kind: 'glass_tube',
    category: ['purification', 'filter'], w: 12, h: 96,
    interfaces: [I('top', 'side', 0, -44), I('bottom', 'side', 0, 44)],
    allowed_neighbors: ['gooch_crucible', 'filter_flask', 'vacuum_pump'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['小规模沉淀抽滤', '配合古氏坩埚过滤'],
    notes: '玻璃烧结头易碰碎，洗涤时不可用硬物捅刮。'
  },
  {
    id: 'thistle_funnel', name: '长颈漏斗', en: 'Thistle funnel', kind: 'funnel',
    category: ['purification', 'extract'], w: 44, h: 96,
    interfaces: [I('top', 'mouth', 0, -45), I('neck', 'side', 0, 48)],
    allowed_neighbors: ['stopper_tube', 'test_tube_rigid', 'flask_conical'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['向反应器滴加液体', '简易气体发生装置'],
    notes: '用于液封时长颈下端须浸入液面以下；滴加时防止漏斗内压强过大。'
  },
  {
    id: 'pressure_equalizing_funnel', name: '恒压滴液漏斗', en: 'Pressure-equalizing dropping funnel', kind: 'sep_funnel',
    category: ['purification', 'extract'], w: 48, h: 100, liquid: true,
    capacities: [100, 250],
    interfaces: [I('top', 'mouth', 0, -46), I('neck', 'side', 0, 50), I('pressure', 'side', 22, -26)],
    allowed_neighbors: ['flask_round', 'flask_conical', 'stopper'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['密闭体系控制滴液速度', '回流滴加分液'],
    notes: '恒压支管必须连通，玻璃活塞涂脂适量，使用后及时清洗。'
  },
  {
    id: 'extraction_thimble', name: '索氏提取滤纸筒', en: 'Soxhlet extraction thimble', kind: 'thimble',
    category: ['purification', 'extract'], w: 22, h: 70,
    interfaces: [],
    allowed_neighbors: ['soxhlet_extractor'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['装固体样品进行索氏提取'],
    notes: '样品装填疏松、低于筒口，筒外不得散落固体堵塞回流管。'
  },
  {
    id: 'soxhlet_extractor', name: '索氏提取器', en: 'Soxhlet extractor', kind: 'soxhlet',
    category: ['purification', 'extract'], w: 46, h: 138, liquid: true,
    interfaces: [I('top', 'mouth', 0, -65), I('bottom', 'side', 0, 69), I('vapor', 'side', 24, -40)],
    allowed_neighbors: ['condenser_liebig', 'distilling_flask', 'extraction_thimble'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['用溶剂连续提取固体中的可溶组分'],
    notes: '溶剂须低毒低沸点且与样品相容；提取前检查磨口与回流路径。'
  },
  {
    id: 'drying_tube', name: '干燥管', en: 'Drying tube', kind: 'drying_tube',
    category: ['purification', 'dry'], w: 32, h: 88,
    interfaces: [I('l', 'side', -22, -28), I('r', 'side', 22, -28)],
    allowed_neighbors: ['glass_tube', 'rubber_tube', 'silica_gel'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['干燥通过的气体', '防止空气中水蒸气进入装置'],
    notes: '干燥剂不可与被干燥气体反应；装填不宜过紧并定期更换。'
  },
  {
    id: 'desiccator', name: '干燥器', en: 'Desiccator', kind: 'desiccator',
    category: ['purification', 'dry'], w: 78, h: 92, solid: true,
    interfaces: [],
    allowed_neighbors: ['silica_gel', 'weighing_bottle'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['冷却灼烧后的坩埚', '保存易吸潮样品'],
    notes: '热物品必须稍冷却后再放入；开盖时缓慢推开，防止负压将盖吸起。'
  },
  {
    id: 'desiccant_tower', name: '干燥塔', en: 'Desiccant tower', kind: 'drying_tower',
    category: ['purification', 'dry'], w: 44, h: 122,
    interfaces: [I('in', 'side', -22, 40), I('out', 'side', 22, -40)],
    allowed_neighbors: ['glass_tube', 'rubber_tube', 'silica_gel'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['连续干燥较大流量气体'],
    notes: '气体流向与装填方式需匹配，失效干燥剂应及时再生或更换。'
  },
  /* ————— v4 扩容 · 分离与提纯 / 层析 ————— */
  {
    id: 'chromatography_paper', name: '层析滤纸', en: 'Chromatography paper', kind: 'filter_paper',
    category: ['purification', 'chroma'], w: 56, h: 76,
    interfaces: [],
    allowed_neighbors: ['chromatography_chamber', 'spotting_capillary'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['纸层析分离色素/氨基酸'],
    notes: '点样点小而浓，展开剂液面须低于点样线；手只接触纸条边缘。'
  },
  {
    id: 'chromatography_chamber', name: '展开缸', en: 'Chromatography chamber', kind: 'bottle',
    category: ['purification', 'chroma'], w: 68, h: 58, liquid: true,
    capacities: [100, 250],
    interfaces: [I('mouth', 'mouth', 0, -27)],
    allowed_neighbors: ['chromatography_paper', 'tlc_plate', 'chromatography_column'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['提供层析展开环境', '纸层析/薄层层析'],
    notes: '课堂优先用水基展开剂；盖严并保持展开剂液面稳定。'
  },
  {
    id: 'chromatography_column', name: '层析柱', en: 'Chromatography column', kind: 'chromatography_column',
    category: ['purification', 'chroma'], w: 26, h: 118, liquid: true,
    interfaces: [I('top', 'mouth', 0, -55), I('bottom', 'side', 0, 59)],
    allowed_neighbors: ['chromatography_chamber', 'silica_gel'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['柱层析分离混合物', '纯化目标组分'],
    notes: '固定相装填不得夹带气泡，洗脱速度均匀，展开剂需低毒。'
  },
  {
    id: 'tlc_plate', name: '薄层层析板', en: 'Thin-layer chromatography plate', kind: 'tlc_plate',
    category: ['purification', 'chroma'], w: 50, h: 68,
    interfaces: [],
    allowed_neighbors: ['chromatography_chamber', 'spotting_capillary'],
    safety_level: 1, grade_level: 3,
    typical_uses: ['快速监测反应与混合物组成'],
    notes: '持板边缘，点样线距底边约 1 cm；展开后立即标记溶剂前沿。'
  },
  {
    id: 'spotting_capillary', name: '点样毛细管', en: 'Spotting capillary', kind: 'capillary',
    category: ['purification', 'chroma'], w: 8, h: 64,
    interfaces: [],
    allowed_neighbors: ['tlc_plate', 'chromatography_paper'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['层析点样'],
    notes: '管口轻触点样，勿划伤吸附层；用后按玻璃锐器回收。'
  },
  /* ————— v4 扩容 · 耗材与工具 ————— */
  {
    id: 'nichrome_spatula', name: '镍铬药匙', en: 'Nichrome spatula', kind: 'spoon',
    category: ['consumable', 'take'], w: 62, h: 14,
    interfaces: [],
    allowed_neighbors: ['weighing_bottle', 'beaker'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['称取耐腐蚀固体', '转移小量粉末'],
    notes: '用前后清洁干燥；腐蚀性药品须使用相容材质工具。'
  },
  {
    id: 'test_tube_brush', name: '试管刷', en: 'Test tube brush', kind: 'brush',
    category: ['consumable', 'clean'], w: 16, h: 90,
    interfaces: [],
    allowed_neighbors: ['test_tube', 'test_tube_rigid', 'grad_cyl'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['清洗试管与量筒内壁'],
    notes: '刷头铁丝不可伸出管口，避免刮伤玻璃或折断。'
  },
  {
    id: 'weighing_paper', name: '称量纸', en: 'Weighing paper', kind: 'filter_paper',
    category: ['consumable', 'test'], w: 60, h: 44,
    interfaces: [],
    allowed_neighbors: ['balance', 'analytical_balance'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['称量稳定、不挥发、不腐蚀固体'],
    notes: '挥发性、吸湿性强或腐蚀性药品不可直接放在纸上称量。'
  },
  {
    id: 'boiling_chips', name: '沸石', en: 'Boiling chips', kind: 'boiling_chips',
    category: ['consumable', 'test'], w: 32, h: 22,
    interfaces: [],
    allowed_neighbors: ['flask_round', 'distilling_flask', 'beaker'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['防止液体暴沸', '提供汽化中心'],
    notes: '必须在加热前加入；严禁向已沸腾或高温液体中补加沸石。'
  },
  {
    id: 'pipette_filler', name: '移液管吸球', en: 'Pipette filler', kind: 'pipette_filler',
    category: ['consumable', 'test'], w: 34, h: 30,
    interfaces: [],
    allowed_neighbors: ['pipette'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['安全吸取溶液', '避免用嘴吸移液管'],
    notes: '严禁口吸；吸球与移液管连接紧密，用后清洗。'
  },
  {
    id: 'stopcock_key', name: '活塞钥匙', en: 'Stopcock key', kind: 'tweezers',
    category: ['consumable', 'test'], w: 34, h: 12,
    interfaces: [],
    allowed_neighbors: ['burette', 'sep_funnel'],
    safety_level: 1, grade_level: 2,
    typical_uses: ['拆装玻璃活塞', '调节卡涩活塞'],
    notes: '操作不可强扭，玻璃活塞易碎；用后擦净并妥善存放。'
  },
  {
    id: 'crucible_tongs', name: '坩埚钳', en: 'Crucible tongs', kind: 'tweezers',
    category: ['consumable', 'test'], w: 74, h: 18,
    interfaces: [],
    allowed_neighbors: ['crucible', 'porcelain_crucible', 'silica_crucible', 'evaporating_dish'],
    safety_level: 1, grade_level: 0,
    typical_uses: ['夹取热坩埚与蒸发皿'],
    notes: '钳端应清洁干燥，夹持后放在耐热表面，不可直接放桌面。'
  },
  {
    id: 'silica_gel', name: '无钴硅胶干燥剂', en: 'Cobalt-free silica gel', kind: 'desiccant',
    category: ['consumable', 'test'], w: 30, h: 24,
    interfaces: [],
    allowed_neighbors: ['desiccator', 'desiccant_tower', 'drying_tube', 'chromatography_column'],
    safety_level: 1, grade_level: 1,
    typical_uses: ['干燥气体与保存样品', '层析柱装填'],
    notes: '失效后按说明再生，粉尘不可吸入；避免使用含钴指示剂的干燥剂。'
  }
];

/* ————— 款型扩展：capacities 展开为独立 SKU ————— */
function expand() {
  const index = {};
  for (const d of APPARATUS_DEFS) {
    index[d.id] = { def: d, cap: 0, id: d.id, label: d.name };
    if (d.capacities) {
      d.capacities.forEach(c => {
        index[d.id + '_' + c] = { def: d, cap: c, id: d.id + '_' + c, label: d.name + ' ' + c + ' mL' };
      });
    }
  }
  return index;
}
export const APPARATUS_INDEX = expand();
export const APPARATUS_COUNT = Object.keys(APPARATUS_INDEX).length;

export function apparatus(idOrDef) {
  if (!idOrDef) return null;
  if (typeof idOrDef === 'object') return idOrDef;
  return APPARATUS_INDEX[idOrDef] || null;
}

/* 按分类树汇总计数（供图鉴/统计展示） */
export function treeStats() {
  const out = {};
  for (const [k1, v1] of Object.entries(APPARATUS_TREE)) {
    let n = 0; const kids = {};
    for (const [k2, v2] of Object.entries(v1.children)) {
      const names = Array.isArray(v2.items) ? v2.items : Object.keys(v2.items || {});
      let c = 0;
      names.forEach(nm => {
        const e = APPARATUS_INDEX[nm];
        if (e) c += 1 + (e.def.capacities ? e.def.capacities.length : 0);
      });
      kids[v2.name] = c; n += c;
    }
    out[v1.name] = { count: n, kids };
  }
  return out;
}
