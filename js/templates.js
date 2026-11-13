/* templates.js — Part II. Three usable interfaces, all saved in this browser.
   Template C shares the belief log component and store with Rule 05. */

import {
  h, s, btn, chapter, note, field, textInput, store, subscribe, toast, chip,
} from './core.js';
import { beliefLog } from './rules-b.js';

/* --------------------------------------------------------------- helpers */

function panel({ title, meta, children }) {
  return h('section', { class: 'tmpl', 'aria-label': title },
    h('div', { class: 'tmpl__hd' }, h('h3', null, title), h('span', null, meta)),
    ...children);
}

function scaleRow(label, value, onChange) {
  const group = h('div', { class: 'seg', role: 'group', 'aria-label': label });
  const btns = [1, 2, 3, 4, 5].map((n) =>
    h('button', {
      type: 'button',
      'aria-pressed': String(n === value),
      onclick: () => {
        onChange(n);
        btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === n)));
      },
    }, String(n)));
  group.append(...btns);
  return h('div', { class: 'field' }, h('span', null, label), group);
}

/* ------------------------------------------------------------ template A */

const SCHEDULE = [
  { t: '+0:00', name: 'Open', len: '10 min', rule: 'Rule 02', text: 'Read yesterday’s breadcrumb. Confirm the hard thing. Open only what you need.' },
  { t: '+0:10', name: 'Block 1', len: '90 min', rule: 'Rules 01, 03', text: 'The hard thing, first, while energy is highest.', block: 0 },
  { t: '+1:40', name: 'Break', len: '20 min', rule: 'Rule 07', text: 'Away from the screen. Water, a walk, no feed.' },
  { t: '+2:00', name: 'Block 2', len: '90 min', rule: 'Rules 01, 03', text: 'Continue the hard thing, or take the second priority.', block: 1 },
  { t: '+3:30', name: 'Real break', len: '40 min', rule: 'Rule 07', text: 'Eat. Do not work through it.' },
  { t: '+4:10', name: 'Block 3', len: '75 min', rule: 'Rule 03', text: 'Review today’s output, then shallow work: messages, admin, small fixes.', block: 2 },
  { t: '+5:25', name: 'Shutdown', len: '10 min', rule: 'Rules 02, 07', text: 'Write the breadcrumb. Empty the parking lot into its file. Name tomorrow’s hard thing.' },
];

const STUCK = ['Write it out for a stranger', 'Read how others solved it', 'Walk 20 minutes', 'Switch task type'];

function templateA() {
  const state = store.get('templateA', {
    date: '', start: '09:00', projects: '', hard: '',
    modes: ['execute', 'execute', 'review'], next: ['', '', ''], focus: 3, drain: 3,
  });
  const save = () => store.set('templateA', state);

  const area = h('textarea', { rows: 3, 'aria-label': 'Parking lot · one line per idea', placeholder: 'one idea per line' });
  area.value = store.get('parking', '');
  const parked = h('p', { class: 'result' });
  const refreshParked = () => {
    const n = area.value.split('\n').filter((l) => l.trim()).length;
    parked.textContent = n ? `${n} parked. Everything else is a bonus.` : 'One line per idea. Then back to work.';
  };
  area.addEventListener('input', () => { store.set('parking', area.value); refreshParked(); });
  refreshParked();
  subscribe((key) => {
    if (key !== 'parking') return;
    const v = store.get('parking', '');
    if (v !== area.value) { area.value = v; refreshParked(); }
  });

  const rows = SCHEDULE.map((row) => {
    const cells = [
      h('span', { class: 'tmpl-schedule__t' }, row.t),
      h('div', null,
        h('b', null, row.name, ' · ', h('span', { style: { fontFamily: 'var(--mono)', fontSize: '0.7rem', color: 'var(--ink-3)' } }, row.len)),
        h('small', null, row.rule, ' — ', row.text)),
    ];
    if (row.block !== undefined) {
      const b = row.block;
      cells.push(h('div', { style: { gridColumn: '1 / -1', display: 'grid', gap: '0.5rem', marginTop: '0.4rem' } },
        h('div', { class: 'controls', style: { margin: 0 } },
          h('div', { class: 'seg', role: 'group', 'aria-label': `Block ${b + 1} mode` },
            ...['design', 'execute', 'review'].map((m, i) =>
              h('button', {
                type: 'button',
                'aria-pressed': String(state.modes[b] === m),
                onclick: (e) => {
                  state.modes[b] = m;
                  [...e.currentTarget.parentElement.children].forEach((el, j) =>
                    el.setAttribute('aria-pressed', String(j === i)));
                  save();
                },
              }, m[0].toUpperCase() + m.slice(1))))),
        field('Next action', textInput({
          value: state.next[b], placeholder: 'verb + thing + where',
          ariaLabel: `Block ${b + 1} next action`,
          onInput: (v) => { state.next[b] = v; save(); },
        }))));
    }
    return h('div', { class: 'tmpl-schedule__row' }, ...cells);
  });

  const checked = new Set();

  return panel({
    title: 'Template A · One-page daily workflow',
    meta: 'print it · fill the top · follow the rail',
    children: [
      h('div', { class: 'grid grid--2' },
        field('Date', h('input', {
          type: 'date', value: state.date, 'aria-label': 'Date',
          onInput: (e) => { state.date = e.currentTarget.value; save(); },
        })),
        field('Start time', h('input', {
          type: 'time', value: state.start, 'aria-label': 'Start time',
          onInput: (e) => { state.start = e.currentTarget.value; save(); },
        })),
        field('Active project (one or two, no more)', textInput({
          value: state.projects, placeholder: 'one project',
          onInput: (v) => { state.projects = v; save(); },
        })),
        field('The one hard thing today', textInput({
          value: state.hard, placeholder: 'name it as a next action',
          onInput: (v) => { state.hard = v; save(); },
        }))),

      h('div', { class: 'tmpl-schedule' }, ...rows),

      h('div', { class: 'grid grid--2', style: { marginTop: '1.2rem' } },
        h('div', null,
          h('p', { class: 'fig__title' }, 'Stuck? Climb in order'),
          h('div', { class: 'rail__rules', style: { marginTop: '0.4rem' } },
            ...STUCK.map((t, i) => chip(`${i + 1} · ${t}`)))),
        h('div', null,
          h('p', { class: 'fig__title' }, 'End-of-day check'),
          h('div', { class: 'grid', style: { marginTop: '0.4rem' } },
            scaleRow('Focus quality', state.focus, (n) => { state.focus = n; save(); }),
            scaleRow('Drain', state.drain, (n) => { state.drain = n; save(); })),
          h('p', { class: 'muted', style: { fontSize: '0.76rem', margin: '0.3rem 0 0' } },
            '1 low, 5 high. Two bad days in a row: cut tomorrow’s plan.'))),

      h('label', { class: 'field', style: { marginTop: '1.2rem' } },
        h('span', null, 'Parking lot · one line per idea'),
        area),
      parked,

      h('div', { class: 'controls', style: { marginTop: '0.9rem', marginBottom: '0' } },
        btn('Print this template', () => window.print(), { ghost: true, small: true }),
        btn('Check off the shutdown', () => {
          if (checked.has('s')) { toast('Already checked today.'); return; }
          checked.add('s');
          toast('Shutdown done: breadcrumb written, parking lot emptied, tomorrow named.');
        }, { ghost: true, small: true })),
    ],
  });
}

/* ------------------------------------------------------------ template B */

const ARROWS = [
  {
    n: 1, from: 'User', to: 'API', cross: true,
    line: [116, 90, 152, 90],
    threats: [
      ['S · Spoofing', 'Someone claims to be a user with a stolen or guessed credential.'],
      ['D · Denial of service', 'One client sends ten thousand login attempts.'],
      ['I · Information disclosure', 'Verbose errors reveal whether an account exists.'],
      ['E · Elevation of privilege', 'An ordinary user reaches a function meant for admins.'],
    ],
  },
  {
    n: 2, from: 'API', to: 'Database', cross: false,
    line: [232, 112, 252, 138],
    threats: [
      ['T · Tampering', 'A query built from user input rewrites rows it should not.'],
      ['I · Information disclosure', 'A read returns another user’s rows because ownership was not checked.'],
      ['R · Repudiation', 'A sensitive write happens with no audit trail.'],
      ['D · Denial of service', 'An unbounded query takes the database down.'],
    ],
  },
  {
    n: 3, from: 'API', to: 'Email or payments', cross: true,
    line: [232, 68, 252, 44],
    threats: [
      ['I · Information disclosure', 'The payload to the third party contains more than it needs.'],
      ['S · Spoofing', 'A webhook is accepted from anyone who can reach the endpoint.'],
      ['R · Repudiation', 'A delivery is claimed that never happened.'],
      ['D · Denial of service', 'The provider is down and the queue takes the API with it.'],
    ],
  },
];

const STRIDE = [
  ['S', 'Spoofing', 'Can someone pretend to be a user or a service?', 'Strong authentication, hashed passwords, signed tokens, MFA.'],
  ['T', 'Tampering', 'Can data be changed in transit or at rest?', 'TLS, input validation, parameterised queries, integrity checks.'],
  ['R', 'Repudiation', 'Could someone deny an action, and could you prove otherwise?', 'Audit log of sensitive actions with actor and time.'],
  ['I', 'Information disclosure', 'Where could data leak: logs, errors, URLs, backups?', 'Least privilege, encryption, generic errors, no secrets in the repository.'],
  ['D', 'Denial of service', 'What happens when one client sends ten thousand requests?', 'Rate limits, timeouts, size caps, quotas.'],
  ['E', 'Elevation of privilege', 'Can an ordinary user reach an admin function or another user’s data?', 'Server-side authorization on every object. Deny by default.'],
];

const SEED_SLICES = [
  ['Walking skeleton: deploy a page that reads one value from the database', 'Secrets in environment variables. HTTPS only. Lockfile for dependencies. CI on every push.', 'The deployed URL shows a database value. CI is green.'],
  ['Sign up and log in', 'Hash passwords (bcrypt or argon2). Rate-limit login. Generic error messages. Secure session cookies.', 'Log in and out works. Five wrong tries get throttled.'],
  ['Create and view your own item', 'Check ownership on the server for every read and write. Parameterised queries. Escape output.', 'User B gets a 403 on user A’s item.'],
];

function templateB() {
  const state = store.get('templateB', {
    problem: '', users: '', done: ['', '', ''], nonGoals: '', constraints: '', assumptions: '',
    slices: SEED_SLICES.map((r) => ({ goal: r[0], security: r[1], done: r[2] })),
  });
  const save = () => store.set('templateB', state);

  // trust model ------------------------------------------------------
  let selected = 1;
  const arrows = {};
  const detail = h('div', { class: 'threats' });
  const btns = [];

  const svg = s('svg', {
    class: 'diagram', viewBox: '0 0 320 190', role: 'img',
    'aria-label': 'Trust boundary diagram: a user outside your control, reaching your API, which talks to a database and a third party.',
  },
    s('rect', { x: 6, y: 46, width: 104, height: 92, fill: 'none', stroke: 'var(--rule-2)', 'stroke-dasharray': '4 3' }),
    s('text', { x: 10, y: 40, class: 't-faint' }, 'OUTSIDE YOUR CONTROL'),
    s('rect', { x: 26, y: 74, width: 66, height: 34, fill: 'var(--paper)', stroke: 'var(--ink)' }),
    s('text', { x: 59, y: 95, 'text-anchor': 'middle' }, 'User'),
    s('rect', { x: 152, y: 72, width: 80, height: 38, fill: 'var(--paper)', stroke: 'var(--ink)' }),
    s('text', { x: 192, y: 95, 'text-anchor': 'middle' }, 'API server'),
    s('rect', { x: 250, y: 120, width: 62, height: 32, fill: 'var(--paper)', stroke: 'var(--ink)' }),
    s('text', { x: 281, y: 139, 'text-anchor': 'middle' }, 'Database'),
    s('rect', { x: 250, y: 24, width: 62, height: 32, fill: 'var(--paper)', stroke: 'var(--ink)' }),
    s('text', { x: 281, y: 43, 'text-anchor': 'middle', style: 'font-size:8px' }, 'Third party'));

  for (const a of ARROWS) {
    const [x1, y1, x2, y2] = a.line;
    const g = s('g', {
      style: 'transition: opacity 220ms ease',
    },
      s('line', {
        x1, y1, x2, y2,
        stroke: a.cross ? 'var(--violet)' : 'var(--ink-2)',
        'stroke-width': 1.6,
        'stroke-dasharray': a.cross ? '5 3' : '0',
      }),
      s('circle', { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 - 9, r: 8, fill: 'var(--paper)', stroke: a.cross ? 'var(--violet)' : 'var(--rule-2)' }),
      s('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 6, 'text-anchor': 'middle', class: a.cross ? 't-violet' : 't-faint' }, String(a.n)));
    arrows[a.n] = g;
    svg.append(g);
  }

  function renderDetail() {
    const a = ARROWS.find((x) => x.n === selected);
    Object.entries(arrows).forEach(([n, g]) => { g.style.opacity = String(Number(n) === selected ? 1 : 0.35); });
    btns.forEach((b, i) => b.setAttribute('aria-pressed', String(i + 1 === selected)));
    detail.replaceChildren(
      h('p', { class: 'fig__title' }, `Arrow ${a.n} · ${a.from} → ${a.to}${a.cross ? ' · crosses a trust boundary' : ''}`),
      ...a.threats.map(([k, text]) => h('div', { class: 'threat' }, h('b', null, k), h('span', null, text))),
      h('p', { class: 'muted', style: { fontSize: '0.78rem', margin: '0.4rem 0 0' } },
        'Ask all six STRIDE questions of every arrow. These four are the ones this connection most often fails.'));
  }

  const arrowList = h('div', { class: 'arrowlist' },
    ...ARROWS.map((a) => {
      const b = h('button', {
        class: 'arrowbtn', type: 'button', 'aria-pressed': 'false',
        onclick: () => { selected = a.n; renderDetail(); },
      }, h('span', null, String(a.n)), h('span', null, `${a.from} → ${a.to}`));
      btns.push(b);
      return b;
    }));
  renderDetail();

  // slice plan -------------------------------------------------------
  const sliceBox = h('div', { class: 'grid', style: { gap: '0.9rem' } });

  function renderSlices() {
    sliceBox.replaceChildren(...state.slices.map((row, i) =>
      h('div', { style: { borderTop: '1px solid var(--rule)', paddingTop: '0.6rem' } },
        h('div', { class: 'controls', style: { marginBottom: '0.4rem' } },
          h('span', { class: 'fig__title' }, `Slice ${String(i).padStart(2, '0')}`),
          btn('Remove', () => {
            state.slices.splice(i, 1); save(); renderSlices();
          }, { ghost: true, small: true })),
        h('div', { class: 'grid grid--3' },
          field('User-visible goal', textInput({
            value: row.goal, placeholder: 'what a user can now do',
            ariaLabel: `Slice ${i} goal`,
            onInput: (v) => { row.goal = v; save(); },
          })),
          field('Security work in this slice', textInput({
            value: row.security, placeholder: 'checks that ship with it',
            ariaLabel: `Slice ${i} security work`,
            onInput: (v) => { row.security = v; save(); },
          })),
          field('Done when', textInput({
            value: row.done, placeholder: 'the observable condition',
            ariaLabel: `Slice ${i} done condition`,
            onInput: (v) => { row.done = v; save(); },
          }))))));
  }
  renderSlices();

  return panel({
    title: 'Template B · Software project kickoff',
    meta: 'spec · threat model · slice plan · about 70 minutes',
    children: [
      h('div', { class: 'fig__title', style: { marginBottom: '0.5rem' } }, '01 · Spec — if it does not fit on one page, the scope is too big'),
      h('div', { class: 'grid grid--2' },
        field('Problem, in one or two sentences', textInput({
          value: state.problem, placeholder: 'what is broken, for whom',
          multiline: true, rows: 2, ariaLabel: 'Problem statement',
          onInput: (v) => { state.problem = v; save(); },
        }), { wide: true }),
        field('Who it is for', textInput({
          value: state.users, placeholder: 'the specific person, not “users”',
          ariaLabel: 'Who it is for',
          onInput: (v) => { state.users = v; save(); },
        })),
        field('Constraints: deadline, stack, budget, data sensitivity', textInput({
          value: state.constraints, placeholder: 'what you cannot change',
          ariaLabel: 'Constraints',
          onInput: (v) => { state.constraints = v; save(); },
        })),
        h('div', { class: 'field field--wide' },
          h('span', null, 'Done for V1 means (measurable)'),
          ...[0, 1, 2].map((i) => textInput({
            value: state.done[i], placeholder: `${i + 1}. observable condition`,
            ariaLabel: `V1 completion condition ${i + 1}`,
            onInput: (v) => { state.done[i] = v; save(); },
          }))),
        field('Non-goals: explicitly not doing', textInput({
          value: state.nonGoals, placeholder: 'name the tempting things you are excluding',
          multiline: true, rows: 2, ariaLabel: 'Non-goals',
          onInput: (v) => { state.nonGoals = v; save(); },
        }), { wide: true }),
        field('Assumptions to verify', textInput({
          value: state.assumptions, placeholder: 'what must be true, and how you will check it',
          multiline: true, rows: 2, ariaLabel: 'Assumptions to verify',
          onInput: (v) => { state.assumptions = v; save(); },
        }), { wide: true })),

      h('div', { class: 'fig__title', style: { margin: '1.6rem 0 0.5rem' } }, '02 · Threat model — thirty minutes, one diagram, before the first slice'),
      h('div', { class: 'grid grid--2', style: { alignItems: 'start' } },
        h('div', null, svg,
          h('p', { class: 'muted', style: { fontSize: '0.76rem', margin: '0.3rem 0 0' } },
            'Violet dashed arrows cross a trust boundary. Start there and ask: what if the other side is hostile?')),
        h('div', null, arrowList, detail)),

      h('div', { class: 'stride', style: { marginTop: '1.2rem' } },
        ...STRIDE.map(([k, name, ask, control]) =>
          h('div', { class: 'stride__row' },
            h('span', { class: 'stride__key' }, k),
            h('div', null, h('b', null, name), h('small', null, ask, ' '), h('small', { style: { color: 'var(--ink-3)' } }, control))))),

      h('div', { class: 'fig__title', style: { margin: '1.6rem 0 0.5rem' } }, '03 · Slice plan — a thin, working, end-to-end path. Its security work travels with it.'),
      h('p', { class: 'muted', style: { fontSize: '0.8rem', marginTop: '0' } },
        'Layers touched, left to right: UI, API, Logic, Data. A true slice fills all four. Rows 0 to 2 are the manual’s examples; replace them.'),
      sliceBox,
      h('div', { class: 'controls', style: { marginTop: '0.7rem', marginBottom: '0' } },
        btn('Add a slice', () => {
          state.slices.push({ goal: '', security: '', done: '' });
          save(); renderSlices();
        }, { ghost: true, small: true }),
        h('span', { class: 'muted', style: { fontSize: '0.76rem' } }, 'A slice that needs more than a few sessions is really two slices.')),
    ],
  });
}

/* ------------------------------------------------------------ template C */

const STATUSES = ['open', 'partly answered', 'answered'];

function templateC() {
  const state = store.get('templateC', {
    question: '', items: [], budget: 45, stop: [false, false, false],
  });
  const save = () => store.set('templateC', state);

  const questionInput = textInput({
    value: state.question, placeholder: 'the one question this work answers',
    ariaLabel: 'Main research question',
    onInput: (v) => { state.question = v; save(); },
  });

  const treeBox = h('div', { class: 'grid', style: { gap: '0.45rem' } });
  const treeCount = h('p', { class: 'result' });
  const draft = textInput({ placeholder: 'a sub-question answerable by one source or one experiment', ariaLabel: 'New sub-question' });

  function updateCount() {
    const counts = STATUSES.map((st) => `${state.items.filter((i) => i.status === st).length} ${st}`);
    treeCount.textContent = state.items.length ? counts.join(' · ') : '';
  }

  function renderTree() {
    treeBox.replaceChildren(...(state.items.length ? state.items.map((item, i) =>
      h('div', { style: { display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 9.2rem auto', gap: '0.4rem', alignItems: 'center' } },
        textInput({
          value: item.text, ariaLabel: `Sub-question ${i + 1}`,
          onInput: (v) => { item.text = v; save(); },
        }),
        h('select', {
          'aria-label': `Status for sub-question ${i + 1}`,
          onInput: (e) => { item.status = e.currentTarget.value; save(); updateCount(); },
        }, ...STATUSES.map((st) => h('option', { value: st, selected: st === item.status }, st))),
        btn('×', () => { state.items.splice(i, 1); save(); renderTree(); }, { ghost: true, small: true, label: `Remove sub-question ${i + 1}` })))
      : [h('p', { class: 'muted', style: { fontSize: '0.84rem', margin: 0 } },
        'No sub-questions yet. Split until each leaf can be answered by one source or one experiment.')]));
    updateCount();
  }
  renderTree();

  const addQ = btn('Add sub-question', () => {
    if (!draft.value.trim()) { toast('Type the sub-question first.'); return; }
    state.items.push({ text: draft.value.trim(), status: 'open' });
    draft.value = '';
    save(); renderTree();
  }, { small: true });

  // budget ------------------------------------------------------------
  let extended = false;
  const budgetOut = h('p', { class: 'result' });
  const budgetInput = h('input', {
    type: 'number', min: 5, max: 240, step: 5, value: String(state.budget),
    'aria-label': 'Research time budget in minutes',
    onInput: (e) => { state.budget = Number(e.currentTarget.value) || 45; save(); renderBudget(); },
  });
  function renderBudget() {
    budgetOut.textContent = extended
      ? `${Math.round(state.budget * 1.5)} minutes total. One extension used — then stop and write it up.`
      : `${state.budget} minutes. When it ends: stop and write it up, extend once by half, or park it and ask someone.`;
  }
  renderBudget();

  // stop rule ---------------------------------------------------------
  const STOP = [
    'The last two sources changed nothing I can state',
    'I can state the answer in two sentences',
    'I can name its weakest assumption',
  ];
  const stopOut = h('p', { class: 'result', 'aria-live': 'polite' });
  const stopRows = STOP.map((text, i) => h('label', { class: 'checkline' },
    h('input', {
      type: 'checkbox', checked: state.stop[i],
      onchange: (e) => {
        state.stop[i] = e.currentTarget.checked;
        save();
        const n = state.stop.filter(Boolean).length;
        stopOut.textContent = n === 3
          ? 'All three true: stop reading and write it up.'
          : `${n} of 3. Not yet a stopping point — but two true is close.`;
      },
    }),
    h('span', null, text)));

  // adversarial prompt -------------------------------------------------
  const PROMPT = 'Here is my conclusion and my evidence. Argue against it. Give the three strongest objections, evidence I may have ignored, the assumption most likely to be false, and one cheap test that would settle it.';

  return panel({
    title: 'Template C · Research workflow',
    meta: 'one question · a tree · a belief log · a stop rule',
    children: [
      h('div', { class: 'fig__title', style: { marginBottom: '0.5rem' } }, '01 · Question tree'),
      field('Main question', questionInput, { wide: true }),
      h('div', { style: { marginTop: '0.8rem' } }, treeBox),
      h('div', { class: 'controls', style: { marginTop: '0.6rem' } }, draft, addQ),
      treeCount,

      h('div', { class: 'fig__title', style: { margin: '1.6rem 0 0.5rem' } }, '02 · Belief log'),
      beliefLog(),

      h('div', { class: 'fig__title', style: { margin: '1.6rem 0 0.5rem' } }, '03 · Time-box'),
      h('div', { class: 'grid grid--2' },
        field('Budget (minutes)', budgetInput),
        h('div', { class: 'controls', style: { alignSelf: 'end', marginBottom: '0.2rem' } },
          btn('Extend once by half', () => {
            if (extended) { toast('One extension only.'); return; }
            extended = true; renderBudget();
          }, { ghost: true, small: true }),
          btn('Park it', () => toast('Parked. Write the question down and come back with a fresh budget.'), { ghost: true, small: true }))),
      budgetOut,

      h('div', { class: 'fig__title', style: { margin: '1.6rem 0 0.5rem' } }, '04 · Stop rule'),
      h('div', { class: 'grid', style: { gap: '0.45rem' } }, ...stopRows),
      stopOut,

      h('div', { class: 'fig__title', style: { margin: '1.6rem 0 0.5rem' } }, '05 · Attack it — then update the log'),
      h('div', { class: 'prompt-box' }, PROMPT),
      h('div', { class: 'controls' },
        btn('Copy the prompt', async () => {
          try { await navigator.clipboard.writeText(PROMPT); toast('Prompt copied.'); }
          catch { toast('Copy blocked. Select the text instead.'); }
        }, { ghost: true, small: true })),
      h('p', { class: 'muted', style: { fontSize: '0.82rem', marginTop: '0.6rem' } },
        'Then update the log: revise, defend with new evidence, or park it.'),
    ],
  });
}

/* ---------------------------------------------------------------- export */

export function templates() {
  const { root, body } = chapter({
    id: 'templates',
    kind: 'Part II',
    no: 'three templates',
    title: 'Templates you can fill in',
    lede: 'Print it. Fill the top. Follow the rail. A template you admire but never fill in is decoration.',
    removes: '',
  });

  const { root: rootEl, body: bodyEl } = { root, body };

  bodyEl.append(
    h('div', { class: 'prose' },
      h('p', null,
        'These are the manual’s three templates, made usable. Everything you type is stored in this browser and included in Export. ',
        'Nothing is sent anywhere, and the page works offline once loaded.')),
    templateA(),
    templateB(),
    templateC(),
    note('read',
      h('span', null,
        'Template fields, the STRIDE table and the schedule come from the manual. Worked threat examples and the stop-rule readout are added explanation, not the manual’s text.'))
  );

  return rootEl;
}
