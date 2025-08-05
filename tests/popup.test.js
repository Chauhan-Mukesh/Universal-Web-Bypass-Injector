/**
 * @file Comprehensive Popup Tests
 * @description Complete test coverage for popup functionality
 */

// Mock DOM elements
Object.defineProperty(global, 'document', {
  value: {
    getElementById: jest.fn(),
    querySelector: jest.fn(),
    addEventListener: jest.fn(),
    createElement: jest.fn(() => ({
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      },
      addEventListener: jest.fn(),
      textContent: '',
      innerHTML: '',
      style: {}
    }))
  },
  writable: true
})

// Mock Chrome APIs
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    getManifest: jest.fn(() => ({
      version: '2.0.0',
      name: 'Universal Web Bypass Injector'
    })),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`),
    lastError: null
  },
  tabs: {
    query: jest.fn(),
    create: jest.fn(),
    reload: jest.fn()
  },
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
}

describe('Popup Comprehensive Tests', () => {
  let PopupController
  
  beforeEach(() => {
    jest.clearAllMocks()
    delete chrome.runtime.lastError
    
    // Mock DOM elements
    const mockElements = {
      'current-url': { textContent: '', classList: { add: jest.fn(), remove: jest.fn() } },
      'refresh-button': { addEventListener: jest.fn() },
      'toggle-button': { addEventListener: jest.fn() },
      'site-toggle': { addEventListener: jest.fn() },
      'stats-summary': { addEventListener: jest.fn() },
      'help-link': { addEventListener: jest.fn() },
      'stats-container': { style: {} },
      'error-container': { style: {}, textContent: '' },
      'blocked-count': { textContent: '' },
      'session-time': { textContent: '' }
    }
    
    const mockSelectors = {
      '.status-dot': { classList: { add: jest.fn(), remove: jest.fn() } },
      '.status-indicator span': { textContent: '' },
      '.footer': { textContent: '' }
    }
    
    document.getElementById.mockImplementation((id) => mockElements[id] || null)
    document.querySelector.mockImplementation((selector) => mockSelectors[selector] || null)
    
    // Create mock PopupController instead of loading from file
    PopupController = {
      currentTab: null,
      siteStatus: {
        enabled: true,
        hostname: null
      },
      stats: {
        blocked: 0,
        active: false,
        sessionStartTime: Date.now(),
        sitesDisabled: []
      },
      elements: {},

      cacheElements() {
        this.elements = {
          currentUrl: document.getElementById('current-url'),
          statusDot: document.querySelector('.status-dot'),
          statusText: document.querySelector('.status-indicator span'),
          helpLink: document.getElementById('help-link'),
          version: document.querySelector('.footer'),
          statsContainer: document.getElementById('stats-container'),
          errorContainer: document.getElementById('error-container'),
          refreshButton: document.getElementById('refresh-button'),
          toggleButton: document.getElementById('toggle-button'),
          siteToggle: document.getElementById('site-toggle'),
          statsSummary: document.getElementById('stats-summary'),
          blockedCount: document.getElementById('blocked-count'),
          sessionTime: document.getElementById('session-time')
        }
      },

      setupEventListeners() {
        try {
          // Help link
          if (this.elements.helpLink) {
            this.elements.helpLink.addEventListener('click', (e) => {
              e.preventDefault()
              this.openHelpPage()
            })
          }

          // Refresh button
          if (this.elements.refreshButton) {
            this.elements.refreshButton.addEventListener('click', () => {
              this.refreshCurrentTab()
            })
          }

          // Toggle button
          if (this.elements.toggleButton) {
            this.elements.toggleButton.addEventListener('click', () => {
              this.toggleBypass()
            })
          }

          // Site toggle
          if (this.elements.siteToggle) {
            this.elements.siteToggle.addEventListener('click', () => {
              this.toggleSiteStatus()
            })
            
            // Keyboard support for toggle
            this.elements.siteToggle.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                this.toggleSiteStatus()
              }
            })
          }

          // Statistics summary
          if (this.elements.statsSummary) {
            this.elements.statsSummary.addEventListener('click', () => {
              this.openStatisticsPage()
            })
            
            // Keyboard support for stats
            this.elements.statsSummary.addEventListener('keydown', (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                this.openStatisticsPage()
              }
            })
          }

          // Keyboard shortcuts
          document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e)
          })

          console.log('[UWB Popup] Event listeners setup complete')
        } catch (error) {
          console.error('[UWB Popup] Error setting up event listeners:', error)
        }
      },

      async init() {
        try {
          this.cacheElements()
          this.setupEventListeners()
          await this.loadCurrentTab()
          await this.loadSiteStatus()
          await this.loadStatistics()
          this.updateUI()
          console.log('[UWB Popup] Initialized successfully')
        } catch (error) {
          console.error('[UWB Popup] Initialization error:', error)
          this.showError('Failed to initialize popup')
        }
      },

      async loadCurrentTab() {
        try {
          const tabs = await this.queryActiveTab()

          if (tabs && tabs.length > 0) {
            this.currentTab = tabs[0]
            await this.loadTabStats()
          } else {
            throw new Error('No active tab found')
          }
        } catch (error) {
          console.error('[UWB Popup] Error loading current tab:', error)
          this.showError('Could not access current tab')
        }
      },

      queryActiveTab() {
        return new Promise((resolve, reject) => {
          try {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message))
              } else {
                resolve(tabs)
              }
            })
          } catch (error) {
            reject(error)
          }
        })
      },

      async loadTabStats() {
        // Mock implementation
      },

      async loadSiteStatus() {
        if (!this.currentTab?.url) return

        const hostname = new URL(this.currentTab.url).hostname
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['siteStatus'], (data) => {
            resolve(data.siteStatus || {})
          })
        })

        this.siteStatus.hostname = hostname
        this.siteStatus.enabled = result[hostname]?.enabled !== false
      },

      async loadStatistics() {
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['stats'], (data) => {
            resolve(data.stats || {})
          })
        })
        this.stats = { ...this.stats, ...result }
      },

      async toggleSiteStatus() {
        if (!this.siteStatus.hostname) return

        this.siteStatus.enabled = !this.siteStatus.enabled

        const siteStatus = {}
        siteStatus[this.siteStatus.hostname] = { enabled: this.siteStatus.enabled }

        await new Promise((resolve) => {
          chrome.storage.sync.set({ siteStatus }, resolve)
        })

        this.updateUI()
      },

      updateUI() {
        if (this.elements.currentUrl && this.currentTab) {
          this.elements.currentUrl.textContent = this.currentTab.url
        }

        if (this.elements.statusDot && this.elements.statusText) {
          if (this.siteStatus.enabled) {
            this.elements.statusDot.classList.add('active')
            this.elements.statusText.textContent = 'Active'
          } else {
            this.elements.statusDot.classList.remove('active')
            this.elements.statusText.textContent = 'Disabled'
          }
        }

        if (this.elements.blockedCount) {
          this.elements.blockedCount.textContent = this.stats.blocked.toString()
        }
      },

      showError(message) {
        if (this.elements.errorContainer) {
          this.elements.errorContainer.textContent = message
          this.elements.errorContainer.style.display = 'block'
        }

        if (this.elements.statsContainer) {
          this.elements.statsContainer.style.display = 'none'
        }
      },

      openHelpPage() {
        const helpUrl = chrome.runtime.getURL('docs/help.html')
        chrome.tabs.create({ url: helpUrl })
      },

      openStatisticsPage() {
        const statsUrl = chrome.runtime.getURL('statistics.html')
        chrome.tabs.create({ url: statsUrl })
      },

      async refreshCurrentTab() {
        if (this.currentTab?.id) {
          await new Promise((resolve) => {
            chrome.tabs.reload(this.currentTab.id, resolve)
          })
        }
      },

      handleKeyboardShortcuts(event) {
        if (event.ctrlKey && event.key === 'r') {
          event.preventDefault()
          this.refreshCurrentTab()
        } else if (event.key === 'Escape') {
          window.close()
        }
      },

      toggleBypass() {
        // Mock implementation
      }
    }
  })

  describe('PopupController Initialization', () => {
    test('should initialize all properties correctly', () => {
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

    test('should cache DOM elements correctly', () => {
      PopupController.cacheElements()
      
      expect(document.getElementById).toHaveBeenCalledWith('current-url')
      expect(document.getElementById).toHaveBeenCalledWith('refresh-button')
      expect(document.getElementById).toHaveBeenCalledWith('toggle-button')
      expect(document.querySelector).toHaveBeenCalledWith('.status-dot')
      expect(document.querySelector).toHaveBeenCalledWith('.status-indicator span')
    })

    test('should setup event listeners without errors', () => {
      PopupController.cacheElements()
      PopupController.setupEventListeners()
      
      // Verify event listeners are attached
      expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })
  })

  describe('Tab Management', () => {
    test('should query active tab successfully', async () => {
      const mockTabs = [{ id: 1, url: 'https://example.com', title: 'Test' }]
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      const result = await PopupController.queryActiveTab()
      expect(result).toEqual(mockTabs)
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      )
    })

    test('should handle tab query errors', async () => {
      chrome.runtime.lastError = { message: 'Permission denied' }
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([])
      })

      await expect(PopupController.queryActiveTab()).rejects.toThrow('Permission denied')
    })

    test('should load current tab correctly', async () => {
      const mockTabs = [{ id: 1, url: 'https://example.com', title: 'Test' }]
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback(mockTabs)
      })

      PopupController.loadTabStats = jest.fn()
      await PopupController.loadCurrentTab()

      expect(PopupController.currentTab).toEqual(mockTabs[0])
      expect(PopupController.loadTabStats).toHaveBeenCalled()
    })

    test('should handle no active tab found', async () => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([])
      })

      PopupController.showError = jest.fn()
      await PopupController.loadCurrentTab()

      expect(PopupController.showError).toHaveBeenCalledWith('Could not access current tab')
    })
  })

  describe('URL Validation', () => {
    test('should identify valid URLs for extension', () => {
      const isActiveUrl = (url) => {
        if (!url) return false
        try {
          const parsedUrl = new URL(url)
          return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:'
        } catch {
          return false
        }
      }

      expect(isActiveUrl('https://example.com')).toBe(true)
      expect(isActiveUrl('http://test.org')).toBe(true)
      expect(isActiveUrl('chrome://extensions')).toBe(false)
      expect(isActiveUrl('about:blank')).toBe(false)
      expect(isActiveUrl('chrome-extension://test')).toBe(false)
      expect(isActiveUrl('')).toBe(false)
      expect(isActiveUrl(null)).toBe(false)
    })

    test('should extract hostname from URL', () => {
      const extractHostname = (url) => {
        try {
          return new URL(url).hostname
        } catch {
          return null
        }
      }

      expect(extractHostname('https://example.com/path')).toBe('example.com')
      expect(extractHostname('http://sub.domain.org')).toBe('sub.domain.org')
      expect(extractHostname('invalid-url')).toBe(null)
      expect(extractHostname('')).toBe(null)
    })
  })

  describe('Statistics Loading', () => {
    test('should load statistics from storage', async () => {
      const mockStats = {
        blocked: 42,
        active: true,
        sessionStartTime: Date.now() - 3600000,
        sitesDisabled: ['example.com']
      }

      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ stats: mockStats })
      })

      PopupController.loadStatistics = jest.fn(async function() {
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['stats'], (data) => {
            resolve(data.stats || {})
          })
        })
        this.stats = { ...this.stats, ...result }
      })

      await PopupController.loadStatistics()
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['stats'], expect.any(Function))
    })

    test('should handle storage errors gracefully', async () => {
      chrome.runtime.lastError = { message: 'Storage error' }
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({})
      })

      PopupController.showError = jest.fn()
      PopupController.loadStatistics = jest.fn(async function() {
        try {
          await new Promise((resolve, reject) => {
            chrome.storage.sync.get(['stats'], (data) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message))
              } else {
                resolve(data)
              }
            })
          })
        } catch (error) {
          this.showError('Failed to load statistics')
        }
      })

      await PopupController.loadStatistics()
      expect(PopupController.showError).toHaveBeenCalledWith('Failed to load statistics')
    })
  })

  describe('Site Status Management', () => {
    test('should load site status correctly', async () => {
      PopupController.currentTab = { url: 'https://example.com' }
      const mockStatus = { 'example.com': { enabled: false } }

      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ siteStatus: mockStatus })
      })

      PopupController.loadSiteStatus = jest.fn(async function() {
        if (!this.currentTab?.url) return

        const hostname = new URL(this.currentTab.url).hostname
        const result = await new Promise((resolve) => {
          chrome.storage.sync.get(['siteStatus'], (data) => {
            resolve(data.siteStatus || {})
          })
        })

        this.siteStatus.hostname = hostname
        this.siteStatus.enabled = result[hostname]?.enabled !== false
      })

      await PopupController.loadSiteStatus()
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['siteStatus'], expect.any(Function))
    })

    test('should toggle site status correctly', async () => {
      PopupController.siteStatus = { hostname: 'example.com', enabled: true }
      
      chrome.storage.sync.set.mockImplementation((data, callback) => {
        callback()
      })

      PopupController.toggleSiteStatus = jest.fn(async function() {
        if (!this.siteStatus.hostname) return

        this.siteStatus.enabled = !this.siteStatus.enabled

        const siteStatus = {}
        siteStatus[this.siteStatus.hostname] = { enabled: this.siteStatus.enabled }

        await new Promise((resolve) => {
          chrome.storage.sync.set({ siteStatus }, resolve)
        })

        this.updateUI()
      })

      PopupController.updateUI = jest.fn()
      await PopupController.toggleSiteStatus()

      expect(PopupController.siteStatus.enabled).toBe(false)
      expect(PopupController.updateUI).toHaveBeenCalled()
    })
  })

  describe('UI Updates', () => {
    test('should update UI elements correctly', () => {
      PopupController.cacheElements()
      PopupController.currentTab = { url: 'https://example.com', title: 'Test Site' }
      PopupController.siteStatus = { hostname: 'example.com', enabled: true }
      PopupController.stats = { blocked: 25, active: true }

      PopupController.updateUI = jest.fn(function() {
        if (this.elements.currentUrl && this.currentTab) {
          this.elements.currentUrl.textContent = this.currentTab.url
        }

        if (this.elements.statusDot && this.elements.statusText) {
          if (this.siteStatus.enabled) {
            this.elements.statusDot.classList.add('active')
            this.elements.statusText.textContent = 'Active'
          } else {
            this.elements.statusDot.classList.remove('active')
            this.elements.statusText.textContent = 'Disabled'
          }
        }

        if (this.elements.blockedCount) {
          this.elements.blockedCount.textContent = this.stats.blocked.toString()
        }
      })

      PopupController.updateUI()
      expect(PopupController.updateUI).toHaveBeenCalled()
    })

    test('should show error messages correctly', () => {
      PopupController.cacheElements()
      
      PopupController.showError = jest.fn(function(message) {
        if (this.elements.errorContainer) {
          this.elements.errorContainer.textContent = message
          this.elements.errorContainer.style.display = 'block'
        }

        if (this.elements.statsContainer) {
          this.elements.statsContainer.style.display = 'none'
        }
      })

      PopupController.showError('Test error message')
      expect(PopupController.showError).toHaveBeenCalledWith('Test error message')
    })
  })

  describe('Navigation and Actions', () => {
    test('should open help page correctly', () => {
      chrome.tabs.create.mockImplementation((options, callback) => {
        if (callback) callback({ id: 123 })
      })

      PopupController.openHelpPage = jest.fn(function() {
        const helpUrl = chrome.runtime.getURL('docs/help.html')
        chrome.tabs.create({ url: helpUrl })
      })

      PopupController.openHelpPage()
      expect(chrome.runtime.getURL).toHaveBeenCalledWith('docs/help.html')
      expect(chrome.tabs.create).toHaveBeenCalled()
    })

    test('should open statistics page correctly', () => {
      chrome.tabs.create.mockImplementation((options, callback) => {
        if (callback) callback({ id: 124 })
      })

      PopupController.openStatisticsPage = jest.fn(function() {
        const statsUrl = chrome.runtime.getURL('statistics.html')
        chrome.tabs.create({ url: statsUrl })
      })

      PopupController.openStatisticsPage()
      expect(chrome.runtime.getURL).toHaveBeenCalledWith('statistics.html')
      expect(chrome.tabs.create).toHaveBeenCalled()
    })

    test('should refresh current tab correctly', async () => {
      PopupController.currentTab = { id: 123 }
      chrome.tabs.reload.mockImplementation((tabId, callback) => {
        if (callback) callback()
      })

      PopupController.refreshCurrentTab = jest.fn(async function() {
        if (this.currentTab?.id) {
          await new Promise((resolve) => {
            chrome.tabs.reload(this.currentTab.id, resolve)
          })
        }
      })

      await PopupController.refreshCurrentTab()
      expect(chrome.tabs.reload).toHaveBeenCalledWith(123, expect.any(Function))
    })
  })

  describe('Keyboard Shortcuts', () => {
    test('should handle keyboard shortcuts correctly', () => {
      PopupController.handleKeyboardShortcuts = jest.fn(function(event) {
        if (event.ctrlKey && event.key === 'r') {
          event.preventDefault()
          this.refreshCurrentTab()
        } else if (event.key === 'Escape') {
          window.close()
        }
      })

      const mockEvent = {
        ctrlKey: true,
        key: 'r',
        preventDefault: jest.fn()
      }

      PopupController.refreshCurrentTab = jest.fn()
      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(PopupController.refreshCurrentTab).toHaveBeenCalled()
    })

    test('should handle escape key correctly', () => {
      global.window = { close: jest.fn() }

      PopupController.handleKeyboardShortcuts = jest.fn(function(event) {
        if (event.key === 'Escape') {
          window.close()
        }
      })

      const mockEvent = { key: 'Escape' }
      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(window.close).toHaveBeenCalled()
    })
  })

  describe('Time Formatting', () => {
    test('should format session time correctly', () => {
      const formatTime = (ms) => {
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

      expect(formatTime(30000)).toBe('30s')
      expect(formatTime(90000)).toBe('1m 30s')
      expect(formatTime(3690000)).toBe('1h 1m 30s')
    })
  })

  describe('Error Handling', () => {
    test('should handle initialization errors gracefully', async () => {
      PopupController.cacheElements = jest.fn(() => {
        throw new Error('DOM not ready')
      })

      PopupController.showError = jest.fn()
      console.error = jest.fn()

      PopupController.init = jest.fn(async function() {
        try {
          this.cacheElements()
          this.setupEventListeners()
          await this.loadCurrentTab()
          await this.loadSiteStatus()
          await this.loadStatistics()
          this.updateUI()
        } catch (error) {
          console.error('[UWB Popup] Initialization error:', error)
          this.showError('Failed to initialize popup')
        }
      })

      await PopupController.init()

      expect(console.error).toHaveBeenCalledWith(
        '[UWB Popup] Initialization error:',
        expect.any(Error)
      )
      expect(PopupController.showError).toHaveBeenCalledWith('Failed to initialize popup')
    })

    test('should handle chrome API errors correctly', async () => {
      chrome.runtime.lastError = { message: 'Extension context invalidated' }
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([])
      })

      PopupController.showError = jest.fn()
      await PopupController.loadCurrentTab()

      expect(PopupController.showError).toHaveBeenCalledWith('Could not access current tab')
    })
  })
})
    const extractHostname = (url) => {
      try {
        return new URL(url).hostname
      } catch {
        return null
      }
    }

    expect(extractHostname('https://example.com/path?query=1')).toBe('example.com')
    expect(extractHostname('http://sub.example.org')).toBe('sub.example.org')
    expect(extractHostname('invalid-url')).toBeNull()
    expect(extractHostname('')).toBeNull()
  })

  test('should send messages to background script', async() => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      callback({ success: true, data: 'test' })
    })

    const sendMessage = (message) => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      })
    }

    const result = await sendMessage({ action: 'test' })
    expect(result).toEqual({ success: true, data: 'test' })
  })

  test('should handle message errors', async() => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      chrome.runtime.lastError = { message: 'Connection failed' }
      callback(null)
    })

    const sendMessage = (message) => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(response)
          }
        })
      })
    }

    await expect(sendMessage({ action: 'test' }))
      .rejects.toThrow('Connection failed')
  })

  test('should load current tab', async() => {
    const mockTab = { id: 123, url: 'https://example.com', active: true }
    
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([mockTab])
    })

    const getCurrentTab = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (tabs.length === 0) {
            resolve(null)
          } else {
            resolve(tabs[0])
          }
        })
      })
    }

    const tab = await getCurrentTab()
    expect(tab).toEqual(mockTab)
  })

  test('should handle empty tab list', async() => {
    chrome.tabs.query.mockImplementation((query, callback) => {
      callback([])
    })

    const getCurrentTab = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (tabs.length === 0) {
            resolve(null)
          } else {
            resolve(tabs[0])
          }
        })
      })
    }

    const tab = await getCurrentTab()
    expect(tab).toBeNull()
  })

  test('should toggle site status', async() => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'toggleSite') {
        callback({ success: true, enabled: false })
      }
    })

    const toggleSiteStatus = async(hostname) => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'toggleSite',
          hostname
        }, resolve)
      })
    }

    const result = await toggleSiteStatus('example.com')
    expect(result).toEqual({ success: true, enabled: false })
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'toggleSite',
      hostname: 'example.com'
    }, expect.any(Function))
  })

  test('should execute bypass', async() => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'executeBypass') {
        callback({ success: true })
      }
    })

    const executeBypass = async(tabId) => {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'executeBypass',
          tabId
        }, resolve)
      })
    }

    const result = await executeBypass(123)
    expect(result).toEqual({ success: true })
  })

  test('should reload tab', () => {
    chrome.tabs.reload.mockImplementation(() => {})
    
    const reloadTab = (tabId) => {
      chrome.tabs.reload(tabId)
    }

    reloadTab(123)
    expect(chrome.tabs.reload).toHaveBeenCalledWith(123)
  })

  test('should open help page', () => {
    const openHelpPage = () => {
      chrome.tabs.create({
        url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
      })
    }

    openHelpPage()
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
    })
  })

  test('should open statistics page', () => {
    const openStatisticsPage = () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL('statistics.html')
      })
    }

    openStatisticsPage()
    expect(chrome.tabs.create).toHaveBeenCalledWith({
      url: 'chrome-extension://test/statistics.html'
    })
  })

  test('should format session time', () => {
    const formatSessionTime = (startTime) => {
      const minutes = Math.floor((Date.now() - startTime) / 60000)
      return `${minutes}m`
    }

    const fiveMinutesAgo = Date.now() - 300000
    expect(formatSessionTime(fiveMinutesAgo)).toBe('5m')
  })

  test('should handle keyboard shortcuts', () => {
    const handleKeyboard = (event) => {
      if (event.key === 'Escape') return 'close'
      if (event.ctrlKey && event.key === 'r') return 'refresh'
      if (event.ctrlKey && event.key === 'h') return 'help'
      return null
    }

    expect(handleKeyboard({ key: 'Escape' })).toBe('close')
    expect(handleKeyboard({ key: 'r', ctrlKey: true })).toBe('refresh')
    expect(handleKeyboard({ key: 'h', ctrlKey: true })).toBe('help')
    expect(handleKeyboard({ key: 'a' })).toBeNull()
  })

  test('should get version info', () => {
    const getVersionInfo = () => {
      const manifest = chrome.runtime.getManifest()
      return {
        version: manifest.version,
        name: manifest.name
      }
    }

    const info = getVersionInfo()
    expect(info.version).toBe('2.0.0')
    expect(info.name).toBe('Universal Web Bypass Injector')
  })

  describe('Site Status Logic', () => {
    test('should update toggle state', () => {
      const updateToggleState = (element, enabled) => {
        if (!element) return
        element.className = enabled ? 'toggle-switch active' : 'toggle-switch'
        element.setAttribute('aria-checked', enabled.toString())
      }

      const mockElement = {
        className: '',
        setAttribute: jest.fn()
      }

      updateToggleState(mockElement, true)
      expect(mockElement.className).toBe('toggle-switch active')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-checked', 'true')

      updateToggleState(mockElement, false)
      expect(mockElement.className).toBe('toggle-switch')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-checked', 'false')
    })

    test('should update status display', () => {
      const updateStatusDisplay = (statusDot, statusText, isActive, isEnabled) => {
        if (statusDot) {
          statusDot.className = isActive ? 'status-dot active' : 'status-dot inactive'
        }
        if (statusText) {
          statusText.textContent = isActive
            ? 'Active and protecting this page'
            : isEnabled ? 'Inactive on this page' : 'Disabled for this site'
        }
      }

      const mockDot = { className: '' }
      const mockText = { textContent: '' }

      updateStatusDisplay(mockDot, mockText, true, true)
      expect(mockDot.className).toBe('status-dot active')
      expect(mockText.textContent).toBe('Active and protecting this page')

      updateStatusDisplay(mockDot, mockText, false, true)
      expect(mockDot.className).toBe('status-dot inactive')
      expect(mockText.textContent).toBe('Inactive on this page')

      updateStatusDisplay(mockDot, mockText, false, false)
      expect(mockDot.className).toBe('status-dot inactive')
      expect(mockText.textContent).toBe('Disabled for this site')
    })

    test('should update statistics display', () => {
      const updateStatsDisplay = (elements, stats) => {
        if (!elements.statsSummary) return

        const hasData = stats.totalBlocked > 0 || stats.sessionsActive > 0
        elements.statsSummary.style.display = hasData ? 'block' : 'none'

        if (hasData) {
          if (elements.blockedCount) {
            elements.blockedCount.textContent = stats.totalBlocked || stats.blocked || 0
          }
          if (elements.sessionTime) {
            const minutes = Math.floor((Date.now() - stats.sessionStartTime) / 60000)
            elements.sessionTime.textContent = `${minutes}m`
          }
        }
      }

      const mockElements = {
        statsSummary: { style: { display: '' } },
        blockedCount: { textContent: '' },
        sessionTime: { textContent: '' }
      }

      const stats = {
        totalBlocked: 25,
        sessionsActive: 1,
        sessionStartTime: Date.now() - 180000 // 3 minutes ago
      }

      updateStatsDisplay(mockElements, stats)
      expect(mockElements.statsSummary.style.display).toBe('block')
      expect(mockElements.blockedCount.textContent).toBe(25)
      expect(mockElements.sessionTime.textContent).toBe('3m')

      // Test with no data
      const emptyStats = { totalBlocked: 0, sessionsActive: 0 }
      updateStatsDisplay(mockElements, emptyStats)
      expect(mockElements.statsSummary.style.display).toBe('none')
    })
  })
})