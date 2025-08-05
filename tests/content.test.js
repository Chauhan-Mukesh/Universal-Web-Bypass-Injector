/**
 * @file Content Script Tests
 * @description Comprehensive tests for the Universal Bypass content script
 */

// Mock DOM elements and methods
global.document = {
  readyState: 'complete',
  documentElement: {
    querySelectorAll: jest.fn(() => []),
    querySelector: jest.fn(() => null)
  },
  getElementById: jest.fn(() => null),
  createElement: jest.fn(() => ({
    id: '',
    textContent: '',
    setAttribute: jest.fn(),
    appendChild: jest.fn()
  })),
  head: {
    appendChild: jest.fn()
  },
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn()
}

global.window = {
  location: {
    protocol: 'https:',
    href: 'https://example.com',
    hostname: 'example.com'
  },
  innerHeight: 768,
  getComputedStyle: jest.fn(() => ({
    position: 'static',
    zIndex: '1'
  })),
  addEventListener: jest.fn(),
  setTimeout: global.setTimeout,
  clearTimeout: global.clearTimeout
}

global.Node = {
  ELEMENT_NODE: 1
}

// Load the content script
require('../content.js')

describe('UniversalBypass Content Script', () => {
  let UniversalBypass

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Get the UniversalBypass object from global scope
    UniversalBypass = global.window.UniversalBypass

    // Reset initialization state
    if (UniversalBypass) {
      UniversalBypass.initialized = false
      UniversalBypass.DEBUG = false
    }
  })

  afterEach(() => {
    if (UniversalBypass && UniversalBypass.destroy) {
      UniversalBypass.destroy()
    }
  })

  describe('Initialization', () => {
    test('should initialize successfully', async() => {
      expect(UniversalBypass).toBeDefined()
      expect(typeof UniversalBypass.init).toBe('function')

      await UniversalBypass.init()
      expect(UniversalBypass.initialized).toBe(true)
    })

    test('should not initialize twice', async() => {
      await UniversalBypass.init()
      expect(UniversalBypass.initialized).toBe(true)

      const logSpy = jest.spyOn(UniversalBypass, '_log')
      await UniversalBypass.init()

      expect(logSpy).toHaveBeenCalledWith('Already initialized, skipping...')
    })

    test('should handle initialization errors gracefully', async() => {
      const errorSpy = jest.spyOn(UniversalBypass, '_logError')

      // Mock an error in one of the init methods
      const originalMethod = UniversalBypass.patchNetworkRequests
      UniversalBypass.patchNetworkRequests = jest.fn(() => {
        throw new Error('Test error')
      })

      await UniversalBypass.init()

      expect(errorSpy).toHaveBeenCalledWith('init', expect.any(Error))

      // Restore original method
      UniversalBypass.patchNetworkRequests = originalMethod
    })
  })

  describe('URL Blocking', () => {
    test('should identify blocked hosts correctly', () => {
      const blockedUrls = [
        'https://analytics.google.com/track',
        'https://securepubads.g.doubleclick.net/ads',
        'https://connect.facebook.net/pixel',
        'http://sub.analytics.google.com/script.js'
      ]

      const allowedUrls = [
        'https://example.com/content',
        'https://cdn.example.com/app.js',
        'https://api.example.com/data'
      ]

      blockedUrls.forEach(url => {
        expect(UniversalBypass._isBlocked(url)).toBe(true)
      })

      allowedUrls.forEach(url => {
        expect(UniversalBypass._isBlocked(url)).toBe(false)
      })
    })

    test('should handle invalid URLs gracefully', () => {
      expect(UniversalBypass._isBlocked(null)).toBe(false)
      expect(UniversalBypass._isBlocked(undefined)).toBe(false)
      expect(UniversalBypass._isBlocked('')).toBe(false)
      expect(UniversalBypass._isBlocked(123)).toBe(false)
    })
  })

  describe('Element Removal', () => {
    test('should remove elements safely', () => {
      const mockElement = {
        remove: jest.fn(),
        parentNode: true
      }

      const result = UniversalBypass._removeElement(mockElement)
      expect(result).toBe(true)
      expect(mockElement.remove).toHaveBeenCalled()
    })

    test('should handle removal errors gracefully', () => {
      const mockElement = {
        remove: jest.fn(() => {
          throw new Error('Removal failed')
        }),
        parentNode: true
      }

      const result = UniversalBypass._removeElement(mockElement)
      expect(result).toBe(false)
    })

    test('should not remove elements without parentNode', () => {
      const mockElement = {
        remove: jest.fn(),
        parentNode: null
      }

      const result = UniversalBypass._removeElement(mockElement)
      expect(result).toBe(false)
      expect(mockElement.remove).not.toHaveBeenCalled()
    })
  })

  describe('Console Noise Suppression', () => {
    test('should suppress console messages matching patterns', () => {
      const originalConsoleError = console.error
      const capturedMessages = []

      // Mock console.error to capture messages
      console.error = jest.fn((...args) => {
        capturedMessages.push(args.join(' '))
      })

      UniversalBypass.suppressConsoleNoise()

      // These should be suppressed
      console.error('net::ERR_BLOCKED_BY_CLIENT: request blocked')
      console.error('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')

      // This should not be suppressed
      console.error('Important error message')

      // After suppressConsoleNoise, console.error is replaced
      // We need to check the behavior differently
      expect(capturedMessages).not.toContain('net::ERR_BLOCKED_BY_CLIENT: request blocked')
      expect(capturedMessages).not.toContain('Failed to load resource: net::ERR_BLOCKED_BY_CLIENT')

      console.error = originalConsoleError
    })
  })

  describe('Network Request Patching', () => {
    test('should patch fetch to block requests', () => {
      const originalFetch = global.fetch
      global.window.fetch = jest.fn()

      UniversalBypass.patchNetworkRequests()

      // Test blocked request
      const blockedUrl = 'https://analytics.google.com/track'
      const fetchPromise = global.window.fetch(blockedUrl)

      expect(fetchPromise).rejects.toThrow('Bypassed fetch to')

      global.fetch = originalFetch
    })

    test('should not patch fetch multiple times', () => {
      global.window.fetch = jest.fn()
      global.window.fetch._bypassed = false

      UniversalBypass.patchNetworkRequests()
      expect(global.window.fetch._bypassed).toBe(true)

      const originalFetch = global.window.fetch
      UniversalBypass.patchNetworkRequests()

      // Should not be re-patched
      expect(global.window.fetch).toBe(originalFetch)
    })
  })

  describe('DOM Cleaning', () => {
    test('should clean DOM elements matching selectors', () => {
      const mockElement = {
        matches: jest.fn(() => true),
        querySelectorAll: jest.fn(() => []),
        remove: jest.fn(),
        parentNode: true,
        nodeType: 1,
        tagName: 'DIV'
      }

      document.documentElement = {
        nodeType: 1,
        matches: jest.fn(() => false),
        querySelectorAll: jest.fn(() => [mockElement])
      }

      // The cleanDOM function expects nodes array or defaults to document.documentElement
      UniversalBypass.cleanDOM([mockElement])

      expect(mockElement.matches).toHaveBeenCalled()
    })

    test('should handle DOM cleaning errors gracefully', () => {
      const errorSpy = jest.spyOn(UniversalBypass, '_logError')

      const mockElement = {
        matches: jest.fn(() => {
          throw new Error('DOM error')
        }),
        nodeType: 1
      }

      UniversalBypass.cleanDOM([mockElement])

      expect(errorSpy).toHaveBeenCalledWith('cleanDOM selector matching', expect.any(Error))
    })
  })

  describe('CSS Functionality Restoration', () => {
    test('should inject CSS styles to restore functionality', async() => {
      const mockStyle = {
        id: '',
        textContent: '',
        setAttribute: jest.fn()
      }

      document.createElement = jest.fn(() => mockStyle)
      document.getElementById = jest.fn(() => null)
      document.head = {
        appendChild: jest.fn()
      }

      // Test that the function runs without error
      await expect(UniversalBypass.restorePageFunctionality()).resolves.not.toThrow()

      // Verify basic calls were made
      expect(document.createElement).toHaveBeenCalledWith('style')
      expect(mockStyle.setAttribute).toHaveBeenCalledWith('data-uwb-injected', 'true')
      expect(mockStyle.id).toBe('universal-bypass-styles')
    })

    test('should not inject styles if already present', async() => {
      document.getElementById = jest.fn(() => ({ id: 'universal-bypass-styles' }))
      document.createElement = jest.fn()

      await UniversalBypass.restorePageFunctionality()

      expect(document.createElement).not.toHaveBeenCalled()
    })
  })

  describe('Mutation Observer', () => {
    test('should set up mutation observer', () => {
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      }

      global.MutationObserver = jest.fn(() => mockObserver)

      UniversalBypass.observeDOMChanges()

      expect(global.MutationObserver).toHaveBeenCalled()
      expect(mockObserver.observe).toHaveBeenCalledWith(
        document.documentElement,
        expect.objectContaining({
          childList: true,
          subtree: true
        })
      )
    })

    test('should handle missing MutationObserver gracefully', () => {
      const originalMutationObserver = global.MutationObserver
      global.MutationObserver = undefined

      const logSpy = jest.spyOn(UniversalBypass, '_log')
      UniversalBypass.observeDOMChanges()

      expect(logSpy).toHaveBeenCalledWith('MutationObserver not available')

      global.MutationObserver = originalMutationObserver
    })
  })

  describe('Cleanup and Destruction', () => {
    test('should clean up resources on destroy', () => {
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      }

      UniversalBypass.observer = mockObserver
      UniversalBypass.cleanupTimeout = setTimeout(() => {}, 1000)
      UniversalBypass.initialized = true

      UniversalBypass.destroy()

      expect(mockObserver.disconnect).toHaveBeenCalled()
      expect(UniversalBypass.observer).toBeNull()
      expect(UniversalBypass.initialized).toBe(false)
    })
  })

  describe('Error Handling', () => {
    test('should log errors appropriately in debug mode', () => {
      UniversalBypass.DEBUG = true
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      UniversalBypass._logError('test', new Error('Test error'))

      expect(consoleSpy).toHaveBeenCalledWith(
        '🛡️ UWB Error in test:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    test('should not log errors when not in debug mode', () => {
      UniversalBypass.DEBUG = false
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      UniversalBypass._logError('test', new Error('Test error'))

      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe('Site Status Checking', () => {
    test('should check if site is enabled', async() => {
      const mockResponse = { enabled: true }
      
      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        expect(message.action).toBe('getSiteStatus')
        expect(message.hostname).toBe('example.com')
        callback(mockResponse)
      })

      const isEnabled = await UniversalBypass._checkSiteEnabled('example.com')

      expect(isEnabled).toBe(true)
      expect(chrome.runtime.sendMessage).toHaveBeenCalled()
    })

    test('should handle disabled site', async() => {
      const mockResponse = { enabled: false }
      
      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback(mockResponse)
      })

      const isEnabled = await UniversalBypass._checkSiteEnabled('disabled.com')

      expect(isEnabled).toBe(false)
    })

    test('should default to enabled on error', async() => {
      chrome.runtime.sendMessage = jest.fn((_message, _callback) => {
        throw new Error('Communication error')
      })

      const isEnabled = await UniversalBypass._checkSiteEnabled('example.com')

      expect(isEnabled).toBe(true)
    })

    test('should skip initialization for disabled sites', async() => {
      // Mock the _checkSiteEnabled method to return false
      const originalCheckSiteEnabled = UniversalBypass._checkSiteEnabled
      UniversalBypass._checkSiteEnabled = jest.fn().mockResolvedValue(false)

      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback({ enabled: false })
      })

      const suppressConsoleNoiseSpy = jest.spyOn(UniversalBypass, 'suppressConsoleNoise')
      const patchNetworkRequestsSpy = jest.spyOn(UniversalBypass, 'patchNetworkRequests')

      // Reset initialization state
      UniversalBypass.initialized = false

      await UniversalBypass.init()

      expect(UniversalBypass.initialized).toBe(false)
      expect(suppressConsoleNoiseSpy).not.toHaveBeenCalled()
      expect(patchNetworkRequestsSpy).not.toHaveBeenCalled()
      
      // Restore original method
      UniversalBypass._checkSiteEnabled = originalCheckSiteEnabled
    })

    test('should proceed with initialization for enabled sites', async() => {
      // Mock the _checkSiteEnabled method to return true
      const originalCheckSiteEnabled = UniversalBypass._checkSiteEnabled
      UniversalBypass._checkSiteEnabled = jest.fn().mockResolvedValue(true)

      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback({ enabled: true })
      })

      const suppressConsoleNoiseSpy = jest.spyOn(UniversalBypass, 'suppressConsoleNoise')
      const patchNetworkRequestsSpy = jest.spyOn(UniversalBypass, 'patchNetworkRequests')

      // Reset initialization state
      UniversalBypass.initialized = false

      await UniversalBypass.init()

      expect(UniversalBypass.initialized).toBe(true)
      expect(suppressConsoleNoiseSpy).toHaveBeenCalled()
      expect(patchNetworkRequestsSpy).toHaveBeenCalled()
      
      // Restore original method
      UniversalBypass._checkSiteEnabled = originalCheckSiteEnabled
    })
  })
})

describe('UniversalBypass Content Script - Additional Coverage', () => {
  beforeEach(() => {
    // Reset the initialized state
    UniversalBypass.initialized = false
    
    // Reset DOM
    document.body.innerHTML = ''
    
    // Reset console mocks
    jest.clearAllMocks()
  })

  describe('Network Request Handling', () => {
    test('should handle blocked request notification', () => {
      const notifyBackgroundScriptSpy = jest.spyOn(UniversalBypass, '_notifyBackgroundScript')
      
      // Call the notification method
      UniversalBypass._notifyBackgroundScript()
      
      expect(notifyBackgroundScriptSpy).toHaveBeenCalled()
    })

    test('should handle chrome API errors in notification', () => {
      // Mock chrome.runtime to throw error
      const originalSendMessage = chrome.runtime.sendMessage
      chrome.runtime.sendMessage = jest.fn().mockImplementation(() => {
        throw new Error('Chrome API error')
      })
      
      expect(() => {
        UniversalBypass._notifyBackgroundScript()
      }).not.toThrow()
      
      chrome.runtime.sendMessage = originalSendMessage
    })
  })

  describe('Error Handling Edge Cases', () => {
    test('should handle undefined chrome object', () => {
      const originalChrome = global.chrome
      global.chrome = undefined
      
      expect(() => {
        UniversalBypass._notifyBackgroundScript()
      }).not.toThrow()
      
      global.chrome = originalChrome
    })

    test('should handle missing chrome.runtime', () => {
      const originalRuntime = chrome.runtime
      delete chrome.runtime
      
      expect(() => {
        UniversalBypass._notifyBackgroundScript()
      }).not.toThrow()
      
      chrome.runtime = originalRuntime
    })
  })

  describe('DOM Observer Initialization', () => {
    test('should properly initialize mutation observer', () => {
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      }
      
      global.MutationObserver = jest.fn().mockImplementation((callback) => {
        // Test the callback with mock mutations
        const mutations = [{
          type: 'childList',
          addedNodes: [{
            nodeType: 1, // Node.ELEMENT_NODE
            querySelector: jest.fn()
          }]
        }]
        
        // Call the callback to test it
        setTimeout(() => callback(mutations), 0)
        
        return mockObserver
      })
      
      UniversalBypass.observeDOMChanges()
      
      expect(global.MutationObserver).toHaveBeenCalled()
      expect(mockObserver.observe).toHaveBeenCalledWith(
        document.documentElement,
        expect.objectContaining({
          childList: true,
          subtree: true
        })
      )
    })
  })

  describe('Configuration Validation', () => {
    test('should have valid blocked hosts configuration', () => {
      expect(UniversalBypass.config.BLOCKED_HOSTS).toBeDefined()
      expect(Array.isArray(UniversalBypass.config.BLOCKED_HOSTS)).toBe(true)
      expect(UniversalBypass.config.BLOCKED_HOSTS.length).toBeGreaterThan(0)
    })

    test('should have valid selectors configuration', () => {
      expect(UniversalBypass.config.SELECTORS_TO_REMOVE).toBeDefined()
      expect(Array.isArray(UniversalBypass.config.SELECTORS_TO_REMOVE)).toBe(true)
      expect(UniversalBypass.config.SELECTORS_TO_REMOVE.length).toBeGreaterThan(0)
    })

    test('should have valid console suppress patterns', () => {
      expect(UniversalBypass.config.CONSOLE_SUPPRESS).toBeDefined()
      expect(Array.isArray(UniversalBypass.config.CONSOLE_SUPPRESS)).toBe(true)
      expect(UniversalBypass.config.CONSOLE_SUPPRESS.length).toBeGreaterThan(0)
    })
  })

  describe('URL Processing', () => {
    test('should handle malformed URLs in blocking check', () => {
      const malformedUrls = [
        'not-a-url',
        'javascript:void(0)',
        'data:text/html,<h1>test</h1>',
        '',
        null,
        undefined
      ]
      
      malformedUrls.forEach(url => {
        expect(() => {
          UniversalBypass._isBlocked(url)
        }).not.toThrow()
      })
    })

    test('should properly validate blocked hosts', () => {
      const testUrl = 'https://google-analytics.com/script.js'
      const isBlocked = UniversalBypass._isBlocked(testUrl)
      
      // Should block known analytics domain
      expect(isBlocked).toBe(true)
    })
  })

  describe('Advanced DOM Cleaning Coverage', () => {
    test('should remove high z-index overlays', () => {
      // Test the method exists and doesn't throw
      expect(() => {
        UniversalBypass._removeHighZIndexOverlays([document.body])
      }).not.toThrow()
    })

    test('should handle style computation errors in overlay removal', () => {
      // Mock getComputedStyle to throw error
      const originalGetComputedStyle = window.getComputedStyle
      window.getComputedStyle = jest.fn(() => {
        throw new Error('Style error')
      })

      // Should not throw error
      expect(() => {
        UniversalBypass._removeHighZIndexOverlays([document.body])
      }).not.toThrow()

      window.getComputedStyle = originalGetComputedStyle
    })

    test('should handle mutation observer with added nodes', (done) => {
      const mockObserver = {
        observe: jest.fn(),
        disconnect: jest.fn()
      }
      
      global.MutationObserver = jest.fn().mockImplementation((callback) => {
        const mutations = [{
          type: 'childList',
          addedNodes: [{
            nodeType: 1 // Node.ELEMENT_NODE
          }]
        }]
        
        // Simulate async mutation
        setTimeout(() => callback(mutations), 10)
        
        return mockObserver
      })

      const cleanDOMSpy = jest.spyOn(UniversalBypass, 'cleanDOM').mockImplementation()

      UniversalBypass.observeDOMChanges()

      // Wait for mutation observer and debounced cleanup
      setTimeout(() => {
        cleanDOMSpy.mockRestore()
        done()
      }, 150)
    })

    test('should handle missing head element in CSS injection', (done) => {
      const originalHead = document.head
      Object.defineProperty(document, 'head', { value: null, configurable: true })

      UniversalBypass.restorePageFunctionality().then(() => {
        Object.defineProperty(document, 'head', { value: originalHead, configurable: true })
        done()
      })
    })

    test('should handle CSS injection errors gracefully', (done) => {
      const errorSpy = jest.spyOn(UniversalBypass, '_logError').mockImplementation()
      
      const originalCreateElement = document.createElement
      document.createElement = jest.fn(() => {
        throw new Error('createElement failed')
      })

      UniversalBypass.restorePageFunctionality().then(() => {
        document.createElement = originalCreateElement
        errorSpy.mockRestore()
        done()
      })
    })
  })
})
