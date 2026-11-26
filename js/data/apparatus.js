// 器材库（配置驱动）：三级分类树 + 器材定义 + 容量"款型"扩展 + 接口/邻接规则
// 规模路线：首批中学核心款型（本文件 ~90 款）；架构支持持续扩到 450+（新增 def 即自动进入树/索引/图鉴）。
// 款-not-种：如"烧杯 100 mL"是烧杯的一个款，容量数组 capacities 展开成独立 SKU。

export const APPARATUS_TREE = {
  glass: { name: '玻璃仪器', children: {
    container: { name: '反应容器', items: ['test_tube', 'beaker', 'flask_conical', 'flask_round', 'wide_mouth', 'reagent_bottle', 'watch_glass'] },
    measure: { name: '量取仪器', items: ['grad_cyl', 'volumetric_flask', 'pipette', 'burette', 'dropper'] },
    connect: { name: '连接件', items: ['glass_tube', 'stopper', 'stopper_tube', 'stirring_rod'] },
    filter: { name: '过滤与分液', items: ['funnel', 'sep_funnel', 'gas_wash_bottle', 'wash_bottle'] },
    hot: { name: '高温仪器', items: ['evaporating_dish', 'crucible'] },
    grind: { name: '研磨', items: ['mortar'] }
  } },
  heating: { name: '加热与热源', children: {
    fire: { name: '热源', items: ['alcohol_lamp', 'bunsen_burner', 'hotplate'] },
    carrier: { name: '承热件', items: ['tripod', 'asbestos_net'] }
  } },
  support: { name: '支撑与固定', children: {
    main: { name: '主体', items: ['iron_stand'] },
    hold: { name: '夹持', items: ['clamp', 'ring'] }
  } },
  measure: { name: '测量仪器', children: {
    mass: { name: '质量', items: ['balance'] },
    temp: { name: '温度', items: ['thermometer'] },
    acid: { name: '酸度', items: ['ph_meter'] },
    electric: { name: '电学', items: ['ammeter', 'voltmeter'] },
    time: { name: '时间', items: ['stopwatch'] }
  } },
  gas: { name: '气体实验', children: {
    collect: { name: '收集', items: ['gas_jar', 'trough', 'gas_bag'] },
    lead: { name: '导气', items: ['rubber_tube'] }
  } },
  electro: { name: '电化学', children: {
    electrode: { name: '电极', items: ['electrode_c', 'electrode_cu', 'electrode_zn', 'electrode_fe'] },
    circuit: { name: '电路', items: ['wire', 'switch', 'bulb'], extra: { u_tube: 'u_tube' } }
  } },
  consumable: { name: '耗材与工具', children: {
    take: { name: '取用', items: ['spoon', 'tweezers'] },
    test: { name: '检验', items: ['match', 'splint', 'splint_fire', 'litmus_paper', 'ph_paper', 'filter_paper', 'cotton'] }
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
        if (e) c += 1 + (e.def.capacities ? e.def.capacities.length - 1 : 0);
      });
      kids[v2.name] = c; n += c;
    }
    out[v1.name] = { count: n, kids };
  }
  return out;
}
