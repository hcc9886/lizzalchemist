// 实验9：燃烧与火焰
import { createKit, drag, hotspot } from '../expkit.js';

const FUELS = {
  ch4: { name: '甲烷 CH₄（天然气）', eqFull: 'CH₄ + 2O₂ → CO₂ + 2H₂O', eqPart: '2CH₄ + 3O₂ → 2CO + 4H₂O（不完全燃烧）', temp: [1900, 1100, 650] },
  wax: { name: '石蜡 C₂₅H₅₂（蜡烛）', eqFull: 'C₂₅H₅₂ + 38O₂ → 25CO₂ + 26H₂O', eqPart: '石蜡 + O₂ → CO₂ + CO + C（烟）+ H₂O（不完全）', temp: [1400, 900, 550] },
  c: { name: '木炭 C', eqFull: 'C + O₂ → CO₂', eqPart: '2C + O₂ → 2CO（氧气不足时）', temp: [1200, 800, 500] }
};

let raf = null, state = null;
const soot = [];   // 烟尘颗粒
const smoke = [];  // 熄灭时的烟

export default {
  id: 'combustion', title: '燃烧与火焰', oneLine: '调节氧气浓度点燃燃料，观察火焰颜色三阶段与产物变化，再亲手把它熄灭。',
  tags: ['零基础', '氧化反应', '观察'],
  safety: ['虚拟实验无危险。现实中一氧化碳无色无味剧毒：炭火取暖必须通风，严禁在密闭房间烧炭。', '84消毒液与洁厕灵绝对不能混合（会产生氯气）。'],
  render(root, ctx) {
    state = { fuel: 'ch4', o2: 21, lit: false, dragging: false, mx: 520, my: 330, seenBlue: false, seenOrange: false, seenRed: false, extinguished: false, extFlash: 0, lastTier: null };

    const kit = createKit(root, {
      narr: '燃烧三要素：<b>可燃物 + 氧气 + 着火点</b>，缺一不可。先点火，再逐步降低氧气浓度，看火焰如何"变脸"。',
      chal: '点燃燃料，集齐蓝/橙/红三种火焰并各看一次产物，最后成功灭火。',
      ach: 'flame_blue',
      goals: [
        { id: 'g1', text: '拖动火柴点燃燃料' },
        { id: 'g2', text: '观察到蓝、橙、红三种火焰颜色' },
        { id: 'g3', text: '成功让火焰熄灭一次' }
      ],
      steps: [
        { t: '点火', d: '保持氧气浓度 21%（与空气相同），把右侧的<b>火柴</b>拖到燃料上方，接触火焰即点燃。' },
        { t: '观察充分燃烧', d: '蓝色火焰 = 氧气充足（≥19%），燃烧完全，产物只有 CO₂ 和 H₂O，温度最高。' },
        { t: '制造不完全燃烧', d: '把氧气浓度降到 14–18%（橙色）和 12–13%（红色），观察烟尘与 CO 生成——红色火焰很危险！' },
        { t: '灭火', d: '用"盖灭（隔绝氧气）"或"滴水降温"按钮灭火，或直接把氧气降到 12% 以下。燃烧三要素缺一即熄。' }
      ]
    });
    kit.record = (p, r) => ctx.record(p, r);

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>燃料</label>
            <select id="b-fuel">${Object.entries(FUELS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><label>氧气浓度 <span class="val" id="b-ov">21 %</span></label>
            <input type="range" id="b-o2" min="5" max="25" step="1" value="21"></div>
          <div class="ctl">
            <button class="btn" id="b-lid" style="width:100%">盖灭（隔绝氧气）</button>
            <button class="btn ghost" id="b-water" style="width:100%;margin-top:8px">滴水降温灭火</button>
          </div>
          <div class="ctl"><button class="btn small" id="b-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="b-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">火焰颜色 <b id="ro-c">未点燃</b></div>
        <div class="chip">火焰温度 <b id="ro-t">—</b></div>
        <div class="chip">主要产物 <b id="ro-p">—</b></div>
        <div class="chip">状态 <b id="ro-s">待点火</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const cv = $('b-canvas');
    const g2d = cv.getContext('2d');

    const MATCH_HOME = { x: 520, y: 335 };
    const FLAME = { x: 150, y: 300 }; // 火焰根部

    const tier = () => state.o2 >= 19 ? 0 : state.o2 >= 14 ? 1 : state.o2 >= 12 ? 2 : 3;
    const TIER_INFO = [
      { c: '#5f93c9', c2: '#a8d8e8', name: '蓝色（充分燃烧）', prod: 'CO₂ + H₂O' },
      { c: '#f0c96a', c2: '#e88f4a', name: '橙色（不完全）', prod: 'CO₂ + CO + 碳粒（烟）' },
      { c: '#c65a41', c2: '#e0704a', name: '红色（严重缺氧）', prod: '大量 CO（剧毒！）+ 碳粒' },
      { c: '#555', c2: '#333', name: '熄灭', prod: '不再反应' }
    ];

    function updateRO() {
      const t = tier(), f = FUELS[state.fuel];
      if (state.lit) {
        const info = TIER_INFO[t];
        $('ro-c').textContent = info.name;
        $('ro-c').style.color = info.c;
        $('ro-t').textContent = '≈ ' + f.temp[t] + ' ℃';
        $('ro-p').textContent = info.prod;
        $('ro-s').textContent = '燃烧中';
      } else {
        $('ro-c').textContent = '—'; $('ro-c').style.color = '';
        $('ro-t').textContent = '—'; $('ro-p').textContent = '—';
        $('ro-s').textContent = state.o2 < 12 ? '氧气不足，无法燃烧' : '待点火';
      }
    }

    function checkGoals() {
      if (state.lit) {
        kit.goal('g1');
        const t = tier();
        if (t === 0) state.seenBlue = true;
        if (t === 1) state.seenOrange = true;
        if (t === 2) state.seenRed = true;
        if (state.seenBlue && state.seenOrange && state.seenRed) kit.goal('g2');
        if (t !== state.lastTier) {
          state.lastTier = t;
          const f = FUELS[state.fuel];
          if (t === 0) { kit.say('蓝色火焰：氧气充足，燃烧完全。灶台上的蓝火就是这个状态。'); kit.eq(f.eqFull); }
          if (t === 1) kit.say('橙色火焰：氧气不够，开始产生一氧化碳和碳粒（烟）。烟越黑，燃烧越不完全。');
          if (t === 2) { kit.say('⚠ 红色火焰：严重缺氧，大量生成 CO——无色无味剧毒！现实中这就是烧炭中毒的原因。'); kit.eq(f.eqPart); }
        }
      } else if (state.extinguished) {
        kit.goal('g3');
      }
    }

    function draw() {
      const w = 640, h = 420;
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      const t = performance.now();
      const info = TIER_INFO[tier()];

      // 台面
      g2d.strokeStyle = '#3a3358';
      g2d.beginPath(); g2d.moveTo(30, 340); g2d.lineTo(380, 340); g2d.stroke();

      // 燃料台
      if (state.fuel === 'ch4') {
        g2d.strokeStyle = '#5c5578'; g2d.lineWidth = 8;
        g2d.beginPath(); g2d.moveTo(FLAME.x, 340); g2d.lineTo(FLAME.x, FLAME.y + 12); g2d.stroke();
        g2d.lineWidth = 1;
        g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
        g2d.fillText('甲烷喷嘴', FLAME.x - 28, 358);
      } else if (state.fuel === 'wax') {
        g2d.fillStyle = '#e8dfc8';
        g2d.fillRect(FLAME.x - 12, FLAME.y + 12, 24, 28);
        g2d.strokeStyle = '#3a3358'; g2d.strokeRect(FLAME.x - 12, FLAME.y + 12, 24, 28);
        g2d.strokeStyle = '#5c5578';
        g2d.beginPath(); g2d.moveTo(FLAME.x, FLAME.y + 12); g2d.lineTo(FLAME.x, FLAME.y + 4); g2d.stroke();
        g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
        g2d.fillText('蜡烛', FLAME.x - 14, 358);
      } else {
        g2d.fillStyle = '#4a4458';
        g2d.beginPath();
        g2d.moveTo(FLAME.x - 26, 340); g2d.lineTo(FLAME.x - 14, FLAME.y + 14);
        g2d.lineTo(FLAME.x + 14, FLAME.y + 14); g2d.lineTo(FLAME.x + 26, 340);
        g2d.closePath(); g2d.fill();
        g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
        g2d.fillText('木炭堆', FLAME.x - 20, 358);
      }

      // 火焰（三层椭圆）
      if (state.lit) {
        const wob = Math.sin(t / 90) * 3;
        const fh = state.fuel === 'ch4' ? 46 : 38;
        const grad = g2d.createLinearGradient(FLAME.x, FLAME.y - fh, FLAME.x, FLAME.y);
        grad.addColorStop(0, info.c2); grad.addColorStop(1, info.c);
        g2d.fillStyle = grad;
        g2d.beginPath();
        g2d.ellipse(FLAME.x + wob, FLAME.y - fh / 2, 13, fh / 2, 0, 0, 7);
        g2d.fill();
        g2d.fillStyle = '#fff8e0';
        g2d.beginPath();
        g2d.ellipse(FLAME.x, FLAME.y - fh / 4, 5, fh / 3, 0, 0, 7);
        g2d.fill();
        // 外焰标线（热点附近）
        g2d.fillStyle = 'rgba(232,223,200,.5)'; g2d.font = '10px sans-serif';
        g2d.fillText('外焰最热', FLAME.x + 20, FLAME.y - fh + 6);
        // 烟尘颗粒
        if (tier() >= 1) {
          if (Math.random() < (tier() === 1 ? 0.5 : 0.85)) {
            soot.push({ x: FLAME.x + (Math.random() - 0.5) * 14, y: FLAME.y - fh, vy: -(0.8 + Math.random()), life: 60 + Math.random() * 40, s: 1.5 + Math.random() * 2 });
          }
        }
      } else if (state.extFlash > 0) {
        // 熄灭白烟
        state.extFlash--;
        if (Math.random() < 0.6) {
          smoke.push({ x: FLAME.x + (Math.random() - 0.5) * 10, y: FLAME.y - 10, vy: -1, life: 70, s: 3 + Math.random() * 3 });
        }
      }
      const drawPuffs = (arr, col) => arr.forEach((p, i) => {
        p.y += p.vy; p.life--; p.x += Math.sin(p.y / 12 + i) * 0.4;
        g2d.fillStyle = col; g2d.globalAlpha = Math.max(0, Math.min(1, p.life / 60));
        g2d.beginPath(); g2d.arc(p.x, p.y, p.s, 0, 7); g2d.fill();
        g2d.globalAlpha = 1;
      });
      drawPuffs(soot, 'rgba(40,36,50,.75)');
      drawPuffs(smoke, 'rgba(200,195,210,.5)');
      for (let i = soot.length - 1; i >= 0; i--) if (soot[i].life <= 0) soot.splice(i, 1);
      for (let i = smoke.length - 1; i >= 0; i--) if (smoke[i].life <= 0) smoke.splice(i, 1);

      // 火柴与火柴盒
      g2d.fillStyle = '#5a4a3a';
      g2d.fillRect(470, 350, 120, 22);
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(470, 350, 120, 22);
      g2d.fillStyle = '#9c94b8'; g2d.font = '10px sans-serif';
      g2d.fillText('火柴盒', 505, 344);
      const mx = state.dragging ? state.mx : MATCH_HOME.x, my = state.dragging ? state.my : MATCH_HOME.y;
      g2d.strokeStyle = '#c9b48a'; g2d.lineWidth = 3;
      g2d.beginPath(); g2d.moveTo(mx - 14, my + 10); g2d.lineTo(mx, my); g2d.stroke();
      g2d.lineWidth = 1;
      g2d.fillStyle = state.lit ? info.c : '#c65a41';
      g2d.beginPath(); g2d.arc(mx, my, 4.5, 0, 7); g2d.fill();
      if (state.dragging) {
        g2d.fillStyle = '#8fe0c6'; g2d.font = '11px sans-serif';
        g2d.fillText('拖到燃料上方点燃', mx - 60, my + 26);
      }

      // 氧气浓度表
      const gx = 520, gy = 90, gh2 = 180;
      g2d.strokeStyle = '#3a3358';
      g2d.strokeRect(gx - 10, gy, 20, gh2);
      const of = (state.o2 - 5) / 20;
      const ocol = state.o2 >= 19 ? '#5f93c9' : state.o2 >= 14 ? '#f0c96a' : '#c65a41';
      g2d.fillStyle = ocol;
      g2d.fillRect(gx - 8, gy + gh2 * (1 - of), 16, gh2 * of);
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('O₂ ' + state.o2 + '%', gx - 14, gy - 8);
      g2d.fillStyle = '#5c5578';
      g2d.fillText('21% 空气', gx + 16, gy + gh2 * (1 - 16 / 20) + 4);
      g2d.fillText('19% 蓝', gx + 16, gy + gh2 * (1 - 14 / 20) + 4);
      g2d.fillText('12% 红', gx + 16, gy + gh2 * (1 - 7 / 20) + 4);
      g2d.fillText('<12% 熄', gx + 16, gy + gh2 - 4);

      updateRO();
      checkGoals();
      drawSpots(g2d, t);
    }

    const drawSpots = hotspot(cv, [
      { x: 150, y: 262, r: 12, title: '火焰为什么分层', body: '外焰与氧气接触最充分、燃烧最完全，温度最高；焰心氧气少、几乎不燃烧。加热时要用外焰——酒精灯和燃气灶都是这个道理。' },
      { x: 520, y: 335, r: 12, title: '燃烧三要素', body: '可燃物（燃料）、助燃物（O₂）、着火点（温度达到燃点）。灭火就是破坏其中之一：盖灭隔绝氧气、浇水降温到燃点以下、撤走可燃物。' },
      { x: 555, y: 300, r: 11, title: '一氧化碳为什么危险', body: 'CO 与血红蛋白的结合力是 O₂ 的 200 多倍，吸入后会让人缺氧昏迷甚至死亡。它无色无味，所以炭火取暖、燃气热水器必须保证通风。' }
    ]);

    drag(cv, {
      hit(x, y) {
        const mx = state.dragging ? state.mx : MATCH_HOME.x, my = state.dragging ? state.my : MATCH_HOME.y;
        return (x - mx) * (x - mx) + (y - my) * (y - my) < 26 * 26 ? 'match' : null;
      },
      start(x, y) { state.dragging = true; state.mx = x; state.my = y; },
      move(x, y) {
        state.mx = x; state.my = y;
        if (!state.lit && (x - FLAME.x) * (x - FLAME.x) + (y - (FLAME.y - 20)) * (y - (FLAME.y - 20)) < 30 * 30) {
          if (state.o2 >= 12) {
            state.lit = true; state.extinguished = false; state.lastTier = null;
            kit.say('点着了！注意看火焰颜色与产物面板。');
          } else {
            kit.say('氧气浓度低于 12%——连火柴都点不着。燃烧三要素缺一不可。');
          }
        }
      },
      end(x, y) { state.dragging = false; }
    });

    $('b-fuel').addEventListener('change', e => { state.fuel = e.target.value; state.lit = false; state.lastTier = null; });
    $('b-o2').addEventListener('input', e => {
      state.o2 = +e.target.value;
      $('b-ov').textContent = state.o2 + ' %';
      if (state.lit && state.o2 < 12) {
        state.lit = false; state.extinguished = true; state.extFlash = 90;
        kit.say('氧气降到 12% 以下，火焰自己熄灭了。');
      }
    });
    $('b-lid').addEventListener('click', () => {
      if (state.lit) {
        state.lit = false; state.extinguished = true; state.extFlash = 90; state.lastTier = null;
        kit.say('盖灭 = 隔绝氧气。烧烧烤炉时盖盖子、油锅起火盖锅盖，都是这个原理（油锅火千万别用水浇！）。');
      } else kit.say('还没有火焰在烧。');
    });
    $('b-water').addEventListener('click', () => {
      if (state.lit) {
        state.lit = false; state.extinguished = true; state.extFlash = 90; state.lastTier = null;
        kit.say('滴水降温：把温度降到燃点以下。注意这只适用于普通固体燃料，油类与电器火灾有专门处置方式。');
      } else kit.say('还没有火焰在烧。');
    });
    $('b-record').addEventListener('click', () => {
      const t = tier(), info = TIER_INFO[state.lit ? t : 3];
      kit.record(
        { 燃料: FUELS[state.fuel].name.split('（')[0], 氧气浓度: state.o2 + ' %' },
        { 火焰状态: state.lit ? info.name : '熄灭', 火焰温度: state.lit ? '≈ ' + FUELS[state.fuel].temp[t] + ' ℃' : '—', 主要产物: state.lit ? info.prod : '—' }
      );
    });

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();
  },
  destroy() {
    if (raf) cancelAnimationFrame(raf); raf = null;
    soot.length = 0; smoke.length = 0;
  }
};
