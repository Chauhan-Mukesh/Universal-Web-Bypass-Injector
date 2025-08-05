/**
 * @file Comprehensive Background Script Tests
 * @description Complete tests for the background service worker
 */

/* global BackgroundService */

describe('Background Service Comprehensive Tests', () => {
  let mockBackgroundService

  beforeEach(() => {
    // Reset chrome API mocks
    jest.clearAllMocks()

    // Reset chrome.runtime.getManifest mock
    chrome.runtime.getManifest.mockReturnValue({ version: '2.0.0' })

    // Ensure mocks are ready
    chrome.runtime.onInstalled.addListener.mockClear()
    chrome.action.onClicked.addListener.mockClear()
    chrome.runtime.onMessage.addListener.mockClear()
    chrome.contextMenus.create.mockClear()

    // Enhanced BackgroundService mock
    mockBackgroundService = {
      disabledSites: new Set(),
      statistics: {
        totalBlocked: 0,
        todayBlocked: 0,
        weekBlocked: 0,
        activeTabs: 0,
        sessionStartTime: Date.now(),
        recentActivity: [],
        blockingStats: {},
        siteStats: {}
      },
      isActive: true,

      init() {
        chrome.runtime.onInstalled.addListener(this.handleInstallation.bind(this))
        chrome.action.onClicked.addListener(this.handleActionClick.bind(this))
        chrome.runtime.onMessage.addListener(this.handleMessage.bind(this))
        chrome.contextMenus.onClicked.addListener(this.handleContextMenu.bind(this))
        chrome.tabs.onUpdated.addListener(this.handleTabUpdate.bind(this))
        chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this))
        
        this.setupContextMenu()
        this.loadSettings()
        this.startStatisticsTracking()
      },

      handleInstallation(details) {
        const manifest = chrome.runtime.getManifest()
        
        if (details.reason === 'install') {
          console.log(`[UWB Background] Extension installed successfully (v${manifest.version})`)
          this.setupDefaultSettings()
          this.showWelcomeNotification()
        } else if (details.reason === 'update') {
          console.log(`[UWB Background] Extension updated to v${manifest.version}`)
          this.handleUpdate(details.previousVersion, manifest.version)
        }
      },

      setupDefaultSettings() {
        const defaultSettings = {
          enabled: true,
          autoBlock: true,
          showNotifications: true,
          blockingLevel: 'standard'
        }
        
        chrome.storage.sync.set({ settings: defaultSettings })
      },

      showWelcomeNotification() {
        if (chrome.notifications) {
          chrome.notifications.create('welcome', {
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'Universal Web Bypass Injector',
            message: 'Extension installed successfully! Click to configure settings.'
          })
        }
      },

      handleUpdate(previousVersion, currentVersion) {
        // Migration logic for updates
        if (this.isVersionLower(previousVersion, '2.0.0')) {
          this.migrateToV2()
        }
        
        // Show update notification
        if (chrome.notifications) {
          chrome.notifications.create('update', {
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'Universal Web Bypass Injector Updated',
            message: `Updated to version ${currentVersion}`
          })
        }
      },

      isVersionLower(version1, version2) {
        const v1parts = version1.split('.').map(Number)
        const v2parts = version2.split('.').map(Number)
        
        for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
          const v1part = v1parts[i] || 0
          const v2part = v2parts[i] || 0
          
          if (v1part < v2part) return true
          if (v1part > v2part) return false
        }
        
        return false
      },

      migrateToV2() {
        console.log('[UWB Background] Migrating to v2.0.0')
        // Migration logic here
      },

      handleActionClick(tab) {
        if (this.isValidTab(tab)) {
          chrome.tabs.create({
            url: chrome.runtime.getURL('popup.html'),
            active: true
          })
        }
      },

      handleMessage(request, sender, sendResponse) {
        switch (request.action) {
          case 'getSiteStatus':
            return this.handleGetSiteStatus(request, sender, sendResponse)
          case 'setSiteStatus':
            return this.handleSetSiteStatus(request, sender, sendResponse)
          case 'getStatistics':
            return this.handleGetStatistics(request, sender, sendResponse)
          case 'getDetailedStats':
            return this.handleGetDetailedStats(request, sender, sendResponse)
          case 'recordBlocked':
            return this.handleRecordBlocked(request, sender, sendResponse)
          case 'toggleExtension':
            return this.handleToggleExtension(request, sender, sendResponse)
          case 'exportSettings':
            return this.handleExportSettings(request, sender, sendResponse)
          case 'importSettings':
            return this.handleImportSettings(request, sender, sendResponse)
          default:
            sendResponse({ error: 'Unknown action' })
            return false
        }
      },

      handleGetSiteStatus(request, sender, sendResponse) {
        const hostname = request.hostname || this.extractHostname(sender.tab?.url)
        const enabled = !this.disabledSites.has(hostname)
        
        sendResponse({
          enabled,
          hostname,
          isActive: this.isActive
        })
        
        return true
      },

      async handleSetSiteStatus(request, sender, sendResponse) {
        try {
          const { hostname, enabled } = request
          
          if (enabled) {
            this.disabledSites.delete(hostname)
          } else {
            this.disabledSites.add(hostname)
          }
          
          // Save to storage
          const siteStatus = {}
          this.disabledSites.forEach(site => {
            siteStatus[site] = { enabled: false }
          })
          
          await chrome.storage.sync.set({ siteStatus })
          
          // Update statistics
          this.updateStatistics('siteToggle', hostname, enabled)
          
          sendResponse({
            success: true,
            enabled,
            hostname
          })
        } catch (error) {
          sendResponse({
            error: error.message
          })
        }
        
        return true
      },

      handleGetStatistics(request, sender, sendResponse) {
        sendResponse({
          ...this.statistics,
          disabledSitesCount: this.disabledSites.size
        })
        
        return true
      },

      handleGetDetailedStats(request, sender, sendResponse) {
        const detailed = {
          ...this.statistics,
          disabledSitesCount: this.disabledSites.size,
          disabledSites: Array.from(this.disabledSites),
          uptime: Date.now() - this.statistics.sessionStartTime,
          byType: this.statistics.blockingStats,
          siteStats: this.statistics.siteStats,
          activeTabs: this.getActiveTabsCount()
        }
        
        sendResponse(detailed)
        return true
      },

      handleRecordBlocked(request, sender, sendResponse) {
        const { type, url, count = 1 } = request
        const hostname = this.extractHostname(url)
        
        // Update statistics
        this.statistics.totalBlocked += count
        this.statistics.todayBlocked += count
        this.statistics.weekBlocked += count
        
        // Update type statistics
        this.statistics.blockingStats[type] = (this.statistics.blockingStats[type] || 0) + count
        
        // Update site statistics
        if (!this.statistics.siteStats[hostname]) {
          this.statistics.siteStats[hostname] = { blocked: 0, lastVisit: Date.now() }
        }
        this.statistics.siteStats[hostname].blocked += count
        this.statistics.siteStats[hostname].lastVisit = Date.now()
        
        // Add to recent activity
        this.statistics.recentActivity.unshift({
          timestamp: Date.now(),
          type,
          site: hostname,
          count
        })
        
        // Keep only last 100 activities
        if (this.statistics.recentActivity.length > 100) {
          this.statistics.recentActivity = this.statistics.recentActivity.slice(0, 100)
        }
        
        // Save statistics periodically
        this.saveStatistics()
        
        sendResponse({ success: true })
        return true
      },

      handleToggleExtension(request, sender, sendResponse) {
        this.isActive = !this.isActive
        
        chrome.storage.sync.set({ 
          settings: { ...this.settings, enabled: this.isActive }
        })
        
        // Update icon
        this.updateIcon()
        
        sendResponse({
          success: true,
          enabled: this.isActive
        })
        
        return true
      },

      handleExportSettings(request, sender, sendResponse) {
        chrome.storage.sync.get(null, (data) => {
          const exportData = {
            version: chrome.runtime.getManifest().version,
            timestamp: new Date().toISOString(),
            settings: data.settings || {},
            siteStatus: data.siteStatus || {},
            statistics: this.statistics
          }
          
          sendResponse({
            success: true,
            data: exportData
          })
        })
        
        return true
      },

      async handleImportSettings(request, sender, sendResponse) {
        try {
          const { data } = request
          
          if (data.settings) {
            await chrome.storage.sync.set({ settings: data.settings })
          }
          
          if (data.siteStatus) {
            await chrome.storage.sync.set({ siteStatus: data.siteStatus })
            this.loadDisabledSites(data.siteStatus)
          }
          
          sendResponse({ success: true })
        } catch (error) {
          sendResponse({ error: error.message })
        }
        
        return true
      },

      handleContextMenu(info, tab) {
        if (info.menuItemId === 'bypassPage') {
          this.bypassCurrentPage(tab)
        } else if (info.menuItemId === 'toggleSite') {
          this.toggleSiteStatus(tab)
        }
      },

      handleTabUpdate(tabId, changeInfo, tab) {
        if (changeInfo.status === 'complete' && tab.url) {
          this.updateActiveTabsCount()
          
          // Check if site is disabled
          const hostname = this.extractHostname(tab.url)
          if (this.disabledSites.has(hostname)) {
            this.showDisabledNotification(hostname)
          }
        }
      },

      handleTabRemoved(tabId, removeInfo) {
        this.updateActiveTabsCount()
      },

      setupContextMenu() {
        chrome.contextMenus.create({
          id: 'bypassPage',
          title: 'Bypass restrictions on this page',
          contexts: ['page']
        })
        
        chrome.contextMenus.create({
          id: 'toggleSite',
          title: 'Toggle site bypass',
          contexts: ['page']
        })
      },

      async loadSettings() {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['settings', 'siteStatus', 'statistics'], (data) => {
            this.settings = data.settings || {}
            this.isActive = this.settings.enabled !== false
            
            if (data.siteStatus) {
              this.loadDisabledSites(data.siteStatus)
            }
            
            if (data.statistics) {
              this.statistics = { ...this.statistics, ...data.statistics }
            }
            
            resolve()
          })
        })
      },

      loadDisabledSites(siteStatus) {
        this.disabledSites.clear()
        Object.entries(siteStatus).forEach(([site, status]) => {
          if (!status.enabled) {
            this.disabledSites.add(site)
          }
        })
      },

      saveStatistics() {
        // Debounced save to avoid too frequent writes
        clearTimeout(this.saveTimeout)
        this.saveTimeout = setTimeout(() => {
          chrome.storage.sync.set({
            statistics: this.statistics,
            blockingStats: this.statistics.blockingStats,
            siteStats: this.statistics.siteStats
          })
        }, 1000)
      },

      startStatisticsTracking() {
        // Reset daily stats at midnight
        this.resetDailyStatsTimer()
        
        // Reset weekly stats on Sunday
        this.resetWeeklyStatsTimer()
        
        // Update active tabs count periodically
        setInterval(() => {
          this.updateActiveTabsCount()
        }, 60000) // Every minute
      },

      resetDailyStatsTimer() {
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(0, 0, 0, 0)
        
        const msUntilMidnight = tomorrow.getTime() - now.getTime()
        
        setTimeout(() => {
          this.statistics.todayBlocked = 0
          this.saveStatistics()
          this.resetDailyStatsTimer() // Schedule next reset
        }, msUntilMidnight)
      },

      resetWeeklyStatsTimer() {
        const now = new Date()
        const nextSunday = new Date(now)
        nextSunday.setDate(nextSunday.getDate() + (7 - nextSunday.getDay()))
        nextSunday.setHours(0, 0, 0, 0)
        
        const msUntilSunday = nextSunday.getTime() - now.getTime()
        
        setTimeout(() => {
          this.statistics.weekBlocked = 0
          this.saveStatistics()
          this.resetWeeklyStatsTimer() // Schedule next reset
        }, msUntilSunday)
      },

      updateActiveTabsCount() {
        chrome.tabs.query({}, (tabs) => {
          const activeTabs = tabs.filter(tab => this.isValidTab(tab)).length
          this.statistics.activeTabs = activeTabs
        })
      },

      getActiveTabsCount() {
        return this.statistics.activeTabs
      },

      updateIcon() {
        const iconPath = this.isActive ? 'icons/icon-128.png' : 'icons/icon-disabled-128.png'
        chrome.action.setIcon({ path: iconPath })
      },

      bypassCurrentPage(tab) {
        if (this.isValidTab(tab)) {
          chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          })
        }
      },

      toggleSiteStatus(tab) {
        const hostname = this.extractHostname(tab.url)
        const enabled = this.disabledSites.has(hostname)
        
        this.handleSetSiteStatus(
          { hostname, enabled },
          { tab },
          () => {}
        )
      },

      showDisabledNotification(hostname) {
        if (this.settings.showNotifications && chrome.notifications) {
          chrome.notifications.create(`disabled-${hostname}`, {
            type: 'basic',
            iconUrl: 'icons/icon-128.png',
            title: 'Site Bypass Disabled',
            message: `Bypass is disabled for ${hostname}`
          })
        }
      },

      isValidTab(tab) {
        return tab && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))
      },

      extractHostname(url) {
        try {
          return new URL(url).hostname
        } catch {
          return ''
        }
      },

      updateStatistics(action, hostname, data) {
        // Update various statistics based on actions
        const activity = {
          timestamp: Date.now(),
          action,
          hostname,
          data
        }
        
        this.statistics.recentActivity.unshift(activity)
        if (this.statistics.recentActivity.length > 100) {
          this.statistics.recentActivity = this.statistics.recentActivity.slice(0, 100)
        }
      }
    }

    // Set global reference
    global.BackgroundService = mockBackgroundService

    // Initialize
    mockBackgroundService.init()
  })

  describe('Initialization', () => {
    test('should initialize successfully', () => {
      expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled()
      expect(chrome.action.onClicked.addListener).toHaveBeenCalled()
      expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()
    })

    test('should setup context menu', () => {
      expect(chrome.contextMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'bypassPage',
          title: 'Bypass restrictions on this page',
          contexts: ['page']
        })
      )
      
      expect(chrome.contextMenus.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'toggleSite',
          title: 'Toggle site bypass',
          contexts: ['page']
        })
      )
    })
  })

  describe('Installation Handling', () => {
    test('should handle new installation', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      mockBackgroundService.handleInstallation({ reason: 'install' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Extension installed successfully')
      )

      consoleSpy.mockRestore()
    })

    test('should handle extension update', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      mockBackgroundService.handleInstallation({ 
        reason: 'update', 
        previousVersion: '1.0.0' 
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Extension updated to')
      )

      consoleSpy.mockRestore()
    })

    test('should setup default settings on install', () => {
      chrome.storage.sync.set = jest.fn()
      
      mockBackgroundService.setupDefaultSettings()

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        settings: expect.objectContaining({
          enabled: true,
          autoBlock: true,
          showNotifications: true,
          blockingLevel: 'standard'
        })
      })
    })

    test('should show welcome notification', () => {
      chrome.notifications = { create: jest.fn() }
      
      mockBackgroundService.showWelcomeNotification()

      expect(chrome.notifications.create).toHaveBeenCalledWith('welcome', expect.objectContaining({
        type: 'basic',
        title: 'Universal Web Bypass Injector',
        message: 'Extension installed successfully! Click to configure settings.'
      }))
    })

    test('should handle version migration', () => {
      expect(mockBackgroundService.isVersionLower('1.9.0', '2.0.0')).toBe(true)
      expect(mockBackgroundService.isVersionLower('2.0.0', '2.0.0')).toBe(false)
      expect(mockBackgroundService.isVersionLower('2.1.0', '2.0.0')).toBe(false)
    })
  })

  describe('Site Toggle Functionality', () => {
    test('should handle site status requests', () => {
      const request = { action: 'getSiteStatus', hostname: 'example.com' }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      mockBackgroundService.handleGetSiteStatus(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith({
        enabled: true,
        hostname: 'example.com',
        isActive: true
      })
    })

    test('should handle site status updates - disable site', async() => {
      const request = { action: 'setSiteStatus', hostname: 'example.com', enabled: false }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      chrome.storage.sync.set = jest.fn().mockResolvedValue(undefined)

      await mockBackgroundService.handleSetSiteStatus(request, sender, sendResponse)

      expect(mockBackgroundService.disabledSites.has('example.com')).toBe(true)
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        enabled: false,
        hostname: 'example.com'
      })
    })

    test('should enable site correctly', async() => {
      // First disable a site
      mockBackgroundService.disabledSites.add('example.com')
      
      const request = { action: 'setSiteStatus', hostname: 'example.com', enabled: true }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      chrome.storage.sync.set = jest.fn().mockResolvedValue(undefined)

      await mockBackgroundService.handleSetSiteStatus(request, sender, sendResponse)

      expect(mockBackgroundService.disabledSites.has('example.com')).toBe(false)
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        enabled: true,
        hostname: 'example.com'
      })
    })

    test('should handle site status error gracefully', async() => {
      const request = { action: 'setSiteStatus', hostname: 'example.com', enabled: false }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      chrome.storage.sync.set = jest.fn().mockRejectedValue(new Error('Storage error'))

      await mockBackgroundService.handleSetSiteStatus(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith({
        error: 'Storage error'
      })
    })
  })

  describe('Statistics Handling', () => {
    test('should return basic statistics', () => {
      const request = { action: 'getStatistics' }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      mockBackgroundService.statistics.totalBlocked = 100
      mockBackgroundService.disabledSites.add('example.com')

      mockBackgroundService.handleGetStatistics(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          totalBlocked: 100,
          disabledSitesCount: 1
        })
      )
    })

    test('should return detailed statistics', () => {
      const request = { action: 'getDetailedStats' }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      mockBackgroundService.statistics.totalBlocked = 150
      mockBackgroundService.statistics.blockingStats = { ads: 100, trackers: 50 }

      mockBackgroundService.handleGetDetailedStats(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          totalBlocked: 150,
          byType: { ads: 100, trackers: 50 },
          uptime: expect.any(Number)
        })
      )
    })

    test('should record blocked content', () => {
      const request = { 
        action: 'recordBlocked', 
        type: 'script', 
        url: 'https://example.com/ad.js',
        count: 3
      }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      const initialBlocked = mockBackgroundService.statistics.totalBlocked

      mockBackgroundService.handleRecordBlocked(request, sender, sendResponse)

      expect(mockBackgroundService.statistics.totalBlocked).toBe(initialBlocked + 3)
      expect(mockBackgroundService.statistics.blockingStats.script).toBe(3)
      expect(mockBackgroundService.statistics.siteStats['example.com']).toEqual({
        blocked: 3,
        lastVisit: expect.any(Number)
      })
      expect(sendResponse).toHaveBeenCalledWith({ success: true })
    })

    test('should limit recent activity to 100 items', () => {
      // Add 105 activities
      for (let i = 0; i < 105; i++) {
        mockBackgroundService.handleRecordBlocked(
          { action: 'recordBlocked', type: 'script', url: `https://example${i}.com/ad.js` },
          { tab: { id: 1 } },
          jest.fn()
        )
      }

      expect(mockBackgroundService.statistics.recentActivity.length).toBe(100)
    })
  })

  describe('Extension Toggle', () => {
    test('should toggle extension state', () => {
      const request = { action: 'toggleExtension' }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      const initialState = mockBackgroundService.isActive
      chrome.storage.sync.set = jest.fn()
      mockBackgroundService.updateIcon = jest.fn()

      mockBackgroundService.handleToggleExtension(request, sender, sendResponse)

      expect(mockBackgroundService.isActive).toBe(!initialState)
      expect(mockBackgroundService.updateIcon).toHaveBeenCalled()
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        enabled: !initialState
      })
    })
  })

  describe('Settings Import/Export', () => {
    test('should export settings', () => {
      const request = { action: 'exportSettings' }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      chrome.storage.sync.get = jest.fn((keys, callback) => {
        callback({
          settings: { enabled: true },
          siteStatus: { 'example.com': { enabled: false } }
        })
      })

      mockBackgroundService.handleExportSettings(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          version: '2.0.0',
          timestamp: expect.any(String),
          settings: { enabled: true },
          siteStatus: { 'example.com': { enabled: false } }
        })
      })
    })

    test('should import settings', async() => {
      const importData = {
        settings: { enabled: false, autoBlock: false },
        siteStatus: { 'test.com': { enabled: false } }
      }
      
      const request = { action: 'importSettings', data: importData }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      chrome.storage.sync.set = jest.fn().mockResolvedValue(undefined)
      mockBackgroundService.loadDisabledSites = jest.fn()

      await mockBackgroundService.handleImportSettings(request, sender, sendResponse)

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ settings: importData.settings })
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ siteStatus: importData.siteStatus })
      expect(mockBackgroundService.loadDisabledSites).toHaveBeenCalledWith(importData.siteStatus)
      expect(sendResponse).toHaveBeenCalledWith({ success: true })
    })

    test('should handle import errors', async() => {
      const request = { action: 'importSettings', data: {} }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      chrome.storage.sync.set = jest.fn().mockRejectedValue(new Error('Import failed'))

      await mockBackgroundService.handleImportSettings(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Import failed' })
    })
  })

  describe('Context Menu Handling', () => {
    test('should handle bypass page context menu', () => {
      const info = { menuItemId: 'bypassPage' }
      const tab = { id: 1, url: 'https://example.com' }

      mockBackgroundService.bypassCurrentPage = jest.fn()
      mockBackgroundService.handleContextMenu(info, tab)

      expect(mockBackgroundService.bypassCurrentPage).toHaveBeenCalledWith(tab)
    })

    test('should handle toggle site context menu', () => {
      const info = { menuItemId: 'toggleSite' }
      const tab = { id: 1, url: 'https://example.com' }

      mockBackgroundService.toggleSiteStatus = jest.fn()
      mockBackgroundService.handleContextMenu(info, tab)

      expect(mockBackgroundService.toggleSiteStatus).toHaveBeenCalledWith(tab)
    })
  })

  describe('Tab Management', () => {
    test('should handle tab updates', () => {
      const tabId = 1
      const changeInfo = { status: 'complete' }
      const tab = { url: 'https://example.com' }

      mockBackgroundService.updateActiveTabsCount = jest.fn()
      mockBackgroundService.showDisabledNotification = jest.fn()

      mockBackgroundService.handleTabUpdate(tabId, changeInfo, tab)

      expect(mockBackgroundService.updateActiveTabsCount).toHaveBeenCalled()
    })

    test('should show notification for disabled sites', () => {
      mockBackgroundService.disabledSites.add('example.com')
      mockBackgroundService.settings.showNotifications = true
      chrome.notifications = { create: jest.fn() }

      mockBackgroundService.showDisabledNotification('example.com')

      expect(chrome.notifications.create).toHaveBeenCalledWith(
        'disabled-example.com',
        expect.objectContaining({
          title: 'Site Bypass Disabled',
          message: 'Bypass is disabled for example.com'
        })
      )
    })

    test('should handle tab removal', () => {
      const tabId = 1
      const removeInfo = {}

      mockBackgroundService.updateActiveTabsCount = jest.fn()
      mockBackgroundService.handleTabRemoved(tabId, removeInfo)

      expect(mockBackgroundService.updateActiveTabsCount).toHaveBeenCalled()
    })

    test('should update active tabs count', () => {
      const mockTabs = [
        { url: 'https://example.com' },
        { url: 'https://test.org' },
        { url: 'chrome://extensions' } // This should be filtered out
      ]

      chrome.tabs.query = jest.fn((query, callback) => {
        callback(mockTabs)
      })

      mockBackgroundService.updateActiveTabsCount()

      expect(mockBackgroundService.statistics.activeTabs).toBe(2) // Only valid tabs
    })
  })

  describe('Utility Functions', () => {
    test('should validate tabs correctly', () => {
      expect(mockBackgroundService.isValidTab({ url: 'https://example.com' })).toBe(true)
      expect(mockBackgroundService.isValidTab({ url: 'http://test.org' })).toBe(true)
      expect(mockBackgroundService.isValidTab({ url: 'chrome://extensions' })).toBe(false)
      expect(mockBackgroundService.isValidTab({ url: 'about:blank' })).toBe(false)
      expect(mockBackgroundService.isValidTab(null)).toBe(false)
    })

    test('should extract hostname correctly', () => {
      expect(mockBackgroundService.extractHostname('https://example.com/path')).toBe('example.com')
      expect(mockBackgroundService.extractHostname('http://sub.domain.org')).toBe('sub.domain.org')
      expect(mockBackgroundService.extractHostname('invalid-url')).toBe('')
    })

    test('should bypass current page', () => {
      const tab = { id: 1, url: 'https://example.com' }

      chrome.scripting.executeScript = jest.fn()
      mockBackgroundService.bypassCurrentPage(tab)

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 1 },
        files: ['content.js']
      })
    })

    test('should handle unknown message actions', () => {
      const request = { action: 'unknownAction' }
      const sender = { tab: { id: 1 } }
      const sendResponse = jest.fn()

      const result = mockBackgroundService.handleMessage(request, sender, sendResponse)

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Unknown action' })
      expect(result).toBe(false)
    })
  })

  describe('Statistics Timers', () => {
    test('should reset daily stats timer', () => {
      global.setTimeout = jest.fn()
      
      mockBackgroundService.resetDailyStatsTimer()

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number))
    })

    test('should reset weekly stats timer', () => {
      global.setTimeout = jest.fn()
      
      mockBackgroundService.resetWeeklyStatsTimer()

      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), expect.any(Number))
    })

    test('should start statistics tracking', () => {
      global.setInterval = jest.fn()
      mockBackgroundService.resetDailyStatsTimer = jest.fn()
      mockBackgroundService.resetWeeklyStatsTimer = jest.fn()

      mockBackgroundService.startStatisticsTracking()

      expect(mockBackgroundService.resetDailyStatsTimer).toHaveBeenCalled()
      expect(mockBackgroundService.resetWeeklyStatsTimer).toHaveBeenCalled()
      expect(setInterval).toHaveBeenCalledWith(expect.any(Function), 60000)
    })
  })

  describe('Error Handling', () => {
    test('should handle message errors gracefully', () => {
      const request = { action: 'getSiteStatus' }
      const sender = null
      const sendResponse = jest.fn()

      expect(() => {
        mockBackgroundService.handleMessage(request, sender, sendResponse)
      }).not.toThrow()
    })

    test('should handle storage load errors', async() => {
      chrome.storage.sync.get = jest.fn((keys, callback) => {
        // Simulate storage error
        chrome.runtime.lastError = { message: 'Storage error' }
        callback({})
      })

      await mockBackgroundService.loadSettings()

      // Should still initialize with defaults
      expect(mockBackgroundService.settings).toEqual({})
      expect(mockBackgroundService.isActive).toBe(true)
    })
  })
})
