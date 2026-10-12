import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Kanopi Landing Page & Admin CMS
 */
export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://127.0.0.1:3001',
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    storageState: 'tests/e2e/.auth/admin.json',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev -- -p 3001 -H 127.0.0.1',
    url: 'http://127.0.0.1:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // Kata sandi dan folder data khusus tes, terpisah dari .data milik dev.
    env: {
      ADMIN_PASSWORD: 'e2e-3putra',
      ADMIN_SESSION_SECRET: 'e2e-kunci-sesi-yang-panjang',
      CMS_DATA_DIR: '.data-e2e',
    },
  },
});

