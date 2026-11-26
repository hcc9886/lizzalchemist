// 实验6：反应速率与催化（v2：烧杯拖拽调温 + 实验套件）
import { createKit, drag, hotspot } from '../expkit.js';

let raf = null, state = null;

export default {
  id: 'rate', title: '反应速率与催化剂', oneLine: 'A + B → AB。直接在烧杯上拖动调温、调浓度、加粉末与催化剂，看紫色产物生成速度。',
  tags: ['中学', '动力学', '碰撞理论'],
  safety: ['虚拟实验无危险。现实中升温与加浓会放大放热风险，操作前必须查物质相容性。'],
  render(root, ctx) {
    state = { T: 298, cA: 1.0, cB: 1.0, surface: '块状', cat: false, running: false, t: 0, c: 0, kBefore: null, seenT: 0, seenPow: false };

    const kit = createKit(root, {
      narr: '直接在左侧<b>烧杯上下拖动</b>调温。紫点=产物 AB，涨得越快反应越猛——速率就是曲线的斜率。',
      chal: '同一温度下完成"无催化 → 有催化"对比，并记录 k 放大了多少倍。',
      ach: 'rate_catalyst',
      goals: [
        { id: 'g1', text: '改变温度，对比两次反应速度' },
        { id: 'g2', text: '把固体调成"粉末"，观察接触面积的影响' },
        { id: 'g3', text: '勾选催化剂，对比前后的 k 与曲线斜率' }
      ],
      steps: [
        { t: '碰撞理论', d: '反应发生的前提：分子碰撞且能量 ≥ Ea、取向正确。温度↑ → 快分子占比↑ → 有效碰撞↑。' },
        { t: 'Arrhenius', d: 'k = A·e^(−Ea/RT)。温度每升 10℃，速率约翻倍。注意：本实验的 Ea 做了示意压缩，方便实时观察。' },
        { t: '接触面积', d: '粉末的表面积是块状的许多倍——反应只发生在表面，所以面粉厂严禁明火。' },
        { t: '催化剂', d: '催化剂提供低 Ea 的新路径，本身不被消耗。它不改变平衡，只改变到达平衡的速度。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>温度 T <span class="val" id="r-tv">298 K（25 ℃）</span></label>
            <input type="range" id="r-t" min="273" max="373" step="1" value="298"></div>
          <div class="ctl"><label>A 浓度 <span class="val" id="r-av">1.0 mol/L</span></label>
            <input type="range" id="r-ca" min="0.2" max="2" step="0.1" value="1"></div>
          <div class="ctl"><label>B 浓度 <span class="val" id="r-bv">1.0 mol/L</span></label>
            <input type="range" id="r-cb" min="0.2" max="2" step="0.1" value="1"></div>
          <div class="ctl"><label>固体 B 的形态</label>
            <select id="r-surf"><option value="块状">块状（接触面积小）</option><option value="粉末">粉末（接触面积大 ×3）</option></select></div>
          <div class="ctl"><label><input type="checkbox" id="r-cat"> 加入催化剂（Ea: 60→56 kJ/mol，示意压缩）</label></div>
          <div class="ctl"><button class="btn primary" id="r-run" style="width:100%">开始反应 / 暂停</button>
            <button class="btn ghost" id="r-reset" style="width:100%;margin-top:8px">重置反应</button></div>
          <div class="ctl"><button class="btn small" id="r-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="r-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">速率常数 k <b id="ro-k">—</b></div>
        <div class="chip">当前速率 v <b id="ro-v">—</b></div>
        <div class="chip">产物 [AB] <b id="ro-c">0.00 mol/L</b></div>
        <div class="chip">反应时间 <b id="ro-t">0.0 s</b></div>
        <div class="chip">完成度 <b id="ro-p">0%</b></div>
        <div class="chip">催化增益 <b id="ro-gain">—</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('r-canvas');
    const g2d = canvas.getContext('2d');

    // kinetic model: rate = k·[A]^1·[B]^1, k = A0 · e^(-Ea/RT) · surfaceFactor
    // 示意压缩参数：真实催化剂常降 Ea 20~50 kJ（10^3~10^8 倍），实时演示中会快到无法观察，
    // 故这里用 60→56 kJ/mol（约×5）让两种工况都可观察；温度效应保持真实 Arrhenius。
    const kOf = () => {
      const Ea = (state.cat ? 56 : 60) * 1000;
      const A0 = 6.6e8;
      const surf = state.surface === '粉末' ? 3 : 1;
      return A0 * Math.exp(-Ea / (8.314 * state.T)) * surf;
    };

    const BEAKER = { x: 50, y: 60, w: 180, h: 280 };

    const spots = [
      { x: 140, y: 200, r: 14, title: '为什么加热变快', body: '分子动能呈麦克斯韦-玻尔兹曼分布。升温后，动能 ≥ Ea 的分子<b>占比指数级上升</b>——这就是"升 10℃ 翻倍"的本质，而不只是"分子跑得快"。' },
      { x: 445, y: 150, r: 14, title: '活化能与"山口"', body: '反应物要先爬上能量最高点（过渡态）才能变成产物。催化剂另开了一条<b>低矮的山口</b>——更多分子能翻过去。' },
      { x: 445, y: 360, r: 14, title: '速率 = 斜率', body: '曲线越陡，单位时间生成的 [AB] 越多。反应中期变缓是因为反应物在消耗——浓度项 [A][B] 在变小。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    drag(canvas, {
      hit(x, y) {
        return (x > BEAKER.x - 8 && x < BEAKER.x + BEAKER.w + 8 && y > BEAKER.y && y < BEAKER.y + BEAKER.h) ? 'beaker' : null;
      },
      start() { kit.say('上下拖动 = 调温。往上拖更热，往下拖更冷。'); },
      move(x, y) {
        const T = Math.max(273, Math.min(373, Math.round(373 - (y - BEAKER.y) / BEAKER.h * 100)));
        if (T === state.T) return;
        state.T = T;
        $('r-t').value = T;
        $('r-tv').textContent = T + ' K（' + (T - 273) + ' ℃）';
        state.seenT++;
        if (state.seenT >= 4) kit.goal('g1', true);
      },
      end() { /* 温度保持 */ }
    });

    function updateRO() {
      const k = kOf();
      const v = k * state.cA * state.cB;
      $('ro-k').textContent = k.toFixed(4) + ' L/(mol·s)';
      $('ro-v').textContent = v.toFixed(4) + ' mol/(L·s)';
      $('ro-c').textContent = state.c.toFixed(3) + ' mol/L';
      $('ro-t').textContent = state.t.toFixed(1) + ' s';
      $('ro-p').textContent = Math.round(state.c / Math.min(state.cA, state.cB) * 100) + '%';
      $('ro-gain').textContent = state.kBefore ? '×' + (k / state.kBefore).toFixed(2) : '—';
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now() / 10;
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      // beaker with particles
      const bx = BEAKER.x, by = BEAKER.y, bw = BEAKER.w, bh = BEAKER.h;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(bx, by, bw, bh);
      g2d.fillStyle = 'rgba(95,147,201,.12)'; g2d.fillRect(bx + 2, by + 2, bw - 4, bh - 4);
      const N = 40;
      const nP = Math.round(N * state.c / Math.max(0.01, Math.min(state.cA, state.cB)));
      for (let i = 0; i < N; i++) {
        const px = bx + 10 + ((i * 47 + t * (1 + i % 3)) % (bw - 20));
        const py = by + 10 + ((i * 31 + t * (0.6 + i % 5)) % (bh - 20));
        const isProd = i < nP;
        g2d.fillStyle = isProd ? '#9a6fd0' : i % 2 ? '#5f93c9' : '#c65a41';
        g2d.beginPath(); g2d.arc(px, py, isProd ? 5 : 4, 0, 7); g2d.fill();
      }
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('● A（蓝） ● B（红） → ● AB（紫）', bx + 10, by + bh + 16);
      g2d.fillText('温度 ' + state.T + ' K（可在烧杯上拖动）', bx + 10, by + bh + 32);
      // energy profile diagram
      const ex = 290, ey = 90, ew = 310, eh = 220;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(ex, ey, ew, eh);
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('能量剖面：催化剂降低"山口"高度', ex + 8, ey - 8);
      const Ea1 = 60, Ea2 = 56; // 与 kOf() 一致；纵轴放大 4 倍便于观察差异
      const base = ey + eh - 30;
      const H1 = (Ea1 - 40) * 4, H2 = (Ea2 - 40) * 4;
      const mx = ex + ew / 2;
      const drawProfile = (H, color) => {
        g2d.strokeStyle = color; g2d.lineWidth = 2;
        g2d.beginPath();
        g2d.moveTo(ex + 10, base);
        g2d.quadraticCurveTo(mx - 60, base, mx - 10, base - H);
        g2d.quadraticCurveTo(mx, base - H - 8, mx + 10, base - H);
        g2d.quadraticCurveTo(mx + 60, base, ex + ew - 10, base);
        g2d.stroke();
        g2d.lineWidth = 1;
        g2d.strokeStyle = color; g2d.setLineDash([3, 3]);
        g2d.beginPath(); g2d.moveTo(mx - 10, base - H); g2d.lineTo(mx - 10, base); g2d.stroke();
        g2d.setLineDash([]);
      };
      drawProfile(H1, '#c65a4188');
      if (state.cat) drawProfile(H2, '#8fe0c6');
      g2d.fillStyle = '#c65a41';
      g2d.fillText('无催化 Ea=60（纵轴放大）', mx + 20, base - H1 - 4);
      if (state.cat) {
        g2d.fillStyle = '#8fe0c6';
        g2d.fillText('催化 Ea=56（示意压缩）', mx - 150, base - H2 - 4);
      }
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('反应物', ex + 14, base + 16);
      g2d.fillText('生成物', ex + ew - 56, base + 16);
      // concentration vs time graph
      const gx = 290, gy = 330, gw = 310, gh = 60;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(gx, gy, gw, gh);
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('[AB] 随时间变化', gx + 8, gy - 6);
      const cMax = Math.min(state.cA, state.cB);
      if (state.t > 0) {
        g2d.strokeStyle = '#9a6fd0'; g2d.lineWidth = 2; g2d.beginPath();
        const k = kOf();
        for (let tt = 0; tt <= state.t; tt += 0.5) {
          const x = cMax * (1 - 1 / (1 + k * cMax * tt * 0.5));
          const X = gx + tt / 120 * gw, Y = gy + gh - x / cMax * gh;
          tt === 0 ? g2d.moveTo(X, Y) : g2d.lineTo(X, Y);
        }
        g2d.stroke(); g2d.lineWidth = 1;
      }
      drawSpots(g2d, t * 10);
      updateRO();
    }

    function loop() {
      if (state.running) {
        const dt = 0.1;
        const v = kOf() * state.cA * state.cB;
        const lim = Math.min(state.cA, state.cB);
        const frac = state.c / lim;
        const effV = v * (1 - frac) * (1 - frac);
        state.c = Math.min(lim, state.c + effV * dt);
        state.t += dt;
        if (state.c >= lim - 1e-6) state.running = false;
      }
      draw();
      raf = requestAnimationFrame(loop);
    }

    $('r-t').addEventListener('input', e => {
      state.T = +e.target.value;
      $('r-tv').textContent = state.T + ' K（' + (state.T - 273) + ' ℃）';
      state.seenT++;
      if (state.seenT >= 4) kit.goal('g1', true);
    });
    $('r-ca').addEventListener('input', e => { state.cA = +e.target.value; $('r-av').textContent = state.cA.toFixed(1) + ' mol/L'; });
    $('r-cb').addEventListener('input', e => { state.cB = +e.target.value; $('r-bv').textContent = state.cB.toFixed(1) + ' mol/L'; });
    $('r-surf').addEventListener('change', e => {
      state.surface = e.target.value;
      if (state.surface === '粉末' && !state.seenPow) {
        state.seenPow = true;
        kit.goal('g2', true);
        kit.say('粉末 ×3 表面积——k 直接放大 3 倍。面粉厂、煤矿粉尘爆炸都是这个原理。');
      }
    });
    $('r-cat').addEventListener('change', e => {
      state.cat = e.target.checked;
      if (state.cat) {
        if (!state.kBefore) state.kBefore = kOf();
        kit.goal('g3', true);
        kit.say('催化剂加入：Ea 60→56 kJ/mol（示意），k ≈ ×5。真实催化常快 10³~10⁸ 倍。');
      }
    });
    $('r-run').addEventListener('click', () => {
      if (state.c >= Math.min(state.cA, state.cB) - 1e-6) { state.t = 0; state.c = 0; }
      state.running = !state.running;
    });
    $('r-reset').addEventListener('click', () => { state.running = false; state.t = 0; state.c = 0; });
    $('r-record').addEventListener('click', () => {
      const k = kOf();
      if (state.cat && state.kBefore) kit.goal('g3', true);
      ctx.record(
        { 温度: state.T + ' K', 'A浓度': state.cA.toFixed(1) + ' mol/L', 'B浓度': state.cB.toFixed(1) + ' mol/L', 形态: state.surface, 催化剂: state.cat ? '有' : '无' },
        { 速率常数k: k.toFixed(4) + ' L/(mol·s)', 初始速率: (k * state.cA * state.cB).toFixed(4) + ' mol/(L·s)', 产物: state.c.toFixed(3) + ' mol/L', 用时: state.t.toFixed(1) + ' s' }
      );
    });

    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
