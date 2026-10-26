const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const tl = JSON.parse(fs.readFileSync(path.join(__dirname, '../suara/timeline.json')));
  const dir = path.join(__dirname, 'frame'); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const err = []; p.on('pageerror', e => err.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'animasi.html'));
  await p.evaluate(tl => window.siapkan(tl), tl);
  const n = Math.ceil(tl.total * tl.fps);
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    await p.evaluate(t => window.gambar(t), i / tl.fps);
    await p.screenshot({ path: path.join(dir, String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (i % 300 === 0) console.log(i, '/', n, Math.round((Date.now() - t0) / 1000) + 's');
  }
  console.log('selesai', n, 'frame', Math.round((Date.now() - t0) / 1000) + 's', 'errors:', err.slice(0, 5));
  await b.close();
})();
