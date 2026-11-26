// 实验9：分子搭建器（VSEPR 价层电子对互斥理论）
import { createKit, drag } from '../expkit.js';

const CENTRALS = {
  C: { name: '碳 C', val: 4, color: '#5c5578' },
  N: { name: '氮 N', val: 5, color: '#3b6fc9' },
  O: { name: '氧 O', val: 6, color: '#c65a41' }
};
const TERMINALS = {
  H: { name: '氢 H', color: '#d9d9e8' },
  Cl: { name: '氯 Cl', color: '#7fc97f' },
  O: { name: '氧 O', color: '#c65a41' }
};

let raf = null, state = null;

export default {
  id: 'molecule', title: '分子搭建器（VSEPR）', oneLine: '把原子拖到中心原子周围，价层电子对互斥理论自动算出分子形状。',
  tags: ['大学', '结构', 'VSEPR'],
  safety: ['虚拟实验无危险。分子结构是真实测得（X 射线衍射等），VSEPR 是快速预测模型。'],
  render(root, ctx) {
    state = { central: 'C', terms: [], rot: 0, rotV: 0.004, drag: null, found: { ch4: false, nh3: false, h2o: false }, order: [] };

    const kit = createKit(root, {
      narr: '选好中心原子后，把右侧原子<b>拖到中央的原子旁</b>（或点"加入端原子"）。电子对互相排斥——它们会尽量离得远，形状就出来了。',
      chal: '依次搭出 CH₄（正四面体）、NH₃（三角锥）和 H₂O（V 形）——体会"孤对电子挤占空间"。',
      ach: 'molecule_master',
      goals: [
        { id: 'g1', text: '搭出 CH₄：正四面体，键角 109.5°' },
        { id: 'g2', text: '搭出 NH₃：三角锥（1 对孤对电子）' },
        { id: 'g3', text: '搭出 H₂O：V 形（2 对孤对电子）' }
      ],
      steps: [
        { t: '价层电子对数', d: 'σ键数 + 孤对电子对数 = 价层电子对数。它决定"电子对骨架"的几何（2→直线，3→三角，4→四面体）。' },
        { t: '孤对电子更"胖"', d: '孤对电子只受一个核吸引，云更肥大，排斥更强：孤对–孤对 > 孤对–键 > 键–键。所以 NH₃ 键角 107°<109.5°，H₂O 104.5°。' },
        { t: '多重键', d: '双键算 1 个电子对域，但排斥更强。CO₂（两个双键）是直线形。' },
        { t: '极性判断', d: '键有极性 ≠ 分子有极性。CO₂ 键极性但对称抵消 → 非极性；H₂O 不对称 → 强极性（氢键的根源）。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>中心原子</label>
            <select id="m-c">${Object.entries(CENTRALS).map(([k, v]) => `<option value="${k}">${v.name}（${v.val} 个价电子）</option>`).join('')}</select></div>
          <div class="ctl"><label>端原子类型</label>
            <select id="m-t">${Object.entries(TERMINALS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><button class="btn primary" id="m-add" style="width:100%">加入端原子</button>
            <button class="btn ghost" id="m-del" style="width:100%;margin-top:8px">移除最后一个</button>
            <button class="btn ghost" id="m-bond" style="width:100%;margin-top:8px">最后一键升为双键</button>
            <button class="btn ghost" id="m-reset" style="width:100%;margin-top:8px">清空重来</button></div>
          <div class="ctl"><button class="btn small" id="m-record">记录分子到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="m-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">分子式 <b id="ro-f">—</b></div>
        <div class="chip">AXₙEₘ <b id="ro-ax">—</b></div>
        <div class="chip">分子形状 <b id="ro-shape">—</b></div>
        <div class="chip">理想键角 <b id="ro-ang">—</b></div>
        <div class="chip">孤对电子 <b id="ro-lp">—</b></div>
        <div class="chip">分子极性 <b id="ro-pol">—</b></div>
      </div>
      <table class="data" id="m-shapes"><thead><tr><th>价层电子对数</th><th>构型</th><th>实例</th></tr></thead><tbody>
        <tr><td>2</td><td>直线形 180°</td><td>CO₂（AX₂）</td></tr>
        <tr><td>3</td><td>平面三角 120°</td><td>BF₃（AX₃）/ SO₂（AX₂E 弯曲）</td></tr>
        <tr><td>4</td><td>正四面体 109.5°</td><td>CH₄（AX₄）/ NH₃（AX₃E 三角锥）/ H₂O（AX₂E₂ V形）</td></tr>
      </tbody></table>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('m-canvas');
    const g2d = canvas.getContext('2d');

    // geometry templates: positions on unit circle (degrees), for terminals then LP
    const GEO = {
      2: { bond: [0, 180], lp: [] },
      3: { bond: [90, 210, 330], lp: [] },
      4: { bond: [109, 231, 289, 47], lp: [] }, // 2D projection of tetrahedral
      '3+1': { bond: [105, 220, 335], lp: [350] },
      '2+2': { bond: [130, 230], lp: [55, 305] },
      '2+1': { bond: [130, 230], lp: [355] }
    };

    function analyze() {
      const c = CENTRALS[state.central];
      const n = state.terms.length;
      const doubles = state.order.filter(o => o === 2).length;
      // lone pairs: valence electrons of central - electrons used in bonds (1 per single bond from central, 2 per double)
      const used = state.order.reduce((s, o) => s + o, 0);
      const lp = Math.floor(Math.max(0, c.val - used) / 2);
      const sn = n + lp;
      let shape = '—', ang = '—', key = String(sn);
      if (n === 0) { shape = '只有一个原子'; ang = '—'; }
      else if (lp === 0 && n === 2) { shape = '直线形'; ang = '180°'; }
      else if (lp === 0 && n === 3) { shape = '平面三角形'; ang = '120°'; }
      else if (lp === 0 && n === 4) { shape = '正四面体'; ang = '109.5°'; }
      else if (lp === 1 && n === 3) { shape = '三角锥形'; ang = '107°（被孤对压小）'; }
      else if (lp === 2 && n === 2) { shape = 'V 形（弯曲）'; ang = '104.5°'; }
      else if (lp === 1 && n === 2) { shape = 'V 形（弯曲）'; ang = '≈120°（如 SO₂）'; }
      else { shape = '不常见组合'; ang = '—'; key = n + '+' + lp; }
      // formula
      const count = {};
      state.terms.forEach(t => { count[t] = (count[t] || 0) + 1; });
      let f = state.central;
      Object.entries(count).forEach(([t, k]) => { f += t + (k > 1 ? k : ''); });
      // polarity (rough): symmetric shapes nonpolar
      const polar = (n === 0 || ['只有一个原子'].includes(shape)) ? '—'
        : (shape === '直线形' && doubles >= 1 && new Set(state.terms).size === 1) ? '非极性（对称抵消）'
        : (shape === '平面三角形' && lp === 0 && new Set(state.terms).size === 1) ? '非极性（对称抵消）'
        : (shape === '正四面体' && lp === 0 && new Set(state.terms).size === 1) ? '非极性（对称抵消）'
        : '极性';
      return { f, ax: n === 0 ? '—' : 'AX' + n + (lp ? 'E' + lp : ''), shape, ang, lp, key, polar };
    }

    function checkFound() {
      const a = analyze();
      const set = new Set(state.terms);
      if (state.central === 'C' && set.size === 1 && set.has('H') && state.terms.length === 4 && !state.found.ch4) {
        state.found.ch4 = true; kit.goal('g1', true);
        kit.say('<b>CH₄ 正四面体</b>！4 对电子互斥均分 109.5°。这就是有机化学的空间起点。');
      }
      if (state.central === 'N' && set.size === 1 && set.has('H') && state.terms.length === 3 && !state.found.nh3) {
        state.found.nh3 = true; kit.goal('g2', true);
        kit.say('<b>NH₃ 三角锥</b>！那对"隐形"的孤对电子把键角压到 107°。氨的碱性、极性都来自它。');
      }
      if (state.central === 'O' && set.size === 1 && set.has('H') && state.terms.length === 2 && !state.found.h2o) {
        state.found.h2o = true; kit.goal('g3', true);
        kit.say('<b>H₂O V 形</b>！两对孤对电子挤占空间 → 104.5°。生命的溶剂正因为这个弯角而如此特别。');
      }
    }

    function termPos(i, n, lpN) {
      const geo = GEO[lpN === 0 ? String(n) : n + '+' + lpN] || GEO[String(Math.max(2, n + lpN))];
      if (!geo) return { x: 0, y: 0 };
      const deg = geo.bond[i % geo.bond.length];
      return deg;
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now();
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      const cx = 250, cy = 220, R = 105;
      const a = analyze();
      const geo = GEO[a.key] || GEO[String(Math.min(4, state.terms.length + a.lp))] || GEO[4];
      state.rot += state.rotV;
      // central atom
      g2d.beginPath(); g2d.arc(cx, cy, 26, 0, 7);
      g2d.fillStyle = CENTRALS[state.central].color; g2d.fill();
      g2d.strokeStyle = '#0d0b16'; g2d.stroke();
      g2d.fillStyle = '#fff'; g2d.font = 'bold 16px sans-serif';
      g2d.fillText(state.central, cx - 6, cy + 6);
      // bonds + terminals
      state.terms.forEach((tk, i) => {
        const deg = geo && geo.bond && geo.bond.length ? geo.bond[i] : (i * 360 / Math.max(1, state.terms.length));
        const rad = (deg + state.rot * 57.3) * Math.PI / 180;
        const tx = cx + Math.cos(rad) * R, ty = cy + Math.sin(rad) * R * 0.86;
        const ord = state.order[i] || 1;
        g2d.strokeStyle = '#a49cc0'; g2d.lineWidth = ord === 2 ? 2 : 3.5;
        if (ord === 2) {
          const dx = ty - cy, dy2 = cx - tx;
          const len = Math.hypot(dx, dy2) || 1;
          const ox = dx / len * 4, oy = dy2 / len * 4;
          g2d.beginPath(); g2d.moveTo(cx + ox, cy + oy); g2d.lineTo(tx + ox, ty + oy); g2d.stroke();
          g2d.beginPath(); g2d.moveTo(cx - ox, cy - oy); g2d.lineTo(tx - ox, ty - oy); g2d.stroke();
        } else {
          g2d.beginPath(); g2d.moveTo(cx, cy); g2d.lineTo(tx, ty); g2d.stroke();
        }
        g2d.lineWidth = 1;
        g2d.beginPath(); g2d.arc(tx, ty, 15, 0, 7);
        g2d.fillStyle = TERMINALS[tk].color; g2d.fill();
        g2d.strokeStyle = '#0d0b16'; g2d.stroke();
        g2d.fillStyle = '#141126'; g2d.font = 'bold 12px sans-serif';
        g2d.fillText(tk, tx - 5, ty + 4);
        // bond angle label for pairs
        if (i === 1 && state.terms.length >= 2) {
          g2d.fillStyle = '#8fe0c6'; g2d.font = '11px sans-serif';
          g2d.fillText('键角', cx + 28, cy - 14);
        }
      });
      // lone pairs (porkchop lobes as dot pairs)
      if (geo && geo.lp) {
        geo.lp.forEach(deg => {
          const rad = (deg + state.rot * 57.3) * Math.PI / 180;
          const lx = cx + Math.cos(rad) * (R * 0.72), ly = cy + Math.sin(rad) * (R * 0.72) * 0.86;
          g2d.fillStyle = 'rgba(240,201,106,.9)';
          g2d.beginPath(); g2d.arc(lx - 5, ly, 4, 0, 7); g2d.fill();
          g2d.beginPath(); g2d.arc(lx + 5, ly, 4, 0, 7); g2d.fill();
          g2d.fillStyle = '#f0c96a'; g2d.font = '10px sans-serif';
          g2d.fillText('孤对', lx - 12, ly + 20);
        });
      }
      // formula display
      g2d.fillStyle = '#f0c96a'; g2d.font = '22px serif';
      g2d.fillText(a.f, 490, 120);
      g2d.font = '13px sans-serif'; g2d.fillStyle = '#9c94b8';
      g2d.fillText(a.shape, 490, 145);
      g2d.fillText(a.ax + ' · 键角 ' + a.ang, 490, 165);
      g2d.fillStyle = '#5c5578';
      g2d.fillText('电子对互斥 → 尽量远离 → 形状', 430, 360);
      g2d.fillText('虚影位置 = 电子对最远的落点', 430, 380);
      drawShelf();
      checkFound();
    }

    function loop() { draw(); raf = requestAnimationFrame(loop); }

    // 拖拽：把端原子符号区域拖到中心附近 = 加入该原子（教学版"拖拽组装"）
    drag(canvas, {
      hit(x, y) {
        if (x > 560 && x < 620 && y > 250 && y < 340) return 'shelf';
        return null;
      },
      start() { kit.say('松手即把该原子接到中心（或点左侧按钮）。'); },
      end(x, y, hit) {
        if (hit === 'shelf') {
          const cx = 250, cy = 220;
          const d = Math.hypot(x - cx, y - cy);
          if (d < 150 && state.terms.length < 6) addTerm($('m-t').value);
          else kit.say('拖到中心原子附近再松手。');
        }
      }
    });

    function addTerm(tk) {
      if (state.terms.length >= 6) return;
      state.terms.push(tk);
      state.order.push(1);
      kit.say('已加一个 ' + TERMINALS[tk].name + '。看形状怎么变——电子对在"抢地盘"。');
    }

    // 虚拟原子架绘制（画布右下）
    function drawShelf() {
      const t = $('m-t').value;
      g2d.fillStyle = '#221d40';
      g2d.fillRect(556, 246, 66, 98);
      g2d.strokeStyle = '#3a3358';
      g2d.strokeRect(556, 246, 66, 98);
      g2d.fillStyle = '#9c94b8'; g2d.font = '10px sans-serif';
      g2d.fillText('原子架（拖我）', 560, 260);
      g2d.beginPath(); g2d.arc(590, 300, 15, 0, 7);
      g2d.fillStyle = TERMINALS[t].color; g2d.fill();
      g2d.strokeStyle = '#0d0b16'; g2d.stroke();
      g2d.fillStyle = '#141126'; g2d.font = 'bold 12px sans-serif';
      g2d.fillText(t, 585, 304);
    }

    function renderRO() {
      const a = analyze();
      $('ro-f').textContent = a.f;
      $('ro-ax').textContent = a.ax;
      $('ro-shape').textContent = a.shape;
      $('ro-ang').textContent = a.ang;
      $('ro-lp').textContent = a.lp ? a.lp + ' 对' : '0 对';
      $('ro-pol').textContent = a.polar;
    }
    const roTimer = setInterval(renderRO, 300);
    this._timer = roTimer;

    $('m-c').addEventListener('change', e => { state.central = e.target.value; state.terms = []; state.order = []; kit.say('中心原子换成' + CENTRALS[state.central].name + '——价电子数决定它能"拉住"几个键。'); });
    $('m-add').addEventListener('click', () => addTerm($('m-t').value));
    $('m-del').addEventListener('click', () => { state.terms.pop(); state.order.pop(); });
    $('m-bond').addEventListener('click', () => {
      const i = state.order.length - 1;
      if (i >= 0) state.order[i] = state.order[i] === 1 ? 2 : 1;
      kit.say(state.order[i] === 2 ? '升级为双键：占 1 个电子对域，但排斥更强（CO₂ 直线形的秘密）。' : '已降回单键。');
    });
    $('m-reset').addEventListener('click', () => {
      state.terms = []; state.order = [];
      state.found = { ch4: false, nh3: false, h2o: false };
      kit.resetGoals();
      kit.say('清空。挑战：CH₄ → NH₃ → H₂O，见证孤对电子一步步"挤弯"分子。');
    });
    $('m-record').addEventListener('click', () => {
      const a = analyze();
      if (a.ax === '—') { kit.say('先搭一个分子再记录。'); return; }
      ctx.record(
        { 分子: a.f, 中心原子: CENTRALS[state.central].name },
        { AXnEm: a.ax, 形状: a.shape, 理想键角: a.ang, 孤对电子: a.lp + ' 对', 极性: a.polar }
      );
    });

    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); if (this._timer) clearInterval(this._timer); raf = null; }
};
