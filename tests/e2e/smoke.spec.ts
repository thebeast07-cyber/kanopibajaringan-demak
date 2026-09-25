import { test, expect } from '@playwright/test';

test.describe('SMOKE-01: Public Landing Page Availability', () => {
  test('should load the public landing page successfully without errors', async ({ page }) => {
    // 1. Open public landing page route /
    const response = await page.goto('/');

    // 2. Verify HTTP response status is successful (200 OK)
    expect(response?.status()).toBe(200);

    // 3. Verify stable visible primary heading element
    const mainHeading = page.getByRole('heading', { level: 1 }).first();
    await expect(mainHeading).toBeVisible();
    await expect(mainHeading).toContainText('Jasa Pasang Kanopi & Atap Baja Ringan');

    // 4. Verify no obvious Next.js error overlay or crash fallback
    const errorOverlay = page.locator('#next-react-build-error-overlay');
    await expect(errorOverlay).not.toBeVisible();
  });
});
