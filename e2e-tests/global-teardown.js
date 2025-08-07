/**
 * Global teardown for Playwright browser tests
 */

const fs = require('fs');

async function globalTeardown() {
  console.log('🧹 Cleaning up global browser test environment...');
  
  // Clean test profiles
  const testProfileDir = '/tmp/chrome-test-profile';
  if (fs.existsSync(testProfileDir)) {
    fs.rmSync(testProfileDir, { recursive: true, force: true });
  }
  
  console.log('✅ Global teardown completed');
}

module.exports = globalTeardown;