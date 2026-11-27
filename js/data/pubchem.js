// PubChem PUG-REST 回填：为 InChIKey 为 null 的化学品补全 InChIKey / SMILES / 分子量。
// 本地数据优先生效；网络失败静默降级（教学内容不依赖网络）。结果缓存到 localStorage。
const CACHE_KEY = 'alchemia_pubchem_v1';

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch (e) { return {}; }
}
function saveCache(c) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) { /* full */ }
}

const PUG = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound';

async function fetchProps(chem) {
  const props = 'InChIKey,SMILES,MolecularWeight';
  const urls = [
    `${PUG}/xref/RegistryNumber/${encodeURIComponent(chem.cas)}/property/${props}/JSON`,
    `${PUG}/name/${encodeURIComponent(chem.en)}/property/${props}/JSON`
  ];
  for (const url of urls) {
    if (!chem.cas && url.includes('RegistryNumber')) continue;
    try {
      const r = await fetch(url);
      if (!r.ok) continue;
      const j = await r.json();
      const p = j.PropertyTable && j.PropertyTable.Properties && j.PropertyTable.Properties[0];
      if (p && p.InChIKey) return p;
    } catch (e) { /* offline / CORS */ }
  }
  return null;
}

/* 单个化学品补全：已填 InChIKey → 直接完成；有缓存 → 应用；否则网络获取 */
export async function hydrateChem(chem) {
  if (!chem) return 'local';
  if (chem.inchikey) return 'local';
  const cache = loadCache();
  const hit = cache[chem.id];
  if (hit) {
    chem.inchikey = hit.inchikey; chem.smiles = chem.smiles || hit.smiles;
    chem.mw = chem.mw || hit.mw; chem._pcCid = hit.cid;
    return 'cache';
  }
  const p = await fetchProps(chem);
  if (p) {
    chem.inchikey = p.InChIKey;
    chem.smiles = chem.smiles || p.SMILES || null;
    chem.mw = chem.mw || (p.MolecularWeight ? +p.MolecularWeight : null);
    chem._pcCid = p.CID || null;
    cache[chem.id] = { inchikey: p.InChIKey, smiles: p.SMILES || null, mw: chem.mw, cid: chem._pcCid, ts: Date.now() };
    saveCache(cache);
    window.dispatchEvent(new CustomEvent('alchemia:chem', { detail: chem.id }));
    return 'fetched';
  }
  return 'offline';
}

/* 批量预取（错峰 220ms，PubChem 限速 5 req/s）；guard 防重复启动 */
let running = false;
export async function bulkHydrate(chems) {
  if (running) return;
  running = true;
  const todo = Object.values(chems).filter(c => !c.inchikey && !loadCache()[c.id]);
  for (const c of todo) {
    await hydrateChem(c);
    await new Promise(r => setTimeout(r, 220));
  }
  running = false;
}

export function pubchemStatus(chem) {
  if (chem.inchikey && chem._pcSrc !== undefined) return chem._pcSrc;
  if (chem.inchikey) return 'local';
  return 'pending';
}
