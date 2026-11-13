/* workbench.js — the manual's three templates as working instruments.
   Persistence keys are the previous version's, so entries made there are kept. */

import {
  h, s, store, subscribe, toast, clamp, segmented, textInput, field, btn,
  openSheet, tagEl, mark, slider, more,
} from './core.js';

const pad2 = (n) => String(n).padStart(2, '0');

function minutesOf(t) {
  const [hh, mm] = String(t || '09:00').split(':').map(Number);
  return clamp((hh || 0) * 60 + (mm || 0), 0, 24 * 60);
}

function clock(base, offset) {
  const total = (minutesOf(base) + offset) % (24 * 60);
  return `${pad2(Math.floor(total / 60))}:${pad2(total % 60)}`;
}

const tint = (kind, mode) => (kind === 'break' ? 'break' : mode || undefined);

/* =============================================================== A · day */

const BASE_BLOCKS = [
  { id: 'open', kind: 'open', name: 'Open', mins: 10, action: 'Read the breadcrumb. Confirm the hard thing.' },
  { id: 'b1', kind: 'block', name: 'Block 1', mins: 90, mode: 'execute', action: '' },
  { id: 'br1', kind: 'break', name: 'Break', mins: 20, action: '' },
  { id: 'b2', kind: 'block', name: 'Block 2', mins: 90, mode: 'execute', action: '' },
  { id: 'br2', kind: 'break', name: 'Meal', mins: 40, action: '' },
  { id: 'b3', kind: 'block', name: 'Block 3', mins: 75, mode: 'review', action: '' },
  { id: 'close', kind: 'shutdown', name: 'Shutdown', mins: 10, action: 'Write the breadcrumb. Empty the parking lot.' },
];

function dayState() {
  const old = store.get('templateA', {});
  const merged = {
    date: old.date || '',
    start: old.start || '09:00',
    projects: old.projects || '',
    hard: old.hard || '',
    focus: old.focus || 3,
    drain: old.drain || 3,
    blocks: Array.isArray(old.blocks) && old.blocks.length ? old.blocks : BASE_BLOCKS.map((b, i) => ({
      ...b,
      mode: b.kind === 'block' ? (Array.isArray(old.modes) && old.modes[i - 1]) || b.mode : undefined,
      action: (Array.isArray(old.next) && old.next[i - 1]) || b.action,
    })),
  };
  return merged;
}

function templateA(host) {
  const st = dayState();
  const save = () => store.set('templateA', st);
  let selected = 'b1';

  const tl = h('div', { class: 'tl' });
  const inspector = h('div', { class: 'inspector' });
  const totals = h('span', null, '');

  function renderTimeline() {
    let offset = 0;
    const rows = st.blocks.map((b) => {
      const startAt = offset;
      offset += b.mins;
      const isSel = b.id === selected;
      return h('div', { class: 'tl__row' },
        h('span', { class: 'tl__t' }, clock(st.start, startAt)),
        h('button', {
          class: 'tlblock', type: 'button', 'aria-pressed': String(isSel),
          'data-mode': tint(b.kind, b.mode) || '',
          'data-kind': b.kind,
          onclick: () => { selected = b.id; renderTimeline(); renderInspector(); },
        },
          h('b', null, b.name, h('em', null, `${b.mins}m`)),
          h('span', null, b.kind === 'block' ? `${b.mode || 'execute'}${b.action ? ' · ' + b.action : ''}` : b.kind)));
    });
    tl.replaceChildren(...rows);
    totals.textContent = `${st.blocks.length} blocks · ${Math.round(offset / 60 * 10) / 10}h · ends ${clock(st.start, offset)}`;
  }

  function renderInspector() {
    const b = st.blocks.find((x) => x.id === selected) || st.blocks[0];
    if (!b) { inspector.replaceChildren(); return; }
    const update = () => { save(); renderTimeline(); renderInspector(); };

    const stepper = h('div', { class: 'seg' },
      h('button', { type: 'button', onclick: () => { b.mins = Math.max(5, b.mins - 5); update(); }, 'aria-label': 'Five minutes shorter' }, '−5'),
      h('span', { class: 'tiny', style: { padding: '0 0.5rem', display: 'grid', placeItems: 'center', minWidth: '3.2rem' } }, `${b.mins} min`),
      h('button', { type: 'button', onclick: () => { b.mins = Math.min(180, b.mins + 5); update(); }, 'aria-label': 'Five minutes longer' }, '+5'));

    inspector.replaceChildren(
      h('div', { class: 'row', style: { justifyContent: 'space-between' } },
        h('span', { class: 'tiny' }, `Editing · ${b.name}`),
        btn('Remove', () => {
          if (st.blocks.length <= 1) { toast('A day needs at least one block.'); return; }
          st.blocks = st.blocks.filter((x) => x.id !== b.id);
          selected = st.blocks[0].id;
          update();
        }, { ghost: true, small: true })),
      h('div', { class: 'row', style: { gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' } },
        h('span', { class: 'tiny' }, 'length'), stepper),
      b.kind === 'block'
        ? segmented({
          label: `${b.name} mode`, value: b.mode || 'execute',
          options: [['design', 'Design'], ['execute', 'Execute'], ['review', 'Review']],
          onChange: (v) => { b.mode = v; update(); },
        })
        : null,
      field('Next action', textInput({
        value: b.action || '', placeholder: 'verb + thing + where',
        ariaLabel: `${b.name} next action`,
        onInput: (v) => { b.action = v; save(); renderTimeline(); },
      })));
  }

  const projects = textInput({
    value: st.projects, placeholder: 'one project', ariaLabel: 'Active project',
    onInput: (v) => { st.projects = v; save(); },
  });
  const hard = textInput({
    value: st.hard, placeholder: 'the one hard thing', ariaLabel: 'The one hard thing today',
    onInput: (v) => { st.hard = v; save(); },
  });

  const scale = (label, key) => {
    const group = h('div', { class: 'scale', role: 'group', 'aria-label': label });
    const btns = [1, 2, 3, 4, 5].map((n) => h('button', {
      type: 'button', 'aria-pressed': String(st[key] === n),
      onclick: () => {
        st[key] = n; save();
        btns.forEach((x, i) => x.setAttribute('aria-pressed', String(i + 1 === n)));
      },
    }, String(n)));
    group.append(...btns);
    return h('div', { class: 'field' }, h('span', null, label), group);
  };

  renderTimeline();
  renderInspector();

  host.append(
    h('div', { class: 'grid grid--2' },
      h('div', { class: 'panel' },
        h('div', { class: 'panel__hd' }, h('h3', null, 'The day'), totals),
        h('div', { class: 'panel__body' },
          h('div', { class: 'grid grid--2', style: { gap: '0.45rem' } },
            field('Date', h('input', {
              type: 'date', value: st.date, 'aria-label': 'Date',
              oninput: (e) => { st.date = e.currentTarget.value; save(); },
            })),
            field('Start', h('input', {
              type: 'time', value: st.start, 'aria-label': 'Start time',
              oninput: (e) => { st.start = e.currentTarget.value; save(); renderTimeline(); },
            })),
            field('Active project', projects),
            field('One hard thing', hard)),
          tl,
          inspector,
          btn('Add a block', () => {
            st.blocks.push({ id: `b${Date.now()}`, kind: 'block', name: 'New block', mins: 45, mode: 'execute', action: '' });
            selected = st.blocks[st.blocks.length - 1].id;
            save();
            renderTimeline();
            renderInspector();
          }, { ghost: true, small: true }))),
      h('div', null,
        h('div', { class: 'panel' },
          h('div', { class: 'panel__hd' }, h('h3', null, 'End of day'), h('span', null, '1–5')),
          h('div', { class: 'panel__body' },
            scale('Focus quality', 'focus'),
            scale('Drain', 'drain'),
            h('p', { class: 'small quiet' }, 'Two bad days in a row: cut tomorrow’s plan, do not raise today’s effort.'))),
        h('div', { class: 'panel', style: { marginTop: '0.6rem' } },
          h('div', { class: 'panel__hd' }, h('h3', null, 'Stuck? climb in order'), h('span', null, 'cheapest first')),
          h('div', { class: 'panel__body' },
            h('div', { class: 'row', style: { gap: '0.25rem' } },
              ['Write it for a stranger · 10m', 'Read a similar solution · 20m', 'Walk away · 20m', 'Change task type · rest'].map((t) => h('span', { class: 'chip' }, t))),
            h('a', { class: 'small', href: '#sim/08' }, 'Open the diagnostic ladder →')))),
      h('div', { class: 'panel' },
        h('div', { class: 'panel__hd' }, h('h3', null, 'Parking lot'), h('span', null, 'shared with experiment 07')),
        h('div', { class: 'panel__body' }, parking(host)))));

  return () => {};
}

/* shared parking lot control, same store key as before */
function parking() {
  const input = textInput({ placeholder: 'one idea per line', ariaLabel: 'Park an idea' });
  const list = h('div', { class: 'park__list' });
  const note = h('p', { class: 'small quiet' }, '');
  const lines = () => store.get('parking', '').split('\n').filter((l) => l.trim());

  const draw = () => {
    const xs = lines();
    list.replaceChildren(...xs.map((t, i) => h('div', { class: 'park__item' },
      h('span', null, t),
      h('button', {
        type: 'button', 'aria-label': `Remove ${t}`,
        onclick: () => { store.set('parking', xs.filter((_, j) => j !== i).join('\n')); draw(); },
      }, '×'))));
    note.textContent = xs.length ? `${xs.length} parked, none of them today.` : 'One line per idea. Then back to work.';
  };
  const add = () => {
    const v = input.value.trim();
    if (!v) return;
    store.set('parking', [...lines(), v].join('\n'));
    input.value = '';
    draw();
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  subscribe((k) => { if (k === 'parking') draw(); });
  draw();

  return h('div', { class: 'park' },
    h('div', { class: 'row' }, h('div', { style: { flex: '1 1 9rem', minWidth: 0 } }, input), btn('Park', add, { small: true })),
    list, note);
}

/* ============================================================ B · kickoff */

const BNODES = {
  user: { label: 'User', x: 34, y: 86, w: 62, h: 32 },
  api: { label: 'API server', x: 150, y: 86, w: 76, h: 32 },
  db: { label: 'Database', x: 246, y: 150, w: 64, h: 30 },
  third: { label: 'Third party', x: 246, y: 26, w: 64, h: 30 },
};
const BEDGES = [
  { id: '1', from: 'user', to: 'api', cross: true, label: 'User → API' },
  { id: '2', from: 'api', to: 'db', cross: false, label: 'API → Database' },
  { id: '3', from: 'api', to: 'third', cross: true, label: 'API → Third party' },
];
const THREATS = {
  1: [['S · Spoofing', 'Someone claims to be a user with a stolen credential.'],
    ['D · Denial of service', 'One client sends ten thousand login attempts.'],
    ['I · Information disclosure', 'Verbose errors reveal whether an account exists.'],
    ['E · Elevation of privilege', 'An ordinary user reaches an admin function.']],
  2: [['T · Tampering', 'A query built from user input rewrites rows it should not.'],
    ['I · Information disclosure', 'A read returns another user’s rows: ownership was not checked.'],
    ['R · Repudiation', 'A sensitive write with no audit trail.'],
    ['D · Denial of service', 'An unbounded query takes the database down.']],
  3: [['I · Information disclosure', 'The payload to the third party carries more than it needs.'],
    ['S · Spoofing', 'A webhook accepted from anyone who can reach the endpoint.'],
    ['R · Repudiation', 'A delivery claimed that never happened.'],
    ['D · Denial of service', 'The provider is down and the queue takes the API with it.']],
};
const STRIDE = [
  ['S', 'Spoofing', 'Can someone pretend to be a user or a service?'],
  ['T', 'Tampering', 'Can data be changed in transit or at rest?'],
  ['R', 'Repudiation', 'Could an action be denied, unprovably?'],
  ['I', 'Information disclosure', 'Where could data leak: logs, errors, URLs?'],
  ['D', 'Denial of service', 'What happens at ten thousand requests?'],
  ['E', 'Elevation of privilege', 'Can a user reach admin data or code?'],
];

const SEED_SLICES = [
  { goal: 'Walking skeleton: a page that reads one row', security: 'Secrets in env vars · HTTPS · lockfile', done: 'Deployed URL shows a database value' },
  { goal: 'Sign up and log in', security: 'Hash passwords · rate-limit login · generic errors', done: 'B gets 401 on A’s credentials, 5 tries throttled' },
  { goal: 'Create and view your own item', security: 'Server-side ownership check · parameterised queries', done: 'User B gets 403 on user A’s item' },
];

function templateB(host) {
  const old = store.get('templateB', {});
  const st = {
    problem: old.problem || '',
    users: old.users || '',
    nonGoals: old.nonGoals || '',
    done: Array.isArray(old.done) && old.done.length ? old.done.slice(0, 3) : ['', '', ''],
    constraints: old.constraints || '',
    slices: Array.isArray(old.slices) && old.slices.length ? old.slices : SEED_SLICES.map((x) => ({ ...x })),
  };
  const save = () => store.set('templateB', st);
  let edge = '1';

  const boardSvg = s('svg', { viewBox: '0 0 320 190', role: 'group', 'aria-label': 'Components and trust boundaries' });
  const threatBox = h('div', { class: 'threats' });
  const edgeTitle = h('p', { class: 'tiny' }, '');

  function drawBoard() {
    boardSvg.replaceChildren(
      s('rect', { class: 'boundary', x: 16, y: 60, width: 104, height: 86 }),
      s('text', { class: 'blabel', x: 18, y: 54 }, 'outside your control'));

    for (const e of BEDGES) {
      const a = BNODES[e.from]; const b = BNODES[e.to];
      const x1 = a.x + a.w; const y1 = a.y + a.h / 2;
      const x2 = b.x; const y2 = b.y + b.h / 2;
      boardSvg.append(s('line', {
        class: 'bedge' + (e.cross ? ' is-cross' : '') + (edge === e.id ? ' is-on' : ''),
        x1, y1, x2, y2,
      }));
      boardSvg.append(s('line', {
        class: 'bedge-hit', x1, y1, x2, y2,
        onclick: () => { edge = e.id; drawBoard(); drawThreats(); },
      }));
      const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
      boardSvg.append(s('circle', {
        cx: mx, cy: my, r: 7.5,
        fill: 'var(--card)',
        stroke: e.cross ? 'var(--violet)' : 'var(--ink-2)',
      }));
      boardSvg.append(s('text', {
        x: mx, y: my + 3, 'text-anchor': 'middle',
        style: 'font-family:var(--mono);font-size:7.5px;fill:' + (e.cross ? 'var(--violet)' : 'var(--ink-2)'),
      }, e.id));
      boardSvg.append(s('text', {
        x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 11, 'text-anchor': 'middle',
        style: 'font-family:var(--mono);font-size:6.4px;letter-spacing:0.06em;fill:var(--ink-3)',
      }, e.cross ? 'crosses boundary' : 'inside'));
    }

    for (const [key, n] of Object.entries(BNODES)) {
      const g = s('g', { class: 'bnode' + (edge && (BEDGES.find((e) => e.id === edge).from === key || BEDGES.find((e) => e.id === edge).to === key) ? ' is-open' : '') },
        s('rect', { x: n.x, y: n.y, width: n.w, height: n.h }),
        s('text', { x: n.x + n.w / 2, y: n.y + n.h / 2 + 3 }, n.label));
      boardSvg.append(g);
    }
  }

  function drawThreats() {
    const e = BEDGES.find((x) => x.id === edge);
    edgeTitle.textContent = `Arrow ${e.id} · ${e.label}${e.cross ? ' · crosses a trust boundary' : ''}`;
    threatBox.replaceChildren(...THREATS[edge].map(([k, t]) => h('div', { class: 'threat' },
      h('b', null, k), h('span', null, t))));
    mark('tried', 'b');
  }

  drawBoard();
  drawThreats();

  const sliceList = h('div', { class: 'panel__body', style: { gap: '0.6rem' } });
  function drawSlices() {
    sliceList.replaceChildren(...st.slices.map((row, i) => h('div', { class: 'slice-row' },
      h('div', { class: 'slice-row__hd' },
        h('b', null, `slice ${pad2(i + 1)}`),
        btn('Remove', () => { st.slices.splice(i, 1); save(); drawSlices(); }, { ghost: true, small: true })),
      h('div', { class: 'grid grid--3', style: { gap: '0.4rem' } },
        field('User-visible goal', textInput({
          value: row.goal, ariaLabel: `Slice ${i + 1} goal`,
          onInput: (v) => { row.goal = v; save(); },
        })),
        field('Security in this slice', textInput({
          value: row.security, ariaLabel: `Slice ${i + 1} security`,
          onInput: (v) => { row.security = v; save(); },
        })),
        field('Done when', textInput({
          value: row.done, ariaLabel: `Slice ${i + 1} done condition`,
          onInput: (v) => { row.done = v; save(); },
        }))))));
  }
  drawSlices();

  host.append(
    h('div', { class: 'panel' },
      h('div', { class: 'panel__hd' }, h('h3', null, '01 · Scope'), h('span', null, 'one page or the scope is too big')),
      h('div', { class: 'panel__body' },
        h('div', { class: 'grid grid--2', style: { gap: '0.45rem' } },
          field('Problem', textInput({
            value: st.problem, multiline: true, rows: 2, ariaLabel: 'Problem',
            onInput: (v) => { st.problem = v; save(); },
          })),
          field('Who it is for', textInput({
            value: st.users, ariaLabel: 'Who it is for',
            onInput: (v) => { st.users = v; save(); },
          })),
          field('Explicitly not doing', textInput({
            value: st.nonGoals, multiline: true, rows: 2, ariaLabel: 'Non-goals',
            onInput: (v) => { st.nonGoals = v; save(); },
          })),
          h('div', { class: 'field' }, h('span', null, 'Done for V1'),
            ...[0, 1, 2].map((i) => textInput({
              value: st.done[i] || '', placeholder: `${i + 1}. observable condition`,
              ariaLabel: `V1 condition ${i + 1}`,
              onInput: (v) => { st.done[i] = v; save(); },
            })))))),
    h('div', { class: 'grid grid--2', style: { alignItems: 'start' } },
      h('div', { class: 'panel' },
        h('div', { class: 'panel__hd' }, h('h3', null, '02 · Trust model'), h('span', null, 'tap an arrow')),
        h('div', { class: 'panel__body' },
          h('div', { class: 'board' }, boardSvg),
          edgeTitle,
          threatBox)),
      h('div', { class: 'panel' },
        h('div', { class: 'panel__hd' }, h('h3', null, 'All six questions'), h('span', null, 'STRIDE')),
        h('div', { class: 'panel__body' },
          ...STRIDE.map(([k, name, ask]) => h('div', { class: 'threat' },
            h('b', null, `${k} · ${name}`), h('span', null, ask)))))),
    h('div', { class: 'panel' },
      h('div', { class: 'panel__hd' }, h('h3', null, '03 · Slice plan'), h('span', null, 'thin, end to end, security travels with it')),
      sliceList,
      h('div', { class: 'panel__body', style: { borderTop: '1px solid var(--rule)' } },
        btn('Add a slice', () => {
          st.slices.push({ goal: '', security: '', done: '' });
          save(); drawSlices();
        }, { ghost: true, small: true }),
        h('p', { class: 'small quiet' }, 'A slice that needs more than a few sessions is two slices.'))));

  return () => {};
}

/* =========================================================== C · research */

const STATUS = ['open', 'partly', 'answered'];
const STATUS_LABEL = { open: 'Open', partly: 'Partly', answered: 'Answered' };

function templateC(host) {
  const old = store.get('templateC', {});
  const st = {
    question: old.question || '',
    items: Array.isArray(old.items) ? old.items.map((i) => ({ text: i.text || '', status: STATUS.includes(i.status) ? i.status : 'open' })) : [],
    budget: Number(old.budget) || 45,
    stop: Array.isArray(old.stop) ? old.stop.slice(0, 3) : [false, false, false],
  };
  const save = () => store.set('templateC', st);

  const qInput = textInput({
    value: st.question, placeholder: 'the one question this work answers', ariaLabel: 'Main question',
    onInput: (v) => { st.question = v; save(); },
  });
  const draft = textInput({ placeholder: 'a sub-question one source could answer', ariaLabel: 'New sub-question' });
  const tree = h('div', { class: 'qtree' });
  const summary = h('span', null, '');

  function drawTree() {
    summary.textContent = st.items.length
      ? STATUS.map((k) => `${st.items.filter((i) => i.status === k).length} ${STATUS_LABEL[k].toLowerCase()}`).join(' · ')
      : 'no sub-questions';
    tree.replaceChildren(...(st.items.length ? st.items.map((item, i) => h('div', { class: 'qnode', 'data-status': item.status },
      h('span', { class: 'qnode__dot', 'aria-hidden': 'true' }),
      h('div', { class: 'qnode__text' }, item.text),
      h('div', { class: 'qnode__tools' },
        h('button', {
          type: 'button', 'aria-label': `Status: ${item.status}. Tap to change`,
          onclick: () => {
            item.status = STATUS[(STATUS.indexOf(item.status) + 1) % 3];
            save(); drawTree();
          },
        }, '↻'),
        h('button', {
          type: 'button', 'aria-label': `Remove ${item.text}`,
          onclick: () => { st.items.splice(i, 1); save(); drawTree(); },
        }, '×'))))
      : [h('p', { class: 'small quiet', style: { margin: 0 } }, 'Split the question until each leaf can be closed by one source or one experiment.')]));
    mark('tried', 'c');
  }
  drawTree();

  const budgetOut = h('b', null, `${st.budget}`);
  const budgetRange = h('input', { type: 'range', min: 15, max: 120, step: 5, value: st.budget, 'aria-label': 'Research budget in minutes' });
  budgetRange.addEventListener('input', () => {
    st.budget = Number(budgetRange.value); save();
    budgetOut.textContent = String(st.budget);
  });

  const stopOut = h('p', { class: 'small', style: { color: 'var(--ink-3)' } }, `${st.stop.filter(Boolean).length} of 3`);
  const stopRows = [
    'The last two sources changed nothing I can state',
    'I can state the answer in two sentences',
    'I can name its weakest assumption',
  ].map((t, i) => h('label', { class: 'checkline' },
    h('input', {
      type: 'checkbox', checked: st.stop[i],
      onchange: (e) => {
        st.stop[i] = e.currentTarget.checked; save();
        const n = st.stop.filter(Boolean).length;
        stopOut.textContent = n === 3 ? 'all three · stop reading, write it up' : `${n} of 3`;
      },
    }),
    h('span', null, t)));

  // belief entries — shared key with experiment 05
  const entries = h('div', { class: 'entrylist' });
  const bq = textInput({ placeholder: 'question', ariaLabel: 'Belief question' });
  const ba = textInput({ placeholder: 'current answer', ariaLabel: 'Belief answer' });
  let conf = 2;

  function drawEntries() {
    const list = store.get('beliefs', []);
    entries.replaceChildren(...(list.length ? list.map((e) => h('div', { class: 'entry' },
      h('p', { class: 'entry__q' }, e.question),
      h('p', { class: 'small' }, e.answer || 'No answer yet.'),
      h('div', { class: 'entry__meta' },
        h('span', null, `confidence ${e.confidence}/3`),
        h('span', null, e.date || ''),
        h('div', { class: 'entry__tools' },
          h('button', {
            type: 'button', class: 'btn btn--ghost btn--sm',
            onclick: () => {
              store.set('beliefs', list.filter((x) => x.id !== e.id));
              drawEntries();
            },
          }, 'Remove')))))
      : [h('p', { class: 'small quiet', style: { margin: 0 } }, 'No beliefs on record. The first one can be wrong — that is what confidence is for.')]));
  }
  drawEntries();
  subscribe((k) => { if (k === 'beliefs') drawEntries(); });

  host.append(
    h('div', { class: 'panel' },
      h('div', { class: 'panel__hd' }, h('h3', null, '01 · Question tree'), summary),
      h('div', { class: 'panel__body' },
        field('Main question', qInput),
        tree,
        h('div', { class: 'row' },
          h('div', { style: { flex: '1 1 9rem', minWidth: 0 } }, draft),
          btn('Add', () => {
            const v = draft.value.trim();
            if (!v) { toast('Type the sub-question first.'); return; }
            st.items.push({ text: v, status: 'open' });
            draft.value = '';
            save(); drawTree();
          }, { small: true })))),
    h('div', { class: 'grid grid--2', style: { alignItems: 'start' } },
      h('div', { class: 'panel' },
        h('div', { class: 'panel__hd' }, h('h3', null, '02 · Time box'), h('span', null, 'one extension only')),
        h('div', { class: 'panel__body' },
          h('div', { class: 'budget' }, budgetOut, h('span', null, 'minutes')),
          budgetRange,
          h('p', { class: 'small quiet' }, 'When it ends: write it up, extend once by half, or park it and ask someone.'))),
      h('div', { class: 'panel' },
        h('div', { class: 'panel__hd' }, h('h3', null, '03 · Stop rule'), stopOut),
        h('div', { class: 'panel__body' }, ...stopRows))),
    h('div', { class: 'panel' },
      h('div', { class: 'panel__hd' }, h('h3', null, '04 · Belief log'), h('span', null, 'shared with experiment 05')),
      h('div', { class: 'panel__body' },
        entries,
        h('div', { class: 'grid grid--2', style: { gap: '0.45rem' } },
          field('Question', bq),
          field('Answer', ba)),
        h('div', { class: 'row' },
          segmented({
            label: 'Confidence', value: String(conf),
            options: [['1', '1 low'], ['2', '2 med'], ['3', '3 high']],
            onChange: (v) => { conf = Number(v); },
          }),
          btn('Add entry', () => {
            if (!bq.value.trim()) { toast('A belief needs a question.'); return; }
            const list = store.get('beliefs', []);
            const entry = {
              id: String(Date.now()),
              question: bq.value.trim(),
              answer: ba.value.trim(),
              confidence: conf,
              date: new Date().toISOString().slice(0, 10),
            };
            store.set('beliefs', [entry, ...list]);
            bq.value = ''; ba.value = '';
            drawEntries();
          }, { small: true })))),
    h('div', { class: 'panel' },
      h('div', { class: 'panel__hd' }, h('h3', null, '05 · Attack it'), h('span', null, 'then update the log')),
      h('div', { class: 'panel__body' },
        btn('Open the adversarial prompt', () => openSheet('Argue against it', () => [
          h('p', null, 'Paste this after your conclusion and evidence:'),
          h('p', { class: 'mono small', style: { background: 'var(--paper)', border: '1px solid var(--rule-2)', padding: '0.6rem', lineHeight: 1.6 } },
            'Here is my conclusion and my evidence. Argue against it. Give the three strongest objections, evidence I may have ignored, the assumption most likely to be false, and one cheap test that would settle it.'),
          h('p', { class: 'small quiet' }, 'Then revise, defend with new evidence, or park it.'),
        ]), { small: true }))));

  return () => {};
}

/* ================================================================== view */

const TOOLS = [
  ['a', 'Daily workflow', 'timeline editor', 'A'],
  ['b', 'Project kickoff', 'board · threats · slices', 'B'],
  ['c', 'Research workflow', 'tree · belief · stop rule', 'C'],
];

export function benchView(which = 'a') {
  const active = TOOLS.some(([k]) => k === which) ? which : 'a';
  const root = h('div', { class: 'bench' });

  root.append(
    h('header', { class: 'exp__head', style: { borderBottom: '0' } },
      h('p', { class: 'kicker' }, h('b', null, 'Workbench'), h('span', null, 'the manual’s templates, as instruments')),
      h('h1', { class: 'exp__title' }, 'Three working tools'),
      h('p', { class: 'exp__line' }, 'Fill them in as you work. Everything is stored in this browser and included in Data → Export.')),
    h('nav', { class: 'bench__tabs', 'aria-label': 'Workbench tools' },
      ...TOOLS.map(([key, name, sub]) =>
        h('a', {
          href: `#bench/${key}`,
          'aria-current': String(key === active),
        }, h('small', null, `Template ${key.toUpperCase()}`), name, h('small', { class: 'quiet' }, sub)))),
    h('div', { class: 'wb' }));

  const body = root.querySelector('.wb');
  if (active === 'a') templateA(body);
  if (active === 'b') templateB(body);
  if (active === 'c') templateC(body);

  root.append(h('p', { class: 'small quiet', style: { padding: '0.4rem 0 0' } },
    h('span', { class: 'tag tag--manual' }, 'From the manual'), ' The fields, schedule and STRIDE table. ',
    h('span', { class: 'tag tag--read' }, 'Interpretation'), ' The defaults and worked examples.'));
  return root;
}
