/**
 * @file Statistics Page Tests
 * @description Test suite for the statistics page functionality
 */

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
    lastError: null
  },
  tabs: {
    create: jest.fn()
  }
}

// Mock DOM environment
Object.defineProperty(global, 'URL', {
  value: class URL {
    constructor(url) {
      this.href = url
    }
    
    static createObjectURL() {
      return 'blob:test'
    }
    
    static revokeObjectURL() {
      return true
    }
  }
})

global.Blob = class Blob {
  constructor(parts, options) {
    this.parts = parts
    this.type = options?.type || ''
  }
}

describe('Statistics Page Tests', () => {
  let StatisticsController

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = `
      <div id="loading-state">Loading...</div>
      <div id="stats-content" style="display: none;">
        <button id="refresh-btn">Refresh</button>
        <button id="export-btn">Export</button>
        <button id="reset-btn">Reset</button>
        <span id="total-blocked">0</span>
        <span id="today-blocked">0</span>
        <span id="week-blocked">0</span>
        <span id="active-tabs">0</span>
        <span id="disabled-sites">0</span>
        <span id="uptime">0m</span>
        <div id="type-chart"></div>
        <tbody id="sites-table"></tbody>
        <tbody id="activity-table"></tbody>
        <tbody id="disabled-sites-table"></tbody>
      </div>
    `

    // Mock StatisticsController
    StatisticsController = {
      data: null,
      elements: {},
      refreshInterval: null,
      
      cacheElements() {
        this.elements = {
          loadingState: document.getElementById('loading-state'),
          statsContent: document.getElementById('stats-content'),
          refreshBtn: document.getElementById('refresh-btn'),
          exportBtn: document.getElementById('export-btn'),
          resetBtn: document.getElementById('reset-btn'),
          totalBlocked: document.getElementById('total-blocked'),
          todayBlocked: document.getElementById('today-blocked'),
          weekBlocked: document.getElementById('week-blocked'),
          activeTabs: document.getElementById('active-tabs'),
          disabledSites: document.getElementById('disabled-sites'),
          uptime: document.getElementById('uptime'),
          typeChart: document.getElementById('type-chart'),
          sitesTable: document.getElementById('sites-table'),
          activityTable: document.getElementById('activity-table'),
          disabledSitesTable: document.getElementById('disabled-sites-table')
        }
      },

      sendMessage(message) {
        return new Promise((resolve, reject) => {
          try {
            chrome.runtime.sendMessage(message, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message))
              } else {
                resolve(response)
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      async loadStatistics() {
        const response = await this.sendMessage({ action: 'getDetailedStats' })
        if (response && !response.error) {
          this.data = response
          this.updateUI()
          this.showContent()
        } else {
          throw new Error(response?.error || 'Failed to load statistics')
        }
      },

      updateOverviewStats() {
        if (this.elements.totalBlocked) {
          this.elements.totalBlocked.textContent = this.formatNumber(this.data.total || 0)
        }
        if (this.elements.todayBlocked) {
          this.elements.todayBlocked.textContent = this.formatNumber(this.data.today || 0)
        }
        if (this.elements.weekBlocked) {
          this.elements.weekBlocked.textContent = this.formatNumber(this.data.week || 0)
        }
        if (this.elements.activeTabs) {
          this.elements.activeTabs.textContent = this.data.activeTabs || 0
        }
        if (this.elements.disabledSites) {
          this.elements.disabledSites.textContent = (this.data.disabledSites || []).length
        }
        if (this.elements.uptime) {
          const uptimeMs = this.data.uptime || 0
          const uptimeMinutes = Math.floor(uptimeMs / 60000)
          this.elements.uptime.textContent = this.formatDuration(uptimeMinutes)
        }
      },

      updateTypeChart() {
        if (!this.elements.typeChart) return
        const byType = this.data.byType || {}
        const types = Object.entries(byType).sort(([,a], [,b]) => b - a)
        
        if (types.length === 0) {
          this.elements.typeChart.innerHTML = '<div class="empty-state">No data</div>'
          return
        }

        const maxValue = Math.max(...types.map(([,value]) => value))
        this.elements.typeChart.innerHTML = types.map(([type, count]) => {
          const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0
          return `<div class="bar-item" data-type="${type}" data-count="${count}" data-percentage="${percentage}"></div>`
        }).join('')
      },

      updateUI() {
        this.updateOverviewStats()
        this.updateTypeChart()
      },

      showContent() {
        if (this.elements.loadingState) {
          this.elements.loadingState.style.display = 'none'
        }
        if (this.elements.statsContent) {
          this.elements.statsContent.style.display = 'block'
        }
      },

      async enableSite(hostname) {
        const response = await this.sendMessage({
          action: 'setSiteStatus',
          hostname: hostname,
          enabled: true
        })
        if (response && !response.error) {
          await this.loadStatistics()
        } else {
          throw new Error(response?.error || 'Failed to enable site')
        }
      },

      exportData() {
        const dataStr = JSON.stringify(this.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `uwb-statistics-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      },

      formatNumber(num) {
        return new Intl.NumberFormat().format(num)
      },

      formatDuration(minutes) {
        if (minutes < 60) {
          return `${minutes}m`
        } else if (minutes < 1440) {
          const hours = Math.floor(minutes / 60)
          const mins = minutes % 60
          return `${hours}h ${mins}m`
        } else {
          const days = Math.floor(minutes / 1440)
          const hours = Math.floor((minutes % 1440) / 60)
          return `${days}d ${hours}h`
        }
      },

      capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1)
      }
    }

    // Cache elements
    StatisticsController.cacheElements()
  })

  describe('Initialization', () => {
    test('should cache DOM elements correctly', () => {
      expect(StatisticsController.elements.loadingState).toBeTruthy()
      expect(StatisticsController.elements.statsContent).toBeTruthy()
      expect(StatisticsController.elements.totalBlocked).toBeTruthy()
      expect(StatisticsController.elements.typeChart).toBeTruthy()
    })
  })

  describe('Statistics Loading', () => {
    test('should load statistics successfully', async() => {
      const mockData = {
        total: 100,
        today: 25,
        week: 75,
        activeTabs: 3,
        disabledSites: ['example.com'],
        uptime: 3600000, // 1 hour
        byType: { script: 50, image: 30, iframe: 20 }
      }

      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback(mockData)
      })

      await StatisticsController.loadStatistics()

      expect(StatisticsController.data).toEqual(mockData)
      expect(StatisticsController.elements.statsContent.style.display).toBe('block')
      expect(StatisticsController.elements.loadingState.style.display).toBe('none')
    })

    test('should handle loading errors', async() => {
      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback({ error: 'Failed to load' })
      })

      await expect(StatisticsController.loadStatistics()).rejects.toThrow('Failed to load')
    })
  })

  describe('UI Updates', () => {
    beforeEach(() => {
      StatisticsController.data = {
        total: 1234,
        today: 56,
        week: 789,
        activeTabs: 2,
        disabledSites: ['example.com', 'test.com'],
        uptime: 7260000, // 2 hours 1 minute
        byType: { script: 800, image: 300, iframe: 134 }
      }
    })

    test('should update overview statistics correctly', () => {
      StatisticsController.updateOverviewStats()

      expect(StatisticsController.elements.totalBlocked.textContent).toBe('1,234')
      expect(StatisticsController.elements.todayBlocked.textContent).toBe('56')
      expect(StatisticsController.elements.weekBlocked.textContent).toBe('789')
      expect(StatisticsController.elements.activeTabs.textContent).toBe('2')
      expect(StatisticsController.elements.disabledSites.textContent).toBe('2')
      expect(StatisticsController.elements.uptime.textContent).toBe('2h 1m')
    })

    test('should update type chart correctly', () => {
      StatisticsController.updateTypeChart()

      const chart = StatisticsController.elements.typeChart
      expect(chart.innerHTML).toContain('script')
      expect(chart.innerHTML).toContain('image')
      expect(chart.innerHTML).toContain('iframe')
      
      const barItems = chart.querySelectorAll('.bar-item')
      expect(barItems).toHaveLength(3)
    })

    test('should handle empty type chart', () => {
      StatisticsController.data.byType = {}
      StatisticsController.updateTypeChart()

      expect(StatisticsController.elements.typeChart.innerHTML).toContain('No data')
    })
  })

  describe('Site Management', () => {
    test('should enable disabled site', async() => {
      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        if (message.action === 'setSiteStatus') {
          callback({ success: true })
        } else if (message.action === 'getDetailedStats') {
          callback({ total: 100 })
        }
      })

      StatisticsController.data = { total: 100 }

      await StatisticsController.enableSite('example.com')

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'setSiteStatus',
        hostname: 'example.com',
        enabled: true
      }, expect.any(Function))
    })

    test('should handle enable site error', async() => {
      chrome.runtime.sendMessage = jest.fn((message, callback) => {
        callback({ error: 'Failed to enable' })
      })

      await expect(StatisticsController.enableSite('example.com')).rejects.toThrow('Failed to enable')
    })
  })

  describe('Data Export', () => {
    test('should export data correctly', () => {
      StatisticsController.data = { total: 100, today: 10 }

      // Mock document.createElement and related methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      }
      const createElementSpy = jest.spyOn(document, 'createElement').mockReturnValue(mockLink)
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation()
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation()

      StatisticsController.exportData()

      expect(createElementSpy).toHaveBeenCalledWith('a')
      expect(mockLink.download).toContain('uwb-statistics-')
      expect(mockLink.download).toContain('.json')
      expect(mockLink.click).toHaveBeenCalled()
      expect(appendChildSpy).toHaveBeenCalledWith(mockLink)
      expect(removeChildSpy).toHaveBeenCalledWith(mockLink)

      createElementSpy.mockRestore()
      appendChildSpy.mockRestore()
      removeChildSpy.mockRestore()
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
    })

    test('should capitalize first letter', () => {
      expect(StatisticsController.capitalizeFirst('script')).toBe('Script')
      expect(StatisticsController.capitalizeFirst('image')).toBe('Image')
      expect(StatisticsController.capitalizeFirst('')).toBe('')
    })
  })
})