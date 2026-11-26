// 实验10：蒸馏与分馏
import { createKit, drag, hotspot } from '../expkit.js';

const ALPHA = 2.5; // 乙醇-水 相对挥发度（示意）
let raf = null, state = null;

const fEq = x => ALPHA * x / (1 + (ALPHA - 1) * x);

export default {
  id: 'distill', title: '蒸馏与分馏', oneLine: '利用沸点差分离乙醇和水：加热汽化、分馏柱增浓、冷凝收集，看你能得到多纯的乙醇。',
  tags: ['中学', '分离', '沸点'],
  safety: ['虚拟实验无危险。现实中乙醇蒸气易燃，蒸馏装置必须密闭且远离明火加热源（用水浴/电热套）。'],
  render(root, ctx) {
    state = { power: 0, N: 0, x: 0.2, Tl: 25, vol: 0, collected: 0, best: 0, boil: false, ty: 170, dragging: false, saidZone: '', saidBoil: false };

    const kit = createKit(root, {
      narr: '瓶里是乙醇-水混合液（乙醇 20 mol%）。乙醇沸点 78.3 ℃、水 100 ℃——加热后谁先进蒸气？',
      chal: '正确放置温度计并开始蒸馏，用分馏柱收集一瓶纯度 ≥85% 的乙醇馏分。',
      ach: 'distill_pure',
      goals: [
        { id: 'g1', text: '开始蒸馏（收集到馏出液）' },
        { id: 'g2', text: '换瓶并记录一次馏分' },
        { id: 'g3', text: '馏分纯度达到 85% 以上' }
      ],
      steps: [
        { t: '放置温度计', d: '把<b>温度计</b>拖到<b>支管口</b>位置——水银球应与支管口平齐，测的是进入冷凝管的蒸气温度。' },
        { t: '加热', d: '调大加热功率，观察液温上升；到达沸点后温度会"停"在 78.3 ℃ 附近——纯度信号！' },
        { t: '增浓', d: '增加分馏柱理论板数（0~5）。每块板=一次部分汽化+冷凝，板数越多塔顶越纯。' },
        { t: '掐准时机换瓶', d: '乙醇快蒸完时纯度会下跌——趁纯度还高按"换瓶"，争取 ≥85% 的馏分。' }
      ]
    });
    kit.record = (p, r) => ctx.record(p, r);

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>加热功率 <span class="val" id="d-pv">0 %</span></label>
            <input type="range" id="d-p" min="0" max="100" step="5" value="0"></div>
          <div class="ctl"><label>理论板数 <span class="val" id="d-nv">0（简单蒸馏）</span></label>
            <input type="range" id="d-n" min="0" max="5" step="1" value="0"></div>
          <div class="ctl">
            <button class="btn" id="d-cut" style="width:100%">换瓶（掐断馏分）</button>
            <button class="btn ghost" id="d-reset" style="width:100%;margin-top:8px">更换新的混合液</button>
          </div>
          <div class="ctl"><button class="btn small" id="d-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="d-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">液温 <b id="ro-tl">25.0 ℃</b></div>
        <div class="chip">温度计读数 <b id="ro-td">— ℃</b></div>
        <div class="chip">馏出体积 <b id="ro-v">0.0 mL</b></div>
        <div class="chip">当前馏分纯度 <b id="ro-pu">—</b></div>
        <div class="chip">最佳纯度 <b id="ro-b">—</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const cv = $('d-canvas');
    const g2d = cv.getContext('2d');

    const FLASK = { cx: 140, cy: 300, r: 55 };
    const LIQ_LEVEL = 285;      // 液面 y
    const ARM_Y = 205;          // 支管口 y
    const bpL = () => 78.3 + (1 - state.x) * 21.7;
    const yHead = () => { let y = fEq(state.x); for (let i = 0; i < state.N; i++) y = fEq(y); return y; };
    const bpHead = () => 78.3 + (1 - yHead()) * 21.7;
    const readTemp = () => {
      if (state.ty >= LIQ_LEVEL - 5) return state.Tl;           // 浸入液体
      if (state.ty >= ARM_Y - 12 && state.ty <= ARM_Y + 14) return bpHead(); // 支管口
      return 25;                                                 // 太高，测不到蒸气
    };

    function updateRO() {
      $('ro-tl').textContent = state.Tl.toFixed(1) + ' ℃';
      $('ro-td').textContent = readTemp().toFixed(1) + ' ℃';
      $('ro-v').textContent = state.vol.toFixed(1) + ' mL';
      const pu = state.vol > 0.1 ? (yHead() * 100).toFixed(0) + ' %（乙醇）' : '—';
      $('ro-pu').textContent = pu;
      $('ro-b').textContent = state.best > 0 ? (state.best * 100).toFixed(0) + ' %' : '—';
    }

    function checkGoals() {
      if (state.vol > 0.5) kit.goal('g1');
    }

    function draw() {
      const w = 640, h = 420;
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      const t = performance.now();

      // 支架台
      g2d.strokeStyle = '#3a3358';
      g2d.beginPath(); g2d.moveTo(40, 365); g2d.lineTo(420, 365); g2d.stroke();

      // 加热火焰
      if (state.power > 0) {
        const fh = 14 + state.power / 100 * 30;
        const fx = FLASK.cx, fy = 365 - fh;
        const grad = g2d.createLinearGradient(fx, fy, fx, 365);
        grad.addColorStop(0, '#a8d8e8'); grad.addColorStop(1, '#5f93c9');
        g2d.fillStyle = grad;
        for (const dx of [-16, 0, 16]) {
          g2d.beginPath();
          g2d.ellipse(fx + dx + Math.sin(t / 120 + dx) * 2, fy + fh / 2, 8, fh / 2, 0, 0, 7);
          g2d.fill();
        }
      }

      // 蒸馏烧瓶
      g2d.strokeStyle = '#5c5578'; g2d.lineWidth = 2;
      g2d.beginPath(); g2d.arc(FLASK.cx, FLASK.cy, FLASK.r, 0, 7); g2d.stroke();
      g2d.strokeRect(FLASK.cx - 12, 200, 24, FLASK.cy - FLASK.r - 200 + 4);
      g2d.lineWidth = 1;
      // 液体
      const liqTop = LIQ_LEVEL;
      g2d.save();
      g2d.beginPath(); g2d.arc(FLASK.cx, FLASK.cy, FLASK.r - 1, 0, 7); g2d.clip();
      g2d.fillStyle = 'rgba(95,147,201,.35)';
      g2d.fillRect(FLASK.cx - FLASK.r, liqTop, FLASK.r * 2, FLASK.cy + FLASK.r - liqTop);
      // 沸腾气泡
      if (state.boil) {
        g2d.fillStyle = 'rgba(232,223,200,.5)';
        for (let i = 0; i < 6; i++) {
          const py = 345 - ((t / 4 + i * 37) % 55);
          g2d.beginPath(); g2d.arc(FLASK.cx - 30 + i * 12, py, 3, 0, 7); g2d.fill();
        }
      }
      g2d.restore();
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('乙醇-水（x=' + state.x.toFixed(2) + '）', 60, 392);

      // 分馏柱 + 理论板
      if (state.N > 0) {
        g2d.strokeRect(FLASK.cx - 12, 118, 24, 82);
        g2d.fillStyle = '#2a2547';
        for (let i = 0; i < state.N; i++) {
          const py = 130 + i * (80 / state.N);
          g2d.fillRect(FLASK.cx - 12, py, 24, 3);
        }
        g2d.fillStyle = '#8fe0c6'; g2d.font = '10px sans-serif';
        g2d.fillText('分馏柱 ' + state.N + ' 板', FLASK.cx + 18, 126);
      }

      // 支管与冷凝管
      g2d.strokeStyle = '#5c5578'; g2d.lineWidth = 2;
      g2d.beginPath(); g2d.moveTo(FLASK.cx + 12, ARM_Y); g2d.lineTo(212, 232); g2d.stroke();
      // 冷凝管（斜置双层）
      g2d.beginPath(); g2d.moveTo(212, 232); g2d.lineTo(312, 300); g2d.stroke();
      g2d.beginPath(); g2d.moveTo(212, 222); g2d.lineTo(312, 290); g2d.stroke();
      g2d.lineWidth = 1;
      g2d.strokeStyle = '#3a3358';
      g2d.strokeRect(230, 232, 60, 14); // 水套
      g2d.fillStyle = '#9c94b8'; g2d.font = '10px sans-serif';
      g2d.fillText('冷凝水 ↓进', 228, 262);
      g2d.fillText('↑出', 284, 232);

      // 接收瓶
      const rx = 340, ry = 300, rw = 76, rh = 62;
      g2d.strokeStyle = '#3a3358';
      g2d.strokeRect(rx, ry, rw, rh);
      const fill = Math.min(state.vol / 20, 1);
      if (fill > 0) {
        g2d.fillStyle = 'rgba(143,224,198,.35)';
        g2d.fillRect(rx + 2, ry + rh - fill * (rh - 6), rw - 4, fill * (rh - 6));
        g2d.fillStyle = '#8fe0c6'; g2d.font = '11px sans-serif';
        g2d.fillText('乙醇 ' + (yHead() * 100).toFixed(0) + '%', rx + 6, ry + rh - fill * (rh - 6) - 4);
      }
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('接收瓶 ' + state.vol.toFixed(1) + ' mL', rx, ry + rh + 16);

      // 温度计（可拖动）
      const tx = FLASK.cx;
      g2d.strokeStyle = '#c9c9d4'; g2d.lineWidth = 3;
      g2d.beginPath(); g2d.moveTo(tx, state.ty - 60); g2d.lineTo(tx, state.ty - 8); g2d.stroke();
      g2d.lineWidth = 1;
      g2d.fillStyle = '#c65a41';
      g2d.beginPath(); g2d.arc(tx, state.ty, 5, 0, 7); g2d.fill();
      // 读数
      g2d.fillStyle = '#f0c96a'; g2d.font = '12px sans-serif';
      g2d.fillText(readTemp().toFixed(1) + ' ℃', tx + 10, state.ty - 44);
      g2d.fillStyle = '#9c94b8'; g2d.font = '10px sans-serif';
      if (state.ty >= LIQ_LEVEL - 5) g2d.fillText('（浸入液体）', tx + 8, state.ty + 4);
      else if (state.ty >= ARM_Y - 12 && state.ty <= ARM_Y + 14) g2d.fillText('✓ 支管口', tx + 8, state.ty + 4);
      else g2d.fillText('（太高，测不到）', tx + 8, state.ty + 4);
      // 支管口标记
      g2d.strokeStyle = '#d4a542';
      g2d.beginPath(); g2d.arc(FLASK.cx + 20, ARM_Y, 8, 0, 7); g2d.stroke();
      g2d.fillStyle = '#d4a542';
      g2d.fillText('支管口', FLASK.cx + 32, ARM_Y + 4);

      updateRO();
      checkGoals();
      drawSpots(g2d, t);
    }

    const drawSpots = hotspot(cv, [
      { x: 162, y: ARM_Y, r: 11, title: '温度计为什么要对齐支管口', body: '蒸馏要控制的是"蒸气温度"——即进入冷凝管的馏分沸点。水银球插进液面测的是沸腾液温（偏高），抬太高又脱离蒸气主流（偏低）。对齐支管口才是准确的馏分温度。' },
      { x: 140, y: 160, r: 11, title: '分馏柱的理论板', body: '每块"理论板"让上升蒸气与下降凝液充分接触：易挥发组分（乙醇）不断进蒸气相、难挥发的不断回到液相——相当于把多次简单蒸馏串起来。板数越多，塔顶越纯（实验室精馏塔可达几十块板）。' },
      { x: 262, y: 240, r: 11, title: '冷凝水为什么下进上出', body: '逆流冷凝：冷水从下口进、上口出，与蒸气流向相反，温差分布均匀、换热效率最高，冷凝管全程都保持低温。' }
    ]);

    drag(cv, {
      hit(x, y) {
        return Math.abs(x - 140) < 22 && y > state.ty - 70 && y < state.ty + 14 ? 'thermo' : null;
      },
      start() { state.dragging = true; },
      move(x, y) {
        state.ty = Math.max(140, Math.min(LIQ_LEVEL, y));
        const zone = state.ty >= LIQ_LEVEL - 5 ? 'liquid' : (state.ty >= ARM_Y - 12 && state.ty <= ARM_Y + 14) ? 'ok' : 'high';
        if (zone !== state.saidZone) {
          state.saidZone = zone;
          if (zone === 'ok') kit.say('✓ 水银球对齐支管口：现在测的是进入冷凝管的蒸气温度（馏分沸点）。');
          if (zone === 'liquid') kit.say('水银球浸入液面了：测到的是沸腾液温，比塔顶蒸气温度高，会误导判断。');
          if (zone === 'high') kit.say('太高了：水银球脱离蒸气主流，读数接近室温，测不出馏分温度。');
        }
      },
      end() { state.dragging = false; }
    });

    function step() {
      const bp = bpL();
      if (state.power > 0 && state.Tl < bp - 0.4) {
        state.Tl += (bp - state.Tl) * 0.004 * (state.power / 60);
      } else if (state.power > 10 && Math.abs(state.Tl - bp) < 0.4) {
        state.boil = true;
        state.Tl = bp;
        // 馏出
        const rate = state.power * 0.0005; // mL per frame
        state.vol += rate; state.collected += rate;
        state.x = Math.max(0.02, 0.2 - state.collected / 200);
        if (!state.saidBoil) {
          state.saidBoil = true;
          kit.say('沸腾了！液温稳定在 ' + bp.toFixed(1) + ' ℃——混合物沸腾时温度"停"在易挥发组分的沸点附近。');
          kit.eq('乙醇 bp 78.3 ℃ < 水 bp 100 ℃：α≈2.5，易挥发者先进蒸气相');
        }
      }
      if (state.power <= 10) state.boil = false;
      if (state.power === 0) state.Tl += (25 - state.Tl) * 0.002;
    }

    $('d-p').addEventListener('input', e => { state.power = +e.target.value; $('d-pv').textContent = state.power + ' %'; });
    $('d-n').addEventListener('input', e => {
      state.N = +e.target.value;
      $('d-nv').textContent = state.N === 0 ? '0（简单蒸馏）' : state.N + ' 块';
    });
    $('d-cut').addEventListener('click', () => {
      if (state.vol < 0.5) { kit.say('这瓶还几乎是空的，先多收集一点。'); return; }
      const pu = yHead();
      state.best = Math.max(state.best, pu);
      kit.goal('g2');
      if (pu >= 0.85) {
        kit.goal('g3');
        kit.say('✓ 这瓶馏分纯度 ' + (pu * 100).toFixed(0) + '%（≥85%）——"掐头去尾"掐得漂亮！');
      } else {
        kit.say('这瓶纯度只有 ' + (pu * 100).toFixed(0) + '%。试试增加理论板数，或在纯度下跌前更早换瓶。');
      }
      state.vol = 0;
    });
    $('d-reset').addEventListener('click', () => {
      Object.assign(state, { power: 0, x: 0.2, Tl: 25, vol: 0, collected: 0, boil: false, saidBoil: false });
      $('d-p').value = 0; $('d-pv').textContent = '0 %';
      kit.say('新的乙醇-水混合液（x=0.2）已装好。');
    });
    $('d-record').addEventListener('click', () => {
      kit.record(
        { 功率: state.power + ' %', 理论板数: state.N, 液相组成: 'x=' + state.x.toFixed(2) },
        { 塔顶纯度: (yHead() * 100).toFixed(0) + '%', 馏出总量: state.collected.toFixed(1) + ' mL', 本瓶体积: state.vol.toFixed(1) + ' mL', 最佳纯度: state.best > 0 ? (state.best * 100).toFixed(0) + '%' : '—' }
      );
    });

    function loop() {
      step();
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
