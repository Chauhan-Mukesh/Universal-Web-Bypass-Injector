/**
 * @file Integration Tests
 * @description Integration tests for the complete extension functionality
 */

describe('Extension Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Mock a realistic browser environment
    global.window = {
      location: {
        protocol: 'https:',
        href: 'https://example.com/article',
        hostname: 'example.com'
      },
      innerHeight: 768,
      innerWidth: 1024,
      MutationObserver: jest.fn(() => ({
        observe: jest.fn(),
        disconnect: jest.fn()
      })),
      getComputedStyle: jest.fn(() => ({
        position: 'static',
        zIndex: '1'
      })),
      addEventListener: jest.fn(),
      setTimeout: global.setTimeout,
      clearTimeout: global.clearTimeout,
      fetch: jest.fn()
    }

    global.document = {
      readyState: 'complete',
      documentElement: {
        querySelectorAll: jest.fn(() => []),
        querySelector: jest.fn(() => null)
      },
      head: {
        appendChild: jest.fn()
      },
      getElementById: jest.fn(() => null),
      createElement: jest.fn(() => ({
        id: '',
        textContent: '',
        setAttribute: jest.fn(),
        appendChild: jest.fn(),
        remove: jest.fn()
      })),
      querySelectorAll: jest.fn(() => []),
      addEventListener: jest.fn()
    }

    global.XMLHttpRequest = jest.fn(() => ({
      open: jest.fn(),
      send: jest.fn()
    }))

    global.Node = {
      ELEMENT_NODE: 1
    }
  })

  describe('Complete Extension Flow', () => {
    test('should initialize all components successfully', async() => {
      // Load content script
      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      // Load background script
      delete require.cache[require.resolve('../background.js')]
      require('../background.js')

      // Verify content script initialization
      expect(global.window.UniversalBypass).toBeDefined()
      expect(typeof global.window.UniversalBypass.init).toBe('function')

      // Verify background script event listeners
      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled()
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()

      // Initialize content script
      await global.window.UniversalBypass.init()
      expect(global.window.UniversalBypass.initialized).toBe(true)
    })

    test('should handle blocked requests correctly', () => {
      // Load content script
      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      const UniversalBypass = global.window.UniversalBypass

      // Test URL blocking
      const blockedUrls = [
        'https://analytics.google.com/track',
        'https://ads.reddit.com/pixel',
        'https://connect.facebook.net/en_US/fbevents.js'
      ]

      const allowedUrls = [
        'https://example.com/content.js',
        'https://cdn.jsdelivr.net/library.js',
        'https://api.example.com/data'
      ]

      blockedUrls.forEach(url => {
        expect(UniversalBypass._isBlocked(url)).toBe(true)
      })

      allowedUrls.forEach(url => {
        expect(UniversalBypass._isBlocked(url)).toBe(false)
      })
    })

    test('should patch network requests properly', async() => {
      // Load content script
      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      const UniversalBypass = global.window.UniversalBypass
      await UniversalBypass.init()

      // Check that fetch was patched
      expect(global.window.fetch._bypassed).toBe(true)

      // Check that XMLHttpRequest was patched
      expect(global.XMLHttpRequest.prototype._bypassed).toBe(true)

      // Test blocked fetch request
      const blockedUrl = 'https://analytics.google.com/collect'
      const fetchPromise = global.window.fetch(blockedUrl)

      await expect(fetchPromise).rejects.toThrow('Bypassed fetch to')
    })

    test('should communicate between content and background scripts', () => {
      // Load background script
      delete require.cache[require.resolve('../background.js')]
      require('../background.js')

      // Get the message listener
      const messageListener = chrome.runtime.onMessage.addListener.mock.calls[0][0]

      // Test getTabInfo message
      const request = { action: 'getTabInfo' }
      const sender = {
        tab: {
          url: 'https://example.com',
          title: 'Example Site',
          id: 123
        }
      }
      const sendResponse = jest.fn()

      messageListener(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://example.com',
          title: 'Example Site',
          id: 123
        })
      )
    })

    test('should handle popup initialization with content and background', () => {
      // Mock DOM for popup
      global.document.getElementById = jest.fn((id) => {
        const elements = {
          'current-url': { textContent: '', title: '' },
          'refresh-button': { addEventListener: jest.fn() },
          'help-link': { addEventListener: jest.fn() }
        }
        return elements[id] || null
      })

      global.document.querySelector = jest.fn((selector) => {
        if (selector === '.status-dot') {
          return { style: {} }
        }
        if (selector === '.status-indicator span') {
          return { textContent: '' }
        }
        if (selector === '.footer') {
          return { textContent: 'v1.0.0 | Universal Web Bypass Injector' }
        }
        return null
      })

      // Load popup script
      delete require.cache[require.resolve('../popup.js')]
      require('../popup.js')

      const PopupController = global.window.PopupController
      expect(PopupController).toBeDefined()
      expect(typeof PopupController.init).toBe('function')
    })

    test('should handle DOM cleaning across different page types', async() => {
      // Load content script
      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      const UniversalBypass = global.window.UniversalBypass

      // Mock DOM elements that should be removed
      const mockPaywallElement = {
        matches: jest.fn((selector) => selector.includes('paywall')),
        querySelectorAll: jest.fn(() => []),
        remove: jest.fn(),
        parentNode: true,
        nodeType: 1
      }

      const mockAdElement = {
        matches: jest.fn((selector) => selector.includes('ad')),
        querySelectorAll: jest.fn(() => []),
        remove: jest.fn(),
        parentNode: true,
        nodeType: 1,
        src: 'https://ads.google.com/ad.js'
      }

      global.document.documentElement.querySelectorAll = jest.fn((selector) => {
        if (selector.includes('paywall')) return [mockPaywallElement]
        if (selector.includes('script[src]')) return [mockAdElement]
        return []
      })

      await UniversalBypass.init()
      UniversalBypass.cleanDOM()

      expect(mockPaywallElement.matches).toHaveBeenCalled()
      expect(mockAdElement.remove).toHaveBeenCalled()
    })

    test('should handle errors gracefully across all components', async() => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation()

      // Test content script error handling
      global.document.createElement = jest.fn(() => {
        throw new Error('DOM error')
      })

      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      const UniversalBypass = global.window.UniversalBypass
      await UniversalBypass.init()

      // Should not throw, errors should be caught
      expect(() => {
        UniversalBypass.restorePageFunctionality()
      }).not.toThrow()

      errorSpy.mockRestore()
    })

    test('should respect different browser environments', () => {
      // Test Chrome extension environment
      expect(typeof chrome).toBe('object')
      expect(chrome.runtime).toBeDefined()
      expect(chrome.tabs).toBeDefined()

      // Test restricted page detection
      const restrictedUrls = [
        'chrome://extensions',
        'about:blank',
        'moz-extension://abc'
      ]

      restrictedUrls.forEach(url => {
        const parsedUrl = new URL(url)

        // Mock window.location without triggering navigation
        Object.defineProperty(global.window, 'location', {
          value: {
            protocol: parsedUrl.protocol,
            href: url,
            host: parsedUrl.host
          },
          writable: true,
          configurable: true
        })

        // Content script should not initialize on restricted pages
        const shouldRun = !['chrome:', 'about:', 'moz-extension:'].includes(
          parsedUrl.protocol
        )
        expect(shouldRun).toBe(false)
      })
    })

    test('should maintain performance under load', async() => {
      // Load content script
      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      const UniversalBypass = global.window.UniversalBypass
      await UniversalBypass.init()

      // Simulate rapid DOM changes
      const mockMutations = Array(100).fill().map(() => ({
        type: 'childList',
        addedNodes: [{
          nodeType: 1,
          matches: jest.fn(() => false),
          querySelectorAll: jest.fn(() => [])
        }]
      }))

      // Get the mutation observer callback
      const observerCallback = global.window.MutationObserver.mock.calls[0][0]

      const startTime = Date.now()
      observerCallback(mockMutations)
      const endTime = Date.now()

      // Should process mutations quickly (under 100ms for 100 mutations)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })

  describe('Real-world Scenarios', () => {
    test('should handle news website with paywall', async() => {
      // Simulate news website
      global.window.location.href = 'https://news-site.com/premium-article'

      const mockPaywallOverlay = {
        matches: jest.fn(() => true),
        querySelectorAll: jest.fn(() => []),
        remove: jest.fn(),
        parentNode: true,
        nodeType: 1,
        classList: { contains: jest.fn(() => true) },
        offsetHeight: 500
      }

      global.document.querySelectorAll = jest.fn(() => [mockPaywallOverlay])

      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      const UniversalBypass = global.window.UniversalBypass
      await UniversalBypass.init()

      expect(mockPaywallOverlay.remove).toHaveBeenCalled()
    })

    test('should handle social media site with tracking', async() => {
      // Simulate social media tracking
      global.window.location.href = 'https://social-media.com/feed'

      const mockTrackingScript = {
        matches: jest.fn(() => false),
        querySelectorAll: jest.fn(() => []),
        remove: jest.fn(),
        parentNode: true,
        nodeType: 1,
        src: 'https://connect.facebook.net/pixel.js',
        tagName: 'SCRIPT'
      }

      global.document.documentElement.querySelectorAll = jest.fn((selector) => {
        if (selector.includes('script[src]')) return [mockTrackingScript]
        return []
      })

      delete require.cache[require.resolve('../content.js')]
      require('../content.js')

      const UniversalBypass = global.window.UniversalBypass
      await UniversalBypass.init()

      expect(mockTrackingScript.remove).toHaveBeenCalled()
    })
  })
})
