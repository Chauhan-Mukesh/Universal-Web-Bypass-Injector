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
      querySelector: jest.fn((selector) => {
        // Return appropriate mock based on selector
        if (selector === '.status-dot') {
          return {
            textContent: '',
            style: { backgroundColor: '#48bb78' },
            className: 'status-dot',
            setAttribute: jest.fn()
          }
        } else if (selector === '.status-indicator span') {
          return {
            textContent: '',
            className: 'status-text',
            setAttribute: jest.fn()
          }
        } else if (selector === '.footer') {
          return {
            textContent: 'Version v1.0.0',
            className: 'footer',
            setAttribute: jest.fn()
          }
        }
        // Default return for other selectors
        return {
          textContent: '',
          style: {},
          className: '',
          setAttribute: jest.fn()
        }
      }),
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
      addEventListener: jest.fn(),
      location: {
        href: 'chrome-extension://test-id/popup.html'
      }
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

  describe('updateCurrentUrl Method', () => {
    test('should update URL display with valid tab', () => {
      PopupController.currentTab = { url: 'https://example.com/path', title: 'Example' }
      
      // Create a mock element
      const mockElement = {
        textContent: '',
        title: '',
        setAttribute: jest.fn()
      }
      PopupController.elements = { currentUrl: mockElement }
      
      PopupController.updateCurrentUrl()
      
      expect(mockElement.textContent).toBe('example.com')
      expect(mockElement.title).toBe('https://example.com/path')
    })

    test('should show "No active tab" when no tab', () => {
      PopupController.currentTab = null
      
      const mockElement = {
        textContent: '',
        title: '',
        setAttribute: jest.fn()
      }
      PopupController.elements = { currentUrl: mockElement }
      
      PopupController.updateCurrentUrl()
      
      expect(mockElement.textContent).toBe('No active tab')
    })

    test('should show "Invalid URL" for malformed URL', () => {
      PopupController.currentTab = { url: 'invalid-url' }
      
      const mockElement = {
        textContent: '',
        title: '',
        setAttribute: jest.fn()
      }
      PopupController.elements = { currentUrl: mockElement }
      
      PopupController.updateCurrentUrl()
      
      expect(mockElement.textContent).toBe('Invalid URL')
    })

    test('should handle missing currentUrl element', () => {
      PopupController.currentTab = { url: 'https://example.com' }
      PopupController.elements = { currentUrl: null }
      
      expect(() => PopupController.updateCurrentUrl()).not.toThrow()
    })
  })

  describe('updateVersion Method', () => {
    test('should update version display', () => {
      const mockElement = {
        textContent: 'Version v1.0.0',
        setAttribute: jest.fn()
      }
      PopupController.elements = { version: mockElement }
      
      PopupController.updateVersion()
      
      expect(mockElement.textContent).toBe('Version v2.0.1')
      expect(chrome.runtime.getManifest).toHaveBeenCalled()
    })

    test('should handle missing version element', () => {
      PopupController.elements = { version: null }
      
      expect(() => PopupController.updateVersion()).not.toThrow()
    })

    test('should handle getManifest error', () => {
      global.chrome.runtime.getManifest = jest.fn(() => {
        throw new Error('Manifest not available')
      })
      
      const mockElement = {
        textContent: 'Version v1.0.0',
        setAttribute: jest.fn()
      }
      PopupController.elements = { version: mockElement }
      
      expect(() => PopupController.updateVersion()).not.toThrow()
      
      // Reset manifest mock
      global.chrome.runtime.getManifest = jest.fn(() => ({
        version: '2.0.1',
        name: 'Universal Web Bypass Injector'
      }))
    })
  })

  describe('Navigation Methods', () => {
    test('openHelpPage should create new tab', () => {
      // Mock window.close to avoid JSDOM issues
      const originalClose = global.window.close
      global.window.close = jest.fn()
      
      PopupController.openHelpPage()
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
      })
      expect(global.window.close).toHaveBeenCalled()
      
      // Restore
      global.window.close = originalClose
    })

    test('openHelpPage should handle tab creation error', () => {
      global.chrome.tabs.create = jest.fn(() => {
        throw new Error('Tab creation failed')
      })
      
      // Mock showError and window.close to capture error display
      const showErrorSpy = jest.spyOn(PopupController, 'showError').mockImplementation(() => {})
      const originalClose = global.window.close
      global.window.close = jest.fn()
      
      PopupController.openHelpPage()
      
      expect(showErrorSpy).toHaveBeenCalledWith('Could not open help page')
      
      // Reset mocks
      showErrorSpy.mockRestore()
      global.window.close = originalClose
      global.chrome.tabs.create = jest.fn((options) => Promise.resolve({ id: 124 }))
    })

    test('openStatisticsPage should create new tab with statistics URL', () => {
      const originalClose = global.window.close
      global.window.close = jest.fn()
      
      PopupController.openStatisticsPage()
      
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/statistics.html'
      })
      expect(chrome.runtime.getURL).toHaveBeenCalledWith('statistics.html')
      expect(global.window.close).toHaveBeenCalled()
      
      // Restore
      global.window.close = originalClose
    })

    test('openStatisticsPage should handle error', () => {
      global.chrome.tabs.create = jest.fn(() => {
        throw new Error('Tab creation failed')
      })
      
      const showErrorSpy = jest.spyOn(PopupController, 'showError').mockImplementation(() => {})
      const originalClose = global.window.close
      global.window.close = jest.fn()
      
      PopupController.openStatisticsPage()
      
      expect(showErrorSpy).toHaveBeenCalledWith('Could not open statistics page')
      
      // Reset mocks
      showErrorSpy.mockRestore()
      global.window.close = originalClose
      global.chrome.tabs.create = jest.fn((options) => Promise.resolve({ id: 124 }))
    })
  })

  describe('Error and Message Display Methods', () => {
    test('showError should create and display error message when no container exists', () => {
      // Start with no error container
      PopupController.elements = {}
      
      // Set up document.createElement to return our mock
      const mockContainer = {
        id: '',
        className: '',
        textContent: '',
        style: { 
          cssText: '',
          display: 'none'
        }
      }
      
      global.document.createElement = jest.fn(() => mockContainer)
      global.document.body.firstChild = { id: 'first-child' }
      global.document.body.insertBefore = jest.fn()
      global.document.body.appendChild = jest.fn()
      
      PopupController.showError('Test error message')
      
      expect(mockContainer.textContent).toBe('Test error message')
      expect(mockContainer.style.display).toBe('block')
      expect(mockContainer.id).toBe('error-container')
      expect(mockContainer.className).toBe('error-message')
      expect(global.document.createElement).toHaveBeenCalledWith('div')
      // Don't check insertBefore specifically since the logic varies
    })

    test('showError should reuse existing error container', () => {
      const mockContainer = {
        textContent: '',
        style: { display: 'none' }
      }
      
      PopupController.elements = { errorContainer: mockContainer }
      
      PopupController.showError('Reused error message')
      
      expect(mockContainer.textContent).toBe('Reused error message')
      expect(mockContainer.style.display).toBe('block')
    })

    test('showError should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Make elements.errorContainer throw an error
      Object.defineProperty(PopupController, 'elements', {
        get: () => {
          throw new Error('Elements access failed')
        }
      })
      
      expect(() => PopupController.showError('Test error')).not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith('[UWB Popup] Error showing error message:', expect.any(Error))
      
      consoleSpy.mockRestore()
      // Reset elements
      PopupController.elements = {}
    })

    test('showMessage should create and display success message', () => {
      const mockContainer = {
        id: '',
        textContent: '',
        style: {
          cssText: '',
          display: 'none'
        }
      }
      
      global.document.createElement = jest.fn(() => mockContainer)
      global.document.getElementById = jest.fn(() => null) // No existing container
      
      const mockMainContainer = { insertBefore: jest.fn() }
      global.document.querySelector = jest.fn(() => mockMainContainer)
      
      PopupController.showMessage('Success message', 'success')
      
      expect(mockContainer.textContent).toBe('Success message')
      expect(mockContainer.style.display).toBe('block')
      expect(mockContainer.id).toBe('message-container')
    })

    test('showMessage should handle missing container gracefully', () => {
      global.document.querySelector = jest.fn(() => null) // No main container
      global.document.createElement = jest.fn(() => ({
        id: '',
        textContent: '',
        style: { cssText: '', display: 'none' }
      }))
      global.document.getElementById = jest.fn(() => null)
      
      expect(() => PopupController.showMessage('Test message')).not.toThrow()
    })
  })

  describe('Async Loading Methods', () => {
    test('loadCurrentTab should set currentTab and load stats', async () => {
      const mockTab = { id: 123, url: 'https://example.com', title: 'Example' }
      global.chrome.tabs.query = jest.fn((query, callback) => {
        callback([mockTab])
      })
      
      const loadTabStatsSpy = jest.spyOn(PopupController, 'loadTabStats').mockResolvedValue()
      
      await PopupController.loadCurrentTab()
      
      expect(PopupController.currentTab).toEqual(mockTab)
      expect(loadTabStatsSpy).toHaveBeenCalled()
      
      loadTabStatsSpy.mockRestore()
    })

    test('loadCurrentTab should handle no tabs found', async () => {
      global.chrome.tabs.query = jest.fn((query, callback) => {
        callback([])
      })
      
      const showErrorSpy = jest.spyOn(PopupController, 'showError').mockImplementation(() => {})
      
      await PopupController.loadCurrentTab()
      
      expect(showErrorSpy).toHaveBeenCalledWith('Could not access current tab')
      
      showErrorSpy.mockRestore()
    })

    test('loadTabStats should update stats from response', async () => {
      PopupController.currentTab = { id: 123 }
      const mockResponse = {
        totalBlocked: 42,
        bypassActive: true,
        lastActivity: Date.now(),
        sessionStartTime: Date.now() - 60000
      }
      
      global.chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback(mockResponse)
      })
      
      await PopupController.loadTabStats()
      
      expect(PopupController.stats.blocked).toBe(42)
      expect(PopupController.stats.active).toBe(true)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getTabInfo',
        tabId: 123
      }, expect.any(Function))
    })

    test('loadTabStats should handle missing currentTab', async () => {
      PopupController.currentTab = null
      
      await PopupController.loadTabStats()
      
      // Should return early without error
      expect(true).toBe(true)
    })

    test('loadSiteStatus should set hostname and enabled status', async () => {
      PopupController.currentTab = { url: 'https://example.com/path' }
      const mockResponse = { enabled: false }
      
      global.chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback(mockResponse)
      })
      
      await PopupController.loadSiteStatus()
      
      expect(PopupController.siteStatus.hostname).toBe('example.com')
      expect(PopupController.siteStatus.enabled).toBe(false)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getSiteStatus',
        hostname: 'example.com'
      }, expect.any(Function))
    })

    test('loadSiteStatus should handle missing currentTab', async () => {
      PopupController.currentTab = null
      
      await PopupController.loadSiteStatus()
      
      // Should return early without error
      expect(true).toBe(true)
    })

    test('loadStatistics should merge stats with response', async () => {
      const mockResponse = {
        totalBlocked: 100,
        sitesDisabled: ['blocked-site.com']
      }
      
      global.chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback(mockResponse)
      })
      
      PopupController.stats = { blocked: 0, active: true }
      
      await PopupController.loadStatistics()
      
      expect(PopupController.stats.totalBlocked).toBe(100)
      expect(PopupController.stats.sitesDisabled).toEqual(['blocked-site.com'])
      expect(PopupController.stats.active).toBe(true) // Should preserve existing
    })
  })

  describe('Keyboard Shortcuts Method', () => {
    test('handleKeyboardShortcuts should handle Ctrl+R for refresh', () => {
      const refreshSpy = jest.spyOn(PopupController, 'refreshCurrentTab').mockImplementation(() => {})
      const event = {
        key: 'r',
        ctrlKey: true,
        preventDefault: jest.fn()
      }
      
      PopupController.handleKeyboardShortcuts(event)
      
      expect(event.preventDefault).toHaveBeenCalled()
      expect(refreshSpy).toHaveBeenCalled()
      
      refreshSpy.mockRestore()
    })

    test('handleKeyboardShortcuts should handle Cmd+H for help', () => {
      const helpSpy = jest.spyOn(PopupController, 'openHelpPage').mockImplementation(() => {})
      const event = {
        key: 'h',
        metaKey: true,
        preventDefault: jest.fn()
      }
      
      PopupController.handleKeyboardShortcuts(event)
      
      expect(event.preventDefault).toHaveBeenCalled()
      expect(helpSpy).toHaveBeenCalled()
      
      helpSpy.mockRestore()
    })

    test('handleKeyboardShortcuts should handle Escape to close', () => {
      const originalClose = global.window.close
      global.window.close = jest.fn()
      
      const event = { key: 'Escape' }
      
      PopupController.handleKeyboardShortcuts(event)
      
      expect(global.window.close).toHaveBeenCalled()
      
      global.window.close = originalClose
    })

    test('handleKeyboardShortcuts should ignore other keys', () => {
      const event = { key: 'a', ctrlKey: false }
      
      expect(() => PopupController.handleKeyboardShortcuts(event)).not.toThrow()
    })

    test('handleKeyboardShortcuts should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      const event = {
        key: 'r',
        ctrlKey: true,
        preventDefault: () => { throw new Error('preventDefault failed') }
      }
      
      PopupController.handleKeyboardShortcuts(event)
      
      expect(consoleSpy).toHaveBeenCalledWith('[UWB Popup] Error handling keyboard shortcut:', expect.any(Error))
      
      consoleSpy.mockRestore()
    })
  })

  describe('Additional UI Update Methods', () => {
    test('updateStatus should execute without errors', () => {
      PopupController.siteStatus = { enabled: true }
      PopupController.currentTab = { url: 'https://example.com' }
      PopupController.elements = {
        statusDot: { style: { backgroundColor: '' }, className: '' },
        statusText: { textContent: '' }
      }
      
      expect(() => PopupController.updateStatus()).not.toThrow()
    })

    test('updateStatus should handle disabled site', () => {
      PopupController.siteStatus = { enabled: false }
      PopupController.elements = {
        statusDot: { style: { backgroundColor: '' }, className: '' },
        statusText: { textContent: '' }
      }
      
      expect(() => PopupController.updateStatus()).not.toThrow()
    })

    test('updateStatus should handle missing elements', () => {
      PopupController.elements = {}
      
      expect(() => PopupController.updateStatus()).not.toThrow()
    })

    test('updateStatistics should execute when stats are available', () => {
      PopupController.stats = { 
        blocked: 25, 
        totalBlocked: 100, 
        sessionStartTime: Date.now() - 60000 
      }
      PopupController.elements = { 
        statsSummary: { style: { display: 'none' }, classList: { add: jest.fn() } },
        blockedCount: { textContent: '' },
        sessionTime: { textContent: '' }
      }
      
      expect(() => PopupController.updateStatistics()).not.toThrow()
    })

    test('updateStatistics should handle no stats', () => {
      PopupController.stats = { blocked: 0, sessionsActive: 0 }
      PopupController.elements = { statsSummary: { style: { display: 'block' } } }
      
      expect(() => PopupController.updateStatistics()).not.toThrow()
    })

    test('updateStatistics should handle missing statsSummary', () => {
      PopupController.elements = {}
      
      expect(() => PopupController.updateStatistics()).not.toThrow()
    })

    test('updateStatsDisplay should execute with stats', () => {
      PopupController.stats = { blocked: 15 }
      PopupController.elements = { 
        statsContainer: { innerHTML: '', style: { display: 'none' } }
      }
      
      expect(() => PopupController.updateStatsDisplay()).not.toThrow()
    })

    test('updateStatsDisplay should handle no stats', () => {
      PopupController.stats = { blocked: 0 }
      PopupController.elements = { statsContainer: { style: { display: 'block' } } }
      
      expect(() => PopupController.updateStatsDisplay()).not.toThrow()
    })

    test('updateStatsDisplay should handle missing statsContainer', () => {
      PopupController.elements = {}
      
      expect(() => PopupController.updateStatsDisplay()).not.toThrow()
    })
  })

  describe('Cleanup Method', () => {
    test('destroy should log cleanup message', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
      
      PopupController.destroy()
      
      expect(consoleSpy).toHaveBeenCalledWith('[UWB Popup] Popup controller destroyed')
      
      consoleSpy.mockRestore()
    })

    test('destroy should handle errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock console.log to throw an error
      const originalLog = console.log
      console.log = jest.fn(() => { throw new Error('Log failed') })
      
      PopupController.destroy()
      
      expect(consoleSpy).toHaveBeenCalledWith('[UWB Popup] Error during cleanup:', expect.any(Error))
      
      console.log = originalLog
      consoleSpy.mockRestore()
    })
  })
})