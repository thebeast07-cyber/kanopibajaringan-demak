const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const tl = JSON.parse(fs.readFileSync(path.join(__dirname, '../suara/timeline.json')));
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const err = []; p.on('pageerror', e => err.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'animasi.html'));
  await p.evaluate(tl => window.siapkan(tl), tl);
  const waktu = process.argv.slice(2).map(Number);
  for (const t of waktu) {
    await p.evaluate(t => window.gambar(t), t);
    await p.screenshot({ path: path.join(__dirname, `cuplik-${t.toFixed(1)}.jpg`), type: 'jpeg', quality: 80 });
  }
  console.log('errors:', err);
  await b.close();
})();
