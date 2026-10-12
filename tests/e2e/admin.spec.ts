import { test, expect } from '@playwright/test';

import { deflateSync } from 'zlib';

// PNG polos dibuat di sini supaya tes tidak bergantung berkas gambar di repo.
function buatPng(lebar: number, tinggi: number): Buffer {
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
  const baris = Buffer.concat([Buffer.from([0]), Buffer.alloc(lebar * 3, 0x45)]);
  const piksel = Buffer.concat(Array.from({ length: tinggi }, () => baris));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(piksel)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const PNG = buatPng(40, 30);

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

    // Kalkulator: 5 m × 4 m = 20 m² × 800.000
    await expect(page.locator('#kalkulator')).toContainText('16.000.000');

    const footer = page.locator('footer');
    await expect(footer).toContainText('Spesialis kanopi Demak');
    await expect(footer).toContainText('Kudus');
    await expect(footer.getByRole('link', { name: /WhatsApp 082228132455/ })).toHaveAttribute('href', /wa\.me\/6282228132455/);
    await pelanggan.close();
  });

  test('pencatat kunjungan menerima kiriman sah dan menolak sisanya', async ({ request }) => {
    expect((await request.post('/api/jejak', { data: { jenis: 'kunjungan', asal: 'instagram' } })).status()).toBe(204);
    expect((await request.post('/api/jejak', { data: { jenis: 'klik_wa', sumber: 'palsu' } })).status()).toBe(400);
    expect((await request.post('/api/jejak', { data: 'bukan json' })).status()).toBe(400);
  });
});
