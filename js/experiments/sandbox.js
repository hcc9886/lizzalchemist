// 实验11：沙盒混合台
import { createKit, hotspot } from '../expkit.js';

const REAGENTS = {
  hcl: { name: '稀盐酸', f: 'HCl' },
  h2so4: { name: '稀硫酸', f: 'H₂SO₄' },
  naoh: { name: 'NaOH 溶液', f: 'NaOH' },
  caoh2: { name: '石灰水', f: 'Ca(OH)₂' },
  cuso4: { name: 'CuSO₄ 溶液', f: 'CuSO₄', tint: '#4f93c4' },
  fecl3: { name: 'FeCl₃ 溶液', f: 'FeCl₃', tint: '#c9a04a' },
  na2co3: { name: 'Na₂CO₃ 溶液', f: 'Na₂CO₃' },
  cabbage: { name: '紫甘蓝汁', f: '花青素', tint: '#7a4fa0' },
  phen: { name: '酚酞', f: '酚酞' },
  fe: { name: '铁钉', f: 'Fe', solid: 'nail' },
  zn: { name: '锌粒', f: 'Zn', solid: 'pellets' },
  caco3: { name: '大理石', f: 'CaCO₃', solid: 'chunks' },
  water: { name: '水', f: 'H₂O' }
};

const REACTIONS = {
  'caco3|hcl': { type: 'gas', gas: 'CO₂', eq: 'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑', say: '大理石溶解，CO₂ 气泡翻腾——实验室制二氧化碳就是这么做的。' },
  'caco3|h2so4': { type: 'gas', gas: 'CO₂', eq: 'CaCO₃ + H₂SO₄ → CaSO₄ + H₂O + CO₂↑', say: '冒泡但很快变慢：微溶的 CaSO₄ 盖住大理石表面，把反应"封"住了。' },
  'h2so4|na2co3': { type: 'gas', gas: 'CO₂', eq: 'Na₂CO₃ + H₂SO₄ → Na₂SO₄ + H₂O + CO₂↑', say: '碳酸钠遇酸，CO₂ 气泡剧烈冒出。' },
  'hcl|na2co3': { type: 'gas', gas: 'CO₂', eq: 'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑', say: '碳酸钠 + 盐酸：CO₂ 气泡剧烈冒出。' },
  'fe|hcl': { type: 'gas', gas: 'H₂', slow: true, eq: 'Fe + 2HCl → FeCl₂ + H₂↑', say: '铁钉表面冒出细密的小气泡（H₂），溶液渐渐显浅绿色（Fe²⁺）。' },
  'h2so4|zn': { type: 'gas', gas: 'H₂', eq: 'Zn + H₂SO₄ → ZnSO₄ + H₂↑', say: '锌粒溶解，H₂ 气泡密集——实验室制氢气的经典方法。' },
  'cuso4|naoh': { type: 'precip', pc: '#4f93c4', eq: 'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄', say: '蓝色絮状沉淀 Cu(OH)₂ 慢慢沉底。' },
  'fecl3|naoh': { type: 'precip', pc: '#b05a2a', eq: 'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl', say: '红褐色沉淀 Fe(OH)₃ 生成——像铁锈一样的颜色。' },
  'caoh2|na2co3': { type: 'precip', pc: '#e8dfc8', eq: 'Ca(OH)₂ + Na₂CO₃ → CaCO₃↓ + 2NaOH', say: '白色沉淀 CaCO₃——工业"纯碱制烧碱"的原理。' },
  'cuso4|fe': { type: 'deposit', dc: '#c8843c', eq: 'Fe + CuSO₄ → FeSO₄ + Cu', say: '铁钉表面镀上一层红色的铜——"曾青得铁则化为铜"，西汉就记载的湿法炼铜。' },
  'hcl|naoh': { type: 'heat', eq: 'HCl + NaOH → NaCl + H₂O（放热）', say: '酸碱中和放热，杯壁发烫。加紫甘蓝汁或酚酞还能看出酸碱谁过量。' },
  'cabbage|hcl': { type: 'color', c: '#c65a41', say: '紫甘蓝汁变红——花青素遇酸显红色。' },
  'cabbage|naoh': { type: 'color', c: '#3f9a5a', say: '紫甘蓝汁变绿——花青素遇碱显绿色。' },
  'phen|naoh': { type: 'color', c: '#e88fb0', say: '酚酞变粉红——它只在碱性环境显色。' }
};

let raf = null, state = null;
const bubbles = [], falls = [];

export default {
  id: 'sandbox', title: '沙盒混合台', oneLine: '自由拖动试剂卡进烧杯，组合出气体、沉淀与变色——安全前提下想怎么玩就怎么玩。',
  tags: ['零基础', '自由探索', '复分解'],
  safety: ['沙盒只提供安全试剂组合。现实中 84消毒液（次氯酸钠）与洁厕灵（盐酸）混合会产生剧毒氯气，绝对禁止！', '现实化学实验请佩戴护目镜，废液必须分类回收，不明确性质的试剂不要混。'],
  render(root, ctx) {
    state = { contents: [], said: '' };

    const kit = createKit(root, {
      narr: '这是你的自由实验台：从试剂架把<b>试剂卡</b>拖进烧杯（最多 3 种），观察气泡、沉淀与颜色变化。',
      chal: '至少做出一类产气反应、一类沉淀反应、一次指示剂变色。',
      ach: 'sandbox_first',
      goals: [
        { id: 'g1', text: '做出产气反应（气泡）' },
        { id: 'g2', text: '做出沉淀反应（↓）' },
        { id: 'g3', text: '用指示剂看到变色' }
      ],
      steps: [
        { t: '拖入第一瓶', d: '按住试剂卡拖到烧杯上松手。先试试<b>稀盐酸 + 大理石</b>。' },
        { t: '产气', d: '酸 + 碳酸盐 → CO₂↑；酸 + 活泼金属（Zn/Fe）→ H₂↑。气泡是哪种气体，反应方程式会告诉你。' },
        { t: '沉淀', d: '试试 <b>NaOH + CuSO₄</b>（蓝色沉淀）和 <b>NaOH + FeCl₃</b>（红褐色沉淀）——沉淀颜色是鉴定离子的线索。' },
        { t: '变色与置换', d: '加<b>紫甘蓝汁</b>或<b>酚酞</b>看酸碱变色；再试 <b>铁钉 + CuSO₄</b>——两千年前的湿法炼铜。' }
      ]
    });
    kit.record = (p, r) => ctx.record(p, r);

    root.insertAdjacentHTML('beforeend', `
      <section class="exp-stage"><canvas id="s-canvas" width="640" height="380"></canvas></section>
      <div class="rg-shelf" id="s-shelf">
        ${Object.entries(REAGENTS).map(([k, v]) => `
          <div class="rg-card" data-k="${k}">
            <span class="rg-dot" style="background:${v.tint || (v.solid ? '#8a8498' : '#9fb8d0')}"></span>
            <span class="rg-name">${v.name}</span>
            <span class="rg-f">${v.f}</span>
          </div>`).join('')}
      </div>
      <div class="ctl" style="max-width:300px;margin:0 auto">
        <button class="btn ghost" id="s-dump" style="width:100%">倒掉废液（回收桶）</button>
      </div>
      <div class="ctl"><button class="btn small" id="s-record">记录数据到实验本</button></div>`);

    const $ = id => root.querySelector('#' + id);
    const cv = $('s-canvas');
    const g2d = cv.getContext('2d');
    const B = { x: 210, y: 90, w: 220, h: 250 }; // 烧杯

    const liquidColor = () => {
      let c = null;
      for (const k of state.contents) if (REAGENTS[k].tint) { c = REAGENTS[k].tint; break; }
      return c;
    };

    function checkReactions() {
      const hits = [];
      for (let i = 0; i < state.contents.length; i++)
        for (let j = i + 1; j < state.contents.length; j++) {
          const pair = [state.contents[i], state.contents[j]].sort().join('|');
          if (REACTIONS[pair]) hits.push(REACTIONS[pair]);
        }
      if (!hits.length) {
        if (state.contents.length >= 2) kit.say('没有明显现象。有些组合就是不反应——这也是重要的观察结论。');
        return;
      }
      let gas = false, precip = false, color = false, heat = false, deposit = null;
      let lc = liquidColor();
      const says = [];
      let eqShown = false;
      for (const h of hits) {
        if (h.type === 'gas') { gas = true; state.gas = h.gas; }
        if (h.type === 'precip') { precip = true; state.pc = h.pc; }
        if (h.type === 'color') { color = true; lc = h.c; }
        if (h.type === 'heat') heat = true;
        if (h.type === 'deposit') deposit = h.dc;
        if (h.say) says.push(h.say);
        if (h.eq && !eqShown) { kit.eq(h.eq); eqShown = true; }
      }
      state.lc = lc;
      state.steam = heat;
      state.bubRate = gas ? (hits.filter(h => h.type === 'gas').every(h => h.slow) ? 0.35 : 0.9) : 0;
      if (precip && !state.precip) { state.precip = 1; for (let i = 0; i < 26; i++) falls.push({ x: B.x + 20 + Math.random() * (B.w - 40), y: B.y + 60 + Math.random() * 40, vy: 0.6 + Math.random() * 0.8 }); }
      if (deposit) state.dc = deposit;
      if (gas) kit.goal('g1');
      if (precip) kit.goal('g2');
      if (color) kit.goal('g3');
      kit.say(says.join(' '));
    }

    function addReagent(key) {
      if (state.contents.includes(key)) { kit.say('烧杯里已经有' + REAGENTS[key].name + '了。'); return; }
      if (state.contents.length >= 3) { kit.say('烧杯最多容纳 3 种试剂——先"倒掉废液"再来。'); return; }
      state.contents.push(key);
      if (!state.lc && !REAGENTS[key].solid) state.lc = liquidColor();
      checkReactions();
      if (state.contents.length === 1) kit.say('加入了' + REAGENTS[key].name + '。再拖一种进来试试反应。');
    }

    // 试剂卡拖拽（HTML ghost → canvas）
    let over = false;
    root.querySelectorAll('.rg-card').forEach(card => {
      card.addEventListener('pointerdown', e => {
        e.preventDefault();
        const key = card.dataset.k;
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost';
        ghost.textContent = REAGENTS[key].name;
        document.body.appendChild(ghost);
        const mv = ev => {
          ghost.style.left = ev.clientX + 12 + 'px';
          ghost.style.top = ev.clientY + 12 + 'px';
          const r = cv.getBoundingClientRect();
          const inx = ev.clientX >= r.left && ev.clientX <= r.right;
          const iny = ev.clientY >= r.top && ev.clientY <= r.bottom;
          over = inx && iny;
          ghost.classList.toggle('ok', over);
        };
        const up = () => {
          document.removeEventListener('pointermove', mv);
          document.removeEventListener('pointerup', up);
          ghost.remove();
          if (over) addReagent(key);
          over = false;
        };
        document.addEventListener('pointermove', mv);
        document.addEventListener('pointerup', up);
      });
    });

    $('s-dump').addEventListener('click', () => {
      state.contents = [];
      state.pc = null; state.precip = 0; state.gas = null; state.bubRate = 0;
      state.steam = false; state.dc = null; state.lc = null;
      falls.length = 0;
      kit.say('废液倒入回收桶。现实中废液必须按性质分类回收——酸碱不能直接进下水道。');
    });
    $('s-record').addEventListener('click', () => {
      const fx = [];
      if (state.gas) fx.push('气体↑(' + state.gas + ')');
      if (state.precip) fx.push('沉淀↓');
      if (state.lc) fx.push('颜色变化');
      if (state.steam) fx.push('放热');
      if (state.dc) fx.push('镀铜');
      kit.record(
        { 试剂: state.contents.map(k => REAGENTS[k].name).join(' + ') || '（空）' },
        { 现象: fx.join('、') || '无明显现象' }
      );
    });

    const drawSpots = hotspot(cv, [
      { x: 480, y: 130, r: 12, title: '指示剂为什么会变色', body: '紫甘蓝里的花青素在不同酸碱环境下的分子结构不同，吸收的光波长不同，于是呈现红→紫→绿的变化。酚酞则只在碱性环境显粉红色。指示剂让我们"看见"溶液的酸碱性。' },
      { x: 480, y: 250, r: 12, title: '沉淀颜色是鉴定线索', body: 'Cu(OH)₂ 蓝色絮状、Fe(OH)₃ 红褐色、CaCO₃ 白色——化学家用沉淀颜色+简单试剂就能初步判断溶液里有哪些离子。' },
      { x: 480, y: 330, r: 12, title: '⚠ 现实安全红线', body: '84消毒液（次氯酸钠）+ 洁厕灵（盐酸）→ 氯气，剧毒，家庭清洁时绝对不能混用！本沙盒不提供这类危险组合。' }
    ]);

    function drawSolids(by2) {
      state.contents.filter(k => REAGENTS[k].solid).forEach((k, idx) => {
        const kind = REAGENTS[k].solid;
        const yy = by2 - 8;
        if (kind === 'nail') {
          const nailCol = state.dc || '#7a8699';
          g2d.save();
          g2d.translate(B.x + 55 + idx * 8, yy);
          g2d.rotate(-0.08);
          g2d.fillStyle = nailCol;
          g2d.fillRect(-6, -30, 12, 40);
          g2d.beginPath(); g2d.moveTo(-6, -30); g2d.lineTo(0, -40); g2d.lineTo(6, -30); g2d.closePath(); g2d.fill();
          g2d.restore();
        } else if (kind === 'pellets') {
          g2d.fillStyle = '#9aa4b5';
          for (let i = 0; i < 7; i++) {
            g2d.beginPath();
            g2d.arc(B.x + 100 + (i % 4) * 14 - 20, by2 - 5 - Math.floor(i / 4) * 9, 5, 0, 7);
            g2d.fill();
          }
        } else {
          g2d.fillStyle = '#d9d2bd';
          for (let i = 0; i < 5; i++) {
            g2d.beginPath();
            g2d.moveTo(B.x + 90 + i * 18, by2 - 3);
            g2d.lineTo(B.x + 96 + i * 18, by2 - 14);
            g2d.lineTo(B.x + 104 + i * 18, by2 - 3);
            g2d.closePath(); g2d.fill();
          }
        }
      });
    }

    function draw() {
      const w = 640, h = 380;
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      const t = performance.now();

      // 烧杯
      g2d.strokeStyle = '#3a3358'; g2d.lineWidth = 2.5;
      g2d.beginPath();
      g2d.moveTo(B.x, B.y); g2d.lineTo(B.x, B.y + B.h); g2d.lineTo(B.x + B.w, B.y + B.h); g2d.lineTo(B.x + B.w, B.y);
      g2d.stroke(); g2d.lineWidth = 1;
      const by2 = B.y + B.h - 14;
      const liqPresent = state.contents.length > 0;
      if (liqPresent) {
        const col = state.lc;
        g2d.fillStyle = col ? col + '55' : 'rgba(159,184,208,.3)';
        g2d.fillRect(B.x + 3, B.y + 40, B.w - 6, B.h - 43);
        // 液面
        g2d.strokeStyle = col || 'rgba(159,184,208,.6)';
        g2d.beginPath(); g2d.moveTo(B.x + 3, B.y + 40); g2d.lineTo(B.x + B.w - 3, B.y + 40); g2d.stroke();
      }
      drawSolids(by2);
      // 沉淀层
      if (state.precip) {
        g2d.fillStyle = state.pc + 'cc';
        g2d.fillRect(B.x + 3, by2 - 10, B.w - 6, 10);
      }
      // 下降沉淀颗粒
      for (let i = falls.length - 1; i >= 0; i--) {
        const p = falls[i];
        p.y += p.vy;
        g2d.fillStyle = (state.pc || '#ccc') + 'dd';
        g2d.beginPath(); g2d.arc(p.x, p.y, 2.5, 0, 7); g2d.fill();
        if (p.y >= by2 - 8) falls.splice(i, 1);
      }
      // 气泡
      if (state.bubRate > 0 && Math.random() < state.bubRate) {
        bubbles.push({ x: B.x + 30 + Math.random() * (B.w - 60), y: by2 - 4, vy: -(1 + Math.random() * 1.2), r: 2 + Math.random() * 3 });
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        b.y += b.vy;
        g2d.strokeStyle = 'rgba(232,223,200,.65)';
        g2d.beginPath(); g2d.arc(b.x, b.y, b.r, 0, 7); g2d.stroke();
        if (b.y <= B.y + 44) bubbles.splice(i, 1);
      }
      if (state.gas) {
        g2d.fillStyle = '#8fe0c6'; g2d.font = '12px sans-serif';
        g2d.fillText(state.gas + '↑', B.x + B.w + 8, B.y + 50);
      }
      // 放热蒸汽
      if (state.steam) {
        g2d.strokeStyle = 'rgba(220,215,230,.4)';
        for (let i = 0; i < 3; i++) {
          g2d.beginPath();
          for (let s = 0; s < 18; s++) {
            const yy = B.y + 30 - s * 4;
            const xx = B.x + 60 + i * 50 + Math.sin(t / 200 + s / 3 + i) * 6;
            s === 0 ? g2d.moveTo(xx, yy) : g2d.lineTo(xx, yy);
          }
          g2d.stroke();
        }
        g2d.fillStyle = '#e0704a'; g2d.font = '12px sans-serif';
        g2d.fillText('放热 ♨', B.x + B.w + 8, B.y + 70);
      }
      // 标签
      g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
      g2d.fillText('烧杯（' + state.contents.length + '/3 种试剂）', B.x, B.y - 10);
      if (state.contents.length) {
        g2d.fillStyle = '#e8dfc8'; g2d.font = '12px sans-serif';
        g2d.fillText(state.contents.map(k => REAGENTS[k].f).join(' + '), B.x + 4, B.y + 28);
      }

      drawSpots(g2d, t);
    }

    function loop() {
      draw();
      raf = requestAnimationFrame(loop);
    }
    loop();
  },
  destroy() {
    if (raf) cancelAnimationFrame(raf); raf = null;
    bubbles.length = 0; falls.length = 0;
  }
};
