# GitHub Copilot MCP Configuration for Universal Web Bypass Injector

This document provides the Model Context Protocol (MCP) configuration for GitHub Copilot to work optimally with the Universal Web Bypass Injector Chrome extension project.

## Table of Contents

- [MCP Server Configuration](#mcp-server-configuration)
- [GitHub Integration](#github-integration)
- [Development Environment Setup](#development-environment-setup)
- [Firewall and Network Configuration](#firewall-and-network-configuration)
- [Browser Automation Configuration](#browser-automation-configuration)
- [Testing Configuration](#testing-configuration)
- [Troubleshooting](#troubleshooting)

## MCP Server Configuration

### Basic Configuration

Add this configuration to your GitHub Copilot MCP settings:

```json
{
  "mcpServers": {
    "universal-web-bypass-injector": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here"
      }
    },
    "browser-automation": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-playwright"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": [
          "/home/runner/work/Universal-Web-Bypass-Injector/Universal-Web-Bypass-Injector"
        ]
      }
    }
  }
}
```

### Advanced Configuration

For enhanced functionality, include these additional servers:

```json
{
  "mcpServers": {
    "universal-web-bypass-injector": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_github_token_here",
        "GITHUB_REPOSITORY": "Chauhan-Mukesh/Universal-Web-Bypass-Injector"
      }
    },
    "browser-automation": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-playwright"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "0",
        "PLAYWRIGHT_HEADLESS": "true"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_DIRECTORIES": [
          "/home/runner/work/Universal-Web-Bypass-Injector/Universal-Web-Bypass-Injector",
          "/tmp"
        ]
      }
    },
    "sqlite": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-sqlite"],
      "env": {
        "ALLOWED_DIRECTORIES": [
          "/home/runner/work/Universal-Web-Bypass-Injector/Universal-Web-Bypass-Injector/data"
        ]
      }
    },
    "bash": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-bash"],
      "env": {
        "ALLOWED_COMMANDS": ["npm", "node", "git", "playwright", "chromium", "google-chrome"]
      }
    }
  }
}
```

## GitHub Integration

### Required GitHub Token Permissions

Create a GitHub Personal Access Token with these scopes:

- `repo` - Full control of private repositories
- `workflow` - Update GitHub Action workflows
- `read:org` - Read org and team membership
- `read:user` - Read user profile data
- `user:email` - Access user email addresses

### Environment Variables

Set these environment variables in your development environment:

```bash
export GITHUB_PERSONAL_ACCESS_TOKEN="your_token_here"
export GITHUB_REPOSITORY="Chauhan-Mukesh/Universal-Web-Bypass-Injector"
export GITHUB_OWNER="Chauhan-Mukesh"
export GITHUB_REPO="Universal-Web-Bypass-Injector"
```

## Development Environment Setup

### Required Node.js Version

- **Node.js**: >= 20.0.0
- **NPM**: >= 10.0.0

### Required Dependencies

Install these dependencies for optimal MCP functionality:

```bash
# Core dependencies (already in package.json)
npm install

# Additional MCP dependencies
npm install --save-dev playwright @playwright/test
npm install --save-dev @types/chrome
```

### Browser Installation

Ensure these browsers are available:

```bash
# Install Playwright browsers
npx playwright install chromium chrome
npx playwright install-deps

# Verify Chrome installation
google-chrome --version
```

## Firewall and Network Configuration

### Required Domains for Whitelisting

Add these domains to your firewall whitelist:

#### GitHub and Git Services
- `github.com` (443, 80)
- `api.github.com` (443)
- `raw.githubusercontent.com` (443)
- `objects.githubusercontent.com` (443)
- `ghcr.io` (443)

#### NPM and Node.js Services
- `registry.npmjs.org` (443)
- `www.npmjs.com` (443)
- `nodejs.org` (443)

#### Browser Download Services
- `dl.google.com` (443) - Chrome downloads
- `edgedl.me.gvt1.com` (443) - Chrome binaries
- `playwright.azureedge.net` (443) - Playwright browsers

#### CI/CD Services
- `codecov.io` (443) - Code coverage
- `coveralls.io` (443) - Coverage reporting

#### CDN and Other Services
- `cdn.jsdelivr.net` (443)
- `unpkg.com` (443)
- `cdnjs.cloudflare.com` (443)

### Firewall Rules Configuration

#### iptables Rules (Linux)
```bash
# Allow outbound HTTPS traffic to required domains
sudo iptables -A OUTPUT -p tcp --dport 443 -d github.com -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 443 -d api.github.com -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 443 -d registry.npmjs.org -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 443 -d dl.google.com -j ACCEPT
sudo iptables -A OUTPUT -p tcp --dport 443 -d playwright.azureedge.net -j ACCEPT
```

#### Corporate Firewall Configuration
```
# Proxy Configuration (if behind corporate firewall)
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
export NO_PROXY=localhost,127.0.0.1,*.local

# NPM proxy configuration
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port
npm config set registry https://registry.npmjs.org/
```

### Network Issues and Solutions

#### Common Firewall Blocking Issues

1. **NPM Package Installation Failures**
   - **Symptom**: `ENOTFOUND registry.npmjs.org`
   - **Solution**: Whitelist `registry.npmjs.org:443`

2. **GitHub API Rate Limiting**
   - **Symptom**: `API rate limit exceeded`
   - **Solution**: Configure GitHub token, whitelist `api.github.com:443`

3. **Browser Download Failures**
   - **Symptom**: Playwright browser installation fails
   - **Solution**: Whitelist `playwright.azureedge.net:443` and `dl.google.com:443`

4. **Chrome Extension Store Access**
   - **Symptom**: Cannot access Chrome Web Store for testing
   - **Solution**: Whitelist `chrome.google.com:443` and `chromewebstore.google.com:443`

## Browser Automation Configuration

### Playwright Configuration

Create a `playwright.config.js` file:

```javascript
module.exports = {
  testDir: './tests/browser',
  timeout: 30000,
  expect: {
    timeout: 5000
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI
  }
};
```

### Chrome Extension Testing

For Chrome extension testing with Playwright:

```javascript
// Example test configuration
const { chromium } = require('playwright');
const path = require('path');

const pathToExtension = path.join(__dirname, 'dist');
const userDataDir = '/tmp/test-user-data-dir';

const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [
    `--disable-extensions-except=${pathToExtension}`,
    `--load-extension=${pathToExtension}`,
    '--no-sandbox',
    '--disable-setuid-sandbox'
  ]
});
```

## Testing Configuration

### Jest Configuration for Extension Testing

Ensure your `jest.config.js` includes:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  collectCoverageFrom: [
    '*.js',
    '!tests/**',
    '!node_modules/**',
    '!coverage/**'
  ],
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1'
  }
};
```

### Environment Variables for Testing

```bash
# CI Environment
export CI=true
export NODE_ENV=test

# Browser Testing
export PLAYWRIGHT_BROWSERS_PATH=0
export DISPLAY=:99

# Extension Testing
export EXTENSION_PATH=/home/runner/work/Universal-Web-Bypass-Injector/Universal-Web-Bypass-Injector/dist
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Browser Installation Failures

**Issue**: Playwright browser installation fails
```bash
# Check available disk space
df -h

# Clear npm cache
npm cache clean --force

# Reinstall browsers
npx playwright install --force
```

#### 2. Extension Loading Issues

**Issue**: Chrome extension fails to load in automated tests
```bash
# Verify extension build
npm run build:extension

# Check manifest.json syntax
cat manifest.json | jq .

# Test extension loading manually
google-chrome --load-extension=./dist --no-sandbox
```

#### 3. Network Connectivity Issues

**Issue**: Cannot reach external services
```bash
# Test connectivity
curl -I https://registry.npmjs.org
curl -I https://api.github.com

# Check proxy settings
echo $HTTP_PROXY
echo $HTTPS_PROXY

# Verify DNS resolution
nslookup registry.npmjs.org
```

#### 4. Permission Issues

**Issue**: Cannot access directories or execute commands
```bash
# Check file permissions
ls -la /home/runner/work/Universal-Web-Bypass-Injector/

# Fix permissions if needed
chmod +x ./scripts/*.js
```

### Performance Optimization

#### 1. Cache Configuration

```bash
# NPM cache location
npm config set cache /tmp/.npm

# Playwright cache
export PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers
```

#### 2. Resource Limits

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Limit concurrent operations
export UV_THREADPOOL_SIZE=4
```

### Monitoring and Debugging

#### 1. Enable Debug Logging

```bash
# Playwright debugging
export DEBUG=pw:*

# NPM debugging
export NPM_CONFIG_LOGLEVEL=verbose

# Node.js debugging
export NODE_DEBUG=*
```

#### 2. Health Checks

Create a health check script:

```javascript
// health-check.js
const { chromium } = require('playwright');

async function healthCheck() {
  try {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Health Check</h1>');
    await browser.close();
    console.log('✅ Health check passed');
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

healthCheck();
```

## Support and Documentation

### Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Chrome Extension Developer Guide](https://developer.chrome.com/docs/extensions/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Model Context Protocol Specification](https://modelcontextprotocol.io/)

### Getting Help

If you encounter issues not covered in this guide:

1. Check the [project issues](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector/issues)
2. Review the [CI logs](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector/actions)
3. Verify your network configuration
4. Test with a minimal reproduction case

---

*Last updated: December 2024*
*This configuration is optimized for GitHub Codespaces and CI/CD environments.*