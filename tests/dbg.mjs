export default async function (page) {
  await page.click('#predict-parallel .choice:nth-child(1)');
  await page.click('#predict-parallel .btn-primary');
  await page.click('#controls-parallel button:first-child');
  await page.waitForTimeout(900);
  console.log(await page.evaluate(() => [...document.querySelectorAll('#stage-parallel .lift')].map(g => g.getAttribute('class') + ' ' + getComputedStyle(g).translate + ' ' + getComputedStyle(g).opacity + ' anim:' + g.getAnimations().map(a=>a.playState).join(','))));
}
