export default async function (page, out) {
  // hover a strip (row 9 right in layout A)
  const strip = page.locator('#bbStage rect.hl-overlay').nth(3);
  await strip.hover({ position: { x: 9, y: 9 } });
  await page.waitForTimeout(200);
  console.log('info:', await page.$eval('#info', e => e.innerText.replace(/\n/g, ' | ')));
  await page.screenshot({ path: out + '-hover.png' });
  // keyboard: tab into bb and arrow
  await page.keyboard.press('Tab'); // layout A btn? 
  await page.focus('#bbStage [tabindex="0"]');
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Enter');
  console.log('after keys:', await page.$eval('#info', e => e.innerText.replace(/\n/g, ' | ')));
  await page.screenshot({ path: out + '-key.png' });
  await page.click('[data-layout="B"]');
  await page.click('#checkBtn');
  await page.$eval('#scStage [aria-label^="Wire between R1"]', e => e.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  console.log('check:', await page.$eval('#checkBox', e => e.innerText.replace(/\n/g, ' | ')));
}
