// 实验8：量热计（v2：画圈搅拌 + 实验套件）
import { createKit, drag, hotspot } from '../expkit.js';

const SUBS = {
  nh4no3: { name: '硝酸铵 NH₄NO₃（冷敷袋）', M: 80, dH: 25.7, eq: 'NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)　ΔH = +25.7 kJ/mol（吸热）' },
  cacl2: { name: '氯化钙 CaCl₂（暖贴原料）', M: 111, dH: -81.3, eq: 'CaCl₂(s) → Ca²⁺(aq) + 2Cl⁻(aq)　ΔH = −81.3 kJ/mol（放热）' },
  nacl: { name: '氯化钠 NaCl（几乎不吸放热）', M: 58.4, dH: 3.9, eq: 'NaCl(s) → Na⁺(aq) + Cl⁻(aq)　ΔH ≈ +3.9 kJ/mol（微吸热）' },
  neutral: { name: '中和反应 HCl+NaOH（强酸强碱）', M: null, dH: -57.3, eq: 'H⁺(aq) + OH⁻(aq) → H₂O(l)　ΔH = −57.3 kJ/mol' }
};

let raf = null, state = null;

export default {
  id: 'calorimetry', title: '量热计：测反应热', oneLine: '把盐溶进水里或让酸碱中和，按住杯内画圈搅拌，用 q = cmΔT 算出反应热 ΔH。',
  tags: ['中学', '热化学', '测量'],
  safety: ['虚拟实验无危险。现实中量热操作须佩戴护目镜；强酸强碱中和放热明显，加碱要缓慢。'],
  render(root, ctx) {
    state = { sub: 'nh4no3', mWater: 200, amount: 10, T0: 25, T: 25, running: false, done: false, stir: 0, stirAcc: 0, stirSaid: false, seen: { endo: false, exo: false }, drag: null };

    const kit = createKit(root, {
      narr: '加入物质后，<b>按住杯内画圈搅拌</b>——搅拌加快热传递，温度更快到达平衡。看颜色：变红=放热，变蓝=吸热。',
      chal: '记录吸热与放热各一种物质，且实验 ΔH 与理论值偏差 < 10%。',
      ach: 'thermo_cool',
      goals: [
        { id: 'g1', text: '记录一个吸热反应（ΔH > 0）' },
        { id: 'g2', text: '记录一个放热反应（ΔH < 0）' },
        { id: 'g3', text: '实验 ΔH 与理论偏差 ≤ 10%' }
      ],
      steps: [
        { t: '吸热体验', d: '选"硝酸铵"，点"加入并搅拌"：水温下降。冷敷袋就是用它——溶解吸热带走热量。' },
        { t: '放热体验', d: '换水后选"氯化钙"：水温上升。暖贴、自热火锅发热包用的是同类原理。' },
        { t: '公式', d: 'q = c·m·ΔT（水的比热 c = 4.18 J/(g·℃)）。ΔH = −q / n，负号表示"反应放出的热被水吸收"。' },
        { t: '评估误差', d: '对比实验 ΔH 与理论值。误差来源：保温不完美、搅拌不均、温度计热容。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>加入的物质</label>
            <select id="q-sub">${Object.entries(SUBS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><label>水的质量 <span class="val" id="q-wv">200 g</span></label>
            <input type="range" id="q-w" min="100" max="300" step="10" value="200"></div>
          <div class="ctl"><label>加入量 <span class="val" id="q-av">10 g</span></label>
            <input type="range" id="q-a" min="2" max="40" step="1" value="10"></div>
          <div class="ctl"><label>初始水温 <span class="val" id="q-t0v">25 ℃</span></label>
            <input type="range" id="q-t0" min="10" max="35" step="1" value="25"></div>
          <div class="ctl"><button class="btn primary" id="q-add" style="width:100%">加入（再画圈搅拌）</button>
            <button class="btn ghost" id="q-reset" style="width:100%;margin-top:8px">换水重来</button></div>
          <div class="ctl"><button class="btn small" id="q-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="q-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">当前温度 <b id="ro-t">25.0 ℃</b></div>
        <div class="chip">ΔT（相对初始） <b id="ro-dt">0.0 ℃</b></div>
        <div class="chip">物质的量 n <b id="ro-n">—</b></div>
        <div class="chip">理论热量 q <b id="ro-q">—</b></div>
        <div class="chip">实验 ΔH <b id="ro-h">—</b></div>
        <div class="chip">理论 ΔH <b id="ro-h2">—</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('q-canvas');
    const g2d = canvas.getContext('2d');

    const CUP = { x: 80, y: 90, w: 160, h: 240 };
    const center = () => [CUP.x + CUP.w / 2, CUP.y + CUP.h / 2 + 20];

    const molOf = () => {
      if (state.sub === 'neutral') return state.amount / 10;
      return state.amount / SUBS[state.sub].M;
    };
    const qkJ = () => -molOf() * SUBS[state.sub].dH;
    const dTof = () => qkJ() * 1000 / (state.mWater * 4.18);

    const spots = [
      { x: 160, y: 110, r: 14, title: '为什么要保温', body: '量热的前提是"热量只在反应体系与水之间流动"。保温杯隔绝外界 → 少散失、少渗入，ΔT 才可信。咖啡杯量热计是化学实验室最简单的量热装置。' },
      { x: 299, y: 100, r: 14, title: '温度计怎么读', body: '读最高/最低点（拐点）而非稳定值——因为杯体吸热会让读数缓慢回落。真实实验要画 T–t 图外推。' },
      { x: 495, y: 200, r: 14, title: '为什么是指数曲线', body: '传热速率 ∝ 温差（牛顿冷却/加热定律），所以 T(t) = T0 + ΔT·(1 − e^(−t/τ))。搅拌加快 τ 变小 → 更快到达平衡。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    drag(canvas, {
      hit(x, y) {
        return (x > CUP.x && x < CUP.x + CUP.w && y > CUP.y + 40 && y < CUP.y + CUP.h) ? 'stir' : null;
      },
      start(x, y) {
        const [cx, cy] = center();
        state.drag = { a0: Math.atan2(y - cy, x - cx), cx, cy };
      },
      move(x, y) {
        if (!state.drag) return;
        const a = Math.atan2(y - state.drag.cy, x - state.drag.cx);
        let da = a - state.drag.a0;
        if (da > Math.PI) da -= 2 * Math.PI;
        if (da < -Math.PI) da += 2 * Math.PI;
        state.drag.a0 = a;
        state.stirAcc += Math.abs(da);
        state.drag.angle = a;
        if (state.stirAcc > Math.PI * 2) {
          state.stirAcc = 0;
          state.stir = Math.min(4, state.stir + 1);
          if (!state.stirSaid) {
            state.stirSaid = true;
            kit.say('搅拌加速！热传递速度 ×' + state.stir + '，温度更快稳定。');
          }
          if (state.stir >= 4) kit.say('搅拌拉满 ×4——真实实验里持续匀速搅拌是数据质量的保障。');
        }
      },
      end() { /* 保持搅拌倍率直到重来 */ }
    });

    function markSeen() {
      const dT = state.T - state.T0;
      if (dT < -0.5) state.seen.endo = true;
      if (dT > 0.5) state.seen.exo = true;
      if (state.seen.endo) kit.goal('g1', true);
      if (state.seen.exo) kit.goal('g2', true);
    }

    function updateRO() {
      const n = molOf();
      $('ro-t').textContent = state.T.toFixed(1) + ' ℃';
      $('ro-dt').textContent = (state.T - state.T0).toFixed(1) + ' ℃';
      $('ro-n').textContent = n.toFixed(4) + ' mol';
      $('ro-q').textContent = qkJ().toFixed(2) + ' kJ';
      const dHexp = n > 0 ? -(4.18 * state.mWater * (state.T - state.T0) / 1000) / n : 0;
      $('ro-h').textContent = n > 0 && state.done ? dHexp.toFixed(1) + ' kJ/mol' : '—（待温度稳定）';
      $('ro-h2').textContent = SUBS[state.sub].dH.toFixed(1) + ' kJ/mol';
      if (state.done) {
        const dHexp2 = -(4.18 * state.mWater * (state.T - state.T0) / 1000) / n;
        const dev = Math.abs((dHexp2 - SUBS[state.sub].dH) / SUBS[state.sub].dH) * 100;
        if (dev <= 10) {
          if (dHexp2 > 0) kit.goal('g1', true); else kit.goal('g2', true);
          kit.goal('g3', true);
        }
      }
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now() / 20;
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      // foam cup
      const cx = CUP.x, cy = CUP.y, cw = CUP.w, ch = CUP.h;
      g2d.strokeStyle = '#5c5578'; g2d.lineWidth = 5;
      g2d.strokeRect(cx, cy, cw, ch);
      g2d.lineWidth = 1;
      const dT = state.T - state.T0;
      const waterCol = dT > 0.5 ? 'rgba(198,90,65,.4)' : dT < -0.5 ? 'rgba(95,147,201,.45)' : 'rgba(95,147,201,.3)';
      g2d.fillStyle = waterCol;
      g2d.fillRect(cx + 3, cy + 60, cw - 6, ch - 63);
      g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
      g2d.fillText('保温杯量热计', cx, cy - 10);
      g2d.fillText(state.mWater + ' g 水', cx + 8, cy + 80);
      g2d.fillText('按住杯内画圈搅拌', cx + 8, cy + ch + 18);
      // stir paddle
      const [ccx, ccy] = center();
      if (state.drag && state.drag.angle !== undefined) {
        g2d.strokeStyle = '#8fe0c6'; g2d.lineWidth = 3;
        g2d.beginPath(); g2d.moveTo(ccx, ccy);
        g2d.lineTo(ccx + Math.cos(state.drag.angle) * 55, ccy + Math.sin(state.drag.angle) * 55);
        g2d.stroke(); g2d.lineWidth = 1;
      } else if (state.running || state.stir > 0) {
        g2d.strokeStyle = 'rgba(143,224,198,' + (0.3 + state.stir * 0.15) + ')'; g2d.lineWidth = 2;
        g2d.beginPath();
        for (let i = 0; i < 14; i++) {
          const yy = cy + 90 + i * 9;
          const xx = ccx + Math.sin(t * (1 + state.stir) + i * 0.5) * (20 + state.stir * 4);
          i === 0 ? g2d.moveTo(xx, yy) : g2d.lineTo(xx, yy);
        }
        g2d.stroke(); g2d.lineWidth = 1;
      }
      // thermometer
      const mx = 290;
      g2d.fillStyle = '#2a2547'; g2d.fillRect(mx, 60, 18, 280);
      const th = Math.max(0, Math.min(1, state.T / 50)) * 270;
      g2d.fillStyle = state.T > state.T0 + 0.5 ? '#c65a41' : '#5f93c9';
      g2d.fillRect(mx + 2, 340 - th, 14, th);
      g2d.fillStyle = '#e8dfc8'; g2d.font = '18px serif';
      g2d.fillText(state.T.toFixed(1) + ' ℃', mx + 26, 78);
      // T vs time chart
      const gx = 380, gy = 60, gw = 230, gh = 280;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(gx, gy, gw, gh);
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('温度–时间曲线', gx + 8, gy - 8);
      const Tmin = Math.min(state.T0, state.T) - 2, Tmax = Math.max(state.T0, state.T) + 2;
      const Y = T => gy + gh - (T - Tmin) / (Tmax - Tmin || 1) * gh;
      g2d.strokeStyle = '#5c5578'; g2d.setLineDash([4, 4]);
      g2d.beginPath(); g2d.moveTo(gx, Y(state.T0)); g2d.lineTo(gx + gw, Y(state.T0)); g2d.stroke();
      g2d.setLineDash([]);
      g2d.fillStyle = '#5c5578';
      g2d.fillText('初始 ' + state.T0 + '℃', gx + 6, Y(state.T0) - 5);
      if (state.running || state.done) {
        g2d.strokeStyle = '#f0c96a'; g2d.lineWidth = 2; g2d.beginPath();
        for (let i = 0; i <= 100; i++) {
          const tt = i / 100 * 60;
          const Tf = state.T0 + dTof();
          const tau = 10 / (1 + state.stir);
          const Tv = state.T0 + (Tf - state.T0) * (1 - Math.exp(-tt / tau));
          const X = gx + i, Yv = Y(Tv);
          i === 0 ? g2d.moveTo(X, Yv) : g2d.lineTo(X, Yv);
        }
        g2d.stroke(); g2d.lineWidth = 1;
      }
      drawSpots(g2d, t * 20);
      updateRO();
    }

    function loop() {
      if (state.running) {
        const target = state.T0 + dTof();
        state.T += (target - state.T) * (0.03 * (1 + state.stir));
        if (Math.abs(target - state.T) < 0.05) {
          state.T = target; state.running = false; state.done = true;
          markSeen();
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    }

    $('q-sub').addEventListener('change', e => {
      state.sub = e.target.value; state.running = false; state.done = false; state.T = state.T0;
      $('q-av').textContent = state.amount + (state.sub === 'neutral' ? ' mmol' : ' g');
    });
    $('q-w').addEventListener('input', e => { state.mWater = +e.target.value; $('q-wv').textContent = state.mWater + ' g'; });
    $('q-a').addEventListener('input', e => { state.amount = +e.target.value; $('q-av').textContent = state.amount + (state.sub === 'neutral' ? ' mmol' : ' g'); });
    $('q-t0').addEventListener('input', e => {
      state.T0 = +e.target.value;
      $('q-t0v').textContent = state.T0 + ' ℃';
      if (!state.running && !state.done) state.T = state.T0;
    });
    $('q-add').addEventListener('click', () => {
      state.running = true; state.done = false;
      kit.say('已加入。按住杯内<b>画圈</b>搅拌，温度会更快稳定。');
      if (state.sub === 'neutral') kit.eq(SUBS.neutral.eq);
    });
    $('q-reset').addEventListener('click', () => {
      state.running = false; state.done = false; state.T = state.T0;
      state.stir = 0; state.stirAcc = 0; state.stirSaid = false;
      state.seen = { endo: false, exo: false };
      kit.resetGoals();
      kit.say('换水重来。目标：吸热、放热各记录一次，偏差 ≤ 10%。');
    });
    $('q-record').addEventListener('click', () => {
      const n = molOf();
      const dT = state.T - state.T0;
      const dHexp = n > 0 ? -(4.18 * state.mWater * dT / 1000) / n : 0;
      if (state.done) {
        if (dHexp > 0) { state.seen.endo = true; kit.goal('g1', true); }
        else { state.seen.exo = true; kit.goal('g2', true); }
        const dev = Math.abs((dHexp - SUBS[state.sub].dH) / SUBS[state.sub].dH) * 100;
        if (dev <= 10) kit.goal('g3', true);
      }
      ctx.record(
        { 物质: SUBS[state.sub].name.split('（')[0], 水质量: state.mWater + ' g', 加入量: state.sub === 'neutral' ? (state.amount / 10).toFixed(2) + ' mol' : state.amount + ' g' },
        { ΔT: dT.toFixed(1) + ' ℃', 'n': n.toFixed(4) + ' mol', '实验ΔH': dHexp.toFixed(1) + ' kJ/mol', '理论ΔH': SUBS[state.sub].dH.toFixed(1) + ' kJ/mol', 相对偏差: n > 0 ? (((dHexp - SUBS[state.sub].dH) / SUBS[state.sub].dH) * 100).toFixed(1) + '%' : '—' }
      );
    });

    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
