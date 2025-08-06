/**
 * @file Focused Popup Tests for Maximum Coverage
 * @description Step-by-step testing of popup.js methods to achieve maximum coverage
 */

describe('PopupController Focused Coverage Tests', () => {
  let originalChrome
  let mockDocument
  let mockWindow
  let PopupController

  beforeEach(() => {
    jest.clearAllMocks()

    // Save originals
    originalChrome = global.chrome

    // Mock Chrome APIs completely
    global.chrome = {
      runtime: {
        sendMessage: jest.fn((message, callback) => {
          const mockResponse = {
            success: true,
            totalBlocked: 50,
            bypassActive: true,
            sessionStartTime: Date.now() - 30000,
            enabled: true
          }
          if (callback) setTimeout(() => callback(mockResponse), 0)
          return Promise.resolve(mockResponse)
        }),
        getManifest: jest.fn(() => ({
          version: '2.0.1',
          name: 'Universal Web Bypass Injector'
        })),
        getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
        lastError: null
      },
      tabs: {
        query: jest.fn((query, callback) => {
          const tabs = [{
            id: 123,
            url: 'https://example.com/path',
            title: 'Example Site',
            active: true
          }]
          if (callback) setTimeout(() => callback(tabs), 0)
          return Promise.resolve(tabs)
        }),
        create: jest.fn((options) => Promise.resolve({ id: 124 })),
        reload: jest.fn()
      }
    }

    // Mock Document with all needed methods
    mockDocument = {
      getElementById: jest.fn((id) => ({
        id,
        textContent: '',
        title: '',
        innerHTML: '',
        style: { display: 'block', opacity: '1' },
        className: '',
        classList: { add: jest.fn(), remove: jest.fn() },
        addEventListener: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => 'false')
      })),
      querySelector: jest.fn((selector) => ({
        textContent: '',
        style: { backgroundColor: '#48bb78' },
        className: 'status-dot',
        setAttribute: jest.fn()
      })),
      querySelectorAll: jest.fn(() => []),
      createElement: jest.fn(() => ({
        id: '',
        style: { cssText: '' },
        textContent: '',
        appendChild: jest.fn(),
        insertBefore: jest.fn()
      })),
      addEventListener: jest.fn(),
      body: {
        appendChild: jest.fn(),
        insertBefore: jest.fn(),
        firstChild: null
      }
    }

    // Mock Window
    mockWindow = {
      close: jest.fn(),
      addEventListener: jest.fn()
    }

    global.document = mockDocument
    global.window = mockWindow

    // Clear the require cache and re-require popup.js to get fresh instance
    delete require.cache[require.resolve('../popup.js')]
    
    // Load popup.js in test environment
    require('../popup.js')
    PopupController = global.window.PopupController
  })

  afterEach(() => {
    // Restore originals
    global.chrome = originalChrome
    jest.clearAllTimers()
  })

  describe('Basic Functionality', () => {
    test('should have PopupController available globally', () => {
      expect(PopupController).toBeDefined()
      expect(typeof PopupController).toBe('object')
    })

    test('should have initial properties set correctly', () => {
      expect(PopupController.currentTab).toBeNull()
      expect(PopupController.siteStatus).toEqual({
        enabled: true,
        hostname: null
      })
      expect(PopupController.stats).toEqual({
        blocked: 0,
        active: false,
        sessionStartTime: expect.any(Number),
        sitesDisabled: []
      })
      expect(PopupController.elements).toEqual({})
    })
  })

  describe('cacheElements Method', () => {
    test('should cache DOM elements successfully', () => {
      // Call the actual cacheElements method
      PopupController.cacheElements()
      
      // Verify elements object is populated (this tests the actual functionality)
      expect(PopupController.elements).toBeDefined()
      expect(PopupController.elements.currentUrl).toBeDefined()
      expect(PopupController.elements.statusDot).toBeDefined()
      expect(PopupController.elements.statusText).toBeDefined()
      expect(PopupController.elements.helpLink).toBeDefined()
      expect(PopupController.elements.version).toBeDefined()
      expect(PopupController.elements.statsContainer).toBeDefined()
      expect(PopupController.elements.errorContainer).toBeDefined()
      expect(PopupController.elements.refreshButton).toBeDefined()
      expect(PopupController.elements.toggleButton).toBeDefined()
      expect(PopupController.elements.siteToggle).toBeDefined()
      expect(PopupController.elements.statsSummary).toBeDefined()
      expect(PopupController.elements.blockedCount).toBeDefined()
      expect(PopupController.elements.sessionTime).toBeDefined()
    })
  })

  describe('queryActiveTab Method', () => {
    test('should query active tab successfully', async () => {
      const tabs = await PopupController.queryActiveTab()
      
      expect(tabs).toBeDefined()
      expect(Array.isArray(tabs)).toBe(true)
      expect(tabs).toHaveLength(1)
      expect(tabs[0].id).toBe(123)
      expect(tabs[0].url).toBe('https://example.com/path')
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      )
    })

    test('should handle chrome.runtime.lastError in queryActiveTab', async () => {
      global.chrome.runtime.lastError = { message: 'Tab access denied' }
      
      try {
        await PopupController.queryActiveTab()
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error.message).toBe('Tab access denied')
      }
      
      // Reset lastError
      global.chrome.runtime.lastError = null
    })

    test('should handle generic error in queryActiveTab', async () => {
      global.chrome.tabs.query = jest.fn(() => {
        throw new Error('Chrome tabs API unavailable')
      })
      
      try {
        await PopupController.queryActiveTab()
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error.message).toBe('Chrome tabs API unavailable')
      }
      
      // Reset tabs.query mock
      global.chrome.tabs.query = jest.fn((query, callback) => {
        const tabs = [{
          id: 123,
          url: 'https://example.com/path',
          title: 'Example Site',
          active: true
        }]
        if (callback) setTimeout(() => callback(tabs), 0)
        return Promise.resolve(tabs)
      })
    })
  })

  describe('sendMessage Method', () => {
    test('should send message successfully', async () => {
      const message = { action: 'getStats' }
      const response = await PopupController.sendMessage(message)
      
      expect(response).toBeDefined()
      expect(response.success).toBe(true)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        message,
        expect.any(Function)
      )
    })

    test('should handle chrome.runtime.lastError in sendMessage', async () => {
      global.chrome.runtime.lastError = { message: 'Extension context invalidated' }
      
      try {
        await PopupController.sendMessage({ action: 'test' })
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error.message).toBe('Extension context invalidated')
      }
      
      // Reset lastError
      global.chrome.runtime.lastError = null
    })

    test('should handle generic error in sendMessage', async () => {
      global.chrome.runtime.sendMessage = jest.fn(() => {
        throw new Error('Message sending failed')
      })
      
      try {
        await PopupController.sendMessage({ action: 'test' })
        fail('Expected error to be thrown')
      } catch (error) {
        expect(error.message).toBe('Message sending failed')
      }
      
      // Reset sendMessage mock
      global.chrome.runtime.sendMessage = jest.fn((message, callback) => {
        const mockResponse = {
          success: true,
          totalBlocked: 50,
          bypassActive: true,
          sessionStartTime: Date.now() - 30000,
          enabled: true
        }
        if (callback) setTimeout(() => callback(mockResponse), 0)
        return Promise.resolve(mockResponse)
      })
    })
  })

  describe('isExtensionActive Method', () => {
    test('should return true for http URLs', () => {
      PopupController.currentTab = { url: 'http://example.com' }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(true)
    })

    test('should return true for https URLs', () => {
      PopupController.currentTab = { url: 'https://example.com' }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(true)
    })

    test('should return false for chrome URLs', () => {
      PopupController.currentTab = { url: 'chrome://extensions' }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(false)
    })

    test('should return false for about URLs', () => {
      PopupController.currentTab = { url: 'about:blank' }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(false)
    })

    test('should return false for moz-extension URLs', () => {
      PopupController.currentTab = { url: 'moz-extension://extension-id/page.html' }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(false)
    })

    test('should return false for chrome-extension URLs', () => {
      PopupController.currentTab = { url: 'chrome-extension://extension-id/page.html' }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(false)
    })

    test('should return false for no tab', () => {
      PopupController.currentTab = null
      const result = PopupController.isExtensionActive()
      expect(result).toBe(false)
    })

    test('should return false for tab without URL', () => {
      PopupController.currentTab = { id: 123 }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(false)
    })

    test('should return false for invalid URL', () => {
      PopupController.currentTab = { url: 'invalid-url' }
      const result = PopupController.isExtensionActive()
      expect(result).toBe(false)
    })
  })
})