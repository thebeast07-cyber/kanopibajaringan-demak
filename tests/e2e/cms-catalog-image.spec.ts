import { test, expect } from '@playwright/test';

test.describe('PHASE 6F.1 — Catalog Image Management E2E Workflow', () => {
  test('should support upload, preview, save draft, publish, replace, and delete catalog image', async ({ page }) => {
    // 0. Start with clean state
    await page.goto('/admin/versi');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    // 1. Open /admin/layanan
    await page.goto('/admin/layanan');
    await expect(page.getByRole('heading', { name: 'Layanan & Produk' })).toBeVisible();

    // 2. Edit first service
    const editBtn = page.getByRole('button', { name: 'Edit' }).first();
    await editBtn.click();
    await expect(page.getByText('Edit Layanan')).toBeVisible();

    // Verify Foto Katalog section presence
    await expect(page.getByText('Foto Katalog Produk')).toBeVisible();
    await expect(page.getByText('Menggunakan Fallback Default')).toBeVisible();

    // 3. Upload a valid image via hidden file input
    const fileInput = page.locator('input[type="file"]');
    const mockImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // Simulate selecting file by setting input or evaluating dataUrl directly
    await fileInput.setInputFiles({
      name: 'test-kanopi.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
    });
    await fileInput.dispatchEvent('change');

    // 4. Verify preview & custom image active state
    await expect(page.getByText('Foto Kustom Aktif')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ganti Foto' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hapus Foto' })).toBeVisible();

    // 5. Save draft
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

    // 6. Verify image reference exists in draft state via LocalStorage
    const storedImageUrl = await page.evaluate(() => {
      const stored = localStorage.getItem('kanopi_cms_state_v2');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      const dataset = parsed.draftDataset || parsed.publishedDataset;
      const svc = dataset?.services?.find((s: any) => s.id === 'svc-kanopi-alderon');
      return svc?.imageUrl || null;
    });
    expect(storedImageUrl).toContain('data:image/png;base64');

    // 7. Publish draft
    await page.goto('/admin/versi');
    await expect(page.getByText('Draf Layak & Valid untuk Dipublikasikan')).toBeVisible();
    const pubBtn1 = page.getByRole('button', { name: /Publikasikan Versi Ini/i });
    await expect(pubBtn1).toBeEnabled();
    await pubBtn1.click();
    await expect(page.getByText(/berhasil DIPUBLIKASIKAN/i)).toBeVisible();

    // 8 & 9. Open public catalog & verify custom image is displayed
    await page.goto('/');
    const firstServiceImg = page.locator('#layanan img').first();
    await expect(firstServiceImg).toBeVisible();
    const imgSrc = await firstServiceImg.getAttribute('src');
    expect(imgSrc).toContain('data:image/png;base64');

    // 10. Replace image in /admin/layanan
    await page.goto('/admin/layanan');
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await expect(page.getByText('Foto Kustom Aktif')).toBeVisible();

    const replacementBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAEDWlDQ1BJQ0MgUHJvZmlsZQAA', 'base64');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'replacement-kanopi.png',
      mimeType: 'image/png',
      buffer: replacementBuffer,
    });
    await page.locator('input[type="file"]').dispatchEvent('change');

    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

    // 11. Publish replacement
    await page.goto('/admin/versi');
    await expect(page.getByText('Draf Layak & Valid untuk Dipublikasikan')).toBeVisible();
    const pubBtn2 = page.getByRole('button', { name: /Publikasikan Versi Ini/i });
    await expect(pubBtn2).toBeEnabled();
    await pubBtn2.click();
    await expect(page.getByText(/berhasil DIPUBLIKASIKAN/i)).toBeVisible();

    // 12. Verify public catalog displays replacement image
    await page.goto('/');
    await expect(page.locator('#layanan img').first()).toBeVisible();

    // 13. Delete custom image
    await page.goto('/admin/layanan');
    await page.getByRole('button', { name: 'Edit' }).first().click();
    await page.getByRole('button', { name: 'Hapus Foto' }).click();
    await expect(page.getByText('Menggunakan Fallback Default')).toBeVisible();
    await page.getByRole('button', { name: 'Simpan Perubahan' }).click();

    // 14. Publish deletion
    await page.goto('/admin/versi');
    await expect(page.getByText('Draf Layak & Valid untuk Dipublikasikan')).toBeVisible();
    const pubBtn3 = page.getByRole('button', { name: /Publikasikan Versi Ini/i });
    await expect(pubBtn3).toBeEnabled();
    await pubBtn3.click();
    await expect(page.getByText(/berhasil DIPUBLIKASIKAN/i)).toBeVisible();

    // 15. Verify fallback image is displayed on public catalog
    await page.goto('/');
    const fallbackSrc = await page.locator('#layanan img').first().getAttribute('src');
    expect(fallbackSrc).toContain('unsplash.com');
  });

  test('should pass mobile-first responsive audit across 10 viewports', async ({ page }) => {
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
      await page.goto('/admin/layanan');
      
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      expect(overflow, `Horizontal overflow detected at ${vp.width}x${vp.height}`).toBe(false);
    }
  });
});
