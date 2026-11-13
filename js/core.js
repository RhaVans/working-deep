/* core.js — DOM helpers, persistence, motion, sheet, progress.
   Same storage key as the previous version: entries made there survive. */

const SVGNS = 'http://www.w3.org/2000/svg';
const KEY = 'working-deep:v1';

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

export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const reduced = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ------------------------------------------------------------- persistence */

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
    toast('This browser refused to save — your change is on screen only.');
    return false;
  }
}

function emit(key) {
  dispatchEvent(new CustomEvent('wd:change', { detail: { key } }));
}

export const store = {
  get(key, fallback) {
    const v = key in cache ? cache[key] : undefined;
    return v === undefined ? fallback : v;
  },
  set(key, value) {
    cache[key] = value;
    write();
    emit(key);
  },
  all() { return JSON.parse(JSON.stringify(cache)); },
  replace(data) {
    cache = data && typeof data === 'object' && !Array.isArray(data) ? data : {};
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

/* ---------------------------------------------------------------- progress */

const EMPTY = { explored: [], tried: [], done: [] };

export function progress() {
  const p = store.get('progress', null);
  const base = { ...EMPTY, ...(p || {}) };
  for (const k of Object.keys(EMPTY)) if (!Array.isArray(base[k])) base[k] = [];
  return base;
}

export function mark(kind, id) {
  const p = progress();
  if (!p[kind].includes(id)) {
    p[kind] = [...p[kind], id];
    store.set('progress', p);
  }
}

/* ------------------------------------------------------------------- toast */

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2500);
}

/* ------------------------------------------------------------------- sheet */

let lastFocus = null;

export function openSheet(title, content) {
  const sheet = document.getElementById('sheet');
  const scrim = document.getElementById('scrim');
  const titleEl = document.getElementById('sheetTitle');
  const bodyEl = document.getElementById('sheetBody');
  if (!sheet || !scrim) return;
  lastFocus = document.activeElement;
  titleEl.textContent = title;
  bodyEl.replaceChildren(typeof content === 'function' ? content() : content);
  scrim.hidden = false;
  sheet.hidden = false;
  // next frame so the transform transition has a start value
  requestAnimationFrame(() => {
    scrim.classList.add('is-on');
    sheet.classList.add('is-on');
  });
  document.getElementById('sheetClose').focus({ preventScroll: true });
}

export function closeSheet() {
  const sheet = document.getElementById('sheet');
  const scrim = document.getElementById('scrim');
  if (!sheet || sheet.hidden) return;
  sheet.classList.remove('is-on');
  scrim.classList.remove('is-on');
  setTimeout(() => {
    sheet.hidden = true;
    scrim.hidden = true;
  }, reduced() ? 0 : 340);
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}

/* ------------------------------------------------------------------ pieces */

export function btn(label, onClick, { ghost = false, small = false, icon = false, pressed, disabled, ariaLabel, ...rest } = {}) {
  return h('button', {
    type: 'button',
    class: 'btn' + (ghost ? ' btn--ghost' : '') + (small ? ' btn--sm' : '') + (icon ? ' btn--icon' : ''),
    onclick: onClick,
    'aria-pressed': pressed,
    'aria-label': ariaLabel,
    disabled,
    ...rest,
  }, label);
}

export function stat(label, value, { cls = '', live = false } = {}) {
  return h('div', { class: 'stat ' + cls },
    h('b', { class: live ? 'num live' : 'num' }, value),
    h('span', null, label));
}

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
    }, text));
  group.append(...buttons);
  return group;
}

export function field(label, input) {
  if (input && input.nodeType === 1) input.setAttribute('aria-label', label);
  return h('label', { class: 'field' }, h('span', null, label), input);
}

export function textInput({ value = '', placeholder = '', ariaLabel, onInput, multiline = false, rows = 2, type = 'text' }) {
  const el = multiline
    ? h('textarea', { placeholder, 'aria-label': ariaLabel, rows })
    : h('input', { type, placeholder, 'aria-label': ariaLabel });
  el.value = value;
  el.addEventListener('input', () => onInput && onInput(el.value, el));
  return el;
}

export function slider({ label, min = 0, max = 10, step = 1, value, onChange }) {
  const out = h('output', null, String(value));
  const input = h('input', { type: 'range', min, max, step, value, 'aria-label': label });
  input.addEventListener('input', () => {
    out.textContent = input.value;
    onChange(Number(input.value));
  });
  return h('div', { class: 'slider' },
    h('label', null, h('span', null, label), out),
    input);
}

export function tagEl(kind) {
  const map = { manual: 'From the manual', sim: 'Simulation', read: 'Interpretation' };
  return h('span', { class: `tag tag--${kind}` }, map[kind] || kind);
}

export function more(summary, ...content) {
  return h('details', { class: 'more' },
    h('summary', null, summary),
    h('div', { class: 'more__body' }, ...content));
}

/* ------------------------------------------------------------------ motion */

export function tween(el, to, { ms = 600, decimals = 0, suffix = '' } = {}) {
  const from = Number(el.dataset.value || 0);
  el.dataset.value = String(to);
  if (reduced() || from === to) {
    el.textContent = to.toFixed(decimals) + suffix;
    return;
  }
  const t0 = performance.now();
  const step = (now) => {
    const k = clamp((now - t0) / ms, 0, 1);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = (from + (to - from) * eased).toFixed(decimals) + suffix;
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* clock for anything that plays: returns a cancel function */
export function every(fn, ms) {
  const id = setInterval(fn, ms);
  return () => clearInterval(id);
}

/* --------------------------------------------------------- shared framing */

export function experimentHead({ no, title, line, tag = 'sim', detail, connections }) {
  const head = h('header', { class: 'exp__head' },
    h('p', { class: 'kicker' }, h('b', null, `Experiment ${no}`), tagEl(tag), h('span', null, 'drag · tap · watch')),
    h('h1', { class: 'exp__title' }, title),
    h('p', { class: 'exp__line' }, line));

  return [head, detail || connections ? more('What this shows · where it comes from',
    detail ? h('p', null, detail) : null,
    connections ? h('p', null, connections) : null) : null];
}
