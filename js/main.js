import { store, toast, openModal, closeModal, printHtml } from './progress.js';
import { achieve } from './expkit.js';
import { ACHIEVEMENTS, achById } from './data/achievements.js';
import { GLOSSARY } from './data/glossary.js';
import { TIMELINE } from './data/timeline.js';
import { SYMBOLS } from './data/symbols.js';
import { TRACKS, ALL_UNITS, unitById, trackOf, nextUnit, prevUnit, PERSONA_RECOMMEND } from './data/curriculum.js';
import { QUIZZES } from './data/quizzes.js';
import { EXPERIMENTS, expById } from './experiments/index.js';
import { renderNotebook } from './notebook.js';
import { tutorReply, QUICK_TOPICS } from './tutor.js';

const view = document.getElementById('view');
let expCleanup = null;
let lastContext = {};

/* ---------- shared helpers ---------- */

function enhanceGlossary(container) {
  container.querySelectorAll('dfn.gloss').forEach(d => {
    const key = d.dataset.g;
    const g = GLOSSARY[key];
    if (g) {
      d.title = g.t + '：' + g.d;
      d.addEventListener('click', () => {
        openModal('<h3>' + g.t + '</h3><p>' + g.d + '</p><p style="margin-top:10px"><button class="btn small" onclick="document.getElementById(\'modal-root\').innerHTML=\'\'">关闭</button></p>');
      });
    }
  });
}

function setActiveNav(hash) {
  document.querySelectorAll('#mainnav a').forEach(a => {
    const href = a.getAttribute('href');
    a.classList.toggle('active', hash.startsWith(href) && href !== '#/home' || hash === href);
  });
}

function stats() {
  const done = Object.keys(store.state.lessonsDone).length;
  const quizScores = Object.values(store.state.quiz);
  const avg = quizScores.length ? Math.round(quizScores.reduce((s, q) => s + q.best, 0) / quizScores.length) : 0;
  return { done, total: ALL_UNITS.length, quizN: quizScores.length, avg, expN: store.state.notebook.length };
}

function scoreOf(unitId) {
  const q = store.quizOf(unitId);
  if (q) return q.best;
  if (store.isDone(unitId)) return 60;
  if (store.isVisited(unitId)) return 25;
  return 0;
}

/* ---------- onboarding ---------- */

function maybeOnboarding() {
  if (store.state.persona) return;
  openModal(`
    <h3>欢迎来到 Alchemia</h3>
    <p class="muted">从人类与火，到原子与分子——这里是一条从零基础到精通的炼金术与化学之路。先告诉我们你是谁，好为你推荐路线（之后随时可换）：</p>
    <div class="persona-list">
      <button data-p="zero"><b>零基础探索者</b><span>没学过化学，从头开始，完全不怕听不懂</span></button>
      <button data-p="middle"><b>中学生</b><span>同步课本核心：元素、摩尔、酸碱、电化学</span></button>
      <button data-p="college"><b>大学生 / 进阶者</b><span>热力学、动力学、结构与计算的深层逻辑</span></button>
      <button data-p="adult"><b>成人爱好者</b><span>材料、环境、能源、药物 + 完整科研课题</span></button>
      <button data-p="teacher"><b>教师</b><span>布置任务、管理班级、生成作业单</span></button>
      <button data-p="zero"><b>随便看看</b><span>从时间轴和实验室开始逛起</span></button>
    </div>`);
  document.querySelectorAll('[data-p]').forEach(btn => btn.addEventListener('click', () => {
    store.setPersona(btn.dataset.p);
    closeModal();
    toast('路线已设定：' + btn.querySelector('b').textContent);
    render();
  }));
}

/* ---------- views ---------- */

function viewHome() {
  const s = stats();
  const persona = store.state.persona;
  const rec = persona ? PERSONA_RECOMMEND[persona] : 'a';
  const track = TRACKS.find(t => t.id === rec);
  const nextLesson = track.units.find(u => !store.isDone(u.id)) || track.units[0];
  const pct = Math.round(s.done / s.total * 100);
  const achN = Object.keys(store.state.achievements || {}).length;
  const daily = store.dailyOf();
  const dailyItems = [
    ['lesson', '学一课', daily.lesson >= 1, '完成任意 1 个课程单元'],
    ['exp', '做实验', daily.exp >= 1, '记录 1 条实验数据'],
    ['flash', '翻闪卡', daily.flash >= 3, '复习 3 张术语闪卡']
  ];
  view.innerHTML = `
    <div class="hero">
      <div class="eyebrow">ALCHEMIA · 从火种到元素</div>
      <h1>人人都能成为炼金术士</h1>
      <p class="lead">沿着化学与炼金术的起源学习：历史时间轴、${s.total} 个详细课程单元、${Object.keys(EXPERIMENTS).length} 个带目标挑战的虚拟实验、成就徽章与实验本。炼金术作为历史文化，化学作为可验证科学——零基础也能一路学到精通。</p>
      <div class="hero-actions">
        <a class="btn primary" href="#/unit/${nextLesson.id}">继续学习：${nextLesson.title}</a>
        <a class="btn" href="#/timeline">从起源时间轴开始</a>
        <a class="btn ghost" href="#/lab">直接进虚拟实验室</a>
        <button class="btn ghost" id="home-search">🔍 全站搜索</button>
        ${persona ? `<button class="btn ghost" id="re-persona">身份：${({ zero: '零基础探索者', middle: '中学生', college: '大学生/进阶者', adult: '成人爱好者', teacher: '教师' }[persona])}（更换）</button>` : ''}
      </div>
    </div>
    <div class="grid g4" style="margin:26px 0">
      <div class="card ring-wrap">
        <svg viewBox="0 0 110 110" aria-hidden="true">
          <defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#d4a542"/><stop offset="1" stop-color="#2ea882"/>
          </linearGradient></defs>
          <circle class="ring-track" cx="55" cy="55" r="46"/>
          <circle class="ring-bar" cx="55" cy="55" r="46"
            stroke-dasharray="${(2 * Math.PI * 46).toFixed(1)}" stroke-dashoffset="${(2 * Math.PI * 46 * (1 - pct / 100)).toFixed(1)}"/>
          <text class="ring-num" x="55" y="56" text-anchor="middle">${pct}%</text>
          <text class="ring-cap" x="55" y="74" text-anchor="middle">${s.done}/${s.total} 单元</text>
        </svg>
        <div><h3 style="font-size:16px">学习进度</h3><p>按四条路线推进，测验与实验都计入掌握度</p></div>
      </div>
      <div class="card"><h3>${s.quizN} 场 / 平均 ${s.avg} 分</h3><p>测验成绩（平均正确率）</p></div>
      <div class="card"><h3>${s.expN} 条</h3><p>实验记录 · ${store.expVisitedCount()}/${Object.keys(EXPERIMENTS).length} 个实验已打开</p></div>
      <div class="card"><h3>★ ${achN}/${ACHIEVEMENTS.length}</h3><p>成就徽章 · <a href="#/achievements">成就殿堂</a></p></div>
    </div>
    <h2 style="margin:10px 0">今日炼金任务</h2>
    <div class="daily-row">
      ${dailyItems.map(([k, t, done, d]) => `<div class="daily-item ${done ? 'done' : ''}"><b>${done ? '✓ ' : '○ '}${t}</b>${d}</div>`).join('')}
    </div>
    <h2 style="margin:26px 0 10px">学习路线</h2>
    <div class="grid g4">
      ${TRACKS.map(t => `<div class="card" style="${t.id === rec ? 'border-color:var(--gold)' : ''}">
        <span class="badge ${t.id === rec ? 'gold' : ''}">${t.units.length} 单元</span>
        <h3 style="margin-top:8px">${t.name}</h3><p>${t.desc}</p>
        <p style="margin-top:10px"><a class="btn small" href="#/learn#${t.id}">进入 ${t.name.split('·')[0].trim()}</a></p>
      </div>`).join('')}
    </div>
    <h2 style="margin:30px 0 10px">功能地图</h2>
    <div class="grid g3">
      ${[
        ['起源时间轴', '10 个历史阶段，从人类与火到计算化学', '#/timeline'],
        ['炼金图鉴', '符号解码器 + 术语库 + 实验速查，一站查阅', '#/glossary'],
        ['课程系统', `四线 ${s.total} 单元，每单元六层教学 + FAQ + 测验`, '#/learn'],
        ['虚拟实验室', `${Object.keys(EXPERIMENTS).length} 个实验：目标清单、步骤向导、拖拽操作与方程式横幅`, '#/lab'],
        ['实验本', '自动记录数据，导出 CSV、打印报告', '#/notebook'],
        ['掌握地图', '按测验成绩着色的知识掌握热力图', '#/mastery'],
        ['术语闪卡', '翻卡复习核心概念，正反面问答式', '#/flashcards'],
        ['成就殿堂', `${ACHIEVEMENTS.length} 枚徽章 + 可打印的炼金术士证书`, '#/achievements'],
        ['离线导师 & 教师端', '苏格拉底问答、班级管理与作业单打印', '#/tutor']
      ].map(([t, d, href]) => `<div class="card"><h3>${t}</h3><p>${d}</p><p style="margin-top:8px"><a href="${href}">打开 →</a></p></div>`).join('')}
    </div>
    <div class="panel gold" style="margin-top:30px">
      <h3>今日推荐</h3>
      <p>${track.name} 之 <a href="#/unit/${nextLesson.id}">${nextLesson.title}</a> —— ${nextLesson.subtitle}（约 ${nextLesson.minutes} 分钟）。学完记得做小测验，掌握地图会点亮它。</p>
    </div>`;
  enhanceGlossary(view);
  const reP = view.querySelector('#re-persona');
  if (reP) reP.addEventListener('click', () => {
    store.setPersona(null);
    maybeOnboarding();
  });
  view.querySelector('#home-search').addEventListener('click', openSearch);
  maybeOnboarding();
}

function viewTimeline() {
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 起源时间轴</div>
    <h1>化学与炼金术起源时间轴</h1>
    <p class="muted">从人类第一次控制火，到在电脑里计算分子。点击每个阶段展开详情、关键人物与思考题。</p>
    <div class="tl">
      ${TIMELINE.map((s, i) => `
      <div class="tl-item" data-i="${i}">
        <div class="tl-era">${s.era}</div>
        <h3>${s.title}</h3>
        <div class="tl-body">${s.summary}</div>
        <button class="btn small" data-toggle="${i}" style="margin-top:10px">展开详情</button>
        <div class="tl-extra">
          ${s.details.map(d => `<div>${d}</div>`).join('')}
          <h4>关键人物</h4><ul>${s.people.map(p => `<li><b>${p.n}</b> — ${p.d}</li>`).join('')}</ul>
          <h4>关键事件</h4><ul>${s.events.map(e => `<li>${e}</li>`).join('')}</ul>
          <h4>与现代化学的联系</h4><div>${s.connection}</div>
          <div class="link-q">${s.question}　<a href="#/unit/${s.link}">→ 进入相关课程单元</a></div>
        </div>
      </div>`).join('')}
    </div>`;
  enhanceGlossary(view);
  view.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const item = view.querySelector(`.tl-item[data-i="${btn.dataset.toggle}"]`);
    item.classList.toggle('open');
    btn.textContent = item.classList.contains('open') ? '收起详情' : '展开详情';
  }));
}

function viewSymbols() {
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 炼金符号</div>
    <h1>炼金符号解码器</h1>
    <p class="muted">炼金术士用符号记录他们的物质观。点击查看每个符号的历史含义，以及现代科学如何重新解释它。</p>
    <div class="sym-grid">
      ${SYMBOLS.map((s, i) => `<div class="sym-card" data-i="${i}">
        <div class="glyph">${s.glyph}</div>
        <div class="nm">${s.name}</div>
        <div class="muted" style="font-size:12px">${s.en}</div>
      </div>`).join('')}
    </div>`;
  view.querySelectorAll('.sym-card').forEach(card => card.addEventListener('click', () => {
    const s = SYMBOLS[+card.dataset.i];
    openModal(`
      <h3>${s.glyph.startsWith('<svg') ? '' : '<span style="font-size:34px;margin-right:10px">' + s.glyph + '</span>'}${s.name} · ${s.en}</h3>
      <p><b>含义</b>：${s.meaning}</p>
      <p><b>历史</b>：${s.history}</p>
      <p><b>现代科学</b>：${s.science}</p>
      <p style="margin-top:12px"><a class="btn small" href="#/unit/${s.link}" onclick="document.getElementById('modal-root').innerHTML=''">去相关课程单元 →</a></p>`);
  }));
}

function viewLearn() {
  const hash = location.hash;
  const activeTrack = hash.includes('#') && hash.split('#')[1] ? hash.split('#')[1] : (store.state.persona ? PERSONA_RECOMMEND[store.state.persona] : 'a');
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 课程</div>
    <h1>课程：从零基础到精通</h1>
    <p class="muted">四条路线覆盖中学生、大学生、成人爱好者与教师。每单元六层教学：历史现场 → 生活现象 → 科学原理 → 公式推导 → 虚拟实验 → 综合挑战。</p>
    <div class="exp-actions" style="margin:16px 0">
      ${TRACKS.map(t => `<button class="btn ${t.id === activeTrack ? 'primary' : ''}" data-track="${t.id}">${t.name}</button>`).join('')}
    </div>
    <div id="track-units"></div>`;
  const container = view.querySelector('#track-units');
  const renderTrack = tid => {
    const t = TRACKS.find(x => x.id === tid);
    container.innerHTML = `<div class="panel gold"><h3>${t.name}</h3><p>${t.desc}</p></div>
      <div class="grid g2">
      ${t.units.map(u => {
        const sc = scoreOf(u.id);
        const done = store.isDone(u.id);
        return `<div class="card">
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
            <span class="badge ${done ? 'green' : sc > 0 ? 'gold' : ''}">${done ? '已完成' : sc > 0 ? '进行中' : '未开始'}</span>
            ${store.quizOf(u.id) ? `<span class="badge blue">测验 ${sc} 分</span>` : ''}
            <span class="badge">${u.minutes} 分钟</span>
          </div>
          <h3><a href="#/unit/${u.id}">${u.title}</a></h3>
          <p>${u.subtitle}</p>
          <div class="bar"><i style="width:${sc}%"></i></div>
        </div>`;
      }).join('')}
      </div>`;
  };
  view.querySelectorAll('[data-track]').forEach(btn => btn.addEventListener('click', () => {
    view.querySelectorAll('[data-track]').forEach(b => b.classList.remove('primary'));
    btn.classList.add('primary');
    renderTrack(btn.dataset.track);
    location.hash = '#/learn#' + btn.dataset.track;
  }));
  renderTrack(activeTrack);
}

function renderQuiz(container, unitId) {
  const qs = QUIZZES[unitId] || [];
  if (!qs.length) { container.innerHTML = '<p class="muted">本单元暂无测验。</p>'; return; }
  let answered = 0, correct = 0;
  container.innerHTML = `
    <p class="muted">4 道题，答完自动评分并计入掌握地图。</p>
    ${qs.map((q, qi) => `
      <div class="quiz-q" data-qi="${qi}">
        <p><b>Q${qi + 1}.</b> ${q.q}</p>
        ${q.opts.map((o, oi) => `<div class="quiz-opt" data-q="${qi}" data-o="${oi}">${'ABCD'[oi]}. ${o}</div>`).join('')}
        <div class="quiz-explain" style="display:none">${q.e}</div>
      </div>`).join('')}
    <div id="quiz-result" style="margin-top:14px"></div>`;
  container.querySelectorAll('.quiz-opt').forEach(opt => opt.addEventListener('click', () => {
    const qi = +opt.dataset.q, oi = +opt.dataset.o;
    const block = container.querySelector(`.quiz-q[data-qi="${qi}"]`);
    if (block.dataset.done) return;
    block.dataset.done = '1';
    block.querySelectorAll('.quiz-opt').forEach((o, i) => {
      if (i === qs[qi].a) o.classList.add('correct');
      else if (i === oi) o.classList.add('wrong');
    });
    block.querySelector('.quiz-explain').style.display = 'block';
    answered++;
    if (oi === qs[qi].a) correct++;
    if (answered === qs.length) {
      const pct = Math.round(correct / qs.length * 100);
      store.setQuiz(unitId, correct, qs.length);
      achieve('first_quiz');
      if (pct === 100) achieve('quiz_ace');
      if (Object.keys(store.state.quiz).length >= 5) achieve('quiz_five');
      container.querySelector('#quiz-result').innerHTML =
        `<div class="panel gold"><h3>得分：${correct}/${qs.length}（${pct} 分）</h3>
        <p>${pct >= 75 ? '掌握扎实！去下一单元吧。' : '建议回顾错题解析，再复习本单元的关键段落。'}</p>
        <p><a class="btn small" href="#/mastery">查看掌握地图</a>　<a class="btn small" href="#/learn">回到课程列表</a></p></div>`;
      toast('测验已记录：' + pct + ' 分');
    }
  }));
}

function viewUnit(id) {
  const u = unitById(id);
  if (!u) { view.innerHTML = '<div class="panel">单元不存在。</div>'; return; }
  const t = trackOf(u);
  store.visit(id);
  lastContext = { unit: u.title };
  const prev = prevUnit(id), next = nextUnit(id);
  const done = store.isDone(id);
  view.innerHTML = `
    <div class="crumb"><a href="#/learn">课程</a> / ${t.name} / ${u.title}</div>
    <div class="lesson-head">
      <h1>${u.title}</h1>
      <span class="badge gold">${t.name.split('·')[0].trim()}</span>
      <span class="badge">${u.minutes} 分钟</span>
      ${done ? '<span class="badge green">已完成</span>' : ''}
    </div>
    <p class="muted">${u.subtitle}</p>
    <div class="section"><h3>历史现场</h3><div class="body">${u.story}</div></div>
    <div class="section"><h3>生活现象</h3><div class="body">${u.life}</div></div>
    <div class="section"><h3>科学原理</h3><div class="body">${u.principle}</div></div>
    <div class="section"><h3>公式与推导</h3><div class="body">${u.formula}</div></div>
    <div class="section"><h3>虚拟实验</h3><div class="body">
      ${u.lab && u.lab.id ? `<p>${u.lab.note}</p><p><a class="btn primary" href="#/exp/${u.lab.id}">进入实验：${EXPERIMENTS[u.lab.id].title} →</a></p>` : `<p>${u.lab ? u.lab.note : ''}</p>`}
    </div></div>
    <div class="section"><h3>综合挑战</h3><div class="body">${u.challenge}</div></div>
    <div class="section"><h3>常见疑问</h3>
      ${u.faq.map(f => `<details class="faq-item"><summary>${f.q}</summary><p>${f.a}</p></details>`).join('')}
    </div>
    <div class="section"><h3>单元测验</h3><div class="body" id="quiz-box"></div></div>
    <div class="exp-actions" style="margin:24px 0">
      <button class="btn ${done ? '' : 'primary'}" id="u-done">${done ? '取消完成标记' : '标记本单元已完成'}</button>
      ${prev ? `<a class="btn ghost" href="#/unit/${prev.id}">← 上一课：${prev.title}</a>` : ''}
      ${next ? `<a class="btn ghost" href="#/unit/${next.id}">下一课：${next.title} →</a>` : ''}
    </div>`;
  enhanceGlossary(view);
  renderQuiz(view.querySelector('#quiz-box'), id);
  view.querySelector('#u-done').addEventListener('click', () => {
    if (store.isDone(id)) { store.unmarkDone(id); }
    else {
      store.markDone(id);
      store.bumpDaily('lesson');
      toast('已完成：' + u.title);
      const n = Object.keys(store.state.lessonsDone).length;
      if (n === 1) achieve('first_lesson');
      if (n === 5) achieve('five_lessons');
      if (n === 10) achieve('ten_lessons');
      if (n === ALL_UNITS.length) achieve('all_lessons');
    }
    viewUnit(id);
  });
  view.scrollTop = 0;
}

function viewLab() {
  const CATS = {
    basic: '基础感知（零基础友好）',
    core: '中学核心',
    adv: '进阶探究'
  };
  const catOf = e => {
    if (e.tags.includes('零基础')) return 'basic';
    if (e.tags.includes('中学')) return 'core';
    return 'adv';
  };
  const grouped = { basic: [], core: [], adv: [] };
  Object.values(EXPERIMENTS).forEach(e => grouped[catOf(e)].push(e));
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 虚拟实验室</div>
    <h1>虚拟实验室</h1>
    <p class="muted">${Object.keys(EXPERIMENTS).length} 个可交互实验：目标清单自动打勾、步骤向导、拖拽操作、实时成分面板与方程式横幅——像闯关一样做实验。每次数据都可记录到实验本。</p>
    <div class="tabbar" id="lab-tabs">
      <button data-c="all" class="on">全部（${Object.keys(EXPERIMENTS).length}）</button>
      ${Object.entries(CATS).map(([k, v]) => `<button data-c="${k}">${v.split('（')[0]}（${grouped[k].length}）</button>`).join('')}
    </div>
    <div id="lab-grid"></div>
    <div class="safety"><h4>安全总则</h4><ul>
      <li>本实验室为虚拟模拟，不含真实化学操作。</li>
      <li>现实中的任何化学实验：先穿戴护目镜与实验服，保持通风。</li>
      <li>绝不混合不明物质（84消毒液+洁厕灵会产生剧毒氯气）。</li>
      <li>废液分类收集，不直接倒入下水道。</li>
    </ul></div>`;
  const grid = view.querySelector('#lab-grid');
  const renderGrid = c => {
    const list = c === 'all' ? Object.values(EXPERIMENTS) : grouped[c];
    grid.innerHTML = `<h3 style="margin:14px 0 4px">${c === 'all' ? '全部实验' : CATS[c]}</h3><div class="grid g4">
      ${list.map(e => `<div class="card">
        ${store.state.expsVisited[e.id] ? '<span class="badge green">已打开</span>' : '<span class="badge">未探索</span>'}
        <h3 style="margin-top:6px"><a href="#/exp/${e.id}">${e.title}</a></h3>
        <p>${e.oneLine}</p>
        <p style="margin-top:10px">${e.tags.map(t => `<span class="badge">${t}</span>`).join(' ')}</p>
      </div>`).join('')}
    </div>`;
  };
  view.querySelectorAll('#lab-tabs button').forEach(btn => btn.addEventListener('click', () => {
    view.querySelectorAll('#lab-tabs button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    renderGrid(btn.dataset.c);
  }));
  renderGrid('all');
}

function viewExp(id) {
  const e = expById(id);
  if (!e) { view.innerHTML = '<div class="panel">实验不存在。</div>'; return; }
  lastContext = { exp: e.title };
  const firstVisit = !store.state.expsVisited[id];
  store.visitExp(id);
  if (firstVisit && store.expVisitedCount() === Object.keys(EXPERIMENTS).length) achieve('exp_all');
  view.innerHTML = `
    <div class="crumb"><a href="#/lab">虚拟实验室</a> / ${e.title}</div>
    <div class="lesson-head"><h1>${e.title}</h1>${e.tags.map(t => `<span class="badge">${t}</span>`).join('')}</div>
    <p class="muted">${e.oneLine}</p>
    <div class="safety"><h4>安全提示</h4><ul>${e.safety.map(s => `<li>${s}</li>`).join('')}</ul></div>
    <div id="exp-mount"></div>
    <div class="exp-actions">
      <a class="btn ghost" href="#/notebook">查看实验本 →</a>
      <a class="btn ghost" href="#/lab">返回实验室列表</a>
    </div>`;
  e.render(view.querySelector('#exp-mount'), {
    record(params, results) {
      store.addNotebookRecord({ exp: e.id, title: e.title, params, results });
      store.bumpDaily('exp');
      if (store.state.notebook.length === 1) achieve('first_exp');
      if (store.state.notebook.length === 10) achieve('exp_ten');
      toast('已记录到实验本');
    }
  });
  expCleanup = () => e.destroy && e.destroy();
}

function viewMastery() {
  const s = stats();
  const weakest = [...ALL_UNITS].sort((a, b) => scoreOf(a.id) - scoreOf(b.id)).slice(0, 3).filter(u => scoreOf(u.id) < 80);
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 掌握地图</div>
    <h1>知识掌握地图</h1>
    <p class="muted">颜色代表掌握程度：<span class="badge green">≥80 扎实</span> <span class="badge gold">50~79 进行中</span> <span class="badge blue">1~49 薄弱</span> <span class="badge">0 未开始</span>。测验成绩为主，完成课程与浏览也会累积基础分。</p>
    <div class="grid g4" style="margin:16px 0">
      <div class="card"><h3>${Math.round(ALL_UNITS.reduce((sum, u) => sum + scoreOf(u.id), 0) / ALL_UNITS.length)}</h3><p>平均掌握度</p></div>
      <div class="card"><h3>${s.done}</h3><p>已完成单元</p></div>
      <div class="card"><h3>${s.avg}</h3><p>测验平均分</p></div>
      <div class="card"><h3>${s.expN}</h3><p>实验记录数</p></div>
    </div>
    ${weakest.length ? `<div class="panel gold"><h3>建议优先补强</h3><p>${weakest.map(u => `<a href="#/unit/${u.id}">${u.title}</a>`).join('　·　')}</p></div>` : ''}
    <div class="mastery-grid">
      ${ALL_UNITS.map(u => {
        const sc = scoreOf(u.id);
        const cls = sc >= 80 ? 'hot' : sc >= 50 ? 'mid' : sc > 0 ? 'low' : 'zero';
        return `<div class="m-cell ${cls}">
          <div style="display:flex;justify-content:space-between;align-items:baseline">
            <b>${u.title}</b><span class="score">${sc}</span>
          </div>
          <div class="muted" style="font-size:12.5px">${trackOf(u).name.split('·')[0].trim()}</div>
          <div class="bar"><i style="width:${sc}%"></i></div>
          <p style="margin-top:8px"><a class="btn small" href="#/unit/${u.id}">进入学习</a></p>
        </div>`;
      }).join('')}
    </div>`;
}

function viewTutor() {
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 导师</div>
    <h1>离线导师（苏格拉底式）</h1>
    <p class="muted">规则版演示导师：不直接给答案，而是给思考链与追问，引导你自己推出结论。无需联网；未来可接入大模型获得完整对话能力。</p>
    <div class="chat">
      <div class="chat-log" id="t-log">
        <div class="msg bot">你好，我是 Alchemia 的规则导师。问我化学问题（如"什么是摩尔""催化剂为什么加速反应"），或直接点下面的话题按钮。${lastContext.unit ? '我看到你刚学了「' + lastContext.unit + '」。' : ''}</div>
      </div>
      <div class="chips">${QUICK_TOPICS.map(t => `<button class="chip-btn">${t}</button>`).join('')}</div>
      <div class="chat-input">
        <input id="t-in" placeholder="输入你的问题…" autocomplete="off">
        <button class="btn primary" id="t-send">提问</button>
      </div>
    </div>`;
  const log = view.querySelector('#t-log');
  const input = view.querySelector('#t-in');
  const send = q => {
    if (!q.trim()) return;
    log.insertAdjacentHTML('beforeend', `<div class="msg user"></div>`);
    const userMsg = log.lastElementChild;
    userMsg.textContent = q;
    const reply = tutorReply(q, lastContext);
    setTimeout(() => {
      log.insertAdjacentHTML('beforeend', `<div class="msg bot"></div>`);
      const botMsg = log.lastElementChild;
      botMsg.textContent = reply;
      log.scrollTop = log.scrollHeight;
    }, 250);
    input.value = '';
    log.scrollTop = log.scrollHeight;
  };
  view.querySelector('#t-send').addEventListener('click', () => send(input.value));
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(input.value); });
  view.querySelectorAll('.chip-btn').forEach(b => b.addEventListener('click', () => send(b.textContent)));
}

function viewTeacher() {
  const st = store.state;
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 教师端</div>
    <h1>教师端</h1>
    <p class="muted">演示版（数据保存在本机）：创建班级、布置单元与实验任务、打印作业单。多人同步与真实班级数据需要后端支持，属于后续路线。</p>
    <div class="grid g2" style="margin-top:20px">
      <div class="card">
        <h3>班级管理</h3>
        <div class="exp-actions">
          <input id="cls-name" placeholder="班级名称" style="flex:1;background:var(--bg2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 12px">
          <button class="btn" id="cls-add">创建班级</button>
        </div>
        ${st.classes.length ? st.classes.map(c => `
          <div class="panel" style="margin:10px 0">
            <b>${c.name}</b>（${c.students.length} 名学生）
            <div class="exp-actions" style="margin:8px 0">
              <input class="stu-name" data-c="${c.id}" placeholder="学生姓名" style="flex:1;background:var(--bg2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:6px 10px;font-size:13px">
              <button class="btn small" data-addstu="${c.id}">添加</button>
            </div>
            <p class="muted" style="font-size:13px">${c.students.join('、') || '暂无学生'}</p>
          </div>`).join('') : '<p class="muted" style="margin-top:10px">还没有班级。</p>'}
      </div>
      <div class="card">
        <h3>布置任务</h3>
        <div class="ctl"><label>任务标题</label><input id="as-title" placeholder="例如：第二周 酸碱滴定" style="width:100%;background:var(--bg2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 12px"></div>
        <div class="ctl"><label>选择内容（多选）</label>
          <select id="as-item" style="width:100%;background:var(--bg2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px;font-size:14px">
            ${ALL_UNITS.map(u => `<option value="unit:${u.id}">课程：${u.title}</option>`).join('')}
            ${Object.values(EXPERIMENTS).map(e => `<option value="exp:${e.id}">实验：${e.title}</option>`).join('')}
          </select></div>
        <div class="ctl"><label>要求说明</label><textarea id="as-note" rows="3" style="width:100%;background:var(--bg2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 12px;font-family:var(--sans)" placeholder="例如：完成滴定实验3次，误差<2%，记录到实验本"></textarea></div>
        <div class="ctl"><label>截止日期</label><input type="date" id="as-due" style="width:100%;background:var(--bg2);color:var(--ink);border:1px solid var(--line);border-radius:8px;padding:8px 10px"></div>
        <button class="btn primary" id="as-add">添加到任务列表</button>
      </div>
    </div>
    <h2 style="margin:26px 0 10px">任务列表</h2>
    ${st.assignments.length ? st.assignments.map(a => `
      <div class="panel">
        <b>${a.title}</b> <span class="badge">${a.created} 发布</span> ${a.due ? `<span class="badge red">截止 ${a.due}</span>` : ''}
        <p class="muted" style="font-size:14px;margin:6px 0">${a.items.map(i => i.startsWith('unit:') ? '课程·' + (unitById(i.slice(5)) || {}).title : '实验·' + (expById(i.slice(4)) || {}).title).join('；')}</p>
        ${a.note ? `<p style="font-size:14px">要求：${a.note}</p>` : ''}
        <div class="exp-actions">
          <button class="btn small" data-printas="${a.id}">打印作业单</button>
          <button class="btn small danger" data-delas="${a.id}">删除</button>
        </div>
      </div>`).join('') : '<p class="muted">暂无任务。用右侧表单布置第一个任务。</p>'}
    <div class="panel gold">
      <h3>教学建议</h3>
      <p><b>中学课堂</b>：建议顺序 A1→B2→B3，每单元 1 课时理论 + 1 次虚拟实验（滴定/速率最受欢迎），课后测验自动记分。</p>
      <p><b>大学课堂</b>：C1-C3 配合量热与速率实验做"数据-理论对照"作业；报告用实验本导出。</p>
      <p><b>兴趣班/社团</b>：从时间轴+符号馆开场，用 d5 综合课题收尾，颁发"炼金术士证书"。</p>
    </div>`;

  view.querySelector('#cls-add').addEventListener('click', () => {
    const name = view.querySelector('#cls-name').value.trim();
    if (!name) return toast('请输入班级名称');
    store.addClass(name); toast('班级已创建'); render();
  });
  view.querySelectorAll('[data-addstu]').forEach(btn => btn.addEventListener('click', () => {
    const input = view.querySelector(`.stu-name[data-c="${btn.dataset.addstu}"]`);
    if (!input.value.trim()) return toast('请输入学生姓名');
    store.addStudent(btn.dataset.addstu, input.value.trim());
    toast('已添加学生'); render();
  }));
  const items = [];
  view.querySelector('#as-add').addEventListener('click', () => {
    const title = view.querySelector('#as-title').value.trim();
    if (!title) return toast('请输入任务标题');
    const item = view.querySelector('#as-item').value;
    if (!items.includes(item)) items.push(item);
    store.addAssignment({ title, items: [...items], due: view.querySelector('#as-due').value, note: view.querySelector('#as-note').value.trim() });
    items.length = 0;
    toast('任务已布置'); render();
  });
  view.querySelectorAll('[data-delas]').forEach(btn => btn.addEventListener('click', () => {
    store.removeAssignment(btn.dataset.delas); render();
  }));
  view.querySelectorAll('[data-printas]').forEach(btn => btn.addEventListener('click', () => {
    const a = st.assignments.find(x => x.id === btn.dataset.printas);
    if (!a) return;
    const rows = a.items.map(i => {
      const o = i.startsWith('unit:') ? unitById(i.slice(5)) : expById(i.slice(4));
      return '<tr><td>' + (i.startsWith('unit:') ? '课程' : '实验') + '</td><td>' + o.title + '</td><td>' + (o.subtitle || o.oneLine) + '</td><td>完成 □ / 测验 ___ 分</td></tr>';
    }).join('');
    printHtml('作业单：' + a.title,
      '<p>发布：' + a.created + (a.due ? '　截止：' + a.due : '') + '</p>' +
      (a.note ? '<p>要求：' + a.note + '</p>' : '') +
      '<table><thead><tr><th>类型</th><th>标题</th><th>内容</th><th>完成情况</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p style="margin-top:14px">姓名：__________　班级：__________　日期：__________</p>');
  }));
}

/* ---------- v2: 图鉴 / 闪卡 / 成就 / 搜索 ---------- */

function viewGlossary() {
  const terms = Object.entries(GLOSSARY);
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 炼金图鉴</div>
    <h1>炼金图鉴</h1>
    <p class="muted">三类速查：历史符号、核心术语、实验速查。配合 ${terms.length} 个术语闪卡复习效果更佳。</p>
    <div class="tabbar" id="g-tabs">
      <button data-t="sym" class="on">炼金符号（${SYMBOLS.length}）</button>
      <button data-t="term">核心术语（${terms.length}）</button>
      <button data-t="exp">实验速查（${Object.keys(EXPERIMENTS).length}）</button>
    </div>
    <div id="g-body"></div>`;
  const body = view.querySelector('#g-body');
  const renderSym = () => {
    body.innerHTML = `<div class="sym-grid">
      ${SYMBOLS.map((s, i) => `<div class="sym-card" data-i="${i}">
        <div class="glyph">${s.glyph}</div><div class="nm">${s.name}</div>
        <div class="muted" style="font-size:12px">${s.en}</div>
      </div>`).join('')}</div>`;
    body.querySelectorAll('.sym-card').forEach(card => card.addEventListener('click', () => {
      const s = SYMBOLS[+card.dataset.i];
      openModal(`<h3>${s.glyph.startsWith('<svg') ? '' : '<span style="font-size:34px;margin-right:10px">' + s.glyph + '</span>'}${s.name} · ${s.en}</h3>
        <p><b>含义</b>：${s.meaning}</p><p><b>历史</b>：${s.history}</p><p><b>现代科学</b>：${s.science}</p>
        <p style="margin-top:12px"><a class="btn small" href="#/unit/${s.link}" onclick="document.getElementById('modal-root').innerHTML=''">去相关课程单元 →</a></p>`);
    }));
  };
  const renderTerm = () => {
    body.innerHTML = `<div class="grid g2">${terms.map(([k, g]) => `
      <div class="card"><h3 style="font-size:16px">${g.t}</h3><p>${g.d}</p></div>`).join('')}</div>`;
  };
  const renderExp = () => {
    body.innerHTML = `<div class="grid g2">${Object.values(EXPERIMENTS).map(e => `
      <div class="card"><h3 style="font-size:16px"><a href="#/exp/${e.id}">${e.title}</a></h3>
      <p>${e.oneLine}</p><p>${e.tags.map(t => `<span class="badge">${t}</span>`).join(' ')}</p></div>`).join('')}</div>`;
  };
  const renderers = { sym: renderSym, term: renderTerm, exp: renderExp };
  view.querySelectorAll('#g-tabs button').forEach(btn => btn.addEventListener('click', () => {
    view.querySelectorAll('#g-tabs button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    renderers[btn.dataset.t]();
  }));
  renderSym();
}

function viewFlashcards() {
  const deck = Object.entries(GLOSSARY).map(([k, g]) => ({ k, t: g.t, d: g.d }));
  let i = 0;
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 术语闪卡</div>
    <h1>术语闪卡</h1>
    <p class="muted">点击卡片翻面自查：先回想，再看答案。共 ${deck.length} 个术语；翻过 10 张解锁"温故知新"成就。今日已翻 ${store.dailyOf().flash || 0} 张。</p>
    <div class="flash-wrap">
      <div class="flashcard" id="fc">
        <div class="flashcard-inner">
          <div class="flash-face flash-front"><div class="fw" id="fc-t"></div><div class="muted" style="font-size:13px">点击翻面看解释</div></div>
          <div class="flash-face flash-back" id="fc-d"></div>
        </div>
      </div>
      <div class="flash-nav">
        <button class="btn" id="fc-prev">← 上一张</button>
        <button class="btn" id="fc-flip">翻面</button>
        <button class="btn primary" id="fc-next">下一张 →</button>
      </div>
      <div class="flash-count">已覆盖术语 <b id="fc-seen">${store.flashCount()}</b> / ${deck.length} · 当前第 <b id="fc-i">1</b> / ${deck.length} 张</div>
    </div>`;
  const $ = s => view.querySelector(s);
  const card = $('#fc');
  const show = () => {
    card.classList.remove('flip');
    $('#fc-t').textContent = deck[i].t;
    $('#fc-d').innerHTML = '<b style="color:var(--gold2)">' + deck[i].t + '</b><p style="margin-top:10px">' + deck[i].d + '</p>';
    $('#fc-i').textContent = i + 1;
    $('#fc-seen').textContent = store.flashCount();
  };
  const flip = () => {
    card.classList.toggle('flip');
    if (card.classList.contains('flip')) {
      store.seeFlash(deck[i].k);
      store.bumpDaily('flash');
      if (store.flashCount() >= 10) achieve('flash_ten');
      $('#fc-seen').textContent = store.flashCount();
    }
  };
  card.addEventListener('click', flip);
  $('#fc-flip').addEventListener('click', flip);
  $('#fc-next').addEventListener('click', () => { i = (i + 1) % deck.length; show(); });
  $('#fc-prev').addEventListener('click', () => { i = (i - 1 + deck.length) % deck.length; show(); });
  show();
}

function viewAchievements() {
  const earned = store.state.achievements || {};
  const n = Object.keys(earned).length;
  view.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 成就殿堂</div>
    <h1>成就殿堂</h1>
    <p class="muted">${n} / ${ACHIEVEMENTS.length} 枚徽章已点亮。课程、测验、实验挑战、闪卡复习都会解锁徽章。</p>
    <div class="exp-actions">
      <button class="btn primary" id="ach-cert">🖨 打印炼金术士证书</button>
    </div>
    <div class="ach-grid" style="margin:18px 0">
      ${ACHIEVEMENTS.map(a => `<div class="ach-card ${earned[a.id] ? 'earned' : ''}">
        <div class="ico">${a.icon}</div>
        <div><b>${a.name}</b><span>${a.desc}</span>
        ${earned[a.id] ? `<span style="color:#8fe0c6;font-size:12px">✓ ${new Date(earned[a.id]).toLocaleDateString('zh-CN')} 解锁</span>` : ''}</div>
      </div>`).join('')}
    </div>`;
  view.querySelector('#ach-cert').addEventListener('click', () => {
    const s = stats();
    printHtml('炼金术士证书',
      `<div style="text-align:center;font-family:serif">
        <h1 style="font-size:34px;margin:30px 0 6px">炼金术士证书</h1>
        <p style="letter-spacing:6px">CERTIFICATUM ALCHEMIAE</p>
        <p style="margin:26px 0;font-size:17px">兹证明 <b>________________</b></p>
        <p style="margin:8px 0">已在 Alchemia 炼金术与化学学堂完成修行：</p>
        <p style="margin:8px 0">课程单元 ${s.done} / ${s.total} · 测验 ${s.quizN} 场（平均 ${s.avg} 分） · 实验记录 ${s.expN} 条 · 成就徽章 ${n} / ${ACHIEVEMENTS.length} 枚</p>
        <p style="margin:26px 0">从火种到元素，愿你在虚实的边界上，以科学为炉，以好奇为火。</p>
        <p style="margin-top:40px">导师签章：____________　　日期：____________</p>
      </div>`);
  });
}

function hi(str, q) {
  if (!q) return str;
  const parts = str.toLowerCase().split(q.toLowerCase());
  let out = '', pos = 0;
  parts.forEach((p, idx) => {
    out += str.slice(pos, pos + p.length);
    pos += p.length;
    if (idx < parts.length - 1) {
      out += '<mark>' + str.slice(pos, pos + q.length) + '</mark>';
      pos += q.length;
    }
  });
  return out;
}

function openSearch() {
  const strip = s => (s || '').replace(/<[^>]+>/g, ' ');
  const index = [
    ...ALL_UNITS.map(u => ({ type: '课程', t: u.title, sub: u.subtitle, href: '#/unit/' + u.id, hay: u.title + ' ' + u.subtitle + ' ' + strip(u.principle) })),
    ...Object.entries(GLOSSARY).map(([k, g]) => ({ type: '术语', t: g.t, sub: g.d.slice(0, 80), href: '#/glossary', hay: g.t + ' ' + g.d })),
    ...Object.values(EXPERIMENTS).map(e => ({ type: '实验', t: e.title, sub: e.oneLine, href: '#/exp/' + e.id, hay: e.title + ' ' + e.oneLine + ' ' + e.tags.join(' ') })),
    ...TIMELINE.map(s => ({ type: '历史', t: s.era + ' ' + s.title, sub: strip(s.summary).slice(0, 80), href: '#/timeline', hay: s.title + ' ' + strip(s.summary) + ' ' + strip(s.connection) })),
    ...SYMBOLS.map(s => ({ type: '符号', t: s.name, sub: s.en, href: '#/symbols', hay: s.name + ' ' + s.en + ' ' + strip(s.meaning) }))
  ];
  openModal(`<h3>🔍 全站搜索</h3>
    <input class="search-box" id="s-in" placeholder="搜索课程、术语、实验、历史、符号…" autocomplete="off">
    <div id="s-res"><p class="muted">输入关键词，如"摩尔""滴定""玻义耳"。</p></div>
    <p style="margin-top:10px"><button class="btn small" onclick="document.getElementById('modal-root').innerHTML=''">关闭</button></p>`);
  const input = document.getElementById('s-in');
  const res = document.getElementById('s-res');
  const run = () => {
    const q = input.value.trim();
    if (q.length < 1) { res.innerHTML = '<p class="muted">输入关键词开始搜索。</p>'; return; }
    const hits = index.filter(x => x.hay.toLowerCase().includes(q.toLowerCase())).slice(0, 20);
    res.innerHTML = hits.length ? hits.map(h =>
      `<a class="search-hit" href="${h.href}" onclick="document.getElementById('modal-root').innerHTML=''">
        <span class="st">${h.type}</span><br><b>${hi(h.t, q)}</b>
        ${h.sub ? `<p>${hi(h.sub, q)}</p>` : ''}
      </a>`).join('') : '<p class="muted">没有找到相关内容，换个词试试？</p>';
  };
  input.addEventListener('input', run);
  setTimeout(() => input.focus(), 60);
}

/* ---------- router ---------- */

function render() {
  if (expCleanup) { expCleanup(); expCleanup = null; }
  const hash = location.hash || '#/home';
  setActiveNav(hash);
  view.scrollTop = 0;
  window.scrollTo(0, 0);
  if (hash.startsWith('#/timeline')) viewTimeline();
  else if (hash.startsWith('#/symbols')) viewSymbols();
  else if (hash.startsWith('#/glossary')) viewGlossary();
  else if (hash.startsWith('#/flashcards')) viewFlashcards();
  else if (hash.startsWith('#/achievements')) viewAchievements();
  else if (hash.startsWith('#/learn')) viewLearn();
  else if (hash.startsWith('#/unit/')) viewUnit(hash.slice(7).split('#')[0]);
  else if (hash.startsWith('#/lab')) viewLab();
  else if (hash.startsWith('#/exp/')) viewExp(hash.slice(6));
  else if (hash.startsWith('#/notebook')) renderNotebook(view);
  else if (hash.startsWith('#/mastery')) viewMastery();
  else if (hash.startsWith('#/tutor')) viewTutor();
  else if (hash.startsWith('#/teacher')) viewTeacher();
  else viewHome();
}

window.addEventListener('hashchange', render);
render();
