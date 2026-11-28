export const STORIES = [
  {
    id: 'boyle',
    order: 1,
    numeral: 'Ⅰ',
    era: '1662 · 伦敦',
    title: '波义耳：让空气接受测量',
    subtitle: '一台气泵，两组读数，化学开始用数字说话。',
    intro: '罗伯特·波义耳与罗伯特·胡克改进气泵，使“空气”从看不见的背景变成可以截取、压缩和称量的研究对象。1662 年，波义耳报告：温度不变时，一定质量气体的压强与体积成反比。这个关系不是从四元素说推出来的，而是从受控测量中发现的。',
    context: [
      '<b>时代难题</b>：空气究竟是一种元素，还是多种可分离的物质？只靠观察无法回答，必须改变条件并精确记录。',
      '<b>你的身份</b>：波义耳实验室的见习记录员。先固定温度与物质的量，再寻找体积和压强之间的定量关系。',
      '<b>模型边界</b>：本关使用理想气体模型。真实气体在高压或低温下会偏离这条关系。'
    ],
    mission: {
      experiment: 'gaslaws',
      evidenceKind: 'boyle',
      title: '时代任务 · 记录 PV 关系',
      brief: '在气体定律实验中保持 n = 1.00 mol、T = 300 K，分别记录约 50 L 的大体积状态和 10 L 以下的小体积状态。两次记录的 PV 乘积偏差必须小于 3%。',
      recordHint: '先把体积调到 50 L 并记录；再压缩到 10 L 以下记录。不要改变温度或物质的量。',
      readyText: '两份记录满足受控条件，且 PV 乘积偏差小于 3%。',
      waitingText: '需要两条同温、同物质的量的有效记录：一条 V ≥ 48 L，一条 V ≤ 10 L，且 PV 偏差 < 3%。'
    },
    question: {
      q: '温度 T 与物质的量 n 不变时，气体体积从 50 L 减小到 25 L，压强会怎样变化？',
      opts: ['减小到原来的一半', '增大到原来的两倍', '保持不变', '先增大后减小'],
      a: 1,
      why: '理想气体满足 PV = nRT。T、n 不变时 PV 为常数，因此体积减半，压强加倍。实验记录中的 PV 乘积近似不变，正是这条定律的证据。'
    },
    dataset: {
      title: '理想化读数 · 固定 T 与 n',
      columns: ['体积 V', '压强 P', 'PV 乘积'],
      rows: [['50 L', '100 kPa', '5000 kPa·L'], ['25 L', '200 kPa', '5000 kPa·L'], ['10 L', '500 kPa', '5000 kPa·L']]
    },
    interpretation: {
      title: '史实解读 · 从定性争论到定量检验',
      paragraphs: [
        '波义耳的意义不只是发现一条公式。他坚持化学结论应接受实验检验，并用可重复的测量挑战亚里士多德的四元素教条。1661 年的《怀疑派化学家》把“元素”从形而上学的定义推进为等待实验厘清的操作性问题。',
        'PV = nRT 的现代写法综合了后来的气体研究。波义耳当年的规律成立有其条件：气体量不变、温度基本不变，且气体足够接近理想行为。',
        '科学模型的力量在于说清适用范围。它能预测未测过的状态，也会在真实气体偏离时暴露局限。'
      ],
      takeaway: '受控变量 + 精确记录 + 可检验预测，让“空气”成为可测量的研究对象。'
    },
    relatedUnit: 'a3'
  },
  {
    id: 'lavoisier',
    order: 2,
    numeral: 'Ⅱ',
    era: '1772—1789 · 巴黎',
    title: '拉瓦锡：天平上的化学革命',
    subtitle: '燃烧不是失去燃素，而是与氧气结合。',
    intro: '18 世纪，燃烧被主流理论解释为物质释放“燃素”。拉瓦锡用精密天平重新检验燃烧与金属煅烧，发现如果把参加反应的气体计入体系，总质量并没有减少。他把支持燃烧的气体命名为氧气，提出燃烧是物质与氧气的化合。',
    context: [
      '<b>时代难题</b>：金属煅烧后为什么变重？如果燃烧是释放看不见的物质，天平为什么会给出相反的结果？',
      '<b>你的身份</b>：拉瓦锡的测量助手。先用虚拟燃烧实验辨别氧气充足与不足时的产物，再分析密闭体系的质量账本。',
      '<b>历史边界</b>：氧气的发现涉及舍勒、普里斯特利等多人的独立工作；拉瓦锡的关键贡献在于用定量实验建立新的解释体系。'
    ],
    mission: {
      experiment: 'combustion',
      evidenceKind: 'complete-incomplete',
      title: '时代任务 · 找到氧气的证据',
      brief: '选择同一种燃料，分别在氧气浓度 19% 以上和 14%—18% 时点燃并记录数据。找出一条蓝色充分燃烧记录，以及一条橙色不完全燃烧记录。',
      recordHint: '先保持 21% 氧气记录蓝色火焰；再把氧气降到 15% 记录橙色火焰。两次请选择同一种燃料。',
      readyText: '同种燃料的两份记录显示：氧气充足时完全燃烧，氧气不足时出现 CO 与烟。',
      waitingText: '需要同种燃料的两条燃烧记录：O₂ ≥ 19% 的蓝色火焰，以及 O₂ 为 14%—18% 且产物含 CO 的橙色火焰。'
    },
    question: {
      q: '密闭容器与其中物质总质量为 100.00 g。反应后金属部分增加 1.60 g，气相部分减少 1.60 g。最合理的结论是？',
      opts: ['总质量减少了 1.60 g', '总质量增加了 1.60 g', '总质量守恒，气相物质进入了金属', '质量变化说明质量守恒不成立'],
      a: 2,
      why: '把容器内所有物质作为同一个体系，增加与减少恰好抵消。在开放体系中只称金属会看到增重，但若不计从空气中进入的氧，就会漏掉参加反应的物质。'
    },
    dataset: {
      title: '教学用质量账本 · 密闭体系',
      columns: ['称量对象', '反应前', '反应后', '变化'],
      rows: [['金属部分', '20.00 g', '21.60 g', '+1.60 g'], ['气相部分', '80.00 g', '78.40 g', '−1.60 g'], ['整个密闭体系', '100.00 g', '100.00 g', '0.00 g']]
    },
    interpretation: {
      title: '史实解读 · 把丢失的物质算进去',
      paragraphs: [
        '燃素说能解释火焰和可燃性，却难以一致地解释金属煅烧增重。拉瓦锡的关键转向是：不把物质当作可以凭空出现或消失的“原则”，而是追踪反应前后每一份质量。',
        '燃烧需要氧气，产物因燃料与燃烧程度而不同。氧气不足时可能产生一氧化碳与碳粒，因此蓝色火焰和橙色火焰提供了不同的实验证据。',
        '1789 年出版的《化学基础论》以新命名法和质量守恒推动化学重组。化学革命不是某一次“神奇实验”，而是测量、命名与理论长期互相校正的结果。'
      ],
      takeaway: '先界定体系，再核对每一种物质的去向；质量守恒是化学计量的基石。'
    },
    relatedUnit: 'a2'
  },
  {
    id: 'phlogiston',
    order: 3,
    numeral: 'Ⅲ',
    era: '1777—1789 · 化学革命',
    title: '燃素说：一种理论的最后裂缝',
    subtitle: '当预测与天平冲突，解释必须改变。',
    intro: '燃素说曾成功组织大量燃烧现象：可燃物含有燃素，燃烧就是燃素逸出；金属则被解释为燃素较少的“燃灰”。但“燃素逃离后物质应该变轻”的直觉，与金属煅烧后增重的精确测量冲突。补救性假设不断增加，理论的预测力却逐渐枯竭。',
    context: [
      '<b>时代难题</b>：一个能解释许多现象的理论，为什么仍可能被取代？关键不是它是否“听起来合理”，而是它能否给出一致、可检验的预测。',
      '<b>你的身份</b>：化学革命时期的证据审查员。比较氧气充足与严重不足时的燃烧记录，再用质量数据审查燃素说。',
      '<b>安全边界</b>：一氧化碳无色无味且剧毒。这里只讨论虚拟模型与历史证据，任何现实燃烧都必须保证通风，严禁自行模拟危险条件。'
    ],
    mission: {
      experiment: 'combustion',
      evidenceKind: 'oxygen-poor',
      title: '时代任务 · 检验燃素解释',
      brief: '选择同一种燃料，分别记录 O₂ ≥ 19% 的蓝色充分燃烧和 O₂ ≤ 13% 的红色严重缺氧状态。红色状态会产生大量 CO，记录将直接显示“助燃空气”并非可有可无。',
      recordHint: '先记录 21% 氧气的蓝色火焰，再降到 13% 记录红色火焰。红色产物中出现 CO，说明燃烧仍受氧气供应支配。',
      readyText: '两份同种燃料记录显示：氧气浓度改变会改变燃烧完全程度与产物，严重缺氧时出现大量 CO。',
      waitingText: '需要同种燃料的两条记录：O₂ ≥ 19% 的蓝色火焰，以及 O₂ ≤ 13% 且产物含 CO 的红色火焰。'
    },
    question: {
      q: '如果燃素说预测“金属燃烧时释放燃素，所以燃烧后一定变轻”，哪项证据最能直接冲击这个预测？',
      opts: ['火焰看起来更明亮', '密闭体系中金属增重，而体系总质量不变', '不同金属颜色不同', '燃素这个名字很抽象'],
      a: 1,
      why: '金属在开放空气中煅烧后增重，与“释放燃素导致变轻”的朴素预测冲突。把气体纳入密闭体系后总质量不变，说明增重来自空气中物质的加入，而不是物质凭空产生。'
    },
    dataset: {
      title: '证据对照 · 预测与观察',
      columns: ['来源', '判断', '是否可直接检验'],
      rows: [['燃素说', '释放燃素 → 金属应变轻', '可以，用天平称量'], ['精确观察', '金属煅烧后增重', '可以，重复测量'], ['氧化学说', '氧进入金属 → 增重，体系总质量不变', '可以，追踪氧与质量']]
    },
    interpretation: {
      title: '史实解读 · 理论因证据而改变',
      paragraphs: [
        '燃素说并不是毫无解释力：它能统一许多燃烧观察，也推动研究者细致记录现象。问题在于，面对金属增重等反例，它越来越依赖特殊假设，而不能像氧化学说那样给出一致预测。',
        '拉瓦锡的解释把燃烧、呼吸和部分煅烧统一为与氧有关的过程，并用质量守恒检查反应账目。新理论覆盖更多事实，也提出更清晰的检验方式。',
        '科学史不是“旧理论一无是处、新理论一战定乾坤”。真正重要的是：证据积累到一定程度后，研究共同体愿意放弃无法稳定预测的解释，采用更能接受反驳的模型。'
      ],
      takeaway: '一个理论的价值，不只在解释已知现象，更在坦率面对反例并接受定量检验。'
    },
    relatedUnit: 'b2'
  }
];

export function storyById(id) {
  return STORIES.find(story => story.id === id) || null;
}

export function isStoryUnlocked(story, progress = {}) {
  if (!story) return false;
  const index = STORIES.findIndex(item => item.id === story.id);
  if (index < 0) return false;
  if (index === 0) return true;
  return !!progress[STORIES[index - 1].id]?.completed;
}

function numberFrom(value) {
  const match = String(value ?? '').match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

export function storyEvidence(story, notes = []) {
  if (!story || !Array.isArray(notes)) return { ready: false, detail: '暂无任务证据。', rows: [], columns: [] };
  const records = notes.filter(note => note && note.exp === story.mission.experiment);
  if (story.mission.evidenceKind === 'boyle') {
    const valid = records.map(note => ({
      note,
      n: numberFrom(note.params?.n),
      t: numberFrom(note.params?.T),
      v: numberFrom(note.params?.V),
      p: numberFrom(note.results?.压强),
      pv: numberFrom(note.results?.['PV 乘积'])
    })).filter(r => r.n === 1 && r.t === 300 && Number.isFinite(r.v) && Number.isFinite(r.p) && Number.isFinite(r.pv));
    const large = valid.find(r => r.v >= 48);
    const small = valid.find(r => r.v <= 10);
    const deviation = large && small ? Math.abs(small.pv - large.pv) / large.pv * 100 : Infinity;
    const ready = !!large && !!small && deviation < 3;
    return {
      ready,
      detail: ready ? `PV 偏差为 ${deviation.toFixed(2)}%，满足任务要求。` : story.mission.waitingText,
      columns: ['体积 V', '压强 P', 'PV 乘积'],
      rows: [large, small].filter(Boolean).map(r => [r.v + ' L', r.p.toFixed(1) + ' kPa', r.pv.toFixed(0)])
    };
  }

  const valid = records.map(note => ({
    note,
    fuel: String(note.params?.燃料 || ''),
    oxygen: numberFrom(note.params?.氧气浓度),
    flame: String(note.results?.火焰状态 || ''),
    products: String(note.results?.主要产物 || '')
  }));
  const rich = valid.find(r => r.oxygen >= 19 && r.flame.includes('蓝色') && r.products.includes('CO₂') && r.products.includes('H₂O'));
  const poor = valid.find(r => story.mission.evidenceKind === 'oxygen-poor'
    ? r.oxygen <= 13 && r.flame.includes('红色') && r.products.includes('CO')
    : r.oxygen >= 14 && r.oxygen < 19 && r.flame.includes('橙色') && r.products.includes('CO'));
  const sameFuel = !!rich && !!poor && rich.fuel === poor.fuel;
  const ready = sameFuel;
  return {
    ready,
    detail: ready ? story.mission.readyText : story.mission.waitingText,
    columns: ['氧气浓度', '火焰状态', '主要产物'],
    rows: [rich, poor].filter(Boolean).map(r => [r.oxygen + ' %', r.flame, r.products])
  };
}
