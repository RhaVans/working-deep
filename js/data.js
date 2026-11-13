/* data.js — export, import, erase, print. Same file format as the previous
   version, so an old working-deep-notes.json still imports cleanly. */

import { h, store, toast } from './core.js';

export function exportData() {
  const payload = {
    app: 'working-deep',
    version: 2,
    exportedAt: new Date().toISOString(),
    data: store.all(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: 'working-deep-notes.json' });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Exported your entries as JSON.');
}

export async function importData(file) {
  if (!file) return false;
  try {
    const parsed = JSON.parse(await file.text());
    const data = parsed && parsed.data && typeof parsed.data === 'object' ? parsed.data : parsed;
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('shape');
    store.replace(data);
    toast('Imported. Reloading your entries.');
    setTimeout(() => location.reload(), 500);
    return true;
  } catch {
    toast('That file is not a Working Deep export.');
    return false;
  }
}

export function erase() {
  if (!confirm('Erase every entry you have made in this browser? Export first if you want a copy.')) return false;
  store.clear();
  location.reload();
  return true;
}

export const printPage = () => window.print();
