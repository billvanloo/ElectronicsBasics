export default async function (page, out) {
  await page.waitForTimeout(2500);
  await page.screenshot({ path: out + '-s1.png' });
  for (let i = 0; i < 4; i++) await page.click('#next');
  await page.click('#play');
  await page.waitForTimeout(1500);
}
