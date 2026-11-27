import { QUIZZES } from './quizzes.js';
import { LEVELS, unitLevel } from './curriculum.js';

const PICKS = [
  { unit: 'a1', index: 0, skill: '辨别物理与化学变化' },
  { unit: 'a1', index: 2, skill: '用密度关系做基础计算' },
  { unit: 'a5', index: 1, skill: '判断安全操作' },
  { unit: 'b1', index: 0, skill: '理解元素与原子结构' },
  { unit: 'b2', index: 1, skill: '认识物质的量' },
  { unit: 'b3', index: 0, skill: '理解 pH 与浓度' },
  { unit: 'b5', index: 1, skill: '理解催化剂的作用' },
  { unit: 'c1', index: 3, skill: '区分热力学与动力学' },
  { unit: 'c4', index: 0, skill: '用结构解释分子形状' },
  { unit: 'c5', index: 1, skill: '理解色谱分离原理' },
  { unit: 'd2', index: 1, skill: '运用环境化学指标' },
  { unit: 'd5', index: 1, skill: '判断科学假设' }
];

export const DIAGNOSTIC_QUESTIONS = PICKS.map((pick, i) => ({
  ...QUIZZES[pick.unit][pick.index],
  id: 'diag-' + (i + 1),
  unitId: pick.unit,
  level: unitLevel(pick.unit).id,
  skill: pick.skill
}));

export function scoreDiagnostic(answers) {
  if (!Array.isArray(answers) || answers.length !== DIAGNOSTIC_QUESTIONS.length) {
    throw new Error('诊断答案数量不完整');
  }
  const scores = LEVELS.map(level => ({ level: level.id, correct: 0, total: 0, pct: 0 }));
  let correct = 0;
  DIAGNOSTIC_QUESTIONS.forEach((q, i) => {
    const answer = answers[i];
    if (!Number.isInteger(answer) || answer < 0 || answer >= q.opts.length) {
      throw new Error('诊断答案格式无效');
    }
    const score = scores[q.level];
    score.total++;
    if (answer === q.a) { score.correct++; correct++; }
  });
  scores.forEach(score => { score.pct = Math.round(score.correct / score.total * 100); });

  let recommendedLevel = 0;
  for (let level = 0; level < LEVELS.length - 1; level++) {
    if (scores[level].correct < 2) break;
    recommendedLevel = level + 1;
  }
  return { version: 1, recommendedLevel, correct, total: answers.length, scores, answers: answers.slice() };
}
