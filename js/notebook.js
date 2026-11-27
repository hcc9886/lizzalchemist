import { store, printHtml } from './progress.js';

export function renderNotebook(root) {
  const notes = store.state.notebook;
  root.innerHTML = `
    <div class="crumb"><a href="#/home">首页</a> / 实验本</div>
    <h1>虚拟实验本</h1>
    <p class="muted">每次实验的参数与结果都会自动记录在这里。导出 CSV 可导入 Excel；打印可生成实验报告。</p>
    <div class="exp-actions">
      <button class="btn" id="nb-csv">导出 CSV</button>
      <button class="btn" id="nb-print">打印实验报告</button>
      <span class="muted" style="align-self:center">共 ${notes.length} 条记录</span>
    </div>
    ${notes.length === 0 ? '<div class="panel"><p class="muted">实验本还是空的。去<a href="#/lab">虚拟实验室</a>做一次实验，然后点"记录数据到实验本"。</p></div>' :
      `<table class="data"><thead><tr><th>时间</th><th>实验</th><th>参数</th><th>结果</th><th>操作</th></tr></thead><tbody>
      ${notes.map(n => `<tr>
        <td>${new Date(n.ts).toLocaleString('zh-CN')}</td>
        <td><a href="#/exp/${n.exp}">${n.title}</a></td>
        <td>${Object.entries(n.params || {}).map(([k, v]) => `<b>${k}</b>: ${v}`).join('　')}</td>
        <td>${Object.entries(n.results || {}).map(([k, v]) => `<b>${k}</b>: ${v}`).join('　')}</td>
        <td><button class="btn small" data-print="${n.ts}">打印</button> <button class="btn small danger" data-del="${n.ts}">删除</button></td>
      </tr>`).join('')}
      </tbody></table>`}`;

  root.querySelector('#nb-csv')?.addEventListener('click', exportCSV);
  root.querySelector('#nb-print')?.addEventListener('click', () => {
    if (!notes.length) return;
    printHtml('实验报告（全部记录）', notes.map(n => reportHtml(n)).join('<hr>'));
  });
  root.querySelectorAll('[data-del]').forEach(btn => btn.addEventListener('click', () => {
    store.removeNotebookRecord(+btn.dataset.del);
    renderNotebook(root);
  }));
  root.querySelectorAll('[data-print]').forEach(btn => btn.addEventListener('click', () => {
    const n = notes.find(x => x.ts === +btn.dataset.print);
    if (n) printHtml('实验报告：' + n.title, reportHtml(n));
  }));
}

function reportHtml(n) {
  const fmt = o => Object.entries(o || {}).map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join('');
  return `<h3>${n.title}　<span style="font-size:12px;color:#555">${new Date(n.ts).toLocaleString('zh-CN')}</span></h3>
  <h4>实验参数</h4><table><tbody>${fmt(n.params)}</tbody></table>
  <h4>数据与结果</h4><table><tbody>${fmt(n.results)}</tbody></table>`;
}

function exportCSV() {
  const notes = store.state.notebook;
  if (!notes.length) return;
  const esc = s => '"' + String(s).replace(/"/g, '""') + '"';
  const rows = [['时间', '实验', '参数', '结果']];
  notes.forEach(n => {
    rows.push([
      new Date(n.ts).toLocaleString('zh-CN'),
      n.title,
      Object.entries(n.params || {}).map(([k, v]) => k + '=' + v).join('; '),
      Object.entries(n.results || {}).map(([k, v]) => k + '=' + v).join('; ')
    ]);
  });
  const csv = '\uFEFF' + rows.map(r => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'alchemist-实验本-' + new Date().toISOString().slice(0, 10) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
