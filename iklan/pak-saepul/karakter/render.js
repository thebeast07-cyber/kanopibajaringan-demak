const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1620 } });
  for (const s of ['A', 'B', 'C']) {
    await p.goto('file://' + path.join(__dirname, 'sheet.html') + '?s=' + s);
    await p.waitForSelector('body[data-siap="1"]');
    await p.waitForTimeout(300);
    await p.screenshot({ path: path.join(__dirname, `gaya-${s}.png`) });
  }
  await b.close();
})();
