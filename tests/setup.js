/**
 * Jest test setup for Chrome extension testing
 */

// Mock Chrome APIs
global.chrome = {
  runtime: {
    onInstalled: {
      addListener: jest.fn()
    },
    onMessage: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({
      version: '2.0.0'
    }))
  },
  action: {
    onClicked: {
      addListener: jest.fn()
    }
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve())
  },
  tabs: {
    query: jest.fn(() => Promise.resolve([])),
    create: jest.fn(() => Promise.resolve({})),
    onUpdated: {
      addListener: jest.fn()
    },
    onRemoved: {
      addListener: jest.fn()
    }
  },
  notifications: {
    create: jest.fn()
  }
}

// Mock console methods for testing
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Mock DOM methods
global.MutationObserver = jest.fn(() => ({
  observe: jest.fn(),
  disconnect: jest.fn()
}))

// Mock fetch
global.fetch = jest.fn()

// Mock XMLHttpRequest
global.XMLHttpRequest = jest.fn(() => ({
  open: jest.fn(),
  send: jest.fn()
}))
