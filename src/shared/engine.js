/* ===== Circuit engine: DC nodal analysis (MNA) =====
 * parts: array of
 *   { id, type: 'resistor'|'lamp'|'wire'|'switch'|'ammeter'|'voltmeter', a, b, R?, closed? , removed? }
 *   { id, type: 'vsource', pos, neg, V, Ilim? }     ideal source; optional current limit (CV/CC bench supply)
 *   { id, type: 'led', a (anode), b (cathode), Vf?, Rs? }
 * Result: { V:{node:volts}, I:{id:amps}, P:{id:watts}, mode:{id:'CV'|'CC'}, ok:true }
 *   I for two-terminal parts = current flowing a -> b through the part.
 *   I for a vsource = current leaving its + terminal into the circuit.
 */
(function (root) {
  'use strict';
  const R_WIRE = 1e-4;       // closed switch / wire
  const R_AMMETER = 2;       // mA-range burden resistance
  const R_VOLTMETER = 10e6;  // 10 MΩ input
  const GMIN = 1e-12;

  function lsolve(A, b) {
    const n = b.length;
    for (let c = 0; c < n; c++) {
      let p = c, best = Math.abs(A[c][c]);
      for (let r = c + 1; r < n; r++) { const v = Math.abs(A[r][c]); if (v > best) { best = v; p = r; } }
      if (best < 1e-30) continue;
      if (p !== c) { [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]]; }
      for (let r = c + 1; r < n; r++) {
        const f = A[r][c] / A[c][c];
        if (!f) continue;
        for (let k = c; k < n; k++) A[r][k] -= f * A[c][k];
        b[r] -= f * b[c];
      }
    }
    const x = new Array(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
      let s = b[r];
      for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
      x[r] = Math.abs(A[r][r]) < 1e-30 ? 0 : s / A[r][r];
    }
    return x;
  }

  function resistanceOf(p) {
    switch (p.type) {
      case 'wire': return R_WIRE;
      case 'switch': return p.closed ? R_WIRE : null;
      case 'ammeter': return p.R ?? R_AMMETER;
      case 'voltmeter': return p.R ?? R_VOLTMETER;
      case 'resistor': case 'lamp': return p.R;
      default: return undefined;
    }
  }

  function solve(parts, opts = {}) {
    const active = parts.filter(p => !p.removed);
    const sources = active.filter(p => p.type === 'vsource');
    const ground = opts.ground || (sources[0] && sources[0].neg) || 'gnd';
    const nodes = new Set();
    for (const p of active) {
      if (p.type === 'vsource') { nodes.add(p.pos); nodes.add(p.neg); }
      else { nodes.add(p.a); nodes.add(p.b); }
    }
    nodes.delete(ground);
    const names = [...nodes];
    const idx = new Map(names.map((n, i) => [n, i]));
    const N = names.length;

    const ledState = new Map(active.filter(p => p.type === 'led').map(p => [p.id, false]));
    const ccState = new Map(sources.map(s => [s.id, false]));
    let result;

    for (let iter = 0; iter < 25; iter++) {
      const vs = sources.filter(s => !ccState.get(s.id));
      const M = N + vs.length;
      const A = Array.from({ length: M }, () => new Array(M).fill(0));
      const z = new Array(M).fill(0);
      const ix = n => (n === ground ? -1 : idx.get(n));
      const stampG = (a, b, g) => {
        const i = ix(a), j = ix(b);
        if (i >= 0) A[i][i] += g;
        if (j >= 0) A[j][j] += g;
        if (i >= 0 && j >= 0) { A[i][j] -= g; A[j][i] -= g; }
      };
      // current source of value I flowing from node a, through source, into node b (i.e. injected into b)
      const stampI = (a, b, I) => {
        const i = ix(a), j = ix(b);
        if (i >= 0) z[i] -= I;
        if (j >= 0) z[j] += I;
      };
      for (let k = 0; k < N; k++) A[k][k] += GMIN;

      for (const p of active) {
        if (p.type === 'vsource') continue;
        if (p.type === 'led') {
          const Vf = p.Vf ?? 2.0, Rs = p.Rs ?? 15;
          if (ledState.get(p.id)) { const g = 1 / Rs; stampG(p.a, p.b, g); stampI(p.b, p.a, g * Vf); }
          else stampG(p.a, p.b, 1e-9);
          continue;
        }
        const R = resistanceOf(p);
        if (R == null) continue;
        stampG(p.a, p.b, 1 / Math.max(R, 1e-9));
      }
      vs.forEach((s, k) => {
        const r = N + k, i = ix(s.pos), j = ix(s.neg);
        if (i >= 0) { A[i][r] += 1; A[r][i] += 1; }
        if (j >= 0) { A[j][r] -= 1; A[r][j] -= 1; }
        z[r] = s.V;
      });
      for (const s of sources) if (ccState.get(s.id)) stampI(s.neg, s.pos, s.Ilim);

      const x = lsolve(A, z);
      const V = { [ground]: 0 };
      names.forEach((n, i) => { V[n] = x[i]; });
      const I = {}, P = {}, mode = {};
      for (const p of active) {
        if (p.type === 'vsource') continue;
        const vab = V[p.a] - V[p.b];
        if (p.type === 'led') {
          const Vf = p.Vf ?? 2.0, Rs = p.Rs ?? 15;
          I[p.id] = ledState.get(p.id) ? (vab - Vf) / Rs : vab * 1e-9;
        } else {
          const R = resistanceOf(p);
          I[p.id] = R == null ? 0 : vab / Math.max(R, 1e-9);
        }
        P[p.id] = vab * I[p.id];
      }
      vs.forEach((s, k) => { I[s.id] = -x[N + k]; mode[s.id] = 'CV'; });
      for (const s of sources) if (ccState.get(s.id)) { I[s.id] = s.Ilim; mode[s.id] = 'CC'; }
      for (const s of sources) P[s.id] = (V[s.pos] - V[s.neg]) * I[s.id];
      result = { V, I, P, mode, ground, ok: true };

      // update nonlinear states
      let changed = false;
      for (const p of active) {
        if (p.type !== 'led') continue;
        const on = ledState.get(p.id);
        const vab = V[p.a] - V[p.b];
        if (!on && vab > (p.Vf ?? 2.0) + 1e-6) { ledState.set(p.id, true); changed = true; }
        else if (on && I[p.id] < 0) { ledState.set(p.id, false); changed = true; }
      }
      for (const s of sources) {
        if (s.Ilim == null) continue;
        const cc = ccState.get(s.id);
        if (!cc && I[s.id] > s.Ilim + 1e-9) { ccState.set(s.id, true); changed = true; }
        else if (cc && V[s.pos] - V[s.neg] > s.V + 1e-9) { ccState.set(s.id, false); changed = true; }
      }
      if (!changed) break;
    }
    return result;
  }

  const Engine = { solve, R_WIRE, R_AMMETER, R_VOLTMETER };
  root.Engine = Engine;
  if (typeof module !== 'undefined' && module.exports) module.exports = Engine;
})(typeof window !== 'undefined' ? window : globalThis);
