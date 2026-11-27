export function drawHologram(g, snapshot = {}, t = 0) {
  const w = g.canvas.width, h = g.canvas.height, s = Math.min(w / 640, h / 320);
  const cx = w / 2, cy = h / 2;
  g.clearRect(0, 0, w, h);
  const bg = g.createRadialGradient(cx, cy, 10, cx, cy, w * .65);
  bg.addColorStop(0, '#122b49'); bg.addColorStop(1, '#071321');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);

  g.save(); g.scale(s, s);
  g.strokeStyle = 'rgba(86,204,242,.09)'; g.lineWidth = 1;
  for (let x = 0; x <= 640; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 320); g.stroke(); }
  for (let y = 0; y <= 320; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(640, y); g.stroke(); }
  g.strokeStyle = 'rgba(86,204,242,.22)';
  g.beginPath(); g.ellipse(cx / s, 185, 235, 112, 0, 0, 7); g.stroke();
  g.beginPath(); g.ellipse(cx / s, 185, 185, 82, 0, 0, 7); g.stroke();

  g.fillStyle = '#8fd8f4'; g.font = '600 12px ui-monospace, monospace';
  g.fillText('PARTICLE HOLOGRAM / 教学示意', 22, 27);
  g.fillStyle = 'rgba(159,184,208,.65)'; g.font = '10px sans-serif';
  g.fillText('粒子大小、数量与运动不代表真实比例', 22, 44);

  const reaction = snapshot.reaction;
  if (reaction) {
    const ps = reaction.particles || [];
    const left = ps.filter(p => p.side !== 'products');
    const right = ps.filter(p => p.side === 'products');
    g.fillStyle = 'rgba(159,184,208,.7)'; g.font = '11px sans-serif';
    g.fillText('反应物', 128, 76); g.fillText('生成物', 448, 76);
    drawParticles(g, left, 195, 158, t, -1);
    drawParticles(g, right, 465, 158, t, reaction.effects?.precip ? 1 : 0);

    g.strokeStyle = '#f0c96a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(288, 166); g.lineTo(355, 166); g.stroke();
    g.fillStyle = '#f0c96a';
    g.beginPath(); g.moveTo(355, 166); g.lineTo(345, 160); g.lineTo(345, 172); g.closePath(); g.fill();
    for (let i = 0; i < 3; i++) {
      const x = 293 + ((t / 18 + i * 22) % 56);
      g.fillStyle = `rgba(240,201,106,${.35 + i * .2})`;
      g.beginPath(); g.arc(x, 166, 2.4, 0, 7); g.fill();
    }
    g.fillStyle = '#dcecf7'; g.font = '12px ui-monospace, monospace'; g.textAlign = 'center';
    g.fillText(reaction.title, 320, 284);
    g.fillStyle = 'rgba(159,184,208,.8)'; g.font = '10px sans-serif';
    g.fillText(reaction.products || '', 320, 303);
    g.textAlign = 'left';
  } else {
    const ids = (snapshot.contents || []).map(c => c.id).filter(Boolean);
    if (!ids.length) {
      g.fillStyle = 'rgba(159,184,208,.75)'; g.font = '14px sans-serif'; g.textAlign = 'center';
      g.fillText('把试剂拖入容器，开启粒子透镜', 320, 168);
      g.fillStyle = 'rgba(86,204,242,.45)'; g.font = '11px sans-serif';
      g.fillText('H₂O  ·  H⁺  ·  OH⁻  ·  Cu²⁺  ·  CO₃²⁻', 320, 194);
      g.textAlign = 'left';
    } else {
      const cols = Math.min(4, ids.length), rows = Math.ceil(ids.length / cols);
      ids.forEach((id, i) => {
        const x = 105 + (i % cols) * 145, y = 115 + Math.floor(i / cols) * 90;
        drawParticle(g, symbolOf(id), colorOf(id), x, y, 12 + Math.sin(t / 600 + i) * 2, i);
      });
      g.fillStyle = 'rgba(159,184,208,.75)'; g.font = '11px sans-serif'; g.textAlign = 'center';
      g.fillText('尚未发现明显反应 · 继续组合并观察', 320, 285); g.textAlign = 'left';
    }
  }

  if (snapshot.safety) {
    g.fillStyle = 'rgba(110,24,31,.78)'; g.fillRect(0, 0, 640, 320);
    g.strokeStyle = '#e8907d'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(320, 78); g.lineTo(370, 96); g.lineTo(364, 148);
    g.quadraticCurveTo(352, 190, 320, 208); g.quadraticCurveTo(288, 190, 276, 148);
    g.lineTo(270, 96); g.closePath(); g.stroke();
    g.fillStyle = '#e8907d'; g.font = 'bold 30px sans-serif'; g.textAlign = 'center';
    g.fillText('!', 320, 159);
    g.font = 'bold 15px sans-serif'; g.fillText('危险操作已拦截', 320, 242);
    g.fillStyle = '#f3c1b3'; g.font = '11px sans-serif';
    g.fillText('酸入水 · 沿壁缓加 · 边加边搅', 320, 267); g.textAlign = 'left';
  }
  g.restore();
}

function drawParticles(g, particles, x, y, t, settle) {
  particles.forEach((p, i) => {
    const n = Math.min(8, Math.max(3, p.count || 5));
    for (let j = 0; j < n; j++) {
      const a = j / n * Math.PI * 2 + t / (700 + i * 90) + i;
      const r = 18 + (j % 3) * 16;
      const py = y + Math.sin(a) * r * .55 + settle * ((j % 3) * 8);
      drawParticle(g, p.symbol, p.color, x + Math.cos(a) * r * 1.35, py, 10 + (j % 2) * 2, i * 7 + j);
    }
  });
}

function drawParticle(g, symbol, color, x, y, r, seed) {
  const glow = g.createRadialGradient(x, y, 1, x, y, r * 2.2);
  glow.addColorStop(0, color + 'aa'); glow.addColorStop(1, color + '00');
  g.fillStyle = glow; g.beginPath(); g.arc(x, y, r * 2.2, 0, 7); g.fill();
  g.fillStyle = color; g.globalAlpha = .82;
  g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  g.globalAlpha = 1; g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1;
  g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke();
  g.fillStyle = '#071321'; g.font = `700 ${Math.max(7, r * .72)}px ui-monospace, monospace`;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(symbol, x, y + Math.sin(seed) * .4);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
}

function symbolOf(id) {
  return ({ water: 'H₂O', hcl: 'H⁺', h2so4: 'H⁺', h2so4_conc: 'H₂SO₄', naoh: 'OH⁻', caoh2: 'Ca²⁺',
    cuso4: 'Cu²⁺', fecl3: 'Fe³⁺', na2co3: 'CO₃²⁻', cabbage: '花青素', phen: '酚酞',
    fe: 'Fe', zn: 'Zn', caco3: 'CaCO₃' })[id] || id;
}

function colorOf(id) {
  return ({ water: '#82b6e8', hcl: '#f0c96a', h2so4: '#f0c96a', h2so4_conc: '#d8cda9', naoh: '#8fe0c6',
    caoh2: '#b8d4e8', cuso4: '#56a9df', fecl3: '#d58b4f', na2co3: '#d8cfae', cabbage: '#b06a9c',
    phen: '#e88fb0', fe: '#9aa4b5', zn: '#b8c2d0', caco3: '#e8dfc8' })[id] || '#9fb8d0';
}

export function createHologram(canvas, getSnapshot) {
  const g = canvas.getContext('2d');
  let raf = null, visible = false, observer = null;
  function resize() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.max(320, Math.round(r.width * dpr));
    const h = Math.round(w * .5);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }
  function loop(t) {
    if (!visible) return;
    resize(); drawHologram(g, getSnapshot(), t);
    raf = requestAnimationFrame(loop);
  }
  const api = {
    show() {
      if (visible) return;
      visible = true; resize(); loop(performance.now());
    },
    hide() { visible = false; cancelAnimationFrame(raf); raf = null; },
    toggle() { visible ? api.hide() : api.show(); },
    destroy() {
      api.hide();
      if (observer) observer.disconnect();
    }
  };
  if (typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(() => { if (visible) resize(); });
    observer.observe(canvas);
  }
  return api;
}
