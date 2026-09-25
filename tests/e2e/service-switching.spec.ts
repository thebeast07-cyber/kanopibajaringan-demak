import { test, expect } from '@playwright/test';

test.describe('SERVICE-SWITCH-01: Service Switching & Dynamic Configuration Regression Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Reset localStorage before page load to ensure clean COMPREHENSIVE_DATASET baseline
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('should update wizard configuration options and calculation when switching services', async ({ page }) => {
    // 1. Navigate to estimator section
    await page.goto('/#kalkulator');
    const estimatorSection = page.locator('#kalkulator');

    // === BASELINE SERVICE A: Kanopi Alderon Twinwall / RS (m2) ===
    await expect(page.getByRole('heading', { name: 'Hitung Perkiraan Biaya Kanopi & Atap Anda' })).toBeVisible();

    // Step 1: Default Service A
    await page.getByRole('button', { name: 'Lanjut: Masukkan Ukuran' }).click();

    // Step 2: Dimensions for Service A (5m x 4m = 20 m2)
    const lengthInputA = page.locator('input[type="number"]').nth(0);
    const widthInputA = page.locator('input[type="number"]').nth(1);
    await lengthInputA.fill('5');
    await widthInputA.fill('4');
    await page.getByRole('button', { name: 'Lanjut: Material Atap' }).click();

    // Step 3: Material for Service A
    await expect(page.getByText('Alderon Twinwall 10mm (Double Layer)')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Spesifikasi Rangka' }).click();

    // Step 4: Frame for Service A
    await expect(page.getByText('Besi Hollow Galvanis 40x60 (t=1.2mm)')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Tambahan' }).click();

    // Step 5: Verify Service A Calculation Result Baseline
    const totalA = estimatorSection.getByText('Rp 15.700.000');
    await expect(totalA).toBeVisible();
    await expect(estimatorSection.getByText('Volume Dihitung: 20 m2')).toBeVisible();
    await expect(estimatorSection.getByText('2 - 3 hari kerja')).toBeVisible();

    // === SWITCH TO SERVICE B: Pagar Minimalis Hollow & Wood WPC (meter) ===
    // Step 1: Return to Step 1 via Progression Bar
    await page.getByRole('button', { name: '01 Jenis' }).click();
    await expect(page.getByText('01. Pilih Jenis Pekerjaan Konstruksi')).toBeVisible();

    // Select Service B
    const serviceBButton = page.getByRole('button', { name: /Pagar Minimalis Hollow & Wood WPC/i });
    await serviceBButton.click();
    await page.getByRole('button', { name: 'Lanjut: Masukkan Ukuran' }).click();

    // Step 2: Dimensions for Service B (5 linear meters)
    await expect(page.getByText('Satuan: meter')).toBeVisible();
    const lengthInputB = page.locator('input[type="number"]').first();
    await lengthInputB.fill('5');
    await page.getByRole('button', { name: 'Lanjut: Material Atap' }).click();

    // Step 3: Verify Service B Materials (Configuration Validation)
    await expect(page.getByText('03. Pilih Material Penutup Atap')).toBeVisible();
    await expect(page.getByText('Hollow Galvanis Anti Karat 40x40')).toBeVisible();
    await expect(page.getByText('Alderon Twinwall 10mm (Double Layer)')).not.toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Spesifikasi Rangka' }).click();

    // Step 4: Verify Service B Frames (Configuration Validation)
    await expect(page.getByText('04. Pilih Spesifikasi Rangka Utama')).toBeVisible();
    await expect(page.getByText('Frame Pagar Hollow Galvanis 40x40')).toBeVisible();
    await expect(page.getByText('Besi Hollow Galvanis 40x60 (t=1.2mm)')).not.toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Tambahan' }).click();

    // Step 5: Verify Service B Calculation Result (Calculation Validation)
    const totalB = estimatorSection.getByText('Rp 3.525.000');
    await expect(totalB).toBeVisible();
    await expect(totalA).not.toBeVisible();
    await expect(estimatorSection.getByText('Volume Dihitung: 5 meter')).toBeVisible();
    await expect(estimatorSection.getByText('3 - 5 hari kerja')).toBeVisible();
  });
});
