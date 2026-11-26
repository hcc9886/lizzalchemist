// 实验4：纸上色谱（v2：实验套件 + 热点）
import { createKit, hotspot } from '../expkit.js';

const SAMPLES = {
  ink: {
    name: '黑色墨水（三种染料）',
    bands: [
      { n: '染料A（深蓝）', c: '#3b4fa0', rf: { water: 0.62, alco: 0.78, pet: 0.90 } },
      { n: '染料B（紫）', c: '#7a4fa0', rf: { water: 0.40, alco: 0.63, pet: 0.75 } },
      { n: '染料C（红）', c: '#c65a41', rf: { water: 0.15, alco: 0.42, pet: 0.55 } }
    ]
  },
  leaf: {
    name: '绿叶色素（茨维特分离的就是它们）',
    bands: [
      { n: '胡萝卜素', c: '#e0a33a', rf: { water: 0.55, alco: 0.85, pet: 0.95 } },
      { n: '叶黄素', c: '#d9c94a', rf: { water: 0.42, alco: 0.70, pet: 0.78 } },
      { n: '叶绿素a', c: '#3f9a5a', rf: { water: 0.15, alco: 0.45, pet: 0.55 } },
      { n: '叶绿素b', c: '#2f7a45', rf: { water: 0.08, alco: 0.30, pet: 0.42 } }
    ]
  }
};
const SOLVENTS = { water: '水', alco: '乙醇', pet: '石油醚' };

let raf = null, state = null;

export default {
  id: 'chromatography', title: '纸上色谱', oneLine: '让色素随展开剂"赛跑"，按 Rf 值分离并鉴定混合物成分。画布上的"？"热点藏着历史与原理。',
  tags: ['中学', '分析', '分离'],
  safety: ['虚拟实验无危险。现实中乙醇、石油醚易燃，须远离明火并在通风橱使用。'],
  render(root, ctx) {
    state = { sample: 'ink', solvent: 'alco', t: 0, running: false, bestSplit: 0, combos: {} };

    const kit = createKit(root, {
      narr: '点"自动展开"让赛跑开始。每条色带的速度由它与<b>滤纸（固定相）和展开剂（流动相）</b>的亲和力决定。',
      chal: '分离出样品的全部色带（互不粘连），并换 2 种展开剂对比 Rf。',
      ach: 'chroma_split',
      goals: [
        { id: 'g1', text: '完成一次展开（前沿 ≥ 10 cm）' },
        { id: 'g2', text: '分离出全部色带（叶绿素 4 条 / 墨水 3 条）' },
        { id: 'g3', text: '换 2 种展开剂对比 Rf 变化' }
      ],
      steps: [
        { t: '点样', d: '在滤纸底部的起点线滴一滴混合液——只滴一次、点要小。' },
        { t: '展开', d: '展开剂沿滤纸向上爬（毛细作用），带着色素一起走。"跑得快"= 更亲溶剂。' },
        { t: '读 Rf', d: 'Rf = 色带移动距离 ÷ 前沿移动距离。Rf 是物质的特征常数（条件相同时）。' },
        { t: '换溶剂', d: '极性不同的溶剂会改变各成分的 Rf——色谱方法开发就是"选流动相"的游戏。' }
      ]
    });

    root.insertAdjacentHTML('beforeend', `
      <div class="exp-layout">
        <aside class="exp-controls">
          <div class="ctl"><label>样品</label>
            <select id="c-sample">${Object.entries(SAMPLES).map(([k, v]) => `<option value="${k}">${v.name}</option>`).join('')}</select></div>
          <div class="ctl"><label>展开剂</label>
            <select id="c-solv">${Object.entries(SOLVENTS).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
          <div class="ctl"><label>展开时间 <span class="val" id="c-tv">0 s</span></label>
            <input type="range" id="c-t" min="0" max="120" value="0"></div>
          <div class="ctl"><button class="btn" id="c-run" style="width:100%">自动展开</button>
            <button class="btn ghost" id="c-reset" style="width:100%;margin-top:8px">换新滤纸</button></div>
          <div class="ctl"><button class="btn small" id="c-record">记录数据到实验本</button></div>
        </aside>
        <section class="exp-stage"><canvas id="c-canvas" width="640" height="420"></canvas></section>
      </div>
      <div class="readouts">
        <div class="chip">前沿高度 <b id="ro-f">0 cm</b></div>
        <div class="chip">展开剂 <b id="ro-s">乙醇</b></div>
        <div class="chip">可分辨色带数 <b id="ro-b">0</b></div>
      </div>
      <table class="data" id="c-table"><thead><tr><th>组分</th><th>位置 (cm)</th><th>Rf</th></tr></thead><tbody></tbody></table>`);

    const $ = id => root.querySelector('#' + id);
    const canvas = $('c-canvas');
    const g2d = canvas.getContext('2d');

    const front = () => state.t / 120 * 14;
    const px = cm => cm / 14 * 300;

    const spots = [
      { x: 190, y: 350, r: 14, title: '起点线与点样', body: '点样要<b>小而集中</b>：点太大，各组分起点不同，色带会拖尾重叠。现实里用毛细管点样后吹干，可重复点 2~3 次。' },
      { x: 190, y: 90, r: 14, title: '前沿为什么重要', body: 'Rf 是<b>相对值</b>：色带距离 ÷ 前沿距离。用相对值可以消除展开时间、温度、滤纸批次的差异，让数据可复现。' },
      { x: 480, y: 60, r: 14, title: '茨维特 1906', body: '俄国植物学家茨维特用色谱柱分离叶绿素，发现了"叶绿素其实不是一种物质"。色谱（chromatography）一词就来自"颜色"。' }
    ];
    const drawSpots = hotspot(canvas, spots);

    function checkGoals() {
      const f = front();
      if (f >= 10) kit.goal('g1', true);
      const bands = SAMPLES[state.sample].bands;
      const sep = bands.filter(b => b.rf[state.solvent] * f > 0.5);
      if (sep.length >= bands.length && f >= 8) {
        kit.goal('g2', true);
        if (state.bestSplit < bands.length) {
          state.bestSplit = bands.length;
          kit.say('全部 ' + bands.length + ' 条色带分开了！换一种展开剂，看看 Rf 怎么变。');
        }
      }
      if (Object.keys(state.combos).length >= 2 && f >= 6) kit.goal('g3', true);
    }

    function updateRO() {
      const f = front();
      $('ro-f').textContent = f.toFixed(1) + ' cm';
      $('ro-s').textContent = SOLVENTS[state.solvent];
      const vis = SAMPLES[state.sample].bands.filter(b => b.rf[state.solvent] * f > 0.3);
      $('ro-b').textContent = vis.length;
      const tb = $('c-table').querySelector('tbody');
      tb.innerHTML = vis.map(b => {
        const pos = (b.rf[state.solvent] * f).toFixed(1);
        return `<tr><td style="color:${b.c}">● ${b.n}</td><td>${pos} cm</td><td>${b.rf[state.solvent].toFixed(2)}</td></tr>`;
      }).join('') || '<tr><td colspan="3" class="muted">尚未展开，点"自动展开"</td></tr>';
    }

    function draw() {
      const w = 640, h = 420;
      const t = performance.now();
      g2d.clearRect(0, 0, w, h);
      g2d.fillStyle = '#141126'; g2d.fillRect(0, 0, w, h);
      const tx = 70, ty = 40, tw = 240, th = 340;
      g2d.strokeStyle = '#3a3358'; g2d.strokeRect(tx, ty, tw, th);
      g2d.fillStyle = 'rgba(95,147,201,.3)';
      g2d.fillRect(tx + 2, ty + th - 40, tw - 4, 38);
      g2d.fillStyle = '#9c94b8'; g2d.font = '11px sans-serif';
      g2d.fillText('展开剂：' + SOLVENTS[state.solvent], tx + 8, ty + th - 12);
      const px0 = tx + 100, pw = 40, stripTop = ty + 16, stripBot = ty + th - 30;
      g2d.fillStyle = '#e8dfc8'; g2d.fillRect(px0, stripTop, pw, stripBot - stripTop);
      const baseY = stripBot - 14;
      const frontY = baseY - px(front());
      g2d.strokeStyle = '#5c5578'; g2d.beginPath();
      g2d.moveTo(px0, baseY); g2d.lineTo(px0 + pw, baseY); g2d.stroke();
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('起点线', px0 + pw + 6, baseY + 4);
      g2d.strokeStyle = '#5f93c9'; g2d.setLineDash([4, 4]); g2d.beginPath();
      g2d.moveTo(px0 - 6, frontY); g2d.lineTo(px0 + pw + 6, frontY); g2d.stroke(); g2d.setLineDash([]);
      g2d.fillText('前沿 ' + front().toFixed(1) + ' cm', px0 + pw + 6, frontY + 4);
      SAMPLES[state.sample].bands.forEach(b => {
        const rf = b.rf[state.solvent];
        const by = baseY - px(rf * front());
        if (rf * front() > 0.2) {
          const grad = g2d.createLinearGradient(0, by - 10, 0, by + 10);
          grad.addColorStop(0, b.c + '00'); grad.addColorStop(0.5, b.c); grad.addColorStop(1, b.c + '00');
          g2d.fillStyle = grad;
          g2d.fillRect(px0 + 3, by - 9, pw - 6, 18);
        }
      });
      const rx = 380, ry = 40, rh = 340;
      g2d.strokeStyle = '#3a3358';
      g2d.beginPath(); g2d.moveTo(rx, ry); g2d.lineTo(rx, ry + rh); g2d.stroke();
      for (let i = 0; i <= 10; i++) {
        const Y = ry + rh - i / 10 * rh;
        g2d.fillStyle = '#5c5578';
        g2d.fillText((i / 10).toFixed(1), rx + 8, Y + 4);
        g2d.beginPath(); g2d.moveTo(rx, Y); g2d.lineTo(rx + 6, Y); g2d.stroke();
      }
      g2d.fillStyle = '#9c94b8';
      g2d.fillText('Rf 标尺', rx + 8, ry - 8);
      SAMPLES[state.sample].bands.forEach(b => {
        const rf = b.rf[state.solvent];
        if (rf * front() > 0.2) {
          const Y = ry + rh - rf * rh;
          g2d.fillStyle = b.c; g2d.fillRect(rx + 40, Y - 5, 120, 10);
          g2d.fillStyle = b.c;
          g2d.fillText(b.n + '  Rf=' + rf.toFixed(2), rx + 170, Y + 4);
        }
      });
      drawSpots(g2d, t);
      updateRO();
      checkGoals();
    }

    function loop() {
      if (state.running) {
        state.t = Math.min(120, state.t + 1);
        $('c-t').value = state.t;
        $('c-tv').textContent = state.t + ' s';
        if (state.t >= 120) state.running = false;
      }
      draw();
      raf = requestAnimationFrame(loop);
    }

    $('c-sample').addEventListener('change', e => {
      state.sample = e.target.value;
      state.t = 0; state.running = false; state.bestSplit = 0;
      $('c-t').value = 0; $('c-tv').textContent = '0 s';
      kit.say(SAMPLES[state.sample].name + '。注意条数——分离完的标志就是"一条都不少"。');
    });
    $('c-solv').addEventListener('change', e => {
      state.solvent = e.target.value;
      state.combos[state.solvent] = true;
      state.t = 0; state.running = false; state.bestSplit = 0;
      $('c-t').value = 0; $('c-tv').textContent = '0 s';
      kit.say(SOLVENTS[state.solvent] + ' 的极性与' + (state.solvent === 'pet' ? '非极性' : '极性') + '——色素"亲"它多少，决定了它们的新座次。');
    });
    $('c-t').addEventListener('input', e => { state.t = +e.target.value; state.running = false; $('c-tv').textContent = state.t + ' s'; });
    $('c-run').addEventListener('click', () => { state.running = !state.running; $('c-run').textContent = state.running ? '暂停' : '自动展开'; });
    $('c-reset').addEventListener('click', () => { state.t = 0; state.running = false; state.bestSplit = 0; $('c-t').value = 0; $('c-tv').textContent = '0 s'; $('c-run').textContent = '自动展开'; });
    $('c-record').addEventListener('click', () => {
      const bands = SAMPLES[state.sample].bands.filter(b => b.rf[state.solvent] * front() > 0.3);
      ctx.record(
        { 样品: SAMPLES[state.sample].name.split('（')[0], 展开剂: SOLVENTS[state.solvent], 展开时间: state.t + ' s' },
        { 前沿高度: front().toFixed(1) + ' cm', 分离结果: bands.map(b => `${b.n}(Rf=${b.rf[state.solvent].toFixed(2)})`).join('；') || '未展开' }
      );
    });

    loop();
  },
  destroy() { if (raf) cancelAnimationFrame(raf); raf = null; }
};
