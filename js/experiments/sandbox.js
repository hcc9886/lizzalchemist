import { Workbench } from '../engine/workbench.js';
import { createExpUI } from '../engine/panel.js';
import { createHologram } from '../engine/hologram.js';
import { achieve } from '../expkit.js';
import { toast } from '../progress.js';
import {
  REAGENTS, WATER_INTO_ACID, addReagent as addContents, splitContents, mergeContents,
  safetyCheck, measureMixture, analyzeMixture
} from '../engine/reactions.js';

let cleanup = null;
const VESSEL_KINDS = new Set(['beaker', 'test_tube', 'flask_conical', 'flask_round', 'grad_cyl', 'volumetric', 'sep_funnel']);
const fmt = n => Number.isInteger(n) ? String(n) : n.toFixed(1);
const isVessel = it => !!it && VESSEL_KINDS.has(it.def.kind);
const mixtureOf = it => it?.data?.sandbox?.contents || [];
const nameOf = id => REAGENTS[id]?.name || id;

export default {
  id: 'sandbox', title: '沙盒混合台', oneLine: '在可平移的全息工作台上自由组装容器、倾倒与混合试剂，实时观察并解释微观反应。',
  tags: ['零基础', '自由探索', '全息微观'],
  safety: [
    '所有操作均为虚拟模拟。水加入浓硫酸会被安全熔断拦截，并演示飞溅风险；正确原则是酸入水、沿壁缓加、边加边搅。',
    '现实实验请佩戴护目镜。84消毒液（次氯酸钠）与洁厕灵（盐酸）混合会产生剧毒氯气，绝对禁止；不明确性质的试剂不要混。'
  ],
  render(root, ctx) {
    const ui = createExpUI(root, {
      narr: '从<b>试剂架</b>拖入任意容器；拖动容器到另一个容器上可倾倒 25%。空白处拖拽平移，滚轮缩放，点击容器查看实时探针。',
      goals: [
        { id: 'g1', text: '做出产气反应' },
        { id: 'g2', text: '做出沉淀反应' },
        { id: 'g3', text: '用指示剂看到变色' }
      ],
      tabs: [
        { id: 'goal', name: '目标' }, { id: 'bom', name: '用料' }, { id: 'step', name: '操作' },
        { id: 'comp', name: '反应解释' }, { id: 'data', name: '数据记录' }, { id: 'safety', name: '安全' }
      ]
    });
    const state = {
      speed: 1, selected: null, discoveries: new Set(), events: [], inspect: null,
      holoVessel: null, holoReaction: null, safety: null, uiClock: 0, simTime: 0
    };
    let raf = null, lastT = 0, activeDrag = null;

    root.insertAdjacentHTML('beforeend', `
      <section class="sandbox-shell">
        <div class="sandbox-toolbar">
          <div class="sandbox-toolgroup"><span class="tool-label">时间倍率</span>
            ${[1, 4, 10].map(v => `<button class="btn small ${v === 1 ? 'primary' : 'ghost'}" data-speed="${v}">${v}×</button>`).join('')}
          </div>
          <div class="sandbox-toolgroup"><span class="tool-label">镜头</span>
            <button class="btn small ghost" id="s-zoom-out" aria-label="缩小">−</button>
            <span class="zoom-readout" id="s-zoom">100%</span>
            <button class="btn small ghost" id="s-zoom-in" aria-label="放大">＋</button>
            <button class="btn small ghost" id="s-camera-reset">复位</button>
          </div>
          <button class="btn small ghost" id="s-reset">重置工作台</button>
        </div>
        <div class="sandbox-inspector" id="s-inspector" aria-live="polite"></div>
        <div class="lab-stage sandbox-stage">
          <canvas id="s-canvas" width="900" height="520" aria-label="可平移与缩放的虚拟化学工作台"></canvas>
          <div class="hud hud-left sandbox-selection">
            <h4>当前容器</h4><b id="s-selected">烧杯 A</b><span id="s-selection-sub">250 mL · 空</span>
          </div>
          <div class="hud hud-bottom sandbox-probes">
            <div class="data-chip"><b id="s-temp">25 ℃</b>温度</div>
            <div class="data-chip"><b id="s-vol">0 mL</b>总体积</div>
            <div class="data-chip"><b id="s-ph">—</b>pH 估算</div>
            <div class="data-chip"><b id="s-mass">0.0 g</b>总质量</div>
            <button class="btn small ghost" id="s-holo">粒子全息</button>
          </div>
          <div class="sandbox-holo" id="s-holo-panel" hidden>
            <div class="holo-head"><b>微观透镜 · 粒子全息</b><button class="btn small ghost" id="s-holo-close">关闭</button></div>
            <canvas id="s-holo-canvas" width="640" height="320"></canvas>
            <div class="holo-explanation" id="s-holo-text"></div>
          </div>
          <div class="sandbox-fuse" id="s-fuse" hidden>
            <b>安全熔断已触发</b><p>水加入浓硫酸会剧烈放热并造成酸液飞溅。本次加料已拦截，容器内容物保持不变。</p>
            <span>正确原则：酸入水、沿壁缓加、边加边搅。现实操作必须在教师指导下进行。</span>
            <div class="fuse-progress"><i id="s-fuse-bar"></i></div>
          </div>
        </div>
        <div class="sandbox-shelf-head"><b>试剂架</b><span>拖入容器，或单击加入当前容器</span></div>
        <div class="rg-shelf sandbox-reagents" id="s-shelf">
          ${Object.values(REAGENTS).map(r => `<button class="rg-card" data-k="${r.id}" type="button">
            <span class="rg-dot" style="background:${r.color}"></span>
            <span class="rg-name">${r.name}</span><span class="rg-f">${r.formula}</span>
            ${r.danger ? '<span class="badge red">安全教学</span>' : ''}
          </button>`).join('')}
        </div>
        <div class="sandbox-actions">
          <button class="btn small ghost" id="s-dump">清空当前容器</button>
          <button class="btn small ghost" id="s-help">操作说明</button>
          <button class="btn small" id="s-record">记录数据到实验本</button>
        </div>
      </section>`);
    ui.mountBottom();

    const $ = id => root.querySelector('#' + id);
    const cv = $('s-canvas');
    const bench = new Workbench(cv, { trayY: 452, camera: true });
    bench.setTray([
      { key: 'beaker_100', label: '烧杯 100' }, { key: 'beaker_250', label: '烧杯 250' },
      { key: 'test_tube_20', label: '试管 20' }, { key: 'flask_conical_100', label: '锥形瓶' },
      { key: 'alcohol_lamp', label: '酒精灯' }, { key: 'asbestos_net', label: '石棉网' },
      { key: 'iron_stand', label: '铁架台' }, { key: 'clamp', label: '铁夹' },
      { key: 'glass_tube', label: '导管' }, { key: 'stopper_tube', label: '孔塞导管' },
      { key: 'thermometer', label: '温度计' }, { key: 'ph_meter', label: 'pH 计' }
    ]);
    const holo = createHologram($('s-holo-canvas'), () => {
      const it = state.holoVessel || state.selected;
      const data = it?.data?.sandbox;
      return {
        contents: data?.contents || [], reaction: state.holoReaction || data?.analysis?.reactions?.[0] || null,
        safety: state.safety ? WATER_INTO_ACID : null
      };
    });

    function initVessel(it) {
      if (!isVessel(it)) return;
      const max = it.cap || it.def.capacities?.[0] || 100;
      it.liq = { vol: 0, color: '#82b6e899', max, wave: 0, vortex: 0 };
      it.data.sandbox = { contents: [], temp: 25, analysis: analyzeMixture([]), lastAdded: null, safetyT: 0, heatedBy: null };
      it.data.chemName = '空容器';
      visualSync(it);
    }

    bench.on.place = it => {
      initVessel(it);
      if (!state.selected && isVessel(it)) state.selected = it;
      if (isVessel(it)) ui.say(`已放置${it.def.name}。把试剂拖入容器，或把它拖到另一个容器上倾倒。`);
      updateUI();
    };
    bench.on.click = it => {
      if (it.def.kind === 'alcohol_lamp' && it.fsm) {
        const next = it.fsm.state === 'off' ? 'lit' : 'off';
        if (it.fsm.to(next)) ui.say(next === 'lit' ? '酒精灯已点燃。用接口吸附到容器底部即可加热。' : '酒精灯已熄灭。');
      } else if (isVessel(it)) {
        state.selected = it;
        if (!$('s-holo-panel').hidden) showHologram(null, it);
        ui.say(`已选择${labelOf(it)}。悬停查看浓度与质量，拖动到另一容器可倾倒。`);
      } else ui.say(`${it.def.name}：${it.def.notes || '可拖动调整位置，靠近兼容接口会自动吸附。'}`);
      updateUI();
    };
    bench.on.move = (it, meta) => {
      if (!isVessel(it) || !mixtureOf(it).length) return;
      const target = bench.items.filter(o => o !== it && isVessel(o))
        .map(o => ({ it: o, d: Math.hypot(o.x - it.x, o.y - it.y) }))
        .sort((a, b) => a.d - b.d)[0];
      it.x = meta.x; it.y = meta.y;
      if (target && target.d < 90) pour(it, target.it);
    };
    bench.on.connect = (a, b) => {
      const lamp = a.def.kind === 'alcohol_lamp' ? a : b.def.kind === 'alcohol_lamp' ? b : null;
      const vessel = lamp === a ? b : a;
      if (lamp && isVessel(vessel)) {
        vessel.data.sandbox.heatedBy = lamp.uid;
        ui.say('加热连接完成。点击酒精灯点燃或熄灭；加热只改变虚拟温度与粒子运动。现实加热烧杯或锥形瓶时必须垫石棉网。');
      } else if (isVessel(a) || isVessel(b)) ui.say('接口已吸附。连接会随器材移动自动更新。');
      return true;
    };
    bench.on.disconnect = it => {
      for (const v of bench.items) if (v.data?.sandbox?.heatedBy === it.uid) v.data.sandbox.heatedBy = null;
    };

    function labelOf(it) {
      const same = bench.items.filter(x => x.key === it.key && isVessel(x));
      const i = same.indexOf(it);
      return it.def.name + (same.length > 1 ? ' ' + String.fromCharCode(65 + i) : '');
    }

    function visualSync(it) {
      const data = it.data.sandbox, analysis = data.analysis;
      const m = analysis.measurement;
      const max = it.cap || it.liq?.max || it.def.capacities?.[0] || 100;
      const tinted = data.contents.map(c => REAGENTS[c.id]).find(r => r.color && r.id !== 'water');
      if (m.volume > 0) {
        it.liq = {
          ...(it.liq || {}), vol: m.volume, max,
          color: (analysis.effects.color || tinted?.color || '#82b6e8') + 'b8',
          wave: it.liq?.wave || 0, vortex: it.liq?.vortex || 0
        };
      } else it.liq = null;
      const solids = data.contents.filter(c => REAGENTS[c.id].phase === 'solid');
      const solidMass = solids.reduce((s, c) => s + c.mass, 0);
      it.powder = analysis.effects.precip
        ? { amt: Math.max(1.2, solidMass), color: analysis.effects.precip }
        : solids.length ? { amt: solidMass, color: analysis.effects.deposit || REAGENTS[solids[0].id].color } : null;
      it.data.chemName = data.contents.length ? data.contents.map(c => REAGENTS[c.id].formula).join(' + ') : '空容器';
      it.data.ph = data.contents.length ? m.ph : null;
      it.data.t = data.temp;
    }

    function processAnalysis(it, result, added) {
      const data = it.data.sandbox;
      const before = new Set((data.analysis?.reactions || []).map(r => r.equation));
      data.analysis = result;
      data.lastAdded = added?.id || null;
      const fresh = result.reactions.filter(r => !before.has(r.equation));
      for (const r of result.reactions) {
        if (r.effects.gas) ui.goal('g1');
        if (r.effects.precip) ui.goal('g2');
        if (r.effects.color) ui.goal('g3');
      }
      let discovered = false;
      for (const r of fresh) {
        const key = r.equation;
        if (!state.discoveries.has(key)) {
          discovered = true;
          state.discoveries.add(key);
          state.events.unshift({ title: r.title, equation: r.equation, vessel: labelOf(it) });
          state.events = state.events.slice(0, 12);
          ui.eq(r.equation);
          ui.say(`<b>发现反应：${r.title}</b><br>${r.macro}`);
          toast('发现新反应：' + r.title);
          achieve('sandbox_first');
        }
      }
      if (discovered) showHologram(result.reactions[0], it);
      else if (!$('s-holo-panel').hidden && state.holoVessel === it) showHologram(null, it);
      if (!fresh.length && result.reactions.length && added) ui.say('反应仍在继续。可以切换时间倍率，或打开粒子全息观察微观过程。');
      visualSync(it);
      updateUI();
    }

    function addReagent(it, id, portion = 1) {
      if (!isVessel(it)) return false;
      const def = REAGENTS[id], data = it.data.sandbox;
      if (!def) return false;
      state.selected = it;
      if (data.safetyT > 0) { ui.say('安全熔断演示进行中，请稍候。'); return false; }
      const hazard = safetyCheck([...data.contents, { id }], id, data.contents);
      if (hazard) { triggerSafety(it); return false; }
      const max = it.cap || it.liq?.max || it.def.capacities?.[0] || 100;
      const used = measureMixture(data.contents).volume;
      if (def.phase === 'liquid') portion = Math.min(portion, Math.max(0, (max - used) / def.volume));
      if (portion <= .001) { ui.say('容器已满。请清空当前容器，或把液体倾倒一部分到另一容器。'); return false; }
      const contents = addContents(data.contents, id, portion);
      data.contents = contents;
      processAnalysis(it, analyzeMixture(contents, id), def);
      return true;
    }

    function pour(from, to) {
      const source = from.data.sandbox, target = to.data.sandbox;
      if (!source.contents.length) return;
      if (source.safetyT > 0 || target.safetyT > 0) { ui.say('安全熔断演示进行中，请稍候。'); return; }
      const combined = mergeContents(target.contents, source.contents);
      if (safetyCheck(combined, source.contents.some(c => c.id === 'water') ? 'water' : null, target.contents)) {
        triggerSafety(to); return;
      }
      const sourceVol = measureMixture(source.contents).volume;
      const room = Math.max(0, (to.cap || to.liq?.max || to.def.capacities?.[0] || 100) - measureMixture(target.contents).volume);
      const fraction = sourceVol > 0 ? Math.min(.25, room / sourceVol) : .25;
      if (fraction <= .001) { ui.say('目标容器已满，倾倒已停止。'); return; }
      const split = splitContents(source.contents, fraction);
      source.contents = split.remaining;
      target.contents = mergeContents(target.contents, split.moved);
      const color = (source.analysis?.effects.color || '#82b6e8') + 'cc';
      bench.fx.emitStream(from.x, from.y - from.def.h / 2, (to.x - from.x) * .015, 1.5, color, 12, to.y + to.def.h / 2 - 8);
      processAnalysis(from, analyzeMixture(split.remaining));
      processAnalysis(to, analyzeMixture(target.contents), split.moved[0] ? REAGENTS[split.moved[0].id] : null);
      state.selected = to;
      ui.say(`已从${labelOf(from)}倾倒约 ${Math.round(fraction * 100)}% 到${labelOf(to)}。倾倒前后总质量守恒。`);
      updateUI();
    }

    function triggerSafety(it) {
      const data = it.data.sandbox;
      state.selected = it;
      data.safetyT = 2.8; state.safety = it;
      ui.lamp('red', '<b>红灯：危险操作已拦截</b> · 水入浓硫酸会剧烈放热并飞溅');
      ui.say(`<b>${WATER_INTO_ACID.title}</b><br>${WATER_INTO_ACID.message}<br>${WATER_INTO_ACID.correct}`);
      bench.flashRed('安全熔断：水入浓硫酸');
      $('s-fuse').hidden = false;
      for (let i = 0; i < 18; i++) {
        bench.fx.emitSmoke(it.x + (Math.random() - .5) * 24, it.y - it.def.h / 2, 'rgba(232,112,58,.55)', 1);
        bench.fx.emitStream(it.x + (Math.random() - .5) * 18, it.y - it.def.h / 2,
          (Math.random() - .5) * 4, -2 - Math.random() * 3, '#d8cda9cc', 1, it.y + 80);
      }
      updateUI();
    }

    function showHologram(reaction = null, vessel = null) {
      state.holoVessel = vessel || state.selected;
      state.holoReaction = reaction || state.holoVessel?.data?.sandbox?.analysis?.reactions?.[0] || null;
      $('s-holo-panel').hidden = false;
      const r = state.holoReaction;
      $('s-holo-text').innerHTML = r ? `
        <div class="holo-equation">${r.equation}</div>
        <div class="holo-grid"><p><b>宏观现象</b>${r.macro}</p><p><b>微观解释</b>${r.micro}</p>
        <p><b>白话理解</b>${r.plain}</p><p><b>生成物</b>${r.products}</p></div>` :
        '<p class="muted">当前容器尚未触发反应。全息层显示容器内主要物种；发现新反应后，这里会展示四段解释。</p>';
      holo.show();
    }

    function hideHologram() { $('s-holo-panel').hidden = true; holo.hide(); }

    function dump(it) {
      if (!isVessel(it)) return;
      hideHologram();
      it.data.sandbox.contents = [];
      it.data.sandbox.analysis = analyzeMixture([]);
      it.data.sandbox.temp = 25;
      it.data.chemName = '空容器';
      ui.say('当前容器已清空。现实废液必须按性质分类回收，不能随意倒入下水道。');
      visualSync(it); updateUI();
    }

    function resetBench() {
      hideHologram();
      for (const it of [...bench.items]) bench.remove(it);
      bench.fx.clear(); bench.resetCamera();
      state.discoveries.clear(); state.events = []; state.safety = null; state.selected = null;
      state.inspect = null; state.holoVessel = null; state.holoReaction = null;
      ui.resetGoals(); ui.lamp('green', '安全护栏已开启 · 红灯：拦截并演示后果');
      $('s-fuse').hidden = true;
      seed(); updateUI();
    }

    function seed() {
      const a = bench.add('beaker_250', 260, 235, { cap: 250 });
      const b = bench.add('test_tube_20', 610, 220, { cap: 20 });
      bench.add('flask_conical_100', 610, 355, { cap: 100 });
      state.selected = a;
      if (!a || !b) return;
      a.data.sandbox.contents = [{ id: 'caco3', volume: 0, mass: 2 }];
      processAnalysis(a, analyzeMixture(a.data.sandbox.contents));
    }

    function inspectorHTML() {
      const target = state.inspect?.it || state.selected;
      if (state.inspect?.reagent) {
        const r = REAGENTS[state.inspect.reagent];
        return `<div><b>${r.name}</b><span>${r.formula} · ${r.concentration}</span></div>
          <div class="inspect-values"><span>每次加入 ${r.phase === 'solid' ? fmt(r.mass) + ' g' : fmt(r.volume) + ' mL'}</span>
          <a href="#/chem/${r.chem}">打开试剂图鉴 →</a></div>`;
      }
      if (!isVessel(target)) return '<div><b>实时探针</b><span>悬停试剂或容器查看数据</span></div>';
      const data = target.data.sandbox, m = data.analysis.measurement;
      const first = data.contents[0] ? REAGENTS[data.contents[0].id] : null;
      return `<div><b>${labelOf(target)}</b><span>${data.contents.length ? data.contents.map(c => nameOf(c.id)).join(' + ') : '空容器'}</span></div>
        <div class="inspect-values"><span>${fmt(m.volume)} mL · ${fmt(m.mass)} g · pH ${data.contents.length ? m.ph.toFixed(1) : '—'}</span>
        ${first ? `<a href="#/chem/${first.chem}">试剂图鉴 →</a>` : '<span>等待加料</span>'}</div>`;
    }

    function updateUI() {
      const it = state.selected, data = it?.data?.sandbox;
      $('s-selected').textContent = isVessel(it) ? labelOf(it) : '未选择';
      $('s-selection-sub').textContent = isVessel(it) ? `${it.cap || it.liq?.max || 100} mL · ${data.contents.length} 种组分` : '点击一个容器';
      const m = data?.analysis?.measurement || { volume: 0, mass: 0, ph: 7 };
      $('s-temp').textContent = (data ? Math.round(data.temp) : 25) + ' ℃';
      $('s-vol').textContent = fmt(m.volume) + ' mL';
      $('s-ph').textContent = data?.contents.length ? m.ph.toFixed(1) : '—';
      $('s-mass').textContent = fmt(m.mass) + ' g';
      $('s-zoom').textContent = Math.round(bench.camera.zoom * 100) + '%';
      $('s-inspector').innerHTML = inspectorHTML();

      ui.setRows('bom', Object.values(REAGENTS).map(r => [r.name, r.formula, r.concentration, r.phase === 'solid' ? fmt(r.mass) + ' g' : fmt(r.volume) + ' mL']),
        ['试剂', '化学式', '浓度/状态', '每次加料']);
      ui.setHtml('step', `<p><b>自由组装</b></p><ol><li>从底部器材台拖入烧杯、试管、锥形瓶、酒精灯或支架。</li>
        <li>从试剂架拖入容器；单击卡片则加入当前容器。</li><li>拖动容器到另一容器上倾倒 25%，体积与质量守恒。</li>
        <li>空白处拖拽平移，滚轮或按钮缩放；接口靠近会自动吸附。</li>
        <li>用孔塞导管组装导气装置；点击酒精灯点火，将灯嘴吸附到容器底部。现实加热烧杯或锥形瓶时必须垫石棉网。</li></ol>`);
      const r = state.holoReaction;
      ui.setHtml('comp', r ? `<p><b>${r.title}</b></p><p class="holo-equation">${r.equation}</p>
        <p><b>宏观：</b>${r.macro}</p><p><b>微观：</b>${r.micro}</p><p><b>白话：</b>${r.plain}</p>
        <button class="btn small ghost" id="s-open-holo">打开粒子全息</button>` : '<p class="muted">混合试剂后，这里会显示方程式、宏观现象、微观解释与白话理解。</p>');
      const rows = data ? data.contents.map(c => {
        const d = REAGENTS[c.id];
        return [nameOf(c.id), d.concentration, fmt(c.volume) + ' mL', fmt(c.mass) + ' g'];
      }) : [];
      ui.setRows('data', rows.length ? rows : [['尚无加料', '—', '0 mL', '0.0 g']], ['组分', '浓度', '体积', '质量']);
      ui.setHtml('safety', `<p><b>安全熔断演示</b></p><p>水加入浓硫酸会被拦截：剧烈放热与飞溅风险只作虚拟演示，不提供现实操作配方。</p>
        <p><b>正确原则：</b>酸入水、沿壁缓加、边加边搅。</p><p>84消毒液与洁厕灵绝对不可混合；真实实验必须由教师指导，废液分类回收。</p>`);
      const open = $('s-open-holo');
      if (open) open.addEventListener('click', () => showHologram(r));
    }

    root.querySelectorAll('[data-speed]').forEach(btn => btn.addEventListener('click', () => {
      state.speed = Number(btn.dataset.speed);
      root.querySelectorAll('[data-speed]').forEach(b => b.classList.toggle('primary', b === btn));
      ui.say(`时间倍率已设为 ${state.speed}×。粒子、气泡与热运动同步加速，物料总量不变。`);
    }));
    $('s-zoom-in').addEventListener('click', () => { bench.zoomBy(1.2); updateUI(); });
    $('s-zoom-out').addEventListener('click', () => { bench.zoomBy(1 / 1.2); updateUI(); });
    $('s-camera-reset').addEventListener('click', () => { bench.resetCamera(); updateUI(); });
    $('s-reset').addEventListener('click', resetBench);
    $('s-dump').addEventListener('click', () => dump(state.selected));
    $('s-holo').addEventListener('click', () => $('s-holo-panel').hidden ? showHologram() : hideHologram());
    $('s-holo-close').addEventListener('click', hideHologram);
    $('s-record').addEventListener('click', () => {
      const it = state.selected;
      if (!isVessel(it)) { ui.say('请先点击一个容器，再记录数据。'); return; }
      const data = it.data.sandbox, m = data.analysis.measurement;
      ctx.record({ 容器: labelOf(it), 试剂: data.contents.map(c => nameOf(c.id)).join(' + ') || '空', 时间倍率: state.speed + '×' }, {
        总体积: fmt(m.volume) + ' mL', 总质量: fmt(m.mass) + ' g', pH: data.contents.length ? m.ph.toFixed(2) : '—',
        温度: Math.round(data.temp) + ' ℃', 现象: data.analysis.reactions.map(r => r.title).join('、') || '无明显反应',
        已发现反应: state.discoveries.size
      });
    });
    $('s-help').addEventListener('click', () => ui.say('试试：<b>大理石 + 稀盐酸</b>产气；<b>CuSO₄ + NaOH</b>生成蓝色沉淀；<b>紫甘蓝汁 + 酸/碱</b>变色。液体会守恒，危险加料会被拦截。'));

    root.querySelectorAll('.rg-card').forEach(card => {
      const id = card.dataset.k;
      card.addEventListener('pointerenter', () => { state.inspect = { reagent: id }; updateUI(); });
      card.addEventListener('pointerleave', () => { state.inspect = null; updateUI(); });
      card.addEventListener('click', e => { if (e.detail === 0) addReagent(state.selected, id); });
      card.addEventListener('pointerdown', e => {
        e.preventDefault();
        const ghost = document.createElement('div');
        ghost.className = 'drag-ghost'; ghost.textContent = nameOf(id);
        ghost.style.left = e.clientX + 12 + 'px'; ghost.style.top = e.clientY + 12 + 'px';
        document.body.appendChild(ghost);
        let moved = false, target = null;
        const move = ev => {
          if (Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) > 6) moved = true;
          ghost.style.left = ev.clientX + 12 + 'px'; ghost.style.top = ev.clientY + 12 + 'px';
          const r = cv.getBoundingClientRect();
          const inside = ev.clientX >= r.left && ev.clientX <= r.right && ev.clientY >= r.top && ev.clientY <= r.bottom;
          const [wx, wy] = bench.clientToWorld(ev.clientX, ev.clientY);
          const [sx, sy] = bench.xy(ev);
          target = inside && sy < bench.trayY ? bench.itemAt(wx, wy) : null;
          if (target && !isVessel(target)) target = null;
          bench.externalHover = target;
          ghost.classList.toggle('ok', !!target);
        };
        const finish = ev => {
          const cancelled = ev?.type === 'pointercancel';
          document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up);
          document.removeEventListener('pointercancel', cancel);
          ghost.remove(); bench.externalHover = null; activeDrag = null;
          if (cancelled) return;
          if (moved && !target) { ui.say('请把试剂拖到烧杯、试管或锥形瓶上。'); return; }
          addReagent(moved ? target : state.selected, id);
        };
        const up = ev => finish(ev);
        const cancel = ev => finish(ev);
        activeDrag = () => finish({ type: 'pointercancel' });
        document.addEventListener('pointermove', move);
        document.addEventListener('pointerup', up);
        document.addEventListener('pointercancel', cancel);
      });
    });

    function frame(t) {
      raf = requestAnimationFrame(frame);
      const raw = Math.min(3, t - (lastT || t)); lastT = t;
      const dt = raw * state.speed;
      state.simTime += dt / 60;
      let hoverChanged = false;
      if (!state.inspect?.reagent && bench.hover !== state.inspect?.it) {
        state.inspect = bench.hover ? { it: bench.hover } : null; hoverChanged = true;
      }
      for (const it of bench.items) {
        if (!isVessel(it)) continue;
        const data = it.data.sandbox, fx = data.analysis.effects || {};
        if (data.safetyT > 0) {
          data.safetyT = Math.max(0, data.safetyT - raw / 1000);
          $('s-fuse-bar').style.width = ((1 - data.safetyT / 2.8) * 100) + '%';
          if (!data.safetyT) {
            state.safety = null; $('s-fuse').hidden = true;
            ui.lamp('green', '安全护栏已恢复 · 本次危险加料未写入容器');
            ui.say('熔断演示结束。容器内容物保持不变；记住正确原则是<b>酸入水</b>。');
          }
        }
        const lamp = data.heatedBy ? bench.byId(data.heatedBy) : null;
        const heating = lamp && lamp.fsm && lamp.fsm.state !== 'off';
        const hasLiquid = data.contents.some(c => REAGENTS[c.id].phase === 'liquid');
        const targetTemp = heating ? (hasLiquid ? 100 : 105) : 25 + (fx.heat || 0) * 1.8;
        data.temp += (targetTemp - data.temp) * Math.min(1, dt * .012);
        if (it.liq) { it.liq.wave = heating || fx.rate ? 1 : .25; it.liq.vortex = fx.rate || 0; }
        if (data.contents.length && fx.gas && Math.random() < Math.min(.95, (fx.rate || .3) * .22 * dt)) {
          bench.fx.emitBubble(it.x + (Math.random() - .5) * it.def.w * .45, it.y + it.def.h * .28,
            it.y + it.def.h * .02, 1.5 + Math.random() * 2.5);
        }
        if (fx.precip && Math.random() < Math.min(.8, .08 * dt)) {
          bench.fx.emitPrecip(it.x + (Math.random() - .5) * it.def.w * .5, it.y, it.y + it.def.h * .32, fx.precip);
        }
        if ((fx.heat || heating) && Math.random() < Math.min(.8, .04 * dt)) {
          bench.fx.emitSmoke(it.x + (Math.random() - .5) * 18, it.y - it.def.h * .35, 'rgba(210,215,230,.28)');
        }
      }
      bench.fx.update(dt);
      bench.render(t);
      state.uiClock += raw;
      if (state.uiClock > 240 || hoverChanged) {
        state.uiClock = 0;
        const m = state.selected?.data?.sandbox?.analysis?.measurement || { volume: 0, mass: 0 };
        $('s-temp').textContent = Math.round(state.selected?.data?.sandbox?.temp || 25) + ' ℃';
        $('s-vol').textContent = fmt(m.volume) + ' mL'; $('s-mass').textContent = fmt(m.mass) + ' g';
        $('s-zoom').textContent = Math.round(bench.camera.zoom * 100) + '%';
        if (hoverChanged) $('s-inspector').innerHTML = inspectorHTML();
      }
    }

    seed(); updateUI(); frame(performance.now());
    cleanup = () => {
      cancelAnimationFrame(raf); raf = null;
      if (activeDrag) activeDrag();
      holo.destroy(); bench.destroy(); ui.destroy();
      state.discoveries.clear(); state.events = [];
    };
  },
  destroy() { if (cleanup) cleanup(); cleanup = null; }
};
