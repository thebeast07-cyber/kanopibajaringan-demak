import { test, expect } from '@playwright/test';

test.describe('PHASE 6B — Add-on Category Management & Mobile Viewport E2E', () => {
  test('should allow creating, editing, filtering add-on categories and adapt to mobile viewports cleanly', async ({ page }) => {
    // 1. Initial desktop navigation to /admin/tambahan
    await page.goto('/admin/tambahan');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    await expect(page.getByRole('heading', { name: 'Biaya & Opsi Tambahan' })).toBeVisible();

    // 2. Edit existing add-on "Talang Air PVC" and assign category "Aksesoris Air"
    const talangRow = page.locator('tr').filter({ hasText: 'Talang Air PVC' });
    await expect(talangRow).toBeVisible();
    await talangRow.getByRole('button', { name: /Edit/i }).click();

    const categoryInput = page.locator('input[placeholder*="Aksesoris, Interior"]');
    await expect(categoryInput).toBeVisible();
    await categoryInput.fill('Aksesoris Air');
    await page.getByRole('button', { name: /Simpan Perubahan/i }).click();

    // Verify category badge appears on row
    await expect(talangRow.getByText('Aksesoris Air')).toBeVisible();

    // 3. Create a new add-on with category "Aksesoris Utilitas"
    await page.getByRole('button', { name: /Tambah Tambahan/i }).click();

    const nameInput = page.locator('input[placeholder*="Lampu LED Strip"]');
    await nameInput.fill('Lampu Spot LED 7W');

    await categoryInput.fill('Aksesoris Utilitas');

    const rateInput = page.locator('input[type="number"]');
    await rateInput.fill('75000');

    await page.locator('form').getByRole('button', { name: 'Tambah Tambahan' }).click();

    // Verify new add-on appears in table with category badge
    const newAddonRow = page.locator('tr').filter({ hasText: 'Lampu Spot LED 7W' });
    await expect(newAddonRow).toBeVisible();
    await expect(newAddonRow.getByText('Aksesoris Utilitas')).toBeVisible();

    // 4. Verify Category filter bar options
    await expect(page.getByRole('button', { name: 'Semua Kategori' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aksesoris Utilitas' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Aksesoris Air' })).toBeVisible();

    // Filter by "Aksesoris Utilitas"
    await page.getByRole('button', { name: 'Aksesoris Utilitas' }).click();
    await expect(newAddonRow).toBeVisible();
    await expect(talangRow).not.toBeVisible();

    // Reset filter
    await page.getByRole('button', { name: 'Semua Kategori' }).click();
    await expect(talangRow).toBeVisible();

    // 5. Test Mobile Viewport Responsiveness (375px width)
    await page.setViewportSize({ width: 375, height: 667 });

    // Verify header and filter bar fit mobile viewport without error
    await expect(page.getByRole('heading', { name: 'Biaya & Opsi Tambahan' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Semua Kategori' })).toBeVisible();

    // Verify horizontal scrollbar container exists for table
    const tableContainer = page.locator('.overflow-x-auto');
    await expect(tableContainer).toBeVisible();
  });
});
