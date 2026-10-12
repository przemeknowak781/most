// Regression check: horizontal overflow and console errors on every page at
// six widths (1440, 1024, 768, 390, 320, 2560). Serve the repo first:
//   python3 -m http.server 8802
//   NODE_PATH=$(npm root -g) node docs/tools/reg.js [port] [pages,comma]
// Prints one ISSUE line per page and width that fails, then "done, issues: N".
const { chromium } = require('playwright');
const port = process.argv[2] || '8802';
const pages = (process.argv[3] || 'index,about-us,expertise,our-team,contact,for-founders,for-companies,for-investors').split(',');
(async () => {
  const b = await chromium.launch({ args: ['--ignore-certificate-errors'] });
  let bad = 0;
  for (const [w, h, mob] of [[1440, 900, false], [1024, 768, false], [768, 1024, true], [390, 844, true], [320, 640, true], [2560, 1300, false]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: mob, hasTouch: mob, ignoreHTTPSErrors: true });
    for (const p of pages) {
      const pg = await ctx.newPage(); const errs = [];
      pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      await pg.goto(`http://127.0.0.1:${port}/${p}.html`, { waitUntil: 'networkidle' });
      await pg.evaluate(() => document.fonts.ready);
      const H = await pg.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += 600) { await pg.evaluate(y => scrollTo(0, y), y); await pg.waitForTimeout(40); }
      await pg.waitForTimeout(300);
      const ov = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      if (ov > 0 || errs.length) { bad++; console.log('ISSUE', w, p, 'overflow', ov, errs.slice(0, 2).join(' | ')); }
      await pg.close();
    }
    await ctx.close();
  }
  console.log('done, issues:', bad);
  await b.close();
})();
