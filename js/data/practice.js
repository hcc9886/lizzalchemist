// 练习系统（配置驱动）：辨识题（器材/试剂）、纠错题（红绿灯规则与安全规范）、定量题（模板生成）。
// 题目生成纯函数、可校验；viewPractice 消费。不提供任何危险操作内容，纠错题只考"错在哪+怎么做对"。
import { APPARATUS_DEFS } from './apparatus.js';
import { CHEMICALS } from './chemicals.js';

const rnd = a => a[Math.floor(Math.random() * a.length)];
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function mcq(q, correct, pool, why, kind) {
  const distractors = shuffle(pool.filter(x => x !== correct)).slice(0, 3);
  const opts = shuffle([correct, ...distractors]);
  return { kind, q, opts, answer: opts.indexOf(correct), why };
}

/* ————— 辨识：器材 ————— */
export function identifyApparatus() {
  const defs = APPARATUS_DEFS.filter(d => d.typical_uses && d.typical_uses.length);
  const d = rnd(defs);
  const use = rnd(d.typical_uses);
  return mcq(
    `实验室里哪种器材最适合用来「${use}」？`,
    d.name,
    APPARATUS_DEFS.map(x => x.name),
    `${d.name}（${d.en}）：${(d.typical_uses || []).join('；')}。${d.notes || ''}`,
    '识别'
  );
}

/* ————— 辨识：试剂 ————— */
export function identifyChem() {
  const chems = Object.values(CHEMICALS).filter(c => c.appearance && c.uses && c.uses.length);
  const c = rnd(chems);
  return mcq(
    `有一种试剂：${c.appearance}，${c.odor === '无气味' ? '无气味' : c.odor}。常用于「${c.uses[0]}」。它是谁？`,
    c.name,
    Object.values(CHEMICALS).map(x => x.name),
    `${c.name}（${c.formula}）：${c.uses.join('；')}。`,
    '识别'
  );
}

/* ————— 纠错：操作规范题库 ————— */
export const ERROR_BANK = [
  { q: '加热固体药品时，试管口朝上倾斜。错在哪？', opts: ['试管口应略向下倾斜，防止冷凝水倒流炸裂试管', '试管口应朝上，方便加药品', '应该先把试管口塞紧再加热', '没有错，这是标准操作'], answer: 0, why: '固体加热会产生冷凝水，口向下让水回流管口而非灼热管底。' },
  { q: '实验结束时先熄灭酒精灯，再撤出导管。错在哪？', opts: ['顺序反了：先撤导管再熄灯，否则水倒吸炸裂试管', '应该同时进行', '应该先吹灭酒精灯', '没有错'], answer: 0, why: '先熄灯管内压强变小，水槽的水倒吸入热试管会炸裂——铁律：先撤导管后熄灯。' },
  { q: '刚组装好装置就倒入药品开始加热。错在哪？', opts: ['应先检查装置气密性再装药品', '应该边加热边检查气密性', '应该先加热再装药品', '没有错'], answer: 0, why: '漏气的装置收集不到气体，装了药也白装；先手捂试管看导管口是否冒泡。' },
  { q: '用量筒作反应容器并直接加热。错在哪？', opts: ['量筒只能量取体积，不能加热、不能作反应容器', '量筒可以直接加热', '量筒加热前要先装满水', '没有错'], answer: 0, why: '量筒是量器，加热会刻度失准且易炸裂；反应加热用试管/烧杯。' },
  { q: '闻气体气味时把鼻孔凑近瓶口深吸。错在哪？', opts: ['应扇闻：用手轻扇使少量气体飘向鼻子', '凑近闻更快更准', '应该用嘴吸', '没有错'], answer: 0, why: '直接深吸可能吸入大量有害气体；扇闻是标准操作。' },
  { q: '用剩的药品倒回原试剂瓶。错在哪？', opts: ['剩余药品不能倒回原瓶，应放入指定容器', '倒回原瓶避免浪费', '只要没变色就能倒回', '没有错'], answer: 0, why: '倒回会污染整瓶试剂；用剩药品放入教师指定回收容器。' },
  { q: '稀释浓硫酸时把水倒进浓硫酸里。错在哪？', opts: ['应"酸入水"：把浓硫酸沿器壁缓缓加入水中并搅拌', '应该水入酸，更快', '顺序无所谓', '没有错'], answer: 0, why: '浓硫酸稀释大量放热；酸入水热量及时散开，水入酸会局部沸腾飞溅。' },
  { q: '点燃酒精灯时拿它凑到另一个燃着的酒精灯上点火。错在哪？', opts: ['禁止对火点燃，应用火柴/打火枪点燃', '对火点燃更省火柴', '随便怎么点', '没有错'], answer: 0, why: '对火点燃容易让酒精洒出引发火灾。' },
  { q: '熄灭酒精灯时用嘴吹灭。错在哪？', opts: ['应用灯帽盖灭（盖两次放气），严禁吹灭', '吹灭最快', '用水浇灭', '没有错'], answer: 0, why: '吹灭可能把火焰压入灯内引燃酒精蒸气。' },
  { q: '验满氧气时把带火星的木条深深伸入集气瓶底部。错在哪？', opts: ['验满应在瓶口进行，木条放瓶口', '必须伸到底部才准', '应该熄灭木条再伸入', '没有错'], answer: 0, why: '瓶口复燃才能说明"已集满"；伸入深处不能证明满。' },
  { q: '往试管里装高锰酸钾后忘记放棉花团就加热收集。错在哪？', opts: ['管口应放棉花，防止粉末随气流进入导管', '棉花可有可无', '应该塞紧橡胶塞不放棉花', '没有错'], answer: 0, why: '粉末会堵塞导管、把水槽的水染紫；棉花挡粉。' },
  { q: '给试管里的液体加热时，试管口对着自己或同学。错在哪？', opts: ['试管口不能对人，应朝无人方向', '对着自己方便观察', '应该对着同学，互相提醒', '没有错'], answer: 0, why: '液体暴沸喷出会伤人；管口朝无人方向且与桌面约 45°。' },
  { q: '读量筒读数时俯视凹液面。错在哪？', opts: ['视线应与凹液面最低处相平', '俯视读数更准', '仰视和俯视都一样', '没有错'], answer: 0, why: '俯视读数偏大、仰视偏小；相平才是规范。' },
  { q: '做铁丝在氧气中燃烧实验时，集气瓶底没有放少量水或细沙。错在哪？', opts: ['瓶底应预留水或细沙，防止高温熔融物炸裂瓶底', '不需要放', '应该装满水', '没有错'], answer: 0, why: '熔融物溅落会使集气瓶炸裂；瓶底放少量水/细沙缓冲。' }
];
export function errorQuiz() {
  const it = rnd(ERROR_BANK);
  return { kind: '纠错', q: it.q, opts: it.opts, answer: it.answer, why: it.why };
}

/* ————— 定量：模板生成 ————— */
function numOpts(correct, unit, spread) {
  const pool = [0, 1, 2, 3].map(i => {
    const d = (i - 1.5) * spread + (Math.random() - 0.5) * spread * 0.4;
    return (correct + d).toFixed(2).replace(/\.?0+$/, '') + unit;
  });
  const ans = correct.toFixed(2).replace(/\.?0+$/, '') + unit;
  const opts = shuffle([...new Set([ans, ...pool])]).slice(0, 4);
  if (!opts.includes(ans)) opts[0] = ans;
  return { opts, answer: opts.indexOf(ans) };
}
export function quantQuiz() {
  const t = Math.floor(Math.random() * 3);
  if (t === 0) {
    const V = 20 + Math.floor(Math.random() * 30); // mL
    const m = Math.round(V * (0.8 + Math.random() * 1.4) * 10) / 10; // g
    const rho = m / V;
    const { opts, answer } = numOpts(rho, ' g/cm³', 0.4);
    return { kind: '定量', q: `一块固体质量 ${m} g，放入量筒排开水的体积为 ${V} mL。它的密度是多少？`, opts, answer, why: `ρ = m / V = ${m} g ÷ ${V} mL ≈ ${rho.toFixed(2)} g/cm³。` };
  }
  if (t === 1) {
    const a = 5 + Math.floor(Math.random() * 15); // solute g
    const w = 45 + Math.floor(Math.random() * 60); // water g
    const pct = a / (a + w) * 100;
    const { opts, answer } = numOpts(pct, ' %', 5);
    return { kind: '定量', q: `把 ${a} g 氯化钠完全溶解在 ${w} g 水中。所得溶液的溶质质量分数是多少？`, opts, answer, why: `质量分数 = 溶质 ÷ 溶液 = ${a} ÷ (${a} + ${w}) × 100% ≈ ${pct.toFixed(1)}%。` };
  }
  const trueV = 20 + Math.floor(Math.random() * 10) * 5; // 20..70
  const err = +(Math.random() * 0.9 + 0.1).toFixed(2) * (Math.random() < 0.5 ? -1 : 1);
  const meas = +(trueV + err).toFixed(2);
  const rel = Math.abs(err) / trueV * 100;
  const { opts, answer } = numOpts(rel, ' %', 3);
  return { kind: '定量', q: `量取水时真实体积 ${trueV}.00 mL，读数为 ${meas} mL。相对误差是多少？`, opts, answer, why: `相对误差 = |测量值 − 真实值| ÷ 真实值 × 100% = ${Math.abs(err).toFixed(2)} ÷ ${trueV} × 100% ≈ ${rel.toFixed(1)}%。` };
}

/* ————— 组卷：默认混合 5 题（2 辨识 + 2 纠错 + 1 定量） ————— */
export function makeQuiz5(mode = 'mix') {
  if (mode === '识别') return [identifyApparatus(), identifyChem(), identifyApparatus(), identifyChem(), identifyApparatus()];
  if (mode === '纠错') return Array.from({ length: 5 }, errorQuiz);
  if (mode === '定量') return Array.from({ length: 5 }, quantQuiz);
  return [identifyApparatus(), errorQuiz(), quantQuiz(), identifyChem(), errorQuiz()];
}
