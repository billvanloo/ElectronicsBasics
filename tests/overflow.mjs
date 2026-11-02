export default async function (page) {
  const r = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.right > window.innerWidth + 1 && b.width > 0; }).slice(0, 8).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right)));
  console.log(r.join('\n'));
}
