// 实验3：酸碱滴定（v2：按住活塞滴加 + 实验套件）
import { createKit, drag, hotspot } from '../expkit.js';

const ACIDS = {
  hcl: { name: '盐酸 HCl（强酸）', strong: true, eq: 'HCl + NaOH → NaCl + H₂O' },
  hac: { name: '醋酸 CH₃COOH（弱酸，Ka=1.8×10⁻⁵）', strong: false, ka: 1.8e-5, pka: 4.76, eq: 'CH₃COOH + NaOH → CH₃COONa + H₂O' }
};
const INDICATORS = {
  phen: { name: '酚酞（8.2~10 变红）', color: pH => pH >= 8.2 ? '#e88fb0' : 'transparent' },
  mo: { name: '甲基橙（3.1 红 → 4.4 黄）', color: pH => pH <= 3.1 ? '#e07a5f' : pH <= 4.4 ? '#e8b84a' : '#e8d44a' },
  none: { name: '不加指示剂', color: () => 'transparent' }
};

let state = null;
let raf = null;

function pHat(acid, cA, VA, cB, v) {
  const Vt = (VA + v) / 1000;
  const nH0 = cA * VA / 1000;
  const nOH = cB * v / 1000;
  const nH = nH0 - nOH;
  if (acid.strong) {
    if (Math.abs(nH) < 1e-12) return 7.0;
    if (nH > 0) return Math.max(0, -Math.log10(nH / Vt));
    return Math.min(14, 14 + Math.log10(-nH / Vt));
  }
  const ka = acid.ka;
  if (nH > 1e-12 && nOH > 1e-12) return acid.pka + Math.log10(nOH / nH);
  if (nOH < 1e-12 && nH > 1e-12) {
    const c = nH / Vt;
    return Math.max(0, -Math.log10(Math.sqrt(ka * c)));
  }
  if (Math.abs(nH) < 1e-12) {
    const Cs = nH0 / Vt;
    const kb = 1e-14 / ka;
    const oh = Math.sqrt(kb * Cs);
    return Math.min(14, 14 + Math.log10(oh));
  }
  const oh = -nH / Vt;
  return Math.min(14, 14 + Math.log10(oh));
}

export default {
  id: 'titration', title: '酸碱滴定', oneLine: '按住滴定管活塞连续滴加 NaOH，观察 pH 突跃与指示剂变色，练习终点判断。',
  tags: ['中学', '分析', 'pH'],
  safety: ['虚拟实验无危险。真实滴定中酸碱溅入眼睛需立即用洗眼器冲洗15分钟。', '滴定管使用前要检查不漏液、排出尖嘴气泡。'],
  render(root, ctx) {
    state = { acid: 'hcl', cA: 0.1, VA: 20, cB: 0.1, ind: 'phen', v: 0, dripping: false, lastpH: null, eqShown: false, compT: 0 };

    const kit = createKit(root, {
      narr: '<b>按住</b>滴定管下方的活塞（蓝色小旋钮）不放，碱液连续滴下；松手即停——真实滴定练的就是这双手。',
      chal: '让变色点落在等当点 ±0.2 mL 内（接近等当点时要"半滴半滴"加）。',
      ach: 'titr_sharp',
      goals: [
        { id: 'g1', text: '滴加碱液直到指示剂变色' },
        { id: 'g2', text: '在变色时记录数据' },
        { id: 'g3', text: '变色点误差 ≤ 0.2 mL' }
      ],
      steps: [
        { t: '认识装置', d: '滴定管装已知浓度 NaOH（标准液），锥形瓶装待测酸 + 2 滴指示剂。' },
        { t: '控制滴速', d: '按住活塞滴加。前期可以快，接近理论等当点（紫色虚线）后必须逐滴。' },
        { t: '捕捉突变', d: '指示剂变色 = 变色点。注意观察 pH 曲线在等当点附近的"垂直突跃"。' },
        { t: '评估误差', d: '误差 =（变色体积 − 等当点体积）/ 等当点体积。≤0.2% 即优秀。换弱酸再试，曲线形状不同！' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>被滴定的酸</label>
            <select id="t-acid">${Object.entries(ACIDS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><label>酸浓度 <span class="val" id="t-cav">0.10 mol/L</span></label>
            <input type="range" id="t-ca" min="0.01" max="0.50" step="0.01" value="0.10"></div>
          <div class="ctl"><label>酸体积 <span class="val" id="t-vav">20 mL</span></label>
            <input type="range" id="t-va" min="10" max="40" step="1" value="20"></div>
          <div class="ctl"><label>NaOH 浓度 <span class="val" id="t-cbv">0.10 mol/L</span></label>
            <input type="range" id="t-cb" min="0.01" max="0.50" step="0.01" value="0.10"></div>
          <div class="ctl"><label>指示剂</label>
            <select id="t-ind">${Object.entries(INDICATORS).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><label>已加碱体积 <span class="val" id="t-vv">0.00 mL</span></label>
            <input type="range" id="t-v" min="0" max="40" step="0.05" value="0"></div>
          <div class="ctl"><button class="btn ghost" id="t-zero" style="width:100%">归零重来</button></div>
          <div class="ctl"><button class="btn small" id="t-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="t-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">当前 pH <b id="ro-ph">—</b></div>
        <div class="chip">理论等当点 <b id="ro-eq">— mL</b></div>
        <div class="chip">当前变色状态 <b id="ro-ic">无色</b></div>
        <div class="chip">距等当点 <b id="ro-dev">—</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('t-canvas');
    const g2d = canvas.getContext('2d');

    const vEq = () => state.cA * state.VA / state.cB;
    const curpH = () => pHat(ACIDS[state.acid], state.cA, state.VA, state.cB, state.v);
    const curColor = () => INDICATORS[state.ind].color(curpH());

    const spots = [
      { x: 53, y: 270, r: 14, title: '活塞为什么难拧', body: '接近等当点时 pH 对体积的导数极大——一滴（0.05 mL）就能让 pH 跳 2~3 个单位。所以行话叫"<b>半滴操作</b>"：让液滴悬而未落，用瓶壁沾下来。' },
      { x: 190, y: 320, r: 14, title: '指示剂的本质', body: '指示剂本身是弱酸/弱碱，分子与离子颜色不同。pH 跨过它的变色范围时比例剧变 → 颜色突变。选指示剂要让变色范围<b>落在突跃范围内</b>。' },
      { x: 455, y: 190, r: 14, title: 'pH 突跃', body: '等当点前后残存酸从 0.1% → 0，pH 从 3.x 跳到 10.x。这条"近乎垂直"的陡坡就是突跃，是滴定可行性的根基。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    drag(canvas, {
      hit(x, y) {
        const dx = x - 53, dy = y - 270;
        return (dx * dx + dy * dy < 22 * 22) ? 'stopcock' : null;
      },
      start() {
        if (state.v >= +$('t-v').max) { kit.say('滴定管空了——归零重来，或减少等当点体积。'); return; }
        state.dripping = true;
        kit.say('滴加中……松手即停。接近紫色虚线时请放慢。');
      },
      end() { state.dripping = false; }
    });

    function checkEndpoint() {
      const pH = curpH();
      if (state.lastpH !== null) {
        if (state.ind === 'phen' && state.lastpH < 8.2 && pH >= 8.2) {
          const err = Math.abs(state.v - vEq());
          kit.goal('g1', true);
          kit.say('<b>变色了</b>！变色点 ' + state.v.toFixed(2) + ' mL，距等当点 ' + err.toFixed(2) + ' mL。' + (err <= 0.2 ? '误差达标！' : '偏了——再练一次半滴操作。'));
          if (err <= 0.2) kit.goal('g3', true);
        }
        if (state.ind === 'mo' && state.lastpH <= 4.4 && pH > 4.4) {
          kit.say('甲基橙在 pH 4.4 就转黄——对强碱滴强酸来说这<b>早于</b>等当点，会带来系统误差。');
        }
        if (!state.eqShown && Math.abs(state.v - vEq()) < 0.03) {
          state.eqShown = true;
          kit.eq(ACIDS[state.acid].eq + '　<span class="muted">恰好完全中和</span>');
        }
      }
      state.lastpH = pH;
    }

    function syncSlider() {
      $('t-v').value = state.v;
      $('t-vv').textContent = state.v.toFixed(2) + ' mL';
    }

    function updateRO() {
      const pH = curpH();
      $('ro-ph').textContent = pH.toFixed(2);
      $('ro-eq').textContent = vEq().toFixed(2) + ' mL';
      const col = curColor();
      $('ro-ic').textContent = col === 'transparent' ? '无色 / 保持本色' : state.ind === 'phen' ? '粉红色' : state.ind === 'mo' ? (pH <= 3.1 ? '红色' : pH <= 4.4 ? '橙色' : '黄色') : '无变化';
      const dv = state.v - vEq();
      $('ro-dev').textContent = (dv >= 0 ? '+' : '') + dv.toFixed(2) + ' mL';
      // 实时成分（节流 300ms）
      const now = performance.now();
      if (now - state.compT > 300) {
        state.compT = now;
        const nH0 = state.cA * state.VA / 1000, nOH = state.cB * state.v / 1000;
        const reacted = Math.min(nH0, nOH);
        kit.comp([
          ['酸 H⁺ 剩余', Math.max(0, nH0 - nOH) >= 1e-6 ? ((nH0 - nOH) * 1000).toFixed(3) + ' mmol' : '0'],
          ['已生成盐', (reacted * 1000).toFixed(3) + ' mmol'],
          ['NaOH 过量', Math.max(0, nOH - nH0) >= 1e-6 ? ((nOH - nH0) * 1000).toFixed(3) + ' mmol' : '0'],
          ['瓶内总体积', (state.VA + state.v).toFixed(1) + ' mL']
        ]);
      }
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now();
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      // burette
      const bx = 40, by = 40, bw = 26, bh = 200;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(bx, by, bw, bh);
      const frac = Math.max(0, 1 - state.v / 40);
      g2d.fillStyle = '#8fc3e8'; g2d.fillRect(bx + 2, by + bh * (1 - frac), bw - 4, bh * frac);
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('滴定管 NaOH', bx - 6, by - 6);
      g2d.fillText('剩余 ' + (40 - state.v).toFixed(1) + ' mL', bx - 6, by + bh + 40);
      g2d.strokeStyle = '#5f93c9';
      g2d.beginPath(); g2d.moveTo(bx + bw / 2, by + bh); g2d.lineTo(bx + bw / 2, by + bh + 26); g2d.stroke();
      // stopcock
      g2d.fillStyle = state.dripping ? '#8fe0c6' : '#5f93c9';
      g2d.beginPath(); g2d.arc(53, 270, 9, 0, 7); g2d.fill();
      g2d.strokeStyle = '#0d0b16'; g2d.stroke();
      g2d.fillStyle = '#9c94b8';
      g2d.fillText(state.dripping ? '滴加中…' : '按住滴加', 70, 274);
      // falling drop
      if (state.dripping) {
        const dy = 276 + (t / 4 % 40);
        if (dy < 320) {
          g2d.fillStyle = '#8fc3e8';
          g2d.beginPath(); g2d.ellipse(53, dy, 3, 5, 0, 0, 7); g2d.fill();
        }
      }
      // flask
      const fx = 130, fy = 250, fw = 120, fh = 130;
      g2d.strokeStyle = '#3a3358';
      g2d.beginPath();
      g2d.moveTo(fx + 40, fy); g2d.lineTo(fx + 40, fy + 40);
      g2d.lineTo(fx, fy + fh); g2d.lineTo(fx + fw, fy + fh); g2d.lineTo(fx + 80, fy + 40);
      g2d.lineTo(fx + 80, fy); g2d.stroke();
      const col = curColor();
      g2d.fillStyle = col === 'transparent' ? 'rgba(143,195,232,.4)' : col + 'aa';
      g2d.beginPath();
      g2d.moveTo(fx + 40, fy + 50); g2d.lineTo(fx + 4, fy + fh - 4); g2d.lineTo(fx + fw - 4, fy + fh - 4);
      g2d.closePath(); g2d.fill();
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('锥形瓶：' + ACIDS[state.acid].name.split('（')[0], fx - 20, fy + fh + 24);
      g2d.fillText('当前 pH ' + curpH().toFixed(2), fx + 6, fy + 12);
      // curve chart
      const gx = 300, gy = 40, gw = 310, gh = 300;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(gx, gy, gw, gh);
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('pH–V 滴定曲线（V=加入NaOH体积）', gx + 8, gy - 6);
      const vmax = Math.max(40, Math.ceil(vEq() * 2));
      const X = v => gx + v / vmax * gw;
      const Y = pH => gy + (14 - pH) / 14 * gh;
      g2d.strokeStyle = '#221d40';
      for (let p = 0; p <= 14; p += 2) {
        g2d.beginPath(); g2d.moveTo(gx, Y(p)); g2d.lineTo(gx + gw, Y(p)); g2d.stroke();
        g2d.fillStyle = '#5c5578'; g2d.fillText(p, gx - 16, Y(p) + 4);
      }
      g2d.strokeStyle = '#8f74cf'; g2d.setLineDash([4, 4]);
      g2d.beginPath(); g2d.moveTo(X(vEq()), gy); g2d.lineTo(X(vEq()), gy + gh); g2d.stroke();
      g2d.setLineDash([]);
      g2d.fillStyle = '#8f74cf'; g2d.fillText('等当点 ' + vEq().toFixed(1) + ' mL', X(vEq()) - 40, gy + gh + 14);
      g2d.strokeStyle = '#f0c96a'; g2d.lineWidth = 2; g2d.beginPath();
      for (let v = 0; v <= vmax; v += vmax / 400) {
        const p = pHat(ACIDS[state.acid], state.cA, state.VA, state.cB, v);
        const Xp = X(v), Yp = Y(p);
        v === 0 ? g2d.moveTo(Xp, Yp) : g2d.lineTo(Xp, Yp);
      }
      g2d.stroke(); g2d.lineWidth = 1;
      g2d.fillStyle = '#8fe0c6';
      g2d.beginPath(); g2d.arc(X(state.v), Y(curpH()), 6, 0, 7); g2d.fill();
      drawSpots(g2d, t);
      updateRO();
    }

    function syncMax() {
      const vmax = Math.max(40, Math.ceil(vEq() * 2));
      $('t-v').max = vmax;
      if (+$('t-v').value > vmax) $('t-v').value = vmax;
    }

    $('t-acid').addEventListener('change', e => {
      state.acid = e.target.value; syncMax();
      state.lastpH = null; state.eqShown = false;
      kit.say(state.acid === 'hac' ? '换成弱酸了——注意曲线中段的<b>缓冲区</b>（pH 变化缓慢）和等当点 pH > 7。' : '强酸强碱滴定：等当点 pH = 7，突跃最陡。');
    });
    $('t-ca').addEventListener('input', e => { state.cA = +e.target.value; $('t-cav').textContent = state.cA.toFixed(2) + ' mol/L'; syncMax(); });
    $('t-va').addEventListener('input', e => { state.VA = +e.target.value; $('t-vav').textContent = state.VA + ' mL'; syncMax(); });
    $('t-cb').addEventListener('input', e => { state.cB = +e.target.value; $('t-cbv').textContent = state.cB.toFixed(2) + ' mol/L'; syncMax(); });
    $('t-ind').addEventListener('change', e => { state.ind = e.target.value; state.lastpH = null; });
    $('t-v').addEventListener('input', e => { state.v = +e.target.value; $('t-vv').textContent = state.v.toFixed(2) + ' mL'; });
    $('t-zero').addEventListener('click', () => {
      state.v = 0; state.lastpH = null; state.eqShown = false;
      syncSlider();
      kit.resetGoals();
      kit.say('归零。这次试试在接近等当点时放慢——半滴操作。');
    });
    $('t-record').addEventListener('click', () => {
      const err = (state.v - vEq()) / vEq() * 100;
      if (state.v > 0) {
        kit.goal('g1', true);
        kit.goal('g2', true);
        if (Math.abs(state.v - vEq()) <= 0.2) kit.goal('g3', true);
      }
      ctx.record(
        { 酸: ACIDS[state.acid].name.split('（')[0], 酸浓度: state.cA.toFixed(2) + ' mol/L', 酸体积: state.VA + ' mL', 指示剂: INDICATORS[state.ind].name },
        { 变色时已加碱: state.v.toFixed(2) + ' mL', 理论等当点: vEq().toFixed(2) + ' mL', 相对误差: err.toFixed(2) + '%', 评价: Math.abs(err) < 2 ? '终点判断优秀' : Math.abs(err) < 5 ? '较好' : '偏差较大，注意半滴操作' }
      );
    });

    const loop = () => {
      if (state.dripping) {
        const vmax = +$('t-v').max;
        state.v = Math.min(vmax, state.v + 0.02);
        syncSlider();
        if (state.v >= vmax) { state.dripping = false; }
      }
      checkEndpoint();
      draw();
      raf = requestAnimationFrame(loop);
    };
    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
