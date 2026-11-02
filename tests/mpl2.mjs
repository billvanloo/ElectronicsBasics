export default async function (page, out) {
  await page.click('#g2Btn');
  await page.click('#dial button:text-is("mA⎓")'); await page.click('#jack button:text-is("mA")');
  await page.click('[data-tp="2A"] .ring'); await page.click('[data-tp="2B"] .ring');
  await page.waitForTimeout(200);
}
