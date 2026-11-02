import { createRequire } from 'module';
import { readdirSync } from 'fs';
const { chromium } = createRequire(import.meta.url)('playwright');
const browser = await chromium.launch();
const files = readdirSync('dist').filter(f => f.endsWith('.html'));
for (const scheme of ['light', 'dark']) for (const f of files) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce', colorScheme: scheme });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + process.cwd() + '/dist/' + f);
  await page.waitForTimeout(500);
  // keyboard: tab through up to 60 stops; count distinct focusable stops and any without accessible name
  const names = new Set(); let unnamed = 0;
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const n = a.getAttribute('aria-label') || a.textContent.trim() || a.getAttribute('title') || (a.labels && a.labels[0] && a.labels[0].textContent) || ''; return { tag: a.tagName, n: n.slice(0, 40) }; });
    if (!info) continue; names.add(info.tag + ':' + info.n); if (!info.n) unnamed++;
  }
  // reduced motion: dots must not move
  const moving = await page.evaluate(async () => { const d = [...document.querySelectorAll('circle.dot')].slice(0, 5); const a = d.map(x => x.getAttribute('cx') + ',' + x.getAttribute('cy')); await new Promise(r => setTimeout(r, 400)); return d.some((x, i) => x.getAttribute('cx') + ',' + x.getAttribute('cy') !== a[i]); });
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`${scheme.padEnd(5)} ${f.padEnd(34)} tabstops=${names.size} unnamed=${unnamed} dotsMoveWithReducedMotion=${moving} bg=${bg} errors=${errs.length ? errs.join('; ') : 0}`);
  if (scheme === 'dark' && (f === 'ohms-law-explorer.html' || f === 'remove-a-bulb.html')) await page.screenshot({ path: 'test-output/dark-' + f + '.png' });
  await ctx.close();
}
await browser.close();
