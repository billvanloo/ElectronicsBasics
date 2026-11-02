export default async function (page, out) {
  // flip every card to breadboard to check all 9 layouts
  const cards = await page.$$('.card');
  for (const c of cards) { const b = await c.$('.seg button:nth-child(2)'); await b.click(); }
  await page.screenshot({ path: out + '-bb.png', fullPage: true });
  for (const c of cards) { const b = await c.$('.seg button:nth-child(1)'); await b.click(); }
  // drag the first card to Parallel bin
  const grip = await cards[0].$('.grip'); const gb = await grip.boundingBox();
  const bin = await page.$('.bin[data-bin="parallel"]'); const bb = await bin.boundingBox();
  await page.mouse.move(gb.x + 10, gb.y + 10); await page.mouse.down();
  await page.mouse.move(gb.x + 40, gb.y - 20, { steps: 5 }); await page.mouse.move(bb.x + 40, bb.y + 20, { steps: 10 }); await page.mouse.up();
  // sort the second via buttons using correct answer by reading data-id
  const id = await cards[1].getAttribute('data-id');
  const map = { S: 'series', P: 'parallel', C: 'combined' };
  await (await cards[1].$(`[data-sort="${map[id[0]]}"]`)).click();
  await (await cards[2].$('.btn-small')).click();
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo(0, 0));
}
