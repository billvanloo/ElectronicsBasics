export default async function (page, out) {
  const cards = await page.$$('.card');
  const id = await cards[0].getAttribute('data-id');
  const wrong = { S: 'parallel', P: 'combined', C: 'series' }[id[0]];
  const right = { S: 'series', P: 'parallel', C: 'combined' }[id[0]];
  const drag = async (bin) => {
    const gb = await (await cards[0].$('.grip')).boundingBox();
    const bb = await (await page.$(`.bin[data-bin="${bin}"]`)).boundingBox();
    await page.mouse.move(gb.x + 10, gb.y + 10); await page.mouse.down();
    await page.mouse.move(gb.x + 40, gb.y - 20, { steps: 5 }); await page.mouse.move(bb.x + 40, bb.y + 20, { steps: 10 }); await page.mouse.up();
  };
  await drag(wrong);
  console.log('after wrong drag:', await cards[0].$eval('.fb', e => e.textContent).catch(() => 'no feedback'));
  await drag(right);
  console.log('after right drag:', await cards[0].$eval('.fb', e => e.textContent).catch(() => 'no feedback'));
  // keyboard: focus card 2, press number key
  const id2 = await cards[1].getAttribute('data-id');
  await cards[1].focus(); await page.keyboard.press({ S: '1', P: '2', C: '3' }[id2[0]]);
  console.log('keyboard sort:', await cards[1].$eval('.fb', e => e.textContent));
  // sort the rest correctly to see the summary
  for (const c of cards.slice(2)) { const i = await c.getAttribute('data-id'); await (await c.$(`[data-sort="${{ S: 'series', P: 'parallel', C: 'combined' }[i[0]]}"]`)).click(); }
  console.log(await page.$eval('#summary', e => e.textContent));
}
