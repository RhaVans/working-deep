/* core.js — DOM helpers, local persistence, motion, and the shared UI pieces.
   No dependencies. Everything renders with textContent, so content is safe. */

const SVGNS = 'http://www.w3.org/2000/svg';

function add(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const k in props) {
      const v = props[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'data') for (const d in v) el.dataset[d] = v[d];
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (!k.startsWith('aria-') && k in el) {
        try { el[k] = v; } catch { el.setAttribute(k, v === true ? '' : v); }
      } else el.setAttribute(k, v === true ? '' : v);
    }
  }
  add(el, children);
  return el;
}

export function s(tag, attrs, ...children) {
  const el = document.createElementNS(SVGNS, tag);
  if (attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  add(el, children);
  return el;
}

export const p = (text) => h('p', null, text);
export const chip = (text) => h('span', { class: 'chip' }, text);

export function btn(text, onClick, { ghost = false, small = false, pressed, disabled, label, ...rest } = {}) {
  return h('button', {
    type: 'button',
    class: 'btn' + (ghost ? ' btn--ghost' : '') + (small ? ' btn--sm' : ''),
    onclick: onClick,
    'aria-pressed': pressed,
    'aria-label': label,
    disabled,
    ...rest,
  }, text);
}

/* ------------------------------------------------------------ persistence */

const KEY = 'working-deep:v1';
let cache = read();

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

function write() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
    return true;
  } catch {
    toast('This browser refused to save. Your entry is kept on screen only.');
    return false;
  }
}

function emit(key) {
  dispatchEvent(new CustomEvent('wd:change', { detail: { key } }));
}

export const store = {
  get(key, fallback) {
    return key in cache ? cache[key] : fallback;
  },
  set(key, value) {
    cache[key] = value;
    const ok = write();
    emit(key);
    return ok;
  },
  all() {
    return JSON.parse(JSON.stringify(cache));
  },
  replace(data) {
    cache = data && typeof data === 'object' ? data : {};
    write();
    emit('*');
  },
  clear() {
    cache = {};
    write();
    emit('*');
  },
};

export function subscribe(fn) {
  const handler = (e) => fn(e.detail ? e.detail.key : '*');
  addEventListener('wd:change', handler);
  return () => removeEventListener('wd:change', handler);
}

/* ----------------------------------------------------------------- motion */

export const reduced = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

let io = null;
function observer() {
  if (io || !('IntersectionObserver' in window)) return io;
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
  );
  return io;
}

export function reveal(el, i = 0) {
  if (!el || el.nodeType !== 1) return el;
  el.classList.add('reveal');
  if (i) el.style.setProperty('--d', Math.min(i, 4) * 70 + 'ms');
  const ob = observer();
  if (!ob || reduced()) {
    el.classList.add('in');
    return el;
  }
  ob.observe(el);
  return el;
}

export function countTo(el, to, { decimals = 0, suffix = '', ms = 620 } = {}) {
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  if (reduced() || from === to) {
    el.textContent = to.toFixed(decimals) + suffix;
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / ms);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = (from + (to - from) * eased).toFixed(decimals) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ------------------------------------------------------------------- toast */

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2600);
}

/* -------------------------------------------------------------- components */

const TAG_LABEL = { manual: 'From the manual', sim: 'Simulation', read: 'Interpretation' };

export function tagEl(kind = 'sim') {
  return h('span', { class: `tag tag--${kind}` }, TAG_LABEL[kind] || kind);
}

export function chapter({ id, no, kind = 'Rule', title, lede, removes }) {
  const body = h('div', { class: 'ch-body' });
  const root = h(
    'section',
    { class: 'chapter', id, 'aria-labelledby': `${id}-title` },
    h(
      'div',
      { class: 'ch-head' },
      h(
        'p',
        { class: 'ch-kicker' },
        h('span', null, `${kind} ${no}`),
        removes ? h('span', null, `removes ${removes}`) : null
      ),
      h('h2', { class: 'ch-title', id: `${id}-title` }, title),
      lede ? h('p', { class: 'ch-lede' }, lede) : null
    ),
    body
  );
  return { root, body };
}

export function fig({ title, tag = 'sim', caption, stage }) {
  return h(
    'figure',
    { class: 'fig' },
    h('div', { class: 'fig__head' }, h('span', { class: 'fig__title' }, title), tagEl(tag)),
    h('div', { class: 'fig__stage' }, stage),
    caption ? h('figcaption', { class: 'fig__cap' }, caption) : null
  );
}

export function note(kind, ...content) {
  return h('div', { class: 'note' }, tagEl(kind), ...content);
}

export function takeaway(text) {
  return h('div', { class: 'takeaway' }, h('h3', null, 'Takeaway'), h('p', null, text));
}

export function example(title, ...content) {
  return h('div', { class: 'example' }, h('h3', null, title), ...content);
}

export function seeAlso(items) {
  return h(
    'nav',
    { class: 'links', 'aria-label': 'Related rules' },
    h('b', null, 'Connects to'),
    ...items.map(([label, href]) => h('a', { href: `#${href}` }, label))
  );
}

export function quiz({ q, options, answer, why }) {
  const wrap = h('div', { class: 'quiz' });
  const opts = h('div', { class: 'quiz__opts' });
  const exp = h('p', { class: 'quiz__why' });
  let done = false;
  options.forEach((label, i) => {
    const b = h('button', {
      class: 'quiz__opt',
      type: 'button',
      onclick: () => {
        if (done) return;
        done = true;
        const right = i === answer;
        b.dataset.state = right ? 'right' : 'wrong';
        if (!right) opts.children[answer].dataset.state = 'right';
        [...opts.children].forEach((x) => (x.disabled = true));
        exp.textContent = (right ? 'Correct. ' : 'Not quite. ') + why;
        exp.classList.add('is-on');
      },
    }, label);
    opts.append(b);
  });
  wrap.append(
    h('p', { class: 'fig__title' }, 'Concept check'),
    h('p', { class: 'quiz__q' }, q),
    opts,
    exp
  );
  return wrap;
}

/* A labelled control row: segmented buttons that stay in sync. */
export function segmented({ label, options, value, onChange }) {
  const group = h('div', { class: 'seg', role: 'group', 'aria-label': label });
  const buttons = options.map(([val, text]) =>
    h('button', {
      type: 'button',
      'aria-pressed': String(val === value),
      onclick: () => {
        buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === val)));
        onChange(val);
      },
    }, text)
  );
  group.append(...buttons);
  return group;
}

export function field(label, input, { wide = false } = {}) {
  // The visible label is the accessible name, so the two can never drift apart.
  if (input && input.nodeType === 1 && 'labels' in input) input.setAttribute('aria-label', label);
  return h('label', { class: 'field' + (wide ? ' field--wide' : '') }, h('span', null, label), input);
}

export function textInput({ value = '', placeholder = '', ariaLabel, onInput, multiline = false, rows }) {
  // No placeholder fallback for the name: a wrapping <label> should name the
  // field, otherwise the visible label and the accessible name disagree.
  const el = multiline
    ? h('textarea', { placeholder, 'aria-label': ariaLabel, rows: rows || 3 })
    : h('input', { type: 'text', placeholder, 'aria-label': ariaLabel });
  el.value = value;
  el.addEventListener('input', () => onInput && onInput(el.value));
  return el;
}

export function slider({ label, min = 0, max = 10, value, onChange }) {
  const out = h('output', null, String(value));
  const input = h('input', { type: 'range', min, max, value, 'aria-label': label });
  input.addEventListener('input', () => {
    out.textContent = input.value;
    onChange(Number(input.value));
  });
  return h('div', { class: 'slider' },
    h('label', null, h('span', null, label), out),
    input);
}
