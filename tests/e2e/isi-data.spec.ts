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

test.describe('Isi data layanan sampai tampil ke pelanggan', () => {
  test('tanpa login, admin dan API admin tertutup', async ({ browser }) => {
    const tamu = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await tamu.newPage();
    await page.goto('/admin/isi-data');
    await expect(page).toHaveURL(/\/admin\/masuk\?lanjut=/);
    expect((await page.request.get('/api/admin/state')).status()).toBe(401);
    await tamu.close();
  });

  test('pemilik mengisi harga, bahan, dan foto', async ({ page }) => {
    await page.goto('/admin/isi-data');
    const kartu = page.locator('main ul.space-y-4 > li').first();
    await kartu.getByRole('button', { name: 'Isi data' }).click();

    await kartu.getByLabel('Harga borongan per m² (Rp)').fill('800000');
    await kartu.getByLabel('Bagian', { exact: true }).first().fill('Atap');
    await kartu.getByLabel('Bahan', { exact: true }).first().fill('Alderon RS 1,2 mm');
    await kartu.locator('input[type=file]').setInputFiles({ name: 'carport.png', mimeType: 'image/png', buffer: PNG });
    await expect(kartu.getByRole('img', { name: 'Foto 1' })).toBeVisible({ timeout: 15000 });

    await kartu.getByRole('button', { name: 'Simpan' }).click();
    await expect(page.getByText('Kanopi Alderon Twinwall / RS tersimpan.')).toBeVisible();
    await expect(page.locator('main ul.space-y-4 > li').first()).toContainText('Lengkap.');
  });

  test('pelanggan di browser lain melihat harga, bahan, dan foto', async ({ browser }) => {
    const pelanggan = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await pelanggan.newPage();
    await page.goto('/');

    const kartu = page.locator('#layanan > div > div.grid > div').first();
    await expect(kartu).toContainText('800.000');
    await expect(kartu).toContainText('Alderon RS 1,2 mm');
    await expect(kartu.locator('ul img')).toHaveCount(1);

    // Kalkulator: 5 m × 4 m = 20 m² × 800.000
    await expect(page.locator('#kalkulator')).toContainText('16.000.000');
    await pelanggan.close();
  });
});
