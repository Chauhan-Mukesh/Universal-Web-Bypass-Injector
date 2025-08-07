/**
 * Global setup for Playwright browser tests
 */

const path = require('path');
const fs = require('fs');

async function globalSetup() {
  console.log('🔧 Setting up global browser test environment...');
  
  // Ensure extension is built
  const distPath = path.join(__dirname, '../dist');
  const manifestPath = path.join(distPath, 'manifest.json');
  
  if (!fs.existsSync(manifestPath)) {
    console.log('📦 Extension not built, building now...');
    const { spawn } = require('child_process');
    
    await new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build:extension'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Extension built successfully');
          resolve();
        } else {
          reject(new Error(`Extension build failed with code ${code}`));
        }
      });
    });
  }
  
  // Clean test profiles
  const testProfileDir = '/tmp/chrome-test-profile';
  if (fs.existsSync(testProfileDir)) {
    fs.rmSync(testProfileDir, { recursive: true, force: true });
  }
  
  console.log('✅ Global setup completed');
}

module.exports = globalSetup;