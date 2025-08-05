/**
 * @file Statistics Page Tests
 * @description Comprehensive tests for the StatisticsController class
 */

/* global StatisticsController */

describe('StatisticsController', () => {
  let mockElements

  beforeEach(() => {
    // Reset Chrome API mocks
    jest.clearAllMocks()
    delete chrome.runtime.lastError

    // Mock DOM elements
    mockElements = {
      loadingState: { style: { display: '' } },
      statsContent: { style: { display: '' } },
      refreshBtn: { 
        addEventListener: jest.fn(),
        textContent: '',
        disabled: false
      },
      exportBtn: { addEventListener: jest.fn() },
      resetBtn: { addEventListener: jest.fn() },
      totalBlocked: { textContent: '' },
      todayBlocked: { textContent: '' },
      weekBlocked: { textContent: '' },
      activeTabs: { textContent: '' },
      disabledSites: { textContent: '' },
      uptime: { textContent: '' },
      typeChart: { innerHTML: '' },
      sitesTable: { innerHTML: '' },
      activityTable: { innerHTML: '' },
      disabledSitesTable: { innerHTML: '' }
    }

    // Mock document methods
    document.getElementById = jest.fn((id) => {
      const camelCaseId = id.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      return mockElements[camelCaseId] || null
    })
    document.querySelectorAll = jest.fn(() => [])
    document.createElement = jest.fn(() => ({
      href: '',
      download: '',
      click: jest.fn()
    }))
    
    // Mock document.body methods without replacing body
    jest.spyOn(document.body, 'appendChild').mockImplementation(jest.fn())
    jest.spyOn(document.body, 'removeChild').mockImplementation(jest.fn())

    // Mock console
    global.console = {
      ...console,
      log: jest.fn(),
      error: jest.fn()
    }

    // Mock global objects
    global.URL = {
      createObjectURL: jest.fn(() => 'blob:test'),
      revokeObjectURL: jest.fn()
    }
    global.Blob = jest.fn()
    global.setInterval = jest.fn(() => 123)
    global.clearInterval = jest.fn()
    global.confirm = jest.fn(() => true)
    global.alert = jest.fn()

    // Load the statistics script
    delete require.cache[require.resolve('../statistics.js')]
    require('../statistics.js')
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Initialization', () => {
    test('should cache DOM elements correctly', () => {
      StatisticsController.cacheElements()

      expect(StatisticsController.elements).toBeDefined()
      expect(StatisticsController.elements.loadingState).toBe(mockElements.loadingState)
      expect(StatisticsController.elements.totalBlocked).toBe(mockElements.totalBlocked)
      expect(StatisticsController.elements.typeChart).toBe(mockElements.typeChart)
    })

    test('should setup event listeners', () => {
      StatisticsController.cacheElements()
      StatisticsController.setupEventListeners()

      expect(mockElements.refreshBtn.addEventListener).toHaveBeenCalled()
      expect(mockElements.exportBtn.addEventListener).toHaveBeenCalled()
      expect(mockElements.resetBtn.addEventListener).toHaveBeenCalled()
      expect(console.log).toHaveBeenCalledWith('[UWB Statistics] Event listeners setup complete')
    })

    test('should initialize successfully with valid data', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'getDetailedStats') {
          callback({
            total: 100,
            today: 25,
            week: 75,
            activeTabs: 2,
            disabledSites: ['example.com'],
            uptime: 3600000,
            byType: { script: 50, image: 30 }
          })
        }
      })

      StatisticsController.cacheElements()
      await StatisticsController.init()

      expect(StatisticsController.data).toBeDefined()
      expect(StatisticsController.data.total).toBe(100)
    })

    test('should handle initialization errors', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ error: 'Failed to load' })
      })

      StatisticsController.cacheElements()
      await StatisticsController.init()

      expect(console.error).toHaveBeenCalled()
    })

    test('should setup auto-refresh', () => {
      StatisticsController.setupAutoRefresh()

      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 30000)
      expect(StatisticsController.refreshInterval).toBe(123)
    })
  })

  describe('Message Handling', () => {
    test('should send messages successfully', async () => {
      const testMessage = { action: 'test' }
      const testResponse = { success: true }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(testResponse)
      })

      const response = await StatisticsController.sendMessage(testMessage)

      expect(response).toEqual(testResponse)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(testMessage, expect.any(Function))
    })

    test('should handle message errors', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        chrome.runtime.lastError = { message: 'Connection failed' }
        callback(null)
      })

      await expect(StatisticsController.sendMessage({ action: 'test' }))
        .rejects.toThrow('Connection failed')
    })

    test('should handle send message exceptions', async () => {
      chrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Extension context invalidated')
      })

      await expect(StatisticsController.sendMessage({ action: 'test' }))
        .rejects.toThrow('Extension context invalidated')
    })
  })

  describe('Statistics Loading', () => {
    beforeEach(() => {
      StatisticsController.cacheElements()
    })

    test('should load statistics successfully', async () => {
      const mockData = {
        total: 100,
        today: 25,
        week: 75,
        activeTabs: 3,
        disabledSites: ['example.com'],
        uptime: 3600000,
        byType: { script: 50, image: 30, iframe: 20 }
      }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockData)
      })

      await StatisticsController.loadStatistics()

      expect(StatisticsController.data).toEqual(mockData)
      expect(StatisticsController.elements.statsContent.style.display).toBe('block')
      expect(StatisticsController.elements.loadingState.style.display).toBe('none')
    })

    test('should handle loading errors', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ error: 'Failed to load' })
      })

      await StatisticsController.loadStatistics()

      expect(console.error).toHaveBeenCalled()
      expect(alert).toHaveBeenCalledWith('Failed to load statistics data')
    })

    test('should handle null response', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(null)
      })

      await StatisticsController.loadStatistics()

      expect(console.error).toHaveBeenCalled()
    })
  })

  describe('UI Updates', () => {
    beforeEach(() => {
      StatisticsController.cacheElements()
      StatisticsController.data = {
        total: 1234,
        today: 56,
        week: 789,
        activeTabs: 2,
        disabledSites: ['example.com', 'test.com'],
        uptime: 7260000, // 2 hours 1 minute
        byType: { script: 800, image: 300, iframe: 134 },
        topSites: [
          ['example.com', { blocked: 50, lastActivity: Date.now() }],
          ['test.com', { blocked: 25, lastActivity: Date.now() - 86400000 }]
        ],
        recentBlocked: [
          { timestamp: Date.now(), hostname: 'example.com', type: 'script', url: 'https://example.com/ad.js' }
        ]
      }
    })

    test('should update overview statistics correctly', () => {
      StatisticsController.updateOverviewStats()

      expect(StatisticsController.elements.totalBlocked.textContent).toBe('1,234')
      expect(StatisticsController.elements.todayBlocked.textContent).toBe('56')
      expect(StatisticsController.elements.weekBlocked.textContent).toBe('789')
      expect(StatisticsController.elements.activeTabs.textContent).toBe(2)
      expect(StatisticsController.elements.disabledSites.textContent).toBe(2)
      expect(StatisticsController.elements.uptime.textContent).toBe('2h 1m')
    })

    test('should update type chart correctly', () => {
      StatisticsController.updateTypeChart()

      const chart = StatisticsController.elements.typeChart
      expect(chart.innerHTML).toContain('Script')
      expect(chart.innerHTML).toContain('Image')
      expect(chart.innerHTML).toContain('Iframe')
      expect(chart.innerHTML).toContain('800')
      expect(chart.innerHTML).toContain('300')
      expect(chart.innerHTML).toContain('134')
    })

    test('should handle empty type chart', () => {
      StatisticsController.data.byType = {}
      StatisticsController.updateTypeChart()

      expect(StatisticsController.elements.typeChart.innerHTML).toContain('No blocked items by type yet')
    })

    test('should update sites table correctly', () => {
      StatisticsController.updateSitesTable()

      const table = StatisticsController.elements.sitesTable
      expect(table.innerHTML).toContain('example.com')
      expect(table.innerHTML).toContain('test.com')
      expect(table.innerHTML).toContain('50')
      expect(table.innerHTML).toContain('25')
    })

    test('should handle empty sites table', () => {
      StatisticsController.data.topSites = []
      StatisticsController.updateSitesTable()

      expect(StatisticsController.elements.sitesTable.innerHTML).toContain('No sites with blocked content yet')
    })

    test('should update activity table correctly', () => {
      StatisticsController.updateActivityTable()

      const table = StatisticsController.elements.activityTable
      expect(table.innerHTML).toContain('example.com')
      expect(table.innerHTML).toContain('Script')
      expect(table.innerHTML).toContain('https://example.com/ad.js')
    })

    test('should handle empty activity table', () => {
      StatisticsController.data.recentBlocked = []
      StatisticsController.updateActivityTable()

      expect(StatisticsController.elements.activityTable.innerHTML).toContain('No recent activity')
    })

    test('should update disabled sites table correctly', () => {
      StatisticsController.updateDisabledSitesTable()

      const table = StatisticsController.elements.disabledSitesTable
      expect(table.innerHTML).toContain('example.com')
      expect(table.innerHTML).toContain('test.com')
      expect(table.innerHTML).toContain('Disabled')
      expect(table.innerHTML).toContain('Enable')
    })

    test('should handle empty disabled sites table', () => {
      StatisticsController.data.disabledSites = []
      StatisticsController.updateDisabledSitesTable()

      expect(StatisticsController.elements.disabledSitesTable.innerHTML).toContain('No disabled sites')
    })

    test('should add animations', () => {
      const mockStatCards = [
        { classList: { add: jest.fn() } },
        { classList: { add: jest.fn() } }
      ]
      const mockSections = [
        { classList: { add: jest.fn() } }
      ]

      document.querySelectorAll = jest.fn((selector) => {
        if (selector === '.stat-card') return mockStatCards
        if (selector === '.section') return mockSections
        return []
      })

      // Mock setTimeout as a jest function
      const setTimeoutSpy = jest.spyOn(global, 'setTimeout')

      StatisticsController.addAnimations()

      // Check that setTimeout was called for animations
      expect(setTimeoutSpy).toHaveBeenCalled()
      
      setTimeoutSpy.mockRestore()
    })
  })

  describe('Data Management', () => {
    beforeEach(() => {
      StatisticsController.cacheElements()
    })

    test('should refresh data successfully', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ total: 200, today: 50 })
      })

      await StatisticsController.refreshData()

      expect(mockElements.refreshBtn.textContent).toBe('🔄 Refresh Data')
      expect(mockElements.refreshBtn.disabled).toBe(false)
      expect(StatisticsController.data.total).toBe(200)
    })

    test('should handle refresh errors', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ error: 'Failed to refresh' })
      })

      await StatisticsController.refreshData()

      expect(console.error).toHaveBeenCalled()
      expect(alert).toHaveBeenCalledWith('Failed to load statistics data')
      expect(mockElements.refreshBtn.disabled).toBe(false)
    })

    test('should export data correctly', () => {
      StatisticsController.data = { total: 100, today: 10 }

      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      }
      document.createElement.mockReturnValue(mockLink)

      StatisticsController.exportData()

      expect(Blob).toHaveBeenCalledWith([JSON.stringify(StatisticsController.data, null, 2)], { type: 'application/json' })
      expect(URL.createObjectURL).toHaveBeenCalled()
      expect(mockLink.download).toContain('uwb-statistics-')
      expect(mockLink.download).toContain('.json')
      expect(mockLink.click).toHaveBeenCalled()
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink)
      expect(document.body.removeChild).toHaveBeenCalledWith(mockLink)
      expect(URL.revokeObjectURL).toHaveBeenCalled()
    })

    test('should handle export errors', () => {
      StatisticsController.data = { total: 100 }
      document.createElement.mockImplementation(() => {
        throw new Error('Document error')
      })

      StatisticsController.exportData()

      expect(console.error).toHaveBeenCalled()
      expect(alert).toHaveBeenCalledWith('Failed to export data')
    })

    test('should reset statistics with confirmation', async () => {
      confirm.mockReturnValue(true)
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'resetStats') {
          callback({ success: true })
        } else if (message.action === 'getDetailedStats') {
          callback({ total: 0 })
        }
      })

      await StatisticsController.resetStatistics()

      expect(confirm).toHaveBeenCalledWith('Are you sure you want to reset all statistics? This action cannot be undone.')
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'resetStats' }, expect.any(Function))
    })

    test('should not reset statistics without confirmation', async () => {
      confirm.mockReturnValue(false)

      await StatisticsController.resetStatistics()

      expect(chrome.runtime.sendMessage).not.toHaveBeenCalledWith({ action: 'resetStats' }, expect.any(Function))
    })

    test('should handle reset errors', async () => {
      confirm.mockReturnValue(true)
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ error: 'Failed to reset' })
      })

      await StatisticsController.resetStatistics()

      expect(console.error).toHaveBeenCalled()
      expect(alert).toHaveBeenCalledWith('Failed to reset statistics')
    })
  })

  describe('Site Management', () => {
    beforeEach(() => {
      StatisticsController.cacheElements()
    })

    test('should enable disabled site', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        if (message.action === 'setSiteStatus') {
          callback({ success: true })
        } else if (message.action === 'getDetailedStats') {
          callback({ total: 100 })
        }
      })

      await StatisticsController.enableSite('example.com')

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'setSiteStatus',
        hostname: 'example.com',
        enabled: true
      }, expect.any(Function))
    })

    test('should handle enable site error', async () => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ error: 'Failed to enable' })
      })

      await StatisticsController.enableSite('example.com')

      expect(console.error).toHaveBeenCalled()
      expect(alert).toHaveBeenCalledWith('Failed to enable example.com')
    })
  })

  describe('Utility Functions', () => {
    test('should format numbers correctly', () => {
      expect(StatisticsController.formatNumber(1234)).toBe('1,234')
      expect(StatisticsController.formatNumber(1000000)).toBe('1,000,000')
      expect(StatisticsController.formatNumber(0)).toBe('0')
    })

    test('should format duration correctly', () => {
      expect(StatisticsController.formatDuration(30)).toBe('30m')
      expect(StatisticsController.formatDuration(90)).toBe('1h 30m')
      expect(StatisticsController.formatDuration(1500)).toBe('1d 1h')
      expect(StatisticsController.formatDuration(0)).toBe('0m')
    })

    test('should capitalize first letter', () => {
      expect(StatisticsController.capitalizeFirst('script')).toBe('Script')
      expect(StatisticsController.capitalizeFirst('image')).toBe('Image')
      expect(StatisticsController.capitalizeFirst('')).toBe('')
      expect(StatisticsController.capitalizeFirst('a')).toBe('A')
    })

    test('should show error messages', () => {
      StatisticsController.showError('Test error')

      expect(console.error).toHaveBeenCalledWith('[UWB Statistics] Error:', 'Test error')
      expect(alert).toHaveBeenCalledWith('Test error')
    })

    test('should show content correctly', () => {
      StatisticsController.cacheElements()
      StatisticsController.showContent()

      expect(StatisticsController.elements.loadingState.style.display).toBe('none')
      expect(StatisticsController.elements.statsContent.style.display).toBe('block')
    })
  })

  describe('Cleanup', () => {
    test('should destroy controller properly', () => {
      StatisticsController.refreshInterval = 123

      StatisticsController.destroy()

      expect(clearInterval).toHaveBeenCalledWith(123)
      expect(StatisticsController.refreshInterval).toBeNull()
      expect(console.log).toHaveBeenCalledWith('[UWB Statistics] Statistics controller destroyed')
    })

    test('should handle destroy with no interval', () => {
      StatisticsController.refreshInterval = null

      StatisticsController.destroy()

      expect(console.log).toHaveBeenCalledWith('[UWB Statistics] Statistics controller destroyed')
    })
  })
})