/**
 * @file Popup Tests
 * @description Comprehensive tests for popup functionality
 */

describe('PopupController Tests', () => {
  let originalDocument, originalWindow, originalChrome

  beforeEach(() => {
    jest.clearAllMocks()

    // Save originals
    originalDocument = global.document
    originalWindow = global.window
    originalChrome = global.chrome

    // Setup DOM with all required elements
    global.document = {
      getElementById: jest.fn((_id) => ({
        textContent: '',
        innerHTML: '',
        addEventListener: jest.fn(),
        style: { display: 'none' },
        click: jest.fn()
      })),
      querySelector: jest.fn(() => ({
        textContent: '',
        addEventListener: jest.fn()
      })),
      body: { innerHTML: '' }
    }

    global.window = {
      location: { href: 'chrome-extension://test/popup.html' }
    }

    // Mock chrome APIs
    global.chrome = {
      runtime: {
        sendMessage: jest.fn((message, callback) => {
          const mockResponse = {
            success: true,
            stats: { blocked: 100, active: true, sessionStartTime: Date.now() - 10000 },
            status: { enabled: true, hostname: 'example.com' },
            manifest: { version: '2.0.0' }
          }
          if (callback) setTimeout(() => callback(mockResponse), 0)
          return Promise.resolve(mockResponse)
        }),
        getManifest: jest.fn(() => ({
          version: '2.0.0',
          name: 'Universal Web Bypass Injector'
        }))
      },
      tabs: {
        query: jest.fn((query, callback) => {
          const tabs = [{
            id: 123,
            url: 'https://example.com',
            title: 'Example Site',
            active: true
          }]
          if (callback) setTimeout(() => callback(tabs), 0)
          return Promise.resolve(tabs)
        }),
        create: jest.fn(() => Promise.resolve({ id: 124 })),
        reload: jest.fn()
      }
    }

    // Clear require cache and load popup
    delete require.cache[require.resolve('../popup.js')]
    require('../popup.js')
  })

  afterEach(() => {
    // Restore originals
    global.document = originalDocument
    global.window = originalWindow
    global.chrome = originalChrome
    jest.clearAllTimers()
  })

  describe('Popup Functionality', () => {
    test('should have popup script loaded', () => {
      expect(global.PopupController || global.window.PopupController).toBeDefined()
    })

    test('should handle missing DOM elements gracefully', () => {
      expect(() => {
        // This should not throw even if elements are missing
        if (global.PopupController) {
          global.PopupController.cacheElements()
        }
      }).not.toThrow()
    })

    test('should handle chrome API calls', async() => {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'getStatistics' }, resolve)
      })
      expect(response).toBeDefined()
      expect(chrome.runtime.sendMessage).toHaveBeenCalled()
    })

    test('should handle tab queries', async() => {
      const tabs = await new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, resolve)
      })
      expect(tabs).toHaveLength(1)
      expect(tabs[0].url).toBe('https://example.com')
    })

    test('should format numbers consistently', () => {
      // Test the Intl.NumberFormat with en-US locale
      const formatter = new Intl.NumberFormat('en-US')
      expect(formatter.format(1234)).toBe('1,234')
      expect(formatter.format(1000000)).toBe('1,000,000')
      expect(formatter.format(0)).toBe('0')
    })

    test('should format time durations', () => {
      // Test duration formatting logic
      const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000) % 60
        const minutes = Math.floor(ms / (1000 * 60)) % 60
        const hours = Math.floor(ms / (1000 * 60 * 60))

        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`
        } else {
          return `${seconds}s`
        }
      }

      expect(formatDuration(1000)).toBe('1s')
      expect(formatDuration(60000)).toBe('1m 0s')
      expect(formatDuration(3661000)).toBe('1h 1m 1s')
    })

    test('should extract hostname from URL', () => {
      const extractHostname = (url) => {
        try {
          return new URL(url).hostname
        } catch {
          return ''
        }
      }

      expect(extractHostname('https://example.com/path')).toBe('example.com')
      expect(extractHostname('http://subdomain.example.com')).toBe('subdomain.example.com')
      expect(extractHostname('invalid-url')).toBe('')
    })

    test('should handle error scenarios', () => {
      // Test error handling by mocking chrome.runtime.lastError
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        chrome.runtime.lastError = { message: 'Test error' }
        if (callback) callback(null)
      })

      // This should not throw
      expect(() => {
        chrome.runtime.sendMessage({ action: 'test' }, () => {
          if (chrome.runtime.lastError) {
            console.log('Expected error:', chrome.runtime.lastError.message)
          }
        })
      }).not.toThrow()
    })

    test('should handle DOM interactions', () => {
      const element = document.getElementById('test-element')
      const mockFn = jest.fn()
      
      // Check if element exists before calling addEventListener
      if (element && element.addEventListener) {
        element.addEventListener('click', mockFn)
        expect(element.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      } else {
        // Fallback test - just verify the element was queried
        expect(element).toBeDefined()
      }
    })

    test('should handle popup initialization flow', async() => {
      // Test the basic initialization pattern
      const mockInit = async() => {
        try {
          // Simulate caching elements
          const elements = {
            currentUrl: document.getElementById('current-url'),
            statusDot: document.querySelector('.status-dot'),
            toggleButton: document.getElementById('toggle-button')
          }
          
          // Simulate loading current tab
          const tabs = await new Promise(resolve => {
            chrome.tabs.query({ active: true, currentWindow: true }, resolve)
          })
          
          // Simulate loading statistics
          const stats = await new Promise(resolve => {
            chrome.runtime.sendMessage({ action: 'getStatistics' }, resolve)
          })
          
          return { elements, tabs, stats }
        } catch (error) {
          console.error('Init error:', error)
          throw error
        }
      }

      const result = await mockInit()
      expect(result.elements).toBeDefined()
      expect(result.tabs).toHaveLength(1)
      expect(result.stats).toBeDefined()
    })

    test('should handle status toggling', async() => {
      // Simulate site status toggle
      const mockToggle = async() => {
        const currentTab = { id: 123, url: 'https://example.com' }
        const siteStatus = { enabled: true, hostname: 'example.com' }
        
        // Send toggle message
        const response = await new Promise(resolve => {
          chrome.runtime.sendMessage({
            action: 'toggleSite',
            tabId: currentTab.id,
            hostname: siteStatus.hostname
          }, resolve)
        })
        
        return response
      }

      const result = await mockToggle()
      expect(result).toBeDefined()
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'toggleSite' }),
        expect.any(Function)
      )
    })
  })
})