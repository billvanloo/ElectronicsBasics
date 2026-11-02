// usage: node tests/shot.mjs <file.html> [outPrefix] [--mobile] [--script=path.js]
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { resolve } from 'path';
const args = process.argv.slice(2);
const file = args[0];
const out = args[1] && !args[1].startsWith('--') ? args[1] : 'test-output/shot';
const mobile = args.includes('--mobile');
const scriptArg = args.find(a => a.startsWith('--script='));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: mobile ? { width: 390, height: 844 } : { width: 1280, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
await page.goto('file://' + resolve('dist', file));
await page.waitForTimeout(600);
if (scriptArg) {
  const { default: run } = await import(resolve(scriptArg.slice(9)));
  await run(page, out);
}
await page.screenshot({ path: out + (mobile ? '-m' : '') + '.png', fullPage: true });
const sw = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
console.log('horizontal overflow:', sw);
console.log(errors.length ? errors.join('\n') : 'no console errors');
await browser.close();
