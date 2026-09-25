import { test, expect } from '@playwright/test';

test.describe('CMS-PUBLISH-01: End-to-End CMS Admin Pricing Publish to Public Estimator Journey', () => {
  test('should propagate admin pricing modifications through impact preview, publish, and update public estimator calculation', async ({ page }) => {
    // Start with clean state
    await page.goto('/admin/versi');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();

    // === 1. ADMIN VERSION MANAGEMENT (/admin/versi) ===
    // Verify initial published baseline version exists
    await expect(page.getByText('v1.0.0-dev').first()).toBeVisible();
    await expect(page.getByText('published', { exact: true })).toBeVisible();

    // Create a new draft version from published baseline
    const createDraftButton = page.getByRole('button', { name: /Buat Draf Versi Baru/i });
    await createDraftButton.click();

    // Verify draft notice and active draft status badge
    await expect(page.getByText(/Draf versi baru.*berhasil dibuat/i)).toBeVisible();
    await expect(page.getByText('draft', { exact: true })).toBeVisible();

    // === 2. ADMIN MATERIAL PRICING EDIT (/admin/bahan) ===
    await page.goto('/admin/bahan');

    // Find row for "Alderon Twinwall 10mm (Double Layer)" and click Edit
    const alderonRow = page.locator('tr').filter({ hasText: 'Alderon Twinwall 10mm (Double Layer)' });
    await expect(alderonRow).toBeVisible();
    await alderonRow.getByRole('button', { name: /Edit/i }).click();

    // Update material rate from Rp 320.000 to Rp 400.000
    const rateInput = page.locator('input[type="number"]');
    await expect(rateInput).toBeVisible();
    await rateInput.fill('400000');
    await page.getByRole('button', { name: /Simpan Perubahan/i }).click();

    // Verify draft price update in table
    await expect(alderonRow.getByText('Rp 400.000')).toBeVisible();

    // === 3. IMPACT PREVIEW & STRUCTURAL VALIDATION (/admin/versi) ===
    await page.goto('/admin/versi');

    // Verify Impact Preview card is rendered
    await expect(page.getByText('Pratinjau Dampak Perubahan Harga (Impact Preview)')).toBeVisible();
    await expect(page.getByText('Rp 15.700.000')).toBeVisible(); // Published total
    await expect(page.getByText('Rp 17.300.000')).toBeVisible(); // Draft total (+1,600,000)
    await expect(page.getByText('+10.19%')).toBeVisible();

    // Verify Structural Validation passed
    await expect(page.getByText('Draf Layak & Valid untuk Dipublikasikan')).toBeVisible();

    // === 4. PUBLISH DRAFT TO PRODUCTION ===
    const publishButton = page.getByRole('button', { name: /Publikasikan Versi Ini/i });
    await expect(publishButton).toBeEnabled();
    await publishButton.click();

    // Verify publication notice
    await expect(page.getByText(/telah resmi DIPUBLIKASIKAN/i)).toBeVisible();

    // === 5. VERSION INTEGRITY VERIFICATION ===
    // Newly published version (v1.1.0) should now be published, and v1.0.0 archived
    await expect(page.getByText('published', { exact: true })).toBeVisible();
    await expect(page.getByText('archived', { exact: true })).toBeVisible();

    // === 6. PUBLIC ESTIMATOR INTEGRATION (/#kalkulator) ===
    await page.goto('/#kalkulator');
    const estimatorSection = page.locator('#kalkulator');

    // Run baseline scenario (5m x 4m = 20 m2)
    await expect(page.getByRole('heading', { name: 'Hitung Perkiraan Biaya Kanopi & Atap Anda' })).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Masukkan Ukuran' }).click();

    const lengthInput = page.locator('input[type="number"]').nth(0);
    const widthInput = page.locator('input[type="number"]').nth(1);
    await lengthInput.fill('5');
    await widthInput.fill('4');
    await page.getByRole('button', { name: 'Lanjut: Material Atap' }).click();

    // Verify default selected material is Alderon Twinwall
    await expect(page.getByText('Alderon Twinwall 10mm (Double Layer)')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Spesifikasi Rangka' }).click();

    await page.getByRole('button', { name: 'Lanjut: Tambahan' }).click();

    // CRITICAL PROOF: Public Estimator MUST now display the newly published total Rp 17.300.000
    const updatedPublicTotal = estimatorSection.getByText('Rp 17.300.000');
    await expect(updatedPublicTotal).toBeVisible();
    await expect(estimatorSection.getByText('Rp 15.700.000')).not.toBeVisible();
    await expect(estimatorSection.getByText('Volume Dihitung: 20 m2')).toBeVisible();
  });
});
