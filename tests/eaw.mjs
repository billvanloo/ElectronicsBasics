export default async function (page, out) {
  await page.waitForTimeout(1200);
  await page.screenshot({ path: out + '-start.png' });
  const set = async (id, v) => page.$eval(id, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  // high resistance: high voltage, low current
  await set('#sV', 24); await set('#sI', 5); await page.waitForTimeout(800);
  await page.screenshot({ path: out + '-narrow.png' });
  console.log('narrow readouts:', await page.$eval('#readouts', e => e.innerText.replace(/\n/g, ' ')));
  // valve closed
  await set('#sI', 0); await page.waitForTimeout(500);
  console.log('closed:', await page.$eval('#readouts', e => e.innerText.replace(/\n/g, ' ')));
  // predict flow
  await page.click('#predict .choice:nth-child(1)'); await page.click('#predict .btn-primary');
  await set('#sV', 12); await page.waitForTimeout(600);
  console.log('after doubling:', await page.$eval('#readouts', e => e.innerText.replace(/\n/g, ' ')));
  console.log('reveal:', await page.$eval('#predict', e => e.innerText.replace(/\n/g, ' ').slice(-200)));
  console.log('caption:', await page.$eval('.caption-text', e => e.textContent));
}
