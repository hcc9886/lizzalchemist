// 数据完整性校验（Node 环境，仅导入纯数据/实验模块）
import { GLOSSARY } from './js/data/glossary.js';
import { TIMELINE } from './js/data/timeline.js';
import { SYMBOLS } from './js/data/symbols.js';
import { TRACKS, ALL_UNITS, LEVELS, unitById, unitLevel } from './js/data/curriculum.js';
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

// 8) 全部 14 个实验就位
const expectedExps = ['density', 'solubility', 'titration', 'chromatography', 'gaslaws', 'rate',
  'cell', 'calorimetry', 'molecule', 'ptable', 'combustion', 'distill', 'sandbox', 'o2lab'];
for (const id of expectedExps) {
  const e = EXPERIMENTS[id];
  if (!e) { errors.push('缺少实验: ' + id); continue; }
  if (!e.title || !e.oneLine || !Array.isArray(e.safety) || !e.safety.length || typeof e.render !== 'function')
    errors.push('实验字段不完整: ' + id);
}

// 9) 器材库（v3 配置驱动）
import { APPARATUS_INDEX, APPARATUS_TREE, APPARATUS_COUNT } from './js/data/apparatus.js';
const aIds = Object.keys(APPARATUS_INDEX);
if (new Set(aIds).size !== aIds.length) errors.push('器材 SKU ID 有重复');
for (const d of Object.values(APPARATUS_INDEX)) {
  const def = d.def;
  if (!def.name || !def.kind) errors.push('器材定义不完整: ' + d.id);
  for (const itf of (def.interfaces || [])) {
    if (!itf.id || !itf.type) errors.push('器材接口不完整: ' + d.id + '/' + itf.id);
  }
  for (const n of (def.allowed_neighbors || [])) {
    if (n !== '*' && !n.endsWith('*') && !APPARATUS_INDEX[n]) errors.push('器材邻接规则指向不存在的器材: ' + d.id + ' -> ' + n);
  }
}
// 分类树里引用的器材必须存在
for (const [k1, v1] of Object.entries(APPARATUS_TREE)) {
  for (const [k2, v2] of Object.entries(v1.children)) {
    const names = Array.isArray(v2.items) ? v2.items : Object.keys(v2.items || {});
    names.forEach(nm => { if (!APPARATUS_INDEX[nm]) errors.push(`分类树 ${k1}/${k2} 引用不存在器材: ${nm}`); });
  }
}

// 10) 化学品库（v3 详情页 schema）
import { CHEMICALS, CHEM_COUNT } from './js/data/chemicals.js';
const cIds = Object.keys(CHEMICALS);
if (new Set(cIds).size !== cIds.length) errors.push('化学品 ID 有重复');
if (cIds.length < 50) errors.push('化学品数量不足 50 种: ' + cIds.length);
for (const [k, v] of Object.entries(CHEMICALS)) {
  if (!v.name || !v.en || !v.formula) errors.push('化学品字段不完整: ' + k);
  if (v.ghs && (!Array.isArray(v.ghs.pictos) || !Array.isArray(v.ghs.h) || !Array.isArray(v.ghs.p)))
    errors.push('化学品 GHS 结构错误: ' + k);
  for (const r of (v.reactions || [])) if (!r.eq) errors.push('化学品反应缺方程式: ' + k);
}

// 11) 练习系统（辨识/纠错/定量）
import { makeQuiz5, ERROR_BANK, identifyApparatus, identifyChem, quantQuiz } from './js/data/practice.js';
for (const [i, q] of ERROR_BANK.entries()) {
  if (!q.q || !Array.isArray(q.opts) || q.opts.length !== 4 || !q.why) errors.push(`纠错题库第 ${i + 1} 题结构不完整`);
  if (!(q.answer >= 0 && q.answer <= 3)) errors.push(`纠错题库第 ${i + 1} 题答案索引越界`);
}
for (const mode of ['mix', '识别', '纠错', '定量']) {
  const qs = makeQuiz5(mode);
  if (qs.length !== 5) errors.push(`练习模式 ${mode} 不是 5 题`);
  qs.forEach((q, i) => {
    if (!q.q || !Array.isArray(q.opts) || q.opts.length !== 4 || !q.why) errors.push(`练习 ${mode} 第 ${i + 1} 题结构不完整`);
    if (!(q.answer >= 0 && q.answer <= 3)) errors.push(`练习 ${mode} 第 ${i + 1} 题答案索引越界`);
    if (q.opts.some(o => o === undefined || o === null || o === '')) errors.push(`练习 ${mode} 第 ${i + 1} 题有空选项`);
  });
}
// 生成器抽查：正确答案文本必须出现在选项里
for (const g of [identifyApparatus, identifyChem, quantQuiz]) {
  for (let t = 0; t < 20; t++) {
    const q = g();
    if (!q.opts[q.answer].trim()) errors.push('生成器答案选项为空: ' + q.q.slice(0, 12));
  }
}

// 12) L0–L3 分层与入门诊断
import { DIAGNOSTIC_QUESTIONS, scoreDiagnostic } from './js/data/diagnostic.js';
if (LEVELS.length !== 4 || LEVELS.some((l, i) => l.id !== i || !l.code || !l.name || !l.desc)) errors.push('课程层级定义不完整');
const levelIds = LEVELS.flatMap(l => l.unitIds);
if (new Set(levelIds).size !== levelIds.length) errors.push('课程单元被重复分配到多个层级');
if (levelIds.length !== ALL_UNITS.length || ALL_UNITS.some(u => !levelIds.includes(u.id))) errors.push('课程层级未覆盖全部单元');
for (const l of LEVELS) {
  if (!l.unitIds.length) errors.push('课程层级没有单元: ' + l.code);
  for (const id of l.unitIds) {
    if (!unitById(id)) errors.push('课程层级引用不存在单元: ' + l.code + '/' + id);
    else if (unitLevel(id).id !== l.id) errors.push('课程层级归属错误: ' + id);
  }
}
if (DIAGNOSTIC_QUESTIONS.length !== 12) errors.push('入门诊断不是 12 题');
if (new Set(DIAGNOSTIC_QUESTIONS.map(q => q.id)).size !== DIAGNOSTIC_QUESTIONS.length) errors.push('诊断题 ID 有重复');
for (const l of LEVELS) {
  const qs = DIAGNOSTIC_QUESTIONS.filter(q => q.level === l.id);
  if (qs.length !== 3) errors.push(`${l.code} 诊断题不是 3 题`);
}
for (const [i, q] of DIAGNOSTIC_QUESTIONS.entries()) {
  if (!q.q || !Array.isArray(q.opts) || q.opts.length !== 4 || !q.e || !q.skill) errors.push(`诊断第 ${i + 1} 题结构不完整`);
  if (!(q.a >= 0 && q.a < q.opts.length)) errors.push(`诊断第 ${i + 1} 题答案索引越界`);
  if (q.opts.some(o => o === undefined || o === null || o === '')) errors.push(`诊断第 ${i + 1} 题有空选项`);
  const ul = unitLevel(q.unitId);
  if (!ul || ul.id !== q.level) errors.push(`诊断第 ${i + 1} 题层级归属错误`);
  const source = QUIZZES[q.unitId] && QUIZZES[q.unitId].find(x => x.q === q.q);
  if (!source || source.a !== q.a || source.e !== q.e || JSON.stringify(source.opts) !== JSON.stringify(q.opts)) errors.push(`诊断第 ${i + 1} 题与课程题库不一致`);
}
const rightAnswers = DIAGNOSTIC_QUESTIONS.map(q => q.a);
const wrongAnswers = DIAGNOSTIC_QUESTIONS.map(q => (q.a + 1) % q.opts.length);
if (scoreDiagnostic(rightAnswers).recommendedLevel !== 3) errors.push('全对诊断未推荐 L3');
if (scoreDiagnostic(wrongAnswers).recommendedLevel !== 0) errors.push('全错诊断未推荐 L0');
for (let target = 1; target <= 3; target++) {
  const answers = wrongAnswers.slice();
  for (let level = 0; level < target; level++) {
    DIAGNOSTIC_QUESTIONS.forEach((q, i) => { if (q.level === level && answers.filter((_, j) => DIAGNOSTIC_QUESTIONS[j].level === level && answers[j] === DIAGNOSTIC_QUESTIONS[j].a).length < 2) answers[i] = q.a; });
  }
  if (scoreDiagnostic(answers).recommendedLevel !== target) errors.push(`诊断门槛推荐错误: 应为 L${target}`);
}
try { scoreDiagnostic(rightAnswers.slice(1)); errors.push('诊断接受了不完整答案'); } catch (e) { /* expected */ }
try { scoreDiagnostic(Array(DIAGNOSTIC_QUESTIONS.length).fill(null)); errors.push('诊断接受了空答案'); } catch (e) { /* expected */ }

if (errors.length) {
  console.error('FAIL\n' + errors.join('\n'));
  process.exit(1);
} else {
  console.log('OK: ' + ALL_UNITS.length + ' units, ' + Object.keys(QUIZZES).length + ' quiz sets (' +
    Object.values(QUIZZES).reduce((s, q) => s + q.length, 0) + ' questions), ' +
    Object.keys(EXPERIMENTS).length + ' experiments, ' +
    ACHIEVEMENTS.length + ' achievements, ' +
    APPARATUS_COUNT + ' apparatus SKUs, ' +
    CHEM_COUNT + ' chemicals, ' +
    TIMELINE.length + ' timeline stages, ' +
    SYMBOLS.length + ' symbols, ' +
    Object.keys(GLOSSARY).length + ' glossary terms, ' +
    LEVELS.length + ' levels, ' +
    DIAGNOSTIC_QUESTIONS.length + ' diagnostic questions');
}
