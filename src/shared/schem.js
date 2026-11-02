/* ===== Schematic renderer: SVG symbols, wires, voltage colors ===== */
(function (root) {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs = {}, parent) {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'text') e.textContent = v;
      else if (k === 'class') e.setAttribute('class', v);
      else e.setAttribute(k, v);
    }
    if (parent) parent.appendChild(e);
    return e;
  }

  function svg(w, h, opts = {}) {
    const s = el('svg', { viewBox: `0 0 ${w} ${h}`, role: opts.role || 'img', 'aria-labelledby': opts.labelledby, focusable: 'false' });
    if (opts.title) { const t = el('title', { id: opts.titleId, text: opts.title }, s); }
    if (opts.desc) el('desc', { id: opts.descId, text: opts.desc }, s);
    return s;
  }

  /* ---- voltage color: low (cool) -> mid (neutral) -> high (warm) ---- */
  const C_LOW = [0, 114, 178], C_MID = [166, 156, 146], C_HIGH = [213, 94, 0];
  function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)); }
  function vColor(v, vmax) {
    if (!(vmax > 0)) return '#8c94a0';
    const t = Math.max(0, Math.min(1, v / vmax));
    const c = t < 0.5 ? mix(C_LOW, C_MID, t / 0.5) : mix(C_MID, C_HIGH, (t - 0.5) / 0.5);
    return `rgb(${c[0]} ${c[1]} ${c[2]})`;
  }

  /* ---- geometry helpers ---- */
  function seg(x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy);
    return { L, ang: Math.atan2(dy, dx) * 180 / Math.PI, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 };
  }
  // group placed so local x-axis runs from (x1,y1) to (x2,y2)
  function placed(parent, x1, y1, x2, y2, cls) {
    const s = seg(x1, y1, x2, y2);
    const g = el('g', { transform: `translate(${x1} ${y1}) rotate(${s.ang})`, class: cls }, parent);
    return { g, L: s.L };
  }

  function wire(parent, pts, color, opts = {}) {
    const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    return el('path', { d, class: 'wire' + (opts.cls ? ' ' + opts.cls : ''), stroke: color || '#8c94a0', 'stroke-width': opts.width }, parent);
  }
  function junction(parent, x, y, color) {
    return el('circle', { cx: x, cy: y, r: 5, fill: color || '#1b2330' }, parent);
  }
  // leads drawn colored by node voltage, body in ink
  function leads(g, L, body, ca, cb) {
    const a = (L - body) / 2;
    el('path', { d: `M0 0 H${a}`, class: 'wire', stroke: ca || '#8c94a0' }, g);
    el('path', { d: `M${L - a} 0 H${L}`, class: 'wire', stroke: cb || ca || '#8c94a0' }, g);
    return a;
  }

  /* ---- symbols (drawn between two terminal points) ---- */
  function resistor(parent, x1, y1, x2, y2, o = {}) {
    const { g, L } = placed(parent, x1, y1, x2, y2, 'part');
    const body = 44, a = leads(g, L, body, o.ca, o.cb);
    const n = 6, w = body / n, amp = 8;
    let d = `M${a} 0`;
    for (let i = 0; i < n; i++) d += ` L${a + w * (i + 0.5)} ${i % 2 ? amp : -amp}`;
    d += ` L${a + body} 0`;
    el('path', { d, class: 'sym' }, g);
    return g;
  }
  // battery: (x1,y1) = negative terminal, (x2,y2) = positive terminal
  function battery(parent, x1, y1, x2, y2, o = {}) {
    const { g, L } = placed(parent, x1, y1, x2, y2, 'part');
    const cells = o.cells || 2, body = cells * 14 - 6, a = leads(g, L, body, o.cneg, o.cpos);
    for (let i = 0; i < cells; i++) {
      const x = a + i * 14;
      el('path', { d: `M${x} -8 V8`, class: 'sym', 'stroke-width': 4.5 }, g);          // short plate (−)
      el('path', { d: `M${x + 8} -17 V17`, class: 'sym' }, g);                           // long plate (+)
    }
    // + / − marks (kept upright)
    const s = seg(x1, y1, x2, y2), rad = s.ang * Math.PI / 180;
    const nx = -Math.sin(rad), ny = Math.cos(rad);
    const off = o.markSide === 'left' ? -1 : 1;
    const px = x1 + Math.cos(rad) * (a + body + 6) + nx * 24 * off, py = y1 + Math.sin(rad) * (a + body + 6) + ny * 24 * off;
    const qx = x1 + Math.cos(rad) * (a - 6) + nx * 24 * off, qy = y1 + Math.sin(rad) * (a - 6) + ny * 24 * off;
    el('text', { x: px, y: py + 5, class: 'lbl', 'text-anchor': 'middle', text: '+' }, parent);
    el('text', { x: qx, y: qy + 5, class: 'lbl', 'text-anchor': 'middle', text: '−' }, parent);
    return g;
  }
  function lamp(parent, x1, y1, x2, y2, o = {}) {
    const { g, L } = placed(parent, x1, y1, x2, y2, 'part');
    const r = 14, a = leads(g, L, 2 * r, o.ca, o.cb), cx = a + r;
    const glow = el('g', { class: 'lamp-glow', opacity: o.lit ? 1 : 0 }, g);
    el('circle', { cx, cy: 0, r: r + 5, fill: '#ffe680', opacity: .55 * (o.brightness ?? 1) + .15 }, glow);
    for (let i = 0; i < 8; i++) {
      const t = i * Math.PI / 4, r1 = r + 8, r2 = r + 15;
      el('path', { d: `M${cx + Math.cos(t) * r1} ${Math.sin(t) * r1} L${cx + Math.cos(t) * r2} ${Math.sin(t) * r2}`, stroke: '#c98a00', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, glow);
    }
    el('circle', { cx, cy: 0, r, class: 'sym', fill: o.lit ? '#fff3b0' : '#ffffff' }, g);
    const k = r * 0.7071;
    el('path', { d: `M${cx - k} ${-k} L${cx + k} ${k} M${cx - k} ${k} L${cx + k} ${-k}`, class: 'sym' }, g);
    return g;
  }
  function led(parent, x1, y1, x2, y2, o = {}) {           // anode at (x1,y1)
    const { g, L } = placed(parent, x1, y1, x2, y2, 'part');
    const body = 26, a = leads(g, L, body, o.ca, o.cb);
    if (o.lit) el('circle', { cx: a + 13, cy: 0, r: 22, fill: o.color || '#ff3b30', opacity: .22 }, g);
    el('path', { d: `M${a} -12 L${a + 22} 0 L${a} 12 Z`, class: 'sym', fill: o.lit ? (o.color || '#ff3b30') : '#fff' }, g);
    el('path', { d: `M${a + 22} -13 V13 M${a} 0 H${a + 26}`, class: 'sym' }, g);
    for (const dx of [6, 15]) {
      el('path', { d: `M${a + dx} -15 l9 -11 M${a + dx + 9} -26 l-6 1 M${a + dx + 9} -26 l-1 6`, class: 'sym', 'stroke-width': 1.8 }, g);
    }
    return g;
  }
  function sw(parent, x1, y1, x2, y2, o = {}) {
    const { g, L } = placed(parent, x1, y1, x2, y2, 'part');
    const body = 40, a = leads(g, L, body, o.ca, o.cb);
    el('circle', { cx: a, cy: 0, r: 4, class: 'sym', fill: '#fff' }, g);
    el('circle', { cx: a + body, cy: 0, r: 4, class: 'sym', fill: '#fff' }, g);
    const lever = el('path', { d: o.closed ? `M${a} 0 L${a + body - 3} -2` : `M${a} 0 L${a + body - 6} -20`, class: 'sym sw-lever' }, g);
    if (o.flip) g.setAttribute('transform', g.getAttribute('transform') + ` scale(1 -1)`);
    return g;
  }
  function meter(parent, x1, y1, x2, y2, letter, o = {}) {
    const { g, L } = placed(parent, x1, y1, x2, y2, 'part');
    const r = 15, a = leads(g, L, 2 * r, o.ca, o.cb);
    el('circle', { cx: a + r, cy: 0, r, class: 'sym', fill: '#fff' }, g);
    const s = seg(x1, y1, x2, y2);
    const t = el('text', { x: a + r, y: 5, class: 'lbl', 'text-anchor': 'middle', 'font-size': 16, text: letter, transform: `rotate(${-s.ang} ${a + r} 0)` }, g);
    return g;
  }
  function label(parent, x, y, text, o = {}) {
    return el('text', { x, y, class: o.cls || 'lbl', 'text-anchor': o.anchor || 'middle', text }, parent);
  }
  function vtag(parent, x, y, text) {
    const g = el('g', { class: 'vtag' }, parent);
    const w = 8 + text.length * 7.2;
    el('rect', { x: x - w / 2, y: y - 10, width: w, height: 20, rx: 5 }, g);
    el('text', { x, y: y + 4.5, 'text-anchor': 'middle', text }, g);
    return g;
  }
  function openMark(parent, x, y, o = {}) {
    const g = el('g', { class: 'open-mark-g' }, parent);
    el('circle', { cx: x, cy: y, r: o.r || 22, class: 'open-mark' }, g);
    const lg = el('g', { class: 'open-label' }, g);
    el('rect', { x: x - 24, y: y + (o.r || 22) + 4, width: 48, height: 18, rx: 4 }, lg);
    el('text', { x, y: y + (o.r || 22) + 17, 'text-anchor': 'middle', text: 'OPEN' }, lg);
    return g;
  }
  function arrowOnPath(parent, x1, y1, x2, y2, o = {}) {
    const s = seg(x1, y1, x2, y2);
    const g = el('g', { transform: `translate(${s.mx} ${s.my}) rotate(${s.ang})` }, parent);
    el('path', { d: 'M-6 -6 L5 0 L-6 6 Z', class: 'arrowhead', fill: o.color }, g);
    return g;
  }
  // focus ring rectangle sized to a group's bbox (call after the group is in the document)
  function addFocusRing(g, pad = 8) {
    const b = g.getBBox();
    const r = el('rect', { x: b.x - pad, y: b.y - pad, width: b.width + 2 * pad, height: b.height + 2 * pad, rx: 8, class: 'focus-ring' });
    g.insertBefore(r, g.firstChild);
    return r;
  }

  /* ---- path utilities (polyline length + point at distance) ---- */
  function polyline(pts) {
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    function at(s) {
      s = Math.max(0, Math.min(L, s));
      let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
      const t = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
      return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t];
    }
    return { pts, L, at };
  }

  const Schem = { el, svg, vColor, wire, junction, resistor, battery, lamp, led, sw, meter, label, vtag, openMark, arrowOnPath, addFocusRing, polyline, seg, NS };
  root.Schem = Schem;
})(typeof window !== 'undefined' ? window : globalThis);
