import { test, expect } from '@playwright/test';

import { deflateSync } from 'zlib';

// PNG polos dibuat di sini supaya tes tidak bergantung berkas gambar di repo.
function buatPng(lebar: number, tinggi: number, warna = 0x45): Buffer {
  const crcTabel = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (buf: Buffer) => {
    let c = 0xffffffff;
    for (const b of buf) c = crcTabel[(c ^ b) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (tipe: string, data: Buffer) => {
    const isi = Buffer.concat([Buffer.from(tipe), data]);
    const panjang = Buffer.alloc(4);
    panjang.writeUInt32BE(data.length);
    const ekor = Buffer.alloc(4);
    ekor.writeUInt32BE(crc(isi));
    return Buffer.concat([panjang, isi, ekor]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(lebar, 0);
  ihdr.writeUInt32BE(tinggi, 4);
  ihdr[8] = 8; // 8 bit per kanal
  ihdr[9] = 2; // RGB
  const baris = Buffer.concat([Buffer.from([0]), Buffer.alloc(lebar * 3, warna)]);
  const piksel = Buffer.concat(Array.from({ length: tinggi }, () => baris));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(piksel)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const PNG = buatPng(400, 300);
// Foto tambahan: ukuran dan warna beda-beda, termasuk foto tegak, biar urutan dan tampilan kebaca.
const FOTO_TAMBAHAN = [
  { name: 'depan.png', buffer: buatPng(600, 400, 0x30), keterangan: 'Tampak depan' },
  { name: 'samping.png', buffer: buatPng(300, 500, 0x70), keterangan: 'Tampak samping' },
  { name: 'rangka.png', buffer: buatPng(500, 500, 0xa0), keterangan: 'Rangka sebelum atap' },
  { name: 'malam.png', buffer: buatPng(640, 360, 0xd0), keterangan: 'Malam hari' },
];

test.describe.configure({ mode: 'serial' });

test.describe('Admin di HP sampai tampil ke pelanggan', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('tanpa login, admin dan API admin tertutup', async ({ browser }) => {
    const tamu = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await tamu.newPage();
    await page.goto('/admin/layanan');
    await expect(page).toHaveURL(/\/admin\/masuk\?lanjut=/);
    expect((await page.request.get('/api/admin/state')).status()).toBe(401);
    expect((await page.request.get('/api/admin/statistik')).status()).toBe(401);
    await tamu.close();
  });

  test('alamat lama /admin/isi-data pindah ke daftar layanan', async ({ page }) => {
    await page.goto('/admin/isi-data');
    await expect(page).toHaveURL(/\/admin\/layanan$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Layanan' })).toBeVisible();
  });

  test('beranda jujur saat penghitung belum dipasang', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Penghitung kunjungan belum dipasang.')).toBeVisible();
    await expect(page.getByText(/layanan belum ada harga/)).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Menu admin' }).getByRole('link', { name: 'Beranda' })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });

  test('pemilik mengisi harga, bahan, dan foto lewat halaman ubah layanan', async ({ page }) => {
    await page.goto('/admin/layanan');
    await page.getByRole('link', { name: /Kanopi Alderon Twinwall/ }).click();
    await expect(page).toHaveURL(/\/admin\/layanan\/svc-kanopi-alderon$/);
    // Tab menu disembunyikan di halaman ubah, diganti bar Simpan.
    await expect(page.getByRole('navigation', { name: 'Menu admin' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Simpan' })).toBeDisabled();

    await page.getByLabel('Harga per m²').fill('800000');
    await expect(page.getByText('Ada perubahan belum disimpan.')).toBeVisible();
    await page.getByLabel('Bagian', { exact: true }).first().fill('Atap');
    await page.getByLabel('Bahan', { exact: true }).first().fill('Alderon RS 1,2 mm');
    await page.locator('input[type=file]').setInputFiles({ name: 'carport.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByRole('img', { name: 'Foto 1' })).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Lihat hasil' }).click();
    const lembar = page.getByRole('dialog', { name: 'Begini tampilannya di website' });
    await expect(lembar).toContainText('800.000');
    await expect(lembar).toContainText('Belum disimpan.');
    await page.keyboard.press('Escape');
    await expect(lembar).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Lihat hasil' })).toBeFocused();

    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Tersimpan. Website sudah pakai data barunya.')).toBeVisible();
    await expect(page.getByText('Lengkap. Tampil di website.')).toBeVisible();

    await page.getByRole('link', { name: 'Layanan', exact: true }).click();
    await expect(page.getByRole('link', { name: /Kanopi Alderon Twinwall/ })).toContainText('800.000');
  });

  test('pemilik mengganti tagline dan menambah kota', async ({ page }) => {
    await page.goto('/admin/pengaturan');
    await page.getByRole('textbox', { name: 'Tagline' }).fill('Spesialis kanopi Demak');
    await page.getByLabel('Kota baru').fill('kudus');
    await page.getByRole('button', { name: 'Tambah', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Hapus Kudus' })).toBeVisible();

    await page.getByLabel('Nomor yang menerima chat').fill('123');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText(/Nomornya kayaknya kurang pas/)).toBeVisible();
    await expect(page.getByLabel('Nomor yang menerima chat')).toBeFocused();

    await page.getByLabel('Nomor yang menerima chat').fill('0822 2813 2455');
    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Tersimpan. Website sudah pakai data barunya.')).toBeVisible();
  });

  test('pelanggan di browser lain melihat harga, bahan, foto, dan pengaturan baru', async ({ browser }) => {
    const pelanggan = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await pelanggan.newPage();
    await page.goto('/');

    const kartu = page.locator('#layanan > div > div.grid > div').first();
    await expect(kartu).toContainText('800.000');
    await expect(kartu).toContainText('Alderon RS 1,2 mm');
    await expect(kartu.locator('ul img')).toHaveCount(1);

    // Foto bisa diketuk buat dilihat besar, lalu ditutup dengan Escape.
    await kartu.getByRole('button', { name: /Perbesar foto 1/ }).click();
    const besar = page.getByRole('dialog', { name: /ukuran besar/ });
    await expect(besar).toBeVisible();
    await expect(besar.getByRole('img')).toBeVisible();
    await expect(besar.getByRole('button', { name: 'Tutup' })).toBeFocused();
    if (process.env.FOTO_BESAR_SS) await page.screenshot({ path: process.env.FOTO_BESAR_SS });
    await page.keyboard.press('Escape');
    await expect(besar).toHaveCount(0);
    await expect(kartu.getByRole('button', { name: /Perbesar foto 1/ })).toBeFocused();

    // Kalkulator: 5 m × 4 m = 20 m² × 800.000
    await expect(page.locator('#kalkulator')).toContainText('16.000.000');

    // Ukuran: dihapus tetap kosong (bukan 0), nol di depan dibuang, koma dan titik dipakai desimal.
    const kalkulator = page.locator('#kalkulator');
    const panjang = kalkulator.getByLabel('Panjang (meter)');
    const lebar = kalkulator.getByLabel('Lebar (meter)');
    await panjang.fill('');
    await expect(panjang).toHaveValue('');
    await expect(kalkulator).not.toContainText('16.000.000');
    await panjang.pressSequentially('05');
    await expect(panjang).toHaveValue('5');
    await panjang.fill('');
    await panjang.pressSequentially('3,5');
    await expect(panjang).toHaveValue('3,5');
    await expect(kalkulator).toContainText('3,5 m × 4 m = 14 m²');
    await expect(kalkulator).toContainText('11.200.000');
    await lebar.fill('');
    await lebar.pressSequentially('2.5');
    await expect(kalkulator).toContainText('3,5 m × 2,5 m = 8,75 m²');
    await expect(kalkulator).toContainText('7.000.000');

    // Pesan WhatsApp ikut nulis ukuran pakai koma.
    await page.evaluate(() => {
      (window as unknown as { __urlWa?: string }).__urlWa = '';
      window.open = ((url: string) => {
        (window as unknown as { __urlWa?: string }).__urlWa = url;
        return null;
      }) as typeof window.open;
    });
    await kalkulator.getByLabel('Nama').fill('Budi');
    await kalkulator.getByLabel('Lokasi / kecamatan').fill('Sayung, Demak');
    await kalkulator.getByRole('button', { name: /Lanjut chat WhatsApp/ }).click();
    const urlWa = await page.evaluate(() => (window as unknown as { __urlWa?: string }).__urlWa || '');
    const pesan = decodeURIComponent(new URL(urlWa).searchParams.get('text') || '');
    expect(pesan).toContain('3,5 m × 2,5 m (8,75 m²)');

    const footer = page.locator('footer');
    await expect(footer).toContainText('Spesialis kanopi Demak');
    await expect(footer).toContainText('Kudus');
    await expect(footer.getByRole('link', { name: /WhatsApp 082228132455/ })).toHaveAttribute('href', /wa\.me\/6282228132455/);
    await pelanggan.close();
  });

  test('pemilik menambah sampai 5 foto dengan keterangan, dan foto besar di Lihat hasil', async ({ page }) => {
    await page.goto('/admin/layanan/svc-kanopi-alderon');
    await page
      .locator('input[type=file]')
      .setInputFiles(FOTO_TAMBAHAN.map((f) => ({ name: f.name, mimeType: 'image/png', buffer: f.buffer })));
    await expect(page.getByRole('img', { name: 'Foto 5' })).toBeVisible({ timeout: 20000 });
    await page.getByLabel('Foto 1 · tampil pertama').fill('Carport rumah');
    for (let i = 0; i < FOTO_TAMBAHAN.length; i++) {
      await page.getByLabel(`Foto ${i + 2}`, { exact: true }).fill(FOTO_TAMBAHAN[i].keterangan);
    }

    // Lihat hasil: foto besar bisa dibuka, dan Escape cuma menutup foto besar, bukan lembarnya.
    await page.getByRole('button', { name: 'Lihat hasil' }).click();
    const lembar = page.getByRole('dialog', { name: 'Begini tampilannya di website' });
    await lembar.getByRole('button', { name: /Perbesar foto 1/ }).click();
    const besar = page.getByRole('dialog', { name: /ukuran besar/ });
    await expect(besar).toContainText('1 / 5');
    await page.keyboard.press('Escape');
    await expect(besar).toHaveCount(0);
    await expect(lembar).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(lembar).toHaveCount(0);

    await page.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Tersimpan. Website sudah pakai data barunya.')).toBeVisible();
  });

  test('pelanggan membuka foto ke-3 dari 5, menggeser, lalu kartu ikut ke foto terakhir dilihat', async ({ browser }) => {
    const pelanggan = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await pelanggan.newPage();
    const galat: string[] = [];
    page.on('pageerror', (e) => galat.push(e.message));
    await page.goto('/');

    const kartu = page.locator('#layanan > div > div.grid > div').first();
    await expect(kartu.locator('ul img')).toHaveCount(5);
    await expect(kartu).toContainText('Carport rumah · 1 / 5');

    // Geser galeri kartu ke foto ke-3, lalu ketuk foto itu.
    await kartu.getByRole('button', { name: 'Foto berikutnya' }).click();
    await kartu.getByRole('button', { name: 'Foto berikutnya' }).click();
    await expect(kartu).toContainText('Tampak samping · 3 / 5');
    await kartu.getByRole('button', { name: /Perbesar foto 3/ }).click();

    const besar = page.getByRole('dialog', { name: /ukuran besar/ });
    await expect(besar).toContainText('3 / 5');
    await expect(besar).toContainText('Tampak samping');
    // Foto yang tampil benar-benar foto ke-3 (ada di layar), bukan foto pertama.
    await expect(besar.getByRole('img', { name: 'Tampak samping' })).toBeInViewport();

    // Tombol, panah keyboard, dan geser layar.
    await besar.getByRole('button', { name: 'Foto berikutnya' }).click();
    await expect(besar).toContainText('4 / 5');
    await page.keyboard.press('ArrowRight');
    await expect(besar).toContainText('5 / 5');
    await expect(besar).toContainText('Malam hari');
    await expect(besar.getByRole('button', { name: 'Foto berikutnya' })).toBeDisabled();
    await page.keyboard.press('ArrowRight');
    await expect(besar).toContainText('5 / 5');

    await besar.locator('ul').evaluate((ul) => ul.scrollTo({ left: 0, behavior: 'auto' }));
    await expect(besar).toContainText('1 / 5');
    await expect(besar.getByRole('button', { name: 'Foto sebelumnya' })).toBeDisabled();
    await page.keyboard.press('ArrowLeft');
    await expect(besar).toContainText('1 / 5');

    await besar.locator('ul').evaluate((ul) => ul.scrollTo({ left: ul.clientWidth * 3, behavior: 'auto' }));
    await expect(besar).toContainText('4 / 5');
    await expect(besar).toContainText('Rangka sebelum atap');

    // Tombol di lembar besar tetap 44 px buat jempol.
    for (const nama of ['Tutup', 'Foto sebelumnya', 'Foto berikutnya']) {
      const kotak = await besar.getByRole('button', { name: nama }).boundingBox();
      expect(kotak!.height).toBeGreaterThanOrEqual(44);
      expect(kotak!.width).toBeGreaterThanOrEqual(44);
    }

    // Tutup: kartu ikut ke foto ke-4, fokus balik ke foto itu, halaman bisa di-scroll lagi.
    await besar.getByRole('button', { name: 'Tutup' }).click();
    await expect(besar).toHaveCount(0);
    await expect(kartu).toContainText('Rangka sebelum atap · 4 / 5');
    await expect(kartu.getByRole('button', { name: /Perbesar foto 4/ })).toBeFocused();
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('');

    // Buka lagi dari foto ke-4: langsung di 4, tanpa sisa dari bukaan sebelumnya.
    await kartu.getByRole('button', { name: /Perbesar foto 4/ }).click();
    await expect(page.getByRole('dialog', { name: /ukuran besar/ })).toContainText('4 / 5');
    await page.keyboard.press('Escape');

    expect(galat).toEqual([]);
    await pelanggan.close();
  });

  test('pencatat kunjungan menerima kiriman sah dan menolak sisanya', async ({ request }) => {
    expect((await request.post('/api/jejak', { data: { jenis: 'kunjungan', asal: 'instagram' } })).status()).toBe(204);
    expect((await request.post('/api/jejak', { data: { jenis: 'klik_wa', sumber: 'palsu' } })).status()).toBe(400);
    expect((await request.post('/api/jejak', { data: 'bukan json' })).status()).toBe(400);
  });
});
