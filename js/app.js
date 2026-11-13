/* app.js — hash routing between four experiences, the shared sheet, and data. */

import { h, store, closeSheet, progress } from './core.js';
import { exploreView, NODES } from './explore.js';
import { exp01, exp02, exp03, exp04 } from './experiments-a.js';
import { exp05, exp06, exp07, exp08 } from './experiments-b.js';
import { benchView } from './workbench.js';
import { progressView } from './progress.js';
import { exportData, importData, erase, printPage } from './data.js';

const SIMS = { '01': exp01, '02': exp02, '03': exp03, '04': exp04, '05': exp05, '06': exp06, '07': exp07, '08': exp08 };
const SHORT = {
  '01': 'size', '02': 'continuity', '03': 'modes', '04': 'slices',
  '05': 'belief', '06': 'flow', '07': 'attention', '08': 'diagnosis',
};
const TOOL_NAME = { a: 'daily workflow', b: 'project kickoff', c: 'research workflow' };

const viewEl = document.getElementById('view');
const brandSub = document.getElementById('brandSub');

let mounted = null;

function rail(active) {
  const p = progress();
  return h('div', { class: 'exp', style: { paddingBottom: '0' } },
    h('nav', { class: 'rail', 'aria-label': 'Experiments' },
      ...Object.keys(SIMS).map((id) => h('a', {
        href: `#sim/${id}`,
        'aria-current': String(id === active),
        class: p.tried.includes(id) ? 'is-done' : '',
      }, h('b', null, id), h('small', null, SHORT[id])))));
}

function route() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, '')) || 'explore';
  const [head, tail] = raw.split('/');
  if (head === 'sim') {
    const id = SIMS[tail] ? tail : '01';
    return { kind: 'sim', id, make: () => h('div', null, rail(id), SIMS[id]()) };
  }
  if (head === 'bench') {
    const which = TOOL_NAME[tail] ? tail : 'a';
    return { kind: 'bench', id: which, make: () => benchView(which) };
  }
  if (head === 'progress') return { kind: 'progress', id: '', make: () => progressView() };
  return { kind: 'explore', id: '', make: () => exploreView() };
}

function setNav(kind) {
  document.querySelectorAll('.tab').forEach((a) => {
    a.setAttribute('aria-current', String(a.dataset.nav === kind));
  });
  brandSub.textContent = {
    explore: 'system map',
    sim: 'simulation',
    bench: 'workbench',
    progress: 'progress',
  }[kind] || '';
}

function mount() {
  const r = route();
  if (mounted && mounted._destroy) {
    try { mounted._destroy(); } catch { /* view cleanup must never block routing */ }
  }
  const node = r.make();
  viewEl.replaceChildren(node);
  mounted = node;
  setNav(r.kind);
  viewEl.scrollTop = 0;
  const titles = {
    explore: 'System map',
    sim: `Experiment ${r.id}`,
    bench: `Workbench · ${TOOL_NAME[r.id]}`,
    progress: 'Progress',
  };
  document.title = `${titles[r.kind] || 'Working Deep'} — Working Deep`;
  if (r.kind === 'sim') brandSub.textContent = `experiment ${r.id}`;
}

/* ---------------------------------------------------------------- chrome */

addEventListener('hashchange', () => { closeSheet(); mount(); });

document.getElementById('sheetClose').addEventListener('click', closeSheet);
document.getElementById('scrim').addEventListener('click', closeSheet);
addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSheet(); });

/* ------------------------------------------------------------------ data */

const fileInput = document.getElementById('importFile');

document.getElementById('dataBtn').addEventListener('click', () => {
  import('./core.js').then(({ openSheet, btn }) => {
    openSheet('Your data', () => [
      h('p', null, 'Everything you type lives in this browser. Nothing is sent anywhere.'),
      h('div', { class: 'row' },
        btn('Export JSON', exportData, { small: true }),
        btn('Import JSON', () => fileInput.click(), { ghost: true, small: true }),
        btn('Print', printPage, { ghost: true, small: true })),
      h('p', { class: 'small quiet' }, 'Exports use the same file shape as the previous version, so an old working-deep-notes.json still imports.'),
      h('div', { class: 'divider' }),
      btn('Erase everything', erase, { ghost: true, small: true }),
      h('p', { class: 'small quiet' }, 'Erasing clears this browser only. Export first if you want a copy.'),
    ]);
  });
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files && fileInput.files[0];
  await importData(file);
  fileInput.value = '';
});

/* --------------------------------------------------------------- offline */

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

mount();

// touch: keep the address bar from resizing the stage mid-drag
addEventListener('orientationchange', () => setTimeout(mount, 250));

// expose for the browser checks in the build notes
window.__wd = { store, NODES };
