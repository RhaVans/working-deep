/* app.js — shell: contents, scroll position, data tools, section mounting. */

import { h, store, toast, reveal } from './core.js';
import { opening } from './intro.js';
import { r01, r02, r03, r04 } from './rules-a.js';
import { r05, r06, r07, r08 } from './rules-b.js';
import { templates } from './templates.js';

const SECTIONS = [
  ['opening', 'The problem', opening],
  ['r01', '01 · Shrink the task', r01],
  ['r02', '02 · Leave a breadcrumb', r02],
  ['r03', '03 · Do not mix modes', r03],
  ['r04', '04 · Build vertical slices', r04],
  ['r05', '05 · Keep a belief log', r05],
  ['r06', '06 · Match challenge to skill', r06],
  ['r07', '07 · Protect your energy', r07],
  ['r08', '08 · Diagnose before you push', r08],
  ['templates', 'Templates A · B · C', templates],
];

const main = document.getElementById('main');
const nav = document.getElementById('toc');

/* contents ------------------------------------------------------------- */

const details = h('details', { class: 'toc__details', open: true },
  h('summary', null, 'Contents'),
  h('ol', null, ...SECTIONS.map(([id, label]) =>
    h('li', null, h('a', { href: `#${id}`, data: { target: id } },
      h('b', null, id === 'opening' ? '—' : id === 'templates' ? 'II' : id.slice(1)),
      label))))
);
nav.append(details);

const links = [...details.querySelectorAll('a')];
// The desktop layout hides the <summary>, so the panel must be open by width —
// including after a resize from a phone viewport. Read the width directly: a
// media query can still report the old value on the first resize event, which
// would leave the panel closed with no visible toggle.
const isWide = () => innerWidth >= 980;
const syncToc = () => { if (isWide()) details.open = true; };
if (!isWide()) details.open = false;
addEventListener('resize', () => { syncToc(); requestAnimationFrame(syncToc); });
links.forEach((a) => a.addEventListener('click', () => {
  if (!isWide()) details.open = false;
}));

/* sections ------------------------------------------------------------- */

for (const [id, , build] of SECTIONS) {
  const node = build();
  main.append(node);
  // Progressive reveals, driven by scroll position, skipped for reduced motion.
  [...node.querySelectorAll('.ch-body > *')].forEach((el, i) => reveal(el, i));
}

/* active section + reading progress ------------------------------------ */

const progressBar = document.querySelector('.progress i');
const byId = new Map(SECTIONS.map(([id]) => [id, document.getElementById(id)]));

const spy = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    const id = e.target.id;
    links.forEach((a) => a.setAttribute('aria-current', String(a.dataset.target === id)));
  }
}, { rootMargin: '-42% 0px -52% 0px' });

byId.forEach((el) => el && spy.observe(el));

let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const ratio = max > 0 ? Math.min(1, Math.max(0, scrollY / max)) : 0;
    document.documentElement.style.setProperty('--read', ratio.toFixed(4));
    ticking = false;
  });
}, { passive: true });

/* data tools ----------------------------------------------------------- */

function download() {
  const payload = {
    app: 'working-deep',
    version: 1,
    exportedAt: new Date().toISOString(),
    data: store.all(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: 'working-deep-notes.json' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Exported your notes as JSON.');
}

const fileInput = document.getElementById('importFile');

document.getElementById('exportBtn').addEventListener('click', download);
document.getElementById('importBtn').addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', async () => {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const data = parsed && parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('shape');
    store.replace(data);
    toast('Imported. Reloading your notes.');
    setTimeout(() => location.reload(), 500);
  } catch {
    toast('That file is not a Working Deep export.');
  } finally {
    fileInput.value = '';
  }
});

document.getElementById('clearBtn').addEventListener('click', () => {
  if (!confirm('Erase every entry you have made in this browser? This cannot be undone.')) return;
  store.clear();
  location.reload();
});

document.getElementById('printBtn').addEventListener('click', () => window.print());

/* offline -------------------------------------------------------------- */

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
