// 实验1：密度与浮沉（v4：全屏 2.5D 舞台 + 悬浮 HUD + 称重 / 倾倒 / 排水法真实交互）
import { achieve, canvasXY } from '../expkit.js';
import { play, setAmbient } from '../audio.js';

const SOLIDS = {
  wood: { name: '木块', icon: '🪵', m: 80,  rho: 0.60 },
  ice:  { name: '冰块', icon: '🧊', m: 100, rho: 0.92 },
  alu:  { name: '铝块', icon: '⬜', m: 54,  rho: 2.70 },
  iron: { name: '铁块', icon: '⬛', m: 156, rho: 7.80 }
};
const LIQUIDS = {
  water: { name: '清水',   rho: 1.00, color: '#3f7fb5', icon: '💧' },
  brine: { name: '盐水',   rho: 1.20, color: '#33608c', icon: '🧂' },
  oil:   { name: '食用油', rho: 0.91, color: '#c8a34a', icon: '🛢️' }
};
const GOALS = [
  { k: 'm',     t: '称出质量' },
  { k: 'V',     t: '测出体积（排水法）' },
  { k: 'rho',   t: '算出密度 ρ = m ÷ V' },
  { k: 'float', t: '看到漂浮' },
  { k: 'sink',  t: '看到沉底' }
];
const STEPS = [
  { t: '称质量',     d: '把左边的木块拖上天平托盘，读数会滚动到 80.00 g' },
  { t: '倒水入量筒', d: '把清水瓶拖到量筒口上方按住不动，倾倒约 100 mL' },
  { t: '排水测体积', d: '木块放进量筒会漂浮——按住它压到完全浸没，看 V 读数跳到 133.3' },
  { t: '沉浮与分层', d: '把物体拖进水槽看漂浮/沉底；再把油倒进水槽，看分层' }
];

const W = 1280, H = 640, BENCH = 556;
const CYL  = { x: 520, y: 172, w: 84,  h: 384, cap: 250 };
const TANK = { x: 748, y: 255, w: 432, h: 301, cap: 520 };
const BAL  = { x: 88,  y: 428, w: 258, h: 128, panX: 217, panY: 330, panW: 158 };
const PPM = 0.52;                       // 水槽：px per mL
const CYL_SC = (CYL.h - 14) / CYL.cap;  // 量筒：px per mL

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const inRect = (x, y, r) => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
const sizeOf = k => clamp(30, 56, 10 * Math.cbrt(SOLIDS[k].m / SOLIDS[k].rho));

let raf = null, lastT = 0, state = null, root = null, CTX = null;
let canvas = null, g2d = null, $ = null, upBound = false;
const mouse = { x: -999, y: -999 };
let winMove = null, winUp = null;
let pourSounding = false, lastBalanceTick = 0;

function initState() {
  return {
    solids: {
      wood: { loc: 'bench', bx: 402, phase: 0 },
      ice:  { loc: 'tray', phase: 1.3 },
      alu:  { loc: 'tray', phase: 2.6 },
      iron: { loc: 'tray', phase: 4.1 }
    },
    bottles: { water: 250, brine: 250, oil: 250 },
    cyl: { type: null, vol: 0, obj: null },
    tank: { layers: [], obj: null },
    drag: null, drag2: null, pour: null, held: null,
    parts: [], splashes: [], hover: null,
    weighed: null, curKey: null, V: null, rho: null,
    bal: { show: 0, target: 0, settled: true },
    seen: { float: false, sink: false },
    lastStatus: '—',
    goals: { m: false, V: false, rho: false, float: false, sink: false },
    steps: [false, false, false, false],
    layerSeen: {}, overflowWarned: false
  };
}

export default {
  id: 'density', title: '密度与浮沉',
  oneLine: '称质量、倒水、排水测体积——全靠你的手：拖拽称重、按住浸没、倾倒液体，看浮力与重力谁赢。',
  tags: ['零基础', '物理变化', '测量', '沉浸式'],
  safety: ['虚拟实验无危险；现实中量筒轻拿轻放，玻璃仪器防碎裂，加热液体防烫。'],
  render: mount,
  destroy: teardown
};

function mount(rootEl, ctx) {
    root = rootEl; CTX = ctx;
    state = initState(); lastT = 0;
    pourSounding = false; lastBalanceTick = 0;
    root.innerHTML = `
      <div class="lab-stage">
        <canvas id="d-canvas" width="${W}" height="${H}"></canvas>
        <aside class="hud hud-left">
          <h4>物 料 区</h4>
          ${Object.entries(SOLIDS).map(([k, v]) => `<div class="tray-item${k === 'wood' ? ' disabled' : ''}" data-kind="solid" data-key="${k}"><span class="tico">${v.icon}</span>${v.name}<span class="tsub">${v.m} g</span></div>`).join('')}
          ${Object.entries(LIQUIDS).map(([k, v]) => `<div class="tray-item" data-kind="bottle" data-key="${k}"><span class="tico">${v.icon}</span>${v.name}瓶<span class="tsub">250 mL</span></div>`).join('')}
          <button class="btn small" id="d-reset" style="margin-top:4px">重 置</button>
        </aside>
        <aside class="hud hud-right">
          <div>
            <h4>实 验 目 标</h4>
            <ul class="hud-goals" style="margin:0;padding:0">${GOALS.map(g => `<li data-g="${g.k}"><i></i>${g.t}</li>`).join('')}</ul>
          </div>
          <div>
            <h4>操 作 步 骤</h4>
            ${STEPS.map((s, i) => `<div class="hud-step${i === 0 ? ' cur' : ''}"><b>${i + 1}. ${s.t}</b>${s.d}</div>`).join('')}
          </div>
          <div>
            <h4>现 象 记 录</h4>
            <div class="hud-log" id="d-log"><p>欢迎进入沉浸式实验室。把台面上的<b>木块</b>拖上天平，开始称量。</p></div>
          </div>
        </aside>
        <div class="hud hud-bottom">
          <div class="data-chip" id="chip-obj">物体<b>—</b></div>
          <div class="data-chip" id="chip-m">质量 m<b>—</b></div>
          <div class="data-chip" id="chip-V">体积 V<b>—</b></div>
          <div class="data-chip" id="chip-rho">密度 ρ<b>—</b></div>
          <div class="data-chip" id="chip-liq">液体<b>—</b></div>
          <div class="data-chip" id="chip-st">状态<b>—</b></div>
          <button class="btn primary record-btn" id="d-record">记录数据到实验本</button>
        </div>
      </div>`;

    canvas = root.querySelector('#d-canvas');
    g2d = canvas.getContext('2d');
    $ = id => root.querySelector('#' + id);
    wireEvents(ctx);
    raf = requestAnimationFrame(frame);
}

function teardown() {
  setAmbient('pour', 0);
  pourSounding = false;
  if (raf) cancelAnimationFrame(raf);
  raf = null;
  if (winMove) { window.removeEventListener('pointermove', winMove); winMove = null; }
  if (winUp) { window.removeEventListener('pointerup', winUp); winUp = null; }
  const ghost = document.querySelector('.drag-ghost2');
  if (ghost) ghost.remove();
}

/* ---------- HUD 辅助 ---------- */
function log(html, hi) {
  const el = $('d-log');
  if (!el) return;
  const p = document.createElement('p');
  if (hi) p.className = 'hi';
  p.innerHTML = html;
  el.prepend(p);
  while (el.children.length > 10) el.lastChild.remove();
}
function goal(k) {
  if (state.goals[k]) return;
  state.goals[k] = true;
  const li = root.querySelector(`.hud-goals li[data-g="${k}"]`);
  if (li) li.classList.add('done');
}
function stepDone(i) {
  if (state.steps[i]) return;
  state.steps[i] = true;
  const lis = [...root.querySelectorAll('.hud-step')];
  if (lis[i]) lis[i].classList.add('done');
  const next = state.steps.indexOf(false);
  lis.forEach((li, j) => li.classList.toggle('cur', j === next));
}

/* ---------- 物理模型 ---------- */
function tankVol() { return state.tank.layers.reduce((s, l) => s + l.vol, 0); }
function topLayer() { return state.tank.layers[0] || null; }
function tankSurf() { return TANK.y + TANK.h - 6 - tankVol() * PPM; }
function cylDisp() {
  if (!state.cyl.obj || !state.cyl.type) return 0;
  const s = SOLIDS[state.cyl.obj];
  const V = s.m / s.rho;
  const rhoL = LIQUIDS[state.cyl.type].rho;
  if (s.rho >= rhoL) return V;
  return state.held === state.cyl.obj ? V : V * s.rho / rhoL;
}
function cylLevel() { return state.cyl.vol + cylDisp(); }
function cylSurf() { return clamp(CYL.y + CYL.h - 6 - cylLevel() * CYL_SC, CYL.y + 8, CYL.y + CYL.h - 6); }

function pourInto(where, type, amt) {
  const b = state.bottles;
  if (where === 'cyl') {
    if (state.cyl.type && state.cyl.type !== type) {
      if (state.cyl.vol > 0) {
        addTank(state.cyl.type, state.cyl.vol);
        log(`量筒里原来的${LIQUIDS[state.cyl.type].name}已转入水槽`);
      }
      state.cyl.vol = 0;
      state.cyl.type = null;
    }
    const room = Math.max(0, CYL.cap - cylLevel());
    const got = Math.min(amt, room, b[type]);
    if (got <= 0) {
      if (b[type] <= 0) log(`${LIQUIDS[type].name}瓶已经空了（重置可补满）`);
      else if (room <= 0 && !state.overflowWarned) { state.overflowWarned = true; log('量筒快满了，物体再放进去会溢出！', true); }
      return false;
    }
    b[type] -= got;
    state.cyl.vol += got;
    state.cyl.type = type;
    state.overflowWarned = cylLevel() > CYL.cap - 20;
    if (!state.steps[1]) stepDone(1);
    if (state.cyl.obj) markV();
  } else {
    const room = Math.max(0, TANK.cap - tankVol());
    const got = Math.min(amt, room, b[type]);
    if (got <= 0) { if (b[type] <= 0) log(`${LIQUIDS[type].name}瓶已经空了（重置可补满）`); return false; }
    b[type] -= got;
    addTank(type, got);
    if (state.tank.obj) markSeenTank(state.tank.obj);
  }
  return true;
}
function addTank(type, vol) {
  const L = state.tank.layers;
  let lay = L.find(l => l.type === type);
  if (lay) lay.vol += vol; else { lay = { type, vol }; L.push(lay); }
  L.sort((a, b) => LIQUIDS[a.type].rho - LIQUIDS[b.type].rho);
  const combo = L.map(l => l.type).sort().join('+');
  if (L.length >= 2 && lay.vol > 5 && !state.layerSeen[combo]) {
    state.layerSeen[combo] = true;
    log(`分层了！${L.map(l => `${LIQUIDS[l.type].name}（ρ=${LIQUIDS[l.type].rho.toFixed(2)}）`).join(' ↕ ')}——密度小的浮在上层`, true);
  }
  if (tankVol() > TANK.cap - 30) log('水槽快满了');
}

/* ---------- 放置与测量 ---------- */
function weigh(key) {
  const s = state.solids[key];
  s.loc = 'pan';
  state.bal.target = SOLIDS[key].m;
  state.bal.settled = false;
  lastBalanceTick = 0;
  state.curKey = key;
  const fresh = !state.weighed || state.weighed.key !== key;
  state.weighed = { key, m: SOLIDS[key].m };
  if (!state.goals.m) {
    goal('m'); stepDone(0);
    log(`电子天平：${SOLIDS[key].name} m = <b>${SOLIDS[key].m.toFixed(2)} g</b>`, true);
  } else if (fresh) {
    log(`天平读数：${SOLIDS[key].name} = ${SOLIDS[key].m.toFixed(2)} g`);
  }
}
function placeCyl(key) {
  const c = state.cyl;
  if (c.obj && c.obj !== key) {
    const old = state.solids[c.obj];
    old.loc = 'bench'; old.bx = 460;
    if (state.held === c.obj) state.held = null;
  }
  state.solids[key].loc = 'cyl';
  c.obj = key;
  state.curKey = key;
  spawnSplash(cylSurf(), CYL.x + CYL.w / 2, c.type ? LIQUIDS[c.type].color : '#56ccf2');
  if (!c.type) {
    log('量筒里还没有液体——先把清水瓶拖到筒口倒一些，才能用排水法测体积');
    return;
  }
  const sD = SOLIDS[key];
  if (sD.rho >= LIQUIDS[c.type].rho) {
    log(`${sD.name}沉底并完全浸没——排水读数开始`);
  } else {
    log(`${sD.name}浮在液面（ρ物 < ρ液）。<b>按住它</b>压到完全浸没再读 V`);
  }
  markV();
}
function placeTank(key) {
  const t = state.tank;
  if (t.obj && t.obj !== key) {
    const old = state.solids[t.obj];
    old.loc = 'bench'; old.bx = 700;
    if (state.held === t.obj) state.held = null;
  }
  state.solids[key].loc = 'tank';
  t.obj = key;
  state.curKey = key;
  if (t.layers.length) {
    spawnSplash(tankSurf(), objPos(key).x + sizeOf(key) / 2, LIQUIDS[topLayer().type].color);
    markSeenTank(key);
  } else {
    log('水槽还是空的——先倒点液体进去，物体才有沉浮可言');
  }
}
function markV() {
  if (!state.cyl.obj || !state.cyl.type) return;
  if (state.goals.V) { tryRho(); return; }
  const key = state.cyl.obj, sD = SOLIDS[key];
  const V = sD.m / sD.rho;
  if (cylDisp() >= V * 0.99) {
    state.V = V;
    goal('V'); stepDone(2);
    log(`排水法：${sD.name}完全浸没，排开液体 <b>V = ${V.toFixed(1)} cm³</b>`, true);
    if (state.weighed && state.weighed.key === key) tryRho();
    else log('想算密度，还得把这块物体也放上天平称一称质量');
  }
}
function tryRho() {
  if (state.rho != null || state.V == null || !state.weighed) return;
  if (!state.cyl.obj || state.weighed.key !== state.cyl.obj) return;
  state.rho = state.weighed.m / state.V;
  goal('rho');
  log(`ρ = m ÷ V = ${state.weighed.m.toFixed(2)} ÷ ${state.V.toFixed(1)} ≈ <b>${state.rho.toFixed(2)} g/cm³</b>`, true);
}
function markSeenTank(key) {
  const top = topLayer();
  if (!top) return;
  const rhoL = LIQUIDS[top.type].rho;
  const r = SOLIDS[key].rho;
  const st = r < rhoL - 0.02 ? 'float' : r > rhoL + 0.02 ? 'sink' : 'suspend';
  state.lastStatus = { float: '漂浮', sink: '沉底', suspend: '悬浮' }[st];
  if (st === 'float' && !state.seen.float) {
    state.seen.float = true; goal('float');
    achieve('density_float');
    log(`${SOLIDS[key].name} ρ=${r.toFixed(2)} < ρ液=${rhoL.toFixed(2)} → <b>漂浮</b>，浮力托住了它`, true);
  } else if (st === 'sink' && !state.seen.sink) {
    state.seen.sink = true; goal('sink');
    log(`${SOLIDS[key].name} ρ=${r.toFixed(2)} > ρ液=${rhoL.toFixed(2)} → <b>沉底</b>，浮力不够`, true);
  } else if (st === 'suspend') {
    log(`${SOLIDS[key].name} ρ≈ρ液 → <b>悬浮</b>，浮力恰好等于重力`, true);
  }
  if (state.seen.float && state.seen.sink && !state.steps[3]) stepDone(3);
}
function spawnSplash(y, x, color) {
  for (let i = 0; i < 8; i++) {
    state.splashes.push({
      x: x + (Math.random() - .5) * 26, y,
      vx: (Math.random() - .5) * 120, vy: -(60 + Math.random() * 140),
      life: .5 + Math.random() * .3, color
    });
  }
}

/* ---------- 拖拽 ---------- */
function resolveDrop(x, y, key) {
  const s = state.solids[key];
  if (inRect(x, y, { x: BAL.panX - BAL.panW / 2 - 10, y: BAL.panY - 34, w: BAL.panW + 20, h: 52 })) return weigh(key);
  if (inRect(x, y, { x: CYL.x - 10, y: CYL.y - 30, w: CYL.w + 20, h: CYL.h + 30 })) return placeCyl(key);
  if (inRect(x, y, { x: TANK.x - 6, y: TANK.y - 34, w: TANK.w + 12, h: TANK.h + 34 })) return placeTank(key);
  s.loc = 'bench';
  s.bx = clamp(x, 356, 725);
  state.curKey = key;
}
function hitSolid(x, y) {
  for (const k of Object.keys(state.solids)) {
    const s = state.solids[k];
    if (s.loc === 'tray' || s.loc === 'hand') continue;
    const p = objPos(k);
    if (!p) continue;
    if (x > p.x - 8 && x < p.x + p.size + 8 && y > p.y - 8 && y < p.y + p.size + 8) return k;
  }
  return null;
}
function detach(key) {
  const s = state.solids[key];
  if (s.loc === 'pan' && state.bal.target) {
    state.bal.target = 0;
    state.bal.settled = false;
    lastBalanceTick = 0;
  }
  if (s.loc === 'cyl' && state.cyl.obj === key) state.cyl.obj = null;
  if (s.loc === 'tank' && state.tank.obj === key) state.tank.obj = null;
  s.loc = 'hand';
}
function startTrayDrag(kind, key, e) {
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost2';
  ghost.textContent = kind === 'solid'
    ? `${SOLIDS[key].icon} ${SOLIDS[key].name}（${SOLIDS[key].m} g）`
    : `${LIQUIDS[key].icon} ${LIQUIDS[key].name} ${Math.round(state.bottles[key])} mL`;
  document.body.appendChild(ghost);
  const move = ev => {
    ghost.style.left = (ev.clientX + 14) + 'px';
    ghost.style.top = (ev.clientY - 18) + 'px';
    if (state.drag2) {
      const r = canvas.getBoundingClientRect();
      state.drag2.x = (ev.clientX - r.left) / r.width * W;
      state.drag2.y = (ev.clientY - r.top) / r.height * H;
      if (state.drag2.kind === 'bottle') {
        ghost.textContent = `${LIQUIDS[state.drag2.key].icon} ${LIQUIDS[state.drag2.key].name} ${Math.round(state.bottles[state.drag2.key])} mL`;
      }
    }
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    ghost.remove();
    winMove = null; winUp = null;
    const d = state.drag2;
    state.drag2 = null; state.pour = null;
    if (d && d.kind === 'solid') resolveDrop(d.x, d.y, d.key);
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
  winMove = move; winUp = up;
  const r = canvas.getBoundingClientRect();
  state.drag2 = { kind, key, x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  move(e);
}

function wireEvents(ctx) {
  CTX = ctx;
  canvas.addEventListener('pointerdown', e => {
    const [x, y] = canvasXY(canvas, e);
    const key = hitSolid(x, y);
    if (!key) return;
    const s = state.solids[key];
    const floaty = s.loc === 'cyl' && state.cyl.type && SOLIDS[key].rho < LIQUIDS[state.cyl.type].rho;
    if (floaty) {
      state.held = key;
      state.drag = { key, x, y, sx: x, sy: y, moved: false };
    } else {
      detach(key);
      state.drag = { key, x, y, sx: x, sy: y, moved: true };
    }
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', e => {
    const [x, y] = canvasXY(canvas, e);
    mouse.x = x; mouse.y = y;
    if (state.drag) {
      state.drag.x = x; state.drag.y = y;
      if (!state.drag.moved && Math.hypot(x - state.drag.sx, y - state.drag.sy) > 14) {
        detach(state.drag.key);
        state.drag.moved = true;
        state.held = null;
      }
    }
  });
  canvas.addEventListener('pointerleave', () => { mouse.x = -999; mouse.y = -999; });
  if (!upBound) {
    upBound = true;
    window.addEventListener('pointerup', () => {
      if (!state || !state.drag) return;
      const d = state.drag;
      if (d.moved) resolveDrop(d.x, d.y, d.key);
      else if (state.held === d.key) { state.held = null; markV(); }
      state.held = null; state.drag = null;
    });
  }
  root.querySelectorAll('.tray-item').forEach(el => {
    el.addEventListener('pointerdown', e => {
      const kind = el.dataset.kind, key = el.dataset.key;
      if (kind === 'solid' && state.solids[key].loc !== 'tray') return;
      e.preventDefault();
      startTrayDrag(kind, key, e);
    });
  });
  $('d-reset').addEventListener('click', () => {
    teardown();
    state = initState();
    mount(root, ctx);
    log('已重置：器材归位、瓶子补满、目标清零。再来一次！');
  });
  $('d-record').addEventListener('click', () => {
    if (!(state.goals.m && state.goals.V && state.goals.rho)) {
      log('先完成「称质量 → 测体积 → 算密度」，数据齐了才能记录');
      return;
    }
    const key = state.weighed.key;
    ctx.record(
      { 物体: SOLIDS[key].name, 质量: state.weighed.m.toFixed(2) + ' g', 量筒液体: state.cyl.type ? LIQUIDS[state.cyl.type].name : '—' },
      { 排开体积V: state.V.toFixed(1) + ' cm³', 密度ρ: state.rho.toFixed(2) + ' g/cm³', 水槽观察: state.lastStatus }
    );
  });
}

/* ---------- 物体位置 ---------- */
function objPos(key) {
  const s = state.solids[key];
  const size = sizeOf(key);
  if (s.loc === 'pan') return { x: BAL.panX - size / 2, y: BAL.panY + 8 - size, size };
  if (s.loc === 'bench') return { x: s.bx - size / 2, y: BENCH - 6 - size, size };
  if (s.loc !== 'cyl' && s.loc !== 'tank') return null;
  if (s.loc === 'cyl') {
    const cxp = CYL.x + CYL.w / 2 - size / 2;
    const floor = CYL.y + CYL.h - 8;
    if (!state.cyl.type) return { x: cxp, y: floor - size, size };
    const sD = SOLIDS[key];
    const surf = cylSurf();
    const frac = sD.rho / LIQUIDS[state.cyl.type].rho;
    let yb = frac >= 1 ? floor : surf + frac * size + Math.sin(performance.now() / 620 + s.phase) * 2.2;
    return { x: cxp, y: yb - size, size };
  }
  const cxp = TANK.x + TANK.w / 2 - size / 2;
  const floor = TANK.y + TANK.h - 10;
  if (!state.tank.layers.length) return { x: cxp, y: floor - size, size };
  const sD = SOLIDS[key];
  const surf = tankSurf();
  const frac = sD.rho / LIQUIDS[topLayer().type].rho;
  let yb = frac >= 1 ? floor : surf + frac * size + Math.sin(performance.now() / 700 + s.phase) * 3;
  return { x: cxp, y: clamp(yb - size, TANK.y + 4, floor - size), size };
}

/* ---------- 帧更新 ---------- */
function update(dt) {
  const balanceMoving = Math.abs(state.bal.show - state.bal.target) >= 0.005;
  if (balanceMoving) {
    const now = performance.now();
    if (now - lastBalanceTick >= 55) { play('tick'); lastBalanceTick = now; }
    state.bal.show += (state.bal.target - state.bal.show) * Math.min(1, dt * 7);
    if (Math.abs(state.bal.show - state.bal.target) < 0.005) state.bal.show = state.bal.target;
  } else if (!state.bal.settled) {
    state.bal.show = state.bal.target;
    state.bal.settled = true;
    if (state.bal.target > 0) play('record');
  }

  if (state.drag2 && state.drag2.kind === 'bottle') {
    const { x, y, key } = state.drag2;
    const cylM = { x: CYL.x - 8, y: CYL.y - 40, w: CYL.w + 16, h: 46 };
    const tankM = { x: TANK.x, y: TANK.y - 36, w: TANK.w, h: 42 };
    if (inRect(x, y, cylM)) state.pour = { target: 'cyl', type: key, x, y: y + 6, tx: CYL.x + CYL.w / 2, ty: cylSurf() };
    else if (inRect(x, y, tankM)) state.pour = { target: 'tank', type: key, x, y: y + 6, tx: TANK.x + TANK.w / 2, ty: tankSurf() };
    else state.pour = null;
    const flowing = state.pour ? pourInto(state.pour.target, state.pour.type, 70 * dt) : false;
    if (flowing !== pourSounding) {
      pourSounding = flowing;
      setAmbient('pour', flowing ? 1 : 0);
    }
    if (flowing && Math.random() < 0.85) state.parts.push({
      x: state.pour.x + (Math.random() - .5) * 4, y: state.pour.y,
      vx: (Math.random() - .5) * 24, vy: 260 + Math.random() * 120, life: .6, type: state.pour.type
    });
  } else {
    state.pour = null;
    if (pourSounding) { pourSounding = false; setAmbient('pour', 0); }
  }

  state.parts = state.parts.filter(p => {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 380 * dt;
    return p.life > 0 && p.y < BENCH;
  });
  state.splashes = state.splashes.filter(p => {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 460 * dt;
    return p.life > 0;
  });

  if (state.held && state.cyl.obj === state.held) markV();
  state.hover = computeHover();
}
function computeHover() {
  if (state.drag || state.drag2 || mouse.x < 0) return null;
  const { x, y } = mouse;
  if (inRect(x, y, CYL)) {
    const lv = cylLevel();
    return { x, y, lines: [
      `量筒（${CYL.cap} mL）`,
      `液面读数 ${lv.toFixed(0)} mL${state.cyl.obj && cylDisp() > 0 ? '（含物体排水 ' + cylDisp().toFixed(0) + ' cm³）' : ''}`,
      state.cyl.type ? `${LIQUIDS[state.cyl.type].name} ρ=${LIQUIDS[state.cyl.type].rho.toFixed(2)} g/cm³` : '空——把瓶口对准这里倾倒'
    ] };
  }
  if (inRect(x, y, TANK)) {
    const L = state.tank.layers;
    return { x, y, lines: ['水槽',
      ...L.map(l => `${LIQUIDS[l.type].name} ${l.vol.toFixed(0)} mL · ρ=${LIQUIDS[l.type].rho.toFixed(2)}`),
      '把物体拖进来，看沉浮与分层'] };
  }
  if (inRect(x, y, BAL)) {
    return { x, y, lines: ['电子天平',
      state.weighed ? `上次称量：${SOLIDS[state.weighed.key].name} ${state.weighed.m.toFixed(2)} g` : '把物体拖上托盘称质量',
      '读数会滚动到真实值'] };
  }
  return null;
}

/* ---------- 绘制 ---------- */
function draw() {
  const bg = g2d.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d1936'); bg.addColorStop(.6, '#0a132b'); bg.addColorStop(1, '#081020');
  g2d.fillStyle = bg; g2d.fillRect(0, 0, W, H);
  g2d.fillStyle = 'rgba(126,160,224,.13)';
  for (let i = 0; i < 40; i++) {
    g2d.fillRect((i * 97 + 31) % W, (i * 61 + 17) % (BENCH - 80), 2, 2);
  }
  drawBench();
  drawBalance();
  drawCylinder();
  drawTank();
  drawSolids();
  drawPour();
  drawParticles();
  drawTooltip();
}
function drawBench() {
  const g = g2d.createLinearGradient(0, BENCH, 0, H);
  g.addColorStop(0, '#1a2647'); g.addColorStop(.12, '#121c38'); g.addColorStop(1, '#0a1126');
  g2d.fillStyle = g; g2d.fillRect(0, BENCH, W, H - BENCH);
  g2d.fillStyle = 'rgba(126,160,224,.5)'; g2d.fillRect(0, BENCH, W, 2);
  g2d.fillStyle = 'rgba(126,160,224,.12)';
  for (let i = 0; i < W; i += 64) g2d.fillRect(i, BENCH + 12, 32, 1);
  g2d.fillStyle = '#5d6f9c'; g2d.font = '11px sans-serif';
  g2d.fillText('实 验 台', 24, BENCH + 32);
}
function zoneGlow(r, color) {
  g2d.save();
  g2d.shadowColor = color; g2d.shadowBlur = 16;
  g2d.strokeStyle = color; g2d.lineWidth = 2;
  g2d.strokeRect(r.x, r.y, r.w, r.h);
  g2d.restore();
  g2d.lineWidth = 1;
}
function drawBalance() {
  const { x, y, w, h, panX, panY, panW } = BAL;
  const g = g2d.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#25335c'); g.addColorStop(.5, '#182343'); g.addColorStop(1, '#10182e');
  g2d.fillStyle = g;
  g2d.beginPath(); g2d.roundRect(x, y, w, h, 12); g2d.fill();
  g2d.strokeStyle = '#3a4a78'; g2d.stroke();
  const on = state.bal.target > 0 || state.bal.show > 0.5;
  g2d.save();
  g2d.shadowColor = 'rgba(86,204,242,.8)'; g2d.shadowBlur = on ? 14 : 4;
  g2d.fillStyle = '#04101d';
  g2d.beginPath(); g2d.roundRect(x + 16, y + 18, 136, 46, 8); g2d.fill();
  g2d.restore();
  g2d.strokeStyle = 'rgba(86,204,242,.5)'; g2d.strokeRect(x + 16, y + 18, 136, 46);
  g2d.fillStyle = on ? '#6df0ff' : '#1d3a52';
  g2d.font = '700 21px ui-monospace,Menlo,monospace';
  g2d.textAlign = 'center';
  g2d.fillText(state.bal.show.toFixed(2) + ' g', x + 84, y + 48);
  g2d.textAlign = 'left';
  g2d.save();
  g2d.shadowColor = '#3affb0'; g2d.shadowBlur = 8;
  g2d.fillStyle = '#3affb0';
  g2d.beginPath(); g2d.arc(x + 170, y + 28, 3.5, 0, 7); g2d.fill();
  g2d.restore();
  g2d.fillStyle = '#2c3a63';
  g2d.beginPath(); g2d.roundRect(x + 160, y + 40, 22, 10, 4); g2d.fill();
  g2d.beginPath(); g2d.roundRect(x + 160, y + 53, 22, 10, 4); g2d.fill();
  g2d.fillStyle = '#8ea6d8'; g2d.font = '11px sans-serif';
  g2d.fillText('电子天平 · 精度 0.01 g', x + 18, y + h - 12);
  const cg = g2d.createLinearGradient(panX - 9, 0, panX + 9, 0);
  cg.addColorStop(0, '#1c2848'); cg.addColorStop(.5, '#3d4f80'); cg.addColorStop(1, '#1c2848');
  g2d.fillStyle = cg;
  g2d.fillRect(panX - 9, panY + 12, 18, y - panY - 12);
  const pg = g2d.createLinearGradient(0, panY, 0, panY + 16);
  pg.addColorStop(0, '#c9d4ea'); pg.addColorStop(1, '#6d7ea6');
  g2d.save();
  g2d.shadowColor = 'rgba(86,204,242,.35)'; g2d.shadowBlur = 10;
  g2d.fillStyle = pg;
  g2d.beginPath(); g2d.ellipse(panX, panY + 8, panW / 2, 11, 0, 0, 7); g2d.fill();
  g2d.restore();
  g2d.strokeStyle = '#8fa2c9';
  g2d.beginPath(); g2d.ellipse(panX, panY + 8, panW / 2, 11, 0, 0, 7); g2d.stroke();
  g2d.strokeStyle = 'rgba(255,255,255,.35)';
  g2d.beginPath(); g2d.ellipse(panX, panY + 8, panW / 2 - 8, 7, 0, 0, 7); g2d.stroke();
  if (state.drag) {
    const d = state.drag;
    if (inRect(d.x, d.y, { x: BAL.panX - BAL.panW / 2 - 10, y: BAL.panY - 34, w: BAL.panW + 20, h: 52 })) {
      g2d.save(); g2d.shadowColor = '#f0c96a'; g2d.shadowBlur = 18;
      g2d.strokeStyle = '#f0c96a'; g2d.lineWidth = 2;
      g2d.beginPath(); g2d.ellipse(panX, panY + 8, panW / 2 + 6, 14, 0, 0, 7); g2d.stroke();
      g2d.restore(); g2d.lineWidth = 1;
    }
  }
}
function drawCylinder() {
  const { x, y, w, h } = CYL;
  const ix = x + 7, iw = w - 14;
  const bottom = y + h - 6;
  const gg = g2d.createLinearGradient(x, 0, x + w, 0);
  gg.addColorStop(0, 'rgba(150,190,240,.16)'); gg.addColorStop(.2, 'rgba(150,190,240,.05)');
  gg.addColorStop(.5, 'rgba(150,190,240,.12)'); gg.addColorStop(.8, 'rgba(150,190,240,.05)');
  gg.addColorStop(1, 'rgba(150,190,240,.16)');
  g2d.fillStyle = gg;
  g2d.beginPath(); g2d.roundRect(x, y, w, h, 14); g2d.fill();
  if (state.cyl.type && cylLevel() > 0) {
    const c = LIQUIDS[state.cyl.type].color;
    const surf = cylSurf();
    const lg = g2d.createLinearGradient(0, surf, 0, bottom);
    lg.addColorStop(0, c + 'aa'); lg.addColorStop(1, c + 'ee');
    g2d.fillStyle = lg;
    g2d.fillRect(ix, surf, iw, bottom - surf);
    g2d.strokeStyle = c; g2d.lineWidth = 2;
    g2d.beginPath(); g2d.moveTo(ix, surf);
    g2d.quadraticCurveTo(ix + iw / 2, surf + 5, ix + iw, surf); g2d.stroke();
    g2d.strokeStyle = 'rgba(255,255,255,.35)'; g2d.lineWidth = 1;
    g2d.beginPath(); g2d.moveTo(ix, surf + 1);
    g2d.quadraticCurveTo(ix + iw / 2, surf + 6, ix + iw, surf + 1); g2d.stroke();
  }
  g2d.font = '9.5px ui-monospace,Menlo,monospace';
  for (let ml = 0; ml <= CYL.cap; ml += 25) {
    const yy = bottom - ml * CYL_SC;
    const major = ml % 50 === 0;
    g2d.strokeStyle = major ? 'rgba(126,160,224,.8)' : 'rgba(126,160,224,.35)';
    g2d.beginPath();
    g2d.moveTo(x + w - 12, yy); g2d.lineTo(x + w - (major ? 26 : 18), yy);
    g2d.stroke();
    if (major) { g2d.fillStyle = 'rgba(147,161,196,.9)'; g2d.fillText(String(ml), x + 8, yy + 3); }
  }
  g2d.fillStyle = 'rgba(255,255,255,.14)';
  g2d.fillRect(x + 12, y + 12, 5, h - 40);
  g2d.fillStyle = 'rgba(255,255,255,.07)';
  g2d.fillRect(x + w - 20, y + 12, 3, h - 40);
  g2d.strokeStyle = 'rgba(126,160,224,.65)'; g2d.lineWidth = 1.5;
  g2d.beginPath(); g2d.roundRect(x, y, w, h, 14); g2d.stroke();
  g2d.lineWidth = 1;
  g2d.fillStyle = 'rgba(126,160,224,.25)';
  g2d.beginPath(); g2d.ellipse(x + w / 2, bottom + 3, w / 2 + 4, 5, 0, 0, 7); g2d.fill();
  if (state.pour && state.pour.target === 'cyl') {
    g2d.save(); g2d.shadowColor = '#56ccf2'; g2d.shadowBlur = 14;
    g2d.strokeStyle = '#56ccf2'; g2d.lineWidth = 2;
    g2d.beginPath(); g2d.roundRect(x, y, w, h, 14); g2d.stroke();
    g2d.restore(); g2d.lineWidth = 1;
  }
  g2d.fillStyle = '#8ea6d8'; g2d.font = '11px sans-serif';
  g2d.fillText('量筒 250 mL', x - 10, y - 10);
}
function drawTank() {
  const { x, y, w, h } = TANK;
  const bottom = y + h - 6;
  const surf = tankSurf();
  g2d.fillStyle = 'rgba(150,190,240,.06)';
  g2d.fillRect(x, y, w, h);
  let ly = bottom;
  for (let i = state.tank.layers.length - 1; i >= 0; i--) {
    const l = state.tank.layers[i];
    const lh = l.vol * PPM;
    const c = LIQUIDS[l.type].color;
    const lg = g2d.createLinearGradient(0, ly - lh, 0, ly);
    lg.addColorStop(0, c + '99'); lg.addColorStop(1, c + 'dd');
    g2d.fillStyle = lg;
    g2d.fillRect(x + 4, ly - lh, w - 8, lh);
    g2d.strokeStyle = 'rgba(255,255,255,.3)';
    g2d.beginPath(); g2d.moveTo(x + 4, ly - lh); g2d.lineTo(x + w - 4, ly - lh); g2d.stroke();
    ly -= lh;
  }
  if (state.tank.layers.length) {
    g2d.strokeStyle = LIQUIDS[topLayer().type].color; g2d.lineWidth = 2;
    g2d.beginPath(); g2d.moveTo(x + 4, surf); g2d.lineTo(x + w - 4, surf); g2d.stroke();
    g2d.lineWidth = 1;
  }
  g2d.fillStyle = 'rgba(10,16,32,.55)';
  for (let i = 0; i < 5; i++) {
    g2d.beginPath(); g2d.roundRect(x + 30 + i * (w - 80) / 4, bottom - 4, 34, 5, 2); g2d.fill();
  }
  g2d.strokeStyle = 'rgba(126,160,224,.7)'; g2d.lineWidth = 3;
  g2d.beginPath();
  g2d.moveTo(x + 1.5, y - 4); g2d.lineTo(x + 1.5, bottom);
  g2d.lineTo(x + w - 1.5, bottom); g2d.lineTo(x + w - 1.5, y - 4);
  g2d.stroke();
  g2d.lineWidth = 1;
  g2d.fillStyle = 'rgba(255,255,255,.1)';
  g2d.fillRect(x + 10, y + 8, 4, h - 30);
  if (state.pour && state.pour.target === 'tank') {
    g2d.save(); g2d.shadowColor = '#56ccf2'; g2d.shadowBlur = 14;
    g2d.strokeStyle = '#56ccf2'; g2d.lineWidth = 2;
    g2d.strokeRect(x, y - 4, w, 8);
    g2d.restore(); g2d.lineWidth = 1;
  }
  g2d.fillStyle = '#8ea6d8'; g2d.font = '11px sans-serif';
  g2d.fillText(state.tank.layers.length
    ? '水槽：' + LIQUIDS[topLayer().type].name + '（顶层 ρ=' + LIQUIDS[topLayer().type].rho.toFixed(2) + '）'
    : '水槽（空）——把液体倒进来', x, y - 12);
}
function drawSolidBody(k, x, y, size) {
  if (k === 'wood') {
    const g = g2d.createLinearGradient(0, y, 0, y + size);
    g.addColorStop(0, '#a57c4e'); g.addColorStop(.5, '#8a6238'); g.addColorStop(1, '#6e4d2a');
    g2d.fillStyle = g;
    g2d.beginPath(); g2d.roundRect(x, y, size, size, 4); g2d.fill();
    g2d.strokeStyle = 'rgba(70,45,20,.5)';
    for (let i = 1; i <= 3; i++) {
      g2d.beginPath();
      g2d.moveTo(x + 3, y + size * i / 4);
      g2d.bezierCurveTo(x + size * .3, y + size * i / 4 - 3, x + size * .7, y + size * i / 4 + 3, x + size - 3, y + size * i / 4);
      g2d.stroke();
    }
    g2d.beginPath(); g2d.ellipse(x + size * .68, y + size * .3, size * .07, size * .05, 0, 0, 7);
    g2d.strokeStyle = 'rgba(70,45,20,.7)'; g2d.stroke();
    g2d.strokeStyle = '#3c2a15';
    g2d.beginPath(); g2d.roundRect(x, y, size, size, 4); g2d.stroke();
    g2d.fillStyle = 'rgba(255,235,200,.18)';
    g2d.fillRect(x + 3, y + 2, size - 6, 3);
  } else if (k === 'ice') {
    g2d.fillStyle = 'rgba(205,232,248,.8)';
    g2d.beginPath(); g2d.roundRect(x, y, size, size, 6); g2d.fill();
    g2d.strokeStyle = 'rgba(255,255,255,.65)';
    g2d.beginPath();
    g2d.moveTo(x + size * .2, y + size * .15); g2d.lineTo(x + size * .45, y + size * .5); g2d.lineTo(x + size * .3, y + size * .85);
    g2d.moveTo(x + size * .55, y + size * .2); g2d.lineTo(x + size * .75, y + size * .55);
    g2d.stroke();
    g2d.strokeStyle = 'rgba(150,200,235,.9)';
    g2d.beginPath(); g2d.roundRect(x, y, size, size, 6); g2d.stroke();
    g2d.fillStyle = 'rgba(255,255,255,.5)';
    g2d.fillRect(x + 4, y + 3, size - 8, 2);
  } else {
    const iron = k === 'iron';
    const g = g2d.createLinearGradient(x, y, x, y + size);
    if (iron) { g.addColorStop(0, '#8a93a8'); g.addColorStop(.35, '#525c72'); g.addColorStop(.55, '#75808f'); g.addColorStop(1, '#3c4454'); }
    else { g.addColorStop(0, '#e8edf6'); g.addColorStop(.35, '#a7b2c6'); g.addColorStop(.55, '#cdd6e4'); g.addColorStop(1, '#8791a5'); }
    g2d.fillStyle = g;
    g2d.beginPath(); g2d.roundRect(x, y, size, size, 5); g2d.fill();
    g2d.strokeStyle = iron ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.35)';
    for (let i = 1; i < 5; i++) {
      g2d.beginPath(); g2d.moveTo(x + 3, y + size * i / 5); g2d.lineTo(x + size - 3, y + size * i / 5); g2d.stroke();
    }
    g2d.strokeStyle = iron ? '#262c3a' : '#5f6a80';
    g2d.beginPath(); g2d.roundRect(x, y, size, size, 5); g2d.stroke();
    g2d.fillStyle = 'rgba(255,255,255,.4)';
    g2d.fillRect(x + 4, y + 3, size - 8, 2);
  }
  if (size >= 36) {
    g2d.fillStyle = k === 'wood' ? '#2b1c0c' : 'rgba(10,14,26,.75)';
    g2d.font = '600 10px sans-serif';
    g2d.fillText(SOLIDS[k].name, x + 4, y + size - 5);
  }
}
function drawForces(k, p) {
  const s = state.solids[k];
  let rhoL = null;
  if (s.loc === 'cyl' && state.cyl.type) rhoL = LIQUIDS[state.cyl.type].rho;
  else if (s.loc === 'tank' && state.tank.layers.length) rhoL = LIQUIDS[topLayer().type].rho;
  if (!rhoL) return;
  const V = SOLIDS[k].m / SOLIDS[k].rho;
  const disp = SOLIDS[k].rho >= rhoL ? V : V * SOLIDS[k].rho / rhoL;
  const cx = p.x + p.size / 2, cy = p.y + p.size / 2;
  const grav = clamp(8 + SOLIDS[k].m / 4, 12, 44);
  const buoy = grav * (rhoL * disp / SOLIDS[k].m);
  g2d.lineWidth = 3;
  g2d.strokeStyle = '#f2b3a4';
  g2d.beginPath(); g2d.moveTo(cx, cy); g2d.lineTo(cx, cy + grav); g2d.stroke();
  g2d.strokeStyle = '#8fe0c6';
  g2d.beginPath(); g2d.moveTo(cx, cy); g2d.lineTo(cx, cy - buoy); g2d.stroke();
  g2d.lineWidth = 1;
  g2d.font = '10.5px sans-serif';
  g2d.fillStyle = '#f2b3a4'; g2d.fillText('↓ 重力', cx + 6, cy + grav + 3);
  g2d.fillStyle = '#8fe0c6'; g2d.fillText('↑ 浮力', cx + 6, cy - buoy - 3);
}
function drawTint(k, p) {
  const s = state.solids[k];
  let color = null, topSurf = null;
  if (s.loc === 'cyl' && state.cyl.type) { color = LIQUIDS[state.cyl.type].color; topSurf = cylSurf(); }
  else if (s.loc === 'tank' && state.tank.layers.length) { color = LIQUIDS[topLayer().type].color; topSurf = tankSurf(); }
  if (!color) return;
  const subTop = Math.max(p.y, topSurf);
  if (subTop >= p.y + p.size) return;
  g2d.fillStyle = color + '55';
  g2d.fillRect(p.x, subTop, p.size, p.y + p.size - subTop);
}
function drawSolids() {
  for (const k of Object.keys(SOLIDS)) {
    const s = state.solids[k];
    if (s.loc === 'tray') continue;
    if (state.drag && state.drag.key === k) continue;
    const p = objPos(k);
    if (!p) continue;
    if (s.loc === 'bench' || s.loc === 'pan') {
      g2d.fillStyle = 'rgba(3,8,20,.45)';
      g2d.beginPath(); g2d.ellipse(p.x + p.size / 2, p.y + p.size + 3, p.size / 2, 5, 0, 0, 7); g2d.fill();
    }
    drawSolidBody(k, p.x, p.y, p.size);
    drawTint(k, p);
    drawForces(k, p);
  }
  if (state.drag) {
    const k = state.drag.key;
    const size = sizeOf(k) * 1.05;
    drawSolidBody(k, state.drag.x - size / 2, state.drag.y - size / 2 - 6, size);
  }
}
function drawPour() {
  if (!state.pour) return;
  const p = state.pour;
  const c = LIQUIDS[p.type].color;
  const g = g2d.createLinearGradient(0, p.y, 0, p.ty);
  g.addColorStop(0, c + 'cc'); g.addColorStop(1, c + '88');
  g2d.strokeStyle = g; g2d.lineWidth = 5;
  g2d.beginPath();
  g2d.moveTo(p.x, p.y);
  g2d.quadraticCurveTo(p.x + 2, (p.y + p.ty) / 2, p.tx, p.ty - 4);
  g2d.stroke();
  g2d.lineWidth = 1;
}
function drawParticles() {
  for (const p of state.parts) {
    g2d.fillStyle = LIQUIDS[p.type].color + 'cc';
    g2d.fillRect(p.x, p.y, 2.6, 6);
  }
  for (const p of state.splashes) {
    g2d.globalAlpha = Math.max(0, Math.min(1, p.life * 2));
    g2d.fillStyle = p.color;
    g2d.beginPath(); g2d.arc(p.x, p.y, 2.2, 0, 7); g2d.fill();
  }
  g2d.globalAlpha = 1;
}
function drawTooltip() {
  const h = state.hover;
  if (!h) return;
  const lines = h.lines;
  g2d.font = '11.5px sans-serif';
  const wmax = Math.max(...lines.map(l => g2d.measureText(l).width)) + 22;
  const hh = lines.length * 17 + 12;
  const tx = clamp(h.x + 14, 8, W - wmax - 8);
  const ty = clamp(h.y - hh - 10, 8, H - hh - 8);
  g2d.save();
  g2d.shadowColor = 'rgba(3,8,20,.6)'; g2d.shadowBlur = 12;
  g2d.fillStyle = 'rgba(16,26,50,.92)';
  g2d.beginPath(); g2d.roundRect(tx, ty, wmax, hh, 9); g2d.fill();
  g2d.restore();
  g2d.strokeStyle = 'rgba(86,204,242,.5)';
  g2d.beginPath(); g2d.roundRect(tx, ty, wmax, hh, 9); g2d.stroke();
  lines.forEach((l, i) => {
    g2d.fillStyle = i === 0 ? '#f0c96a' : '#c9d4ee';
    g2d.fillText(l, tx + 11, ty + 19 + i * 17);
  });
}

/* ---------- 数据浮窗 ---------- */
function updateRO() {
  const set = (id, v, lit) => {
    const el = $(id);
    if (!el) return;
    el.querySelector('b').textContent = v;
    el.classList.toggle('lit', !!lit);
  };
  set('chip-obj', state.curKey ? SOLIDS[state.curKey].name : '—', !!state.curKey);
  set('chip-m', state.weighed ? state.weighed.m.toFixed(2) + ' g' : '—', !!state.weighed);
  set('chip-V', state.V != null ? state.V.toFixed(1) + ' cm³'
    : (state.cyl.obj && state.cyl.type && cylDisp() > 0 ? '≈' + cylDisp().toFixed(1) + ' cm³' : '—'), state.V != null);
  set('chip-rho', state.rho != null ? state.rho.toFixed(2) + ' g/cm³' : '—', state.rho != null);
  const liqTxt = state.tank.layers.length
    ? LIQUIDS[topLayer().type].name + ' ' + LIQUIDS[topLayer().type].rho.toFixed(2)
    : (state.cyl.type ? LIQUIDS[state.cyl.type].name + ' ' + LIQUIDS[state.cyl.type].rho.toFixed(2) : '—');
  set('chip-liq', liqTxt, !!state.tank.layers.length || !!state.cyl.type);
  let st = '—';
  if (state.tank.obj && state.tank.layers.length) st = state.lastStatus;
  else if (state.cyl.obj && state.cyl.type) {
    st = SOLIDS[state.cyl.obj].rho < LIQUIDS[state.cyl.type].rho
      ? (state.held === state.cyl.obj ? '浸没' : '漂浮') : '沉底';
  }
  set('chip-st', st, st !== '—');
  const rec = $('d-record');
  if (rec) rec.classList.toggle('pulse', state.goals.m && state.goals.V && state.goals.rho);
}

function frame(t) {
  if (!state || !g2d) return;
  const dt = Math.min(.05, lastT ? (t - lastT) / 1000 : .016);
  lastT = t;
  update(dt);
  draw();
  updateRO();
  raf = requestAnimationFrame(frame);
}
