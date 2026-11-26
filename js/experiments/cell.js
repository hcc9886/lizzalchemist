// 实验7：原电池（v2：拖拽电极 + 实验套件）
import { createKit, drag, hotspot } from '../expkit.js';

const METALS = {
  mg: { name: '镁 Mg', e: -2.37, color: '#c9c9d4', ion: 'Mg²⁺' },
  zn: { name: '锌 Zn', e: -0.76, color: '#9aa4b5', ion: 'Zn²⁺' },
  fe: { name: '铁 Fe', e: -0.44, color: '#7a8699', ion: 'Fe²⁺' },
  cu: { name: '铜 Cu', e: 0.34, color: '#c8843c', ion: 'Cu²⁺' }
};
const ELECTROLYTES = {
  cus: { name: 'CuSO₄ 溶液', cat: { reactant: 'Cu²⁺', product: 'Cu', product2: 'Cu' } },
  zns: { name: 'ZnSO₄ 溶液', cat: { reactant: 'Zn²⁺', product: 'Zn', product2: 'Zn' } },
  h2so4: { name: '稀硫酸 H₂SO₄', cat: { reactant: '2H⁺', product: 'H₂↑', product2: 'H₂' } }
};

let raf = null, state = null;

export default {
  id: 'cell', title: '原电池', oneLine: '把两种金属插入电解液：电子怎么流、灯泡亮不亮、电压多大。电极可以直接拖拽更换。',
  tags: ['中学', '电化学', '氧化还原'],
  safety: ['虚拟实验无危险。现实中稀酸与盐溶液操作要戴护目镜，废液须分类回收。'],
  render(root, ctx) {
    state = { an: 'zn', ca: 'cu', el: 'h2so4', elsSeen: { h2so4: true }, eqShown: false, drag: null };

    const kit = createKit(root, {
      narr: '把底部金属架上的<b>金属条拖到烧杯口</b>即可更换电极。负极越活泼、正极越不活泼，电压越高。',
      chal: '点亮灯泡，并找出电压 ≥ 2.5 V 的"最强组合"。',
      ach: 'cell_volt',
      goals: [
        { id: 'g1', text: '组装电池并点亮灯泡（E ≥ 0.8 V）' },
        { id: 'g2', text: '换 3 种电解液，观察正极反应的变化' },
        { id: 'g3', text: '找到电压 ≥ 2.5 V 的电极组合' }
      ],
      steps: [
        { t: '认识结构', d: '两个半电池 + 盐桥。负极金属失电子被氧化（溶解），电子经导线流向正极。' },
        { t: '换电极', d: '从底部拖金属条到烧杯口，或用左侧下拉框。金属活动性：Mg > Zn > Fe > Cu。' },
        { t: '换电解液', d: '稀硫酸里正极冒氢气；CuSO₄ 里正极析出红色铜。电压由电极决定，反应由电解液决定。' },
        { t: '找最大电压', d: 'E = |E正 − E负|。Mg(−2.37) + Cu(+0.34) 是本实验的天花板。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>负极（较活泼）</label>
            <select id="e-an">${Object.entries(METALS).map(([k, v]) => `<option value="${k}" ${k === 'zn' ? 'selected' : ''}>${v.name}（E°=${v.e}V）</option>`).join('')}</select></div>
          <div class="ctl"><label>正极（较不活泼）</label>
            <select id="e-ca">${Object.entries(METALS).map(([k, v]) => `<option value="${k}" ${k === 'cu' ? 'selected' : ''}>${v.name}（E°=${v.e}V）</option>`).join('')}</select></div>
          <div class="ctl"><label>电解液</label>
            <select id="e-el">${Object.entries(ELECTROLYTES).map(([k, v]) => `<option value="${k}" ${k === 'h2so4' ? 'selected' : ''}>${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><button class="btn small" id="e-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="e-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">电压 E <b id="ro-v">— V</b></div>
        <div class="chip">负极反应 <b id="ro-an">—</b></div>
        <div class="chip">正极反应 <b id="ro-ca">—</b></div>
        <div class="chip">总反应 <b id="ro-tot">—</b></div>
        <div class="chip">灯泡 <b id="ro-lamp">—</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('e-canvas');
    const g2d = canvas.getContext('2d');

    const cellV = () => {
      const a = METALS[state.an], c = METALS[state.ca];
      if (a.e === c.e) return 0;
      return Math.abs(c.e - a.e);
    };

    function halfReactions() {
      const a = METALS[state.an], c = METALS[state.ca];
      const cat = ELECTROLYTES[state.el].cat;
      if (a.e === c.e) return { an: '不反应（同种金属）', ca: '—', tot: '—' };
      const hi = a.e > c.e ? a : c;
      const lo = a.e > c.e ? c : a;
      const an = lo.name.split(' ')[0] + ' − 2e⁻ → ' + lo.ion;
      let ca, tot;
      if (state.el === 'h2so4') {
        ca = '2H⁺ + 2e⁻ → H₂↑（在' + hi.name.split(' ')[0] + '表面）';
        tot = lo.ion.replace('²⁺', '') + ' + 2H⁺ → ' + lo.ion + ' + H₂↑';
      } else {
        ca = cat.reactant + ' + 2e⁻ → ' + cat.product;
        tot = lo.ion.replace('²⁺', '') + ' + ' + cat.reactant + ' → ' + lo.ion + ' + ' + cat.product;
      }
      return { an, ca, tot };
    }

    function onCombo() {
      const V = cellV();
      if (V >= 0.8) kit.goal('g1', true);
      if (V >= 2.5) {
        kit.goal('g3', true);
        kit.say('<b>2.5 V 达成</b>！Mg − Cu 是这套电极里的天花板。想想：还能更猛吗？（锂电：−3.04 对 +0.34）');
      }
      if (!state.eqShown && V > 0.2) {
        state.eqShown = true;
        kit.eq(halfReactions().tot);
      }
    }

    const beakerL = { x: 70, y: 150, w: 180, h: 210 };
    const beakerR = { x: 400, y: 150, w: 180, h: 210 };
    const SHELF_Y = 396;
    const shelfSlots = Object.keys(METALS).map((k, i) => ({ key: k, x: 90 + i * 60, y: SHELF_Y }));

    const spots = [
      { x: 325, y: 185, r: 14, title: '盐桥是干嘛的', body: '它让离子在两个半电池间迁移，维持溶液电中性——没有它，电荷一堆积反应立刻停止。现实里它是装满 KNO₃ 琼脂的 U 形管。' },
      { x: 324, y: 84, r: 14, title: '化学能 → 电能', body: '电子不做"免费旅行"：它们经过灯泡时把能量交出去（发光发热）。电池的本质就是<b>把氧化还原反应的空间分离变现为电流</b>。' },
      { x: 110, y: 300, r: 14, title: '负极在溶解', body: '活泼金属失去电子变成离子进入溶液（氧化），所以锌片会变细、表面冒泡的是正极那侧的氢气。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    drag(canvas, {
      hit(x, y) {
        for (const s of shelfSlots) {
          if (x > s.x - 6 && x < s.x + 50 && y > s.y - 26 && y < s.y + 8) return s.key;
        }
        if (!state.drag) {
          const anX = beakerL.x + 40, caX = beakerR.x + beakerR.w - 65;
          if (x > anX - 8 && x < anX + 33 && y > beakerL.y + 22 && y < beakerL.y + 190) return 'an';
          if (x > caX - 8 && x < caX + 33 && y > beakerR.y + 22 && y < beakerR.y + 190) return 'ca';
        }
        return null;
      },
      start(x, y, hit) {
        state.drag = { key: METALS[hit] ? hit : null, slot: METALS[hit] ? null : hit, x, y };
        if (state.drag.key) kit.say('拿起' + METALS[hit].name + '——拖到任一烧杯口松手，替换那一侧的电极。');
        else kit.say('直接把这块电极拖到下面金属架，或拖到另一侧更换。');
      },
      move(x, y) { if (state.drag) { state.drag.x = x; state.drag.y = y; } },
      end(x, y, hit) {
        const d = state.drag;
        state.drag = null;
        if (d.key) {
          let placed = null;
          if (x > 60 && x < 270 && y > 140 && y < 220) placed = 'an';
          else if (x > 390 && x < 600 && y > 140 && y < 220) placed = 'ca';
          if (placed) {
            state[placed] = d.key;
            $('e-an').value = state.an; $('e-ca').value = state.ca;
            kit.say(METALS[d.key].name + ' → ' + (placed === 'an' ? '负极' : '正极') + '。E = ' + cellV().toFixed(2) + ' V。');
            onCombo();
          }
        } else if (d.slot && y > SHELF_Y - 30) {
          const onShelf = shelfSlots.find(s => x > s.x - 6 && x < s.x + 50);
          if (onShelf) {
            state[d.slot] = onShelf.key;
            $('e-an').value = state.an; $('e-ca').value = state.ca;
            kit.say('换成' + METALS[onShelf.key].name + '。E = ' + cellV().toFixed(2) + ' V。');
            onCombo();
          }
        }
      }
    });

    function updateRO() {
      const V = cellV();
      $('ro-v').textContent = V.toFixed(2) + ' V';
      const h = halfReactions();
      $('ro-an').textContent = h.an;
      $('ro-ca').textContent = h.ca;
      $('ro-tot').textContent = h.tot;
      $('ro-lamp').textContent = V >= 1.5 ? '明亮' : V >= 0.8 ? '正常发光' : V > 0.2 ? '微光' : '不亮（电压≈0）';
    }

    function drawElectrode(b, key, isAn, t) {
      const m = METALS[key];
      const x = b.x + (isAn ? 40 : b.w - 65);
      const hidden = state.drag && ((isAn && state.drag.slot === 'an') || (!isAn && state.drag.slot === 'ca'));
      if (!hidden) {
        g2d.fillStyle = m.color;
        g2d.fillRect(x, b.y + 30, 25, 150);
        g2d.strokeStyle = '#0d0b16'; g2d.strokeRect(x, b.y + 30, 25, 150);
        g2d.fillStyle = '#e8dfc8'; g2d.font = '13px sans-serif';
        g2d.fillText(m.name, x - 10, b.y + 24);
        if (isAn) {
          for (let i = 0; i < 5; i++) {
            const py = b.y + 180 - ((t * 2 + i * 37) % 140);
            g2d.fillStyle = 'rgba(232,223,200,.5)';
            g2d.beginPath(); g2d.arc(x + 12, py, 2.5, 0, 7); g2d.fill();
          }
        } else if (state.el === 'h2so4') {
          for (let i = 0; i < 8; i++) {
            const py = b.y + 180 - ((t * 3 + i * 29) % 150);
            g2d.fillStyle = 'rgba(232,223,200,.6)';
            g2d.beginPath(); g2d.arc(x + 12, py, 3, 0, 7); g2d.fill();
          }
        } else {
          g2d.fillStyle = state.el === 'cus' ? '#c8843c' : '#9aa4b5';
          g2d.fillRect(x + 2, b.y + 140, 21, 40);
        }
        g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
        g2d.fillText(isAn ? '负极（氧化）' : '正极（还原）', x - 24, b.y + b.h + 20);
      }
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now() / 40;
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      [beakerL, beakerR].forEach(b => {
        g2d.strokeStyle = '#3a3358'; g2d.strokeRect(b.x, b.y, b.w, b.h);
        g2d.fillStyle = state.el === 'h2so4' ? 'rgba(95,147,201,.25)' : state.el === 'cus' ? 'rgba(200,132,60,.22)' : 'rgba(154,164,181,.22)';
        g2d.fillRect(b.x + 2, b.y + 40, b.w - 4, b.h - 42);
      });
      // shelf
      g2d.fillStyle = '#221d40'; g2d.fillRect(80, SHELF_Y - 2, 240, 4);
      g2d.fillStyle = '#5c5578'; g2d.font = '11px sans-serif';
      g2d.fillText('金属架（拖到烧杯口换电极）', 80, SHELF_Y + 16);
      shelfSlots.forEach(s => {
        const m = METALS[s.key];
        g2d.fillStyle = m.color;
        g2d.fillRect(s.x, s.y - 20, 44, 18);
        g2d.strokeStyle = '#0d0b16'; g2d.strokeRect(s.x, s.y - 20, 44, 18);
        g2d.fillStyle = '#e8dfc8'; g2d.font = '11px sans-serif';
        g2d.fillText(s.key.toUpperCase(), s.x + 15, s.y - 6);
      });
      // salt bridge
      g2d.strokeStyle = '#5c5578'; g2d.lineWidth = 10;
      g2d.beginPath(); g2d.moveTo(250, 200); g2d.quadraticCurveTo(325, 160, 400, 200); g2d.stroke();
      g2d.lineWidth = 1;
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('盐桥（KNO₃）', 285, 152);
      drawElectrode(beakerL, state.an, true, t);
      drawElectrode(beakerR, state.ca, false, t);
      // dragging visual
      if (state.drag && state.drag.key) {
        const m = METALS[state.drag.key];
        g2d.fillStyle = m.color;
        g2d.fillRect(state.drag.x - 22, state.drag.y - 9, 44, 18);
        g2d.strokeStyle = '#0d0b16'; g2d.strokeRect(state.drag.x - 22, state.drag.y - 9, 44, 18);
      }
      // wire with bulb
      const V = cellV();
      g2d.strokeStyle = '#f0c96a'; g2d.lineWidth = 2.5;
      g2d.beginPath();
      g2d.moveTo(beakerL.x + 52, beakerL.y + 30);
      g2d.lineTo(beakerL.x + 52, 90);
      g2d.lineTo(300, 90); g2d.lineTo(348, 90);
      g2d.lineTo(beakerR.x + beakerR.w - 52, 90);
      g2d.lineTo(beakerR.x + beakerR.w - 52, beakerR.y + 30);
      g2d.stroke(); g2d.lineWidth = 1;
      const bx = 300, by = 60;
      const glow = V >= 1.5 ? 22 : V >= 0.8 ? 14 : V > 0.2 ? 7 : 0;
      if (glow > 0) {
        const grad = g2d.createRadialGradient(bx + 24, by + 24, 2, bx + 24, by + 24, glow + 16);
        grad.addColorStop(0, '#f0c96a'); grad.addColorStop(1, 'transparent');
        g2d.fillStyle = grad;
        g2d.fillRect(bx + 24 - glow - 16, by + 24 - glow - 16, (glow + 16) * 2, (glow + 16) * 2);
      }
      g2d.strokeStyle = '#3a3358';
      g2d.beginPath(); g2d.arc(bx + 24, by + 24, 16, 0, 7); g2d.stroke();
      g2d.fillStyle = glow > 0 ? '#f0c96a' : '#2a2547';
      g2d.beginPath(); g2d.arc(bx + 24, by + 24, 10, 0, 7); g2d.fill();
      g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
      g2d.fillText(V.toFixed(2) + ' V', bx + 44, by + 28);
      if (V > 0.2) {
        for (let i = 0; i < 8; i++) {
          const prog = ((t * 2 + i * 45) % 360) / 360;
          const X = beakerL.x + 52 + prog * (beakerR.x + beakerR.w - 52 - (beakerL.x + 52));
          g2d.fillStyle = '#8fe0c6';
          g2d.beginPath(); g2d.arc(X, 86, 3, 0, 7); g2d.fill();
        }
        g2d.fillStyle = '#8fe0c6';
        g2d.fillText('电子流向 →', 260, 108);
      }
      drawSpots(g2d, t * 40);
      updateRO();
    }

    function loop() { draw(); raf = requestAnimationFrame(loop); }

    $('e-an').addEventListener('change', e => { state.an = e.target.value; onCombo(); });
    $('e-ca').addEventListener('change', e => { state.ca = e.target.value; onCombo(); });
    $('e-el').addEventListener('change', e => {
      state.el = e.target.value;
      state.elsSeen[state.el] = true;
      if (Object.keys(state.elsSeen).length >= 3) kit.goal('g2', true);
      kit.say('电解液换成' + ELECTROLYTES[state.el].name + '——注意正极反应变了，电压不变。');
    });
    $('e-record').addEventListener('click', () => {
      const h = halfReactions();
      ctx.record(
        { 负极: METALS[state.an].name, 正极: METALS[state.ca].name, 电解液: ELECTROLYTES[state.el].name },
        { 电压: cellV().toFixed(2) + ' V', 负极反应: h.an, 正极反应: h.ca, 总反应: h.tot }
      );
    });

    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
