import { test, expect } from '@playwright/test';

test.describe('ADDON-01: Add-on Selection Calculation Regression Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Reset localStorage before page load to ensure clean COMPREHENSIVE_DATASET baseline
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('should update total calculation deterministically when an add-on is selected', async ({ page }) => {
    // 1. Navigate to estimator section
    await page.goto('/#kalkulator');

    // Scope locators to estimator container to avoid text collision with Hero example
    const estimatorSection = page.locator('#kalkulator');

    // 2. Step 1: Service Selection
    await expect(page.getByRole('heading', { name: 'Hitung Perkiraan Biaya Kanopi & Atap Anda' })).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Masukkan Ukuran' }).click();

    // 3. Step 2: Dimension Step (5m x 4m = 20 m2)
    const lengthInput = page.locator('input[type="number"]').nth(0);
    const widthInput = page.locator('input[type="number"]').nth(1);
    await lengthInput.fill('5');
    await widthInput.fill('4');
    await page.getByRole('button', { name: 'Lanjut: Material Atap' }).click();

    // 4. Step 3: Material Step
    await page.getByRole('button', { name: 'Lanjut: Spesifikasi Rangka' }).click();

    // 5. Step 4: Frame & Finishing Step
    await page.getByRole('button', { name: 'Lanjut: Tambahan' }).click();

    // 6. Step 5: Add-ons & Site Conditions Step
    await expect(page.getByText('05. Pekerjaan Tambahan & Akses Lokasi (Opsional)')).toBeVisible();

    // 7. Verify baseline total before selecting add-on
    const baselineTotalElement = estimatorSection.getByText('Rp 15.700.000');
    await expect(baselineTotalElement).toBeVisible();
    await expect(estimatorSection.getByText('Volume Dihitung: 20 m2')).toBeVisible();

    // 8. Select Add-on: "Talang Air PVC 4 Inchi + Corong Discharges"
    const addonCheckbox = page.getByRole('checkbox', { name: /Talang Air PVC 4 Inchi/i });
    await expect(addonCheckbox).toBeVisible();
    await expect(addonCheckbox).not.toBeChecked();

    await addonCheckbox.check();

    // 9. UI Regression: Verify checkbox is checked
    await expect(addonCheckbox).toBeChecked();

    // 10. Verify calculation update (Baseline Rp 15.700.000 + Add-on Rp 1.700.000 = Rp 17.400.000)
    const updatedTotalElement = estimatorSection.getByText('Rp 17.400.000');
    await expect(updatedTotalElement).toBeVisible();
    await expect(baselineTotalElement).not.toBeVisible();

    // 11. Verify UI consistency
    await expect(estimatorSection.getByText('Volume Dihitung: 20 m2')).toBeVisible();
    await expect(estimatorSection.getByText('2 - 3 hari kerja')).toBeVisible();
    await expect(page.getByPlaceholder('Nama Lengkap Anda *')).toBeVisible();
  });
});
