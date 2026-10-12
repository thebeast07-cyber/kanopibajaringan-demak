import { test, expect } from '@playwright/test';

test.describe('Halaman depan', () => {
  test('terbuka tanpa error dan tidak pernah menampilkan Rp 0', async ({ page }) => {
    const galat: string[] = [];
    page.on('pageerror', (e) => galat.push(e.message));

    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Mau pasang kanopi?');
    await expect(page.locator('#kalkulator')).toBeVisible();

    const teks = (await page.locator('body').innerText()).replace(/ /g, ' ');
    expect(teks).not.toMatch(/Rp 0(?![\d.])/);
    expect(galat).toEqual([]);
  });
});
