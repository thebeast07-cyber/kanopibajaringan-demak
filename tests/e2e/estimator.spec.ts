import { test, expect } from '@playwright/test';

test.describe('ESTIMATOR-01: First Deterministic Estimator Calculation Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Reset localStorage before page load to ensure clean COMPREHENSIVE_DATASET baseline
    await page.addInitScript(() => {
      window.localStorage.clear();
    });
  });

  test('should complete the 5-step wizard flow and display deterministic calculation results', async ({ page }) => {
    // 1. Navigate to estimator section
    await page.goto('/#kalkulator');

    // 2. Verify estimator section visibility
    const sectionHeading = page.getByRole('heading', { name: 'Hitung Perkiraan Biaya Kanopi & Atap Anda' });
    await expect(sectionHeading).toBeVisible();

    // 3. Step 1: Service Selection
    await expect(page.getByText('01. Pilih Jenis Pekerjaan Konstruksi')).toBeVisible();
    await expect(page.getByRole('button', { name: /Kanopi Alderon Twinwall \/ RS/i })).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Masukkan Ukuran' }).click();

    // 4. Step 2: Dimension Step
    await expect(page.getByText('02. Masukkan Dimensi Proyek')).toBeVisible();
    const lengthInput = page.locator('input[type="number"]').nth(0);
    const widthInput = page.locator('input[type="number"]').nth(1);
    await lengthInput.fill('5');
    await widthInput.fill('4');
    await page.getByRole('button', { name: 'Lanjut: Material Atap' }).click();

    // 5. Step 3: Material Step
    await expect(page.getByText('03. Pilih Material Penutup Atap')).toBeVisible();
    await expect(page.getByText('Alderon Twinwall 10mm (Double Layer)')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Spesifikasi Rangka' }).click();

    // 6. Step 4: Frame & Finishing Step
    await expect(page.getByText('04. Pilih Spesifikasi Rangka Utama')).toBeVisible();
    await expect(page.getByText('Besi Hollow Galvanis 40x60 (t=1.2mm)')).toBeVisible();
    await expect(page.getByText('Cat Anti Karat Zinc Chromate + Cat Hitam/Abu Doff')).toBeVisible();
    await page.getByRole('button', { name: 'Lanjut: Tambahan' }).click();

    // 7. Step 5: Add-ons & Site Conditions Step
    await expect(page.getByText('05. Pekerjaan Tambahan & Akses Lokasi (Opsional)')).toBeVisible();

    // 8. Verify calculation result panel
    await expect(page.getByText('Volume Dihitung: 20 m2')).toBeVisible();
    await expect(page.getByText('Rp 15.700.000')).toBeVisible();
    await expect(page.getByText('2 - 3 hari kerja')).toBeVisible();

    // 9. Verify WhatsApp lead form inputs & button presence
    await expect(page.getByPlaceholder('Nama Lengkap Anda *')).toBeVisible();
    await expect(page.getByPlaceholder('Kota / Kecamatan Anda *')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kirim Hasil Estimasi ke WhatsApp' })).toBeVisible();
  });
});
