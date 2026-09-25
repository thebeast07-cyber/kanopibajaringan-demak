import { test, expect } from '@playwright/test';

test.describe('PHASE 6E — Product & Pricing Configuration Handbook E2E', () => {
  test('should load handbook page and display all 18 Indonesian chapters', async ({ page }) => {
    await page.goto('/admin/panduan');
    await expect(page.getByRole('heading', { name: /Panduan Konfigurasi/i })).toBeVisible();

    // Check search input
    const searchInput = page.locator('input[placeholder*="Cari topik"]');
    await expect(searchInput).toBeVisible();

    // Verify presence of all 18 chapters
    const chapters = [
      '1. Memahami Sistem Harga',
      '2. Menyiapkan Data Produk',
      '3. Menentukan Satuan Harga',
      '4. Katalog Bahan Penutup',
      '5. Katalog Rangka Utama',
      '6. Katalog Pengerjaan & Upah',
      '7. Katalog Finishing & Cat',
      '8. Katalog Opsi Tambahan & Aksesoris',
      '9. Ukuran & Minimum Billing',
      '10. Menyusun Urutan Cara Hitung',
      '11. Percentage (%) & Multiplier (Pengali)',
      '12. Custom Input (Input Kustom Pelanggan)',
      '13. Simulasi Kalkulasi Real-Time',
      '14. Impact Preview (Pratinjau Dampak)',
      '15. Pemeriksaan Validasi Data',
      '16. Menerbitkan Versi (Publish & Keabadian Historical)',
      '17. Contoh Lengkap Alur Konfigurasi Gerobak UMKM',
      '18. Checklist Mandiri Sebelum Publish',
    ];

    for (const title of chapters) {
      await expect(page.getByText(title).first()).toBeVisible();
    }
  });

  test('should navigate via contextual links from admin pages', async ({ page }) => {
    await page.goto('/admin/layanan');
    const helpBtn = page.getByRole('link', { name: /Panduan Produk/i });
    await expect(helpBtn).toBeVisible();
    const href = await helpBtn.getAttribute('href');
    expect(href).toBe('/admin/panduan#s2-data-produk');
    await page.goto(href!);
    await expect(page.locator('#s2-data-produk')).toBeVisible();
  });

  test('should filter chapters using search input', async ({ page }) => {
    await page.goto('/admin/panduan');
    const searchInput = page.locator('input[placeholder*="Cari topik"]');
    await searchInput.fill('Gerobak');
    await expect(page.getByText('17. Contoh Lengkap Alur Konfigurasi Gerobak UMKM')).toBeVisible();
  });

  test('should pass responsive audit across 10 viewports without horizontal scroll overflow', async ({ page }) => {
    const viewports = [
      { width: 320, height: 568 },
      { width: 360, height: 640 },
      { width: 375, height: 667 },
      { width: 390, height: 844 },
      { width: 412, height: 915 },
      { width: 768, height: 1024 },
      { width: 1024, height: 768 },
      { width: 1280, height: 800 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.goto('/admin/panduan');
      
      // Ensure page container fits viewport width without horizontal overflow
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(overflow, `Horizontal overflow detected at ${vp.width}x${vp.height}`).toBe(false);
    }
  });
});
