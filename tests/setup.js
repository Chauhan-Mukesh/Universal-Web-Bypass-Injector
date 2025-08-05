/**
 * Jest test setup for Chrome extension testing
 */

// Add required polyfills for Node.js environment
global.TextEncoder = require('util').TextEncoder
global.TextDecoder = require('util').TextDecoder

// Add required polyfills for JSDOM environment
if (typeof window !== 'undefined' && window.location === null) {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'chrome-extension://test/popup.html',
      protocol: 'chrome-extension:',
      host: 'test',
      hostname: 'test',
      search: '',
      pathname: '/popup.html'
    },
    writable: true,
    configurable: true
  })
}

// Mock Chrome APIs with proper initialization
const createMockListener = () => ({
  addListener: jest.fn(),
  removeListener: jest.fn(),
  hasListener: jest.fn()
})

global.chrome = {
  runtime: {
    onInstalled: createMockListener(),
    onMessage: createMockListener(),
    sendMessage: jest.fn((message, callback) => {
      if (callback) callback({ success: true })
    }),
    getManifest: jest.fn(() => ({
      version: '2.0.0'
    })),
    lastError: null
  },
  action: {
    onClicked: createMockListener()
  },
  contextMenus: {
    create: jest.fn(),
    onClicked: createMockListener()
  },
  scripting: {
    executeScript: jest.fn(() => Promise.resolve([{ result: 'success' }]))
  },
  tabs: {
    query: jest.fn((query, callback) => {
      const tabs = [{
        id: 123,
        url: 'https://example.com',
        title: 'Example Site',
        active: true
      }]
      if (callback) callback(tabs)
      return Promise.resolve(tabs)
    }),
    create: jest.fn(() => Promise.resolve({ id: 124 })),
    reload: jest.fn(),
    onUpdated: createMockListener(),
    onRemoved: createMockListener()
  },
  notifications: {
    create: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        const result = {}
        if (callback) callback(result)
        return Promise.resolve(result)
      }),
      set: jest.fn((data, callback) => {
        if (callback) callback()
        return Promise.resolve()
      })
    }
  }
}

// Mock console methods for testing
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}

// Suppress JSDOM navigation errors specifically
const originalVirtualConsole = global.jsdom?.virtualConsole
if (typeof window !== 'undefined' && window.virtualConsole) {
  window.virtualConsole.on('jsdomError', (error) => {
    if (error.message && error.message.includes('navigation')) {
      // Suppress navigation errors in tests
      return
    }
    console.error(error)
  })
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
