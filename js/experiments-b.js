/* experiments-b.js — Experiments 05 to 08: belief, flow, attention, diagnosis. */

import {
  h, s, store, mark, reduced, clamp, every, tween, segmented,
  textInput, field, slider, experimentHead, more, btn, toast,
} from './core.js';

function frame({ no, title, line, tag = 'sim', stage, observe, detail }) {
  const root = h('div', { class: 'exp' });
  root.append(...experimentHead({ no, title, line, tag }));
  root.append(stage);
  if (observe) root.append(observe);
  if (detail) root.append(more('What this shows · where it comes from', h('p', null, detail)));
  return root;
}

const bar = (...kids) => h('div', { class: 'observe', 'aria-live': 'polite' }, ...kids);
const readout = (label, el, cls = '') => h('span', { class: cls }, label + ' ', el);

/* ============================================================ 05 · belief */

const SEED = [
  { id: 's1', label: 'Anecdotal report', kind: 'weak', impact: 0.92 },
  { id: 's2', label: 'Small pilot, n=6', kind: 'weak', impact: 0.74 },
  { id: 's3', label: 'Consistent replication', kind: 'medium', impact: 0.55 },
  { id: 's4', label: 'Measured in our own logs', kind: 'medium', impact: 0.38 },
  { id: 's5', label: 'Two independent replications', kind: 'strong', impact: 0.21 },
  { id: 's6', label: 'Direct test on our workload', kind: 'strong', impact: 0.09 },
];

const stopWords = (v) => (v >= 75 ? 'Confident enough to act' : v >= 45 ? 'Still contested' : 'Wide open');

export function exp05() {
  const saved = store.get('beliefFocus', null);
  let question = saved && saved.q ? saved.q : 'Does a written breadcrumb remove the re-entry cost of a new session?';
  let base = saved && typeof saved.base === 'number' ? saved.base : 35;
  const on = new Set(saved && Array.isArray(saved.on) ? saved.on : []);
  let belief = null;
  let stopRule = saved && typeof saved.stop === 'number' ? saved.stop : 80;

  const questionInput = textInput({
    value: question, ariaLabel: 'Research question', multiline: true, rows: 2,
    onInput: (v) => { question = v; persist(); render(); },
  });

  const track = h('div', { class: 'belief__track' });
  const pointer = h('div', { class: 'belief__pointer' });
  const value = h('b', { class: 'belief__value' }, '0%');
  const state = h('p', { class: 'belief__state' }, '');
  const list = h('div', { class: 'srcs' });
  const verdict = h('p', { class: 'small' }, '');

  // A reference, not a lookup: render() runs before this bar is mounted.
  const sourcesOut = h('b', null, '0');
  const observed = bar(
    readout('confidence', value, 'live'),
    readout('sources in', sourcesOut, ''),
    h('span', null, 'each source moves the pointer less than the one before'));

  function persist() {
    store.set('beliefFocus', { q: question, base, on: [...on], stop: stopRule });
  }

  function compute() {
    let v = base;
    const used = SEED.filter((x) => on.has(x.id));
    used.forEach((x, i) => {
      const pull = x.impact * (100 - v);
      // The manual's illustrative model: later sources move the answer less.
      v = v + pull * (1 - i * 0.08);
    });
    return clamp(Math.round(v), base, 99);
  }

  let display = 0;

  function render() {
    belief = compute();
    tween(value, belief, { suffix: '%' });
    sourcesOut.textContent = String(on.size);
    pointer.style.left = `${display}%`;
    track.setAttribute('aria-valuenow', String(belief));
    state.textContent = stopWords(belief);
    state.dataset.band = belief >= 75 ? 'high' : belief >= 45 ? 'mid' : 'low';

    list.replaceChildren(...SEED.map((x) => {
      const isOn = on.has(x.id);
      return h('button', {
        class: 'src' + (isOn ? ' is-on' : ''), type: 'button',
        'aria-pressed': String(isOn),
        onclick: () => {
          if (isOn) on.delete(x.id); else on.add(x.id);
          persist();
          render();
          mark('tried', '05');
        },
      },
        h('span', { class: 'src__bar', style: { transform: `scaleX(${x.impact})` } }),
        h('span', { class: 'src__label' }, x.label),
        h('span', { class: 'src__kind' }, x.kind),
        h('span', { class: 'src__delta' }, isOn ? 'in' : '+'));
    }));

    const over = belief >= stopRule;
    verdict.replaceChildren(
      over
        ? h('b', { class: 'ok' }, 'Stop rule met. ')
        : h('b', null, 'Below your stop rule. '),
      over
        ? 'The current answer can be written down and acted on.'
        : `Add sources or lower the rule — ${stopRule - belief} points short.`);
    if (over) mark('done', '05');
  }

  // animate the pointer itself so the movement is visible, not just the number
  (function loop() {
    if (belief !== null && Math.abs(display - belief) > 0.4) {
      display += (belief - display) * (reduced() ? 1 : 0.16);
      pointer.style.left = `${display}%`;
      requestAnimationFrame(loop);
    } else if (belief !== null) {
      display = belief;
      pointer.style.left = `${display}%`;
    } else {
      requestAnimationFrame(loop);
    }
  })();

  const stage = h('div', { class: 'stage' },
    h('div', { class: 'belief' },
      h('div', { class: 'belief__q' }, field('Research question', questionInput)),
      h('div', { class: 'belief__scale' },
        track, pointer,
        h('div', { class: 'belief__ticks', 'aria-hidden': 'true' }, ...[0, 25, 50, 75, 100].map((p) => h('span', { style: { left: `${p}%` } }, `${p}`))),
        h('div', { class: 'belief__rule', style: { left: `${stopRule}%` }, title: 'your stop rule' })),
      state,
      list,
      h('div', { class: 'row' },
        h('span', { class: 'tiny' }, 'stop rule'),
        slider({ label: 'Stop rule', min: 40, max: 95, step: 5, value: stopRule, onChange: (v) => { stopRule = v; persist(); render(); } })),
      verdict),
    h('div', { class: 'controls' },
      btn('Reset sources', () => { on.clear(); persist(); render(); }, { ghost: true, small: true }),
      btn('Add all', () => { SEED.forEach((x) => on.add(x.id)); persist(); render(); }, { ghost: true, small: true }),
      h('span', { class: 'spacer' }),
      h('span', { class: 'tiny' }, 'illustrative model · not a measurement')));

  render();
  mark('tried', '05');

  return frame({
    no: '05', title: 'Watch an answer change',
    line: 'Add evidence. The pointer moves less each time — that is the whole argument about stopping.',
    stage,
    observe: observed,
    detail: 'The impact values (0.92 down to 0.09) are the manual’s illustrative illustration of diminishing returns, not measurements of anything. Confidence starts at a stated prior and each source pulls it a fraction of the remaining distance. The stop rule is the part you control: the manual’s point is that research ends when a stated rule is met, not when you feel finished.',
  });
}

/* ============================================================== 06 · flow */

const ZONES = [
  { key: 'anxiety', min: 1.0, label: 'Anxiety', fix: 'Reduce task size', why: 'Challenge outruns skill. Cut the task until the first move is obvious.' },
  { key: 'flow', min: -1.0, max: 1.0, label: 'Flow', fix: 'Maintain', why: 'Challenge and skill are matched. Protect the block; change nothing.' },
  { key: 'boredom', max: -1.0, label: 'Boredom', fix: 'Add a constraint', why: 'Skill outruns challenge. Raise the constraint, not the hours.' },
];

const zoneOf = (skill, chal) => {
  const d = chal - skill;
  if (d > 1) return ZONES[0];
  if (d < -1) return ZONES[2];
  return ZONES[1];
};

export function exp06() {
  let skill = 5;
  let chal = 5;
  let dragging = false;

  const svg = s('svg', { class: 'flow', viewBox: '0 0 300 260', role: 'application', 'aria-label': 'Challenge against skill. Drag the point.' });
  const W = 300; const H = 260; const PAD = 30;
  const px = (v) => PAD + (v / 10) * (W - PAD * 2);
  const py = (v) => H - PAD - (v / 10) * (H - PAD * 2);

  const bands = [
    s('polygon', { class: 'fzone fzone--boredom', points: `${px(0)},${py(0)} ${px(10)},${py(0)} ${px(10)},${py(9)} ${px(0)},${py(10)}` }),
    s('polygon', { class: 'fzone fzone--flow', points: `${px(0)},${py(0)} ${px(10)},${py(0)} ${px(10)},${py(9)} ${px(0)},${py(10)}` }),
  ];

  // Draw the flow corridor as a band between chal = skill ± 1.
  const flowBand = s('polygon', {
    class: 'fband',
    points: `${px(0)},${py(1)} ${px(9)},${py(10)} ${px(10)},${py(10)} ${px(10)},${py(9)} ${px(1)},${py(0)} ${px(0)},${py(0)}`,
  });
  const anxBand = s('polygon', {
    class: 'fband fband--anx',
    points: `${px(0)},${py(1)} ${px(9)},${py(10)} ${px(10)},${py(10)} ${px(0)},${py(10)}`,
  });
  const borBand = s('polygon', {
    class: 'fband fband--bor',
    points: `${px(0)},${py(0)} ${px(0)},${py(1)} ${px(9)},${py(10)} ${px(10)},${py(0)}`,
  });
  bands[0] = borBand; bands[1] = flowBand;

  const grid = [];
  for (let i = 0; i <= 10; i += 2) {
    grid.push(s('line', { class: 'fgrid', x1: px(0), x2: px(10), y1: py(i), y2: py(i) }));
    grid.push(s('line', { class: 'fgrid', x1: px(i), x2: px(i), y1: py(0), y2: py(10) }));
  }

  const labels = [
    s('text', { class: 'fzone__label', x: px(1.2), y: py(9.4) }, 'ANXIETY'),
    s('text', { class: 'fzone__label', x: px(3.4), y: py(4.2) }, 'FLOW'),
    s('text', { class: 'fzone__label', x: px(7.6), y: py(1.3) }, 'BOREDOM'),
    s('text', { class: 'fax', x: px(10), y: H - 8, 'text-anchor': 'end' }, 'skill →'),
    s('text', { class: 'fax', x: 8, y: py(10) + 4 }, 'challenge ↑'),
  ];

  const crossH = s('line', { class: 'fcross' });
  const crossV = s('line', { class: 'fcross' });
  const point = s('circle', { class: 'fpoint', r: 9, tabindex: '0', role: 'button', 'aria-label': 'Your current challenge and skill' });
  const halo = s('circle', { class: 'fhalo', r: 16 });

  svg.append(...grid, borBand, flowBand, anxBand, crossH, crossV, halo, point, ...labels);

  const stateEl = h('div', { class: 'flow__state' }, h('b', null, 'Flow'), h('span', null, 'matched'));
  const actionEl = h('p', { class: 'flow__fix' }, 'Protect the block.');
  const whyEl = h('p', { class: 'small muted' }, 'Challenge and skill are matched. Change nothing.');
  const adapt = h('div', { class: 'adapt' }, actionEl, whyEl);

  function render() {
    const z = zoneOf(skill, chal);
    point.setAttribute('cx', px(skill));
    point.setAttribute('cy', py(chal));
    halo.setAttribute('cx', px(skill));
    halo.setAttribute('cy', py(chal));
    crossH.setAttribute('x1', px(0)); crossH.setAttribute('x2', px(10));
    crossH.setAttribute('y1', py(chal)); crossH.setAttribute('y2', py(chal));
    crossV.setAttribute('x1', px(skill)); crossV.setAttribute('x2', px(skill));
    crossV.setAttribute('y1', py(0)); crossV.setAttribute('y2', py(10));
    point.dataset.zone = z.key;
    halo.dataset.zone = z.key;
    stateEl.dataset.zone = z.key;
    stateEl.replaceChildren(h('b', null, z.label), h('span', null, z.key === 'flow' ? 'challenge ≈ skill' : z.key === 'anxiety' ? 'challenge > skill' : 'skill > challenge'));
    actionEl.textContent = z.fix;
    whyEl.textContent = z.why;
    mark('tried', '06');
    if (z.key === 'flow') mark('done', '06');
  }

  function at(evt) {
    const box = svg.getBoundingClientRect();
    const vb = 300;
    const scale = vb / box.width;
    const x = (evt.clientX - box.left) * scale;
    const y = (evt.clientY - box.top) * scale;
    skill = clamp(Math.round(((x - PAD) / (vb - PAD * 2)) * 10 * 2) / 2, 0, 10);
    chal = clamp(Math.round(((H - PAD - y) / (H - PAD * 2)) * 10 * 2) / 2, 0, 10);
    syncSliders();
    render();
  }

  svg.addEventListener('pointerdown', (e) => {
    dragging = true;
    svg.setPointerCapture(e.pointerId);
    at(e);
  });
  svg.addEventListener('pointermove', (e) => { if (dragging) at(e); });
  svg.addEventListener('pointerup', () => { dragging = false; });
  svg.addEventListener('pointercancel', () => { dragging = false; });
  svg.addEventListener('keydown', (e) => {
    const map = { ArrowUp: [0, 0.5], ArrowDown: [0, -0.5], ArrowLeft: [-0.5, 0], ArrowRight: [0.5, 0] };
    const d = map[e.key];
    if (!d) return;
    e.preventDefault();
    skill = clamp(skill + d[0], 0, 10);
    chal = clamp(chal + d[1], 0, 10);
    syncSliders();
    render();
  });

  const skillOut = h('output', null, String(skill));
  const chalOut = h('output', null, String(chal));
  const skillRange = h('input', { type: 'range', min: 0, max: 10, value: skill, 'aria-label': 'Skill' });
  const chalRange = h('input', { type: 'range', min: 0, max: 10, value: chal, 'aria-label': 'Challenge' });
  skillRange.addEventListener('input', () => { skill = Number(skillRange.value); skillOut.textContent = skillRange.value; render(); });
  chalRange.addEventListener('input', () => { chal = Number(chalRange.value); chalOut.textContent = chalRange.value; render(); });

  function syncSliders() {
    skillRange.value = String(skill);
    chalRange.value = String(chal);
    skillOut.textContent = String(skill);
    chalOut.textContent = String(chal);
  }

  const stage = h('div', { class: 'stage' },
    h('div', { class: 'flowview' },
      h('div', { class: 'flow' }, svg),
      h('div', { style: { display: 'grid', gap: '0.5rem' } },
        stateEl, actionEl,
        h('div', { style: { display: 'grid', gap: '0.2rem', marginTop: '0.3rem' } },
          h('div', { class: 'slider' }, h('label', null, h('span', null, 'Skill'), skillOut), skillRange),
          h('div', { class: 'slider' }, h('label', null, h('span', null, 'Challenge'), chalOut), chalRange)),
        adapt)),
    observed);

  render();

  return frame({
    no: '06', title: 'Drag yourself into flow',
    line: 'One point, two axes. Where it sits decides whether the fix is a smaller task or a harder one.',
    stage,
    detail: 'The manual’s model: too much challenge against skill is anxiety, too little is boredom, and adaptation runs in opposite directions in each. The three zones and the fixes are the manual’s; the coordinates are a diagram, not a psychometric scale.',
  });
}

/* ========================================================== 07 · attention */

const BLOCK = [
  { key: 'setup', label: 'setup', min: 5 },
  { key: 'focus', label: 'focus', min: 80 },
  { key: 'wrap', label: 'wrap-up', min: 5 },
  { key: 'break', label: 'break', min: 20 },
];

const pairCount = (n) => (n * (n - 1)) / 2;

export function exp07() {
  const saved = store.get('parking', null);
  let park = Array.isArray(saved) ? saved : ['check the retry limit in the uploader', 'ask about the invoice format'];
  let projects = 3;

  const svg = s('svg', { class: 'netview', viewBox: '0 0 320 240', role: 'img', 'aria-label': 'Connections between open projects' });
  const cx = 160; const cy = 118; const R = 78;
  const posFor = (i, n) => {
    const a = (Math.PI * 2 * i) / Math.max(1, n) - Math.PI / 2;
    return [cx + Math.cos(a) * R, cy + Math.sin(a) * R];
  };

  const edgesG = s('g', null);
  const nodesG = s('g', null);
  svg.append(edgesG, nodesG, s('text', { class: 'fax', x: cx, y: 232, 'text-anchor': 'middle' }, 'n(n − 1) / 2'));

  const formulas = h('div', { class: 'netformula' });
  const pairOut = h('b', { class: 'live' }, '3');
  const switchOut = h('b', { class: 'warn' }, '6');

  const rail = h('div', { class: 'blockrail' });
  const parkList = h('div', { class: 'park' });
  const parkInput = textInput({ placeholder: 'an idea that is not this task', ariaLabel: 'Add a parking-lot idea' });

  const observed = bar(
    readout('possible switches', switchOut, 'warn'),
    readout('project pairs', pairOut),
    h('span', null, 'every pair is a context you might have to rebuild'));

  function renderNet() {
    edgesG.replaceChildren();
    nodesG.replaceChildren();
    const pts = Array.from({ length: projects }, (_, i) => posFor(i, projects));
    for (let i = 0; i < projects; i += 1) {
      for (let j = i + 1; j < projects; j += 1) {
        edgesG.append(s('line', {
          class: 'edge-net',
          x1: pts[i][0], y1: pts[i][1], x2: pts[j][0], y2: pts[j][1],
          style: { animationDelay: `${(i + j) * 60}ms` },
        }));
      }
    }
    pts.forEach(([x, y], i) => {
      nodesG.append(s('g', { class: 'pnode', transform: `translate(${x} ${y})` },
        s('circle', { r: 22 }),
        s('text', { y: 4, 'text-anchor': 'middle' }, `P${i + 1}`)));
    });
    pairOut.textContent = String(pairCount(projects));
    switchOut.textContent = String(pairCount(projects));
    formulas.replaceChildren(...[1, 2, 3, 4, 5].map((n) => h('button', {
      class: 'netformula__row' + (n === projects ? ' is-on' : ''), type: 'button',
      onclick: () => { projects = n; renderNet(); mark('tried', '07'); },
    }, h('b', null, `${n} project${n > 1 ? 's' : ''}`), h('span', null, '→'), h('b', null, String(pairCount(n))))));
  }

  function renderRail() {
    rail.replaceChildren(...BLOCK.map((b) => h('div', {
      class: 'block' + (b.key === 'focus' ? ' is-focus' : ''),
      style: { flexGrow: String(b.min) },
      'data-k': b.key,
    },
      h('b', null, `${b.min}m`),
      h('span', null, b.label))),
      h('div', { class: 'railscale', 'aria-hidden': 'true' }, '0', '55', '110'));
    const focusShare = Math.round((80 / 110) * 100);
    rail.append(h('p', { class: 'tiny', style: { margin: '0.35rem 0 0' } }, `${focusShare}% of the cycle is the focus block. Setup and wrap-up exist so the next block does not pay for this one.`));
  }

  function renderPark() {
    parkList.replaceChildren(
      ...park.map((item, i) => h('div', { class: 'park__row' },
        h('span', null, item),
        btn('✓', () => { park = park.filter((_, k) => k !== i); persistPark(); renderPark(); }, { ghost: true, icon: true, ariaLabel: 'Remove' }))),
      park.length ? null : h('p', { class: 'tiny muted', style: { margin: 0 } }, 'Nothing parked. Every idea that arrives mid-block belongs here, not in the block.'));
    mark('tried', '07');
  }

  function persistPark() { store.set('parking', park); }

  const stage = h('div', { class: 'stage' },
    h('div', { class: 'netwrap' },
      h('div', { class: 'netview__box' }, svg),
      h('div', { class: 'netpanel' }, formulas)),
    h('div', { class: 'blockrail__wrap' },
      h('p', { class: 'tiny' }, 'One work block'),
      rail),
    h('div', { class: 'park__wrap' },
      h('p', { class: 'tiny' }, 'Parking lot'),
      parkList,
      h('div', { class: 'row', style: { marginTop: '0.4rem' } },
        h('div', { class: 'field', style: { flex: '1' } }, parkInput),
        btn('Park it', () => {
          const v = parkInput.value.trim();
          if (!v) return;
          park = [...park, v]; parkInput.value = ''; persistPark(); renderPark();
        }, { small: true }))),
    observed);

  renderNet();
  renderRail();
  renderPark();

  return frame({
    no: '07', title: 'Count the connections',
    line: 'Five open projects is not five times the work. It is ten relationships you keep half-loaded.',
    stage,
    detail: 'The manual gives the switching arithmetic (1 → 0, 2 → 1, 3 → 3, 4 → 6, 5 → 10) and the block shape: 5 minutes setup, 80 minutes focus, 5 minutes wrap-up, 20 minutes break. Both are reproduced literally. The network is a way of seeing the arithmetic; the parking lot is the manual’s instruction to keep interruptions out of the block.',
  });
}

/* ========================================================== 08 · diagnose */

const LADDER = [
  { key: 'stranger', n: 1, title: 'Explain it to a stranger', min: 10, why: 'Explaining forces the missing piece into words. Cheapest possible test.' },
  { key: 'read', n: 2, title: 'Read how others did it', min: 20, why: 'Input, not effort. Costs a little more and answers a different question.' },
  { key: 'walk', n: 3, title: 'Walk away from the screen', min: 20, why: 'Releases fixation. Costs a break rather than a block.' },
  { key: 'switch', n: 4, title: 'Switch task type', min: null, why: 'The expensive move: the rest of the block, and a re-entry bill tomorrow.' },
];

export function exp08() {
  let condition = 'drought';
  let rung = 0;
  const trace = h('div', { class: 'trace' });

  // References, not lookups: render() runs before this bar is mounted.
  const diagOut = h('b', null, 'input drought');
  const spentOut = h('b', null, '0');
  const whyOut = h('b', { class: 'ok' }, 'cheapest first');
  const observed = bar(
    h('span', null, 'diagnosis ', diagOut),
    h('span', null, 'minutes spent ', spentOut),
    h('span', null, whyOut));

  const stage = h('div', { class: 'stage' },
    h('div', { class: 'diag' },
      segmented({
        label: 'What kind of block is it', value: condition,
        options: [['drought', 'Input drought'], ['fatigue', 'Fatigue']],
        onChange: (v) => { condition = v; rung = 0; render(); },
      }),
      trace,
      h('div', { class: 'ladder' })),
    observed);

  const ladderEl = stage.querySelector('.ladder');

  function render() {
    let spent = 0;
    ladderEl.replaceChildren(...LADDER.map((r, i) => {
      const reachable = i <= rung;
      if (reachable && r.min) spent += r.min;
      const state = i < rung ? 'is-past' : i === rung ? 'is-now' : '';
      return h('button', {
        class: `rung ${state}` + (condition === 'fatigue' && i < 2 ? ' is-skip' : ''),
        type: 'button',
        'aria-current': String(i === rung),
        onclick: () => { rung = i; render(); mark('tried', '08'); },
      },
        h('span', { class: 'rung__n' }, String(r.n)),
        h('span', { class: 'rung__t' }, r.title),
        h('span', { class: 'rung__m' }, r.min ? `${r.min} min` : 'rest of block'),
        h('span', { class: 'rung__why' }, r.why));
    }));

    const path = condition === 'drought' ? LADDER.map((r) => r.title) : [LADDER[2].title, LADDER[3].title];
    trace.replaceChildren(...path.map((p, i) => h('span', { class: 'chip' + (i ? ' is-arrow' : '') }, p)));
    diagOut.textContent = condition === 'drought' ? 'input drought' : 'fatigue';
    spentOut.textContent = String(spent);
    whyOut.textContent = condition === 'drought' ? 'cheapest first' : 'skip the input steps';
    if (rung === LADDER.length - 1) mark('done', '08');
  }

  render();

  return frame({
    no: '08', title: 'Diagnose before you push',
    line: 'Blocked is not a diagnosis. Two conditions, two paths, and the cheap tests come first.',
    stage,
    detail: 'The manual’s ladder and its timings: 10 minutes explaining, 20 minutes reading, 20 minutes away, then the remainder of the block on a different task. The two conditions are the manual’s distinction between needing input and needing rest; the paths drawn here are this build’s reading of which rungs still apply to each.',
  });
}
