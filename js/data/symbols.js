// 炼金符号解码器数据
const svgFire = '<svg viewBox="0 0 40 40"><path d="M20 6 L34 32 L6 32 Z" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
const svgWater = '<svg viewBox="0 0 40 40"><path d="M20 34 L6 8 L34 8 Z" fill="none" stroke="currentColor" stroke-width="3"/></svg>';
const svgAir = '<svg viewBox="0 0 40 40"><path d="M20 6 L34 32 L6 32 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M8 24 L32 24" stroke="currentColor" stroke-width="3"/></svg>';
const svgEarth = '<svg viewBox="0 0 40 40"><path d="M20 34 L6 8 L34 8 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M8 16 L32 16" stroke="currentColor" stroke-width="3"/></svg>';
const svgGold = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="20" cy="20" r="2.6" fill="currentColor"/></svg>';
const svgSalt = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="3"/><path d="M7 20 L33 20" stroke="currentColor" stroke-width="3"/></svg>';
const svgSulfur = '<svg viewBox="0 0 40 40"><path d="M20 4 L31 21 L9 21 Z" fill="none" stroke="currentColor" stroke-width="3"/><path d="M20 21 L20 35" stroke="currentColor" stroke-width="3"/><path d="M13 28 L27 28" stroke="currentColor" stroke-width="3"/></svg>';

export const SYMBOLS = [
  { id: 'fire', name: '火', en: 'Ignis', glyph: svgFire,
    meaning: '代表热、能量与转化。炼金术认为火是"促使物质变化"的推动力，一切坩埚里的奇迹都离不开火候的掌握。',
    history: '四元素说中的第一位。炼金术士相信金属在地下"生长"，而火能加速这种生长——这正是他们熬煮矿石的理由。',
    science: '今天我们知道燃烧是剧烈的氧化反应（放热），"火候"的实质是温度对反应速率与平衡的影响。', link: 'a2' },
  { id: 'water', name: '水', en: 'Aqua', glyph: svgWater,
    meaning: '代表溶解、净化与流动。炼金术文献中的"圣水""贤者之水"常指某种溶解液，而非普通的水。',
    history: '溶解-过滤-蒸发-结晶的操作体系由炼金术士完善，至今仍是实验室分离提纯的基本套路。',
    science: '水是极性溶剂，靠氢键溶解离子与极性物质；"相似相溶"解释了为何油水不容。', link: 'a4' },
  { id: 'air', name: '气', en: 'Aer', glyph: svgAir,
    meaning: '代表生命与"看不见的存在"。古代把空气当作单一元素，直到17世纪人们才发现它是混合物。',
    history: '17世纪范·海尔蒙特把发酵和燃烧放出的气体称为"gas"，首次意识到空气之外还有各种不同的气体。',
    science: '空气是 N2 约78%、O2 约21%的混合物；气体的压强、体积、温度遵循气体定律。', link: 'a3' },
  { id: 'earth', name: '土', en: 'Terra', glyph: svgEarth,
    meaning: '代表固体、矿石与"物质的躯体"。炼金术士从土中炼取金属，把它视为一切固体之本。',
    history: '采矿与冶金是炼金术最大的现实成果。许多炼金术士本人就是出色的冶金工匠。',
    science: '岩石与矿石是复杂混合物，成分分析、晶体结构与化学键决定了材料的性能。', link: 'd1' },
  { id: 'gold', name: '金', en: 'Aurum', glyph: svgGold,
    meaning: '太阳与"完善之物"的象征。点石成金是炼金术的终极目标，符号是圆内一点——完美无缺。',
    history: '两千年来无数人试图把铅、铜转化为金，全部失败；但这段历程催生了冶金学与定量实验。',
    science: '金 Au 是第79号元素。用化学方法无法把一种元素变成另一种——那需要核反应。', link: 'b1' },
  { id: 'silver', name: '银', en: 'Argentum', glyph: '☽',
    meaning: '月亮的象征，与金并称日金月银。银镜、银器杀菌的妙用古已有之。',
    history: '银的提炼与锻打让古代工匠积累了溶解、置换反应的经验（如把银溶解后重新析出）。',
    science: 'Ag⁺ 离子有杀菌作用；银镜反应利用其被还原成银单质的能力检测醛基。', link: 'b4' },
  { id: 'copper', name: '铜', en: 'Cuprum', glyph: '♀',
    meaning: '金星维纳斯的符号。塞浦路斯岛（Cyprus）盛产铜，拉丁语 Cuprum 由此得名。',
    history: '人类最早大规模使用的金属之一。青铜时代（约公元前3300年起）改变了文明的面貌。',
    science: 'Cu 与 Zn 组成原电池时电压约1.10 V；铜的焰色反应呈绿色。', link: 'b4' },
  { id: 'iron', name: '铁', en: 'Ferrum', glyph: '♂',
    meaning: '火星战神的符号。陨铁曾是"天上之铁"，胜过铜器，最终开启铁器时代。',
    history: '铁生锈是折磨人类千年的问题，也是氧化还原反应最日常的样本；船舶挂锌块防锈正是化学智慧的结晶。',
    science: 'Fe 在活动性顺序中位于 Zn 之后、Cu 之前，能与稀酸反应置换氢气。', link: 'b4' },
  { id: 'tin', name: '锡', en: 'Stannum', glyph: '♃',
    meaning: '木星朱庇特的符号。锡与铜合成青铜，是人类合金学的开端。',
    history: '青铜器时代各大文明几乎独立发现了"铜加锡更硬"的配方——最早的"材料工程"。',
    science: 'Sn 是第50号元素，耐腐蚀性好，常作镀层保护铁罐头。', link: 'd1' },
  { id: 'lead', name: '铅', en: 'Plumbum', glyph: '♄',
    meaning: '土星萨图恩的符号，被视为"未成熟、卑贱"的金属——炼金术士梦想把它"培育"成金。',
    history: '铅曾是罗马人的水管与酒器材料，慢性铅中毒可能是罗马帝国衰落的推手之一。',
    science: 'Pb 是重金属，对人体神经有毒；铅蓄电池至今仍广泛使用。', link: 'b4' },
  { id: 'mercury', name: '汞', en: 'Hydrargyrum', glyph: '☿',
    meaning: '水星墨丘利的符号，代表"流动变化之物"。液态金属令古人着迷，汞是炼金术哲学的中心元素。',
    history: '中国炼丹家与欧洲炼金术士都痴迷汞。《抱朴子》记载的丹方中汞与硫生成朱砂（HgS）。',
    science: '汞及其化合物剧毒且易挥发；朱砂是硫化汞矿物。现代实验室严禁擅自加热汞。', link: 'a5' },
  { id: 'salt', name: '盐', en: 'Sal', glyph: svgSalt,
    meaning: '圆加横线，代表"永恒不变之体"。盐是帕拉塞尔苏斯"三要素"中身体的象征。',
    history: '盐是古代最珍贵的贸易品之一。"salary（薪水）"一词就源于罗马士兵领盐饷。',
    science: '氯化钠在水中的溶解度随温度变化很小（36→39 g/100g水），提纯它靠蒸发结晶而非冷却。', link: 'a4' },
  { id: 'sulfur', name: '硫', en: 'Sulphur', glyph: svgSulfur,
    meaning: '三角架十字，象征"可燃性之魂"。炼金术士用硫解释一切能燃烧的东西。',
    history: '硫是火药（硝石75%、硫磺10%、木炭15%）三大成分之一——中国炼丹术最著名的"意外发现"。',
    science: 'S 在氧气中燃烧生成 SO2（淡蓝色火焰），是酸雨的前体之一。', link: 'd2' }
];
