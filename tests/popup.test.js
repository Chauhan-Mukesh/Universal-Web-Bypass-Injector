/**
 * @file Popup Script Tests
 * @description Comprehensive tests for the PopupController class
 */

/* global PopupController */

describe('PopupController', () => {
  let mockElements

  beforeEach(() => {
    // Reset Chrome API mocks
    jest.clearAllMocks()
    delete chrome.runtime.lastError

    // Mock chrome.runtime.getURL
    chrome.runtime.getURL = jest.fn((path) => `chrome-extension://test/${path}`)

    // Mock window.close since popup.js calls it
    global.window.close = jest.fn()

    // Mock DOM elements
    mockElements = {
      currentUrl: { textContent: '', title: '' },
      statusDot: { className: '', style: { backgroundColor: '' } },
      statusText: { textContent: '' },
      helpLink: { addEventListener: jest.fn() },
      version: { textContent: '' },
      statsContainer: { style: { display: '' }, innerHTML: '' },
      errorContainer: { style: { display: '' }, textContent: '' },
      refreshButton: { addEventListener: jest.fn(), textContent: '', disabled: false },
      toggleButton: { addEventListener: jest.fn() },
      siteToggle: { 
        addEventListener: jest.fn(),
        className: '',
        setAttribute: jest.fn(),
        style: { opacity: '' }
      },
      statsSummary: { 
        addEventListener: jest.fn(),
        style: { display: '' },
        classList: { add: jest.fn() }
      },
      blockedCount: { textContent: '' },
      sessionTime: { textContent: '' }
    }

    // Mock document methods
    document.getElementById = jest.fn((id) => mockElements[id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())])
    document.querySelector = jest.fn((selector) => {
      if (selector === '.status-dot') return mockElements.statusDot
      if (selector === '.status-indicator span') return mockElements.statusText
      if (selector === '.footer') return mockElements.version
      if (selector === '.container') return { classList: { add: jest.fn() }, insertBefore: jest.fn() }
      return null
    })
    document.querySelectorAll = jest.fn((selector) => {
      if (selector === '.feature-list li') return []
      if (selector === '.stat-card') return []
      if (selector === '.section') return []
      return []
    })
    document.addEventListener = jest.fn()
    document.createElement = jest.fn(() => ({
      id: '',
      className: '',
      style: { cssText: '', display: '' },
      textContent: ''
    }))

    // Mock setTimeout for animations
    global.setTimeout = jest.fn((fn, delay) => fn())

    // Mock console
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn()
    }

    // Load the popup script
    delete require.cache[require.resolve('../popup.js')]
    require('../popup.js')
  })

  describe('Initialization', () => {
    test('should cache DOM elements correctly', () => {
      PopupController.cacheElements()

      expect(PopupController.elements).toBeDefined()
      expect(PopupController.elements.currentUrl).toBe(mockElements.currentUrl)
      expect(PopupController.elements.statusDot).toBe(mockElements.statusDot)
      expect(PopupController.elements.statusText).toBe(mockElements.statusText)
    })

    test('should setup event listeners', () => {
      PopupController.cacheElements()
      PopupController.setupEventListeners()

      expect(mockElements.helpLink.addEventListener).toHaveBeenCalled()
      expect(mockElements.refreshButton.addEventListener).toHaveBeenCalled()
      expect(mockElements.siteToggle.addEventListener).toHaveBeenCalled()
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    test('should initialize successfully with valid data', async () => {
      // Mock successful responses
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 123, url: 'https://example.com', title: 'Example' }])
      })

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getTabInfo') {
          callback({ totalBlocked: 5, bypassActive: true })
        } else if (message.action === 'getSiteStatus') {
          callback({ enabled: true })
        } else if (message.action === 'getStats') {
          callback({ blocked: 10, sessionStartTime: Date.now() })
        }
      })

      PopupController.cacheElements()
      await PopupController.init()

      expect(PopupController.currentTab).toBeDefined()
      expect(PopupController.siteStatus.enabled).toBe(true)
      expect(PopupController.stats.blocked).toBe(10)
    })

    test('should handle initialization errors gracefully', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        chrome.runtime.lastError = { message: 'Permission denied' }
        callback([])
      })

      PopupController.cacheElements()
      await PopupController.init()

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('Tab Management', () => {
    test('should query active tab successfully', async () => {
      const mockTab = { id: 123, url: 'https://example.com', title: 'Example' }
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([mockTab])
      })

      const tab = await PopupController.queryActiveTab()
      expect(tab).toEqual([mockTab])
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      )
    })

    test('should handle query tab errors', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        chrome.runtime.lastError = { message: 'Permission denied' }
        callback([])
      })

      await expect(PopupController.queryActiveTab()).rejects.toThrow('Permission denied')
    })

    test('should load current tab and stats', async () => {
      const mockTab = { id: 123, url: 'https://example.com' }
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([mockTab])
      })

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getTabInfo') {
          callback({ totalBlocked: 15, bypassActive: true })
        }
      })

      await PopupController.loadCurrentTab()

      expect(PopupController.currentTab).toEqual(mockTab)
      expect(PopupController.stats.blocked).toBe(15)
    })

    test('should handle empty tab list', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([])
      })

      PopupController.cacheElements()
      await PopupController.loadCurrentTab()

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('Site Status Management', () => {
    test('should load site status successfully', async () => {
      PopupController.currentTab = { url: 'https://example.com/page' }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getSiteStatus') {
          callback({ enabled: false })
        }
      })

      await PopupController.loadSiteStatus()

      expect(PopupController.siteStatus.hostname).toBe('example.com')
      expect(PopupController.siteStatus.enabled).toBe(false)
    })

    test('should handle invalid URLs gracefully', async () => {
      PopupController.currentTab = { url: 'invalid-url' }

      await PopupController.loadSiteStatus()

      expect(console.log).toHaveBeenCalled()
    })

    test('should toggle site status', async () => {
      PopupController.siteStatus = { hostname: 'example.com', enabled: true }
      PopupController.cacheElements()

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'setSiteStatus') {
          callback({ success: true, enabled: false })
        }
      })

      await PopupController.toggleSiteStatus()

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'setSiteStatus',
        hostname: 'example.com',
        enabled: false
      }, expect.any(Function))
    })
  })

  describe('Statistics Management', () => {
    test('should load statistics successfully', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getStats') {
          callback({ 
            totalBlocked: 50,
            sessionsActive: 1,
            sessionStartTime: Date.now() - 300000
          })
        }
      })

      await PopupController.loadStatistics()

      expect(PopupController.stats.totalBlocked).toBe(50)
      expect(PopupController.stats.sessionsActive).toBe(1)
    })
  })

  describe('Message Handling', () => {
    test('should send messages successfully', async () => {
      const testMessage = { action: 'test' }
      const testResponse = { success: true }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(testResponse)
      })

      const response = await PopupController.sendMessage(testMessage)

      expect(response).toEqual(testResponse)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(testMessage, expect.any(Function))
    })

    test('should handle message errors', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        chrome.runtime.lastError = { message: 'Connection failed' }
        callback(null)
      })

      await expect(PopupController.sendMessage({ action: 'test' }))
        .rejects.toThrow('Connection failed')
    })

    test('should handle send message exceptions', async () => {
      chrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Extension context invalidated')
      })

      await expect(PopupController.sendMessage({ action: 'test' }))
        .rejects.toThrow('Extension context invalidated')
    })
  })

  describe('UI Updates', () => {
    beforeEach(() => {
      PopupController.cacheElements()
      PopupController.currentTab = { url: 'https://example.com', title: 'Example Site' }
      PopupController.siteStatus = { enabled: true, hostname: 'example.com' }
      PopupController.stats = {
        blocked: 25,
        active: true,
        sessionStartTime: Date.now() - 180000,
        totalBlocked: 100
      }
    })

    test('should update URL display', () => {
      PopupController.updateCurrentUrl()

      expect(mockElements.currentUrl.textContent).toBe('example.com')
    })

    test('should update status display for active site', () => {
      PopupController.updateStatus()

      expect(mockElements.statusDot.className).toContain('active')
      expect(mockElements.statusText.textContent).toContain('Active')
    })

    test('should update status display for disabled site', () => {
      PopupController.siteStatus.enabled = false
      PopupController.updateStatus()

      expect(mockElements.statusDot.className).toContain('inactive')
      expect(mockElements.statusText.textContent).toContain('Disabled')
    })

    test('should update toggle display', () => {
      PopupController.updateSiteToggle()

      expect(mockElements.siteToggle.className).toContain('active')
      expect(mockElements.siteToggle.setAttribute).toHaveBeenCalledWith('aria-checked', 'true')
    })

    test('should update statistics display', () => {
      PopupController.updateStatistics()

      expect(mockElements.statsSummary.style.display).toBe('block')
      // The actual PopupController uses totalBlocked or blocked, and converts to string
      expect(mockElements.blockedCount.textContent).toBe(100)
    })

    test('should hide stats when no data', () => {
      PopupController.stats = { blocked: 0, totalBlocked: 0 }
      PopupController.updateStatistics()

      expect(mockElements.statsSummary.style.display).toBe('none')
    })

    test('should update version display', () => {
      chrome.runtime.getManifest.mockReturnValue({ version: '2.0.0' })
      mockElements.version.textContent = 'Universal Web Bypass Injector v1.0.0'
      
      PopupController.updateVersion()

      expect(mockElements.version.textContent).toContain('v2.0.0')
    })
  })

  describe('User Actions', () => {
    beforeEach(() => {
      PopupController.cacheElements()
      PopupController.currentTab = { id: 123, url: 'https://example.com' }
    })

    test('should toggle bypass functionality', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true })
      })

      await PopupController.toggleBypass()

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'executeBypass',
        tabId: 123
      }, expect.any(Function))
    })

    test('should refresh current tab', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 123, url: 'https://example.com' }])
      })

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true })
      })

      await PopupController.refreshCurrentTab()

      expect(mockElements.refreshButton.textContent).toBe('Refresh')
      expect(mockElements.refreshButton.disabled).toBe(false)
    })

    test('should open help page', () => {
      PopupController.openHelpPage()

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
      })
    })

    test('should open statistics page', () => {      
      PopupController.openStatisticsPage()

      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test/statistics.html'
      })
      expect(window.close).toHaveBeenCalled()
    })
  })

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      PopupController.cacheElements()
      PopupController.currentTab = { id: 123 }
    })

    test('should handle Escape key', () => {
      const mockEvent = { key: 'Escape', preventDefault: jest.fn() }

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(window.close).toHaveBeenCalled()
    })

    test('should handle Ctrl+R for refresh', async () => {
      const mockEvent = { key: 'r', ctrlKey: true, preventDefault: jest.fn() }
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 123, url: 'https://example.com' }])
      })
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true })
      })

      await PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    test('should handle Ctrl+H for help', () => {
      const mockEvent = { key: 'h', ctrlKey: true, preventDefault: jest.fn() }

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
      })
    })

    test('should ignore unhandled keys', () => {
      const mockEvent = { key: 'a', preventDefault: jest.fn() }

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      PopupController.cacheElements()
    })

    test('should show error messages', () => {
      // Test that showError method executes without throwing
      expect(() => {
        PopupController.showError('Test error message')
      }).not.toThrow()
    })
  })

  describe('Utility Functions', () => {
    test('should check if extension is active', () => {
      PopupController.currentTab = { url: 'https://example.com' }
      expect(PopupController.isExtensionActive()).toBe(true)

      PopupController.currentTab = { url: 'chrome://extensions' }
      expect(PopupController.isExtensionActive()).toBe(false)

      PopupController.currentTab = { url: 'about:blank' }
      expect(PopupController.isExtensionActive()).toBe(false)

      PopupController.currentTab = null
      expect(PopupController.isExtensionActive()).toBe(false)

      PopupController.currentTab = { url: 'invalid-url' }
      expect(PopupController.isExtensionActive()).toBe(false)
    })
  })

  describe('UI Update Methods', () => {
    beforeEach(() => {
      PopupController.cacheElements()
      PopupController.currentTab = { url: 'https://example.com', title: 'Example Site' }
      PopupController.siteStatus = { enabled: true, hostname: 'example.com' }
      PopupController.stats = {
        blocked: 25,
        active: true,
        sessionStartTime: Date.now() - 180000,
        totalBlocked: 100
      }
    })

    test('should update current URL display', () => {
      PopupController.updateCurrentUrl()
      expect(mockElements.currentUrl.textContent).toBe('example.com')
      expect(mockElements.currentUrl.title).toBe('https://example.com')
    })

    test('should handle invalid URL in updateCurrentUrl', () => {
      PopupController.currentTab = { url: 'invalid-url' }
      PopupController.updateCurrentUrl()
      expect(mockElements.currentUrl.textContent).toBe('Invalid URL')
    })

    test('should update status display', () => {
      PopupController.updateStatus()
      expect(mockElements.statusDot.className).toContain('active')
      expect(mockElements.statusText.textContent).toContain('Active')
    })

    test('should update site toggle display', () => {
      PopupController.updateSiteToggle()
      expect(mockElements.siteToggle.className).toContain('active')
      expect(mockElements.siteToggle.setAttribute).toHaveBeenCalledWith('aria-checked', 'true')
    })

    test('should update statistics display', () => {
      PopupController.updateStatistics()
      expect(mockElements.statsSummary.style.display).toBe('block')
    })

    test('should hide statistics when no data', () => {
      PopupController.stats = { blocked: 0, sessionsActive: 0 }
      PopupController.updateStatistics()
      expect(mockElements.statsSummary.style.display).toBe('none')
    })

    test('should update version display', () => {
      chrome.runtime.getManifest.mockReturnValue({ version: '2.0.0' })
      mockElements.version.textContent = 'Universal Web Bypass Injector v1.0.0'
      
      PopupController.updateVersion()
      expect(mockElements.version.textContent).toContain('v2.0.0')
    })

    test('should update stats display container', () => {
      PopupController.updateStatsDisplay()
      expect(mockElements.statsContainer.style.display).toBe('block')
      expect(mockElements.statsContainer.innerHTML).toContain('25')
    })

    test('should add animations', () => {
      const mockContainer = { classList: { add: jest.fn() } }
      const mockFeatureItems = [
        { classList: { add: jest.fn() } },
        { classList: { add: jest.fn() } }
      ]

      document.querySelector = jest.fn((selector) => {
        if (selector === '.container') return mockContainer
        return null
      })
      document.querySelectorAll = jest.fn(() => mockFeatureItems)

      PopupController.addAnimations()
      expect(mockContainer.classList.add).toHaveBeenCalledWith('animate-slide-in')
    })
  })

  describe('Message Display', () => {
    beforeEach(() => {
      PopupController.cacheElements()
    })

    test('should show success message', () => {
      const mockContainer = { insertBefore: jest.fn() }
      document.querySelector = jest.fn(() => mockContainer)
      document.createElement = jest.fn(() => ({
        id: '',
        style: { cssText: '', display: '' },
        textContent: ''
      }))

      PopupController.showMessage('Test message', 'success')
      expect(document.createElement).toHaveBeenCalledWith('div')
    })

    test('should show error message', () => {
      // Test that showError method executes without throwing
      expect(() => {
        PopupController.showError('Test error')
      }).not.toThrow()
    })

    test('should handle showError when no error container exists', () => {
      PopupController.elements.errorContainer = null
      const mockErrorContainer = {
        id: '',
        className: '',
        style: { cssText: '', display: '' },
        textContent: ''
      }
      document.createElement = jest.fn(() => mockErrorContainer)
      document.body.insertBefore = jest.fn()

      PopupController.showError('Test error')
      expect(document.createElement).toHaveBeenCalledWith('div')
    })
  })

  describe('Refresh Functionality', () => {
    beforeEach(() => {
      PopupController.cacheElements()
      PopupController.currentTab = { id: 123, url: 'https://example.com' }
    })

    test('should refresh current tab successfully', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 123, url: 'https://example.com' }])
      })

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true })
      })

      await PopupController.refreshCurrentTab()

      expect(mockElements.refreshButton.textContent).toBe('Refresh')
      expect(mockElements.refreshButton.disabled).toBe(false)
    })

    test('should handle refresh errors', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        chrome.runtime.lastError = { message: 'Permission denied' }
        callback([])
      })

      PopupController.cacheElements()
      await PopupController.refreshCurrentTab()

      expect(console.error).toHaveBeenCalled()
      expect(mockElements.refreshButton.textContent).toBe('Refresh')
      expect(mockElements.refreshButton.disabled).toBe(false)
    })
  })

  describe('Keyboard Shortcuts', () => {
    beforeEach(() => {
      PopupController.cacheElements()
      PopupController.currentTab = { id: 123 }
    })

    test('should handle Escape key to close window', () => {
      const mockEvent = { key: 'Escape', preventDefault: jest.fn() }
      const closeSpy = jest.spyOn(window, 'close').mockImplementation()

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(closeSpy).toHaveBeenCalled()
      closeSpy.mockRestore()
    })

    test('should handle Ctrl+R for refresh', async () => {
      const mockEvent = { key: 'r', ctrlKey: true, preventDefault: jest.fn() }
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 123, url: 'https://example.com' }])
      })
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true })
      })

      await PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })

    test('should handle Ctrl+H for help', () => {
      const mockEvent = { key: 'h', ctrlKey: true, preventDefault: jest.fn() }
      const closeSpy = jest.spyOn(window, 'close').mockImplementation()

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(chrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
      })
      expect(closeSpy).toHaveBeenCalled()
      closeSpy.mockRestore()
    })

    test('should handle Meta+R for refresh on Mac', async () => {
      const mockEvent = { key: 'r', metaKey: true, preventDefault: jest.fn() }
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{ id: 123, url: 'https://example.com' }])
      })
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true })
      })

      await PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    test('should destroy controller properly', () => {
      PopupController.destroy()
      expect(console.log).toHaveBeenCalledWith('[UWB Popup] Popup controller destroyed')
    })
  })
})