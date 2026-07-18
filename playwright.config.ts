import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    launchOptions: executablePath ? { executablePath } : undefined
  },
  webServer: {
    command: 'npm run preview:e2e',
    url: 'http://127.0.0.1:4173/Kcd12b/',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    {
      name: 'mobile-chromium',
      use: { ...devices['iPhone 14'], browserName: 'chromium' }
    }
  ]
});
