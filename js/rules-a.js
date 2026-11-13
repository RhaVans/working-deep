/* rules-a.js — Rules 01 to 04. Each chapter: mechanism, figure, experiment,
   the manual's own example, takeaway, connections, one concept check. */

import {
  h, s, btn, chip, chapter, fig, note, takeaway, example, seeAlso, quiz,
  store, countTo, textInput, field, reduced, toast,
} from './core.js';

/* ============================================================== RULE 01 */

const TREE = [
  {
    label: 'Build auth', kind: 'project', open: true,
    children: [
      { label: 'Register', kind: 'milestone' },
      {
        label: 'Log in', kind: 'milestone', open: true,
        children: [
          {
            label: 'Verify password', kind: 'task', open: true,
            children: [
              { label: 'Write a failing test: wrong password returns 401', kind: 'next action' },
              { label: 'Split the lockout-window check later', kind: 'dashed', dashed: true },
            ],
          },
          { label: 'Throttle attempts', kind: 'task' },
          { label: 'Error messages', kind: 'task' },
        ],
      },
      { label: 'Sessions', kind: 'milestone' },
      { label: 'Reset password', kind: 'milestone' },
    ],
  },
];

function taskTree() {
  let opened = 0;
  let branches = 0;
  const counter = h('p', { class: 'result', 'aria-live': 'polite' });

  function countBranches(nodes) {
    for (const n of nodes) {
      if (n.children) { branches += 1; countBranches(n.children); }
    }
  }
  countBranches(TREE);

  function build(nodes, depth) {
    return nodes.map((n) => {
      const hasKids = Array.isArray(n.children);
      const expandable = hasKids;
      const kidsBox = hasKids ? h('div', null, ...build(n.children, depth + 1)) : null;
      if (kidsBox) kidsBox.hidden = !n.open;

      const btn = h('button', {
        class: 'tree__btn',
        type: 'button',
        'aria-expanded': expandable ? String(Boolean(n.open)) : undefined,
        onclick: expandable ? () => {
          const open = btn.getAttribute('aria-expanded') === 'true';
          btn.setAttribute('aria-expanded', String(!open));
          btn.querySelector('.tree__mark').textContent = open ? '+' : '−';
          kidsBox.hidden = open;
          opened += open ? -1 : 1;
          count();
        } : undefined,
      },
        h('span', { class: 'tree__mark' }, expandable ? (n.open ? '−' : '+') : '·'),
        h('span', { class: 'tree__label' }, n.label),
        h('span', { class: 'tree__kind' }, n.kind || '')
      );
      btn.style.paddingLeft = `${depth * 0.95}rem`;
      if (expandable && n.open) opened += 1;

      return h('div', { class: 'tree__node' }, btn, kidsBox);
    });
  }

  function count() {
    counter.textContent = `${opened} of ${branches} branches open. Keep splitting until the bottom row is one action you could start on a bad day.`;
  }

  const rows = build(TREE, 0);
  count();

  return fig({
    title: 'Decomposition tree',
    tag: 'manual',
    stage: h('div', null, h('div', { class: 'tree' }, rows), counter),
    caption: h('span', null,
      'Dashed branches are split later, when you reach them. The tree is the manual’s authentication example: ',
      h('b', null, 'Build auth'), ' → ', h('b', null, 'Log in'), ' → ', h('b', null, 'Verify password'), ' → one test.'),
  });
}

const VERBS = new Set(('write fix add read run open draw rename extract reproduce compare draft test check review ' +
  'list delete remove move ship log ask call split measure update create refactor trace profile summarise summarize ' +
  'sketch paste outline label capture measure print send build').split(' '));

function validator() {
  const timeSel = h('select', { 'aria-label': 'Estimated length' },
    h('option', { value: 'yes' }, 'Under about 45 minutes'),
    h('option', { value: 'no' }, 'Longer than that'));
  const doneBox = h('input', { type: 'checkbox' });
  const list = h('ul', { class: 'checklist' });
  const verdict = h('p', { class: 'result', 'aria-live': 'polite' });

  const input = textInput({
    placeholder: 'e.g. Write a failing test for wrong-password login',
    ariaLabel: 'Candidate next action',
    onInput: () => render(),
  });

  function checks() {
    const t = input.value.trim();
    const first = (t.match(/^[A-Za-z]+/) || [''])[0].toLowerCase();
    const located = /\/|\.(py|js|mjs|ts|tsx|jsx|md|json|sql|css|html|go|rs|rb|java|sh|ya?ml)\b|\b(file|page|source|test|paper|abstract|table|endpoint|route|query|log|screen|section|appendix|dataset|paragraph)\b/i.test(t);
    return [
      ['Starts with a verb', VERBS.has(first)],
      ['Names the file, page or source', located],
      ['Fits one sitting, under about 45 minutes', timeSel.value === 'yes'],
      ['You will know when it is done', doneBox.checked],
    ];
  }

  function render() {
    const rows = checks();
    const passed = rows.filter(([, ok]) => ok).length;
    list.replaceChildren(...rows.map(([label, ok]) =>
      h('li', { data: { ok: String(ok) } },
        h('span', { class: 'mark' }, ok ? '✓' : '·'),
        label)));
    const empty = !input.value.trim();
    verdict.innerHTML = '';
    verdict.append(empty
      ? 'Type a candidate. The first two checks are word-level guesses, not a parser.'
      : passed === 4
        ? h('span', null, h('b', null, 'Passes all four.'), ' Start it now — this is small enough to begin without deciding anything.')
        : h('span', null, h('b', null, `${passed} of 4.`), ' Keep splitting. An unmet test is a decision you are saving for later.'));
  }

  render();

  return h('div', { class: 'breadcrumb-sheet' },
    h('div', { class: 'grid grid--2' },
      field('Candidate next action', input, { wide: true }),
      field('One sitting?', timeSel),
      h('label', { class: 'checkline' }, doneBox, h('span', null, 'I will know when it is done'))),
    list,
    verdict);
}

function r01() {
  const { root, body } = chapter({
    id: 'r01', no: '01', title: 'Shrink the task until the next action is obvious',
    lede: 'Running out of ideas usually means you are working at too high an abstraction level. Keep splitting until you could start without deliberating.',
    removes: 'overwhelm',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        'A project is a name for a bundle of decisions. “Build auth” hides four milestones, each of which hides three or four tasks, ',
        'each of which hides steps. Sitting down in front of the bundle means making every decision at once, cold, with no information yet. ',
        'That is not a discipline problem; it is a sizing problem.'),
      h('p', null,
        'Splitting does not make the work smaller. It moves the decisions to a moment when you have the information to make them. ',
        'The next action is the only unit you actually have to be able to start.'),
      h('h3', null, 'Why it works'),
      h('ul', null,
        h('li', null, 'A named action removes the “what do I do now” loop that eats the first twenty minutes.'),
        h('li', null, 'A visible done-state turns a vague obligation into something that can end — which is what makes stopping possible.'),
        h('li', null, 'Splitting later branches is cheap; splitting everything up front is its own form of procrastination.'))
    ),

    taskTree(),

    fig({
      title: 'Experiment · right-size a next action',
      tag: 'sim',
      stage: validator(),
      caption: 'Four tests, applied to your own sentence. The last two are your judgement: only you know how long a sitting is and what “done” looks like.',
    }),

    example('From the manual — too vague, then right-sized',
      h('div', { class: 'vague-pair' },
        pair('Build auth', 'Write a failing test for wrong-password login'),
        pair('Research inflation', 'Read one paper’s abstract and conclusion; write three lines'),
        pair('Fix the dashboard', 'Reproduce the 500 on /stats with user id 4'))),

    takeaway('Work at the size where the next move needs no deliberation.'),

    seeAlso([['02 · Leave a breadcrumb', 'r02'], ['03 · Do not mix modes', 'r03'], ['06 · Challenge vs skill', 'r06']]),

    quiz({
      q: 'You sit down, read your task, and spend two minutes deciding what it actually means. What does Rule 01 say is most likely wrong?',
      options: [
        'You lack the discipline to start.',
        'The task is at too high an abstraction level to start.',
        'You need to research the problem first.',
      ],
      answer: 1,
      why: 'Deliberation at the start is the signal that the task is still too abstract. Splitting it once more is cheaper than pushing through the fog.',
    })
  );

  return root;
}

function pair(bad, good) {
  return h('div', { class: 'vague' },
    h('span', { class: 'vague__bad' }, bad),
    h('span', { class: 'vague__arrow' }, 'right-sized'),
    h('span', { class: 'vague__good' }, good));
}

/* ============================================================== RULE 02 */

const SCEN = {
  without: {
    path: 'M8,156 L120,154 C170,150 200,116 232,84 C264,54 306,40 352,36',
    rampX: 120,
    label: 're-loading context',
    ramp: '40',
    lines: '0',
  },
  with: {
    path: 'M8,150 C34,118 46,58 88,44 C156,30 252,28 352,26',
    rampX: 52,
    label: 'short ramp-up',
    ramp: '6',
    lines: '5',
  },
};

function rampFigure() {
  const groups = {};
  const stats = {};
  for (const key of ['without', 'with']) {
    const sc = SCEN[key];
    groups[key] = s('g', { class: 'ramp__g', 'aria-hidden': 'true' },
      s('rect', { x: 8, y: 22, width: Math.max(0, sc.rampX - 8), height: 136, fill: 'rgba(164,68,47,0.07)' }),
      s('line', { x1: sc.rampX, y1: 20, x2: sc.rampX, y2: 158, stroke: 'var(--rule-2)', 'stroke-width': 1, 'stroke-dasharray': '3 3' }),
      s('text', { x: sc.rampX + 5, y: 34, class: 't-faint' }, sc.label),
      s('path', { d: sc.path, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 2, 'stroke-linecap': 'round' })
    );
    const readout = h('div', { class: 'ramp__stat' }, h('b', null, sc.ramp), h('span', null, 'min to useful output'));
    const lines = h('div', { class: 'ramp__stat' }, h('b', null, sc.lines), h('span', null, 'lines written down'));
    stats[key] = [readout, lines];
  }

  const stage = h('div', { class: 'scenario' },
    h('div', { class: 'ramp' },
      h('svg', {
        class: 'diagram', viewBox: '0 0 360 176', role: 'img',
        'aria-label': 'Two session shapes: without a breadcrumb output starts late; with a breadcrumb it starts almost immediately.',
      },
        s('line', { x1: 8, y1: 158, x2: 352, y2: 158, class: 'stroke-rule' }),
        s('line', { x1: 8, y1: 22, x2: 8, y2: 158, class: 'stroke-rule' }),
        s('text', { x: 8, y: 172, class: 't-faint' }, 'time in the session'),
        s('text', { x: 14, y: 18, class: 't-faint' }, 'output'),
        groups.without, groups.with),
      h('div', { class: 'ramp__legend' },
        h('span', null, h('i', null), 'output'),
        h('span', null, h('i', { class: 'k-dash' }), 'start of useful work'))),

    h('div', { class: 'ramp__readout' }, stats.without[0], stats.without[1], stats.with[0], stats.with[1])
  );

  const toggle = h('div', { class: 'seg' },
    h('button', { type: 'button', 'aria-pressed': 'true', onclick: () => set('without') }, 'Without a breadcrumb'),
    h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => set('with') }, 'With a breadcrumb'));

  function set(key) {
    [...toggle.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === (key === 'without' ? 0 : 1))));
    groups.without.classList.toggle('is-on', key === 'without');
    groups.with.classList.toggle('is-on', key === 'with');
  }
  set('without');

  return fig({
    title: 'Cold start vs breadcrumb',
    tag: 'sim',
    stage: h('div', null, h('div', { class: 'controls' }, toggle), stage),
    caption: h('span', null,
      h('b', null, 'Illustrative shape, not measured data. '),
      'Both sessions end at roughly the same output; the difference is how much of the session was spent rebuilding context. ',
      'The minute values are placeholders chosen to make the shape readable.'),
  });
}

function breadcrumbComposer() {
  const saved = store.get('breadcrumb', { next: '', state: '', open: '', stop: '' });
  const out = h('div', { class: 'breadcrumb-out' });

  function line(label, value) {
    return h('div', null, h('b', null, label), '  ', value || '—');
  }
  function render() {
    out.replaceChildren(
      line('NEXT ', saved.next),
      line('STATE', saved.state),
      line('OPEN?', saved.open),
      line('STOP ', saved.stop));
  }
  function bind(key, label, placeholder, multiline) {
    return field(label, textInput({
      value: saved[key],
      placeholder,
      multiline,
      ariaLabel: label,
      onInput: (v) => { saved[key] = v; store.set('breadcrumb', saved); render(); },
    }), { wide: multiline });
  }
  render();

  const copy = btn('Copy', async () => {
    const text = `NEXT ${saved.next}\nSTATE ${saved.state}\nOPEN? ${saved.open}\nSTOP ${saved.stop}`;
    try {
      await navigator.clipboard.writeText(text);
      toast('Breadcrumb copied.');
    } catch {
      toast('Copy blocked by the browser. Select the text instead.');
    }
  }, { ghost: true, small: true });

  return h('div', { class: 'breadcrumb-sheet' },
    h('div', { class: 'grid grid--2' },
      bind('next', 'Next — verb + thing + where', 'Fix test_login in auth/tests.py'),
      bind('state', 'State — what works, what breaks', 'Login passes; wrong password returns 200'),
      bind('open', 'Open? — one unresolved question', 'Should a 401 also clear the cookie?'),
      bind('stop', 'Stop — mid-step, on purpose', 'Stopping after the failing test is written')),
    out,
    h('div', { class: 'controls', style: { marginTop: '0.75rem', marginBottom: '0' } }, copy));
}

function r02() {
  const { root, body } = chapter({
    id: 'r02', no: '02', title: 'Leave a breadcrumb at the end of every session',
    lede: 'Stop while you still know what comes next. Cold starts, not hard problems, are what kill momentum.',
    removes: 'cold starts',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        'The expensive part of resuming is not the thinking. It is rebuilding the state you held in your head: which file, which hypothesis, ',
        'which approach you already rejected. That state is invisible while you have it and gone by the next morning.'),
      h('p', null,
        'A breadcrumb is four prompts answered in two minutes. It converts a night of forgetting into a thirty-second read. ',
        'The trick is writing it at the moment you still know — before the break, not after.'),
      h('h3', null, 'What each line is for'),
      h('ul', null,
        h('li', null, h('strong', null, 'NEXT'), ' — a verb, a thing and a place. This is a Rule 01 next action, not a summary.'),
        h('li', null, h('strong', null, 'STATE'), ' — what currently works and what currently breaks, so you do not re-test it.'),
        h('li', null, h('strong', null, 'OPEN?'), ' — exactly one unresolved question. More than one and it becomes a plan.'),
        h('li', null, h('strong', null, 'STOP'), ' — where you deliberately stopped, so resuming does not feel like a failure.'))
    ),

    rampFigure(),

    fig({
      title: 'Experiment · write one now',
      tag: 'sim',
      stage: breadcrumbComposer(),
      caption: h('span', null,
        'The manual asks for five lines. The four prompts below usually fill them — ',
        h('span', { class: 'tag tag--read' }, 'Interpretation'),
        '. Entries are saved in this browser.'),
    }),

    example('From the manual — the field labels',
      h('div', { class: 'file-table' },
        h('div', { class: 'file-row' }, h('code', null, 'NEXT'), h('span', null, 'verb + thing + where · e.g. Fix test_login in auth/tests.py')),
        h('div', { class: 'file-row' }, h('code', null, 'STATE'), h('span', null, 'what works, what breaks')),
        h('div', { class: 'file-row' }, h('code', null, 'OPEN?'), h('span', null, 'one unresolved question')),
        h('div', { class: 'file-row' }, h('code', null, 'STOP'), h('span', null, 'mid-step, on purpose'))) ),

    takeaway(h('span', null, 'Stop while you still know what comes next. ', h('em', null, 'Two minutes to write, thirty seconds to read.'))),

    seeAlso([['01 · Shrink the task', 'r01'], ['07 · Protect your energy', 'r07'], ['Template A · Daily workflow', 'templates']]),

    quiz({
      q: 'When is the breadcrumb supposed to be written?',
      options: [
        'The next morning, when you know what you need.',
        'At the end of the session, while you still hold the context.',
        'Only when a task is finished.',
      ],
      answer: 1,
      why: 'The point is to capture context before it decays. Writing it the next morning is the cold start it was meant to prevent.',
    })
  );

  return root;
}

/* ============================================================== RULE 03 */

const MIXED = ['design', 'execute', 'review', 'design', 'execute', 'review', 'design', 'execute', 'review', 'design', 'execute', 'review'];
const SEPARATED = ['design', 'design', 'design', 'design', 'execute', 'execute', 'execute', 'execute', 'review', 'review', 'review', 'review'];
const MODE_LABEL = { design: 'Design', execute: 'Execute', review: 'Review' };
const MODE_SHORT = { design: 'DES', execute: 'EXE', review: 'REV' };

function clock(i) {
  const mins = 9 * 60 + i * 40;
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function dayFigure() {
  let modes = MIXED.slice();
  const slots = h('div', { class: 'day', role: 'group', 'aria-label': 'A day in twelve 40-minute slots. Activate a slot to change its mode.' });
  const count = h('span', { class: 'switch-count', 'aria-live': 'polite' }, '0');
  const bar = h('i');
  const summary = h('p', { class: 'result', 'aria-live': 'polite' });

  function switches() {
    let n = 0;
    for (let i = 1; i < modes.length; i += 1) if (modes[i] !== modes[i - 1]) n += 1;
    return n;
  }

  function render() {
    slots.replaceChildren(...modes.map((m, i) =>
      h('button', {
        class: 'day__slot', type: 'button', data: { mode: m },
        'aria-label': `${clock(i)} to ${clock(i)} plus 40 minutes — ${MODE_LABEL[m]}. Activate to change mode.`,
        onclick: () => {
          const order = ['design', 'execute', 'review'];
          modes[i] = order[(order.indexOf(modes[i]) + 1) % 3];
          render();
        },
      },
        h('span', null, clock(i)),
        h('span', null, MODE_SHORT[m]))));
    const n = switches();
    countTo(count, n);
    bar.style.transform = `scaleX(${(n / 11).toFixed(3)})`;
    summary.textContent = n === 0
      ? 'One mode all day. No re-orientation at all.'
      : `${n} switch${n === 1 ? '' : 'es'} today. Each one costs a re-orientation: find your place, reload the plan, remember what you were judging.`;
  }

  function preset(next) {
    modes = next.slice();
    render();
  }

  render();

  return fig({
    title: 'Experiment · build a day',
    tag: 'sim',
    stage: h('div', null,
      h('div', { class: 'controls' },
        btn('The mixed day · 11', () => preset(MIXED), { ghost: true, small: true }),
        btn('The separated day · 2', () => preset(SEPARATED), { ghost: true, small: true }),
        btn('Clear to one mode', () => preset(['design', 'design', 'design', 'design', 'design', 'design', 'design', 'design', 'design', 'design', 'design', 'design']), { ghost: true, small: true })),
      slots,
      h('div', { class: 'mode-key' },
        h('span', null, h('i', { class: 'm-design' }), 'Design'),
        h('span', null, h('i', { class: 'm-execute' }), 'Execute'),
        h('span', null, h('i', { class: 'm-review' }), 'Review')),
      h('div', { class: 'switch-track' },
        h('div', { class: 'switch-track__bar' }, bar),
        h('span', { class: 'mode-key', style: { margin: '0', whiteSpace: 'nowrap' } }, h('span', null, 'switches')),
        count),
      summary,
      h('div', { class: 'controls', style: { marginTop: '0.9rem', marginBottom: '0' } },
        h('span', { class: 'muted', style: { fontSize: '0.78rem' } }, 'Tap a slot to cycle its mode. Twelve 40-minute slots, 09:00 to 17:00.'))),
    caption: h('span', null,
      'Same eight hours, same work. The manual’s two days differ only in the order: ',
      h('b', null, '11 switches'), ' against ', h('b', null, '2 switches'), '.'),
  });
}

function r03() {
  const { root, body } = chapter({
    id: 'r03', no: '03', title: 'Do not mix modes',
    lede: 'Design, execution and review use different mental gears. Switching inside a block costs a re-orientation every time.',
    removes: 'gear-grinding',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        'The cost of a switch is not the switching. It is finding your place again, reloading the plan, and remembering what you were judging. ',
        'Each of those takes minutes, and none of them produce anything.'),
      h('p', null,
        'The fix is not fewer hours or more willpower. It is putting the same mode next to itself: design in one stretch, execute in another, ',
        'review at the end, when there is something finished to judge.')
    ),

    h('div', { class: 'mode-cards' },
      h('div', { class: 'mode-card' },
        h('h4', null, 'Design'),
        'Open questions, options, trade-offs.',
        h('span', { class: 'out' }, 'Output: a decision or a written plan'),
        h('span', { class: 'no' }, 'No production code yet.')),
      h('div', { class: 'mode-card' },
        h('h4', null, 'Execute'),
        'Following a plan that already exists.',
        h('span', { class: 'out' }, 'Output: a working increment'),
        h('span', { class: 'no' }, 'No redesigning. Doubts go to the parking lot.')),
      h('div', { class: 'mode-card' },
        h('h4', null, 'Review'),
        'Judging finished work.',
        h('span', { class: 'out' }, 'Output: a verdict and a fix list'),
        h('span', { class: 'no' }, 'No fixing while you read.'))),

    dayFigure(),

    example('From the manual — the same day, twice',
      h('p', null,
        'A day of mixed modes: 11 switches. A day of separated modes: 2 switches. ',
        'The work is identical; only the grouping changes.')),

    takeaway('A day is not the unit of work. The block is.'),

    seeAlso([['04 · Build vertical slices', 'r04'], ['07 · Protect your energy', 'r07'], ['Template A · Daily workflow', 'templates']]),

    quiz({
      q: 'You are executing a plan and notice the design is probably wrong. What does Rule 03 ask you to do?',
      options: [
        'Stop and redesign now, while the problem is fresh.',
        'Finish the increment, write the doubt in the parking lot, and design it in the next design block.',
        'Switch to review mode for an hour and decide.',
      ],
      answer: 1,
      why: 'Redesigning inside an execution block is the gear-grind the rule is about. The doubt is real; the moment is wrong. Park it and give it a design block.',
    })
  );

  return root;
}

/* ============================================================== RULE 04 */

const LAYERS = ['UI', 'API', 'Logic', 'Data'];
const FEATURES = [['Sign up', 'S'], ['Log in', 'L'], ['Add', 'A'], ['Edit', 'E'], ['Share', 'Sh']];

function sliceFigure() {
  let order = 'layer';
  let step = 0;
  let timer = null;

  const index = (layer, feature) => (order === 'layer' ? layer * 5 + feature + 1 : feature * 4 + layer + 1);

  const grid = h('div', { class: 'slice', role: 'grid', 'aria-label': 'Twenty work items: four layers by five features' });
  const banner = h('div', { class: 'pathbanner', 'aria-live': 'polite' });
  const stepLabel = h('span', { class: 'scrub__num', 'aria-live': 'polite' }, '0 / 20');
  const whatLabel = h('p', { class: 'result' });
  const scrub = h('input', { type: 'range', min: 0, max: 20, value: 0, 'aria-label': 'Steps built' });
  const playBtn = btn('Play', () => (timer ? stop() : play()));

  const cells = LAYERS.map((layer, li) =>
    FEATURES.map(([name, short], fi) => h('div', {
      class: 'slice__cell', role: 'gridcell',
      'aria-label': `${layer} — ${name}`,
      title: `${layer} — ${name}`,
    })));

  function firstPathStep() {
    let best = Infinity;
    for (let fi = 0; fi < FEATURES.length; fi += 1) {
      const need = Math.max(...LAYERS.map((_, li) => index(li, fi)));
      best = Math.min(best, need);
    }
    return best;
  }

  function render() {
    const complete = FEATURES.map((_, fi) => LAYERS.every((_, li) => index(li, fi) <= step) && step > 0);
    LAYERS.forEach((_, li) => FEATURES.forEach((_, fi) => {
      const cell = cells[li][fi];
      const idx = index(li, fi);
      cell.textContent = String(idx);
      cell.classList.toggle('is-built', idx <= step && step > 0);
      cell.classList.toggle('is-path', complete[fi] && idx <= step);
      cell.classList.toggle('is-current', idx === step);
    }));

    stepLabel.textContent = `${step} / 20`;
    scrub.value = String(step);

    // what the last placed item is
    if (step === 0) {
      whatLabel.textContent = 'Nothing built yet. Step forward one item at a time, or play the whole plan.';
    } else {
      let found = null;
      for (let li = 0; li < LAYERS.length && !found; li += 1) {
        for (let fi = 0; fi < FEATURES.length && !found; fi += 1) {
          if (index(li, fi) === step) found = { li, fi };
        }
      }
      whatLabel.textContent = found
        ? `Step ${step}: ${LAYERS[found.li]} for “${FEATURES[found.fi][0]}”.`
        : `Step ${step} of 20.`;
    }

    const first = firstPathStep();
    const reached = step >= first && step > 0;
    banner.classList.toggle('is-on', reached);
    banner.replaceChildren(
      h('b', null, reached ? `FIRST WORKING PATH AT STEP ${first} OF 20` : ''),
      reached
        ? ' — one feature now works end to end: interface, API, logic and data. Everything after this is breadth.'
        : '');
  }

  function setStep(n) {
    step = Math.max(0, Math.min(20, n));
    render();
  }

  function stop() {
    clearInterval(timer);
    timer = null;
    playBtn.textContent = 'Play';
  }

  function play() {
    if (reduced()) {
      setStep(20);
      toast('Reduced motion is on, so the plan was shown at once.');
      return;
    }
    if (step >= 20) setStep(0);
    playBtn.textContent = 'Pause';
    timer = setInterval(() => {
      setStep(step + 1);
      if (step >= 20) stop();
    }, 340);
  }

  function layout() {
    grid.replaceChildren(
      h('div', { class: 'slice__hd' }, ''),
      ...FEATURES.map(([, short]) => h('div', { class: 'slice__hd' }, short)),
      ...LAYERS.flatMap((layer, li) => [
        h('div', { class: 'slice__rowhd' }, layer),
        ...cells[li],
      ])
    );
  }

  function setOrder(next) {
    order = next;
    layout();
    setStep(0);
    render();
    [...segBox.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === (next === 'layer' ? 0 : 1))));
  }

  const segBox = h('div', { class: 'seg' },
    h('button', { type: 'button', 'aria-pressed': 'true', onclick: () => setOrder('layer') }, 'Layer by layer'),
    h('button', { type: 'button', 'aria-pressed': 'false', onclick: () => setOrder('slice') }, 'Slice by slice'));

  scrub.addEventListener('input', () => { stop(); setStep(Number(scrub.value)); });

  layout();
  render();

  return fig({
    title: 'Software construction simulator',
    tag: 'sim',
    stage: h('div', { class: 'slice-wrap' },
      h('div', { class: 'controls' }, segBox),
      grid,
      h('div', { class: 'slice__legend' },
        h('span', null, h('i', { style: { background: 'var(--ink)' } }), 'built'),
        h('span', null, h('i', { style: { background: 'var(--violet)' } }), 'first complete path'),
        h('span', null, 'S · L · A · E · Sh = Sign up · Log in · Add · Edit · Share')),
      h('div', { class: 'controls', style: { marginTop: '0.2rem' } },
        btn('‹ Back', () => { stop(); setStep(step - 1); }, { ghost: true, small: true }),
        btn('Step ›', () => { stop(); setStep(step + 1); }, { small: true }),
        playBtn,
        btn('Reset', () => { stop(); setStep(0); }, { ghost: true, small: true })),
      h('div', { class: 'scrub' }, scrub, stepLabel),
      whatLabel,
      banner),
    caption: h('span', null,
      'Twenty items: five features across four layers. The numbers in the cells are the order they are built. ',
      h('b', null, 'Layer by layer'), ' first completes a path at step 16 of 20; ', h('b', null, 'slice by slice'), ' at step 4.'),
  });
}

function r04() {
  const { root, body } = chapter({
    id: 'r04', no: '04', title: 'Build vertical slices, not layers',
    lede: 'Get one thin path working from the interface to the database before adding breadth: login, then one API call, then one page.',
    removes: 'late surprises',
  });

  body.append(
    h('div', { class: 'prose' },
      h('p', null,
        'A layer-by-layer plan looks tidy: all the interface, then all the endpoints, then all the logic, then the schema. ',
        'It also means nothing works until item sixteen, so every wrong assumption about how the pieces meet stays hidden until then — ',
        'when they are expensive to change.'),
      h('p', null,
        'A slice is one thin path all the way through. It is less code than a layer and it answers the only question that matters early: ',
        'do these four things actually fit together?')
    ),

    sliceFigure(),

    h('div', { class: 'prose' },
      h('h3', null, 'Security is per slice, not a phase'),
      h('p', null,
        'A final security phase finds structural flaws — who owns which data, how sessions work — after everything depends on them. ',
        'Those are the most expensive fixes. Per slice, each path ships with its own checks.'),
      h('p', null,
        'A 30-minute threat model before the first slice sets the list. Template B holds it, including the six STRIDE questions per arrow.'),
      h('p', null, h('a', { href: '#templates' }, 'Open Template B — software project kickoff →'))),

    example('From the manual — the thin path',
      h('p', null, 'Login, then one API call, then one page. A true slice fills all four layers: UI, API, Logic, Data.')),

    takeaway('A thin path exposes integration problems and wrong assumptions while they are cheap to change.'),

    seeAlso([['03 · Do not mix modes', 'r03'], ['01 · Shrink the task', 'r01'], ['Template B · Project kickoff', 'templates']]),

    quiz({
      q: 'What does the slice plan give you that the layered plan gives you later?',
      options: [
        'Less total code to write.',
        'An end-to-end path that exposes integration problems while they are cheap.',
        'Better runtime performance.',
      ],
      answer: 1,
      why: 'Both plans have the same twenty items. The slice just makes the first working path appear at step 4 instead of step 16, so wrong assumptions surface while the design is still soft.',
    })
  );

  return root;
}

export { r01, r02, r03, r04 };
