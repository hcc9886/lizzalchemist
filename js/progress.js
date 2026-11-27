const KEY = 'alchemist_state_v1';
try { // 品牌改名迁移：旧 alchemia 存档搬到新键
  const old = localStorage.getItem('alchemia_state_v1');
  if (old && !localStorage.getItem(KEY)) localStorage.setItem(KEY, old);
} catch (e) { /* ignore */ }

const DEFAULT = {
  persona: null,            // 'zero' | 'middle' | 'college' | 'adult' | 'teacher'
  diagnostic: null,         // {version, recommendedLevel, correct, total, scores, ts}
  lessonsDone: {},          // unitId -> true
  quiz: {},                 // unitId -> {best, ts}
  notebook: [],             // [{ts, exp, title, params, results}]
  assignments: [],          // [{id, title, items, due, note, created}]
  classes: [],              // [{id, name, students: []}]
  visited: {},              // unitId -> true (started)
  achievements: {},         // achId -> ts
  expsVisited: {},          // expId -> true
  flashSeen: {},            // glossKey -> ts
  codexSeen: {},            // 'app:test_tube' | 'chem:nacl' -> ts（图鉴解锁）
  practiceSessions: 0,      // 练习场次
  daily: {}                 // 'Y-M-D' -> {lesson, exp, flash}
};

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT);
    return Object.assign(structuredClone(DEFAULT), JSON.parse(raw));
  } catch (e) {
    return structuredClone(DEFAULT);
  }
}

export const store = {
  state: load(),

  save() {
    try {
      this.state.updatedAt = Date.now();
      localStorage.setItem(KEY, JSON.stringify(this.state));
    } catch (e) { /* storage full */ }
    document.dispatchEvent(new CustomEvent('alchemist:saved'));
  },

  setPersona(p) { this.state.persona = p; this.save(); },

  setDiagnostic(result) {
    this.state.diagnostic = Object.assign({ ts: Date.now() }, result);
    this.save();
  },

  visit(id) { this.state.visited[id] = true; this.save(); },
  isVisited(id) { return !!this.state.visited[id]; },

  markDone(id) { this.state.lessonsDone[id] = true; this.save(); },
  unmarkDone(id) { delete this.state.lessonsDone[id]; this.save(); },
  isDone(id) { return !!this.state.lessonsDone[id]; },

  setQuiz(unit, score, total) {
    const pct = Math.round((score / total) * 100);
    const cur = this.state.quiz[unit];
    if (!cur || pct > cur.best) {
      this.state.quiz[unit] = { best: pct, score, total, ts: Date.now() };
      this.save();
    }
  },
  quizOf(unit) { return this.state.quiz[unit] || null; },

  addNotebookRecord(rec) {
    this.state.notebook.unshift(Object.assign({ ts: Date.now() }, rec));
    this.save();
  },
  removeNotebookRecord(ts) {
    this.state.notebook = this.state.notebook.filter(r => r.ts !== ts);
    this.save();
  },

  addAssignment(a) {
    a.id = 'a' + Date.now();
    a.created = new Date().toLocaleDateString('zh-CN');
    this.state.assignments.unshift(a);
    this.save();
  },
  removeAssignment(id) {
    this.state.assignments = this.state.assignments.filter(x => x.id !== id);
    this.save();
  },

  addClass(name) {
    const c = { id: 'c' + Date.now(), name, students: [] };
    this.state.classes.push(c);
    this.save();
    return c;
  },
  addStudent(classId, name) {
    const c = this.state.classes.find(c => c.id === classId);
    if (c) { c.students.push(name); this.save(); }
  },

  /* ---- v2: 成就 / 实验访问 / 闪卡 / 每日任务 ---- */

  setAchievement(id) {
    if (this.state.achievements[id]) return false;
    this.state.achievements[id] = Date.now();
    this.save();
    return true;
  },

  visitExp(id) {
    this.state.expsVisited[id] = true;
    this.save();
  },
  expVisitedCount() { return Object.keys(this.state.expsVisited).length; },

  seeFlash(key) {
    if (!this.state.flashSeen[key]) {
      this.state.flashSeen[key] = Date.now();
      this.save();
    }
  },
  flashCount() { return Object.keys(this.state.flashSeen).length; },

  seeCodex(key) {
    if (!this.state.codexSeen[key]) {
      this.state.codexSeen[key] = Date.now();
      this.save();
    }
  },
  codexCount() { return Object.keys(this.state.codexSeen).length; },

  incPractice() {
    this.state.practiceSessions = (this.state.practiceSessions || 0) + 1;
    this.save();
    return this.state.practiceSessions;
  },

  dailyKey() {
    const d = new Date();
    return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  },
  bumpDaily(kind) {
    const key = this.dailyKey();
    const o = this.state.daily[key] || (this.state.daily[key] = {});
    o[kind] = (o[kind] || 0) + 1;
    this.save();
    return o;
  },
  dailyOf() { return this.state.daily[this.dailyKey()] || {}; }
};

/* ---- small UI helpers shared across views ---- */

export function toast(msg) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => el.remove(), 2600);
}

export function openModal(html) {
  closeModal();
  const root = document.getElementById('modal-root');
  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = '<div class="modal">' + html + '</div>';
  mask.addEventListener('click', e => { if (e.target === mask) closeModal(); });
  root.appendChild(mask);
  return mask;
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}

export function printHtml(title, bodyHtml) {
  const area = document.createElement('div');
  area.id = 'print-area';
  area.innerHTML = '<h2 style="font-family:serif">' + title + '</h2>' + bodyHtml;
  document.body.appendChild(area);
  window.print();
  setTimeout(() => area.remove(), 500);
}
