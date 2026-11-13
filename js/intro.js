/* intro.js — the opening: the proposition and what decomposition does. */

import { h, btn, chip, note, fig, reveal } from './core.js';

const PASS = [
  'It starts with a verb',
  'It names the file, page or source',
  'It fits in one sitting, under about 45 minutes',
  'You will know when it is done',
];

const STAGES = [
  { name: 'Project', qty: '1', note: 'Build auth' },
  { name: 'Milestone', qty: '4', note: 'Register · Log in · Sessions · Reset password' },
  { name: 'Task', qty: '3', note: 'Verify password · Throttle attempts · Error messages' },
  { name: 'Step', qty: 'split later', note: 'Split it when you reach it, not before' },
  { name: 'Next action', qty: '1', note: 'Write a failing test: wrong password returns 401' },
];

const RAIL = [
  { when: 'Before', what: 'Name the next action', rules: ['01', '03'], act: true },
  { when: 'Start', what: 'Read the breadcrumb', rules: ['02'], act: true },
  { when: 'Work', what: 'Ship a thin slice', rules: ['04'], act: false },
  { when: 'Work', what: 'Update the belief log', rules: ['05'], act: false },
  { when: 'Work', what: 'Check challenge vs skill', rules: ['06'], act: false },
  { when: 'Stuck', what: 'Diagnose, then climb the ladder', rules: ['08'], act: false },
  { when: 'End', what: 'Stop on schedule, park ideas', rules: ['07'], act: true },
  { when: 'End', what: 'Write the breadcrumb', rules: ['02'], act: true },
];

function decompositionFigure() {
  const rows = STAGES.map((st) =>
    h('div', { class: 'ladder__row' },
      h('span', { class: 'ladder__name' }, st.name),
      h('div', { class: 'ladder__bar', 'aria-hidden': 'true' }, h('i')),
      h('span', { class: 'ladder__qty' }, h('b', null, st.qty)))
  );

  const noteLine = h('p', { class: 'result', 'aria-live': 'polite' });
  const action = h('div', { class: 'pathbanner' },
    h('b', null, 'NEXT ACTION'),
    ' Write a failing test: wrong password returns 401');

  let stage = -1;
  let played = false;

  function render() {
    rows.forEach((row, i) => {
      row.classList.toggle('is-on', i === stage);
      row.classList.toggle('is-done', i < stage);
    });
    const st = STAGES[Math.max(0, stage)];
    noteLine.textContent = stage < 0
      ? 'Start at the top. Each level asks the same question: can I start this without thinking?'
      : `${st.name} — ${st.note}`;
    action.classList.toggle('is-on', stage >= STAGES.length - 1);
  }

  function next() {
    stage = Math.min(STAGES.length - 1, stage + 1);
    render();
  }

  const btnNext = btn('Decompose', next);
  const btnReset = btn('Start over', () => {
    stage = -1;
    render();
  }, { ghost: true });

  const root = h('div', null,
    h('div', { class: 'ladder' }, rows),
    noteLine,
    action,
    h('div', { class: 'controls', style: { marginTop: '0.9rem', marginBottom: '0' } }, btnNext, btnReset)
  );

  render();

  // One orchestrated reveal the first time the figure is on screen.
  const io = 'IntersectionObserver' in window ? new IntersectionObserver((entries, obs) => {
    for (const e of entries) {
      if (!e.isIntersecting || played) continue;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      played = true;
      obs.disconnect();
      let i = 0;
      const id = setInterval(() => {
        if (stage >= STAGES.length - 1 || stage > i) { clearInterval(id); return; }
        next();
        i += 1;
      }, 420);
    }
  }, { threshold: 0.6 }) : null;
  if (io) io.observe(root);

  return fig({
    title: 'Project → next action',
    tag: 'sim',
    stage: root,
    caption: h('span', null,
      'Counts follow the manual’s authentication example: one project, four milestones, three tasks under ',
      h('b', null, 'Log in'), '. “Step” is deliberately left unsplit until you reach it.'),
  });
}

export function opening() {
  const root = h('section', { class: 'chapter opening', id: 'opening', 'aria-labelledby': 'opening-title' });

  const head = h('div', { class: 'ch-head' },
    h('p', { class: 'opening__kicker' }, 'Field manual · research · software · sustained effort'),
    h('h1', { class: 'opening__title', id: 'opening-title' }, 'Flow is a ', h('em', null, 'structure'), ' problem.'),
    h('p', { class: 'opening__lede' },
      'Burnout and stalled ideas rarely come from a lack of discipline. They come from tasks too big to start, sessions that end cold, constant switching, and effort with no feedback. Each rule removes one of those.')
  );

  const after = h('div', { class: 'ch-body' },
    decompositionFigure(),

    h('div', { class: 'prose' },
      h('h3', null, 'A next action passes if'),
      h('ul', { class: 'checklist' },
        ...PASS.map((text) => h('li', { data: { ok: 'true' } }, h('span', { class: 'mark' }, '✓'), text))),
      h('p', null,
        'The four tests matter together. “Write the test” starts with a verb but names nothing. ',
        '“auth/tests.py, wrong-password case” names a location but states no action. Both leave a decision for later, ',
        'and a decision is exactly what you cannot make when you sit down cold.')
    ),

    fig({
      title: 'Where each rule acts in one work session',
      tag: 'manual',
      stage: h('div', { class: 'rail' },
        ...RAIL.map((stop) => h('div', { class: 'rail__stop' + (stop.act ? ' rail__stop--act' : '') },
          h('span', { class: 'rail__when' }, stop.when),
          h('span', { class: 'rail__what' }, stop.what),
          h('span', { class: 'rail__rules' }, ...stop.rules.map((r) => chip('Rule ' + r))))
        )),
      caption: 'The end of one session is the start of the next.',
    }),


    note('manual',
      h('span', null,
        'Read Part I once. Print Part II and use it for a week before you change it. ',
        h('em', null, 'A template you admire but never fill in is decoration.'))),

    h('div', { class: 'links' },
      h('b', null, 'Start here'),
      h('a', { href: '#r01' }, 'Rule 01 — Shrink the task'),
      h('a', { href: '#templates' }, 'Templates A · B · C'))
  );

  root.append(head, after);
  reveal(head, 0);
  reveal(after, 1);
  return root;
}
