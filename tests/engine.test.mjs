import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const E = require('../src/shared/engine.js');
let fails = 0;
const near = (a, b, tol, msg) => { const ok = Math.abs(a - b) <= tol; if (!ok) fails++; console.log((ok ? 'ok  ' : 'FAIL') + ' ' + msg + ': ' + a.toFixed(6) + ' vs ' + b); };
// series 9V, 1k + 2.2k
let r = E.solve([{id:'B',type:'vsource',pos:'p',neg:'g',V:9},{id:'R1',type:'resistor',a:'p',b:'m',R:1000},{id:'R2',type:'resistor',a:'m',b:'g',R:2200}]);
near(r.I.B*1000, 2.8125, 1e-6, 'series current mA'); near(r.V.m, 6.1875, 1e-6, 'V across R2');
// junction 6V, 300 || 600
r = E.solve([{id:'B',type:'vsource',pos:'p',neg:'g',V:6},{id:'R1',type:'resistor',a:'p',b:'g',R:300},{id:'R2',type:'resistor',a:'p',b:'g',R:600}]);
near(r.I.B*1000, 30, 1e-6, 'junction total'); near(r.I.R1*1000, 20, 1e-6, 'R1 branch'); near(r.I.R2*1000, 10, 1e-6, 'R2 branch');
// KVL loop 9V 1k 2k 3k
r = E.solve([{id:'B',type:'vsource',pos:'B',neg:'A',V:9},{id:'R1',type:'resistor',a:'B',b:'C',R:1000},{id:'R2',type:'resistor',a:'C',b:'D',R:2000},{id:'R3',type:'resistor',a:'D',b:'A',R:3000}]);
near(r.V.C, 7.5, 1e-6, 'V_C'); near(r.V.D, 4.5, 1e-6, 'V_D');
// LED 9V 470
r = E.solve([{id:'B',type:'vsource',pos:'p',neg:'g',V:9},{id:'SW',type:'switch',a:'p',b:'s',closed:true},{id:'R1',type:'resistor',a:'s',b:'k',R:470},{id:'D1',type:'led',a:'k',b:'g',Vf:2.0,Rs:15}]);
near(r.I.D1*1000, 7/485*1000, 1e-3, 'LED current mA');
r = E.solve([{id:'B',type:'vsource',pos:'p',neg:'g',V:9},{id:'SW',type:'switch',a:'p',b:'s',closed:false},{id:'R1',type:'resistor',a:'s',b:'k',R:470},{id:'D1',type:'led',a:'k',b:'g',Vf:2.0,Rs:15}]);
near(r.I.D1*1000, 0, 1e-3, 'LED off when switch open');
// series bulbs with one removed
r = E.solve([{id:'B',type:'vsource',pos:'p',neg:'g',V:6},{id:'A',type:'lamp',a:'p',b:'m',R:50,removed:true},{id:'Bb',type:'lamp',a:'m',b:'g',R:50}]);
near(r.I.Bb, 0, 1e-9, 'series other bulb dark');
// CC mode: 12V across 100 ohm, limit 50 mA
r = E.solve([{id:'PS',type:'vsource',pos:'p',neg:'g',V:12,Ilim:0.05},{id:'R',type:'resistor',a:'p',b:'g',R:100}]);
near(r.V.p, 5, 1e-6, 'CC voltage'); console.log('mode', r.mode.PS); if (r.mode.PS !== 'CC') fails++;
r = E.solve([{id:'PS',type:'vsource',pos:'p',neg:'g',V:3,Ilim:0.05},{id:'R',type:'resistor',a:'p',b:'g',R:100}]);
near(r.V.p, 3, 1e-6, 'CV voltage'); if (r.mode.PS !== 'CV') fails++;
// ammeter across resistor (short)
r = E.solve([{id:'B',type:'vsource',pos:'p',neg:'g',V:9},{id:'R1',type:'resistor',a:'p',b:'m',R:1000},{id:'R2',type:'resistor',a:'m',b:'g',R:2200},{id:'AM',type:'ammeter',a:'p',b:'m'}]);
console.log('ammeter-in-parallel current mA', (r.I.AM*1000).toFixed(2));
// voltmeter in series gap
r = E.solve([{id:'B',type:'vsource',pos:'p',neg:'g',V:9},{id:'VM',type:'voltmeter',a:'p',b:'x'},{id:'R1',type:'resistor',a:'x',b:'m',R:1000},{id:'R2',type:'resistor',a:'m',b:'g',R:2200}]);
near(r.V.p - r.V.x, 9, 0.01, 'voltmeter in series reads ~battery');
console.log(fails ? fails + ' FAILURES' : 'all engine tests passed'); process.exit(fails ? 1 : 0);
