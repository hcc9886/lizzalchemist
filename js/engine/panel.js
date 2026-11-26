// 实验 UI 套件 v3：解说条 + 红绿灯护栏条 + 目标条 + 六标签面板 + 方程式横幅
// 六标签：目标 / 本次用料 / 操作步骤 / 成分解析 / 数据记录 / 提示与安全（可按实验增删）
const DEFAULT_TABS = [
  { id: 'goal', name: '🎯 目标' },
  { id: 'bom', name: '⚗ 用料' },
  { id: 'step', name: '📋 步骤' },
  { id: 'comp', name: '🧪 成分' },
  { id: 'data', name: '📈 数据' },
  { id: 'safety', name: '⚠ 安全' }
];

export function createExpUI(root, opts = {}) {
  const goals = opts.goals || [];
  const tabs = opts.tabs && opts.tabs.length ? opts.tabs : DEFAULT_TABS;
  let active = tabs[0].id;
  const content = {};
  tabs.forEach(t => { content[t.id] = t.html || '<p class="muted">暂无内容</p>'; });

  const top = document.createElement('div');
  top.innerHTML = `
    <div class="kit-narr" id="e3-narr"></div>
    <div class="tl-bar">
      <span class="tl-lamp g on" id="e3-lg"></span>
      <span class="tl-lamp y" id="e3-ly"></span>
      <span class="tl-lamp r" id="e3-lr"></span>
      <span class="tl-msg" id="e3-tlmsg">安全护栏已开启 · 绿灯：正常操作 / 黄灯：需要确认 / 红灯：拦截并演示后果</span>
    </div>`;
  root.prepend(top);

  const bottom = document.createElement('div');
  bottom.innerHTML = `
    <div class="goal-chips" id="e3-goals">
      ${goals.map(g => `<span class="gchip" data-g="${g.id}">◻ ${g.text}</span>`).join('')}
    </div>
    <div class="eq-banner" id="e3-eq" style="display:none"></div>
    <div class="sixtab">
      <div class="tabbar six">${tabs.map(t => `<button data-t="${t.id}" class="${t.id === active ? 'on' : ''}">${t.name}</button>`).join('')}</div>
      <div class="stab-body" id="e3-body"></div>
    </div>`;
  bottom.style.display = 'none'; // mountBottom 后再显示

  const $ = id => root.querySelector('#' + id);
  const api = {
    el: root,
    say(html) {
      const el = $('e3-narr');
      el.innerHTML = html;
      el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    },
    lamp(level, msg) {
      $('e3-lg').classList.toggle('on', level === 'green');
      $('e3-ly').classList.toggle('on', level === 'yellow');
      $('e3-lr').classList.toggle('on', level === 'red');
      $('e3-tlmsg').innerHTML = msg || '';
    },
    goal(id, done = true) {
      const el = root.querySelector(`.gchip[data-g="${id}"]`);
      if (!el) return;
      el.classList.toggle('done', done);
      el.innerHTML = el.innerHTML.replace(/^./, done ? '✅' : '◻');
      if (opts.onGoal) opts.onGoal(id, done);
      const all = goals.length && goals.every(g => {
        const e = root.querySelector(`.gchip[data-g="${g.id}"]`);
        return e && e.classList.contains('done');
      });
      if (all && opts.onAllDone) opts.onAllDone();
    },
    resetGoals() {
      goals.forEach(g => {
        const el = root.querySelector(`.gchip[data-g="${g.id}"]`);
        if (el) { el.classList.remove('done'); el.innerHTML = '◻ ' + el.textContent.replace(/^[◻✅]\s*/, ''); }
      });
    },
    eq(html) {
      const el = $('e3-eq');
      el.innerHTML = html;
      el.style.display = 'block';
      el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
      clearTimeout(api._eqT);
      api._eqT = setTimeout(() => { el.style.display = 'none'; }, 7000);
    },
    setActive(id) {
      active = id;
      root.querySelectorAll('.sixtab .tabbar button').forEach(b => b.classList.toggle('on', b.dataset.t === id));
      $('e3-body').innerHTML = content[id] || '';
    },
    setHtml(tab, html) { content[tab] = html; if (active === tab) $('e3-body').innerHTML = html; },
    setRows(tab, rows, headers) {
      const thead = headers ? '<tr>' + headers.map(h => `<th>${h}</th>`).join('') + '</tr>' : '';
      api.setHtml(tab, `<table class="stab-table">${thead}${rows.map(r => '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>').join('')}</table>`);
    },
    mountBottom() {
      root.appendChild(bottom);
      bottom.style.display = '';
      root.querySelectorAll('.sixtab .tabbar button').forEach(b =>
        b.addEventListener('click', () => api.setActive(b.dataset.t)));
      api.setActive(active);
    },
    destroy() { top.remove(); bottom.remove(); clearTimeout(api._eqT); }
  };
  api.say(opts.narr || '欢迎来到实验台。');
  return api;
}
