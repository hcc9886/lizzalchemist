// 引擎核心：器材状态机（FSM）+ 实验流程引擎（步骤/红绿灯护栏/操作日志/复盘报告）
// 设计原则：全部配置驱动 —— 状态表、步骤表都是 JSON/对象字面量，引擎只解释配置。

/*
 * createFSM(def, initial, host)
 * def: { 状态名: { enter(host), exit(host), allow:[操作...], to:[下一状态...] } }
 * host: 任意宿主对象（通常是器材实例），原样传给 enter/exit。
 */
export function createFSM(def, initial, host) {
  let cur = initial;
  return {
    get state() { return cur; },
    can(op) { const s = def[cur]; return !s || !s.allow || s.allow.includes(op); },
    to(name) {
      const s = def[cur];
      if (s && s.to && !s.to.includes(name)) return false;
      if (s && s.exit) s.exit(host);
      cur = name;
      if (def[cur] && def[cur].enter) def[cur].enter(host);
      return true;
    }
  };
}

/*
 * createProcedure(cfg)
 * cfg: {
 *   steps: [{
 *     id, text,                    // 步骤 id 与标题
 *     detail,                      // 面板里展示的详细说明（HTML）
 *     allow: [op...],              // 本步允许的操作（不写则不限制）
 *     block: [op...],              // 本步被"红灯"拦截的操作（其余非 allow 为黄灯）
 *     blockMsg,                    // 红灯文案
 *     done(state) -> bool,         // 完成判定（引擎每帧轮询或实验手动 advance）
 *     tips, safety                 // 面板提示与安全要点
 *   }],
 *   guard(op, ctx) -> {level:'red'|'yellow'|'green', msg} | null   // 全局护栏（如未查气密性禁点火）
 * }
 */
export function createProcedure(cfg) {
  let i = 0, finished = false;
  const log = [];
  const stats = { green: 0, yellow: 0, red: 0 };

  function evaluate(op, ctx) {
    const step = cfg.steps[i];
    if (finished) return { level: 'green', msg: '' };
    const res = cfg.guard ? cfg.guard(op, ctx) : null;
    if (res && res.level === 'red') { stats.red++; return res; }
    if (res && res.level === 'yellow') { stats.yellow++; return res; }
    if (step && step.allow && !step.allow.includes(op)) {
      const hard = step.block && step.block.includes(op);
      if (hard) { stats.red++; return { level: 'red', msg: step.blockMsg || '这一步不能这样做！' }; }
      stats.yellow++;
      return { level: 'yellow', msg: '建议先完成当前步骤：<b>' + (step.text || '') + '</b>' };
    }
    stats.green++;
    return { level: 'green', msg: '' };
  }

  return {
    get i() { return i; },
    get step() { return cfg.steps[i]; },
    get steps() { return cfg.steps; },
    get finished() { return finished; },
    get log() { return log; },
    get stats() { return stats; },
    stepById(id) { return cfg.steps.find(s => s.id === id); },
    indexOf(id) { return cfg.steps.findIndex(s => s.id === id); },
    evaluate,
    // 完成判定：done 全部由引擎轮询，通过则自动 advance 并记日志
    tick(state) {
      const s = cfg.steps[i];
      if (!s || finished) return false;
      if (s.done && s.done(state)) {
        log.push({ t: Date.now(), i, op: 'step:' + s.id, level: 'green', msg: '✓ ' + s.text });
        if (i < cfg.steps.length - 1) i++; else finished = true;
        return true;
      }
      return false;
    },
    advance() {
      if (i < cfg.steps.length - 1) { i++; return true; }
      finished = true;
      return false;
    },
    jumpTo(id) { const k = this.indexOf(id); if (k >= 0) { i = k; return true; } return false; },
    logOp(op, level, msg) { log.push({ t: Date.now(), i, op, level, msg }); },
    report() {
      const reds = log.filter(l => l.level === 'red');
      const yellows = log.filter(l => l.level === 'yellow');
      const score = Math.max(0, 100 - reds.length * 20 - yellows.length * 5);
      return { score, reds, yellows, ops: log.length, finished };
    }
  };
}

/* 操作日志 → 复盘 HTML */
export function logReportHTML(proc) {
  const r = proc.report();
  const lvColor = { green: '#2ea882', yellow: '#d4a542', red: '#c65a41' };
  const rows = proc.log.slice(-24).map(l =>
    `<tr><td style="color:${lvColor[l.level] || 'inherit'}">${l.level === 'red' ? '●红' : l.level === 'yellow' ? '●黄' : '●绿'}</td>
     <td>${l.msg || l.op}</td></tr>`).join('');
  return `<h3>复盘报告</h3>
    <p>评分 <b style="color:${r.score >= 90 ? '#2ea882' : r.score >= 70 ? '#d4a542' : '#c65a41'}">${r.score} / 100</b>
    · 操作 ${r.ops} 次 · 红灯拦截 ${r.reds.length} · 黄灯提醒 ${r.yellows.length}</p>
    <p>${r.finished ? '🎉 全流程安全完成！记住三条铁律：<b>先查气密性、试管口略向下、先撤导管后熄灯</b>。' : '实验尚未完成，可以继续操作。'}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">${rows}</table>`;
}
