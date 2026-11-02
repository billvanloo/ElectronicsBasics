export default async function (page, out) {
  const show = async (name) => {
    const d = await page.$eval('#meter svg', e => e.getAttribute('aria-label'));
    const m = await page.$eval('#msg', e => e.innerText.replace(/\n/g, ' ').slice(0, 160));
    const r = await page.$eval('#record', e => e.textContent + (e.disabled ? ' [disabled]' : ''));
    console.log(`## ${name}\n   ${d.replace(/.*Display: /, 'display: ')}\n   ${m}\n   ${r}`);
  };
  const sel = async (id, v) => page.selectOption(id, v);
  const segClick = async (grp, label) => page.click(`#${grp} button:text-is("${label}")`);
  await sel('#redSel', 'TP2'); await sel('#blackSel', 'TP3'); await show('V across R1');
  await page.click('#record');
  await sel('#redSel', 'TP3'); await sel('#blackSel', 'TP4'); await show('V across R2');
  await page.click('#record');
  await sel('#redSel', 'TP4'); await sel('#blackSel', 'TP3'); await show('V reversed');
  await page.click('#g2Btn'); await sel('#redSel', '2A'); await sel('#blackSel', '2B'); await show('V across open gap (series voltmeter)');
  await segClick('dial', 'mA⎓'); await show('dial changed with probes on');
  await segClick('jack', 'mA'); await sel('#redSel', '2A'); await sel('#blackSel', '2B'); await show('ammeter in series across gap 2');
  await page.click('#record');
  await page.click('#g2Btn'); await sel('#redSel', 'TP2'); await sel('#blackSel', 'TP3'); await show('ammeter across R1');
  await sel('#redSel', 'TP1'); await sel('#blackSel', 'TP5'); await show('ammeter across battery');
  await page.click('#resetFuse');
  await segClick('jack', 'VΩ'); await segClick('dial', 'Ω'); await sel('#redSel', 'TP2'); await sel('#blackSel', 'TP3'); await show('ohms with power on');
  await page.click('#swBtn'); await show('ohms with power off');
  await page.click('#record');
  await segClick('dial', 'mA⎓'); await sel('#redSel', 'TP2'); await sel('#blackSel', 'TP3'); await show('mA dial, VΩ jack');
  await page.evaluate(() => window.scrollTo(0, 0));
}
