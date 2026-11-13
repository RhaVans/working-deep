/* rules-b.js — Rules 05 to 08. The belief log is exported so Template C
   uses the same store and the same component rather than a second copy. */

import {
  h, s, btn, chip, chapter, fig, note, takeaway, example, seeAlso, quiz,
  store, subscribe, countTo, textInput, field, slider, reduced, toast, segmented,
} from './core.js';

/* ============================================================== BELIEF LOG */

const CONF_LABEL = { 1: 'low', 2: 'medium', 3: 'high' };
const today = () => new Date().toISOString().slice(0, 10);

function dots(n) {
  return h('span', { class: 'dots', 'aria-label': `confidence ${CONF_LABEL[n]}` },
    ...[1, 2, 3].map((i) => h('i', { class: i <= n ? 'on' : '' })));
}

export function beliefLog() {
  let entries = store.get('beliefs', []);
  let editingId = null;

  const q = textInput({ placeholder: 'Did the rate cut cause the rise in hiring?', ariaLabel: 'Research question' });
  const answer = textInput({ placeholder: 'Partly. The timing fits; the size does not.', ariaLabel: 'Current answer' });
  const evidence = textInput({ placeholder: 'Which source, which number, which date', ariaLabel: 'Supporting evidence', multiline: true, rows: 2 });
  const wouldChange = textInput({ placeholder: 'Hiring rose in sectors the cut did not reach', ariaLabel: 'What would change the conclusion', multiline: true, rows: 2 });
  const conf = h('select', { 'aria-label': 'Confidence' },
    h('option', { value: '1' }, '1 · low'),
    h('option', { value: '2' }, '2 · medium'),
    h('option', { value: '3' }, '3 · high'));
  conf.value = '2';
  const date = h('input', { type: 'date', 'aria-label': 'Date' });
  date.value = today();

  const list = h('div', { class: 'belief-list' });
  const count = h('p', { class: 'result', 'aria-live': 'polite' });
  const saveBtn = btn('Add entry', save);

  function persist() {
    store.set('beliefs', entries);
    render();
  }

  function save() {
    if (!q.value.trim()) {
      toast('A belief needs a question.');
      return;
    }
    const entry = {
      id: editingId || String(Date.now()),
      question: q.value.trim(),
      answer: answer.value.trim(),
      confidence: Number(conf.value),
      evidence: evidence.value.trim(),
      wouldChange: wouldChange.value.trim(),
      date: date.value || today(),
    };
    if (editingId) entries = entries.map((e) => (e.id === editingId ? entry : e));
    else entries = [entry, ...entries];
    editingId = null;
    saveBtn.textContent = 'Add entry';
    q.value = ''; answer.value = ''; evidence.value = ''; wouldChange.value = '';
    conf.value = '2'; date.value = today();
    persist();
  }

  function edit(id) {
    const e = entries.find((x) => x.id === id);
    if (!e) return;
    editingId = id;
    q.value = e.question; answer.value = e.answer; evidence.value = e.evidence;
    wouldChange.value = e.wouldChange; conf.value = String(e.confidence); date.value = e.date;
    saveBtn.textContent = 'Save changes';
    q.focus();
  }

  function del(id) {
    entries = entries.filter((e) => e.id !== id);
    if (editingId === id) { editingId = null; saveBtn.textContent = 'Add entry'; }
    persist();
  }

  function render() {
    list.replaceChildren(...(entries.length
      ? entries.map((e) => h('div', { class: 'belief' },
        h('p', { class: 'belief__q' }, e.question),
        e.answer ? h('p', { style: { margin: '0', fontSize: '0.9rem' } }, e.answer) : null,
        h('div', { class: 'belief__row' },
          h('span', null, h('b', null, 'confidence'), dots(e.confidence)),
          h('span', null, h('b', null, 'date'), e.date),
          e.evidence ? h('span', null, h('b', null, 'evidence'), e.evidence) : null,
          e.wouldChange ? h('span', null, h('b', null, 'would change if'), e.wouldChange) : null),
        h('div', { class: 'belief__tools' },
          btn('Edit', () => edit(e.id), { ghost: true, small: true }),
          btn('Delete', () => del(e.id), { ghost: true, small: true }))))
      : [h('p', { class: 'muted', style: { fontSize: '0.86rem', margin: '0' } },
        'No entries yet. The first one can be wrong — that is what the confidence level is for.')]));
    count.textContent = entries.length
      ? `${entries.length} belief${entries.length === 1 ? '' : 's'} on record. Update one after every source.`
      : 'Each question gets a current answer, a confidence level, and a stated condition that would change your mind.';
  }

  render();

  // The same log appears in Rule 05 and Template C; keep both in step.
  subscribe((key) => {
    if (key !== 'beliefs') return;
    entries = store.get('beliefs', []);
    render();
  });

  return h('div', { class: 'breadcrumb-sheet' },
    h('div', { class: 'grid grid--2' },
      field('Question', q, { wide: true }),
      field('Current answer', answer, { wide: true }),
      field('Confidence', conf),
      field('Date', date),
      field('Supporting evidence', evidence, { wide: true }),
      field('What would change the conclusion', wouldChange, { wide: true })),
    h('div', { class: 'controls', style: { marginTop: '0.75rem' } }, saveBtn),
    count,
    list);
}

/* --------------------------------------------------------- source impact */

const IMPACT = [0.92, 0.72, 0.55, 0.34, 0.26, 0.09, 0.05, 0.03];

function impactFigure() {
  let shown = 4;
  const bars = h('div', { class: 'impact__bars' });
  const readout = h('p', { class: 'result', 'aria-live': 'polite' });

  function render() {
    const slice = IMPACT.slice(0, shown);
    bars.replaceChildren(
      ...slice.map((v) => h('div', {
        class: 'impact__bar' + (v < 0.1 ? ' is-stop' : ''),
        style: { height: `${Math.max(3, v * 100)}%` },
        title: `Source ${slice.indexOf(v) + 1}: changed the answer by ${Math.round(v * 100)}%`,
      })),
      h('div', { class: 'impact__floor', style: { bottom: '10%' } }, h('span', null, 'below the line')));
    const tail = slice.slice(-2);
    const stuck = slice.length >= 2 && tail.every((v) => v < 0.1);
    readout.textContent = stuck
      ? `Sources ${shown - 1} and ${shown} changed nothing. Two in a row below the line: the next source will probably not change your conclusion.`
      : `${shown} source${shown === 1 ? '' : 's'} read. The bars are how much each one moved the answer — illustrative, in the manual’s decreasing shape.`;
  }

  render();

  return fig({
    title: 'Experiment · stop when sources stop moving you',
    tag: 'sim',
    stage: h('div', null,
      h('div', { class: 'impact' },
        bars,
        h('div', { class: 'impact__axis' }, h('span', null, 'sources, in reading order'), h('span', null, 'change in answer'))),
      readout,
      h('div', { class: 'controls', style: { marginTop: '0.8rem', marginBottom: '0' } },
        btn('Add a source', () => { if (shown < IMPACT.length) { shown += 1; render(); } else toast('That is the end of the illustrative series.'); }, { ghost: true, small: true }),
        btn('Reset', () => { shown = 4; render(); }, { ghost: true, small: true }))),
    caption: h('span', null,
      'The decreasing shape follows the manual’s illustration. ',
      h('b', null, 'Two consecutive sources that fail to change the conclusion'), ' are the practical stop signal — a heuristic, not a law.'),
  });
}

function beliefBudget() {
  const budget = h('input', { type: 'number', min: 5, max: 240, step: 5, value: '45', 'aria-label': 'Time budget in minutes' });
  const out = h('p', { class: 'result', 'aria-live': 'polite' });
  let extended = false;

  function render() {
    const base = Number(budget.value) || 45;
    out.textContent = extended
      ? `Ends after ${Math.round(base * 1.5)} minutes. One extension used — when it ends, stop and write it up.`
      : `Ends after ${base} minutes. When it does: stop and write it up, extend once by half, or park it and ask someone.`;
  }
  budget.addEventListener('input', render);
  render();

  return h('div', { class: 'breadcrumb-sheet' },
    h('div', { class: 'grid grid--2' },
      field('Budget before you start (minutes)', budget),
      h('div', { class: 'controls', style: { alignSelf: 'end', marginBottom: '0.2rem' } },
        btn('Extend once by half', () => {
          if (extended) { toast('One extension only.'); return; }
          extended = true; render();
        }, { ghost: true, small: true }))),
    out);
}

function r05() {
  const { root, body } = chapter({
    id: 'r05', no: '05', title: 'Keep a running “what I believe now” document',
    lede: 'Research fills whatever time you give it. A belief log gives it a shape: each question gets a current answer, a confidence level, and a stated condition that would change your mind.',
    removes: 'endless digging',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        'Research without a running conclusion is indistinguishable from reading. The belief log makes the current state of your thinking explicit, ',
        'so a new source can either move it or fail to move it. That distinction is the whole mechanism: it turns an open-ended activity into one with a stop condition.'),
      h('h3', null, 'The four parts of an entry'),
      h('ul', null,
        h('li', null, h('strong', null, 'Answer'), ' — a sentence, not a topic. If it cannot be wrong, it is not an answer.'),
        h('li', null, h('strong', null, 'Confidence'), ' — one, two or three circles. Coarse on purpose: precision here is false precision.'),
        h('li', null, h('strong', null, 'Evidence'), ' — the specific source, number or observation behind the current answer.'),
        h('li', null, h('strong', null, 'What would change it'), ' — written before you find that thing, so the search cannot be quietly redefined.'))
    ),

    fig({
      title: 'Experiment · your belief log',
      tag: 'sim',
      stage: beliefLog(),
      caption: 'Saved in this browser and shared with Template C. Update it after every source, and date every change.',
    }),

    impactFigure(),

    fig({
      title: 'Experiment · every rabbit hole gets a budget',
      tag: 'sim',
      stage: beliefBudget(),
      caption: 'Set the budget before you start. One extension, then stop — the second extension is how a side question becomes the project.',
    }),

    example('From the manual — one entry',
      h('div', { class: 'file-table' },
        h('div', { class: 'file-row' }, h('code', null, 'QUESTION'), h('span', null, 'Did the rate cut cause the rise in hiring?')),
        h('div', { class: 'file-row' }, h('code', null, 'ANSWER'), h('span', null, 'Partly. The timing fits; the size does not.')),
        h('div', { class: 'file-row' }, h('code', null, 'CONFIDENCE'), h('span', null, 'medium')),
        h('div', { class: 'file-row' }, h('code', null, 'WOULD CHANGE IF'), h('span', null, 'Hiring rose in sectors the cut did not reach.'))) ),

    takeaway('A conclusion you can state is a conclusion you can stop researching.'),

    seeAlso([['08 · Diagnose before you push', 'r08'], ['Template C · Research workflow', 'templates']]),

    quiz({
      q: 'Two sources in a row fail to change your conclusion. What does the manual take that to mean?',
      options: [
        'You have proved the conclusion.',
        'Additional research may have diminishing value — a practical heuristic, not a law.',
        'You chose the wrong sources and should start again.',
      ],
      answer: 1,
      why: 'It is a stopping heuristic, not proof. The manual labels it as a practical signal that the next source probably will not move you — which is the moment to write up rather than read on.',
    })
  );

  return root;
}

/* ============================================================== RULE 06 */

function flowModel() {
  let challenge = 6;
  let skill = 5;

  const state = h('p', { class: 'flowmap__state' });
  const advice = h('div', { class: 'flowmap__advice' });
  const diff = h('p', { class: 'result' });

  const px = (sk) => 30 + (sk / 10) * 260;
  const py = (ch) => 210 - (ch / 10) * 190;

  const dot = s('circle', { r: 6.5, fill: 'var(--violet)', stroke: 'var(--paper)', 'stroke-width': 2.5, style: 'transition: transform 220ms cubic-bezier(0.2,0.7,0.2,1)' });
  const marker = s('g', null, dot);

  function render() {
    marker.setAttribute('transform', `translate(${px(skill)} ${py(challenge)})`);
    const d = challenge - skill;
    const mode = d >= 3 ? 'anxiety' : d <= -3 ? 'boredom' : 'flow';
    state.textContent = mode === 'anxiety' ? 'Anxiety' : mode === 'boredom' ? 'Boredom' : 'Flow';
    state.style.color = mode === 'anxiety' ? 'var(--clay)' : mode === 'boredom' ? 'var(--slate)' : 'var(--violet)';
    advice.replaceChildren(
      mode === 'anxiety'
        ? h('span', null, 'The task is above your current skill. ', h('a', { href: '#r01' }, 'Shrink the task'), ' until one next action is obvious.')
        : mode === 'boredom'
          ? h('span', null, 'The task is below your skill. Add a constraint, raise the bar, or take a harder variant of it.')
          : h('span', null, 'Challenge sits slightly above skill. Keep going, and keep the feedback loop short.'));
    diff.textContent = `challenge ${challenge} − skill ${skill} = ${d >= 0 ? '+' : ''}${d}. The bands are a simplification, not a measured threshold.`;
  }

  const wrap = h('div', { class: 'flowmap' },
    h('svg', {
      class: 'diagram', viewBox: '0 0 320 240', role: 'img',
      'aria-label': 'Challenge against skill. A diagonal flow channel with anxiety above it and boredom below.',
    },
      s('polygon', { points: '30,20 290,20 30,210', fill: 'rgba(164,68,47,0.07)' }),
      s('polygon', { points: '290,20 290,210 30,210', fill: 'rgba(53,100,109,0.07)' }),
      s('rect', {
        x: -1, y: 93, width: 322, height: 44,
        transform: 'rotate(-36.2 160 115)',
        fill: 'rgba(74,50,180,0.10)', stroke: 'var(--violet)', 'stroke-width': 1, 'stroke-dasharray': '4 4',
      }),
      s('line', { x1: 30, y1: 210, x2: 290, y2: 210, class: 'stroke-rule' }),
      s('line', { x1: 30, y1: 20, x2: 30, y2: 210, class: 'stroke-rule' }),
      s('text', { x: 52, y: 62, class: 't-faint' }, 'ANXIETY'),
      s('text', { x: 212, y: 196, class: 't-faint' }, 'BOREDOM'),
      s('text', { x: 138, y: 108, class: 't-violet' }, 'FLOW'),
      marker,
      s('text', { x: 30, y: 234, class: 't-faint' }, 'skill'),
      s('text', { x: 300, y: 210, class: 't-faint', transform: 'rotate(-90 300 210)' }, 'challenge')),
    h('div', null,
      h('div', null, state, advice),
      h('div', { style: { marginTop: '0.9rem', display: 'grid', gap: '0.9rem' } },
        slider({ label: 'Challenge', value: challenge, onChange: (v) => { challenge = v; render(); } }),
        slider({ label: 'Skill', value: skill, onChange: (v) => { skill = v; render(); } })),
      diff));

  render();

  return fig({
    title: 'Experiment · challenge vs skill',
    tag: 'sim',
    stage: wrap,
    caption: h('span', null,
      'The manual describes three states and a relationship, not numbers. The bands here are drawn at a fixed offset to make the model manipulable — ',
      h('span', { class: 'tag tag--read' }, 'Interpretation'), '.'),
  });
}

function r06() {
  const { root, body } = chapter({
    id: 'r06', no: '06', title: 'Match challenge to skill, and close the feedback loop',
    lede: 'Flow needs a clear goal, fast feedback, and a challenge slightly above your current skill. When it fails, the fix is almost always the task, not you.',
    removes: 'anxiety, boredom',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        'Too much challenge against too little skill is anxiety: every next move feels like it might be wrong. Too little challenge against too much skill is boredom: ',
        'the work costs nothing and the attention drifts. Both feel like personal failure and both are actually sizing information.'),
      h('h3', null, 'The three conditions'),
      h('ol', null,
        h('li', null, h('strong', null, 'A clear goal'), ' — a task you can name in one line, with a visible done-state.'),
        h('li', null, h('strong', null, 'Fast feedback'), ' — tests, a running program, a small deliverable: anything that answers “is this working?” within minutes.'),
        h('li', null, h('strong', null, 'Slightly more than your skill'), ' — enough to require attention, not enough to require luck.'))
    ),

    flowModel(),

    example('From the manual — the fix, by state',
      h('div', { class: 'file-table' },
        h('div', { class: 'file-row' }, h('code', null, 'ANXIOUS'), h('span', null, 'Shrink the task. Rule 01.')),
        h('div', { class: 'file-row' }, h('code', null, 'BORED'), h('span', null, 'Add a constraint or a harder variant.')),
        h('div', { class: 'file-row' }, h('code', null, 'NEITHER'), h('span', null, 'Keep going.'))) ),

    takeaway('When flow fails, the fix is almost always the task, not you.'),

    seeAlso([['01 · Shrink the task', 'r01'], ['08 · Diagnose before you push', 'r08'], ['07 · Protect your energy', 'r07']]),

    quiz({
      q: 'A task makes you anxious rather than absorbed. What is Rule 06’s move?',
      options: [
        'Push harder; the anxiety means it matters.',
        'Shrink the task until the next action is obvious.',
        'Add a deadline to force focus.',
      ],
      answer: 1,
      why: 'Anxiety is the signal that challenge is too far above skill. Shrinking the task lowers the challenge without lowering the goal.',
    })
  );

  return root;
}

/* ============================================================== RULE 07 */

function blockAnatomy() {
  const SEGS = [
    { key: 'setup', label: 'Set up', mins: 5, text: 'Read the breadcrumb. Open only what you need.', by: '5 min' },
    { key: 'focus', label: 'Focus', mins: 80, text: 'One thing. Phone away, notifications off.', by: '80 min' },
    { key: 'wrap', label: 'Wrap up', mins: 5, text: 'Write the breadcrumb. Park loose ideas.', by: '5 min' },
    { key: 'break', label: 'Break', mins: 20, text: 'Away from the screen.', by: '20 min' },
  ];
  const total = SEGS.reduce((a, b) => a + b.mins, 0);

  const rail = h('div', { class: 'blockrail' });
  const segEls = SEGS.map((sg) =>
    h('div', { class: 'blockrail__seg' + (sg.key === 'focus' ? ' blockrail__seg--focus' : '') }, sg.label));
  rail.append(...segEls);

  const readout = h('div', { class: 'blockrail__readout' });
  const scrub = h('input', { type: 'range', min: 0, max: total, value: '0', 'aria-label': 'Minutes into the block' });
  const clockEl = h('span', { class: 'scrub__num', 'aria-live': 'polite' });

  function stageAt(min) {
    let acc = 0;
    for (let i = 0; i < SEGS.length; i += 1) {
      acc += SEGS[i].mins;
      if (min < acc) return i;
    }
    return SEGS.length - 1;
  }

  function render() {
    const min = Number(scrub.value);
    const idx = stageAt(min);
    segEls.forEach((el, i) => {
      el.classList.toggle('is-on', i === idx);
      el.classList.toggle('is-past', i < idx);
    });
    const sg = SEGS[idx];
    readout.replaceChildren(
      h('span', null, h('b', null, 'Stage'), `${sg.label} · ${sg.by}`),
      h('span', null, h('b', null, 'Purpose'), sg.text));
    clockEl.textContent = `+${min} / ${total} min`;
  }

  scrub.addEventListener('input', render);
  render();

  return fig({
    title: 'Experiment · anatomy of one block',
    tag: 'manual',
    stage: h('div', null,
      rail,
      h('div', { class: 'scrub', style: { marginTop: '0.9rem' } }, scrub, clockEl),
      readout,
      h('div', { class: 'controls', style: { marginTop: '0.8rem', marginBottom: '0' } },
        btn('Set up', () => { scrub.value = '2'; render(); }, { ghost: true, small: true }),
        btn('Focus', () => { scrub.value = '45'; render(); }, { ghost: true, small: true }),
        btn('Wrap up', () => { scrub.value = '87'; render(); }, { ghost: true, small: true }),
        btn('Break', () => { scrub.value = '100'; render(); }, { ghost: true, small: true }))),
    caption: h('span', null,
      'The manual’s block: ', h('b', null, '5 + 80 + 5 + 20'), '. The wrap-up is not optional — it is where Rule 02 happens.'),
  });
}

function switchNetwork() {
  let active = 3;
  const svg = s('svg', { class: 'diagram', viewBox: '0 0 300 190', role: 'img' });
  const count = h('span', { class: 'switch-count', 'aria-live': 'polite' }, '3');
  const say = h('p', { class: 'result' });
  const labels = ['A', 'B', 'C', 'D', 'E'];

  function render() {
    const n = active;
    const pts = Array.from({ length: n }, (_, i) => {
      const a = (-90 + (360 / n) * i) * (Math.PI / 180);
      return [150 + Math.cos(a) * 62, 95 + Math.sin(a) * 62];
    });
    const pairs = (n * (n - 1)) / 2;
    svg.replaceChildren(
      ...pts.flatMap((p1, i) => pts.slice(i + 1).map((p2) =>
        s('line', { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1], stroke: 'var(--violet)', 'stroke-width': 1, opacity: 0.35 }))),
      ...pts.map(([x, y], i) => s('g', null,
        s('circle', { cx: x, cy: y, r: 13, fill: 'var(--paper)', stroke: 'var(--ink)', 'stroke-width': 1.2 }),
        s('text', { x, y: y + 3.5, 'text-anchor': 'middle', style: 'font-size:11px;fill:var(--ink)' }, labels[i]))));
    countTo(count, pairs);
    say.textContent = n === 1
      ? 'One project: no pairs, nothing to be pulled between.'
      : `${n} projects: ${pairs} possible pairs. Each line is a way you can be pulled mid-task.`;
  }

  const seg = segmented({
    label: 'Active projects', value: active,
    options: [1, 2, 3, 4, 5].map((n) => [n, String(n)]),
    onChange: (v) => { active = Number(v); render(); },
  });

  render();

  return fig({
    title: 'Experiment · what you keep active',
    tag: 'sim',
    stage: h('div', { class: 'net' },
      svg,
      h('div', null,
        h('div', { class: 'controls', style: { marginBottom: '0.6rem' } }, seg),
        h('div', { class: 'switch-track' }, h('span', { class: 'mode-key', style: { margin: 0 } }, h('span', null, 'pairs')), count),
        say,
        h('div', { class: 'impact__axis', style: { marginTop: '0.5rem' } },
          h('span', null, '1 → 0'),
          h('span', null, '2 → 1'),
          h('span', null, '3 → 3'),
          h('span', null, '4 → 6'),
          h('span', null, '5 → 10')))),
    caption: h('span', null,
      'The count of pairs grows faster than the list of projects. The manual’s numbers: 0, 1, 3, 6, 10.'),
  });
}

function parkingLot() {
  const area = h('textarea', {
    rows: 4, 'aria-label': 'Parking lot · one line per idea',
    placeholder: 'try websockets for sync\nread the 2019 survey\nrename the orders table',
  });
  area.value = store.get('parking', '');
  const count = h('p', { class: 'result', 'aria-live': 'polite' });

  function render() {
    const lines = area.value.split('\n').filter((l) => l.trim());
    count.textContent = lines.length
      ? `${lines.length} idea${lines.length === 1 ? '' : 's'} parked. None of them are today.`
      : 'A new idea mid-block gets one line here. Then back to work.';
  }
  area.addEventListener('input', () => { store.set('parking', area.value); render(); });
  render();

  return h('div', { class: 'breadcrumb-sheet' },
    h('label', { class: 'field' }, h('span', null, 'Parking lot · one line per idea'), area),
    count);
}

function r07() {
  const { root, body } = chapter({
    id: 'r07', no: '07', title: 'Protect your energy',
    lede: 'Burnout is mostly a scheduling and switching problem. Work in bounded blocks, limit what is active, and give stray ideas somewhere to wait.',
    removes: 'burnout',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        'Two things drain a day that are not the work itself: an unbounded session, and the number of things your attention is allowed to be pulled toward. ',
        'Both are structural. Both are fixable before the day starts.'),
      h('p', null,
        'One hard thing per day. Everything else is a bonus. Ship ugly early: polish is a tax on momentum, and ugly work in front of users beats beautiful work in a folder.')
    ),

    blockAnatomy(),

    switchNetwork(),

    fig({
      title: 'Experiment · the parking lot',
      tag: 'sim',
      stage: parkingLot(),
      caption: 'Saved in this browser and shared with Template A. The idea is not lost, which is what lets you leave it.',
    }),

    takeaway('One hard thing per day. Everything else is a bonus.'),

    seeAlso([['02 · Leave a breadcrumb', 'r02'], ['03 · Do not mix modes', 'r03'], ['Template A · Daily workflow', 'templates']]),

    quiz({
      q: 'Why does the switch count grow faster than the project list?',
      options: [
        'Because more projects mean more meetings.',
        'Because every pair of active projects is a way to be pulled mid-task, and pairs grow as n(n−1)/2.',
        'Because context switches get slower as a day goes on.',
      ],
      answer: 1,
      why: 'Five projects is not five distractions, it is ten possible pairs. That is why the manual keeps the active list at one or two.',
    })
  );

  return root;
}

/* ============================================================== RULE 08 */

const STEPS = [
  {
    what: 'Write the problem out for a stranger',
    t: '10 min',
    detail: 'Plain language, no code, no jargon. Include what you have already tried. The act of making it legible frequently surfaces the missing option on its own.',
    from: 'Cheapest. Costs ten minutes and does not break the session.',
  },
  {
    what: 'Read how others solved something similar',
    t: '20 min',
    detail: 'One or two sources, not a literature review. If nothing is relevant within twenty minutes, the problem is not a missing-input problem.',
    from: 'Costs twenty minutes and a little momentum.',
  },
  {
    what: 'Walk away from the screen',
    t: '20 min',
    detail: 'No feed, no inbox. The point is to stop reloading the same working memory. Problems often resolve during the walk rather than during the staring.',
    from: 'Breaks the session deliberately.',
  },
  {
    what: 'Switch to a different type of task',
    t: 'rest of block',
    detail: 'Something with a different shape: physical, social, mechanical, administrative. Not another hard creative task — that is the same fatigue with a new subject.',
    from: 'Most disruptive. Last resort for this block.',
  },
];

function diagnostic() {
  let current = 0;
  let condition = null;
  const stepsEls = [];
  const detail = h('div', { class: 'breadcrumb-sheet' });
  const verdict = h('p', { class: 'result', 'aria-live': 'polite' });

  const list = h('div', { class: 'ladder-steps' });

  STEPS.forEach((st, i) => {
    const el = h('button', {
      class: 'step', type: 'button',
      onclick: () => { current = i; render(); },
    },
      h('span', { class: 'step__n' }, String(i + 1)),
      h('span', { class: 'step__what' }, st.what, h('small', null, st.from)),
      h('span', { class: 'step__t' }, st.t));
    stepsEls.push(el);
    list.append(el);
  });

  const conditions = [
    { key: 'drought', title: 'Input drought', text: 'You can state the problem clearly, but you have no new options.', rec: [0, 1], out: 'Climb steps 1 and 2.' },
    { key: 'fatigue', title: 'Fatigue', text: 'You re-read the same line and cannot hold the problem in mind.', rec: [2, 3], out: 'Take steps 3 and 4.' },
  ];

  const condEls = conditions.map((c) => h('button', {
    class: 'cond', type: 'button', 'aria-pressed': 'false',
    onclick: () => {
      condition = condition === c.key ? null : c.key;
      condEls.forEach((el, i) => el.setAttribute('aria-pressed', String(conditions[i].key === condition)));
      render();
    },
  },
    h('h4', null, c.title),
    h('p', null, c.text),
    h('span', { class: 'verdict' }, c.out)));

  function render() {
    const rec = condition ? conditions.find((c) => c.key === condition).rec : [];
    stepsEls.forEach((el, i) => {
      el.classList.toggle('is-on', i === current);
      el.classList.toggle('is-past', i < current);
      el.classList.toggle('is-rec', rec.includes(i));
    });
    const st = STEPS[current];
    detail.replaceChildren(
      h('p', { style: { margin: '0', fontFamily: 'var(--serif)', fontSize: '1.02rem' } }, st.detail),
      h('p', { class: 'result', style: { marginTop: '0.6rem' } }, `Step ${current + 1} of 4 · ${st.t}. Each step disrupts your session more than the last — climb only if the one before failed.`));
    verdict.textContent = condition
      ? `${conditions.find((c) => c.key === condition).title}: ${conditions.find((c) => c.key === condition).out} Rules of thumb, not diagnoses.`
      : 'Pick the condition that matches, or climb in order without diagnosing.';
  }

  render();

  return fig({
    title: 'Experiment · diagnose, then climb',
    tag: 'manual',
    stage: h('div', null,
      list,
      h('div', { class: 'diag-conds' }, ...condEls),
      verdict,
      detail,
      h('div', { class: 'controls', style: { marginTop: '0.8rem', marginBottom: '0' } },
        btn('Climb one step', () => { current = Math.min(3, current + 1); render(); }, { small: true }),
        btn('Start over', () => { current = 0; condition = null; condEls.forEach((el) => el.setAttribute('aria-pressed', 'false')); render(); }, { ghost: true, small: true }))),
    caption: h('span', null,
      'Start with the cheapest fix and climb only if it fails. ',
      h('b', null, 'Input drought'), ' climbs 1 and 2; ', h('b', null, 'fatigue'), ' takes 3 and 4.'),
  });
}

function r08() {
  const { root, body } = chapter({
    id: 'r08', no: '08', title: 'When stuck, diagnose before you push',
    lede: 'Being out of ideas is usually an input drought or fatigue, not a lack of creativity. Start with the cheapest fix and climb only if it fails.',
    removes: 'false creative block',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        '“Blocked” is a description, not a diagnosis. Two very different states produce the same feeling of staring at a screen: ',
        'having no new options, and being too tired to process the options you have. They need opposite responses, which is why pushing through ',
        'works for one and makes the other worse.'),
      h('h3', null, 'The two states'),
      h('ul', null,
        h('li', null, h('strong', null, 'Input drought'), ' — you can state the problem, but you have no new options. More input helps.'),
        h('li', null, h('strong', null, 'Fatigue'), ' — you cannot comfortably retain or process the problem. Less input helps.'))
    ),

    diagnostic(),

    example('From the manual — the ladder, cheapest first',
      h('p', null,
        '1 · Write the problem out for a stranger (10 min) · 2 · Read how others solved something similar (20 min) · ',
        '3 · Walk away from the screen (20 min) · 4 · Switch to a different type of task (rest of block).')),

    takeaway('Being out of ideas is usually an input drought or fatigue — not a lack of creativity.'),

    seeAlso([['06 · Challenge vs skill', 'r06'], ['05 · Keep a belief log', 'r05'], ['07 · Protect your energy', 'r07']]),

    quiz({
      q: 'You have re-read the same paragraph four times and cannot hold the problem in mind. Which response fits?',
      options: [
        'Climb steps 1 and 2: write it out, then read how others solved it.',
        'Take steps 3 and 4: leave the screen, then change the type of task.',
        'Push through; the block will break if you keep working.',
      ],
      answer: 1,
      why: 'That is fatigue, not an input drought. Adding more input asks the thing that is already exhausted to do more work.',
    })
  );

  return root;
}

export { r05, r06, r07, r08 };
