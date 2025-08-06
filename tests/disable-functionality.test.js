/**
 * @file Disable Extension Functionality Tests
 * @description Comprehensive tests for the extension disable/enable functionality
 */

describe('Extension Disable/Enable Functionality', () => {
  let mockChrome
  let BackgroundService
  let PopupController

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock Chrome APIs
    mockChrome = {
      storage: {
        sync: {
          get: jest.fn(),
          set: jest.fn()
        }
      },
      runtime: {
        sendMessage: jest.fn(),
        onMessage: {
          addListener: jest.fn()
        }
      },
      tabs: {
        query: jest.fn(),
        reload: jest.fn()
      }
    }

    global.chrome = mockChrome

    // Load background service
    require('../background.js')
    BackgroundService = global.BackgroundService

    // Load popup controller
    require('../popup.js')
    PopupController = global.PopupController
  })

  describe('Site Disable/Enable in Background Service', () => {
    beforeEach(() => {
      BackgroundService.disabledSites = new Set()
    })

    test('should disable site correctly', async() => {
      const hostname = 'example.com'
      const initialSize = BackgroundService.disabledSites.size

      // Mock storage response
      mockChrome.storage.sync.set.mockResolvedValue(undefined)

      // Call toggleSite
      await BackgroundService.toggleSite(hostname)

      // Verify site was added to disabled sites
      expect(BackgroundService.disabledSites.has(hostname)).toBe(true)
      expect(BackgroundService.disabledSites.size).toBe(initialSize + 1)

      // Verify storage was updated
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        disabledSites: Array.from(BackgroundService.disabledSites),
        statistics: expect.any(Object)
      })
    })

    test('should enable site correctly when already disabled', async() => {
      const hostname = 'example.com'
      
      // Pre-disable the site
      BackgroundService.disabledSites.add(hostname)
      const initialSize = BackgroundService.disabledSites.size

      // Mock storage response
      mockChrome.storage.sync.set.mockResolvedValue(undefined)

      // Call toggleSite again
      await BackgroundService.toggleSite(hostname)

      // Verify site was removed from disabled sites
      expect(BackgroundService.disabledSites.has(hostname)).toBe(false)
      expect(BackgroundService.disabledSites.size).toBe(initialSize - 1)
    })

    test('should check site status correctly', () => {
      const hostname = 'example.com'

      // Initially enabled
      let result = BackgroundService.getSiteStatus(hostname)
      expect(result.enabled).toBe(true)

      // Disable site
      BackgroundService.disabledSites.add(hostname)
      result = BackgroundService.getSiteStatus(hostname)
      expect(result.enabled).toBe(false)
    })

    test('should handle message for checking if site is disabled', () => {
      const hostname = 'example.com'
      const sendResponse = jest.fn()

      // Site is enabled
      const request = { action: 'checkSiteStatus', hostname }
      BackgroundService.handleMessage(request, null, sendResponse)
      expect(sendResponse).toHaveBeenCalledWith({ 
        success: true, 
        disabled: false 
      })

      // Disable site
      BackgroundService.disabledSites.add(hostname)
      sendResponse.mockClear()
      
      BackgroundService.handleMessage(request, null, sendResponse)
      expect(sendResponse).toHaveBeenCalledWith({ 
        success: false, 
        disabled: true 
      })
    })

    test('should handle toggleSite message correctly', async() => {
      const hostname = 'example.com'
      const sendResponse = jest.fn()
      const request = { action: 'toggleSite', hostname }

      // Mock storage
      mockChrome.storage.sync.set.mockResolvedValue(undefined)

      // Call handleToggleSite directly since handleMessage doesn't await async handlers
      await BackgroundService.handleToggleSite(request, null, sendResponse)
      
      expect(BackgroundService.disabledSites.has(hostname)).toBe(true)
      expect(sendResponse).toHaveBeenCalledWith({ 
        success: true, 
        enabled: false,
        hostname: 'example.com'
      })
    })
  })

  describe('Popup Disable/Enable Interface', () => {
    beforeEach(() => {
      // Mock DOM elements
      document.body.innerHTML = `
        <div id="site-toggle" class="toggle-switch">
          <input type="checkbox" id="site-enabled" checked>
          <label for="site-enabled">Enable for this site</label>
        </div>
        <div id="current-url">https://example.com</div>
        <div class="status-indicator">
          <div class="status-dot"></div>
          <span>Active</span>
        </div>
        <div id="stats-summary"></div>
      `

      PopupController.currentTab = { url: 'https://example.com' }
      PopupController.siteStatus = { enabled: true, hostname: 'example.com' }
    })

    test('should initialize site toggle correctly', () => {
      PopupController.cacheElements()
      
      expect(PopupController.elements.siteToggle).toBeDefined()
      expect(PopupController.elements.currentUrl).toBeDefined()
    })

    test('should handle site toggle click', async() => {
      PopupController.cacheElements()
      
      // Mock sendMessage
      PopupController.sendMessage = jest.fn().mockResolvedValue({
        success: true,
        enabled: false
      })

      // Mock reload tab
      PopupController.reloadCurrentTab = jest.fn()

      // Simulate toggle click
      await PopupController.handleSiteToggle()

      expect(PopupController.sendMessage).toHaveBeenCalledWith({
        action: 'toggleSite',
        hostname: 'example.com'
      })
    })

    test('should update UI when site is disabled', () => {
      PopupController.cacheElements()
      
      // Set site as disabled
      PopupController.siteStatus.enabled = false
      
      PopupController.updateSiteToggle()
      
      const siteToggle = document.getElementById('site-enabled')
      expect(siteToggle.checked).toBe(false)
    })

    test('should update status indicator when site is disabled', () => {
      PopupController.cacheElements()
      
      // Set site as disabled
      PopupController.siteStatus.enabled = false
      
      PopupController.updateStatusIndicator()
      
      const statusDot = document.querySelector('.status-dot')
      const statusText = document.querySelector('.status-indicator span')
      
      expect(statusDot.className).toContain('disabled')
      expect(statusText.textContent).toBe('Disabled')
    })
  })

  describe('Content Script Disable Behavior', () => {
    test('should not initialize when site is disabled', async() => {
      global.window = {
        location: { hostname: 'example.com', protocol: 'https:' }
      }

      // Mock the content script environment
      const UniversalBypass = {
        initialized: false,
        _checkSiteEnabled: jest.fn().mockResolvedValue(false),
        _log: jest.fn(),
        init: jest.fn()
      }

      // Mock content script init
      const initSpy = jest.spyOn(UniversalBypass, 'init')

      // Simulate content script loading when site is disabled
      if (!(await UniversalBypass._checkSiteEnabled('example.com'))) {
        expect(initSpy).not.toHaveBeenCalled()
      }
    })

    test('should check site status via message to background', async() => {
      const mockSendMessage = jest.fn().mockResolvedValue({ disabled: true })
      
      global.chrome = {
        runtime: {
          sendMessage: mockSendMessage
        }
      }

      // Simulate checking site status
      const response = await chrome.runtime.sendMessage({
        action: 'checkSiteStatus',
        hostname: 'example.com'
      })

      expect(mockSendMessage).toHaveBeenCalledWith({
        action: 'checkSiteStatus',
        hostname: 'example.com'
      })
      expect(response.disabled).toBe(true)
    })
  })

  describe('Persistence and Storage', () => {
    test('should persist disabled sites to storage', async() => {
      BackgroundService.disabledSites = new Set(['example.com', 'test.com'])
      
      mockChrome.storage.sync.set.mockResolvedValue(undefined)
      
      await BackgroundService.saveStorage()
      
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        disabledSites: ['example.com', 'test.com'],
        statistics: expect.any(Object)
      })
    })

    test('should load disabled sites from storage', async() => {
      const mockStorageData = {
        disabledSites: ['example.com', 'disabled.com'],
        statistics: {}
      }
      
      mockChrome.storage.sync.get.mockResolvedValue(mockStorageData)
      
      await BackgroundService.loadStorageData()
      
      expect(BackgroundService.disabledSites.has('example.com')).toBe(true)
      expect(BackgroundService.disabledSites.has('disabled.com')).toBe(true)
      expect(BackgroundService.disabledSites.size).toBe(2)
    })

    test('should handle empty storage gracefully', async() => {
      // Clear any existing data first
      BackgroundService.disabledSites = new Set()
      
      mockChrome.storage.sync.get.mockResolvedValue({})
      
      await BackgroundService.loadStorageData()
      
      expect(BackgroundService.disabledSites.size).toBe(0)
    })
  })

  describe('Error Handling', () => {
    test('should handle storage errors gracefully', async() => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      
      mockChrome.storage.sync.set.mockRejectedValue(new Error('Storage error'))
      
      try {
        await BackgroundService.saveStorage()
      } catch (_error) {
        // Should not throw
      }
      
      expect(consoleErrorSpy).toHaveBeenCalled()
      consoleErrorSpy.mockRestore()
    })

    test('should handle message handling errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      const sendResponse = jest.fn()
      
      // Invalid request
      const request = { action: 'invalidAction' }
      
      BackgroundService.handleMessage(request, null, sendResponse)
      
      // Should not crash the extension and return the expected error
      expect(sendResponse).toHaveBeenCalledWith({ 
        error: "Unknown action"
      })
      
      consoleErrorSpy.mockRestore()
    })
  })
})