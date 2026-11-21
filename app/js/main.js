import { loadData } from './data.js';
import { createStore, SEED_EARNED, SEED_COUNTS } from './store.js';
import { renderTracker, renderRoadmap, renderMissables, renderSources } from './views.js';

const params = new URLSearchParams(location.search);
const store = createStore();

if (params.get('seed') === '1') {
  store.applySeed(SEED_EARNED, SEED_COUNTS);
}
if (params.get('shield') === 'off') store.setSpoiler(false);
if (params.get('shield') === 'on') store.setSpoiler(true);

const view = document.getElementById('view');
const tabs = Array.from(document.querySelectorAll('.tabs button'));
const shieldBox = document.getElementById('spoilerShield');
const data = await loadData();

let tab = params.get('tab') || 'tracker';
let openId = params.get('open') ? Number(params.get('open')) : null;
let filter = { kind: 'all', grade: 'all', q: '', hiddenOnly: false, disputedOnly: false, notEarnedOnly: false };

shieldBox.checked = store.spoiler;
shieldBox.addEventListener('change', () => { store.setSpoiler(shieldBox.checked); render(); });

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([store.exportJSON()], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'platinum-leonida-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try { store.importJSON(await file.text()); render(); } catch { alert('That file is not a valid progress export.'); }
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Reset all progress, counts and notes?')) { store.reset(); render(); }
});

tabs.forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; openId = null; render(); }));

document.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if (e.key >= '1' && e.key <= '4') { tab = tabs[Number(e.key) - 1].dataset.tab; openId = null; render(); }
  if (e.key === '/') { e.preventDefault(); const s = document.getElementById('searchBox'); if (s) s.focus(); }
  if (e.key === 's') { store.setSpoiler(!store.spoiler); shieldBox.checked = store.spoiler; render(); }
  if (e.key === 'e') document.getElementById('exportBtn').click();
});

export function goDetail(id) { openId = id; tab = 'tracker'; render(); window.scrollTo({ top: 0 }); }
export function getState() { return { tab, openId, filter, store, data }; }
export function setFilter(next) { filter = { ...filter, ...next }; render(); }

function render() {
  tabs.forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
  shieldBox.checked = store.spoiler;
  const ctx = { data, store, filter, openId, goDetail, setFilter };
  if (tab === 'tracker') renderTracker(view, ctx);
  else if (tab === 'roadmap') renderRoadmap(view, ctx);
  else if (tab === 'missables') renderMissables(view, ctx);
  else renderSources(view, ctx);
}

render();
