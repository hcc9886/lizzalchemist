// 液体粒子—体积双态模型：
//   体积态：容器内液面（体积→液面高度按器形曲线映射，凹液面/表面微波动）
//   粒子态：倾倒自由落体流、气泡上浮、沉淀下沉、涡流搅拌
// 所有函数只认 vessel 几何 + liq 状态，不关心具体实验。

/* 容器内体积 → 液面 y（vessel: {kind,x0,x1,yTop,yBot}） */
export function levelY(vessel, liq) {
  const cap = liq.max || 1;
  const f = Math.max(0, Math.min(1, liq.vol / cap));
  const h = vessel.yBot - vessel.yTop;
  if (f <= 0) return vessel.yBot;
  let fy;
  if (vessel.kind === 'tube') {
    // 圆底试管：底部 18% 高度只容纳 ~7% 体积（球冠），其余近似线性
    fy = f < 0.07 ? Math.sqrt(f / 0.07) * 0.18 : 0.18 + 0.82 * (f - 0.07) / 0.93;
  } else if (vessel.kind === 'round') {
    // 圆底烧瓶肚：底部 40% 高度容纳 ~22% 体积
    fy = f < 0.22 ? Math.sqrt(f / 0.22) * 0.40 : 0.40 + 0.60 * (f - 0.22) / 0.78;
  } else {
    fy = f; // 直壁：线性
  }
  return vessel.yBot - h * fy;
}

/* 在 vessel 内画液体（局部坐标，可在旋转后的 ctx 中调用） */
export function drawLiquid(g, vessel, liq, t) {
  if (!liq || liq.vol <= 0) return;
  const ySurf = levelY(vessel, liq);
  const hw = (vessel.x1 - vessel.x0) / 2, cx = (vessel.x0 + vessel.x1) / 2;
  // 凹液面：边缘略高（更小 y）
  const men = Math.min(2, hw * 0.09);
  g.beginPath();
  g.moveTo(vessel.x0, ySurf + men);
  g.quadraticCurveTo(cx, ySurf - men * 0.6, vessel.x1, ySurf + men);
  if (vessel.kind === 'tube' || vessel.kind === 'round') {
    g.quadraticCurveTo(vessel.x1, vessel.yBot + hw * 0.6, cx, vessel.yBot + hw * 0.6);
    g.quadraticCurveTo(vessel.x0, vessel.yBot + hw * 0.6, vessel.x0, ySurf + men);
  } else {
    g.lineTo(vessel.x1, vessel.yBot);
    g.lineTo(vessel.x0, vessel.yBot);
  }
  g.closePath();
  g.fillStyle = liq.color;
  g.fill();
  // 表面高光
  g.strokeStyle = 'rgba(255,255,255,.35)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(vessel.x0 + 1, ySurf + men * 0.8);
  g.quadraticCurveTo(cx, ySurf - men * 0.5, vessel.x1 - 1, ySurf + men * 0.8);
  g.stroke();
  // 微波纹（时间驱动）
  if (liq.wave) {
    g.strokeStyle = 'rgba(255,255,255,.18)';
    const ph = (t / 300) % 1;
    const yy = ySurf + men + (vessel.yBot - ySurf) * ph * 0.5;
    if (yy < vessel.yBot) {
      g.beginPath();
      for (let x = vessel.x0; x <= vessel.x1; x += 6) g.lineTo(x, yy + Math.sin(x / 5 + t / 200) * 1.2);
      g.stroke();
    }
  }
  // 涡流
  if (liq.vortex > 0) {
    g.save();
    g.translate(cx, (ySurf + vessel.yBot) / 2);
    g.rotate(t / 140);
    g.strokeStyle = 'rgba(255,255,255,.30)';
    g.lineWidth = 1.4;
    for (let i = 0; i < 2; i++) {
      g.beginPath();
      g.ellipse(0, 0, hw * 0.55 - i * 5, (vessel.yBot - ySurf) * 0.28 - i * 3, 0, 0, 7);
      g.stroke();
    }
    g.restore();
  }
}

/* 固体粉末：底部堆积（mound） */
export function drawPowder(g, vessel, powder) {
  if (!powder || powder.amt <= 0) return;
  const cx = (vessel.x0 + vessel.x1) / 2, hw = (vessel.x1 - vessel.x0) / 2;
  const hgt = Math.min((vessel.yBot - vessel.yTop) * 0.4, 4 + powder.amt * 2.2);
  g.beginPath();
  g.moveTo(vessel.x0, vessel.yBot + (vessel.kind === 'tube' ? 2 : 0));
  g.quadraticCurveTo(cx, vessel.yBot - hgt * 1.7, vessel.x1, vessel.yBot + (vessel.kind === 'tube' ? 2 : 0));
  g.closePath();
  g.fillStyle = powder.color;
  g.fill();
  // 颗粒质感
  g.fillStyle = 'rgba(255,255,255,.14)';
  for (let i = 0; i < 6; i++) {
    const px = cx - hw * 0.6 + ((i * 37) % 100) / 100 * hw * 1.2;
    g.fillRect(px, vessel.yBot - (i % 3) * hgt * 0.3 - 1, 2, 2);
  }
}

/* ————— 粒子系统 ————— */
export class ParticleFX {
  constructor() { this.parts = []; }
  clear() { this.parts.length = 0; }

  /* 自由落体流（倾倒/粉末落入）：target y 处消失 */
  emitStream(x, y, vx, vy, color, n = 2, targetY = 1e9) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        type: 'stream', x: x + (Math.random() - 0.5) * 3, y: y + (Math.random() - 0.5) * 3,
        vx: vx + (Math.random() - 0.5) * 0.5, vy: vy + Math.random() * 0.4,
        life: 0, max: 120, r: 1.4 + Math.random(), color, targetY
      });
    }
  }
  /* 气泡：在液体内上浮至 surfaceY */
  emitBubble(x, y, surfaceY, r = 2 + Math.random() * 2) {
    this.parts.push({
      type: 'bubble', x, y, vx: (Math.random() - 0.5) * 0.4, vy: -(0.5 + Math.random() * 0.9),
      life: 0, max: 240, r, surfaceY, wobble: Math.random() * 6.28
    });
  }
  /* 沉淀颗粒：缓慢下沉至 botY */
  emitPrecip(x, y, botY, color, n = 1) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        type: 'precip', x: x + (Math.random() - 0.5) * 6, y: y + (Math.random() - 0.5) * 4,
        vx: 0, vy: 0.12 + Math.random() * 0.18, life: 0, max: 400, r: 1 + Math.random() * 1.2, color, botY
      });
    }
  }
  /* 烟/蒸汽：向上飘散变淡 */
  emitSmoke(x, y, color = 'rgba(200,200,210,.5)', n = 1) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        type: 'smoke', x: x + (Math.random() - 0.5) * 4, y,
        vx: (Math.random() - 0.5) * 0.3, vy: -(0.25 + Math.random() * 0.3),
        life: 0, max: 150 + Math.random() * 80, r: 2.5 + Math.random() * 2, color
      });
    }
  }

  update(dt = 1) {
    const ps = this.parts;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life += dt;
      if (p.type === 'stream') {
        p.vy += 0.22 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y >= p.targetY || p.life > p.max) ps.splice(i, 1);
      } else if (p.type === 'bubble') {
        p.x += (p.vx + Math.sin((p.life + p.wobble) / 9) * 0.35) * dt;
        p.y += p.vy * dt;
        if (p.y <= p.surfaceY || p.life > p.max) ps.splice(i, 1);
      } else if (p.type === 'precip') {
        if (p.y < p.botY) { p.y += p.vy * dt; p.x += Math.sin(p.life / 10) * 0.2; }
        if (p.life > p.max) ps.splice(i, 1);
      } else if (p.type === 'smoke') {
        p.x += p.vx * dt; p.y += p.vy * dt; p.r += 0.04 * dt;
        if (p.life > p.max) ps.splice(i, 1);
      }
    }
  }

  draw(g) {
    for (const p of this.parts) {
      if (p.type === 'stream') {
        g.fillStyle = p.color;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      } else if (p.type === 'bubble') {
        g.strokeStyle = 'rgba(230,240,255,.8)'; g.lineWidth = 1;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.stroke();
        g.fillStyle = 'rgba(230,240,255,.12)'; g.fill();
      } else if (p.type === 'precip') {
        g.fillStyle = p.color;
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      } else if (p.type === 'smoke') {
        const a = 1 - p.life / p.max;
        g.fillStyle = p.color.replace(/[\d.]+\)$/, (a * 0.5).toFixed(2) + ')');
        g.beginPath(); g.arc(p.x, p.y, p.r, 0, 7); g.fill();
      }
    }
  }
}

/* 倾倒一步（体积转移 + 近满减速 + 溢出）：由实验在帧循环里调用 */
export function pourStep(from, to, rate) {
  if (!from.liq || from.liq.vol <= 0 || !to.liq) return { moved: 0, overflow: false };
  let r = rate;
  if (to.liq.vol / to.liq.max > 0.85) r *= Math.max(0.12, 1.25 - to.liq.vol / to.liq.max);
  const moved = Math.min(from.liq.vol, r);
  from.liq.vol -= moved;
  to.liq.vol += moved;
  let overflow = false;
  if (to.liq.vol > to.liq.max) { overflow = true; to.liq.vol = to.liq.max; }
  from.liq.wave = 1; to.liq.wave = 1;
  return { moved, overflow };
}
