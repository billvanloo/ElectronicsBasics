/* ===== Current-dot animator =====
 * Conventional current. Every dot moves at the same speed in every tool.
 * Each dot = the same amount of charge, so more current = dots closer together.
 * spacing (px) = refSpacing * refCurrent / |I|
 */
(function (root) {
  'use strict';
  const S = root.Schem;

  class DotFlow {
    constructor(layer, opts = {}) {
      this.layer = layer;
      this.speed = opts.speed ?? 70;               // px per second, constant
      this.refCurrent = opts.refCurrent ?? 0.01;   // A
      this.refSpacing = opts.refSpacing ?? 70;     // px between dots at refCurrent
      this.minSpacing = opts.minSpacing ?? 14;
      this.r = opts.r ?? 4.2;
      this.paths = [];
      this.running = false;
      this.motion = true;
      this.last = 0;
      this._tick = this._tick.bind(this);
    }
    spacingFor(I) {
      const a = Math.abs(I);
      if (a < 1e-7) return null;
      return Math.max(this.minSpacing, this.refSpacing * this.refCurrent / a);
    }
    // pts listed in the direction of positive conventional current
    add(id, pts, getI) {
      const pl = S.polyline(pts);
      const g = S.el('g', { 'data-flow': id, 'aria-hidden': 'true' }, this.layer);
      const p = { id, pl, getI, g, phase: 0, spacing: this.refSpacing, dots: [], frozen: false };
      this.paths.push(p);
      this._layout(p);
      return p;
    }
    clear() { this.paths.forEach(p => p.g.remove()); this.paths = []; }
    _layout(p) {
      const I = p.getI();
      const sp = this.spacingFor(I);
      p.frozen = sp == null;
      if (sp != null) p.spacing = sp;
      p.dir = I < 0 ? -1 : 1;
      const n = Math.max(1, Math.floor(p.pl.L / p.spacing) + 2);
      while (p.dots.length < n) p.dots.push(S.el('circle', { r: this.r, class: 'dot' }, p.g));
      while (p.dots.length > n) p.dots.pop().remove();
      this._place(p);
    }
    _place(p) {
      const L = p.pl.L, sp = p.spacing;
      const off = ((p.phase % sp) + sp) % sp;
      p.dots.forEach((d, k) => {
        let s = off + (k - 1) * sp;
        if (p.dir < 0) s = L - s;
        const vis = s >= 0 && s <= L;
        const [x, y] = p.pl.at(s);
        d.setAttribute('cx', x.toFixed(1)); d.setAttribute('cy', y.toFixed(1));
        d.setAttribute('opacity', vis ? 1 : 0);
      });
    }
    refresh() { this.paths.forEach(p => this._layout(p)); }
    setMotion(on) { this.motion = on; if (on) this.start(); }
    start() {
      if (this.running) return;
      this.running = true; this.last = performance.now();
      requestAnimationFrame(this._tick);
    }
    stop() { this.running = false; }
    _tick(now) {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
      if (this.motion) {
        for (const p of this.paths) {
          if (p.frozen || p.paused) continue;
          p.phase += this.speed * dt;
          this._place(p);
        }
      }
      if (this.onTick) this.onTick(dt, this.motion);
      requestAnimationFrame(this._tick);
    }
  }
  root.DotFlow = DotFlow;
})(typeof window !== 'undefined' ? window : globalThis);
