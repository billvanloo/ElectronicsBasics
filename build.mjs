// Build: inline the shared CSS/JS into each tool so every published file stands alone.
// Usage: node build.mjs   ->  dist/*.html
import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, 'src');
const out = join(here, 'dist');
mkdirSync(out, { recursive: true });

const read = p => readFileSync(join(src, p), 'utf8');
const css = read('shared/base.css');
const js = ['engine.js', 'schem.js', 'dots.js', 'bb.js', 'ui.js'].map(f => `/* ${f} */\n` + read('shared/' + f)).join('\n');

const HEAD = `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<style>
${css}
</style>`;
const SCRIPTS = `<script>
${js}
</script>`;
const FOOT = `<footer class="app-foot">
  <span>Part of <a href="index.html">Electrical Circuits Interactives</a>. Current is shown as conventional current (+ to &minus;).</span>
  <span>Works offline. No data leaves this page.</span>
</footer>`;

let n = 0;
for (const f of readdirSync(join(src, 'tools')).filter(f => f.endsWith('.html'))) {
  let html = read('tools/' + f);
  html = html.replace('{{HEAD}}', () => HEAD).replace('{{SCRIPTS}}', () => SCRIPTS).replace('{{FOOT}}', () => FOOT);
  if (/\{\{[A-Z]+\}\}/.test(html)) throw new Error('Unreplaced token in ' + f);
  writeFileSync(join(out, f), html);
  n++;
  console.log('built', f, (html.length / 1024).toFixed(1) + ' KB');
}
console.log(n + ' files -> dist/');
