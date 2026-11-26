// 实验1：密度与浮沉（v2：拖拽 + 实验套件）
import { createKit, drag, hotspot } from '../expkit.js';

const MATERIALS = {
  'wood':  { name: '木块', rho: 0.6 },
  'ice':   { name: '冰块', rho: 0.92 },
  'oil':   { name: '食用油', rho: 0.91 },
  'alco':  { name: '酒精', rho: 0.79 },
  'water': { name: '纯水', rho: 1.0 },
  'brine': { name: '盐水', rho: 1.2 },
  'alu':   { name: '铝块', rho: 2.7 },
  'iron':  { name: '铁块', rho: 7.8 }
};
const LIQUIDS = { 'water': 1.0, 'brine': 1.2, 'oil': 0.91 };
const LIQ_NAME = { water: '水', brine: '盐水', oil: '食用油' };

let raf = null, state = null;

export default {
  id: 'density', title: '密度与浮沉', oneLine: '测量质量与体积，算出密度；把物体拖进水槽，观察它在不同液体中的沉浮。',
  tags: ['零基础', '物理变化', '测量'],
  safety: ['虚拟实验无危险，但现实中的玻璃量筒轻拿轻放，防止碎裂。'],
  render(root, ctx) {
    state = { mat: 'wood', liquid: 'water', mass: 80, inTank: false, drag: null, seen: { float: false, sink: false, suspend: false } };

    const kit = createKit(root, {
      narr: '用鼠标把左下的物体<b>拖进右侧水槽</b>——浮力（绿箭头）和重力（红箭头）谁赢，物体就听谁的。',
      chal: '观察沉、浮两种状态，再让物体"悬浮"在液体中（提示：换成和水密度相同的物质）。',
      ach: 'density_float',
      goals: [
        { id: 'g1', text: '把物体拖进水槽（或按"放入液体"）' },
        { id: 'g2', text: '观察到漂浮与沉底两种状态' },
        { id: 'g3', text: '让物体悬浮（ρ物 = ρ液）' }
      ],
      steps: [
        { t: '称质量', d: '左上天平直接读出质量 m（克）。拖动滑块改变质量，观察体积随之变化。' },
        { t: '测体积', d: '中间量筒用排水法显示体积 V（cm³）。密度 ρ = m ÷ V，单位 g/cm³。' },
        { t: '预测沉浮', d: 'ρ物 > ρ液 → 沉底；ρ物 < ρ液 → 漂浮；ρ物 = ρ液 → 悬浮。先预测，再拖进去验证。' },
        { t: '换液体', d: '水的密度 1.00、盐水 1.20、食用油 0.91。同一物体换液体，结论会反转。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>材料</label>
            <select id="d-mat">${Object.entries(MATERIALS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><label>质量 <span class="val" id="d-massv">80 g</span></label>
            <input type="range" id="d-mass" min="10" max="500" value="80"></div>
          <div class="ctl"><label>液体</label>
            <select id="d-liq"><option value="water">水</option><option value="brine">盐水</option><option value="oil">食用油</option></select></div>
          <div class="ctl"><button class="btn primary" id="d-place" style="width:100%">放入液体</button>
            <button class="btn ghost" id="d-reset" style="width:100%;margin-top:8px">重置</button></div>
          <div class="ctl"><button class="btn small" id="d-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage">
          <canvas id="d-canvas" width="640" height="420"></canvas>
        </section>
      </div>
      <div class="readouts">
        <div class="chip">质量 m <b id="ro-m">80 g</b></div>
        <div class="chip">体积 V <b id="ro-v">—</b></div>
        <div class="chip">已算密度 ρ <b id="ro-rho">—</b></div>
        <div class="chip">液体密度 <b id="ro-l">1.00 g/cm³</b></div>
        <div class="chip">浮力 F <b id="ro-f">—</b></div>
        <div class="chip">状态 <b id="ro-s">未放入</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('d-canvas');
    const g2d = canvas.getContext('2d');

    const rhoOf = () => MATERIALS[state.mat].rho;
    const volOf = () => state.mass / rhoOf();
    const subFrac = () => Math.min(1, rhoOf() / LIQUIDS[state.liquid]);
    const objSize = () => Math.max(26, Math.min(64, Math.pow(volOf(), 1 / 3) * 2.2));
    const TANK = { x: 380, y: 80, w: 220, h: 260 };
    const SHELF = { x: 105, y: 165 };

    function markSeen(kind) {
      if (state.seen[kind]) return;
      state.seen[kind] = true;
      if (kind === 'float') kit.say('ρ物 < ρ液 → <b>漂浮</b>：浮力托住了它，物体只浸入一部分。');
      if (kind === 'sink') kit.say('ρ物 > ρ液 → <b>沉底</b>：浮力不够，重力获胜。');
      if (kind === 'suspend') kit.say('<b>悬浮</b>！ρ物 = ρ液，浮力恰好等于重力。盐水浮鸡蛋就是这个原理的变体。');
      kit.goal('g1', true);
      if (state.seen.float && state.seen.sink) kit.goal('g2', true);
      if (state.seen.suspend) kit.goal('g3', true);
    }

    function currentStatus() {
      const rl = LIQUIDS[state.liquid];
      return rhoOf() < rl ? 'float' : rhoOf() > rl ? 'sink' : 'suspend';
    }

    const spots = [
      { x: 120, y: 85, r: 14, title: '电子天平', body: '天平测的是<b>质量</b>（克），与在地球还是月球无关。注意别和"重量"（牛顿，受重力影响）混淆。' },
      { x: 285, y: 180, r: 14, title: '排水法量体积', body: '物体浸没时排开的水的体积 = 物体自身体积。这是阿基米德测王冠的方法，也是不规则固体测体积的标准手段。' },
      { x: 490, y: 330, r: 14, title: '浮力从哪来', body: '液体对物体下表面的压强比上表面大，压力差就是浮力 F = ρ液·g·V排。<b>排开</b>的液体越多、液体越稠，浮力越大。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    drag(canvas, {
      hit(x, y) {
        const size = objSize();
        if (state.inTank && !state.drag) {
          const p = objPos();
          if (x > p.x - 10 && x < p.x + size + 10 && y > p.y - 10 && y < p.y + size + 10) return 'tank';
        }
        const sx = SHELF.x - size / 2, sy = SHELF.y;
        if (!state.inTank && x > sx - 10 && x < sx + size + 10 && y > sy - 10 && y < sy + size + 10) return 'shelf';
        return null;
      },
      start(x, y, from) { state.drag = { from, x, y }; },
      move(x, y) { if (state.drag) { state.drag.x = x; state.drag.y = y; } },
      end(x, y, from) {
        const inside = x > TANK.x && x < TANK.x + TANK.w && y > TANK.y && y < TANK.y + TANK.h;
        if (inside && (!state.inTank || from === 'shelf')) {
          state.inTank = true;
          $('d-place').textContent = '取出物体';
          const rl = LIQUIDS[state.liquid];
          const st = currentStatus();
          kit.say('ρ物 ' + rhoOf().toFixed(2) + ' vs ρ液 ' + rl.toFixed(2) + '（' + LIQ_NAME[state.liquid] + '）→ 预测：' + (st === 'float' ? '漂浮' : st === 'sink' ? '沉底' : '悬浮'));
        } else if (!inside && from === 'tank') {
          state.inTank = false;
          $('d-place').textContent = '放入液体';
          kit.say('已取出。换一种液体或换一个材料，再预测一次。');
        }
        state.drag = null;
      }
    });

    function objPos() {
      const size = objSize();
      const frac = subFrac();
      const sink = rhoOf() >= LIQUIDS[state.liquid];
      const top = TANK.y + TANK.h - (TANK.h - 60) - 2;
      let by;
      if (sink) by = TANK.y + TANK.h - size - 6;
      else by = top + (1 - frac) * size;
      return { x: TANK.x + TANK.w / 2 - size / 2, y: by };
    }

    function drawObj(x, y) {
      const size = objSize();
      const mc = state.mat === 'iron' ? '#7a8699' : state.mat === 'alu' ? '#b8c2d4' : state.mat === 'wood' ? '#a07a4a' : state.mat === 'ice' ? '#cfe6f5' : state.mat === 'oil' ? '#c8a34a' : state.mat === 'alco' ? '#b9d3ea' : state.mat === 'brine' ? '#5d90c4' : '#8fc3e8';
      g2d.fillStyle = mc;
      g2d.fillRect(x, y, size, size);
      g2d.strokeStyle = '#0d0b16';
      g2d.strokeRect(x, y, size, size);
      g2d.fillStyle = '#141126';
      g2d.font = '10px sans-serif';
      g2d.fillText(MATERIALS[state.mat].name.slice(0, 3), x + 3, y + size / 2 + 3);
      return size;
    }

    function updateRO() {
      const v = volOf();
      $('ro-m').textContent = state.mass + ' g';
      $('ro-v').textContent = v.toFixed(1) + ' cm³';
      $('ro-rho').textContent = rhoOf().toFixed(2) + ' g/cm³';
      const rl = LIQUIDS[state.liquid];
      $('ro-l').textContent = rl.toFixed(2) + ' g/cm³';
      if (state.inTank) {
        const f = subFrac() * v * rl;
        $('ro-f').textContent = (f / 1000 * 9.8).toFixed(2) + ' N（排开 ' + (subFrac() * v).toFixed(1) + ' cm³）';
        $('ro-s').textContent = { float: '漂浮', sink: '沉底', suspend: '悬浮' }[currentStatus()];
      } else {
        $('ro-f').textContent = '—'; $('ro-s').textContent = '未放入';
      }
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now();
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      // scale
      g2d.fillStyle = '#2a2547'; g2d.fillRect(30, 40, 180, 90);
      g2d.strokeStyle = '#5f93c9'; g2d.strokeRect(30, 40, 180, 90);
      g2d.fillStyle = '#a9c8e8'; g2d.font = '13px sans-serif';
      g2d.fillText('电子天平（称质量）', 40, 62);
      g2d.font = '26px serif'; g2d.fillStyle = '#f0c96a';
      g2d.fillText(state.mass + ' g', 60, 108);
      // cylinder
      const cx = 250, cy = 60, cw = 70, ch = 240;
      g2d.strokeStyle = '#5f93c9'; g2d.fillStyle = 'rgba(95,147,201,.10)';
      g2d.fillRect(cx, cy, cw, ch); g2d.strokeRect(cx, cy, cw, ch);
      const v = Math.min(volOf(), 500);
      const wh = v / 500 * (ch - 16);
      g2d.fillStyle = 'rgba(95,147,201,.5)';
      g2d.fillRect(cx + 2, cy + ch - 2 - wh, cw - 4, wh);
      g2d.fillStyle = '#a9c8e8'; g2d.font = '12px sans-serif';
      g2d.fillText('量筒/排水法', cx, cy - 8);
      g2d.fillText('V = ' + v.toFixed(0) + ' cm³', cx + 4, cy + ch + 18);
      // tank
      const tx = TANK.x, ty = TANK.y, tw = TANK.w, th = TANK.h;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(tx, ty, tw, th);
      g2d.fillStyle = '#a9c8e8'; g2d.font = '12px sans-serif';
      g2d.fillText('水槽：' + LIQ_NAME[state.liquid] + '（ρ=' + LIQUIDS[state.liquid].toFixed(2) + '）', tx, ty - 8);
      const lh = th - 60;
      const lc = state.liquid === 'oil' ? '#c8a34a' : state.liquid === 'brine' ? '#4a7fb5' : '#5f93c9';
      g2d.fillStyle = lc + '44'; g2d.fillRect(tx + 2, ty + th - lh - 2, tw - 4, lh);
      g2d.strokeStyle = lc; g2d.beginPath();
      g2d.moveTo(tx + 2, ty + th - lh - 2); g2d.lineTo(tx + tw - 2, ty + th - lh - 2); g2d.stroke();
      // object
      const dragging = state.drag && state.drag.from;
      if (dragging) {
        drawObj(state.drag.x - objSize() / 2, state.drag.y - objSize() / 2);
        g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
        g2d.fillText('松手放进水槽 / 拖出取回', tx + 30, ty - 26);
      } else if (state.inTank) {
        const p = objPos();
        const frac = subFrac();
        const sink = rhoOf() >= LIQUIDS[state.liquid];
        const size = drawObj(p.x, p.y);
        if (!sink) {
          g2d.fillStyle = lc + '66';
          g2d.fillRect(p.x, p.y + (1 - frac) * size, size, frac * size);
        }
        const grav = Math.min(60, state.mass / 10);
        g2d.strokeStyle = '#f2b3a4'; g2d.lineWidth = 3;
        g2d.beginPath(); g2d.moveTo(p.x + size / 2, p.y + size / 2); g2d.lineTo(p.x + size / 2, p.y + size / 2 + grav); g2d.stroke();
        const fb = Math.min(60, grav * (sink ? LIQUIDS[state.liquid] / rhoOf() : 1) * (sink ? 1 : frac));
        g2d.strokeStyle = '#8fe0c6';
        g2d.beginPath(); g2d.moveTo(p.x + size / 2, p.y + size / 2); g2d.lineTo(p.x + size / 2, p.y + size / 2 - fb); g2d.stroke();
        g2d.lineWidth = 1;
        g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
        g2d.fillText('↓ 重力', p.x + size / 2 + 8, p.y + size / 2 + grav);
        g2d.fillText('↑ 浮力', p.x + size / 2 + 8, p.y + size / 2 - fb - 4);
        markSeen(currentStatus());
      } else {
        const size = objSize();
        drawObj(SHELF.x - size / 2, SHELF.y);
        g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
        g2d.fillText('← 抓住我，拖进水槽', 36, SHELF.y + size + 18);
      }
      drawSpots(g2d, t);
      updateRO();
    }

    function loop() { draw(); raf = requestAnimationFrame(loop); }

    $('d-mat').addEventListener('change', e => { state.mat = e.target.value; });
    $('d-mass').addEventListener('input', e => {
      state.mass = +e.target.value;
      $('d-massv').textContent = state.mass + ' g';
    });
    $('d-liq').addEventListener('change', e => {
      state.liquid = e.target.value;
      if (state.inTank) kit.say('液体换成' + LIQ_NAME[state.liquid] + '（ρ=' + LIQUIDS[state.liquid].toFixed(2) + '）。同一物体，结论可能反转——再看一眼。');
    });
    $('d-place').addEventListener('click', () => {
      state.inTank = !state.inTank;
      $('d-place').textContent = state.inTank ? '取出物体' : '放入液体';
      if (state.inTank) markSeen(currentStatus());
    });
    $('d-reset').addEventListener('click', () => {
      state.inTank = false; state.drag = null;
      state.seen = { float: false, sink: false, suspend: false };
      $('d-place').textContent = '放入液体';
      $('d-mass').value = 80; state.mass = 80; $('d-massv').textContent = '80 g';
      kit.resetGoals();
      kit.say('已重置。重新挑战：沉、浮、悬浮各来一次。');
    });
    $('d-record').addEventListener('click', () => {
      ctx.record(
        { 材料: MATERIALS[state.mat].name, 质量: state.mass + ' g', 液体: LIQ_NAME[state.liquid] },
        { 体积: volOf().toFixed(1) + ' cm³', 密度: rhoOf().toFixed(2) + ' g/cm³', 结果: state.inTank ? { float: '漂浮', sink: '沉底', suspend: '悬浮' }[currentStatus()] : '未放入液体' }
      );
    });

    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
