/**
 * @file Simplified Popup Tests
 * @description Basic tests for popup functionality without JSDOM complications
 */

// Mock Chrome APIs before any imports
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
  action: {
    openPopup: jest.fn()
  }
}

describe('PopupController - Basic Tests', () => {
  test('should be able to check extension activity on different URLs', () => {
    // Test URL activity detection logic
    const activeUrls = [
      'https://example.com',
      'http://test.org',
      'https://news.site.com/article'
    ]

    const inactiveUrls = [
      'chrome://extensions',
      'about:blank',
      'moz-extension://abc123',
      'chrome-extension://def456'
    ]

    // Mock the activity check logic
    const isExtensionActive = (url) => {
      if (!url) return false
      const protocol = url.split(':')[0]
      return protocol === 'http' || protocol === 'https'
    }

    activeUrls.forEach(url => {
      expect(isExtensionActive(url)).toBe(true)
    })

    inactiveUrls.forEach(url => {
      expect(isExtensionActive(url)).toBe(false)
    })
  })

  test('should handle message sending to background script', async() => {
    // Mock chrome.runtime.sendMessage
    chrome.runtime.sendMessage = jest.fn((message, callback) => {
      callback({ success: true, data: 'test response' })
    })

    // Test the message sending logic
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

    const response = await sendMessage({ action: 'test' })

    expect(response).toEqual({ success: true, data: 'test response' })
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
      { action: 'test' },
      expect.any(Function)
    )
  })

  test('should handle message errors correctly', async() => {
    // Mock chrome.runtime.sendMessage with error
    chrome.runtime.sendMessage = jest.fn((message, callback) => {
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

    try {
      await sendMessage({ action: 'test' })
      expect(false).toBe(true) // Should not reach here
    } catch (error) {
      expect(error.message).toBe('Connection failed')
    }

    // Clean up
    delete chrome.runtime.lastError
  })

  test('should format URLs correctly for display', () => {
    const formatUrl = (url) => {
      try {
        const parsedUrl = new URL(url)
        return parsedUrl.hostname
      } catch {
        return 'Invalid URL'
      }
    }

    expect(formatUrl('https://example.com/path?query=1')).toBe('example.com')
    expect(formatUrl('http://subdomain.example.org')).toBe('subdomain.example.org')
    expect(formatUrl('invalid-url')).toBe('Invalid URL')
    expect(formatUrl('')).toBe('Invalid URL')
  })

  test('should validate tab loading functionality', async() => {
    const mockTab = {
      id: 123,
      url: 'https://example.com',
      title: 'Example Site',
      active: true
    }

    chrome.tabs.query = jest.fn((query, callback) => {
      callback([mockTab])
    })

    const loadCurrentTab = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (tabs.length === 0) {
            reject(new Error('No active tab found'))
          } else {
            resolve(tabs[0])
          }
        })
      })
    }

    const tab = await loadCurrentTab()

    expect(tab).toEqual(mockTab)
    expect(chrome.tabs.query).toHaveBeenCalledWith(
      { active: true, currentWindow: true },
      expect.any(Function)
    )
  })

  test('should handle tab loading errors', async() => {
    chrome.tabs.query = jest.fn((query, callback) => {
      callback([]) // No tabs
    })

    const loadCurrentTab = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else if (tabs.length === 0) {
            reject(new Error('No active tab found'))
          } else {
            resolve(tabs[0])
          }
        })
      })
    }

    try {
      await loadCurrentTab()
      expect(false).toBe(true) // Should not reach here
    } catch (error) {
      expect(error.message).toBe('No active tab found')
    }
  })

  test('should handle bypass toggle functionality', async() => {
    chrome.runtime.sendMessage = jest.fn((message, callback) => {
      callback({ success: true })
    })

    chrome.tabs.reload = jest.fn()

    const toggleBypass = async(tabId) => {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'executeBypass',
          tabId
        }, resolve)
      })

      if (response.success) {
        chrome.tabs.reload(tabId)
      }

      return response
    }

    const result = await toggleBypass(123)

    expect(result.success).toBe(true)
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
      action: 'executeBypass',
      tabId: 123
    }, expect.any(Function))
    expect(chrome.tabs.reload).toHaveBeenCalledWith(123)
  })

  test('should validate keyboard shortcut handling', () => {
    const handleKeyboardShortcuts = (event) => {
      if (event.key === 'Escape') {
        return 'close'
      } else if (event.ctrlKey && event.key === 'r') {
        return 'refresh'
      } else if (event.ctrlKey && event.key === 'h') {
        return 'help'
      }
      return null
    }

    expect(handleKeyboardShortcuts({ key: 'Escape' })).toBe('close')
    expect(handleKeyboardShortcuts({ key: 'r', ctrlKey: true })).toBe('refresh')
    expect(handleKeyboardShortcuts({ key: 'h', ctrlKey: true })).toBe('help')
    expect(handleKeyboardShortcuts({ key: 'a' })).toBeNull()
  })

  test('should handle version information correctly', () => {
    chrome.runtime.getManifest = jest.fn(() => ({
      version: '2.0.0',
      name: 'Universal Web Bypass Injector'
    }))

    const getVersionInfo = () => {
      const manifest = chrome.runtime.getManifest()
      return `v${manifest.version} | ${manifest.name}`
    }

    const versionInfo = getVersionInfo()

    expect(versionInfo).toBe('v2.0.0 | Universal Web Bypass Injector')
    expect(chrome.runtime.getManifest).toHaveBeenCalled()
  })

  describe('Site Toggle Functionality', () => {
    beforeEach(() => {
      // Mock DOM elements for site toggle
      document.body.innerHTML = `
        <div class="toggle-switch" id="site-toggle"></div>
        <span id="blocked-count">0</span>
        <span id="session-time">0m</span>
        <div id="stats-summary" style="display: none;"></div>
        <div class="status-dot"></div>
        <span class="status-text"></span>
      `
      
      // Mock PopupController
      global.PopupController = {
        elements: {
          siteToggle: document.getElementById('site-toggle'),
          blockedCount: document.getElementById('blocked-count'),
          sessionTime: document.getElementById('session-time'),
          statsSummary: document.getElementById('stats-summary'),
          statusDot: document.querySelector('.status-dot'),
          statusText: document.querySelector('.status-text')
        },
        siteStatus: { enabled: true, hostname: null },
        stats: {},
        currentTab: null,
        updateSiteToggle: function() {
          if (!this.elements.siteToggle) return
          const isEnabled = this.siteStatus.enabled
          this.elements.siteToggle.className = isEnabled ? 'toggle-switch active' : 'toggle-switch'
          this.elements.siteToggle.setAttribute('aria-checked', isEnabled.toString())
        },
        updateStatistics: function() {
          if (!this.elements.statsSummary) return
          if (this.stats.totalBlocked > 0 || this.stats.sessionsActive > 0) {
            this.elements.statsSummary.style.display = 'block'
            if (this.elements.blockedCount) {
              this.elements.blockedCount.textContent = this.stats.totalBlocked || this.stats.blocked || 0
            }
            if (this.elements.sessionTime) {
              const sessionMinutes = Math.floor((Date.now() - this.stats.sessionStartTime) / 60000)
              this.elements.sessionTime.textContent = `${sessionMinutes}m`
            }
          } else {
            this.elements.statsSummary.style.display = 'none'
          }
        },
        updateStatus: function() {
          const isActive = this.currentTab && this.siteStatus.enabled
          if (this.elements.statusDot) {
            this.elements.statusDot.className = isActive ? 'status-dot active' : 'status-dot inactive'
          }
          if (this.elements.statusText) {
            this.elements.statusText.textContent = isActive
              ? 'Active and protecting this page'
              : this.siteStatus.enabled ? 'Inactive on this page' : 'Disabled for this site'
          }
        },
        showMessage: function(message, _type = 'info') {
          let messageContainer = document.getElementById('message-container')
          if (!messageContainer) {
            messageContainer = document.createElement('div')
            messageContainer.id = 'message-container'
            document.body.appendChild(messageContainer)
          }
          messageContainer.textContent = message
          messageContainer.style.display = 'block'
        },
        openStatisticsPage: function() {
          chrome.tabs.create({ url: chrome.runtime.getURL('statistics.html') })
          if (window.close) window.close()
        }
      }
    })

    test('should update site toggle display', () => {
      global.PopupController.siteStatus.enabled = true
      global.PopupController.updateSiteToggle()

      expect(global.PopupController.elements.siteToggle.className).toBe('toggle-switch active')
      expect(global.PopupController.elements.siteToggle.getAttribute('aria-checked')).toBe('true')
    })

    test('should update site toggle display when disabled', () => {
      global.PopupController.siteStatus.enabled = false
      global.PopupController.updateSiteToggle()

      expect(global.PopupController.elements.siteToggle.className).toBe('toggle-switch')
      expect(global.PopupController.elements.siteToggle.getAttribute('aria-checked')).toBe('false')
    })

    test('should update statistics display with data', () => {
      global.PopupController.stats = {
        totalBlocked: 25,
        sessionStartTime: Date.now() - 120000, // 2 minutes ago
        blocked: 10
      }

      global.PopupController.updateStatistics()

      expect(global.PopupController.elements.blockedCount.textContent).toBe('25')
      expect(global.PopupController.elements.sessionTime.textContent).toBe('2m')
      expect(global.PopupController.elements.statsSummary.style.display).toBe('block')
    })

    test('should hide statistics when no data', () => {
      global.PopupController.stats = {
        totalBlocked: 0,
        blocked: 0,
        sessionsActive: 0
      }

      global.PopupController.updateStatistics()

      expect(global.PopupController.elements.statsSummary.style.display).toBe('none')
    })

    test('should handle statistics page opening', () => {
      const mockCreate = jest.fn()
      const mockClose = jest.fn()
      
      chrome.tabs.create = mockCreate
      global.window.close = mockClose

      global.PopupController.openStatisticsPage()

      expect(mockCreate).toHaveBeenCalledWith({
        url: chrome.runtime.getURL('statistics.html')
      })
    })

    test('should show success message', () => {
      global.PopupController.showMessage('Test message', 'success')

      const messageContainer = document.getElementById('message-container')
      expect(messageContainer).toBeTruthy()
      expect(messageContainer.textContent).toBe('Test message')
      expect(messageContainer.style.display).toBe('block')
    })

    test('should update status with site disabled state', () => {
      global.PopupController.siteStatus.enabled = false
      global.PopupController.currentTab = { url: 'https://example.com' }

      global.PopupController.updateStatus()

      expect(global.PopupController.elements.statusDot.className).toBe('status-dot inactive')
      expect(global.PopupController.elements.statusText.textContent).toBe('Disabled for this site')
    })
  })
})
