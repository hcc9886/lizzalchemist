// 实验通用套件：解说条 / 实验目标 / 实验步骤向导 / 实时成分表 / 方程式横幅 / 拖拽与热点
import { store, toast, openModal } from './progress.js';
import { achById } from './data/achievements.js';
import { play } from './audio.js';

/* 成就解锁（若为新解锁则弹提示） */
export function achieve(id) {
  if (store.setAchievement(id)) {
    play('achievement');
    const a = achById(id);
    if (a) toast('成就达成 ★ ' + a.name + '：' + a.desc);
  }
}

/* 画布坐标归一化 */
export function canvasXY(canvas, e) {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * canvas.width, (e.clientY - r.top) / r.height * canvas.height];
}

/*
 * drag(canvas, {hit(x,y), start(x,y,hit), move(x,y,dx,dy,hit), end(x,y,hit), hover})
 * hit 返回真值即认为可抓取；坐标已换算到画布内部分辨率。
 */
export function drag(canvas, h) {
  let active = null, px = 0, py = 0;
  canvas.addEventListener('pointerdown', e => {
    const [x, y] = canvasXY(canvas, e);
    const hit = h.hit ? h.hit(x, y) : null;
    if (!hit) return;
    active = hit; px = x; py = y;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
    canvas.classList.add('dragging');
    if (h.start) h.start(x, y, hit);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', e => {
    const [x, y] = canvasXY(canvas, e);
    if (active) {
      const dx = x - px, dy = y - py; px = x; py = y;
      if (h.move) h.move(x, y, dx, dy, active);
    } else if (h.hover !== false && h.hit) {
      canvas.classList.toggle('can-drag', !!h.hit(x, y));
    }
  });
  const up = e => {
    if (!active) return;
    const [x, y] = canvasXY(canvas, e);
    if (h.end) h.end(x, y, active);
    active = null;
    canvas.classList.remove('dragging');
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
}

/*
 * hotspot(canvas, spots) — spots: [{x, y, r, title, body}]
 * 返回绘制函数 draw(g2d, t)：在画布上画出 ？ 脉冲圆点；点击圆点弹出解释。
 */
export function hotspot(canvas, spots) {
  canvas.addEventListener('click', e => {
    const [x, y] = canvasXY(canvas, e);
    const s = spots.find(s => (x - s.x) * (x - s.x) + (y - s.y) * (y - s.y) < (s.r + 8) * (s.r + 8));
    if (s) openModal('<h3>为什么？· ' + s.title + '</h3><p>' + s.body + '</p><p style="margin-top:10px"><button class="btn small" onclick="document.getElementById(\'modal-root\').innerHTML=\'\'">关闭</button></p>');
  });
  return (g2d, t) => {
    spots.forEach((s, i) => {
      const pulse = s.r + 3 + Math.sin(t / 350 + i * 1.3) * 1.6;
      g2d.strokeStyle = 'rgba(212,165,66,.85)';
      g2d.lineWidth = 1.5;
      g2d.beginPath(); g2d.arc(s.x, s.y, pulse, 0, 7); g2d.stroke();
      g2d.fillStyle = 'rgba(212,165,66,.16)';
      g2d.beginPath(); g2d.arc(s.x, s.y, pulse, 0, 7); g2d.fill();
      g2d.fillStyle = '#d4a542';
      g2d.font = 'bold 12px sans-serif';
      g2d.fillText('?', s.x - 4, s.y + 4);
      g2d.lineWidth = 1;
    });
  };
}

/*
 * createKit(root, opts) — 在实验页面顶部生成目标/步骤/解说/成分结构。
 * opts: {
 *   narr: '开场解说', chal: '挑战说明', ach: 'challenge 成就 id',
 *   goals: [{id, text}], steps: [{t, d}]
 * }
 * 返回 API: say / goal / steps / comp / eq / win / reset / record
 */
export function createKit(root, opts) {
  const goals = opts.goals || [];
  const steps = opts.steps || [];
  let curStep = 0, won = false;

  const head = document.createElement('div');
  head.innerHTML = `
    <div class="exp-kitbar">
      <div class="kit-narr" id="kit-narr"></div>
      <div class="kit-chal" id="kit-chal"><b>挑战</b><span>${opts.chal || ''}</span></div>
    </div>
    <div class="kit-panels">
      ${goals.length ? `<div class="kit-panel"><h4>实验目标</h4>
        <ul class="kit-goals">${goals.map(g => `<li data-g="${g.id}"><i></i>${g.text}</li>`).join('')}</ul>
      </div>` : ''}
      ${steps.length ? `<div class="kit-panel"><h4>实验步骤 <span class="kit-stepnum" id="kit-stepnum">1/${steps.length}</span></h4>
        <div class="kit-step-body" id="kit-step-body"></div>
        <div class="kit-step-nav">
          <button class="btn small ghost" id="kit-prev">← 上一步</button>
          <button class="btn small" id="kit-next">下一步 →</button>
        </div>
      </div>` : ''}
      <div class="kit-panel" id="kit-comp-panel" style="display:none">
        <h4>实时成分</h4>
        <table class="kit-comp"><tbody id="kit-comp-body"></tbody></table>
      </div>
    </div>
    <div class="eq-banner" id="kit-eq" style="display:none"></div>`;
  root.appendChild(head);

  const $ = id => root.querySelector('#' + id);
  const narr = $('kit-narr'), chal = $('kit-chal');
  const goalEls = {};
  root.querySelectorAll('.kit-goals li').forEach(li => { goalEls[li.dataset.g] = li; });

  const checkAllDone = () => {
    const all = goals.length && goals.every(g => goalEls[g.id] && goalEls[g.id].classList.contains('done'));
    if (all) api.win();
  };

  const renderStep = () => {
    if (!steps.length) return;
    const s = steps[curStep];
    $('kit-stepnum').textContent = (curStep + 1) + '/' + steps.length;
    $('kit-step-body').innerHTML = `<b>${s.t}</b><p>${s.d}</p>`;
    $('kit-prev').disabled = curStep === 0;
    $('kit-next').disabled = curStep === steps.length - 1;
    $('kit-prev').style.opacity = curStep === 0 ? '.4' : '1';
    $('kit-next').style.opacity = curStep === steps.length - 1 ? '.4' : '1';
  };

  const api = {
    say(text) {
      narr.innerHTML = text;
      narr.classList.remove('flash');
      void narr.offsetWidth;
      narr.classList.add('flash');
    },
    goal(id, done = true) {
      const el = goalEls[id];
      if (!el) return;
      el.classList.toggle('done', done);
      checkAllDone();
    },
    resetGoals() {
      Object.values(goalEls).forEach(el => el.classList.remove('done'));
      won = false;
      chal.classList.remove('won');
      if (opts.chal) chal.innerHTML = '<b>挑战</b><span>' + opts.chal + '</span>';
    },
    steps(n) {
      if (!steps.length) return;
      curStep = Math.max(0, Math.min(steps.length - 1, n));
      renderStep();
    },
    comp(rows) {
      const panel = $('kit-comp-panel');
      if (!rows || !rows.length) { panel.style.display = 'none'; return; }
      panel.style.display = '';
      $('kit-comp-body').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
    },
    eq(html) {
      const el = $('kit-eq');
      el.innerHTML = html;
      el.style.display = 'block';
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
      clearTimeout(api._eqT);
      api._eqT = setTimeout(() => { el.style.display = 'none'; }, 7000);
    },
    win() {
      if (won) return;
      won = true;
      chal.classList.add('won');
      chal.innerHTML = '<b>挑战</b><span>✓ 完成！成就已解锁</span>';
      play('success');
      toast('挑战完成！');
      if (opts.ach) achieve(opts.ach);
    },
    record(params, results) { /* 由实验在创建时绑定 ctx.record */ }
  };

  if (steps.length) {
    renderStep();
    $('kit-prev').addEventListener('click', () => api.steps(curStep - 1));
    $('kit-next').addEventListener('click', () => api.steps(curStep + 1));
  }
  api.say(opts.narr || '欢迎来到实验台。');
  return api;
}
