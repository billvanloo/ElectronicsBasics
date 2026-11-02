/* ===== Breadboard renderer (illustrated, photo-style, drawn upright) =====
 * Numbered rows run down the board. In each row, holes a–e are connected, and f–j are connected.
 * The two rail columns on each side run the full length (+ red, − blue).
 */
(function (root) {
  'use strict';
  const S = root.Schem, el = S.el;
  const P = 18;
  const COLX = { 'L+': 20, 'L-': 38, a: 80, b: 98, c: 116, d: 134, e: 152, f: 188, g: 206, h: 224, i: 242, j: 260, 'R-': 302, 'R+': 320 };
  const LEFT = 'abcde', RIGHT = 'fghij';

  class Breadboard {
    constructor(parent, opts = {}) {
      this.rows = opts.rows || 30;
      this.ox = opts.x || 0; this.oy = opts.y || 0;
      this.g = el('g', { class: 'bb', transform: `translate(${this.ox} ${this.oy})` }, parent);
      this.width = 340; this.height = 34 + (this.rows - 1) * P + 24;
      this.draw();
    }
    hole(row, col) { return [this.ox + COLX[col], this.oy + 34 + (row - 1) * P]; }
    node(row, col) {
      if (col.length === 2) return col;                 // rails: 'L+', 'L-', 'R+', 'R-'
      return row + (LEFT.includes(col) ? 'L' : 'R');
    }
    stripHoles(row, side) { return (side === 'L' ? LEFT : RIGHT).split('').map(c => this.hole(row, c)); }
    draw() {
      const g = this.g, H = this.height;
      el('rect', { x: 0, y: 0, width: this.width, height: H, rx: 10, fill: '#f4f2eb', stroke: '#d4cfbf', 'stroke-width': 1.5 }, g);
      el('rect', { x: 2, y: 2, width: this.width - 4, height: 6, rx: 3, fill: '#ffffff', opacity: .6 }, g);
      el('rect', { x: 164, y: 14, width: 12, height: H - 28, rx: 3, fill: '#e3dfd3' }, g);
      // rail stripes
      const y1 = 20, y2 = H - 14;
      el('path', { d: `M11 ${y1} V${y2}`, stroke: '#d8342c', 'stroke-width': 2 }, g);
      el('path', { d: `M47 ${y1} V${y2}`, stroke: '#2a62c9', 'stroke-width': 2 }, g);
      el('path', { d: `M293 ${y1} V${y2}`, stroke: '#2a62c9', 'stroke-width': 2 }, g);
      el('path', { d: `M329 ${y1} V${y2}`, stroke: '#d8342c', 'stroke-width': 2 }, g);
      el('text', { x: 20, y: 16, 'text-anchor': 'middle', class: 'lbl-sm', fill: '#d8342c', text: '+' }, g).setAttribute('style', 'fill:#c22a22;font-size:14px;font-weight:800');
      el('text', { x: 38, y: 16, 'text-anchor': 'middle', class: 'lbl-sm', text: '−' }, g).setAttribute('style', 'fill:#2a62c9;font-size:14px;font-weight:800');
      el('text', { x: 302, y: 16, 'text-anchor': 'middle', class: 'lbl-sm', text: '−' }, g).setAttribute('style', 'fill:#2a62c9;font-size:14px;font-weight:800');
      el('text', { x: 320, y: 16, 'text-anchor': 'middle', class: 'lbl-sm', text: '+' }, g).setAttribute('style', 'fill:#c22a22;font-size:14px;font-weight:800');
      for (const c of LEFT + RIGHT) el('text', { x: COLX[c], y: 20, 'text-anchor': 'middle', class: 'lbl-sm', text: c }, g);
      const holes = el('g', { fill: '#3d3d3d' }, g);
      for (let r = 1; r <= this.rows; r++) {
        const y = 34 + (r - 1) * P;
        if (r === 1 || r % 5 === 0) {
          el('text', { x: 62, y: y + 4, 'text-anchor': 'middle', class: 'lbl-sm', text: r }, g);
          el('text', { x: 280, y: y + 4, 'text-anchor': 'middle', class: 'lbl-sm', text: r }, g);
        }
        for (const c of LEFT + RIGHT) el('rect', { x: COLX[c] - 3.5, y: y - 3.5, width: 7, height: 7, rx: 1.5 }, holes);
        if ((r - 1) % 6 !== 5) for (const c of ['L+', 'L-', 'R-', 'R+']) el('rect', { x: COLX[c] - 3.5, y: y - 3.5, width: 7, height: 7, rx: 1.5 }, holes);
      }
    }
  }

  /* ---- parts drawn on the board (coordinates are absolute points) ---- */
  const BAND = { 0: '#1a1a1a', 1: '#7b4a1e', 2: '#d3221d', 3: '#f07c00', 4: '#f2c400', 5: '#2e9d3a', 6: '#2a5bd7', 7: '#8a3fd1', 8: '#8a8a8a', 9: '#f5f5f5' };
  const BAND_NAME = ['black', 'brown', 'red', 'orange', 'yellow', 'green', 'blue', 'violet', 'gray', 'white'];
  function bands(ohms) {
    let e = 0, v = ohms;
    while (v >= 100) { v /= 10; e++; }
    v = Math.round(v);
    if (v < 10) { v *= 10; e--; }
    const d1 = Math.floor(v / 10), d2 = v % 10;
    return { colors: [BAND[d1], BAND[d2], BAND[e], '#c9a43a'], names: [BAND_NAME[d1], BAND_NAME[d2], BAND_NAME[e], 'gold'] };
  }
  function legLine(g, a, b, color = '#9aa1a8', w = 2.6) {
    el('path', { d: `M${a[0]} ${a[1]} L${b[0]} ${b[1]}`, stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', fill: 'none' }, g);
  }
  function pin(g, p) { el('rect', { x: p[0] - 3, y: p[1] - 3, width: 6, height: 6, rx: 1, fill: '#7d848c' }, g); }

  function resistor(parent, p1, p2, ohms, o = {}) {
    const g = el('g', { class: 'bb-part' }, parent);
    pin(g, p1); pin(g, p2);
    legLine(g, p1, p2);
    const s = S.seg(p1[0], p1[1], p2[0], p2[1]);
    const body = el('g', { transform: `translate(${s.mx} ${s.my}) rotate(${s.ang})` }, g);
    el('rect', { x: -19, y: -6.5, width: 38, height: 13, rx: 6.5, fill: '#e4c895', stroke: '#b69563', 'stroke-width': 1 }, body);
    el('rect', { x: -15, y: -5.5, width: 30, height: 3, rx: 1.5, fill: '#fff', opacity: .35 }, body);
    const b = bands(ohms);
    [-11, -5, 1, 11].forEach((x, i) => el('rect', { x, y: -6.5, width: 3.6, height: 13, fill: b.colors[i] }, body));
    return g;
  }
  function wire(parent, pts, color = '#2e9d3a', o = {}) {
    const g = el('g', { class: 'bb-wire' }, parent);
    let d = '';
    if (pts.length === 2 || o.straight) d = pts.map((p, i) => (i ? 'L' : 'M') + p[0] + ' ' + p[1]).join(' ');
    else {
      d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length - 1; i++) {
        const [px, py] = pts[i - 1], [cx, cy] = pts[i], [nx, ny] = pts[i + 1];
        const r = 9;
        const d1 = Math.hypot(cx - px, cy - py), d2 = Math.hypot(nx - cx, ny - cy);
        const ax = cx + (px - cx) * Math.min(r, d1 / 2) / d1, ay = cy + (py - cy) * Math.min(r, d1 / 2) / d1;
        const bx = cx + (nx - cx) * Math.min(r, d2 / 2) / d2, by = cy + (ny - cy) * Math.min(r, d2 / 2) / d2;
        d += ` L${ax} ${ay} Q${cx} ${cy} ${bx} ${by}`;
      }
      const l = pts[pts.length - 1]; d += ` L${l[0]} ${l[1]}`;
    }
    el('path', { d, stroke: 'rgb(0 0 0 / .25)', 'stroke-width': 7.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
    el('path', { d, stroke: color, 'stroke-width': 5.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', class: 'bb-wire-core' }, g);
    for (const p of [pts[0], pts[pts.length - 1]]) el('circle', { cx: p[0], cy: p[1], r: 3.4, fill: '#7d848c', stroke: 'rgb(0 0 0 / .3)' }, g);
    return g;
  }
  // flexible lead (e.g. battery snap wires) as a smooth curve
  function lead(parent, a, b, color, o = {}) {
    const g = el('g', { class: 'bb-wire' }, parent);
    const bend = o.bend ?? 40;
    const d = `M${a[0]} ${a[1]} C${a[0]} ${a[1] + (o.down === false ? -bend : bend)} ${b[0] + (o.bx || 0)} ${b[1] + (o.by ?? -bend)} ${b[0]} ${b[1]}`;
    el('path', { d, stroke: 'rgb(0 0 0 / .25)', 'stroke-width': 6.5, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('path', { d, stroke: color, 'stroke-width': 4.5, fill: 'none', 'stroke-linecap': 'round' }, g);
    el('circle', { cx: b[0], cy: b[1], r: 3.4, fill: '#7d848c' }, g);
    return g;
  }
  function led(parent, anode, cathode, o = {}) {
    const g = el('g', { class: 'bb-part' }, parent);
    pin(g, anode); pin(g, cathode);
    const color = o.color || '#e8261c';
    const s = S.seg(anode[0], anode[1], cathode[0], cathode[1]);
    legLine(g, anode, [s.mx, s.my]); legLine(g, cathode, [s.mx, s.my]);
    const body = el('g', { transform: `translate(${s.mx} ${s.my}) rotate(${s.ang})` }, g);
    if (o.lit) {
      el('circle', { r: 26, fill: color, opacity: .18 }, body);
      el('circle', { r: 18, fill: color, opacity: .25 }, body);
    }
    // dome seen from above, flat edge on the cathode side (+x)
    el('path', { d: 'M8 -10.5 A12 12 0 1 0 8 10.5 Z', fill: color, stroke: 'rgb(0 0 0 / .35)', 'stroke-width': 1.2, opacity: o.lit ? 1 : .82 }, body);
    el('circle', { cx: -3, cy: -3, r: 4, fill: '#fff', opacity: o.lit ? .8 : .45 }, body);
    // long-leg marker near the anode
    el('text', { x: anode[0] + (o.plusDx ?? -12), y: anode[1] + 4, class: 'lbl-sm', 'text-anchor': 'middle', text: '+' }, g).setAttribute('style', 'font-size:13px;font-weight:800;fill:#1b2330');
    return g;
  }
  function bulb(parent, p1, p2, o = {}) {
    const g = el('g', { class: 'bb-part' }, parent);
    pin(g, p1); pin(g, p2);
    const s = S.seg(p1[0], p1[1], p2[0], p2[1]);
    legLine(g, p1, [s.mx, s.my], '#6d737a', 3); legLine(g, p2, [s.mx, s.my], '#6d737a', 3);
    const body = el('g', { transform: `translate(${s.mx} ${s.my})` }, g);
    if (o.lit) {
      el('circle', { r: 30, fill: '#ffe066', opacity: .3 }, body);
      for (let i = 0; i < 8; i++) { const t = i * Math.PI / 4; el('path', { d: `M${Math.cos(t) * 20} ${Math.sin(t) * 20} L${Math.cos(t) * 27} ${Math.sin(t) * 27}`, stroke: '#c98a00', 'stroke-width': 2.4, 'stroke-linecap': 'round' }, body); }
    }
    el('circle', { r: 14, fill: o.lit ? '#fff3a8' : '#eef3f7', stroke: '#8a96a3', 'stroke-width': 1.5, opacity: .95 }, body);
    el('path', { d: 'M-6 3 Q-3 -6 0 3 Q3 -6 6 3', fill: 'none', stroke: o.lit ? '#e07b00' : '#7b6a55', 'stroke-width': 1.8 }, body);
    el('circle', { cx: -5, cy: -6, r: 3, fill: '#fff', opacity: .7 }, body);
    return g;
  }
  // slide switch over three holes in a line; pins[1] is common. on => common joined to pins[0]
  function slideSwitch(parent, pins, on, o = {}) {
    const g = el('g', { class: 'bb-part' }, parent);
    pins.forEach(p => pin(g, p));
    const [a, b, c] = pins, s = S.seg(a[0], a[1], c[0], c[1]);
    const body = el('g', { transform: `translate(${s.mx} ${s.my}) rotate(${s.ang})` }, g);
    el('rect', { x: -27, y: -11, width: 54, height: 22, rx: 4, fill: '#2b2f36', stroke: '#111', 'stroke-width': 1 }, body);
    el('rect', { x: -19, y: -5, width: 38, height: 10, rx: 2, fill: '#15181c' }, body);
    el('rect', { x: on ? -18 : 2, y: -6.5, width: 16, height: 13, rx: 2.5, fill: '#e6e8eb', stroke: '#9aa1a8', class: 'sw-knob' }, body);
    return g;
  }
  function battery9v(parent, x, y, o = {}) {
    const g = el('g', { class: 'bb-part' }, parent);
    el('rect', { x: x + 6, y: y - 10, width: 14, height: 12, rx: 3, fill: '#c9ccd1', stroke: '#6d737a' }, g);   // + snap (small)
    el('rect', { x: x + 34, y: y - 12, width: 18, height: 14, rx: 2, fill: '#c9ccd1', stroke: '#6d737a' }, g);  // − snap (hex)
    el('rect', { x, y, width: 58, height: 92, rx: 6, fill: '#2b2f36', stroke: '#111' }, g);
    el('rect', { x: x + 4, y: y + 30, width: 50, height: 30, rx: 3, fill: '#e3a21a' }, g);
    el('text', { x: x + 29, y: y + 51, 'text-anchor': 'middle', text: o.label || '9V' }, g).setAttribute('style', 'font:800 17px system-ui,sans-serif;fill:#1b2330');
    el('text', { x: x + 13, y: y + 20, 'text-anchor': 'middle', text: '+' }, g).setAttribute('style', 'font:800 13px system-ui,sans-serif;fill:#fff');
    el('text', { x: x + 43, y: y + 20, 'text-anchor': 'middle', text: '−' }, g).setAttribute('style', 'font:800 13px system-ui,sans-serif;fill:#fff');
    return { g, pos: [x + 13, y - 10], neg: [x + 43, y - 12] };
  }
  function testPoint(parent, p, label, o = {}) {
    const g = el('g', { class: 'tp' }, parent);
    el('circle', { cx: p[0], cy: p[1], r: 7, fill: 'none', stroke: '#7b3fe4', 'stroke-width': 2 }, g);
    const lx = p[0] + (o.dx ?? 16), ly = p[1] + (o.dy ?? 0);
    const w = 10 + label.length * 7;
    el('rect', { x: lx - (o.anchor === 'end' ? w : 0), y: ly - 9, width: w, height: 18, rx: 4, fill: '#fff', stroke: '#7b3fe4', 'stroke-width': 1.2 }, g);
    el('text', { x: lx + (o.anchor === 'end' ? -w / 2 : w / 2), y: ly + 4, 'text-anchor': 'middle', text: label }, g).setAttribute('style', 'font:700 11px system-ui,sans-serif;fill:#5a2bb0');
    return g;
  }

  root.BB = { Breadboard, resistor, wire, lead, led, bulb, slideSwitch, battery9v, testPoint, bands, P, COLX };
})(typeof window !== 'undefined' ? window : globalThis);
