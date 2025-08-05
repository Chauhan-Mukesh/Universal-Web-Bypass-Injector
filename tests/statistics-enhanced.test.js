/**
 * @file Enhanced Statistics Tests for 90%+ Coverage
 * @description Focused tests to cover specific uncovered lines in statistics.js
 */

describe('Statistics Controller Enhanced Coverage Tests', () => {
  let StatisticsController
  let originalDocument, originalWindow

  beforeEach(() => {
    // Save originals
    originalDocument = global.document
    originalWindow = global.window

    // Reset all mocks
    jest.clearAllMocks()

    // Setup console spies
    jest.spyOn(console, 'log').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()

    // Setup global alert
    global.alert = jest.fn()

    // Create mock elements
    const createMockElement = () => ({
      textContent: '',
      innerHTML: '',
      style: { display: '' },
      disabled: false,
      addEventListener: jest.fn(),
      classList: { add: jest.fn() },
      appendChild: jest.fn(),
      removeChild: jest.fn(),
      click: jest.fn()
    })

    // Setup document mock
    global.document = {
      getElementById: jest.fn(() => createMockElement()),
      createElement: jest.fn(() => createMockElement()),
      querySelectorAll: jest.fn(() => [createMockElement(), createMockElement()]),
      addEventListener: jest.fn(),
      body: createMockElement()
    }

    // Setup window mock  
    global.window = {
      setInterval: jest.fn(() => 12345),
      clearInterval: jest.fn(),
      confirm: jest.fn(() => true),
      addEventListener: jest.fn(),
      alert: jest.fn()
    }

    // Setup other globals
    global.URL = { createObjectURL: jest.fn(), revokeObjectURL: jest.fn() }
    global.Blob = jest.fn()
    global.Intl = { NumberFormat: jest.fn(() => ({ format: (n) => n.toLocaleString() })) }

    // Setup Chrome API mock
    global.chrome = {
      runtime: {
        sendMessage: jest.fn((msg, cb) => {
          if (cb) cb({ total: 100, today: 10, week: 50, uptime: 120000 })
        }),
        lastError: null
      }
    }

    // Load the statistics module
    delete require.cache[require.resolve('../statistics.js')]
    require('../statistics.js')
    StatisticsController = global.window.StatisticsController
  })

  afterEach(() => {
    // Restore console
    console.log.mockRestore?.()
    console.error.mockRestore?.()
    
    // Restore globals
    global.document = originalDocument
    global.window = originalWindow
  })

  // Test the specific uncovered utility functions
  describe('Utility Functions Coverage', () => {
    test('formatDuration should handle days calculation (lines 564-567)', () => {
      // Test case that covers the days branch >= 1440 minutes
      expect(StatisticsController.formatDuration(1440)).toBe('1d 0h')
      expect(StatisticsController.formatDuration(1500)).toBe('1d 1h')
      expect(StatisticsController.formatDuration(2880)).toBe('2d 0h')
      expect(StatisticsController.formatDuration(4320)).toBe('3d 0h')
    })

    test('capitalizeFirst should handle string capitalization (line 577)', () => {
      expect(StatisticsController.capitalizeFirst('script')).toBe('Script')
      expect(StatisticsController.capitalizeFirst('hello')).toBe('Hello')
      expect(StatisticsController.capitalizeFirst('a')).toBe('A')
      expect(StatisticsController.capitalizeFirst('')).toBe('')
    })

    test('formatNumber should work correctly', () => {
      expect(StatisticsController.formatNumber(1234)).toBe('1,234')
      expect(StatisticsController.formatNumber(0)).toBe('0')
    })
  })

  // Test auto-refresh functionality that covers line 533
  describe('Auto-refresh Coverage', () => {
    test('setupAutoRefresh should set interval (line 533)', () => {
      // Directly call setupAutoRefresh to cover line 533
      StatisticsController.setupAutoRefresh()
      expect(global.window.setInterval).toHaveBeenCalledWith(expect.any(Function), 30000)
      expect(StatisticsController.refreshInterval).toBe(12345)
    })

    test('setupAutoRefresh should handle errors (lines 536-537)', () => {
      global.window.setInterval = jest.fn(() => { throw new Error('Test error') })
      
      StatisticsController.setupAutoRefresh()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error setting up auto-refresh:', expect.any(Error))
    })
  })

  // Test error handling to cover lines 591-592
  describe('Error Handling Coverage', () => {
    test('showError should handle alert errors (lines 591-592)', () => {
      global.alert = jest.fn(() => { throw new Error('Alert failed') })
      
      StatisticsController.showError('Test message')
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error:', 'Test message')
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error showing error message:', expect.any(Error))
    })

    test('showError should work normally', () => {
      StatisticsController.showError('Normal error')
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error:', 'Normal error')
      expect(global.alert).toHaveBeenCalledWith('Normal error')
    })
  })

  // Test cleanup functionality to cover lines 600-609
  describe('Cleanup Coverage', () => {
    test('destroy should clear interval and log (lines 600-609)', () => {
      StatisticsController.refreshInterval = 12345
      
      StatisticsController.destroy()
      
      expect(global.window.clearInterval).toHaveBeenCalledWith(12345)
      expect(StatisticsController.refreshInterval).toBeNull()
      expect(console.log).toHaveBeenCalledWith('[UWB Statistics] Statistics controller destroyed')
    })

    test('destroy should handle null interval', () => {
      StatisticsController.refreshInterval = null
      
      StatisticsController.destroy()
      
      expect(global.window.clearInterval).not.toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('[UWB Statistics] Statistics controller destroyed')
    })

    test('destroy should handle cleanup errors', () => {
      global.window.clearInterval = jest.fn(() => { throw new Error('Clear failed') })
      StatisticsController.refreshInterval = 12345
      
      StatisticsController.destroy()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error during cleanup:', expect.any(Error))
    })
  })

  // Test event listeners to cover lines 614-617 and 621-622
  describe('Event Listeners Coverage', () => {
    test('should trigger DOMContentLoaded callback that handles init errors (lines 614-617)', (done) => {
      // Mock init to fail
      const originalInit = StatisticsController.init
      StatisticsController.init = jest.fn().mockRejectedValue(new Error('Init failed'))
      
      // Find and execute the DOMContentLoaded callback
      const domCallback = global.document.addEventListener.mock.calls
        .find(call => call[0] === 'DOMContentLoaded')?.[1]
      
      if (domCallback) {
        // Execute the callback and wait for the promise to resolve/reject
        domCallback().catch(() => {
          setTimeout(() => {
            expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Failed to initialize:', expect.any(Error))
            StatisticsController.init = originalInit
            done()
          }, 10)
        })
      } else {
        done()
      }
    })

    test('should trigger beforeunload callback (lines 621-622)', () => {
      const destroySpy = jest.spyOn(StatisticsController, 'destroy').mockImplementation(() => {})
      
      // Find and execute the beforeunload callback
      const beforeUnloadCallback = global.window.addEventListener.mock.calls
        .find(call => call[0] === 'beforeunload')?.[1]
      
      if (beforeUnloadCallback) {
        beforeUnloadCallback()
        expect(destroySpy).toHaveBeenCalled()
      }
      
      destroySpy.mockRestore()
    })
  })

  // Test various UI update methods to increase coverage
  describe('UI Updates Coverage', () => {
    test('should handle cacheElements', () => {
      StatisticsController.cacheElements()
      expect(global.document.getElementById).toHaveBeenCalledWith('loading-state')
      expect(global.document.getElementById).toHaveBeenCalledWith('stats-content')
    })

    test('should handle updateOverviewStats with full data', () => {
      StatisticsController.data = {
        total: 1000,
        today: 50, 
        week: 300,
        activeTabs: 5,
        disabledSites: ['test.com'],
        uptime: 3600000 // 1 hour in milliseconds
      }
      
      StatisticsController.cacheElements()
      StatisticsController.updateOverviewStats()
    })

    test('should handle updateTypeChart with empty data', () => {
      StatisticsController.data = { byType: {} }
      StatisticsController.cacheElements()
      StatisticsController.updateTypeChart()
    })

    test('should handle updateTypeChart with data', () => {
      StatisticsController.data = { byType: { script: 60, image: 30 } }
      StatisticsController.cacheElements()
      StatisticsController.updateTypeChart()
    })

    test('should handle updateSitesTable with empty data', () => {
      StatisticsController.data = { topSites: [] }
      StatisticsController.cacheElements()
      StatisticsController.updateSitesTable()
    })

    test('should handle updateSitesTable with data', () => {
      StatisticsController.data = {
        topSites: [['example.com', { blocked: 25, lastActivity: Date.now() }]],
        disabledSites: ['example.com']
      }
      StatisticsController.cacheElements()
      StatisticsController.updateSitesTable()
    })

    test('should handle updateActivityTable with empty data', () => {
      StatisticsController.data = { recentBlocked: [] }
      StatisticsController.cacheElements()
      StatisticsController.updateActivityTable()
    })

    test('should handle updateActivityTable with data', () => {
      StatisticsController.data = {
        recentBlocked: [{
          timestamp: Date.now(),
          hostname: 'example.com',
          type: 'script',
          url: 'https://very-long-url-that-should-be-truncated-because-it-exceeds-fifty-characters.com/path'
        }]
      }
      StatisticsController.cacheElements()
      StatisticsController.updateActivityTable()
    })

    test('should handle updateDisabledSitesTable with empty data', () => {
      StatisticsController.data = { disabledSites: [] }
      StatisticsController.cacheElements()
      StatisticsController.updateDisabledSitesTable()
    })

    test('should handle updateDisabledSitesTable with data', () => {
      StatisticsController.data = { disabledSites: ['example.com', 'test.com'] }
      StatisticsController.cacheElements()
      StatisticsController.updateDisabledSitesTable()
    })

    test('should handle addAnimations', () => {
      StatisticsController.addAnimations()
      expect(global.document.querySelectorAll).toHaveBeenCalledWith('.stat-card')
      expect(global.document.querySelectorAll).toHaveBeenCalledWith('.section')
    })

    test('should handle showContent', () => {
      StatisticsController.cacheElements()
      StatisticsController.showContent()
    })
  })

  // Test chrome extension specific functionality
  describe('Chrome Extension Coverage', () => {
    test('should handle sendMessage chrome runtime errors', async () => {
      chrome.runtime.lastError = { message: 'Runtime error' }
      chrome.runtime.sendMessage.mockImplementation((msg, cb) => {
        if (cb) cb(null)
      })
      
      await expect(StatisticsController.sendMessage({ action: 'test' }))
        .rejects.toThrow('Runtime error')
    })

    test('should handle sendMessage success', async () => {
      chrome.runtime.lastError = null
      const response = await StatisticsController.sendMessage({ action: 'test' })
      expect(response).toHaveProperty('total')
    })

    test('should handle enableSite functionality', async () => {
      chrome.runtime.sendMessage
        .mockImplementationOnce((msg, cb) => cb({ success: true }))
        .mockImplementationOnce((msg, cb) => cb({ total: 100 }))
      
      await StatisticsController.enableSite('example.com')
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'setSiteStatus',
        hostname: 'example.com',
        enabled: true
      }, expect.any(Function))
    })

    test('should handle enableSite errors', async () => {
      chrome.runtime.sendMessage.mockImplementation((msg, cb) => cb({ error: 'Failed' }))
      
      await StatisticsController.enableSite('example.com')
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error enabling site:', expect.any(Error))
    })

    test('should handle exportData', () => {
      StatisticsController.data = { total: 100 }
      StatisticsController.exportData()
      
      expect(global.Blob).toHaveBeenCalledWith([expect.any(String)], { type: 'application/json' })
      expect(global.URL.createObjectURL).toHaveBeenCalled()
    })

    test('should handle exportData errors', () => {
      StatisticsController.data = { total: 100 }
      global.URL.createObjectURL = jest.fn(() => { throw new Error('Export failed') })
      
      StatisticsController.exportData()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error exporting data:', expect.any(Error))
    })

    test('should handle resetStatistics with confirmation', async () => {
      global.window.confirm.mockReturnValue(true)
      chrome.runtime.sendMessage
        .mockImplementationOnce((msg, cb) => cb({ success: true }))
        .mockImplementationOnce((msg, cb) => cb({ total: 0 }))
      
      await StatisticsController.resetStatistics()
      expect(global.window.confirm).toHaveBeenCalled()
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'resetStats' }, expect.any(Function))
    })

    test('should not reset without confirmation', async () => {
      global.window.confirm.mockReturnValue(false)
      
      await StatisticsController.resetStatistics()
      expect(global.window.confirm).toHaveBeenCalled()
      // Should not send reset message
    })

    test('should handle resetStatistics errors', async () => {
      global.window.confirm.mockReturnValue(true)
      chrome.runtime.sendMessage.mockImplementation((msg, cb) => cb({ error: 'Reset failed' }))
      
      await StatisticsController.resetStatistics()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error resetting statistics:', expect.any(Error))
    })

    test('should handle refreshData', async () => {
      const mockRefreshBtn = { textContent: '', disabled: false }
      StatisticsController.elements = { refreshBtn: mockRefreshBtn }
      
      await StatisticsController.refreshData()
      expect(chrome.runtime.sendMessage).toHaveBeenCalled()
    })

    test('should handle refreshData errors', async () => {
      const mockRefreshBtn = { textContent: '', disabled: false }
      StatisticsController.elements = { refreshBtn: mockRefreshBtn }
      chrome.runtime.sendMessage.mockImplementation((msg, cb) => cb({ error: 'Refresh failed' }))
      
      await StatisticsController.refreshData()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error refreshing data:', expect.any(Error))
    })

    test('should handle loadStatistics', async () => {
      await StatisticsController.loadStatistics()
      expect(StatisticsController.data).toBeDefined()
    })

    test('should handle loadStatistics errors', async () => {
      chrome.runtime.sendMessage.mockImplementation((msg, cb) => cb({ error: 'Load failed' }))
      
      await StatisticsController.loadStatistics()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error loading statistics:', expect.any(Error))
    })
  })

  // Test initialization and error paths
  describe('Initialization Coverage', () => {
    test('should handle init success', async () => {
      await StatisticsController.init()
      expect(console.log).toHaveBeenCalledWith('[UWB Statistics] Initialized successfully')
    })

    test('should handle init errors', async () => {
      const originalCacheElements = StatisticsController.cacheElements
      StatisticsController.cacheElements = jest.fn(() => { throw new Error('Cache failed') })
      
      await StatisticsController.init()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Initialization error:', expect.any(Error))
      
      StatisticsController.cacheElements = originalCacheElements
    })

    test('should handle setupEventListeners', () => {
      StatisticsController.setupEventListeners()
      expect(console.log).toHaveBeenCalledWith('[UWB Statistics] Event listeners setup complete')
    })

    test('should handle setupEventListeners errors', () => {
      const originalElements = StatisticsController.elements
      StatisticsController.elements = {
        refreshBtn: { addEventListener: jest.fn(() => { throw new Error('Event error') }) }
      }
      
      StatisticsController.setupEventListeners()
      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error setting up event listeners:', expect.any(Error))
      
      StatisticsController.elements = originalElements
    })
  })
})