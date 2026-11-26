// 成就徽章定义（图标采用炼金术符号与古典字符）
export const ACHIEVEMENTS = [
  { id: 'first_lesson',  icon: '✦', name: '初窥门径',     desc: '完成第一门课程' },
  { id: 'five_lessons',  icon: '✷', name: '渐入佳境',     desc: '完成 5 门课程' },
  { id: 'ten_lessons',   icon: '✹', name: '熟能生巧',     desc: '完成 10 门课程' },
  { id: 'all_lessons',   icon: '☉', name: '学贯古今',     desc: '完成全部 23 门课程' },
  { id: 'first_quiz',    icon: '⚖', name: '初试锋芒',     desc: '完成第一次单元测验' },
  { id: 'quiz_ace',      icon: '☊', name: '满分答卷',     desc: '任一测验拿到 100 分' },
  { id: 'quiz_five',     icon: '☿', name: '题海拾贝',     desc: '完成 5 次单元测验' },
  { id: 'first_exp',     icon: '⚗', name: '初入实验室',   desc: '记录第一条实验数据' },
  { id: 'exp_ten',       icon: '☲', name: '实验十记',     desc: '累计 10 条实验记录' },
  { id: 'exp_all',       icon: '☵', name: '万物皆可测',   desc: '打开全部 14 个虚拟实验' },
  { id: 'flash_ten',     icon: '☴', name: '温故知新',     desc: '闪卡复习 10 个术语' },
  { id: 'density_float', icon: '♁', name: '浮沉之道',     desc: '完成密度实验挑战：控制物体的沉、浮与悬浮' },
  { id: 'sol_cool',      icon: '✶', name: '结晶大师',     desc: '完成溶解与结晶挑战：冷却析出晶体并记录产率' },
  { id: 'titr_sharp',    icon: '⚜', name: '滴定高手',     desc: '滴定终点体积误差小于 0.2 mL' },
  { id: 'gas_boyle',     icon: '☍', name: '波义耳的签名', desc: '验证玻意耳定律：PV 乘积偏差 < 3%' },
  { id: 'rate_catalyst', icon: '☿', name: '催化洞察',     desc: '完成催化剂前后的速率对比' },
  { id: 'cell_volt',     icon: '⊹', name: '电化学家',     desc: '点亮灯泡并找到电压最高的电极组合' },
  { id: 'thermo_cool',   icon: '♨', name: '冷热之间',     desc: '记录吸热与放热各一种盐的 ΔH' },
  { id: 'chroma_split',  icon: '❖', name: '分离艺术家',   desc: '纸上色谱分离出全部色素带' },
  { id: 'molecule_master', icon: '❊', name: '分子建筑师', desc: '搭出 NH₃ 三角锥结构' },
  { id: 'ptable_hunter', icon: '❂', name: '元素猎人',     desc: '速找元素小游戏 5/5 全对' },
  { id: 'flame_blue',    icon: '❃', name: '蓝色火焰',     desc: '调出完全燃烧的蓝色火焰' },
  { id: 'distill_pure',  icon: '☼', name: '蒸馏大师',     desc: '馏出液乙醇纯度 ≥ 85%' },
  { id: 'sandbox_first', icon: '☪', name: '混合初体验',   desc: '在沙盒混合台完成 3 种不同反应' },
  { id: 'o2_master',     icon: '✺', name: '制氧大师',     desc: '在分层工作台安全完成高锰酸钾制氧气全流程（气密性→装药→加热→收集→验满→先撤导管后熄灯）' },
  { id: 'safety_perfect', icon: '✵', name: '零事故安全员', desc: '制氧气实验全程零红灯拦截完成' }
];

export function achById(id) {
  return ACHIEVEMENTS.find(a => a.id === id) || null;
}
