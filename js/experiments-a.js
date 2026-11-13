/* experiments-a.js — Experiments 01 to 04: size, continuity, modes, slices.
   Each returns a DOM node whose visuals are the primary content; prose lives in
   the expandable panel under the stage. */

import {
  h, s, store, mark, toast, reduced, clamp, every, tween, segmented,
  textInput, field, experimentHead, more, tagEl, btn,
} from './core.js';

function frame({ no, title, line, tag = 'sim', stage, observe, detail, note }) {
  const root = h('div', { class: 'exp' });
  // Visual first: title and one line, then the model, then the reading material.
  root.append(...experimentHead({ no, title, line, tag }));
  root.append(stage);
  if (observe) root.append(observe);
  if (detail) root.append(more('What this shows · where it comes from', h('p', null, detail)));
  if (note) root.append(note);
  return root;
}

const bar = (...kids) => h('div', { class: 'observe', 'aria-live': 'polite' }, ...kids);
const readout = (label, el, cls = '') => h('span', { class: cls }, label + ' ', el);

/* =============================================================== 01 · size */

const VERBS = ['write', 'add', 'fix', 'rename', 'delete', 'remove', 'move', 'call', 'test',
  'check', 'read', 'send', 'run', 'wire', 'verify', 'split', 'document', 'replace', 'assert', 'open', 'measure'];
const ARTEFACT = /(\.(js|ts|css|html|mjs|json|sql)\b|file|endpoint|test|table|function|component|line|screen|button|query|route|migration|schema|log)/i;
const OUTCOME = /\b(returns?|shows?|fails?|passes?|logs?|renders?|200|201|401|403|422|500|error|green|red)\b/i;

function scoreAction(text) {
  const t = text.trim();
  const first = (t.split(/\s+/)[0] || '').toLowerCase();
  const verb = VERBS.includes(first);
  const art = ARTEFACT.test(t);
  const outcome = OUTCOME.test(t);
  const pieces = [verb, art, outcome];
  const n = pieces.filter(Boolean).length;
  return { n, verb, art, outcome, empty: t.length < 3 };
}

const TREE = {
  kind: 'project', label: 'Build authentication', meta: 'project · one quarter',
  children: [
    {
      kind: 'milestone', label: 'Accounts exist', meta: 'milestone',
      children: [
        {
          kind: 'task', label: 'Sign-up form', meta: 'task',
          children: [
            {
              kind: 'step', label: 'Validate the email field', meta: 'step',
              children: [
                { kind: 'action', label: 'Write a failing test for a malformed email returning 422', meta: 'next action · 20 min' },
                { kind: 'action', label: 'Add the email pattern to validate.js', meta: 'next action · 10 min' },
                { kind: 'action', label: 'Show the field error under the input', meta: 'next action · 15 min' },
              ],
            },
            {
              kind: 'step', label: 'Store the password hash', meta: 'step',
              children: [
                { kind: 'action', label: 'Call hash() in the sign-up handler', meta: 'next action · 25 min' },
                { kind: 'action', label: 'Assert the stored row contains no plain password', meta: 'next action · 10 min' },
              ],
            },
          ],
        },
        {
          kind: 'task', label: 'Log in', meta: 'task',
          children: [
            {
              kind: 'step', label: 'Verify password', meta: 'step',
              children: [
                { kind: 'action', label: 'Write a failing test for wrong-password login returning 401', meta: 'next action · 15 min' },
                { kind: 'action', label: 'Compare the hash in the login route', meta: 'next action · 20 min' },
              ],
            },
            {
              kind: 'step', label: 'Issue a session', meta: 'step',
              children: [
                { kind: 'action', label: 'Set a signed cookie and assert it is httpOnly', meta: 'next action · 25 min' },
              ],
            },
          ],
        },
      ],
    },
    {
      kind: 'milestone', label: 'Sessions survive a restart', meta: 'milestone',
      children: [
        {
          kind: 'task', label: 'Persist sessions', meta: 'task',
          children: [{ kind: 'step', label: 'Move the store to the database', meta: 'step', children: [
            { kind: 'action', label: 'Replace the in-memory map with a session table', meta: 'next action · 30 min' },
          ] }],
        },
      ],
    },
  ],
};

const DEPTH_LABEL = ['project', 'milestone', 'task', 'step', 'next action'];

export function exp01() {
  let path = [TREE];
  const crumbs = h('div', { class: 'decomp__crumbs' });
  const depth = h('div', { class: 'ddepth' }, ...[0, 1, 2, 3, 4].map(() => h('i', null)));
  const focus = h('div', { class: 'dfocus' });
  const children = h('div', { class: 'dchildren' });
  const forgeInput = textInput({ placeholder: 'verb + thing + where', ariaLabel: 'Test an action for concreteness' });
  const meter = h('div', { class: 'forge__meter' }, ...[0, 1, 2].map(() => h('i', null)));
  const verdict = h('p', { class: 'forge__verdict' }, 'Type a candidate action. Three checks: a verb, a specific artefact, an observable result.');

  const forge = h('div', { class: 'forge' },
    h('p', { class: 'tiny' }, 'Does it fit on one sitting?'),
    h('div', { class: 'forge__row' }, h('div', { class: 'field' }, h('span', null, 'Candidate next action'), forgeInput),
      btn('Use the example', () => {
        forgeInput.value = 'Write a failing test for wrong-password login returning 401';
        forgeInput.dispatchEvent(new Event('input'));
      }, { ghost: true, small: true })),
    meter,
    verdict);

  const stage = h('div', { class: 'stage' },
    h('div', { class: 'decomp' }, crumbs, depth, focus, children, forge));

  const state = h('b', null, 'project');
  const kids = h('b', null, '2');
  const observed = bar(
    readout('level', state),
    readout('options', kids),
    h('span', null, 'each tap removes one level of vagueness'));

  function render() {
    const node = path[path.length - 1];
    const d = path.length - 1;
    crumbs.replaceChildren(...path.map((n, i) =>
      h('button', {
        class: 'crumb', type: 'button', disabled: i === path.length - 1,
        onclick: () => { path = path.slice(0, i + 1); render(); },
      }, n.label.length > 26 ? n.label.slice(0, 24) + '…' : n.label)));
    [...depth.children].forEach((el, i) => el.classList.toggle('on', i <= d));
    state.textContent = `${DEPTH_LABEL[d]} · level ${d + 1}/5`;
    kids.textContent = node.children ? String(node.children.length) : '0';
    focus.dataset.depth = String(d);
    focus.replaceChildren(
      h('p', { class: 'dfocus__kind' }, node.kind),
      h('p', { class: 'dfocus__label' }, node.label),
      h('p', { class: 'dfocus__meta' }, node.meta || ''),
      node.children ? null : h('p', { class: 'dfocus__meta', style: { color: 'var(--violet)' } }, 'this is small enough to start'));
    children.replaceChildren(...(node.children || []).map((c, i) =>
      h('button', {
        class: 'dchild', type: 'button', style: { '--i': `${i * 55}ms` },
        onclick: () => { path = [...path, c]; render(); mark('tried', '01'); },
      },
        h('span', { class: 'dchild__label' }, c.label),
        h('span', { class: 'dchild__meta' }, c.children ? `${c.kind} · ${c.children.length} below` : `${c.kind} · end of the line`))));
    if (!node.children) {
      children.append(h('p', { class: 'small muted', style: { gridColumn: '1 / -1', margin: 0 } },
        'No further division. This is the level a session starts at.'));
    }
    if (d >= 3) mark('done', '01');
  }

  forgeInput.addEventListener('input', () => {
    const t = forgeInput.value;
    const res = scoreAction(t);
    const checks = [res.verb, res.art, res.outcome];
    [...meter.children].forEach((el, i) => {
      el.classList.toggle('on', checks[i]);
      el.classList.toggle('bad', res.empty ? false : !checks[i] && i === 0);
    });
    if (res.empty) {
      verdict.textContent = 'Type a candidate action. Three checks: a verb, a specific artefact, an observable result.';
      return;
    }
    if (res.n === 3) verdict.replaceChildren(h('b', null, 'Concrete. '), 'A stranger could start this and know when it is done.');
    else if (res.n === 2) verdict.replaceChildren(h('em', null, 'Almost. '), 'One of the three is missing — ',
      res.verb ? '' : 'it does not start with an action, ', res.art ? '' : 'it names no file, test or screen, ', res.outcome ? '' : 'it has no observable result');
    else verdict.replaceChildren(h('em', null, 'Still a project. '), 'It describes an outcome, not a move. Cut it again.');
  });

  render();

  return frame({
    no: '01', title: 'Break the block until it fits',
    line: 'Tap into the tree until the work becomes something you can start in one sitting.',
    stage,
    observe: observed,
    detail: 'The manual’s example runs Build auth → Log in → Verify password → Write a failing test for wrong-password login returning 401. The depth meter tracks exactly that descent; the forge below it is a second opinion, not a rule from the manual.',
  });
}

/* ======================================================== 02 · continuity */

const curveA = (t) => 88 * (1 - Math.exp(-t / 16)) * (1 - Math.exp(-t / 3));
const curveB = (t, base) => base + (94 - base) * (1 - Math.exp(-t / 9));

export function exp02() {
  const b = store.get('breadcrumbHandoff', { next: '', state: '', open: '', stop: '' });
  const save = () => store.set('breadcrumbHandoff', b);

  let playing = false;
  let t = 0;
  let which = 'both';
  let stop = null;
  const SESSION = 45;

  const svg = s('svg', { viewBox: '0 0 340 186', role: 'img', 'aria-label': 'Focus over a 45 minute session, with and without a breadcrumb' });
  const W = 340; const H = 186;
  const X0 = 34; const X1 = 326; const Y0 = 20; const Y1 = 152;
  const px = (m) => X0 + (m / SESSION) * (X1 - X0);
  const py = (v) => Y1 - (v / 100) * (Y1 - Y0);

  function pathFor(fn) {
    const pts = [];
    for (let m = 0; m <= SESSION; m += 1) pts.push([px(m), py(fn(m))]);
    return pts.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1)).join(' ');
  }

  const gridLines = [];
  for (const v of [0, 50, 100]) {
    gridLines.push(s('line', { class: 'grid-line', x1: X0, x2: X1, y1: py(v), y2: py(v) }));
    gridLines.push(s('text', { class: 'axis-label', x: 4, y: py(v) + 2.5 }, `${v}%`));
  }
  for (const m of [0, 15, 30, 45]) {
    gridLines.push(s('line', { class: 'grid-line', x1: px(m), x2: px(m), y1: Y0, y2: Y1, opacity: 0.5 }));
    gridLines.push(s('text', { class: 'axis-label', x: px(m) - 6, y: Y1 + 12 }, `${m}m`));
  }

  const fillA = s('path', { class: 'fillA' });
  const fillB = s('path', { class: 'fillB' });
  const pA = s('path', { class: 'curveA', pathLength: '1', 'stroke-dasharray': '1 1' });
  const pB = s('path', { class: 'curveB', pathLength: '1', 'stroke-dasharray': '1 1' });
  const dotA = s('circle', { class: 'dotA', r: 3.4 });
  const dotB = s('circle', { class: 'dotB', r: 3.4 });
  const head = s('line', { class: 'playhead', y1: Y0, y2: Y1 });
  const clock = s('text', { class: 'cursor-label', y: Y0 - 6 });

  svg.append(...gridLines, fillA, fillB, pA, pB, head, dotA, dotB, clock);

  const lostA = h('b', null, '45');
  const lostB = h('b', null, '9');
  const gain = h('b', null, '+36');
  const observed = bar(
    readout('minutes lost, no breadcrumb', lostA, 'warn'),
    readout('minutes lost, with breadcrumb', lostB, 'ok'),
    readout('difference', gain, 'live'));

  const handoff = h('div', { class: 'handoff' });
  const fields = [
    ['next', 'NEXT', 'the exact next action'],
    ['state', 'STATE', 'what is true right now'],
    ['open', 'OPEN', 'the question you cannot answer'],
    ['stop', 'STOP', 'where you stopped, literally'],
  ].map(([key, label, ph]) => {
    const input = textInput({
      value: b[key], placeholder: ph, ariaLabel: label,
      onInput: (v) => { b[key] = v; save(); render(); },
    });
    return [label, input];
  });

  const baseB = () => 34 + fields.filter(([, input]) => input.value.trim()).length * 11;

  function render() {
    const base = baseB();
    const A = (m) => curveA(m);
    const B = (m) => curveB(m, base);

    fillA.setAttribute('d', `${pathFor((m) => A(m))} L ${px(SESSION)} ${Y1} L ${px(0)} ${Y1} Z`);
    fillB.setAttribute('d', `${pathFor((m) => B(m))} L ${px(SESSION)} ${Y1} L ${px(0)} ${Y1} Z`);
    pA.setAttribute('d', pathFor((m) => A(m)));
    pB.setAttribute('d', pathFor((m) => B(m)));

    const k = t / SESSION;
    pA.setAttribute('stroke-dashoffset', String(1 - k));
    pB.setAttribute('stroke-dashoffset', String(1 - k));
    head.setAttribute('x1', px(t));
    head.setAttribute('x2', px(t));
    dotA.setAttribute('cx', px(t)); dotA.setAttribute('cy', py(A(t)));
    dotB.setAttribute('cx', px(t)); dotB.setAttribute('cy', py(B(t)));
    clock.setAttribute('x', clamp(px(t) - 10, X0, X1 - 24));
    clock.setAttribute('y', Y0 - 6);
    clock.textContent = `${Math.round(t)} min`;

    const area = (fn) => {
      let sum = 0;
      for (let m = 0; m < SESSION; m += 1) sum += (fn(m) + fn(m + 1)) / 2;
      return sum / 100;
    };
    const lostAVal = Math.round(SESSION - area(A));
    const lostBVal = Math.round(SESSION - area(B));
    lostA.textContent = String(Math.max(0, lostAVal));
    lostB.textContent = String(Math.max(0, lostBVal));
    gain.textContent = `+${Math.max(0, lostAVal - lostBVal)}`;

    handoff.replaceChildren(...fields.map(([label, input]) => {
      const v = input.value.trim();
      return h('div', null, h('b', null, label + ' '), v ? v : h('span', { class: 'empty' }, '—'));
    }));
  }

  function play() {
    if (playing) { playing = false; if (stop) stop(); return; }
    playing = true;
    if (t >= SESSION) t = 0;
    const started = performance.now() - (t / SESSION) * 6000;
    stop = every(() => {
      t = clamp(((performance.now() - started) / 6000) * SESSION, 0, SESSION);
      render();
      if (t >= SESSION) { playing = false; if (stop) stop(); }
    }, 60);
  }

  const playBtn = btn('Play session', play);
  const stage = h('div', { class: 'stage' },
    h('div', { class: 'ctx' },
      h('div', { class: 'ctx__chart' }, svg),
      h('div', { class: 'ctx__legend' },
        h('span', null, h('i', { class: 'kA' }), 'no breadcrumb'),
        h('span', null, h('i', { class: 'kB' }), 'breadcrumb'),
        h('span', null, 'drag the four lines below to lift the violet curve')),
      h('div', { class: 'bcrumb' },
        h('p', { class: 'tiny' }, 'Session handoff'),
        h('div', { class: 'grid grid--2' }, ...fields.map(([label, input]) => field(label, input))),
        handoff)),
    h('div', { class: 'controls' },
      playBtn,
      segmented({
        label: 'Curve', value: which,
        options: [['a', 'No breadcrumb'], ['b', 'Breadcrumb'], ['both', 'Both']],
        onChange: (v) => { which = v; applyCurve(v); },
      }),
      btn('Reset', () => { t = 0; playing = false; if (stop) stop(); playBtn.textContent = 'Play session'; render(); }, { ghost: true, small: true })));

  const applyCurve = (v) => {
    pA.style.opacity = v === 'b' ? 0.16 : 1;
    fillA.style.opacity = v === 'b' ? 0.25 : 1;
    pB.style.opacity = v === 'a' ? 0.16 : 1;
    fillB.style.opacity = v === 'a' ? 0.25 : 1;
  };
  applyCurve(which);
  render();
  mark('tried', '02');

  const view = frame({
    no: '02', title: 'Two sessions, one difference',
    line: 'The same 45 minutes, started cold and started with three written lines.',
    stage,
    observe: observed,
    detail: 'The manual’s claim is that a written breadcrumb removes the reorientation cost at the start of a session. The curves here are illustrative — they encode that claim, not measurements. What is real is the handoff object: fill it and it is saved in this browser.',
  });

  view._destroy = () => { playing = false; if (stop) stop(); };
  return view;
}

/* ============================================================= 03 · modes */

const MODES = ['design', 'execute', 'review'];
const MODE_LABEL = { design: 'Design', execute: 'Execute', review: 'Review' };
const MIXED = ['design', 'execute', 'review', 'execute', 'design', 'execute', 'review', 'execute', 'design', 'execute', 'review', 'execute'];
const SEPARATED = ['design', 'design', 'design', 'execute', 'execute', 'execute', 'execute', 'execute', 'execute', 'review', 'review', 'review'];

const switchesOf = (arr) => arr.reduce((n, m, i) => (i && m !== arr[i - 1] ? n + 1 : n), 0);

export function exp03() {
  let modes = [...MIXED];
  let playAt = -1;
  let stop = null;

  const strip = h('div', { class: 'modes__strip', role: 'group', 'aria-label': 'Workday timeline, tap a slot to change its mode' });
  const marks = h('div', { class: 'switchmarks', 'aria-hidden': 'true' });
  const switchNum = h('b', null, '11');
  const costNum = h('b', null, '88');
  const runNum = h('b', null, '1');
  const costFill = h('i');
  const costBar = h('div', { class: 'costbar' }, costFill);

  const observed = bar(
    readout('mode switches', switchNum, 'warn'),
    readout('re-entry cost, minutes', costNum),
    readout('longest run', runNum),
    h('span', null, 'cost assumes ≈8 min per switch · interpretation'));

  function render() {
    const n = switchesOf(modes);
    strip.replaceChildren(...modes.map((m, i) => h('button', {
      class: 'slot' + (i === playAt ? ' is-play' : ''),
      type: 'button',
      'data-mode': m,
      'aria-label': `Slot ${i + 1}, ${MODE_LABEL[m]}. Tap to change`,
      onclick: () => {
        modes[i] = MODES[(MODES.indexOf(modes[i]) + 1) % 3];
        render();
      },
    },
      h('span', null, MODE_LABEL[m].slice(0, 1)),
      h('span', null, `${String(9 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`))));

    marks.replaceChildren(...modes.map((m, i) => h('i', { class: i && m !== modes[i - 1] ? 'on' : '' })));

    let longest = 1; let run = 1;
    for (let i = 1; i < modes.length; i += 1) {
      run = modes[i] === modes[i - 1] ? run + 1 : 1;
      longest = Math.max(longest, run);
    }
    tween(switchNum, n);
    tween(bigSwitch, n);
    tween(costNum, n * 8);
    tween(bigCost, n * 8);
    runNum.textContent = String(longest);
    bigRun.textContent = String(longest);
    costFill.style.transform = `scaleX(${clamp(n * 8 / 96, 0.02, 1)})`;
    mark('tried', '03');
    if (n <= 2) mark('done', '03');
  }

  function play() {
    if (stop) { stop(); stop = null; playAt = -1; render(); return; }
    playAt = 0;
    render();
    stop = every(() => {
      playAt += 1;
      if (playAt >= modes.length) { stop(); stop = null; playAt = -1; render(); return; }
      render();
    }, 260);
  }

  const bigSwitch = h('b', { class: 'num' }, '11');
  const bigCost = h('b', { class: 'num' }, '88');
  const bigRun = h('b', { class: 'num' }, '1');

  const stage = h('div', { class: 'stage' },
    h('div', { class: 'modes' },
      marks,
      strip,
      costBar,
      h('div', { class: 'modes__stats' },
        h('div', { class: 'stat' }, bigSwitch, h('span', null, 'switches')),
        h('div', { class: 'stat stat--cost' }, bigCost, h('span', null, 'minutes of re-entry')),
        h('div', { class: 'stat' }, bigRun, h('span', null, 'longest run'))),
      h('div', { class: 'modes__legend' },
        h('span', null, h('i', { style: { background: '#ddd6f6' } }), 'design'),
        h('span', null, h('i', { style: { background: 'var(--ink)' } }), 'execute'),
        h('span', null, h('i', { style: { background: '#cfdedb' } }), 'review'))),
    h('div', { class: 'controls' },
      h('button', { class: 'btn btn--ghost', type: 'button', onclick: play }, 'Animate the day'),
      btn('Mixed · 11 switches', () => { modes = [...MIXED]; playAt = -1; render(); }, { ghost: true, small: true }),
      btn('Separated · 2 switches', () => { modes = [...SEPARATED]; playAt = -1; render(); }, { ghost: true, small: true }),
      h('span', { class: 'spacer' }),
      h('span', { class: 'tiny' }, 'tap a slot to cycle')));

  render();

  const view = frame({
    no: '03', title: 'The same day, two orders',
    line: 'Twelve slots. Alternate the modes and the day is all re-entry; group them and it is two switches.',
    stage,
    observe: observed,
    detail: 'The manual’s comparison is 11 switches against 2 for the same amount of design, execution and review. This timeline reproduces both exactly: the mixed preset alternates, the separated one groups. The eight-minute cost per switch is this build’s estimate, not the manual’s number.',
  });

  view._destroy = () => { if (stop) stop(); };
  return view;
}

/* ============================================================ 04 · slices */

const ROWS = [
  ['ui', 'UI'], ['api', 'API'], ['logic', 'LOGIC'], ['data', 'DATA'],
];
const COLS = ['Sign up', 'Log in', 'Add', 'Edit', 'Share'];
const COLOR_NAMES = ['S01', 'S02', 'S03', 'S04', 'S05'];

function orderFor(kind, security) {
  const steps = [];
  if (kind === 'layered') {
    for (const [row] of ROWS) {
      for (let c = 0; c < COLS.length; c += 1) steps.push({ row, col: c });
    }
    if (security) for (let c = 0; c < COLS.length; c += 1) steps.push({ row: 'sec', col: c });
  } else {
    for (let c = 0; c < COLS.length; c += 1) {
      for (const [row] of ROWS) steps.push({ row, col: c });
    }
  }
  return steps;
}

export function exp04() {
  let kind = 'layered';
  let security = true;
  let step = 0;
  let playing = false;
  let stop = null;

  const grid = h('div', { class: 'slicegrid' });
  const flags = h('div', { class: 'sliceflags' });
  const scrub = h('input', { type: 'range', min: 0, max: 20, value: '0', 'aria-label': 'Step through the build' });
  const playBtn = btn('Play', () => toggle(), { icon: true });
  const stepLabel = h('b', null, '0 / 20');
  const secLabel = h('b', null, '0 / 5');
  const secRead = readout('security pass · owed', secLabel, 'warn');

  // References, not lookups: render() runs before this bar is mounted.
  const firstOut = h('b', { class: 'live' }, '—');
  const unguardedOut = h('b', { class: 'warn' }, '—');
  const observed = bar(
    readout('step', stepLabel),
    secRead,
    h('span', null, 'first end-to-end feature at step ', firstOut),
    h('span', null, 'live without their check ', unguardedOut));

  function currentOrder() { return orderFor(kind, security); }

  function render() {
    const order = currentOrder();
    const total = order.length;
    const taken = order.slice(0, step);
    const built = new Set(taken.map((x) => `${x.row}-${x.col}`));
    // Security work is not a feature-building step. The denominator stays at the
    // twenty cells in both orders; the checks get their own counter beside it.
    const buildTotal = ROWS.length * COLS.length;
    const coreTaken = taken.filter((x) => x.row !== 'sec').length;
    const secTaken = taken.filter((x) => x.row === 'sec').length;
    // Slice order ships the check with the data cell, so no feature is ever
    // live without it. Layer order leaves that window open until the end.
    if (kind === 'sliced' && security) {
      for (const x of taken) if (x.row === 'data') built.add(`sec-${x.col}`);
    }

    const heads = [h('div', { class: 'colhead', 'aria-hidden': 'true' }, 'layer')];
    COLS.forEach((name, c) => {
      const complete = ROWS.every(([row]) => built.has(`${row}-${c}`));
      heads.push(h('div', { class: 'colhead' + (complete ? ' is-done' : '') }, name));
    });

    grid.replaceChildren(...heads);
    for (const [row, label] of ROWS) {
      grid.append(h('div', { class: 'rowhead' }, label));
      for (let c = 0; c < COLS.length; c += 1) {
        const isBuilt = built.has(`${row}-${c}`);
        const colDone = ROWS.every(([r]) => built.has(`${r}-${c}`));
        const isLast = order[step - 1] && order[step - 1].row === row && order[step - 1].col === c;
        grid.append(h('div', {
          class: 'cell' + (isLast ? ' is-current' : ''),
          'data-state': isBuilt ? (colDone ? 'path' : 'built') : '',
          title: `${label} · ${COLS[c]}${isBuilt ? ' · built' : ''}`,
        }, isBuilt ? '·' : ''));
      }
    }
    if (security) {
      grid.append(h('div', { class: 'rowhead' }, 'SEC'));
      for (let c = 0; c < COLS.length; c += 1) {
        const isBuilt = built.has(`sec-${c}`);
        grid.append(h('div', {
          class: 'cell' + (order[step - 1] && order[step - 1].row === 'sec' && order[step - 1].col === c ? ' is-current' : ''),
          'data-state': isBuilt ? 'sec' : '',
          title: `security work · ${COLS[c]}`,
        }, isBuilt ? '✓' : ''));
      }
    }

    let first = null;
    for (let i = 1; i <= step; i += 1) {
      const done = new Set(order.slice(0, i).map((x) => `${x.row}-${x.col}`));
      if (ROWS.every(([r]) => done.has(`${r}-0`))) { first = i; break; }
    }
    const completeCols = COLS.filter((_, c) => ROWS.every(([r]) => built.has(`${r}-${c}`))).length;
    const unguarded = security
      ? COLS.filter((_, c) => built.has(`data-${c}`) && !built.has(`sec-${c}`)).length
      : 0;

    scrub.max = String(total);
    scrub.value = String(step);
    stepLabel.textContent = `${coreTaken} / ${buildTotal}`;
    secLabel.textContent = `${secTaken} / ${COLS.length}`;
    // In layer order the checks are a separate pass at the end; with slices they
    // arrive inside the slice, so there is nothing extra to count.
    const secShown = security && kind === 'layered' && coreTaken >= buildTotal;
    secRead.style.display = secShown ? '' : 'none';
    secRead.firstChild.textContent = secTaken === 0 ? 'security pass · owed ' : 'security pass · done ';
    firstOut.textContent = first ? String(first) : '—';
    unguardedOut.textContent = String(unguarded);
    flags.replaceChildren(
      h('span', null, 'complete features ', h('b', null, `${completeCols}/5`)),
      h('span', null, 'steps taken ', h('b', null, `${coreTaken}`)),
      h('span', { class: first ? 'hot' : '' }, first ? `end-to-end reached at ${first}` : 'nothing works end to end yet'));
    mark('tried', '04');
    if (step >= total) mark('done', '04');
  }

  function toggle() {
    if (playing) {
      playing = false;
      if (stop) stop();
      playBtn.textContent = 'Play';
      return;
    }
    playing = true;
    playBtn.textContent = 'Pause';
    const total = currentOrder().length;
    if (step >= total) step = 0;
    stop = every(() => {
      step += 1;
      render();
      if (step >= total) {
        playing = false;
        if (stop) stop();
        playBtn.textContent = 'Replay';
      }
    }, reduced() ? 60 : 300);
  }

  scrub.addEventListener('input', () => {
    step = Number(scrub.value);
    if (playing) { playing = false; if (stop) stop(); playBtn.textContent = 'Play'; }
    render();
  });

  const stage = h('div', { class: 'stage' },
    h('div', { class: 'sliceview' }, grid,
      h('div', { class: 'playbar' },
        btn('◀', () => { step = Math.max(0, step - 1); render(); }, { ghost: true, icon: true, ariaLabel: 'Previous step' }),
        playBtn,
        btn('▶', () => { step = Math.min(currentOrder().length, step + 1); render(); }, { ghost: true, icon: true, ariaLabel: 'Next step' }),
        h('div', { class: 'scrub' }, scrub),
        btn('Reset', () => { step = 0; if (stop) stop(); playing = false; playBtn.textContent = 'Play'; render(); }, { ghost: true, small: true }))),
    h('div', { class: 'controls' },
      segmented({
        label: 'Build order', value: kind,
        options: [['layered', 'Layer by layer'], ['sliced', 'Slice by slice']],
        onChange: (v) => { kind = v; step = 0; if (stop) stop(); playing = false; playBtn.textContent = 'Play'; render(); },
      }),
      h('label', { class: 'checkline', style: { marginLeft: '0.3rem' } },
        h('input', {
          type: 'checkbox', checked: security,
          onchange: (e) => { security = e.currentTarget.checked; step = 0; render(); },
        }),
        h('span', null, 'Include security work'))),
    observed);

  render();

  const view = frame({
    no: '04', title: 'When does anything actually work?',
    line: 'Twenty cells, two build orders. Step through and watch the moment a feature becomes real.',
    stage,
    detail: 'The manual’s numbers: layer by layer, the first working feature arrives at step 16 of 20; slice by slice, at step 4. This grid is 4 layers × 5 features, so both numbers fall out of the ordering — nothing is hard-coded except the shape. The denominator is the twenty cells in both orders; security work is counted separately, because in layer order it is a second pass after everything is live, and in slice order it ships inside the data cell. That row is the second half of the argument: when the check ships with the slice, no feature is ever live without it.',
  });

  view._destroy = () => { if (stop) stop(); };
  return view;
}
