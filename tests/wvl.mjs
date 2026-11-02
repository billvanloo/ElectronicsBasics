export default async function (page, out) {
  await page.fill('#pR1', '3'); await page.fill('#pR2', '3'); await page.fill('#pR3', '3');
  await page.click('#lock');
  await page.click('#start');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: out + '-mid.png' });
  await page.waitForTimeout(5500);
  await page.$eval('#sR2', el => { el.value = 4; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.click('#cases .case:nth-child(1) .choice:nth-child(3)');
  await page.click('#cases .case:nth-child(1) .btn-primary');
}
