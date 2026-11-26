// 实验10：交互式元素周期表 + 速找元素小游戏
import { createKit, hotspot } from '../expkit.js';

// cat: alkali 碱金属 / alkaline 碱土 / transition 过渡 / post 后过渡金属 / metalloid 类金属 / nonmetal 非金属 / halogen 卤素 / noble 稀有气体
const ELS = [
  { s: 'H', n: '氢', z: 1, m: 1.008, cat: 'nonmetal', p: 1, g: 1, e: '1', note: '宇宙中最多的元素；恒星聚变的燃料。' },
  { s: 'He', n: '氦', z: 2, m: 4.003, cat: 'noble', p: 1, g: 18, e: '2', note: '最难液化的气体，低温超导磁体的冷却剂。' },
  { s: 'Li', n: '锂', z: 3, m: 6.94, cat: 'alkali', p: 2, g: 1, e: '2,1', note: '最轻的金属，锂电池的心脏。' },
  { s: 'Be', n: '铍', z: 4, m: 9.012, cat: 'alkaline', p: 2, g: 2, e: '2,2', note: '轻而坚硬，航天与X射线窗口材料（有毒）。' },
  { s: 'B', n: '硼', z: 5, m: 10.81, cat: 'metalloid', p: 2, g: 13, e: '2,3', note: '硼酸温和抗菌；硼砂曾用于炼金与焊接。' },
  { s: 'C', n: '碳', z: 6, m: 12.01, cat: 'nonmetal', p: 2, g: 14, e: '2,4', note: '生命骨架；金刚石与石墨是同素异形体。' },
  { s: 'N', n: '氮', z: 7, m: 14.01, cat: 'nonmetal', p: 2, g: 15, e: '2,5', note: '大气 78%；固氮合成氨养活了世界一半人口。' },
  { s: 'O', n: '氧', z: 8, m: 16.00, cat: 'nonmetal', p: 2, g: 16, e: '2,6', note: '地壳含量第一；普利斯特里与舍勒各自发现。' },
  { s: 'F', n: '氟', z: 9, m: 19.00, cat: 'halogen', p: 2, g: 17, e: '2,7', note: '电负性之王；牙膏里的氟离子防龋齿。' },
  { s: 'Ne', n: '氖', z: 10, m: 20.18, cat: 'noble', p: 2, g: 18, e: '2,8', note: '霓虹灯的红橙色光芒就是它。' },
  { s: 'Na', n: '钠', z: 11, m: 22.99, cat: 'alkali', p: 3, g: 1, e: '2,8,1', note: '食盐的一半；遇水剧烈反应。' },
  { s: 'Mg', n: '镁', z: 12, m: 24.31, cat: 'alkaline', p: 3, g: 2, e: '2,8,2', note: '燃烧发出耀眼白光，早期摄影闪光灯。' },
  { s: 'Al', n: '铝', z: 13, m: 26.98, cat: 'post', p: 3, g: 13, e: '2,8,3', note: '地壳最多的金属；曾经比黄金还贵。' },
  { s: 'Si', n: '硅', z: 14, m: 28.09, cat: 'metalloid', p: 3, g: 14, e: '2,8,4', note: '芯片与玻璃；硅谷因它得名。' },
  { s: 'P', n: '磷', z: 15, m: 30.97, cat: 'nonmetal', p: 3, g: 15, e: '2,8,5', note: '白磷见空气自燃；DNA 与 ATP 的必需元素。' },
  { s: 'S', n: '硫', z: 16, m: 32.06, cat: 'nonmetal', p: 3, g: 16, e: '2,8,6', note: '炼金术三要素之一；火山口与臭鸡蛋气味。' },
  { s: 'Cl', n: '氯', z: 17, m: 35.45, cat: 'halogen', p: 3, g: 17, e: '2,8,7', note: '黄绿色有毒气体；饮用水消毒功过并存。' },
  { s: 'Ar', n: '氩', z: 18, m: 39.95, cat: 'noble', p: 3, g: 18, e: '2,8,8', note: '空气中第 3 多；焊接保护气。' },
  { s: 'K', n: '钾', z: 19, m: 39.10, cat: 'alkali', p: 4, g: 1, e: '2,8,8,1', note: '神经信号靠钾钠离子泵传递。' },
  { s: 'Ca', n: '钙', z: 20, m: 40.08, cat: 'alkaline', p: 4, g: 2, e: '2,8,8,2', note: '骨骼与贝壳；石灰石的主要成分。' },
  { s: 'Fe', n: '铁', z: 26, m: 55.85, cat: 'transition', p: 4, g: 8, e: '2,8,14,2', note: '地核与人血红蛋白的核心；文明史以它命名。' },
  { s: 'Cu', n: '铜', z: 29, m: 63.55, cat: 'transition', p: 4, g: 11, e: '2,8,18,1', note: '人类最早冶炼的金属之一；导电仅次于银。' },
  { s: 'Zn', n: '锌', z: 30, m: 65.38, cat: 'transition', p: 4, g: 12, e: '2,8,18,2', note: '镀锌防锈；干电池的负极外壳。' },
  { s: 'Ag', n: '银', z: 47, m: 107.9, cat: 'transition', p: 5, g: 11, e: '2,8,18,18,1', note: '导电与导热双料冠军；古代货币与炼金"银月"。' },
  { s: 'I', n: '碘', z: 53, m: 126.9, cat: 'halogen', p: 5, g: 17, e: '2,8,18,18,7', note: '遇淀粉变蓝；加碘盐防甲状腺肿。' },
  { s: 'Au', n: '金', z: 79, m: 197.0, cat: 'transition', p: 6, g: 11, e: '2,8,18,32,18,1', note: '炼金术的终极目标；化学惰性极佳。' },
  { s: 'Hg', n: '汞', z: 80, m: 200.6, cat: 'transition', p: 6, g: 12, e: '2,8,18,32,18,2', note: '唯一常温液态金属；炼丹术士的最爱与毒药。' },
  { s: 'Pb', n: '铅', z: 82, m: 207.2, cat: 'post', p: 6, g: 14, e: '2,8,18,32,18,4', note: '罗马水管（plumbing 词源）；毒性让它在现代被淘汰。' }
];

const CATS = {
  alkali: { name: '碱金属', c: '#c65a41' },
  alkaline: { name: '碱土金属', c: '#e0a33a' },
  transition: { name: '过渡金属', c: '#7fc9c0' },
  post: { name: '后过渡金属', c: '#8f9ab8' },
  metalloid: { name: '类金属', c: '#8fc97f' },
  nonmetal: { name: '非金属', c: '#5f93c9' },
  halogen: { name: '卤素', c: '#9a6fd0' },
  noble: { name: '稀有气体', c: '#c9a0c9' }
};

let raf = null, state = null;

export default {
  id: 'ptable', title: '交互式元素周期表', oneLine: '点击元素看详情，玩"速找元素"——在 60 秒内凭位置和名称找出 5 个元素。',
  tags: ['中学', '周期律', '游戏'],
  safety: ['虚拟实验无危险。部分元素（铍、白磷、汞等）现实中剧毒，切勿模仿化学史上的"亲自尝"。'],
  render(root, ctx) {
    state = { sel: null, game: null, hover: null };

    const kit = createKit(root, {
      narr: '点击任意方块看元素详情。颜色 = 分类（碱金属/卤素/……），<b>列 = 族（最外层电子数决定化学性质），行 = 周期（电子层数）</b>。',
      chal: '在速找元素小游戏中 5 轮全对。',
      ach: 'ptable_hunter',
      goals: [
        { id: 'g1', text: '查看任意 3 个元素的详情' },
        { id: 'g2', text: '速找元素答对 3 题' },
        { id: 'g3', text: '速找元素 5/5 全对' }
      ],
      steps: [
        { t: '周期律', d: '同族元素最外层电子数相同 → 化学性质相似（如 Li/Na/K 都疯狂遇水）。门捷列夫据此预言了尚未发现的元素。' },
        { t: '金属 vs 非金属', d: '左下 metallic（易失电子），右上 nonmetal（易得电子），中间类金属是半导体——芯片只能长在"边界地带"。' },
        { t: '为什么 119 之后还没有"大表"', d: '超重元素半衰期毫秒级，合成靠粒子对撞——周期表边缘仍是人类的科研前线。' },
        { t: '炼金术的回响', d: 'Hg、S、Au——炼金三要素全部在表上。化学从"变贱金属为金"的梦想，长成了理解万物的框架。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout" style="grid-template-columns:220px 1fr">
        <aside class="exp-controls">
          <div class="ctl"><button class="btn primary" id="p-game" style="width:100%">开始速找元素</button></div>
          <div class="panel" id="p-quest" style="display:none"><b id="p-qtext">—</b><p class="muted" style="font-size:12px">点击周期表中对应的方块</p>
            <div><span class="badge gold" id="p-score">0/5</span> <span class="badge" id="p-time">—</span></div></div>
          <div id="p-detail" style="margin-top:14px"></div>
        </aside>
        <section class="exp-stage"><canvas id="p-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts" id="p-legend">
        ${Object.entries(CATS).map(([k, v]) => `<div class="chip"><i style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${v.c};margin-right:5px"></i>${v.name}</div>`).join('')}
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('p-canvas');
    const g2d = canvas.getContext('2d');

    const CELL = 33, GX = 8, GY = 30;
    const elAt = (col, row) => ELS.find(e => e.g === col && e.p === row);
    const cellXY = e => [GX + (e.g - 1) * CELL, GY + (e.p - 1) * CELL];

    function showDetail(e) {
      const c = CATS[e.cat];
      $('p-detail').innerHTML = `
        <div class="panel" style="border-color:${c.c}">
          <h3 style="color:${c.c}">${e.n} · ${e.s}</h3>
          <p style="font-size:13px">原子序数 <b>${e.z}</b> · 相对原子质量 <b>${e.m}</b></p>
          <p style="font-size:13px">${c.name} · 第 ${e.p} 周期 第 ${e.g} 族</p>
          <p style="font-size:13px">电子排布：${e.e}</p>
          <p style="font-size:13px">${e.note}</p>
        </div>`;
      if (state.game && state.game.target && e.z === state.game.target.z) {
        state.game.right++;
        kit.say('答对了！' + e.n + '（' + e.s + '）在第 ' + e.p + ' 周期第 ' + e.g + ' 族。');
        nextRound();
      } else if (state.game && state.game.target) {
        state.game.wrong++;
        kit.say('不对哦——那是' + e.n + '。提示：' + state.game.target.hint);
      }
      state.seen = (state.seen || 0) + 1;
      if (state.seen >= 3) kit.goal('g1', true);
    }

    function nextRound() {
      const g = state.game;
      if (!g) return;
      if (g.right >= 5) {
        kit.goal('g2', true);
        if (g.wrong === 0) { kit.goal('g3', true); }
        kit.say(g.wrong === 0 ? '<b>5/5 全对！</b>你已经能"按位置"思考元素了——门捷列夫同款直觉。' : '5 题完成，错 ' + g.wrong + ' 次。再来一局挑战全对！');
        g.done = true;
        $('p-quest').style.display = 'none';
        $('p-game').textContent = '再来一局';
        return;
      }
      const pool = ELS.filter(e => !g.used.has(e.z));
      const t = pool[Math.floor(Math.random() * pool.length)];
      g.used.add(t.z);
      g.target = t;
      g.t0 = performance.now();
      $('p-qtext').textContent = '找出：' + t.n + '（' + t.s + '）';
      $('p-score').textContent = g.right + '/5';
      t.hint = '它在第 ' + t.p + ' 周期、第 ' + t.g + ' 列，是' + CATS[t.cat].name + '。';
    }

    $('p-game').addEventListener('click', () => {
      state.game = { right: 0, wrong: 0, used: new Set(), target: null };
      $('p-quest').style.display = '';
      $('p-game').textContent = '进行中…';
      kit.say('听题！凭<b>族与周期</b>找到目标元素——颜色分类会帮你缩小范围。');
      nextRound();
    });

    canvas.addEventListener('click', ev => {
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width * canvas.width;
      const y = (ev.clientY - r.top) / r.height * canvas.height;
      const col = Math.floor((x - GX) / CELL) + 1, row = Math.floor((y - GY) / CELL) + 1;
      const e = (col >= 1 && col <= 18 && row >= 1 && row <= 7) ? elAt(col, row) : null;
      if (e) showDetail(e);
    });

    canvas.addEventListener('mousemove', ev => {
      const r = canvas.getBoundingClientRect();
      const x = (ev.clientX - r.left) / r.width * canvas.width;
      const y = (ev.clientY - r.top) / r.height * canvas.height;
      const col = Math.floor((x - GX) / CELL) + 1, row = Math.floor((y - GY) / CELL) + 1;
      state.hover = (col >= 1 && col <= 18 && row >= 1 && row <= 7) ? elAt(col, row) : null;
    });

    function draw() {
      const w = 640, h = 420;
      const t = performance.now();
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
      g2d.fillText('族 →（最外层电子决定性格）', GX, 16);
      g2d.save();
      g2d.translate(4, GY + 80); g2d.rotate(-Math.PI / 2);
      g2d.fillText('周期 ↓（电子层数）', 0, 0);
      g2d.restore();
      ELS.forEach(e => {
        const [x, y] = cellXY(e);
        const c = CATS[e.cat].c;
        const isTarget = state.game && state.game.target === e;
        const isHover = state.hover && state.hover.z === e.z;
        g2d.fillStyle = c + (isTarget ? 'ff' : isHover ? 'cc' : '88');
        g2d.fillRect(x, y, CELL - 2, CELL - 2);
        if (isTarget) {
          g2d.strokeStyle = '#f0c96a'; g2d.lineWidth = 2;
          g2d.strokeRect(x - 2, y - 2, CELL + 2, CELL + 2);
          g2d.lineWidth = 1;
        }
        g2d.fillStyle = '#0d0b16'; g2d.font = '8px sans-serif';
        g2d.fillText(e.z, x + 3, y + 9);
        g2d.font = 'bold 13px sans-serif';
        g2d.fillStyle = '#10101c';
        g2d.fillText(e.s, x + 7, y + CELL - 8);
      });
      // period numbers
      for (let p = 1; p <= 7; p++) {
        g2d.fillStyle = '#5c5578'; g2d.font = '10px sans-serif';
        g2d.fillText(p, GX - 10, GY + (p - 1) * CELL + 20);
      }
      for (let gp = 1; gp <= 18; gp++) {
        g2d.fillStyle = '#3a3358'; g2d.font = '8px sans-serif';
        if (gp % 2 === 0) g2d.fillText(gp, GX + (gp - 1) * CELL + 8, GY - 4);
      }
      raf = requestAnimationFrame(draw);
    }
    draw();

    // timer display
    const timer = setInterval(() => {
      if (state.game && state.game.target && !state.game.done) {
        $('p-time').textContent = Math.max(0, Math.round((60 - (performance.now() - state.game.t0) / 1000))) + 's';
      }
    }, 500);
    this._timer2 = timer;
  },
  destroy() { if (raf) cancelAnimationFrame(raf); if (this._timer2) clearInterval(this._timer2); raf = null; }
};
