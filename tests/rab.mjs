export default async function (page, out) {
  await page.click('#predict-series .choice:nth-child(3)');
  await page.click('#predict-series .btn-primary');
  await page.click('#controls-series button:first-child');
  await page.click('#predict-parallel .choice:nth-child(1)');
  await page.click('#predict-parallel .btn-primary');
  await page.click('#controls-parallel button:first-child');
  await page.waitForTimeout(900);
}
