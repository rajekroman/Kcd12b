import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const iphone14 = devices['iPhone 14'];
const iphone14Landscape = devices['iPhone 14 landscape'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    launchOptions: executablePath ? { executablePath } : undefined
  },
  webServer: {
    command: 'npm run preview:e2e',
    url: 'http://127.0.0.1:4173/Kcd12b/',
    reuseExistingServer: true,
    timeout: 120000
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'iphone-portrait',
      use: { ...iphone14, browserName: 'chromium' }
    },
    {
      name: 'iphone-landscape',
      use: { ...iphone14Landscape, browserName: 'chromium' }
    }
  ]
});
