/* ===== UI kit: DOM helper, captions, predict-then-reveal, feedback, motion, sliders, CSV ===== */
(function (root) {
  'use strict';

  function h(tag, attrs = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v === true) e.setAttribute(k, '');
      else e.setAttribute(k, v);
    }
    for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
    return e;
  }
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---- number formatting ---- */
  function sig(x, n = 3) {
    if (!isFinite(x)) return '—';
    if (Math.abs(x) < 1e-12) return '0';
    x = Number(x.toPrecision(n));
    const d = Math.max(0, n - 1 - Math.floor(Math.log10(Math.abs(x))));
    return x.toFixed(Math.min(d, 6));
  }
  function fmtV(v, n = 3) { return sig(v, n) + ' V'; }
  function fmtI(a, n = 3) { if (Math.abs(a) < 1e-7) return '0 mA'; return Math.abs(a) < 1 ? sig(a * 1000, n) + ' mA' : sig(a, n) + ' A'; }
  function fmtR(r, n = 3) { return r >= 1000 ? sig(r / 1000, n) + ' kΩ' : sig(r, n) + ' Ω'; }
  function spokenUnits(s) {
    return s.replace(/kΩ/g, ' kilohms').replace(/Ω/g, ' ohms').replace(/\bmA\b/g, 'milliamps').replace(/\bV\b/g, 'volts').replace(/\bW\b/g, 'watts').replace(/−/g, 'minus ');
  }

  /* ---- live announcer (polite + assertive) ---- */
  let politeEl, assertEl;
  function ensureAnnouncer() {
    if (politeEl) return;
    politeEl = h('div', { class: 'sr-only', 'aria-live': 'polite', 'aria-atomic': 'true' });
    assertEl = h('div', { class: 'sr-only', 'aria-live': 'assertive', 'aria-atomic': 'true' });
    document.body.append(politeEl, assertEl);
  }
  function announce(text, assertive = false) {
    ensureAnnouncer();
    const t = assertive ? assertEl : politeEl;
    t.textContent = '';
    setTimeout(() => { t.textContent = text; }, 30);
  }

  /* ---- captions with transcript ---- */
  class Captioner {
    constructor(mount, opts = {}) {
      this.lines = [];
      this.textEl = h('div', { class: 'caption-text', 'aria-live': 'polite', 'aria-atomic': 'true' }, opts.initial || '');
      this.el = h('div', { class: 'caption', role: 'region', 'aria-label': 'Captions' }, h('span', { class: 'cc', 'aria-hidden': 'true' }, 'CC'), this.textEl);
      this.list = h('ol');
      this.details = h('details', { class: 'transcript' }, h('summary', { class: 'small' }, 'Show transcript'), this.list);
      mount.append(this.el, this.details);
      if (opts.initial) this.log(opts.initial);
    }
    set(text) {
      if (this.textEl.textContent === text) return;
      this.textEl.textContent = text;
      this.log(text);
    }
    log(text) {
      if (this.lines[this.lines.length - 1] === text) return;
      this.lines.push(text);
      this.list.append(h('li', {}, text));
    }
    clear() { this.lines = []; this.list.textContent = ''; }
  }

  /* ---- feedback badge ---- */
  const ICONS = {
    ok: '<svg class="fb-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M6.5 12.5l3.5 3.5 7.5-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    bad: '<svg class="fb-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M8 8l8 8M16 8l-8 8" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/></svg>',
    warn: '<svg class="fb-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2L23 21H1z" fill="currentColor"/><path d="M12 9v5" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="17.6" r="1.5" fill="#fff"/></svg>',
    info: '<svg class="fb-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="currentColor"/><path d="M12 11v6" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7.3" r="1.6" fill="#fff"/></svg>'
  };
  const FB_WORD = { ok: 'Correct', bad: 'Not quite', warn: 'Safety check', info: 'Note' };
  function feedback(kind, title, text) {
    const color = { ok: 'var(--ok)', bad: 'var(--bad)', warn: 'var(--warn)', info: 'var(--ink-2)' }[kind];
    const icon = h('span', { html: ICONS[kind], style: `color:${color};display:inline-flex` });
    return h('div', { class: 'fb ' + kind, role: kind === 'warn' || kind === 'bad' ? 'alert' : 'status' },
      icon, h('div', {}, h('strong', {}, title || FB_WORD[kind]), text ? h('span', {}, text) : null));
  }

  /* ---- predict, then reveal ---- */
  let predictCount = 0;
  class Predict {
    constructor(mount, { question, choices, onLock, lockLabel }) {
      this.choices = choices;
      const name = 'predict-' + (++predictCount);
      this.radios = choices.map((c, i) => h('input', { type: 'radio', name, value: i }));
      this.lockBtn = h('button', { class: 'btn btn-primary', type: 'button', disabled: true }, lockLabel || 'Lock in prediction');
      this.result = h('div', { class: 'predict-result' });
      this.fs = h('fieldset', {}, h('legend', {}, question),
        h('div', { class: 'choices' }, choices.map((c, i) => h('label', { class: 'choice' }, this.radios[i], h('span', {}, c)))));
      this.el = h('div', { class: 'predict' }, this.fs, h('div', { class: 'row' }, this.lockBtn), this.result);
      this.radios.forEach(r => r.addEventListener('change', () => { this.lockBtn.disabled = false; }));
      this.lockBtn.addEventListener('click', () => {
        const sel = this.radios.findIndex(r => r.checked);
        if (sel < 0) return;
        this.locked = sel;
        this.radios.forEach(r => { r.disabled = true; });
        this.el.classList.add('locked');
        this.lockBtn.hidden = true;
        this.result.replaceChildren(h('p', { class: 'small muted', style: 'margin:8px 0 0' }, 'Prediction locked: “' + choices[sel] + '”'));
        announce('Prediction locked: ' + choices[sel]);
        onLock && onLock(sel);
      });
      mount.append(this.el);
    }
    reveal(actualIndex, explanation) {
      const p = this.locked;
      const match = p === actualIndex;
      this.result.replaceChildren(h('dl', { class: 'compare' },
        h('dt', {}, 'You predicted'), h('dd', {}, p == null ? '(no prediction)' : this.choices[p]),
        h('dt', {}, 'What happened'), h('dd', {}, this.choices[actualIndex]),
      ), h('p', { class: 'small', style: 'margin:8px 0 0' },
        h('span', { class: 'tag' }, match ? 'Matches your prediction' : 'Different from your prediction'), ' ', explanation || ''));
      announce('You predicted ' + (p == null ? 'nothing' : this.choices[p]) + '. What happened: ' + this.choices[actualIndex] + '. ' + (explanation || ''));
    }
    reset() {
      this.locked = undefined;
      this.radios.forEach(r => { r.disabled = false; r.checked = false; });
      this.el.classList.remove('locked');
      this.lockBtn.hidden = false; this.lockBtn.disabled = true;
      this.result.replaceChildren();
    }
  }

  /* ---- motion preference + pause toggle ---- */
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false, addEventListener() {} };
  const motion = {
    reduced: mq.matches,
    on: !mq.matches,
    listeners: [],
    set(v) { this.on = v; this.listeners.forEach(f => f(v)); },
    onChange(f) { this.listeners.push(f); f(this.on); },
    button() {
      const b = h('button', { class: 'btn btn-small', type: 'button', 'aria-pressed': String(!this.on) });
      const sync = v => { b.setAttribute('aria-pressed', String(!v)); b.textContent = v ? 'Pause motion' : 'Play motion'; };
      b.addEventListener('click', () => this.set(!this.on));
      this.onChange(sync);
      return b;
    }
  };
  mq.addEventListener && mq.addEventListener('change', e => { motion.reduced = e.matches; motion.set(!e.matches); });

  /* ---- slider with linked number box ---- */
  function syncSlider(input) {
    const min = +input.min || 0, max = +input.max || 100;
    input.style.setProperty('--slider-progress', ((+input.value - min) / (max - min) * 100) + '%');
  }
  function slider({ id, label, min, max, step, value, unit, format, onInput, values }) {
    // values: optional discrete list (slider indexes into it)
    const discrete = Array.isArray(values);
    const input = h('input', { type: 'range', id, min: discrete ? 0 : min, max: discrete ? values.length - 1 : max, step: discrete ? 1 : step, value: discrete ? Math.max(0, values.indexOf(value)) : value });
    const out = h('output', { for: id, class: 'val' });
    const get = () => discrete ? values[+input.value] : +input.value;
    const fmt = format || (v => v + (unit ? ' ' + unit : ''));
    const update = (fire = true) => {
      const v = get();
      out.textContent = fmt(v);
      input.setAttribute('aria-valuetext', spokenUnits(fmt(v)));
      syncSlider(input);
      if (fire && onInput) onInput(v);
    };
    input.addEventListener('input', () => update());
    const wrap = h('div', { class: 'field' }, h('label', { for: id }, h('span', {}, label), out), input);
    update(false);
    return { el: wrap, input, get, set(v) { input.value = discrete ? Math.max(0, values.indexOf(v)) : v; update(false); }, update };
  }

  /* ---- teacher panel ---- */
  function about(mount, html) {
    const d = h('details', { class: 'about' }, h('summary', {}, 'About this tool'), h('div', { class: 'about-body', html }));
    mount.append(d);
    return d;
  }

  /* ---- CSV download ---- */
  function downloadCSV(filename, rows) {
    const esc = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    const csv = rows.map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const a = h('a', { href: URL.createObjectURL(blob), download: filename });
    document.body.append(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---- SVG focusable part helper: keyboard + pointer activation ---- */
  function makeFocusable(g, { label, onActivate, onFocus, onBlur, role }) {
    g.setAttribute('tabindex', '0');
    g.setAttribute('role', role || 'button');
    g.setAttribute('aria-label', label);
    g.classList.add('focusable');
    if (onActivate) {
      g.addEventListener('click', e => onActivate(e));
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onActivate(e); } });
    }
    if (onFocus) { g.addEventListener('focus', onFocus); g.addEventListener('pointerenter', onFocus); }
    if (onBlur) { g.addEventListener('blur', onBlur); g.addEventListener('pointerleave', onBlur); }
    return g;
  }

  /* ---- shuffle ---- */
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  root.UI = { h, $, $$, sig, fmtV, fmtI, fmtR, spokenUnits, announce, Captioner, feedback, Predict, motion, slider, syncSlider, about, downloadCSV, makeFocusable, shuffle };
})(typeof window !== 'undefined' ? window : globalThis);
