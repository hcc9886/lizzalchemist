// 实验2：溶解度与结晶（v2：温度计拖拽 + 实验套件）
import { createKit, drag, hotspot } from '../expkit.js';

const SOLUTES = {
  kno3: {
    name: '硝酸钾 KNO₃',
    S: [[0, 13.3], [20, 31.6], [40, 63.9], [60, 110], [80, 169], [100, 246]]
  },
  nacl: {
    name: '氯化钠 NaCl',
    S: [[0, 35.7], [20, 36.0], [40, 36.6], [60, 37.3], [80, 38.4], [100, 39.8]]
  },
  sugar: {
    name: '蔗糖 C₁₂H₂₂O₁₁',
    S: [[0, 179], [20, 204], [40, 238], [60, 287], [80, 362], [100, 487]]
  }
};

function interp(table, T) {
  for (let i = 0; i < table.length - 1; i++) {
    const [t1, s1] = table[i], [t2, s2] = table[i + 1];
    if (T >= t1 && T <= t2) return s1 + (s2 - s1) * (T - t1) / (t2 - t1);
  }
  return table[table.length - 1][1];
}

let raf = null, state = null;

export default {
  id: 'solubility', title: '溶解度与结晶', oneLine: '拖动温度计调温、逐次加入溶质，观察饱和与过饱和；降温让晶体析出。',
  tags: ['零基础', '溶液', '结晶'],
  safety: ['虚拟实验无危险。现实中高温玻璃杯需用坩埚钳取放，防止烫伤。'],
  render(root, ctx) {
    state = { solute: 'kno3', T: 60, added: 0, dissolved: 0, undissolved: 0, cooling: null, lastSay: 0 };

    const kit = createKit(root, {
      narr: '<b>抓住温度计上下拖动</b>可以直接调温。溶解度是温度的函数——KNO₃ 对温度极敏感，NaCl 几乎无动于衷。',
      chal: '让 KNO₃ 在高温下全部溶解，再快速降到 0℃，看晶体大量析出。',
      ach: 'sol_cool',
      goals: [
        { id: 'g1', text: '加溶质直到饱和（杯底出现未溶固体）' },
        { id: 'g2', text: '升温让未溶固体继续溶解' },
        { id: 'g3', text: '降温观察晶体析出' }
      ],
      steps: [
        { t: '选择溶质', d: 'KNO₃ 溶解度随温度陡增（13→246 g），NaCl 几乎平坦（36→40 g），蔗糖整体很高。' },
        { t: '加到饱和', d: '每次加 10 g。一旦杯底出现固体，说明溶液已达当前温度的溶解度上限。' },
        { t: '温度游戏', d: '拖动温度计升温：固体继续溶解。降温：溶不下的部分自动析出。' },
        { t: '记录', d: '把饱和点（温度、溶解度）和析出量记到实验本，与溶解度曲线对照。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>溶质（100 g 水）</label>
            <select id="s-sol">${Object.entries(SOLUTES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><label>温度 <span class="val" id="s-tv">60 ℃</span></label>
            <input type="range" id="s-t" min="0" max="100" value="60"></div>
          <div class="ctl"><button class="btn primary" id="s-add" style="width:100%">加入 10 g 溶质</button></div>
          <div class="ctl"><button class="btn" id="s-cool" style="width:100%">快速降温到 0℃</button>
            <button class="btn ghost" id="s-reset" style="width:100%;margin-top:8px">倒掉重来</button></div>
          <div class="ctl"><button class="btn small" id="s-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="s-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">当前温度 <b id="ro-t">60 ℃</b></div>
        <div class="chip">溶解度 S <b id="ro-s">—</b></div>
        <div class="chip">已溶解 <b id="ro-d">0 g</b></div>
        <div class="chip">未溶固体 <b id="ro-u">0 g</b></div>
        <div class="chip">状态 <b id="ro-st">不饱和</b></div>
        <div class="chip">质量分数 <b id="ro-w">0%</b></div>
      </div>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('s-canvas');
    const g2d = canvas.getContext('2d');

    function S() { return interp(SOLUTES[state.solute].S, state.T); }

    function sayThrottled(text) {
      const now = performance.now();
      if (now - state.lastSay < 2200) return;
      state.lastSay = now;
      kit.say(text);
    }

    function applyTemp() {
      const cap = S();
      if (state.dissolved > cap) {
        const excess = state.dissolved - cap;
        state.dissolved = cap;
        state.undissolved += excess;
        if (excess > 0.5) {
          sayThrottled('温度 ' + state.T + '℃，溶解度只剩 ' + cap.toFixed(1) + ' g → <b>析出</b> ' + excess.toFixed(1) + ' g 晶体！');
          kit.goal('g3', true);
        }
      } else if (state.dissolved < cap && state.undissolved > 0) {
        const can = Math.min(state.undissolved, cap - state.dissolved);
        state.dissolved += can;
        state.undissolved -= can;
        if (state.undissolved <= 0.01 && can > 0) {
          sayThrottled('固体全部溶解——升温提高了溶解度上限。');
          kit.goal('g2', true);
        }
      }
    }

    function addSolute() {
      const cap = S();
      const can = Math.min(10, cap - state.dissolved);
      if (can > 0) state.dissolved += can;
      if (can < 10) {
        state.undissolved += 10 - can;
        kit.goal('g1', true);
        sayThrottled('<b>饱和</b>了！再继续加只会堆在杯底——除非升温。');
      }
    }

    function setT(y) {
      const T = Math.max(0, Math.min(100, Math.round((340 - y) / 240 * 100)));
      if (T === state.T) return;
      state.T = T;
      $('s-t').value = T;
      $('s-tv').textContent = T + ' ℃';
      applyTemp();
    }

    const spots = [
      { x: 288, y: 100, r: 14, title: '温度计', body: '大多数固体溶解度随温度<b>升高</b>而增大（溶质离子/分子需要能量挣脱晶格）。少数物质反常，如熟石灰 Ca(OH)₂。' },
      { x: 150, y: 320, r: 14, title: '杯底的晶体', body: '结晶是<b>物理变化</b>：溶质回到晶格，没有新物质生成。缓慢降温可得大晶体，快速降温得细晶——这就是"制备条件决定晶体质量"。' },
      { x: 480, y: 200, r: 14, title: '溶解度曲线', body: '曲线上的点 = 饱和溶液；曲线下方 = 不饱和；上方 = 过饱和（会自发析出）。绿点是当前状态，随温度沿横轴移动。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    drag(canvas, {
      hit(x, y) { return (x > 268 && x < 310 && y > 66 && y < 345) ? 'thermo' : null; },
      start(x, y) { kit.say('抓住温度计了——上下拖动改变温度。'); setT(y); },
      move(x, y) { setT(y); },
      end() { /* 温度保持 */ }
    });

    function updateRO() {
      const cap = S();
      $('ro-t').textContent = state.T + ' ℃';
      $('ro-s').textContent = cap.toFixed(1) + ' g/100g水';
      $('ro-d').textContent = state.dissolved.toFixed(1) + ' g';
      $('ro-u').textContent = state.undissolved.toFixed(1) + ' g';
      const st = state.undissolved > 0 ? '饱和（有未溶固体）' : state.dissolved >= cap - 0.01 ? '恰好饱和' : '不饱和';
      $('ro-st').textContent = st;
      $('ro-w').textContent = (state.dissolved / (100 + state.dissolved) * 100).toFixed(1) + '%';
    }

    function draw(t) {
      const w = 640, h = 420;
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      // beaker
      const bx = 60, by = 70, bw = 180, bh = 260;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(bx, by, bw, bh);
      const wh = 220;
      g2d.fillStyle = 'rgba(95,147,201,.35)'; g2d.fillRect(bx + 2, by + bh - wh, bw - 4, wh);
      // dissolved particles
      const n = Math.min(120, Math.round(state.dissolved * 1.2));
      g2d.fillStyle = '#f0c96a';
      for (let i = 0; i < n; i++) {
        const px = bx + 8 + ((i * 37 + Math.floor(t / 30) * 5) % (bw - 16));
        const py = by + bh - wh + 8 + ((i * 53 + Math.floor(t / 20)) % (wh - 16));
        g2d.fillRect(px, py, 3, 3);
      }
      // crystals pile
      if (state.undissolved > 0) {
        const cw2 = Math.min(bw - 20, state.undissolved * 1.6 + 20);
        g2d.fillStyle = '#e8dfc8';
        g2d.beginPath();
        g2d.moveTo(bx + bw / 2 - cw2 / 2, by + bh - 3);
        g2d.lineTo(bx + bw / 2, by + bh - 3 - Math.min(60, 18 + state.undissolved * 0.4));
        g2d.lineTo(bx + bw / 2 + cw2 / 2, by + bh - 3);
        g2d.closePath(); g2d.fill();
      }
      // heater
      g2d.fillStyle = '#2a2547'; g2d.fillRect(bx - 10, by + bh + 6, bw + 20, 22);
      g2d.strokeStyle = state.T > 40 ? '#f2b3a4' : '#5f93c9';
      g2d.strokeRect(bx - 10, by + bh + 6, bw + 20, 22);
      g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
      g2d.fillText('加热板 ' + state.T + ' ℃', bx + 30, by + bh + 22);
      // thermometer
      const mx = 280;
      g2d.fillStyle = '#2a2547'; g2d.fillRect(mx, 70, 16, 260);
      const th = state.T / 100 * 240;
      g2d.fillStyle = state.T > 50 ? '#c65a41' : '#5f93c9';
      g2d.fillRect(mx + 2, 330 - th, 12, th);
      g2d.fillStyle = '#9c94b8'; g2d.font = '12px sans-serif';
      g2d.fillText(state.T + '℃（可拖动）', mx + 22, 90);
      // solubility curve
      const gx = 360, gy = 70, gw = 240, gh = 260;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(gx, gy, gw, gh);
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('溶解度曲线 S(g/100g水)', gx + 8, gy - 8);
      g2d.fillText('T/℃', gx + gw - 30, gy + gh + 16);
      g2d.save();
      g2d.translate(gx + 4, gy + 12); g2d.rotate(-Math.PI / 2);
      g2d.fillText('S', -20, 0); g2d.restore();
      const tab = SOLUTES[state.solute].S;
      const smax = tab[tab.length - 1][1] * 1.05;
      g2d.strokeStyle = '#f0c96a'; g2d.lineWidth = 2; g2d.beginPath();
      tab.forEach(([tT, s], i) => {
        const X = gx + tT / 100 * gw, Y = gy + gh - s / smax * gh;
        i ? g2d.lineTo(X, Y) : g2d.moveTo(X, Y);
      });
      g2d.stroke(); g2d.lineWidth = 1;
      const cxp = gx + state.T / 100 * gw, cyp = gy + gh - Math.min(state.dissolved, smax) / smax * gh;
      g2d.fillStyle = '#8fe0c6'; g2d.beginPath(); g2d.arc(cxp, cyp, 5, 0, 7); g2d.fill();
      g2d.fillStyle = '#8fe0c6';
      g2d.fillText('当前溶解量', cxp - 50, cyp - 8);
      g2d.fillStyle = '#5c5578';
      [0, 50, 100].forEach(tT => g2d.fillText(tT, gx + tT / 100 * gw - 6, gy + gh + 14));
      [0.5, 1].forEach(f => g2d.fillText(Math.round(smax * f), gx + 2, gy + gh - f * gh + 4));
      drawSpots(g2d, t);
      updateRO();
    }

    function loop() {
      const t = performance.now();
      if (state.cooling !== null) {
        state.T = Math.max(0, state.T - 2);
        applyTemp();
        $('s-t').value = state.T;
        $('s-tv').textContent = state.T + ' ℃';
        if (state.T <= 0) { state.cooling = null; $('s-cool').textContent = '快速降温到 0℃'; }
      }
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    $('s-sol').addEventListener('change', e => {
      state.solute = e.target.value;
      state.dissolved = 0; state.undissolved = 0;
      kit.say('换成了' + SOLUTES[state.solute].name + '。注意它的曲线形状——陡峭还是平坦？');
    });
    $('s-t').addEventListener('input', e => {
      state.T = +e.target.value;
      $('s-tv').textContent = state.T + ' ℃';
      applyTemp();
    });
    $('s-add').addEventListener('click', addSolute);
    $('s-cool').addEventListener('click', () => {
      if (state.cooling !== null) return;
      state.cooling = 1;
      $('s-cool').textContent = '降温中…';
    });
    $('s-reset').addEventListener('click', () => {
      state.dissolved = 0; state.undissolved = 0; state.cooling = null;
      $('s-cool').textContent = '快速降温到 0℃';
      kit.resetGoals();
      kit.say('倒掉重来。目标：饱和 → 升温全溶 → 降温析出。');
    });
    $('s-record').addEventListener('click', () => {
      ctx.record(
        { 溶质: SOLUTES[state.solute].name, 温度: state.T + ' ℃' },
        { 溶解度: S().toFixed(1) + ' g/100g水', 已溶解: state.dissolved.toFixed(1) + ' g', 未溶固体: state.undissolved.toFixed(1) + ' g', 状态: state.undissolved > 0 ? '饱和' : '不饱和' }
      );
    });

    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
