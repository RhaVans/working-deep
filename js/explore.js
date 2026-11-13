/* explore.js — the system map. Eight rules as a navigable spatial graph.
   Connections are labelled as system interpretation, never as the manual's claims. */

import { h, s, store, mark, openSheet, tagEl } from './core.js';

export const NODES = [
  {
    id: '01', key: 'r01', label: 'shrink', title: 'Shrink the task',
    mech: 'A task you cannot start is a size problem. Cut it until one next action is obvious.',
    role: 'sets the entry point',
  },
  {
    id: '02', key: 'r02', label: 'breadcrumb', title: 'Leave a breadcrumb',
    mech: 'Working memory does not survive a session. Three written lines carry it across.',
    role: 'carries state between sessions',
  },
  {
    id: '03', key: 'r03', label: 'modes', title: 'Do not mix modes',
    mech: 'Design, execute and review use different machinery. Switching is paid in re-entry.',
    role: 'sets the mode of a block',
  },
  {
    id: '04', key: 'r04', label: 'slices', title: 'Build vertical slices',
    mech: 'One thin end-to-end path tells you the truth early. Layers hide risk until it is expensive.',
    role: 'reduces integration risk',
  },
  {
    id: '05', key: 'r05', label: 'belief log', title: 'Keep a belief log',
    mech: 'A current answer, a confidence level and a falsifier make research stoppable.',
    role: 'steers research',
  },
  {
    id: '06', key: 'r06', label: 'challenge', title: 'Match challenge to skill',
    mech: 'Too much challenge is anxiety, too little is boredom. Both are sizing information.',
    role: 'calibrates difficulty',
  },
  {
    id: '07', key: 'r07', label: 'energy', title: 'Protect your energy',
    mech: 'Bounded blocks and a short active list cap the two real drains: open sessions and switches.',
    role: 'caps load',
  },
  {
    id: '08', key: 'r08', label: 'diagnose', title: 'Diagnose before you push',
    mech: 'Blocked is a description. Drought needs input, fatigue needs less. Climb cheapest first.',
    role: 'recovers a stalled block',
  },
];

// `read` marks the link as an inference of this build, not a claim in the manual.
const EDGES = [
  ['01', '02', 'hands over one next action'],
  ['02', '03', 'names the mode the block will need'],
  ['03', '07', 'every switch is paid from the same budget'],
  ['07', '08', 'fatigue is what gets misread as a block'],
  ['08', '01', 'a diagnosis ends in a smaller task'],
  ['01', '06', 'size is how you lower challenge'],
  ['06', '07', 'calibration is what keeps a block workable'],
  ['04', '05', 'a working slice shows you what you do not know'],
  ['05', '08', 'a stated falsifier tells you when to stop'],
  ['02', '07', 'state crosses the break instead of the whole project'],
];

const POS = {
  wide: {
    '01': [150, 150], '02': [450, 100], '03': [745, 165], '04': [745, 385],
    '05': [455, 295], '06': [165, 330], '07': [205, 512], '08': [520, 512],
  },
  narrow: {
    '01': [98, 82], '02': [268, 158], '06': [92, 236], '03': [282, 300],
    '07': [104, 392], '04': [276, 452], '08': [148, 558], '05': [268, 634],
  },
};

const byId = (id) => NODES.find((n) => n.id === id);
const neighbours = (id) => {
  const out = new Set();
  for (const [a, b] of EDGES) {
    if (a === id) out.add(b);
    if (b === id) out.add(a);
  }
  return out;
};

export function exploreView() {
  const root = h('div', { class: 'exp' });
  let selected = null;

  const svgBox = h('div', { class: 'mapwrap' });
  const detail = h('div', { class: 'mapdetail' });

  const stage = h('div', { class: 'stage' }, svgBox, detail);
  root.append(
    h('header', { class: 'exp__head' },
      h('p', { class: 'kicker' }, h('b', null, 'Explore'), h('span', null, 'the system, not the syllabus')),
      h('h1', { class: 'exp__title' }, 'Eight rules, one loop'),
      h('p', { class: 'exp__line' }, 'Tap a rule to see what it does to the others. The loop runs from starting a task to recovering a stalled one.')),
    stage,
    h('details', { class: 'more' },
      h('summary', null, 'How to read this map'),
      h('div', { class: 'more__body' },
        h('p', null, h('b', null, 'The eight rules are the manual’s.'), ' The lines between them are this build’s reading of how they support each other, and they are labelled that way — the manual presents the rules as a set, not as a graph.'),
        h('p', null, 'Open any node to see the mechanism in one sentence, then step straight into its experiment.')))
  );

  let isWide = innerWidth >= 720;
  let edgeEls = new Map();
  let nodeEls = new Map();

  function draw() {
    const layout = isWide ? POS.wide : POS.narrow;
    const W = isWide ? 900 : 380;
    const H = isWide ? 620 : 720;
    const r = isWide ? 30 : 27;

    const svg = s('svg', {
      class: 'map',
      viewBox: `0 0 ${W} ${H}`,
      role: 'group',
      'aria-label': 'System map of the eight rules. Each node opens its experiment.',
    });

    if (isWide) {
      svg.append(s('circle', { class: 'hub', cx: 455, cy: 305, r: 196 }));
      svg.append(s('text', { x: 455, y: 96, 'text-anchor': 'middle', class: 'elabel is-on' }, ''));
    }

    edgeEls = new Map();
    for (const [a, b, label] of EDGES) {
      const [x1, y1] = layout[a];
      const [x2, y2] = layout[b];
      // shorten the line so it meets the circle edge, not its centre
      const dx = x2 - x1; const dy = y2 - y1;
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len; const uy = dy / len;
      const xa = x1 + ux * (r + 3); const ya = y1 + uy * (r + 3);
      const xb = x2 - ux * (r + 3); const yb = y2 - uy * (r + 3);

      const line = s('line', { class: 'edge', x1: xa, y1: ya, x2: xb, y2: yb });
      svg.append(line);
      if (isWide) {
        const t = s('text', {
          class: 'elabel',
          x: (xa + xb) / 2,
          y: (ya + yb) / 2 - 4,
          'text-anchor': 'middle',
        }, label);
        svg.append(t);
        edgeEls.set(`${a}-${b}`, { line, text: t });
      } else {
        edgeEls.set(`${a}-${b}`, { line, text: null });
      }
    }

    nodeEls = new Map();
    for (const n of NODES) {
      const [x, y] = layout[n.id];
      const g = s('g', {
        class: 'node', tabindex: '0', role: 'button',
        'aria-label': `${n.id} ${n.title}`,
        transform: `translate(${x} ${y})`,
      },
        s('circle', { class: 'node__ring', r }),
        s('text', { class: 'node__num', y: isWide ? -4 : -3 }, n.id),
        s('text', { class: 'node__label', y: isWide ? 10 : 9 }, n.label));
      g.addEventListener('click', () => select(n.id));
      g.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(n.id); }
      });
      if (isWide) {
        g.addEventListener('mouseenter', () => paint(n.id));
        g.addEventListener('mouseleave', () => paint(selected));
      }
      svg.append(g);
      nodeEls.set(n.id, g);
    }

    svgBox.replaceChildren(svg);
    if (!isWide) svgBox.append(h('p', { class: 'map__hint' }, 'tap a node'));
    paint(selected);
  }

  function paint(id) {
    const near = id ? neighbours(id) : new Set();
    for (const [key, g] of nodeEls) {
      g.classList.toggle('is-on', key === id);
      g.classList.toggle('is-near', key !== id && near.has(key));
      g.classList.toggle('is-dim', !!id && key !== id && !near.has(key));
    }
    for (const [a, b, label] of EDGES) {
      const el = edgeEls.get(`${a}-${b}`);
      if (!el) continue;
      const on = id && (a === id || b === id);
      el.line.classList.toggle('is-on', !!on);
      el.line.classList.toggle('is-dim', !!id && !on);
      if (el.text) {
        el.text.classList.toggle('is-on', !!on);
        el.text.textContent = label;
      }
    }
  }

  function select(id) {
    selected = id;
    mark('explored', id);
    paint(id);
    renderDetail();
  }

  function renderDetail() {
    if (!selected) {
      detail.replaceChildren(
        h('p', { class: 'mapdetail__no' }, 'Start anywhere'),
        h('p', { class: 'mapdetail__empty' }, 'Eight rules, eight experiments. Pick the one you already suspect is your problem — the map will show you what it pulls on.'));
      return;
    }
    const n = byId(selected);
    const links = EDGES
      .filter(([a, b]) => a === selected || b === selected)
      .map(([a, b, label]) => {
        const other = a === selected ? b : a;
        const o = byId(other);
        return h('button', {
          class: 'edgerow', type: 'button',
          style: { background: 'transparent', border: '0', borderTop: '1px solid var(--rule)', textAlign: 'left', cursor: 'pointer', minHeight: '2.1rem' },
          onclick: () => select(other),
        },
          h('b', null, `${n.id} ${a === selected ? '→' : '←'} ${o.id}`),
          h('span', null, label),
          h('span', { class: 'chip' }, 'system reading'));
      });

    detail.replaceChildren(
      h('p', { class: 'mapdetail__no' }, `Rule ${n.id} · ${n.role}`),
      h('h2', { class: 'mapdetail__title' }, n.title),
      h('p', { class: 'mapdetail__mech' }, n.mech),
      links.length ? h('div', { class: 'mapdetail__links', style: { display: 'grid' } }, ...links) : null,
      h('div', { class: 'row', style: { marginTop: '0.2rem' } },
        h('a', { class: 'btn', href: `#sim/${n.id}`, style: { textDecoration: 'none' } }, `Run experiment ${n.id}`),
        h('button', {
          class: 'btn btn--ghost', type: 'button',
          onclick: () => openSheet(n.title, () => [
            h('p', null, h('strong', null, 'Mechanism. '), n.mech),
            h('p', { class: 'small' }, 'This node influences: ',
              EDGES.filter(([a]) => a === n.id).map(([, b]) => byId(b).title).join(', ') || 'nothing downstream yet', '.') ,
            h('p', { class: 'small quiet' }, 'The line labels on this map are an interpretation of this build. The manual presents the rules as a set and leaves the dependencies to the reader.'),
            h('div', { class: 'row' }, h('a', { class: 'btn', href: `#sim/${n.id}`, style: { textDecoration: 'none' } }, 'Open experiment'), h('span', { class: 'chip' }, 'interpretation')),
          ]),
        }, 'Detail')));
  }

  draw();
  renderDetail();

  let rt = 0;
  const onResize = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      const wide = innerWidth >= 720;
      if (wide !== isWide) { isWide = wide; draw(); }
    }, 160);
  };
  addEventListener('resize', onResize);

  root._destroy = () => removeEventListener('resize', onResize);
  return root;
}
