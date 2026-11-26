// 数据完整性校验（Node 环境，仅导入纯数据/实验模块）
import { GLOSSARY } from './js/data/glossary.js';
import { TIMELINE } from './js/data/timeline.js';
import { SYMBOLS } from './js/data/symbols.js';
import { TRACKS, ALL_UNITS, unitById } from './js/data/curriculum.js';
import { QUIZZES } from './js/data/quizzes.js';
import { EXPERIMENTS } from './js/experiments/index.js';

const errors = [];

// 1) 单元 ID 唯一
const ids = ALL_UNITS.map(u => u.id);
if (new Set(ids).size !== ids.length) errors.push('单元 ID 有重复');

// 2) 课程中 data-g 键都必须在术语表中
for (const u of ALL_UNITS) {
  const html = [u.story, u.life, u.principle, u.formula, u.challenge, ...(u.faq || []).map(f => f.a)].join('');
  const re = /data-g="([^"]+)"/g;
  let m;
  while ((m = re.exec(html))) {
    if (!GLOSSARY[m[1]]) errors.push(`${u.id} 引用了缺失术语: ${m[1]}`);
  }
}

// 3) lab.id 必须是存在的实验
for (const u of ALL_UNITS) {
  if (u.lab && u.lab.id && !EXPERIMENTS[u.lab.id]) errors.push(`${u.id} lab.id 不存在: ${u.lab.id}`);
}

// 4) 题库覆盖所有单元
for (const u of ALL_UNITS) {
  if (!QUIZZES[u.id]) errors.push(`${u.id} 缺少测验`);
  else if (QUIZZES[u.id].length !== 4) errors.push(`${u.id} 测验不是 4 题`);
  (QUIZZES[u.id] || []).forEach((q, i) => {
    if (q.a < 0 || q.a >= q.opts.length) errors.push(`${u.id} Q${i + 1} 答案索引越界`);
    if (!q.e) errors.push(`${u.id} Q${i + 1} 缺解析`);
  });
}

// 5) 时间轴与符号的 link
for (const s of TIMELINE) if (!unitById(s.link)) errors.push('时间轴 link 不存在: ' + s.link);
for (const s of SYMBOLS) if (!unitById(s.link)) errors.push('符号 link 不存在: ' + s.link);

// 6) 术语表每个条目有 t 和 d
for (const [k, v] of Object.entries(GLOSSARY)) {
  if (!v.t || !v.d) errors.push('术语表条目不完整: ' + k);
}

// 7) 成就定义
import { ACHIEVEMENTS } from './js/data/achievements.js';
const aid = ACHIEVEMENTS.map(a => a.id);
if (new Set(aid).size !== aid.length) errors.push('成就 ID 有重复');
for (const a of ACHIEVEMENTS) {
  if (!a.icon || !a.name || !a.desc) errors.push('成就条目不完整: ' + a.id);
}

// 8) 全部 13 个实验就位
const expectedExps = ['density', 'solubility', 'titration', 'chromatography', 'gaslaws', 'rate',
  'cell', 'calorimetry', 'molecule', 'ptable', 'combustion', 'distill', 'sandbox'];
for (const id of expectedExps) {
  const e = EXPERIMENTS[id];
  if (!e) { errors.push('缺少实验: ' + id); continue; }
  if (!e.title || !e.oneLine || !Array.isArray(e.safety) || !e.safety.length || typeof e.render !== 'function')
    errors.push('实验字段不完整: ' + id);
}

if (errors.length) {
  console.error('FAIL\n' + errors.join('\n'));
  process.exit(1);
} else {
  console.log('OK: ' + ALL_UNITS.length + ' units, ' + Object.keys(QUIZZES).length + ' quiz sets (' +
    Object.values(QUIZZES).reduce((s, q) => s + q.length, 0) + ' questions), ' +
    Object.keys(EXPERIMENTS).length + ' experiments, ' +
    ACHIEVEMENTS.length + ' achievements, ' +
    TIMELINE.length + ' timeline stages, ' +
    SYMBOLS.length + ' symbols, ' +
    Object.keys(GLOSSARY).length + ' glossary terms');
}
