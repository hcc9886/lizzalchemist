// 分层 2D 实验工作台：
//   层次：背景 → 器材台(tray) → 连接(线缆) → 器材(含液体/粉末/火焰) → 粒子 → UI(悬停/吸附/红闪)
//   交互：拖拽（拖影）→ 接口锚点吸附（allowed_neighbors 校验）→ 建立连接；点击回调；FSM 集成。
//   配置驱动：器材外观由 def.kind 决定，新 kind 在 KINDS 注册即可，未注册走通用渲染。
import { apparatus } from '../data/apparatus.js';
import { createFSM } from './fsm.js';
import { drawLiquid, drawPowder, ParticleFX, levelY } from './liquid.js';

const C = {
  bg: '#1a1730', bgTop: '#221d40', plank: '#262147', plankLine: '#312b56',
  tray: '#131022', trayLine: '#37305c', ink: '#eae4d2', muted: '#a49cc0',
  gold: '#d4a542', gold2: '#f0c96a', glass: 'rgba(150,180,215,.16)',
  glassE: 'rgba(160,190,225,.8)', glassHi: 'rgba(200,225,255,.5)',
  metal: '#8b93a8', metalD: '#5a6175', wood: '#9a7148', red: '#c65a41',
  flame1: '#e8703a', flame2: '#f0c96a', flame3: '#5f93c9'
};

const D2R = Math.PI / 180;
const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

/* 兼容的接口类型对 */
const PAIRS = t => ({
  mouth: ['side', 'heat'],
  side: ['mouth', 'side', 'clamp'],
  stand: ['stand'],
  elec: ['elec'],
  heat: ['heat', 'mouth'],
  clamp: ['side']
}[t] || []);

/* 允许邻接校验（双向 + 前缀通配） */
function allowed(a, b) {
  for (const [def, other] of [[a.def, b.def], [b.def, a.def]]) {
    const list = def.allowed_neighbors;
    if (!list) continue;
    for (const n of list) {
      if (n === '*' || n === other.id) return true;
      if (n.endsWith('*') && other.id.startsWith(n.slice(0, -1))) return true;
    }
  }
  return false;
}

export class Workbench {
  constructor(canvas, opts = {}) {
    this.cv = canvas;
    this.g = canvas.getContext('2d');
    this.W = canvas.width; this.H = canvas.height;
    this.trayY = opts.trayY ?? canvas.height - 58;
    this.tray = []; this.items = []; this.links = [];
    this.fx = new ParticleFX();
    this.on = {};                       // place/connect/disconnect/move/click/guard
    this.hover = null; this.drag = null; this.snap = null;
    this.redMsg = null; this.redT = 0; this.shake = 0;
    this._uid = 0; this._t = 0;
    this.raf = null;
    canvas.addEventListener('pointerdown', e => this._down(e));
    canvas.addEventListener('pointermove', e => this._move(e));
    canvas.addEventListener('pointerup', e => this._up(e));
    canvas.addEventListener('pointercancel', e => this._up(e));
  }

  xy(e) {
    const r = this.cv.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * this.W, (e.clientY - r.top) / r.height * this.H];
  }

  /* ————— 器材台（可拖入的 SKU 列表） ————— */
  setTray(list) {
    this.tray = list.map(o => ({ ...o, label: o.label || apparatus(o.key)?.label || o.key }));
    let x = 24;
    const n = this.tray.length, slotW = Math.min(96, (this.W - 40) / n);
    this.tray.forEach(s => { s.x = x + slotW / 2; s.slotW = slotW; x += slotW; });
  }

  /* ————— 实例管理 ————— */
  add(key, x, y, opt = {}) {
    const e = apparatus(key);
    if (!e) return null;
    const it = {
      uid: ++this._uid, key: e.id, def: e.def, cap: opt.cap ?? e.cap ?? 0,
      x, y, rot: opt.rot ?? 0, liq: null, powder: null, gasFrac: 0, flame: 0,
      locked: !!opt.locked, data: opt.data || {}, fsm: null
    };
    if (e.def.fsm) it.fsm = createFSM(e.def.fsm, e.def.fsmInitial || Object.keys(e.def.fsm)[0], it);
    if (opt.liq) it.liq = { vol: opt.liq.vol || 0, color: opt.liq.color || '#3f7fb5', max: opt.cap ?? e.cap ?? 100, wave: 0, vortex: 0 };
    if (opt.powder) it.powder = { ...opt.powder };
    this.items.push(it);
    this.on.place && this.on.place(it, opt);
    return it;
  }
  remove(it) {
    this.links = this.links.filter(l => l.a !== it && l.b !== it);
    this.items = this.items.filter(x => x !== it);
  }
  byId(id) { return this.items.find(i => i.uid === id) || null; }
  itemAt(x, y) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      const m = Math.max(it.def.w, it.def.h) / 2 + 4;
      if (Math.abs(x - it.x) < m && Math.abs(y - it.y) < m) return it;
    }
    return null;
  }

  anchor(it, iface) {
    const a = (it.rot || 0) * D2R, c = Math.cos(a), s = Math.sin(a);
    return [it.x + iface.dx * c - iface.dy * s, it.y + iface.dx * s + iface.dy * c];
  }

  /* ————— 指针交互 ————— */
  _down(e) {
    const [x, y] = this.xy(e);
    if (y > this.trayY - 6) {
      const slot = this.tray.find(s => Math.abs(x - s.x) < s.slotW / 2);
      if (slot) {
        this.drag = { src: 'tray', key: slot.key, cap: slot.cap, label: slot.label, x, y, ox: 0, oy: 0 };
        try { this.cv.setPointerCapture(e.pointerId); } catch (_) { }
        this.cv.classList.add('dragging');
      }
      return;
    }
    const it = this.itemAt(x, y);
    if (it && !it.locked) {
      this.drag = { src: 'item', it, x, y, ox: x - it.x, oy: y - it.y, moved: false, wasLinks: this.links.filter(l => l.a === it || l.b === it) };
      try { this.cv.setPointerCapture(e.pointerId); } catch (_) { }
      this.cv.classList.add('dragging');
    } else if (it) {
      this.on.click && this.on.click(it);
    }
  }
  _move(e) {
    const [x, y] = this.xy(e);
    if (!this.drag) {
      const it = y <= this.trayY && this.itemAt(x, y);
      this.hover = it || null;
      this.cv.classList.toggle('can-drag', !!(it && !it.locked));
      return;
    }
    const d = this.drag;
    if (d.src === 'tray') { d.x = x; d.y = y; }
    else {
      d.it.x = x - d.ox; d.it.y = y - d.oy;
      if (dist(x, y, d.x, d.y) > 4) d.moved = true;
    }
    // 吸附候选：拖拽物的接口 × 其他器材的接口
    const dragIfs = d.src === 'tray' ? (apparatus(d.key)?.def.interfaces || []) : d.it.def.interfaces;
    let best = null, bestD = 30;
    const targets = d.src === 'tray' ? this.items : this.items.filter(o => o !== d.it);
    for (const mi of dragIfs) {
      const [mx, my] = d.src === 'tray' ? [x + mi.dx, y + mi.dy] : this.anchor(d.it, mi);
      const ex = d.src === 'tray' ? apparatus(d.key)?.def : d.it.def;
      if (!ex) continue;
      for (const o of targets) {
        if (!allowed({ def: ex }, o) && !allowed(o, { def: ex })) continue;
        for (const oi of (o.def.interfaces || [])) {
          if (!PAIRS(mi.type).includes(oi.type)) continue;
          const [ox, oy] = this.anchor(o, oi);
          const dd = dist(mx, my, ox, oy);
          if (dd < bestD) { bestD = dd; best = { mi, b: o, bi: oi, tx: ox, ty: oy }; }
        }
      }
    }
    this.snap = best;
  }
  _up(e) {
    const d = this.drag;
    this.drag = null; this.cv.classList.remove('dragging');
    if (!d) return;
    const [x, y] = this.xy(e);
    if (d.src === 'tray') {
      if (y < this.trayY - 4) {
        const it = this.add(d.key, x, y, { cap: d.cap });
        if (it && this.snap) { this._place(it, this.snap); this._join(it, this.snap); }
      }
    } else {
      const it = d.it;
      if (!d.moved) { this.on.click && this.on.click(it); }
      else {
        if (d.wasLinks.length) {
          this.links = this.links.filter(l => l.a !== it && l.b !== it);
          this.on.disconnect && this.on.disconnect(it);
        }
        if (this.snap) { this._place(it, this.snap); this._join(it, this.snap); }
        else { this.on.move && this.on.move(it); }
      }
    }
    this.snap = null;
  }
  _place(it, snap) {
    const a = (it.rot || 0) * D2R, c = Math.cos(a), s = Math.sin(a);
    it.x = snap.tx - (snap.mi.dx * c - snap.mi.dy * s);
    it.y = snap.ty - (snap.mi.dx * s + snap.mi.dy * c);
    // 塞子类插入管口时稍微压入
    if (/stopper/.test(it.def.id) && snap.bi.type === 'mouth') {
      const dx = snap.b.x - it.x, dy = snap.b.y - it.y, L = Math.hypot(dx, dy) || 1;
      it.x += dx / L * 6; it.y += dy / L * 6;
    }
  }
  _join(it, snap) {
    const ok = this.on.connect ? this.on.connect(it, snap.b, snap) : true;
    if (ok === false) { this.links.pop(); return false; }
    this.links.push({ a: it, ai: snap.mi.id, b: snap.b, bi: snap.bi.id });
    return true;
  }
  breakLinks(it) {
    const had = this.links.some(l => l.a === it || l.b === it);
    this.links = this.links.filter(l => l.a !== it && l.b !== it);
    if (had) this.on.disconnect && this.on.disconnect(it);
    return had;
  }

  /* 红灯反馈：画布红闪 + 横幅文案 + 抖动 */
  flashRed(msg) { this.redMsg = msg; this.redT = 90; this.shake = 14; }
  flashYellow(msg) { this.redMsg = '⚠ ' + msg; this.redT = 70; }

  /* ————— 渲染主循环 ————— */
  render(t) {
    this._t = t;
    const g = this.g;
    g.save();
    if (this.shake > 0) {
      g.translate(Math.sin(t / 18) * this.shake, Math.cos(t / 23) * this.shake * 0.6);
      this.shake = Math.max(0, this.shake - 0.7);
    }
    this._bg(g);
    this._tray(g, t);
    // 电类连接画导线
    for (const l of this.links) {
      if (l.ai !== 'l' && l.ai !== 'r' && l.ai !== 'top') continue;
      const ia = l.a.def.interfaces.find(i => i.id === l.ai), ib = l.b.def.interfaces.find(i => i.id === l.bi);
      if (!ia || !ib || (ia.type !== 'elec' && ia.type !== 'side')) continue;
      const [ax, ay] = this.anchor(l.a, ia), [bx, by] = this.anchor(l.b, ib);
      g.strokeStyle = l.a.def.kind === 'wire' || l.b.def.kind === 'wire' ? '#c9a24a' : C.glassE;
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(ax, ay);
      g.quadraticCurveTo((ax + bx) / 2, Math.min(ay, by) - 18, bx, by); g.stroke();
    }
    for (const it of this.items) this._item(g, it, t);
    this.fx.draw(g);
    this._ui(g, t);
    g.restore();
    if (this.redT > 0) {
      this.redT--;
      g.fillStyle = this.redMsg && this.redMsg.startsWith('⚠') ? 'rgba(212,165,66,.18)' : 'rgba(198,90,65,.16)';
      g.fillRect(0, 0, this.W, this.H);
      if (this.redMsg) {
        g.fillStyle = this.redMsg.startsWith('⚠') ? C.gold2 : '#e8907d';
        g.font = 'bold 15px sans-serif';
        g.textAlign = 'center';
        g.fillText(this.redMsg, this.W / 2, 30);
        g.textAlign = 'left';
      }
    }
  }

  _bg(g) {
    const grd = g.createLinearGradient(0, 0, 0, this.trayY);
    grd.addColorStop(0, C.bgTop); grd.addColorStop(1, C.bg);
    g.fillStyle = grd; g.fillRect(0, 0, this.W, this.trayY);
    // 桌面木板
    g.fillStyle = C.plank; g.fillRect(0, this.trayY - 14, this.W, 14);
    for (let y = this.trayY - 4; y < this.trayY; y += 5) {
      g.strokeStyle = C.plankLine; g.beginPath(); g.moveTo(0, y); g.lineTo(this.W, y); g.stroke();
    }
    // 器材台
    g.fillStyle = C.tray; g.fillRect(0, this.trayY, this.W, this.H - this.trayY);
    g.strokeStyle = C.trayLine; g.beginPath(); g.moveTo(0, this.trayY); g.lineTo(this.W, this.trayY); g.stroke();
  }
  _tray(g, t) {
    for (const s of this.tray) {
      const e = apparatus(s.key);
      const hov = this.drag && this.drag.src === 'tray' && this.drag.key === s.key;
      g.save();
      g.globalAlpha = hov ? 0.25 : 1;
      g.translate(s.x, this.trayY + 30);
      if (e) {
        g.scale(0.72, 0.72);
        this._kind(g, { def: e.def, key: s.key, cap: s.cap, x: 0, y: 0, rot: 0, liq: null, powder: null, gasFrac: 0, flame: 0, fsm: null, data: {}, _t: t }, t);
      }
      g.restore();
      g.fillStyle = hov ? C.gold2 : C.muted;
      g.font = '10px sans-serif'; g.textAlign = 'center';
      g.fillText(s.label, s.x, this.H - 6);
      g.textAlign = 'left';
    }
  }

  _item(g, it, t) {
    const dragging = this.drag && this.drag.src === 'item' && this.drag.it === it;
    g.save();
    if (dragging) {
      g.fillStyle = 'rgba(0,0,0,.35)';
      g.beginPath(); g.ellipse(it.x + 6, this.trayY - 8, it.def.w / 2, 5, 0, 0, 7); g.fill();
      g.globalAlpha = 0.88;
    }
    if (it === this.hover && !dragging) {
      g.strokeStyle = C.gold; g.lineWidth = 1.4;
      g.strokeRect(it.x - it.def.w / 2 - 4, it.y - it.def.h / 2 - 4, it.def.w + 8, it.def.h + 8);
    }
    g.translate(it.x, it.y); g.rotate((it.rot || 0) * D2R);
    it._t = t;
    this._kind(g, it, t);
    g.restore();
  }

  _kind(g, it, t) {
    const fn = KINDS[it.def.kind];
    if (fn) fn.call(KINDS, g, it, t);
    else generic(g, it);
  }

  _ui(g, t) {
    // 吸附高亮
    if (this.snap) {
      const s = this.snap, pulse = 7 + Math.sin(t / 120) * 2.5;
      g.strokeStyle = C.gold2; g.lineWidth = 2;
      g.beginPath(); g.arc(s.tx, s.ty, pulse, 0, 7); g.stroke();
      const [mx, my] = this.drag && this.drag.src === 'tray'
        ? [this.drag.x + s.mi.dx, this.drag.y + s.mi.dy] : this.anchor(this.drag.it, s.mi);
      g.setLineDash([3, 3]);
      g.beginPath(); g.moveTo(mx, my); g.lineTo(s.tx, s.ty); g.stroke();
      g.setLineDash([]);
    }
    // 拖入台中的虚拟器材
    if (this.drag && this.drag.src === 'tray') {
      const e = apparatus(this.drag.key);
      if (e) {
        g.save();
        g.translate(this.drag.x, this.drag.y);
        g.globalAlpha = 0.9;
        this._kind(g, { def: e.def, key: this.drag.key, cap: this.drag.cap, x: 0, y: 0, rot: 0, liq: null, powder: null, gasFrac: 0, flame: 0, fsm: null, data: {} }, this._t);
        g.restore();
      }
    }
  }
}

/* ————— 渲染工具 ————— */
function glassFill(g) { g.fillStyle = C.glass; g.fill(); g.strokeStyle = C.glassE; g.lineWidth = 1.3; g.stroke(); }
function rim(g, x, y, w) { g.beginPath(); g.ellipse(x, y, w / 2, w / 7, 0, 0, 7); g.stroke(); }
function cap(g, x, y, w, h, col = C.metal) { g.fillStyle = col; g.fillRect(x - w / 2, y, w, h); }
function lbl(g, it) {
  g.fillStyle = 'rgba(234,228,210,.75)'; g.font = '9px sans-serif'; g.textAlign = 'center';
  g.fillText(it.def.name, 0, it.def.h / 2 + 11);
  g.textAlign = 'left';
}
function flame(g, x, y, scale, t) {
  const w = 7 * scale, h = 18 * scale, sway = Math.sin(t / 90) * 1.6;
  for (const [col, mw, mh, my] of [[C.flame3, 0.42, 0.42, 0], [C.flame1, 0.75, 0.75, 0], [C.flame2, 1, 1, 0]]) {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(x - w * mw / 2, y);
    g.quadraticCurveTo(x - w * mw / 2 + sway, y - h * mh * 0.55, x + sway * 1.6, y - h * mh);
    g.quadraticCurveTo(x + w * mw / 2 + sway, y - h * mh * 0.55, x + w * mw / 2, y);
    g.closePath(); g.fill();
  }
}
function generic(g, it) {
  g.fillStyle = 'rgba(143,116,207,.18)';
  g.strokeStyle = C.glassE; g.lineWidth = 1.2;
  g.beginPath(); g.roundRect(-it.def.w / 2, -it.def.h / 2, it.def.w, it.def.h, 5);
  g.fill(); g.stroke();
  g.fillStyle = C.ink; g.font = '10px sans-serif'; g.textAlign = 'center';
  g.fillText(it.def.name, 0, 3);
  g.textAlign = 'left';
}

/* ————— 各 kind 渲染器（局部坐标：器材中心为原点） ————— */
export const KINDS = {
  test_tube(g, it) {
    const w = 20, h = it.def.h;
    g.beginPath();
    g.moveTo(-w / 2, -h / 2 + 4); g.lineTo(-w / 2, h / 2 - w / 2);
    g.arc(0, h / 2 - w / 2, w / 2, Math.PI, 0, true);
    g.lineTo(w / 2, -h / 2 + 4);
    glassFill(g);
    rim(g, 0, -h / 2 + 3, w + 3);
    if (it.liq || it.powder) {
      const v = { kind: 'tube', x0: -w / 2 + 2, x1: w / 2 - 2, yTop: -h / 2 + 6, yBot: h / 2 - 3 };
      drawPowder(g, v, it.powder);
      drawLiquid(g, v, it.liq, it._t || 0);
    }
    lbl(g, it);
  },
  beaker(g, it) {
    const w = it.def.w - 8, h = it.def.h - 6, top = -h / 2;
    g.beginPath();
    g.moveTo(-w / 2, top + 4); g.lineTo(-w / 2, h / 2);
    g.arc(-w / 2 + 5, h / 2 - 5, 5, Math.PI, Math.PI / 2, true);
    g.lineTo(w / 2 - 5, h / 2 - 0); g.arc(w / 2 - 5, h / 2 - 5, 5, Math.PI / 2, 0, true);
    g.lineTo(w / 2, top + 4);
    glassFill(g);
    // 刻度
    g.strokeStyle = C.glassHi; g.lineWidth = 1;
    for (let i = 1; i <= 3; i++) { const y = top + 8 + i * (h - 16) / 4; g.beginPath(); g.moveTo(w / 2 - 9, y); g.lineTo(w / 2 - 3, y); g.stroke(); }
    // 嘴
    g.beginPath(); g.moveTo(w / 2, top + 4); g.lineTo(w / 2 + 5, top + 1); g.stroke();
    rim(g, 0, top + 3, w + 3);
    if (it.liq || it.powder) {
      const v = { kind: 'straight', x0: -w / 2 + 2, x1: w / 2 - 2, yTop: top + 6, yBot: h / 2 - 2 };
      drawPowder(g, v, it.powder);
      drawLiquid(g, v, it.liq, it._t || 0);
    }
    lbl(g, it);
  },
  flask_conical(g, it) {
    const w = it.def.w - 6, h = it.def.h - 4, top = -h / 2;
    g.beginPath();
    g.moveTo(-8, top + 2); g.lineTo(-w / 2, h / 2);
    g.lineTo(w / 2, h / 2); g.lineTo(8, top + 2);
    glassFill(g);
    g.beginPath(); g.moveTo(-8, top + 2); g.lineTo(-9, top - 8); g.moveTo(8, top + 2); g.lineTo(9, top - 8); g.stroke();
    rim(g, 0, top - 8, 22);
    if (it.liq || it.powder) {
      const yL = top + 10 + (1 - (it.liq ? it.liq.vol / (it.liq.max || 1) : 1)) * (h / 2 - 12);
      const v = { kind: 'straight', x0: -w / 2 + 3, x1: w / 2 - 3, yTop: Math.max(yL, top + 12), yBot: h / 2 - 2 };
      drawPowder(g, v, it.powder);
      drawLiquid(g, v, it.liq, it._t || 0);
    }
    lbl(g, it);
  },
  flask_round(g, it) {
    const h = it.def.h, neck = 12, bulb = 30, top = -h / 2;
    g.beginPath();
    g.moveTo(-5, top); g.lineTo(-5, top + h * 0.34);
    g.arc(0, top + h * 0.34 + bulb, bulb, Math.PI * 1.5 - 0.16, Math.PI * 0.5 + 0.16, true);
    g.lineTo(5, top);
    glassFill(g);
    rim(g, 0, top - 2, 14);
    if (it.liq || it.powder) {
      const v = { kind: 'round', x0: -bulb + 4, x1: bulb - 4, yTop: top + h * 0.36, yBot: top + h * 0.34 + bulb * 2 - 4 };
      drawPowder(g, v, it.powder);
      drawLiquid(g, v, it.liq, it._t || 0);
    }
    lbl(g, it);
  },
  bottle(g, it) {
    const w = it.def.w - 10, h = it.def.h, top = -h / 2;
    g.beginPath();
    g.moveTo(-6, top + 2); g.lineTo(-6, top + 10); g.lineTo(-w / 2, top + 16);
    g.lineTo(-w / 2, h / 2); g.lineTo(w / 2, h / 2); g.lineTo(w / 2, top + 16); g.lineTo(6, top + 10);
    g.lineTo(6, top + 2);
    glassFill(g);
    cap(g, 0, top - 4, 14, 7, '#4a3f66');
    // 内容物颜色（粉末/液体）
    if (it.data && it.data.fillColor) {
      g.fillStyle = it.data.fillColor;
      g.fillRect(-w / 2 + 2, h / 2 - 26, w - 4, 24);
    }
    // 标签
    g.fillStyle = 'rgba(234,228,210,.85)';
    g.fillRect(-w / 2 + 3, -4, w - 6, 14);
    g.fillStyle = '#3a2f5e'; g.font = '8px sans-serif'; g.textAlign = 'center';
    g.fillText(it.data.chemName || '试剂', 0, 6);
    g.textAlign = 'left';
    lbl(g, it);
  },
  watch_glass(g, it) {
    g.beginPath(); g.ellipse(0, 0, it.def.w / 2, 7, 0, 0, Math.PI);
    glassFill(g);
    lbl(g, it);
  },
  grad_cyl(g, it) {
    const w = 20, h = it.def.h, top = -h / 2;
    g.beginPath(); g.roundRect(-w / 2, top, w, h, [2, 2, 8, 8]); glassFill(g);
    g.beginPath(); g.ellipse(0, top + 3, w / 2, 3, 0, 0, Math.PI * 2); g.stroke();
    g.strokeStyle = C.glassHi;
    for (let i = 1; i <= 5; i++) { const y = top + 6 + i * (h - 14) / 6; const L = i % 2 ? 9 : 5; g.beginPath(); g.moveTo(w / 2 - L, y); g.lineTo(w / 2 - 2, y); g.stroke(); }
    g.fillStyle = C.metalD; g.fillRect(-w / 2 - 1, h / 2 - 10, w + 2, 5);
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -w / 2 + 2, x1: w / 2 - 2, yTop: top + 5, yBot: h / 2 - 7 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  volumetric(g, it) {
    const h = it.def.h, top = -h / 2, bw = it.def.w - 10;
    g.beginPath();
    g.moveTo(-6, top + 2); g.lineTo(-6, h / 2 - bw);
    g.arc(0, h / 2 - bw / 2, bw / 2, Math.PI * 1.5, Math.PI * 0.5, true);
    g.lineTo(6, top + 2);
    glassFill(g);
    rim(g, 0, top + 1, 15);
    g.strokeStyle = C.gold; g.beginPath(); g.moveTo(-9, top + 24); g.lineTo(9, top + 24); g.stroke();
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -bw / 2 + 3, x1: bw / 2 - 3, yTop: top + 26, yBot: h / 2 - 4 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  pipette(g, it) {
    const h = it.def.h, top = -h / 2;
    g.beginPath(); g.moveTo(-2.5, top + 8); g.lineTo(-2.5, h / 2 - 18); g.lineTo(-5, h / 2); g.lineTo(5, h / 2); g.lineTo(2.5, h / 2 - 18); g.lineTo(2.5, top + 8);
    glassFill(g);
    cap(g, 0, top, 7, 10, '#b0567a');
    g.strokeStyle = C.glassHi; g.beginPath(); g.moveTo(-6, 0); g.lineTo(6, 0); g.stroke();
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -2.5, x1: 2.5, yTop: 2, yBot: h / 2 - 4 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  burette(g, it) {
    const h = it.def.h, top = -h / 2;
    g.beginPath(); g.roundRect(-5, top, 10, h - 22, 2); glassFill(g);
    g.beginPath(); g.moveTo(-3, h / 2 - 22); g.lineTo(-1.4, h / 2 - 4); g.lineTo(1.4, h / 2 - 4); g.lineTo(3, h / 2 - 22);
    glassFill(g);
    // 活塞
    g.fillStyle = '#b0567a'; g.fillRect(-7, h / 2 - 12, 14, 5);
    g.strokeStyle = C.glassHi;
    for (let i = 1; i <= 8; i++) { const y = top + 4 + i * (h - 34) / 9; g.beginPath(); g.moveTo(2, y); g.lineTo(5, y); g.stroke(); }
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -4, x1: 4, yTop: top + 2, yBot: h / 2 - 23 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  dropper(g, it) {
    const h = it.def.h;
    g.beginPath(); g.moveTo(-3, -h / 2 + 14); g.lineTo(-3, h / 2 - 4); g.lineTo(3, h / 2 - 4); g.lineTo(3, -h / 2 + 14);
    glassFill(g);
    g.fillStyle = '#8f74cf'; g.beginPath(); g.ellipse(0, -h / 2 + 7, 6, 8, 0, 0, 7); g.fill();
    if (it.liq && it.liq.vol > 0) drawLiquid(g, { kind: 'straight', x0: -2.6, x1: 2.6, yTop: -h / 2 + 15, yBot: h / 2 - 6 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  glass_tube(g, it) {
    g.beginPath(); g.roundRect(-it.def.w / 2, -4, it.def.w, 8, 4); glassFill(g);
  },
  rubber_tube(g, it) {
    g.strokeStyle = '#6b5a86'; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-it.def.w / 2, 0); g.lineTo(it.def.w / 2, 0); g.stroke();
    g.lineCap = 'butt';
  },
  stopper(g, it) {
    g.fillStyle = '#4a3f66';
    g.beginPath(); g.moveTo(-8, -8); g.lineTo(8, -8); g.lineTo(11, 10); g.lineTo(-11, 10); g.closePath(); g.fill();
    g.fillStyle = '#3a3157'; g.fillRect(-12, 10, 24, 6);
  },
  stopper_tube(g, it) {
    // 玻璃导管横穿
    g.beginPath(); g.roundRect(-it.def.w / 2 + 12, -6, it.def.w - 12, 7, 3); glassFill(g);
    g.fillStyle = '#4a3f66';
    g.beginPath(); g.moveTo(-it.def.w / 2 + 2, -6); g.lineTo(-it.def.w / 2 + 20, -6); g.lineTo(-it.def.w / 2 + 26, 10); g.lineTo(-it.def.w / 2 - 4, 10); g.closePath(); g.fill();
    g.fillStyle = '#3a3157'; g.fillRect(-it.def.w / 2 - 8, 9, 36, 6);
  },
  stirring_rod(g, it) {
    g.beginPath(); g.roundRect(-it.def.w / 2, -3, it.def.w, 6, 3); glassFill(g);
  },
  funnel(g, it) {
    const w = it.def.w, h = it.def.h;
    g.beginPath();
    g.moveTo(-w / 2, -h / 2); g.lineTo(w / 2, -h / 2); g.lineTo(3, h / 2 - 10); g.lineTo(3, h / 2);
    g.lineTo(-3, h / 2); g.lineTo(-3, h / 2 - 10); g.closePath();
    glassFill(g);
    if (it.data && it.data.paper) {
      g.fillStyle = 'rgba(234,228,210,.35)';
      g.beginPath(); g.moveTo(-w / 2 + 3, -h / 2 + 2); g.lineTo(w / 2 - 3, -h / 2 + 2); g.lineTo(2, 2); g.lineTo(-2, 2); g.closePath(); g.fill();
    }
  },
  sep_funnel(g, it) {
    const w = it.def.w - 8, h = it.def.h, top = -h / 2;
    g.beginPath();
    g.moveTo(-7, top + 2); g.lineTo(-7, h / 2 - w / 2);
    g.arc(0, h / 2 - w / 2, w / 2, Math.PI * 1.5, Math.PI * 0.6, true);
    g.lineTo(7, top + 2);
    glassFill(g);
    rim(g, 0, top + 1, 17);
    g.fillStyle = '#b0567a'; g.fillRect(-8, h / 2 - 14, 16, 6);
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -w / 2 + 3, x1: w / 2 - 3, yTop: top + 8, yBot: h / 2 - 16 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  gas_wash_bottle(g, it) {
    const w = it.def.w - 8, h = it.def.h, top = -h / 2;
    g.beginPath(); g.roundRect(-w / 2, top, w, h, 6); glassFill(g);
    // 长进短出
    g.strokeStyle = C.glassE;
    g.beginPath(); g.moveTo(-w / 2 + 8, top); g.lineTo(-w / 2 + 8, h / 2 - 10); g.stroke();
    g.beginPath(); g.moveTo(w / 2 - 8, top); g.lineTo(w / 2 - 8, top + 14); g.stroke();
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -w / 2 + 2, x1: w / 2 - 2, yTop: top + 10, yBot: h / 2 - 3 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  wash_bottle(g, it) {
    const w = it.def.w - 6, h = it.def.h, top = -h / 2;
    g.beginPath(); g.roundRect(-w / 2, top + 6, w, h - 8, 6); glassFill(g);
    g.strokeStyle = C.glassE; g.beginPath(); g.moveTo(0, top + 6); g.lineTo(4, top - 4); g.lineTo(16, top - 2); g.stroke();
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -w / 2 + 2, x1: w / 2 - 2, yTop: top + 12, yBot: h / 2 - 3 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  evaporating_dish(g, it) {
    const w = it.def.w;
    g.beginPath(); g.ellipse(0, 0, w / 2, 9, 0, 0, Math.PI); glassFill(g);
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -w / 2 + 3, x1: w / 2 - 3, yTop: -2, yBot: 6 }, it.liq, it._t || 0);
    lbl(g, it);
  },
  crucible(g, it) {
    g.beginPath();
    g.moveTo(-it.def.w / 2, -it.def.h / 2); g.lineTo(it.def.w / 2, -it.def.h / 2);
    g.lineTo(it.def.w / 2 - 5, it.def.h / 2); g.lineTo(-it.def.w / 2 + 5, it.def.h / 2);
    g.closePath(); glassFill(g);
    cap(g, 0, -it.def.h / 2 - 3, it.def.w + 4, 4, '#7a6a4f');
    lbl(g, it);
  },
  mortar(g, it) {
    const w = it.def.w;
    g.beginPath();
    g.moveTo(-w / 2, -8); g.lineTo(w / 2, -8); g.lineTo(w / 2 - 7, 12); g.lineTo(-w / 2 + 7, 12); g.closePath();
    glassFill(g);
    g.beginPath(); g.roundRect(w / 2 - 16, -22, 6, 20, 3); glassFill(g);
    lbl(g, it);
  },
  alcohol_lamp(g, it, t) {
    const w = it.def.w - 6, h = it.def.h;
    g.beginPath();
    g.moveTo(-9, -h / 2 + 12); g.lineTo(-9, -4);
    g.arc(0, -2, w / 2, Math.PI * 1.45, Math.PI * 0.45, true);
    g.lineTo(9, -h / 2 + 12);
    glassFill(g);
    g.fillStyle = '#7a4fa0';
    g.beginPath(); g.arc(0, -2, w / 2 - 3, Math.PI, 0, true); g.fill();
    // 灯芯
    g.fillStyle = '#d8cfae'; g.fillRect(-2, -h / 2 + 2, 4, 12);
    if (it.fsm && it.fsm.state !== 'off') {
      const sc = it.fsm.state === 'heating' ? 1.35 : 1;
      flame(g, 0, -h / 2 + 4, sc, t);
    }
    lbl(g, it);
  },
  bunsen_burner(g, it, t) {
    const h = it.def.h;
    g.strokeStyle = C.metal; g.lineWidth = 4;
    g.beginPath(); g.moveTo(0, h / 2); g.lineTo(0, -h / 2 + 10); g.stroke();
    g.beginPath(); g.moveTo(-9, h / 2); g.lineTo(9, h / 2); g.stroke();
    g.fillStyle = C.metalD; g.fillRect(-6, -h / 2 + 6, 12, 6);
    if (it.fsm && it.fsm.state === 'lit') flame(g, 0, -h / 2 + 8, 1.2, t);
    lbl(g, it);
  },
  hotplate(g, it, t) {
    g.fillStyle = C.metalD; g.beginPath(); g.roundRect(-it.def.w / 2, 0, it.def.w, 12, 3); g.fill();
    g.fillStyle = it.fsm && it.fsm.state === 'on' ? '#c65a41' : '#3a3157';
    g.beginPath(); g.arc(it.def.w / 2 - 10, 6, 3, 0, 7); g.fill();
    if (it.fsm && it.fsm.state === 'on') {
      g.fillStyle = 'rgba(198,90,65,.15)';
      g.beginPath(); g.ellipse(0, -8, it.def.w / 2, 12, 0, 0, 7); g.fill();
    }
    lbl(g, it);
  },
  tripod(g, it) {
    const w = it.def.w, h = it.def.h;
    g.strokeStyle = C.metal; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(0, -h / 2 + 4, w / 2, 5, 0, 0, 7); g.stroke();
    for (const dx of [-w / 2, 0, w / 2]) { g.beginPath(); g.moveTo(dx === 0 ? -w / 2 : dx, -h / 2 + 4); g.lineTo(dx === 0 ? 0 : dx, h / 2); g.stroke(); }
  },
  asbestos_net(g, it) {
    g.strokeStyle = C.metal; g.lineWidth = 2;
    g.beginPath(); g.roundRect(-it.def.w / 2, -3, it.def.w, 6, 2); g.stroke();
    g.fillStyle = 'rgba(154,113,72,.7)';
    g.beginPath(); g.ellipse(0, 0, it.def.w / 2 - 8, 2.5, 0, 0, 7); g.fill();
  },
  iron_stand(g, it) {
    const w = it.def.w, h = it.def.h;
    g.fillStyle = C.metalD;
    g.beginPath(); g.roundRect(-w / 2, h / 2 - 12, w, 12, 3); g.fill();       // 底座
    g.fillStyle = C.metal;
    g.fillRect(w / 2 - 22, -h / 2, 6, h - 12);                              // 立杆(右)
    g.fillRect(w / 2 - 22, -h / 2, 20, 6);
  },
  clamp(g, it) {
    g.strokeStyle = C.metal; g.lineWidth = 4; g.lineCap = 'round';
    g.beginPath(); g.moveTo(-it.def.w / 2, 0); g.lineTo(it.def.w / 2 - 12, 0); g.stroke();
    g.lineCap = 'butt';
    g.beginPath(); g.arc(it.def.w / 2 - 7, 0, 8, Math.PI * 0.6, Math.PI * 1.6); g.stroke();
    g.fillStyle = '#4a3f66'; g.beginPath(); g.arc(-it.def.w / 2 + 4, 0, 5, 0, 7); g.fill();
  },
  ring(g, it) {
    g.strokeStyle = C.metal; g.lineWidth = 3;
    g.beginPath(); g.ellipse(0, 0, it.def.w / 2 - 4, 8, 0, 0, 7); g.stroke();
    g.beginPath(); g.moveTo(-it.def.w / 2 - 2, -10); g.lineTo(-it.def.w / 2 - 2, 10); g.stroke();
  },
  balance(g, it) {
    const w = it.def.w;
    g.fillStyle = C.metalD;
    g.beginPath(); g.roundRect(-w / 2, 8, w, 12, 3); g.fill();
    g.strokeStyle = C.metal; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, 8); g.lineTo(0, 0); g.stroke();
    g.beginPath(); g.moveTo(-w / 2 + 6, 0); g.lineTo(w / 2 - 6, 0); g.stroke();
    g.fillStyle = C.metalD;
    g.beginPath(); g.ellipse(-w / 2 + 14, -4, 13, 5, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(w / 2 - 14, -4, 13, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#d4a542'; g.font = '8px sans-serif'; g.textAlign = 'center';
    g.fillText(it.data.reading != null ? it.data.reading + ' g' : '0.0 g', 0, 20);
    g.textAlign = 'left';
  },
  thermometer(g, it) {
    const h = it.def.h;
    g.beginPath(); g.roundRect(-3, -h / 2, 6, h - 10, 3); glassFill(g);
    g.fillStyle = '#c65a41'; g.beginPath(); g.arc(0, h / 2 - 8, 4.5, 0, 7); g.fill();
    g.fillRect(-1.4, h / 2 - 10 - (it.data && it.data.t ? Math.min(h - 22, (it.data.t - 0) / 120 * (h - 22)) : 4), 2.8, h / 2 - 2);
    g.strokeStyle = C.glassHi;
    for (let i = 1; i <= 6; i++) { const y = -h / 2 + 4 + i * (h - 20) / 7; g.beginPath(); g.moveTo(3, y); g.lineTo(6, y); g.stroke(); }
  },
  ph_meter(g, it) {
    g.fillStyle = C.metalD; g.beginPath(); g.roundRect(-it.def.w / 2, -it.def.h / 2, it.def.w, it.def.h * 0.55, 4); g.fill();
    g.fillStyle = '#2a2445'; g.fillRect(-it.def.w / 2 + 6, -it.def.h / 2 + 6, it.def.w - 12, 14);
    g.fillStyle = '#2ea882'; g.font = '9px monospace'; g.textAlign = 'center';
    g.fillText(it.data.ph != null ? 'pH ' + it.data.ph : '7.00', 0, -it.def.h / 2 + 17);
    g.strokeStyle = C.metal; g.beginPath(); g.moveTo(0, -it.def.h / 2 + it.def.h * 0.55); g.lineTo(0, it.def.h / 2 - 6); g.stroke();
    g.beginPath(); g.ellipse(0, it.def.h / 2 - 3, 3, 5, 0, 0, 7); g.stroke();
    g.textAlign = 'left';
  },
  meter(g, it) {
    g.fillStyle = C.metalD; g.beginPath(); g.roundRect(-it.def.w / 2, -it.def.h / 2, it.def.w, it.def.h, 4); g.fill();
    g.fillStyle = '#2a2445'; g.beginPath(); g.arc(0, -2, it.def.w / 2 - 10, 0, 7); g.fill();
    g.strokeStyle = '#d4a542'; g.lineWidth = 1.5;
    const f = it.data && it.data.val != null ? Math.max(0, Math.min(1, Math.abs(it.data.val) / (it.data.max || 3))) : 0;
    const r = it.def.w / 2 - 12, a = Math.PI * (1 - f);
    g.beginPath(); g.moveTo(0, -2); g.lineTo(Math.cos(a) * r, -2 - Math.sin(a) * r); g.stroke();
    g.lineWidth = 1;
    g.fillStyle = '#d8cfae'; g.font = '8px sans-serif'; g.textAlign = 'center';
    g.fillText(it.data.label || (it.def.id === 'ammeter' ? 'A' : 'V'), 0, it.def.h / 2 - 4);
    g.textAlign = 'left';
  },
  stopwatch(g, it) {
    g.fillStyle = C.metalD; g.beginPath(); g.arc(0, 2, it.def.w / 2 - 2, 0, 7); g.fill();
    g.fillStyle = '#2a2445'; g.beginPath(); g.arc(0, 2, it.def.w / 2 - 6, 0, 7); g.fill();
    g.strokeStyle = '#d4a542'; g.lineWidth = 1.5;
    const sec = (it.data.sec || 0) % 60;
    const a = sec / 60 * Math.PI * 2 - Math.PI / 2;
    g.beginPath(); g.moveTo(0, 2); g.lineTo(Math.cos(a) * (it.def.w / 2 - 9), 2 + Math.sin(a) * (it.def.w / 2 - 9)); g.stroke();
    g.fillStyle = C.metalD; g.fillRect(-2, -it.def.h / 2 + 1, 4, 6);
  },
  gas_jar(g, it) {
    const w = it.def.w - 6, h = it.def.h, top = -h / 2;
    g.beginPath(); g.roundRect(-w / 2, top, w, h, [4, 4, 1, 1]); glassFill(g);
    if (it.gasFrac > 0) {
      // 气体区（浅色）
      g.fillStyle = 'rgba(220,235,255,.10)';
      g.fillRect(-w / 2 + 2, top + 2, w - 4, (h - 4) * it.gasFrac);
    }
    if (it.liq) {
      // 倒置集气瓶：水从"口"(局部 top) 向下被气体排开 —— 水面(局部) = top + gasFrac*内高
      const yGas = top + 3 + (h - 6) * it.gasFrac;
      drawLiquid(g, { kind: 'straight', x0: -w / 2 + 2, x1: w / 2 - 2, yTop: yGas, yBot: h / 2 - 2 }, { ...it.liq, vol: 1 }, it._t || 0);
    }
    lbl(g, it);
  },
  trough(g, it) {
    const w = it.def.w, h = it.def.h;
    g.beginPath();
    g.moveTo(-w / 2, -h / 2 + 4); g.lineTo(-w / 2 + 4, h / 2); g.lineTo(w / 2 - 4, h / 2); g.lineTo(w / 2, -h / 2 + 4);
    glassFill(g);
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -w / 2 + 3, x1: w / 2 - 3, yTop: -h / 2 + 8, yBot: h / 2 - 2 }, it.liq, it._t || 0);
  },
  gas_bag(g, it) {
    g.beginPath(); g.ellipse(0, 0, it.def.w / 2, it.def.h / 2, 0, 0, 7); glassFill(g);
    g.strokeStyle = C.glassE; g.beginPath(); g.moveTo(0, -it.def.h / 2); g.lineTo(0, -it.def.h / 2 - 6); g.stroke();
  },
  electrode(g, it) {
    g.fillStyle = it.data.col || C.metalD;
    g.beginPath(); g.roundRect(-3, -it.def.h / 2 + 6, 6, it.def.h - 6, 2); g.fill();
    cap(g, 0, -it.def.h / 2 + 2, 10, 6, '#b0567a');
    lbl(g, it);
  },
  wire(g, it) { generic(g, it); },
  switch(g, it) {
    g.strokeStyle = C.metal; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-it.def.w / 2, 6); g.lineTo(-6, 6); g.moveTo(6, 6); g.lineTo(it.def.w / 2, 6); g.stroke();
    g.beginPath(); g.moveTo(-6, 6);
    if (it.fsm && it.fsm.state === 'on') g.lineTo(6, 6); else g.lineTo(4, -8);
    g.stroke();
    g.fillStyle = C.metalD; g.beginPath(); g.arc(-6, 6, 3, 0, 7); g.arc(6, 6, 3, 0, 7); g.fill();
  },
  bulb(g, it) {
    const on = it.fsm && it.fsm.state === 'on';
    g.fillStyle = on ? '#f0c96a' : C.glass;
    g.beginPath(); g.arc(0, -4, 11, 0, 7); g.fill();
    g.strokeStyle = C.glassE; g.stroke();
    g.fillStyle = C.metalD; g.fillRect(-6, 5, 12, 8);
    if (on) { g.strokeStyle = '#f0c96a'; g.beginPath(); g.moveTo(0, -4); g.lineTo(3, -9); g.lineTo(0, -2); g.lineTo(-3, -8); g.stroke(); }
    else { g.strokeStyle = C.glassE; g.beginPath(); g.moveTo(-3, -7); g.lineTo(3, 0); g.stroke(); }
  },
  u_tube(g, it) {
    const w = it.def.w, h = it.def.h;
    g.beginPath();
    g.roundRect(-w / 2 + 6, -h / 2, 12, h - 4, 4);
    g.roundRect(w / 2 - 18, -h / 2, 12, h - 4, 4);
    g.roundRect(-w / 2 + 6, h / 2 - 16, w - 12, 12, 4);
    glassFill(g);
    if (it.liq) drawLiquid(g, { kind: 'straight', x0: -w / 2 + 8, x1: w / 2 - 8, yTop: -h / 2 + 14, yBot: h / 2 - 6 }, it.liq, it._t || 0);
  },
  spoon(g, it) {
    g.strokeStyle = C.metal; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-it.def.w / 2, 4); g.lineTo(it.def.w / 2 - 10, -2); g.stroke();
    g.fillStyle = it.data && it.data.loaded ? (it.data.powderColor || '#5a3a7a') : C.metalD;
    g.beginPath(); g.ellipse(it.def.w / 2 - 7, -3, 9, 5, -0.3, 0, 7); g.fill();
  },
  tweezers(g, it) {
    g.strokeStyle = C.metal; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-it.def.w / 2, -6); g.lineTo(-4, 4); g.moveTo(-it.def.w / 2, 2); g.lineTo(-4, 4);
    g.moveTo(-4, 4); g.lineTo(it.def.w / 2 - 6, 8); g.stroke();
  },
  match(g, it, t) {
    g.strokeStyle = C.wood; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-it.def.w / 2, 0); g.lineTo(it.def.w / 2 - 6, 0); g.stroke();
    g.fillStyle = '#b0567a'; g.beginPath(); g.ellipse(it.def.w / 2 - 4, 0, 5, 3.4, 0, 0, 7); g.fill();
    if (it.data && it.data.burning) flame(g, it.def.w / 2 - 2, -2, 0.7, t);
  },
  splint(g, it, t) {
    g.strokeStyle = C.wood; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-it.def.w / 2, 0); g.lineTo(it.def.w / 2, 0); g.stroke();
    flame(g, it.def.w / 2 - 2, -2, 0.6, t);
  },
  splint_fire(g, it, t) {
    g.strokeStyle = C.wood; g.lineWidth = 3;
    g.beginPath(); g.moveTo(-it.def.w / 2, 0); g.lineTo(it.def.w / 2, 0); g.stroke();
    g.fillStyle = 'rgba(232,112,58,.9)';
    g.beginPath(); g.arc(it.def.w / 2 - 2, -1, 2.6 + Math.sin(t / 130) * 0.7, 0, 7); g.fill();
    g.fillStyle = 'rgba(240,201,106,.5)';
    g.beginPath(); g.arc(it.def.w / 2 - 2, -2, 5 + Math.sin(t / 170) * 1.2, 0, 7); g.fill();
  },
  litmus_paper(g, it) {
    g.fillStyle = it.data.col || '#8f74cf';
    g.fillRect(-it.def.w / 2, -4, it.def.w, 9);
    g.strokeStyle = C.glassE; g.strokeRect(-it.def.w / 2, -4, it.def.w, 9);
  },
  ph_paper(g, it) {
    g.fillStyle = '#d8c968';
    g.fillRect(-it.def.w / 2, -4, it.def.w, 9);
    g.strokeStyle = C.glassE; g.strokeRect(-it.def.w / 2, -4, it.def.w, 9);
    if (it.data && it.data.ph != null) {
      g.fillStyle = '#3a2f5e'; g.font = '8px sans-serif'; g.textAlign = 'center';
      g.fillText('pH' + it.data.ph, 0, 12); g.textAlign = 'left';
    }
  },
  filter_paper(g, it) {
    g.fillStyle = 'rgba(234,228,210,.75)';
    g.beginPath(); g.arc(0, 0, it.def.w / 2, 0, 7); g.fill();
    g.strokeStyle = C.muted; g.stroke();
    g.beginPath(); g.moveTo(0, 0); g.lineTo(it.def.w / 2, 0); g.stroke();
  },
  cotton(g, it) {
    g.fillStyle = 'rgba(234,228,210,.9)';
    for (const [dx, dy, r] of [[-6, 0, 5], [0, -3, 6], [6, 1, 5], [0, 4, 5]]) {
      g.beginPath(); g.arc(dx, dy, r, 0, 7); g.fill();
    }
  }
};
