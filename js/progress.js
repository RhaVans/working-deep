/* progress.js — what has been explored, tried and finished. Read-only, local. */

import { h, progress, store, btn, openSheet, tagEl } from './core.js';
import { NODES } from './explore.js';

const EXERCISES = [
  ['01', 'Shrink the task', 'Take one project to a next action and test it against the three checks.'],
  ['02', 'Leave a breadcrumb', 'Fill NEXT, STATE, OPEN and STOP for a real session.'],
  ['03', 'Do not mix modes', 'Rebuild a day so the switches drop to two.'],
  ['04', 'Build vertical slices', 'Reach an end-to-end feature in four steps instead of sixteen.'],
  ['05', 'Keep a belief log', 'Add sources until the pointer crosses your stop rule.'],
  ['06', 'Match challenge to skill', 'Move the point into the corridor, then name the adaptation.'],
  ['07', 'Protect your energy', 'Park every interruption and hold the block to its shape.'],
  ['08', 'Diagnose before you push', 'Choose a condition and walk the ladder from the cheapest rung.'],
];

const TOOLS = [
  ['a', 'Daily workflow', 'A timeline of blocks with modes, next actions and a parking lot.'],
  ['b', 'Project kickoff', 'Scope, components, trust boundaries and STRIDE threats on a board.'],
  ['c', 'Research workflow', 'A question tree, evidence and a stop rule.'],
];

const ENTRIES = [
  ['templateA', 'day'],
  ['templateB', 'project'],
  ['templateC', 'research'],
];

export function progressView() {
  const p = progress();
  const total = EXERCISES.length + TOOLS.length + NODES.length;
  const done = p.done.length + p.tried.length * 0 + p.explored.length;
  const pct = Math.round((Math.min(total, done) / total) * 100);

  const root = h('div', { class: 'exp' });

  root.append(
    h('header', { class: 'exp__head' },
      h('p', { class: 'kicker' }, h('b', null, 'Progress'), h('span', null, 'local, and only local')),
      h('h1', { class: 'exp__title' }, 'What you have touched'),
      h('p', { class: 'exp__line' }, 'Eight experiments, three tools, one map. Nothing here leaves this browser.')),
    h('div', { class: 'stage' },
      h('div', { class: 'prog' },
        h('div', { class: 'prog__dial' },
          h('b', { class: 'prog__pct' }, `${pct}%`),
          h('span', null, `${done} of ${total}`)),
        h('div', { class: 'prog__bars' },
          bar('explored', p.explored.length, NODES.length),
          bar('tried', p.tried.length, EXERCISES.length),
          bar('completed', p.done.length, EXERCISES.length)))),
    h('div', { class: 'prog__grid' },
      section('Experiments', EXERCISES.map(([id, title, task]) => {
        const isDone = p.done.includes(id);
        const isTried = p.tried.includes(id);
        return h('a', { class: 'prow' + (isDone ? ' is-done' : isTried ? ' is-tried' : ''), href: `#sim/${id}` },
          h('b', null, id),
          h('span', { class: 'prow__t' }, title),
          h('span', { class: 'prow__s' }, isDone ? 'done' : isTried ? 'tried' : task));
      })),
      section('Workbench', TOOLS.map(([id, title, task]) => h('a', { class: 'prow', href: `#bench/${id}` },
        h('b', null, id.toUpperCase()),
        h('span', { class: 'prow__t' }, title),
        h('span', { class: 'prow__s' }, task)))),
      section('Your entries', ENTRIES.map(([key, label]) => {
        const v = store.get(key, null);
        const has = v && (Array.isArray(v) ? v.length : Object.keys(v).length);
        return h('button', {
          class: 'prow', type: 'button',
          onclick: () => openSheet(label, () => [
            h('p', { class: 'small' }, has ? 'Stored in this browser under ' + key + '.' : 'Nothing saved here yet.'),
            h('pre', { class: 'small', style: { whiteSpace: 'pre-wrap', margin: 0 } }, JSON.stringify(v || {}, null, 2).slice(0, 4000)),
          ]),
        }, h('b', null, has ? '·' : '—'), h('span', { class: 'prow__t' }, label), h('span', { class: 'prow__s' }, has ? 'saved' : 'empty'));
      }))),
    h('p', { class: 'small quiet', style: { margin: '1rem 0 0' } },
      'Progress uses the same local storage key as the previous version of this site, so entries you made there are still here. ',
      tagEl('manual'), ' ', tagEl('sim'), ' ', tagEl('read'),
      ' mark where each claim comes from. Use Data in the header to export or erase.')
  );

  return root;
}

function bar(label, n, of) {
  return h('div', { class: 'pbar' },
    h('span', null, label),
    h('i', null, h('u', { style: { width: `${of ? Math.round((Math.min(n, of) / of) * 100) : 0}%` } })),
    h('b', null, `${n}/${of}`));
}

function section(title, rows) {
  return h('section', { class: 'pgroup' },
    h('h2', null, title),
    h('div', { class: 'plist' }, ...rows));
}
