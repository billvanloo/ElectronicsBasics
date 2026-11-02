export default async function (page, out) {
  await page.click('#predict .choice:nth-child(1)'); await page.click('#predict .btn-primary');
  const setV = async v => { await page.$eval('#sV', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v); };
  const setR = async i => { await page.$eval('#sR', (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, i); };
  for (const v of [2, 4, 6, 8]) { await setV(v); await page.click('#add'); }
  await page.check('#fit');
  await setR(5);
  for (const v of [3, 6, 9, 12]) { await setV(v); await page.click('#add'); }
  await setR(0); await setV(12);
  await page.waitForTimeout(300);
}
