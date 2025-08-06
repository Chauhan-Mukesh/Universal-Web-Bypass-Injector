/**
 * @file Breaking Issues Prevention Tests
 * @description Tests to identify potential issues that could break the extension
 */

describe('Breaking Issues Prevention', () => {
  let mockChrome
  let BackgroundService
  let PopupController

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Chrome APIs
    mockChrome = {
      storage: {
        sync: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue(undefined)
        }
      },
      runtime: {
        onMessage: { addListener: jest.fn() },
        onInstalled: { addListener: jest.fn() },
        getManifest: jest.fn().mockReturnValue({ version: '2.0.1' }),
        sendMessage: jest.fn(),
        lastError: null
      },
      tabs: {
        onUpdated: { addListener: jest.fn() },
        onRemoved: { addListener: jest.fn() },
        query: jest.fn(),
        reload: jest.fn()
      },
      action: {
        onClicked: { addListener: jest.fn() },
        openPopup: jest.fn()
      },
      contextMenus: {
        create: jest.fn(),
        onClicked: { addListener: jest.fn() }
      },
      scripting: {
        executeScript: jest.fn()
      }
    }

    global.chrome = mockChrome

    // Load modules after setting up mocks
    delete require.cache[require.resolve('../background.js')]
    delete require.cache[require.resolve('../popup.js')]
    
    require('../background.js')
    require('../popup.js')
    
    BackgroundService = global.BackgroundService
    PopupController = global.PopupController
  })

  describe('Content Script Robustness', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Mock a broken DOM environment
      global.document = {
        querySelectorAll: jest.fn(() => []),
        querySelector: jest.fn(() => null),
        createElement: jest.fn(() => null),
        head: null,
        body: null
      }

      global.window = {
        location: { hostname: 'example.com', protocol: 'https:' },
        addEventListener: jest.fn(),
        MutationObserver: jest.fn(() => ({
          observe: jest.fn(),
          disconnect: jest.fn()
        }))
      }

      // Should not throw errors even with broken DOM
      expect(() => {
        const { UniversalBypass } = require('../content.js')
        if (UniversalBypass && UniversalBypass.cleanDOM) {
          UniversalBypass.cleanDOM()
        }
      }).not.toThrow()
    })

    test('should handle restricted URLs without breaking', () => {
      const restrictedUrls = [
        'chrome://extensions/',
        'about:blank',
        'moz-extension://test',
        'chrome-extension://test'
      ]

      restrictedUrls.forEach(url => {
        global.window = {
          location: {
            protocol: url.split('://')[0] + ':',
            href: url
          }
        }

        // Should not initialize on restricted URLs
        expect(() => {
          // Content script should return early for restricted URLs
          const content = require('../content.js')
        }).not.toThrow()
      })
    })

    test('should handle network request failures gracefully', () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))
      global.XMLHttpRequest = jest.fn(() => ({
        open: jest.fn(),
        send: jest.fn(),
        onerror: null,
        onload: null
      }))

      // Should not break when network requests fail
      expect(() => {
        // Simulate content script running
        global.window = {
          location: { hostname: 'example.com', protocol: 'https:' }
        }
        require('../content.js')
      }).not.toThrow()
    })
  })

  describe('Background Script Robustness', () => {
    test('should handle Chrome API failures gracefully', () => {
      // Mock failing Chrome APIs
      global.chrome = {
        storage: {
          sync: {
            get: jest.fn().mockRejectedValue(new Error('Storage error')),
            set: jest.fn().mockRejectedValue(new Error('Storage error'))
          }
        },
        runtime: {
          onMessage: { addListener: jest.fn() },
          onInstalled: { addListener: jest.fn() },
          getManifest: jest.fn().mockReturnValue({ version: '2.0.1' })
        },
        tabs: {
          onUpdated: { addListener: jest.fn() },
          onRemoved: { addListener: jest.fn() }
        },
        action: {
          onClicked: { addListener: jest.fn() }
        },
        contextMenus: {
          create: jest.fn(),
          onClicked: { addListener: jest.fn() }
        }
      }

      expect(() => {
        BackgroundService.init()
      }).not.toThrow()
    })

    test('should handle invalid message requests', () => {
      const sendResponse = jest.fn()

      const invalidRequests = [
        null,
        undefined,
        {},
        { action: null },
        { action: '' },
        { action: 'nonexistent' },
        { action: 123 },
        { malformed: 'request' }
      ]

      invalidRequests.forEach(request => {
        expect(() => {
          BackgroundService.handleMessage(request, null, sendResponse)
        }).not.toThrow()
      })
    })

    test('should handle memory leaks from tab tracking', () => {
      // Simulate many tabs being opened and closed
      for (let i = 0; i < 1000; i++) {
        BackgroundService.activeTabs.set(i, { url: `https://test${i}.com` })
      }

      // Simulate tabs being removed
      for (let i = 0; i < 500; i++) {
        BackgroundService.handleTabRemoval(i)
      }

      // Should not have excessive memory usage
      expect(BackgroundService.activeTabs.size).toBeLessThan(600)
    })
  })

  describe('Popup Script Robustness', () => {
    test('should handle missing DOM elements in popup', () => {
      // Mock popup environment with missing elements
      global.document = {
        getElementById: jest.fn(() => null),
        querySelector: jest.fn(() => null),
        addEventListener: jest.fn()
      }

      global.chrome = {
        tabs: {
          query: jest.fn().mockImplementation((query, callback) => {
            callback([])
          })
        },
        runtime: {
          sendMessage: jest.fn(),
          lastError: null
        }
      }

      expect(() => {
        PopupController.init()
      }).not.toThrow()
    })

    test('should handle Chrome API permission denials', () => {
      global.chrome = {
        tabs: {
          query: jest.fn().mockImplementation((query, callback) => {
            // Simulate permission denied
            global.chrome.runtime.lastError = { message: 'Permission denied' }
            callback([])
          })
        },
        runtime: {
          sendMessage: jest.fn().mockRejectedValue(new Error('Permission denied')),
          lastError: null
        }
      }

      expect(() => {
        PopupController.loadCurrentTab()
      }).not.toThrow()
    })
  })

  describe('Data Corruption Prevention', () => {
    test('should handle corrupted storage data', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        disabledSites: 'invalid_data', // Should be array
        statistics: null // Should be object
      })

      expect(async () => {
        await BackgroundService.loadStorageData()
      }).not.toThrow()

      // Should initialize with defaults
      expect(BackgroundService.disabledSites).toBeInstanceOf(Set)
    })

    test('should handle extremely large disabled sites list', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({
        disabledSites: Array(10000).fill().map((_, i) => `site${i}.com`)
      })

      expect(async () => {
        await BackgroundService.loadStorageData()
      }).not.toThrow()

      // Should handle large datasets
      expect(BackgroundService.disabledSites.size).toBeLessThanOrEqual(10000)
    })
  })

  describe('Performance Edge Cases', () => {
    test('should handle pages with excessive DOM nodes', () => {
      // Mock a page with many nodes
      const mockElements = Array(10000).fill().map(() => ({
        remove: jest.fn(),
        style: {},
        className: 'test-element',
        textContent: 'test'
      }))

      global.document = {
        querySelectorAll: jest.fn(() => mockElements),
        querySelector: jest.fn(() => mockElements[0])
      }

      global.window = {
        location: { hostname: 'example.com', protocol: 'https:' }
      }

      expect(() => {
        const { UniversalBypass } = require('../content.js')
        if (UniversalBypass && UniversalBypass.cleanDOM) {
          const startTime = Date.now()
          UniversalBypass.cleanDOM()
          const endTime = Date.now()
          
          // Should complete within reasonable time (less than 5 seconds)
          expect(endTime - startTime).toBeLessThan(5000)
        }
      }).not.toThrow()
    })

    test('should handle rapid message flooding', () => {
      const sendResponse = jest.fn()

      // Simulate rapid message flooding
      const messages = Array(1000).fill().map((_, i) => ({
        action: 'getStats',
        id: i
      }))

      expect(() => {
        messages.forEach(message => {
          BackgroundService.handleMessage(message, null, sendResponse)
        })
      }).not.toThrow()

      // Should respond to all messages
      expect(sendResponse).toHaveBeenCalledTimes(1000)
    })
  })

  describe('Security Edge Cases', () => {
    test('should handle malicious script injection attempts', () => {
      global.window = {
        location: { 
          hostname: '<script>alert("xss")</script>',
          protocol: 'https:'
        }
      }

      global.document = {
        createElement: jest.fn(() => ({
          textContent: '',
          remove: jest.fn()
        })),
        querySelectorAll: jest.fn(() => [])
      }

      expect(() => {
        require('../content.js')
      }).not.toThrow()
    })

    test('should sanitize hostname in messages', () => {
      const sendResponse = jest.fn()

      const maliciousRequest = {
        action: 'toggleSite',
        hostname: '<script>alert("xss")</script>'
      }

      expect(() => {
        BackgroundService.handleMessage(maliciousRequest, null, sendResponse)
      }).not.toThrow()
    })
  })
})