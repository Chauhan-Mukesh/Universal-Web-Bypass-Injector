// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright Configuration for Universal Web Bypass Injector
 * Optimized for Chrome extension testing and automation
 */
module.exports = defineConfig({
  testDir: './e2e-tests',
  
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,

  expect: {
    /* Maximum time expect() should wait for the condition to be met. */
    timeout: 5000
  },

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    // baseURL: 'http://127.0.0.1:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Take screenshot on failure */
    screenshot: 'only-on-failure',

    /* Record video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Chrome extension specific settings
        channel: 'chrome',
        launchOptions: {
          // Enable extension loading
          args: [
            '--disable-extensions-except=./dist',
            '--load-extension=./dist',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-running-insecure-content'
          ]
        }
      },
    },

    {
      name: 'chrome-extension-testing',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        // For extension-specific testing
        launchOptions: {
          headless: false, // Extensions require non-headless mode
          slowMo: 100,
          args: [
            '--disable-extensions-except=./dist',
            '--load-extension=./dist',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--allow-running-insecure-content',
            '--user-data-dir=/tmp/chrome-test-profile'
          ]
        }
      },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* Global setup and teardown */
  globalSetup: require.resolve('./e2e-tests/global-setup.js'),
  globalTeardown: require.resolve('./e2e-tests/global-teardown.js'),

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   port: 3000,
  //   reuseExistingServer: !process.env.CI,
  // },
});