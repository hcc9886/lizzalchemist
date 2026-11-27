/* 账号与多平台云同步 —— Supabase 零依赖 REST 客户端（无 SDK、无构建步骤）
 *
 * 数据流：progress.js save() → document 'alchemist:saved' → 本模块 5s 防抖推送 progress 表
 * boot()：刷新会话 → 拉云端 → 双向按 updatedAt 新者胜合并；覆盖本地前自动备份到 localStorage（保留最近 3 份）
 * 未配置 / 未登录 / 网络错误全部降级为纯本地模式，不影响任何功能。
 */
import { SUPABASE } from './config.js';

const CFG_KEY = 'alchemist_supabase_cfg_v1';
const SESS_KEY = 'alchemist_supabase_sess_v1';
const TABLE = 'progress';
const PUSH_DELAY = 5000;

let localCfg = null;
try { localCfg = JSON.parse(localStorage.getItem(CFG_KEY) || 'null'); } catch (e) { /* ignore */ }

function cfg() {
  const url = ((localCfg && localCfg.url) || SUPABASE.url || '').trim().replace(/\/+$/, '');
  const key = ((localCfg && localCfg.key) || SUPABASE.key || '').trim();
  return { url, key, ok: !!(url && key) };
}

export const isConfigured = () => cfg().ok;
export const currentCfg = cfg;
export const hasLocalCfg = () => !!localCfg;

export function setCfg(url, key) {
  localCfg = { url: url.trim(), key: key.trim() };
  try { localStorage.setItem(CFG_KEY, JSON.stringify(localCfg)); } catch (e) { /* ignore */ }
  boot();
}

export function clearCfg() {
  localCfg = null;
  localStorage.removeItem(CFG_KEY);
  boot();
}

/* ---- 会话 ---- */

let session = null;
try { session = JSON.parse(localStorage.getItem(SESS_KEY) || 'null'); } catch (e) { /* ignore */ }

function persist() { try { localStorage.setItem(SESS_KEY, JSON.stringify(session)); } catch (e) { /* ignore */ } }
function dropSession() {
  session = null;
  localStorage.removeItem(SESS_KEY);
}

export function me() {
  return session && session.user ? { id: session.user.id, email: session.user.email } : null;
}

async function api(path, opts = {}, _retried) {
  const { method = 'GET', body, extraHeaders, authed = true, keepalive = false } = opts;
  const c = cfg();
  const token = (authed && session && session.access_token) || c.key;
  const res = await fetch(c.url + path, {
    method,
    keepalive,
    headers: Object.assign({
      apikey: c.key,
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json'
    }, extraHeaders || {}),
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (res.status === 401 && session && !_retried && authed) {
    await refreshSession();
    return api(path, opts, true);
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const msg = data && (data.message || data.msg || data.error_description || data.error) || ('HTTP ' + res.status);
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return data;
}

async function refreshSession() {
  if (!session || !session.refresh_token) throw new Error('NO_SESSION');
  const d = await api('/auth/v1/token?grant_type=refresh_token',
    { method: 'POST', authed: false, body: { refresh_token: session.refresh_token } });
  session = d; persist();
}

export async function signUp(email, password) {
  const d = await api('/auth/v1/signup', { method: 'POST', authed: false, body: { email, password } });
  if (d && d.access_token) { session = d; persist(); return { ok: true }; }
  return { ok: true, needsConfirm: true };
}

export async function signIn(email, password) {
  const d = await api('/auth/v1/token?grant_type=password',
    { method: 'POST', authed: false, body: { email, password } });
  session = d; persist();
  return { ok: true };
}

export async function signOut() {
  try { await api('/auth/v1/logout', { method: 'POST', body: {} }); } catch (e) { /* 会话可能已失效 */ }
  dropSession();
  setStatus('guest', '未登录');
}

/* ---- 状态机（驱动顶栏圆点与账号面板文案）---- */

let status = 'off';   // off 未配置 | guest 未登录 | syncing | ok | error
let lastMsg = '';
let lastSyncTs = 0;
let dirty = false;
let quietUntil = 0;
let pushTimer = null;

function setStatus(s, msg) {
  status = s;
  if (msg !== undefined) lastMsg = msg;
  window.dispatchEvent(new CustomEvent('alchemist:sync', { detail: { status, msg: lastMsg } }));
}

export function statusOf() {
  return {
    status, msg: lastMsg, lastSyncTs,
    email: (me() && me().email) || null,
    configured: cfg().ok
  };
}

export function fmtErr(e) {
  const m = (e && e.message) || String(e);
  if (/PGRST205|Could not find the table/i.test(m)) return '云端 progress 表还没创建：请在 Supabase SQL Editor 执行账号面板里的建表 SQL';
  if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return '网络不可达：检查网络或 Supabase 项目是否暂停';
  if (/Invalid login credentials/i.test(m)) return '邮箱或密码不对';
  if (/Email not confirmed/i.test(m)) return '请先到邮箱点确认链接，再回来登录';
  if (/already registered|already exists/i.test(m)) return '该邮箱已注册过，请直接登录';
  if (/signups not allowed/i.test(m)) return '该项目已关闭注册';
  if (/at least 6 characters/i.test(m)) return '密码至少 6 位';
  if (/NO_SESSION/.test(m)) return '请先登录';
  return m;
}

/* ---- 数据合并 ---- */

let hooks = null;
export function bindSync(h) { hooks = h; }

function pullRemote() {
  const uid = me().id;
  return api(`/rest/v1/${TABLE}?select=data,updated_at&user_id=eq.${uid}&limit=1`)
    .then(rows => (rows && rows[0]) || null);
}

async function pushRemote(data, keepalive) {
  const uid = me().id;
  await api(`/rest/v1/${TABLE}?on_conflict=user_id`, {
    method: 'POST',
    keepalive: !!keepalive,
    extraHeaders: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { user_id: uid, data, updated_at: new Date(data.updatedAt || Date.now()).toISOString() }
  });
}

function restoreLocal(data, ts) {
  if (!data || typeof data !== 'object') throw new Error('云端数据格式异常');
  try {
    localStorage.setItem('alchemist_backup_' + Date.now(), JSON.stringify(hooks.snapshot()));
    const bks = Object.keys(localStorage).filter(k => k.startsWith('alchemist_backup_')).sort();
    while (bks.length > 3) localStorage.removeItem(bks.shift());
  } catch (e) { /* 备份失败不阻塞恢复 */ }
  quietUntil = Date.now() + 9000; /* 恢复触发的 save() 不再回推云端 */
  hooks.restore(data, ts);
}

/* ---- 事件 → 防抖推送 ---- */

function schedulePush() {
  if (!hooks) return;
  if (Date.now() < quietUntil) return;
  if (!cfg().ok || !me()) return;
  dirty = true;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(flushPush, PUSH_DELAY);
}

async function flushPush(keepalive) {
  if (!hooks || !me() || !cfg().ok) return;
  try {
    await pushRemote(hooks.snapshot(), keepalive);
    dirty = false;
    lastSyncTs = Date.now();
    setStatus('ok', '已自动同步');
  } catch (e) {
    setStatus('error', fmtErr(e));
  }
}

document.addEventListener('alchemist:saved', schedulePush);
window.addEventListener('pagehide', () => {
  if (dirty && cfg().ok && me() && hooks) {
    clearTimeout(pushTimer);
    flushPush(true).catch(() => { /* 卸载期尽力而为 */ });
  }
});

/* ---- 对外动作 ---- */

export async function syncNow() {
  if (!cfg().ok) { setStatus('off', '未配置云同步'); throw new Error('未配置'); }
  if (!me()) { setStatus('guest', '未登录'); throw new Error('请先登录'); }
  setStatus('syncing', '同步中…');
  const local = hooks.snapshot();
  const remote = await pullRemote();
  const rTs = remote ? (Date.parse(remote.updated_at) || 0) : 0;
  const lTs = local.updatedAt || 0;
  if (remote && rTs > lTs) {
    restoreLocal(remote.data, rTs);
    lastSyncTs = Date.now();
    setStatus('ok', '已从云端恢复进度');
    return 'restored';
  }
  await pushRemote(local);
  lastSyncTs = Date.now();
  setStatus('ok', !remote ? '首次上传完成' : (rTs < lTs ? '已上传本机进度' : '已与云端一致'));
  return 'pushed';
}

export async function forcePush() {
  if (!me()) throw new Error('请先登录');
  setStatus('syncing', '上传中…');
  await pushRemote(hooks.snapshot());
  lastSyncTs = Date.now();
  dirty = false;
  setStatus('ok', '本机进度已覆盖云端');
}

export async function forcePull() {
  if (!me()) throw new Error('请先登录');
  setStatus('syncing', '拉取中…');
  const remote = await pullRemote();
  if (!remote) { setStatus('ok', '云端还没有进度记录'); throw new Error('云端还没有进度记录（先在别的设备同步过吗？）'); }
  restoreLocal(remote.data, Date.parse(remote.updated_at) || 0);
  lastSyncTs = Date.now();
  dirty = false;
  setStatus('ok', '云端进度已覆盖本机（原进度已备份）');
}

/* ---- 启动对账 ---- */

export async function boot() {
  if (!cfg().ok) { setStatus('off', '纯本地模式：进度保存在本机浏览器'); return; }
  if (!me()) { setStatus('guest', '未登录'); return; }
  setStatus('syncing', '正在连接…');
  try {
    await refreshSession();
  } catch (e) {
    dropSession();
    setStatus('guest', '登录已过期，请重新登录');
    return;
  }
  try {
    await syncNow();
  } catch (e) {
    setStatus('error', fmtErr(e));
  }
}
