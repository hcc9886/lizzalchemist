// 实验5：气体定律（v2：活塞拖拽 + 实验套件）
import { createKit, drag, hotspot } from '../expkit.js';

const R = 8.314;
let raf = null, state = null;

export default {
  id: 'gaslaws', title: '气体定律（理想气体）', oneLine: '直接拖动活塞压缩气体、加热气体，用 PV = nRT 验证波义耳、查理与盖-吕萨克定律。',
  tags: ['零基础', '气体', '定律'],
  safety: ['虚拟实验无危险。现实中密闭气体加热过度会爆裂容器——这就是为什么喷雾罐严禁火烧。'],
  render(root, ctx) {
    state = { n: 1.0, T: 300, v: 24.5, pvRef: null, boyleDone: false };

    const kit = createKit(root, {
      narr: '<b>抓住灰色活塞上下拖动</b>：分子被挤进更小的空间，撞墙次数变多，压强上升。这就是压强的本质。',
      chal: '保持 T、n 不变，把体积从接近 50 L 压缩到 10 L 以下，验证 PV 乘积几乎不变（偏差 < 3%）。',
      ach: 'gas_boyle',
      goals: [
        { id: 'g1', text: '拖动（或按钮）改变体积，观察压强变化' },
        { id: 'g2', text: '升温/降温观察压强变化（定容）' },
        { id: 'g3', text: '完成玻意耳验证：大体积与小体积下 PV 偏差 < 3%' }
      ],
      steps: [
        { t: '认识模型', d: '容器里的蓝点是分子，速度 ∝ √T。压强 = 分子撞击器壁的总效果。' },
        { t: '玻意耳定律', d: 'T、n 不变时 P ∝ 1/V。把活塞从 50 L 压到 10 L，压强应约变为 5 倍。' },
        { t: '盖-吕萨克定律', d: 'V、n 不变时 P ∝ T。用"加热 +30K"按钮升温，看压强计。' },
        { t: '理想气体方程', d: '三者合起来就是 PV = nRT。右侧公式区实时验证等式两边。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>物质的量 n <span class="val" id="g-nv">1.00 mol</span></label>
            <input type="range" id="g-n" min="0.2" max="2" step="0.05" value="1"></div>
          <div class="ctl"><label>温度 T <span class="val" id="g-tv">300 K（27 ℃）</span></label>
            <input type="range" id="g-t" min="100" max="600" step="5" value="300"></div>
          <div class="ctl"><label>活塞体积 V <span class="val" id="g-vv">24.5 L</span></label>
            <input type="range" id="g-v" min="5" max="50" step="0.5" value="24.5"></div>
          <div class="ctl"><button class="btn" id="g-heat" style="width:100%">加热 +30K（定容）</button>
            <button class="btn ghost" id="g-cool" style="width:100%;margin-top:8px">冷却 −30K（定容）</button>
            <button class="btn ghost" id="g-compress" style="width:100%;margin-top:8px">压缩 −5L（定温）</button>
            <button class="btn ghost" id="g-expand" style="width:100%;margin-top:8px">膨胀 +5L（定温）</button>
            <button class="btn ghost" id="g-reset" style="width:100%;margin-top:8px">重置</button></div>
          <div class="ctl"><button class="btn small" id="g-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="g-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">压强 P <b id="ro-p">— kPa</b></div>
        <div class="chip">PV 乘积 <b id="ro-pv">—</b></div>
        <div class="chip">nRT <b id="ro-nrt">—</b></div>
        <div class="chip">粒子平均速率 <b id="ro-spd">—</b></div>
        <div class="chip">玻意耳偏差 <b id="ro-bd">—</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('g-canvas');
    const g2d = canvas.getContext('2d');
    const parts = [];

    const CY = { x: 60, y: 60, w: 220, h: 300 };
    const P = () => state.n * R * state.T / state.v;
    const gasTopOf = () => CY.y + CY.h - (40 + state.v / 50 * (CY.h - 80));

    function spawnParts() {
      parts.length = 0;
      const count = Math.round(state.n * 18);
      for (let i = 0; i < count; i++) {
        parts.push({ x: 0, y: 0, vx: 0, vy: 0, init: false });
      }
    }

    function setV(v) {
      v = Math.max(5, Math.min(50, v));
      state.v = Math.round(v * 2) / 2;
      $('g-v').value = state.v;
      $('g-vv').textContent = state.v + ' L';
      checkBoyle();
    }

    function checkBoyle() {
      if (state.v >= 48 && !state.pvRef) state.pvRef = P() * state.v;
      if (state.T !== 300 || state.n !== 1) { /* T/n 改变则基准失效 */ }
      if (state.pvRef && state.v <= 10) {
        const dev = Math.abs(P() * state.v - state.pvRef) / state.pvRef * 100;
        if (dev < 3 && !state.boyleDone) {
          state.boyleDone = true;
          kit.goal('g3', true);
          kit.say('玻意耳验证完成：PV 偏差 ' + dev.toFixed(2) + '%。压强不是"挤"出来的，是<b>撞</b>出来的。');
        }
      }
    }

    const spots = [
      { x: 170, y: 175, r: 14, title: '分子在做什么', body: '每个分子都在自由飞行+碰撞。温度越高速度越快（动能 ∝ T）。压强是<b>大量分子撞击器壁的平均效果</b>——单个分子谈不上压强。' },
      { x: 280, y: 250, r: 14, title: '活塞', body: '压缩体积 = 单位空间内分子变多 = 每秒撞墙次数变多 = 压强增大。拖动它试试！' },
      { x: 430, y: 170, r: 14, title: '压强计', body: '表针角度 ∝ P。上限 400 kPa。别把 T 和 n 拉满——现实中这样的容器早就炸了。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    drag(canvas, {
      hit(x, y) {
        const gt = gasTopOf();
        return (x > CY.x - 12 && x < CY.x + CY.w + 12 && y > gt - 16 && y < gt + 12) ? 'piston' : null;
      },
      start() { kit.say('抓住活塞了——往上推是压缩（P 增大），往下拉是膨胀。'); },
      move(x, y) {
        const v = ((CY.y + CY.h - (y + 4)) - 40) / (CY.h - 80) * 50;
        setV(v);
      },
      end() { /* keep */ }
    });

    function updateRO() {
      const p = P();
      $('ro-p').textContent = p.toFixed(1) + ' kPa';
      $('ro-pv').textContent = (p * state.v).toFixed(0);
      $('ro-nrt').textContent = (state.n * R * state.T / 1000).toFixed(0);
      const spd = Math.sqrt(state.T) * 1.8;
      $('ro-spd').textContent = Math.round(spd) + '（相对值，∝√T）';
      if (state.pvRef && state.v <= 10) {
        const dev = Math.abs(p * state.v - state.pvRef) / state.pvRef * 100;
        $('ro-bd').textContent = dev.toFixed(2) + ' %';
      } else {
        $('ro-bd').textContent = state.v >= 48 ? '基准已记录' : '先把 V 调到 ~50L';
      }
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now();
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      const cx = CY.x, cy = CY.y, cw = CY.w, ch = CY.h;
      const gasTop = gasTopOf();
      const gasH = cy + ch - gasTop;
      g2d.strokeStyle = '#3a3358';
      g2d.strokeRect(cx, cy, cw, ch);
      g2d.fillStyle = 'rgba(95,147,201,.15)';
      g2d.fillRect(cx + 1, gasTop, cw - 2, gasH - 1);
      // particles
      const speed = Math.sqrt(state.T) * 1.8;
      parts.forEach(p => {
        if (!p.init) {
          p.x = cx + 6 + Math.random() * (cw - 12);
          p.y = gasTop + 6 + Math.random() * (Math.max(10, gasH - 12));
          const a = Math.random() * Math.PI * 2;
          p.vx = Math.cos(a) * speed; p.vy = Math.sin(a) * speed; p.init = true;
        }
        if (p.x < cx + 5 || p.x > cx + cw - 5) p.vx *= -1;
        if (p.y < gasTop + 5 || p.y > cy + ch - 5) p.vy *= -1;
        if (p.y < gasTop + 5) p.y = gasTop + 5;
        p.x += p.vx; p.y += p.vy;
        g2d.fillStyle = '#8fc3e8'; g2d.beginPath(); g2d.arc(p.x, p.y, 3.4, 0, 7); g2d.fill();
      });
      // piston
      g2d.fillStyle = '#5c5578'; g2d.fillRect(cx, gasTop - 8, cw, 8);
      g2d.fillStyle = '#3a3358'; g2d.fillRect(cx + cw / 2 - 3, cy - 30, 6, 30);
      g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
      g2d.fillText('活塞 V = ' + state.v + ' L（可拖动）', cx + 40, cy - 36);
      g2d.fillText('n = ' + state.n.toFixed(2) + ' mol · T = ' + state.T + ' K', cx + 40, cy + ch + 20);
      // pressure gauge
      const gx = 340, gy = 80, gr = 90;
      g2d.strokeStyle = '#3a3358'; g2d.beginPath(); g2d.arc(gx + gr, gy + gr, gr, 0, 7); g2d.stroke();
      const pmax = 400;
      const ang = -Math.PI * 1.25 + Math.min(P() / pmax, 1) * Math.PI * 1.5;
      g2d.strokeStyle = '#f0c96a'; g2d.lineWidth = 3;
      g2d.beginPath(); g2d.moveTo(gx + gr, gy + gr);
      g2d.lineTo(gx + gr + Math.cos(ang) * (gr - 14), gy + gr + Math.sin(ang) * (gr - 14)); g2d.stroke();
      g2d.lineWidth = 1;
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('压强计 (kPa)', gx + gr - 40, gy + 2 * gr + 18);
      g2d.fillStyle = '#f0c96a'; g2d.font = '20px serif';
      g2d.fillText(P().toFixed(0) + ' kPa', gx + gr - 30, gy + gr + 6);
      g2d.font = '12px sans-serif';
      // formula
      g2d.fillStyle = '#a49cc0';
      g2d.font = '18px ui-monospace,monospace';
      g2d.fillText('P·V = n·R·T', gx + 40, gy + 2 * gr + 60);
      g2d.font = '13px sans-serif';
      g2d.fillText(P().toFixed(1) + ' × ' + state.v + ' = ' + (P() * state.v).toFixed(0), gx + 40, gy + 2 * gr + 85);
      g2d.fillText(state.n.toFixed(2) + ' × 8.314 × ' + state.T + ' / 1000 = ' + (state.n * R * state.T / 1000).toFixed(0), gx + 40, gy + 2 * gr + 105);
      drawSpots(g2d, t);
      updateRO();
    }

    function loop() { draw(); raf = requestAnimationFrame(loop); }

    $('g-n').addEventListener('input', e => {
      state.n = +e.target.value; $('g-nv').textContent = state.n.toFixed(2) + ' mol';
      state.pvRef = null; state.boyleDone = false;
      spawnParts();
    });
    $('g-t').addEventListener('input', e => {
      state.T = +e.target.value;
      $('g-tv').textContent = state.T + ' K（' + (state.T - 273) + ' ℃）';
      if (state.boyleDone && state.T !== 300) { /* 已完成则不再干预 */ }
      kit.goal('g2', true);
    });
    $('g-v').addEventListener('input', e => { setV(+e.target.value); });
    $('g-heat').addEventListener('click', () => {
      state.T = Math.min(600, state.T + 30);
      $('g-t').value = state.T; $('g-tv').textContent = state.T + ' K（' + (state.T - 273) + ' ℃）';
      kit.goal('g2', true);
    });
    $('g-cool').addEventListener('click', () => {
      state.T = Math.max(100, state.T - 30);
      $('g-t').value = state.T; $('g-tv').textContent = state.T + ' K（' + (state.T - 273) + ' ℃）';
    });
    $('g-compress').addEventListener('click', () => { setV(state.v - 5); });
    $('g-expand').addEventListener('click', () => { setV(state.v + 5); });
    $('g-reset').addEventListener('click', () => {
      state.n = 1; state.T = 300; state.v = 24.5; state.pvRef = null; state.boyleDone = false;
      $('g-n').value = 1; $('g-t').value = 300; $('g-v').value = 24.5;
      $('g-nv').textContent = '1.00 mol'; $('g-tv').textContent = '300 K（27 ℃）'; $('g-vv').textContent = '24.5 L';
      kit.resetGoals();
      kit.say('重置。先在 ~50 L 记下基准，再一口气压到 10 L 以下。');
      spawnParts();
    });
    $('g-record').addEventListener('click', () => {
      kit.goal('g1', true);
      ctx.record(
        { n: state.n.toFixed(2) + ' mol', T: state.T + ' K', V: state.v + ' L' },
        { 压强: P().toFixed(1) + ' kPa', 'PV 乘积': (P() * state.v).toFixed(0), 'nRT(kJ)': (state.n * R * state.T / 1000).toFixed(0) }
      );
    });

    spawnParts();
    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
