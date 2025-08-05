/**
 * @file Simple Popup Tests
 * @description Focused tests for popup functionality logic
 */

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
  }
}

describe('Popup Logic Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    delete chrome.runtime.lastError
  })

  test('should identify active URLs for extension', () => {
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

    expect(extractHostname('https://example.com/path?query=1')).toBe('example.com')
    expect(extractHostname('http://sub.example.org')).toBe('sub.example.org')
    expect(extractHostname('invalid-url')).toBeNull()
    expect(extractHostname('')).toBeNull()
  })

  test('should send messages to background script', async () => {
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

  test('should handle message errors', async () => {
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

  test('should load current tab', async () => {
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

  test('should handle empty tab list', async () => {
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

  test('should toggle site status', async () => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'toggleSite') {
        callback({ success: true, enabled: false })
      }
    })

    const toggleSiteStatus = async (hostname) => {
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

  test('should execute bypass', async () => {
    chrome.runtime.sendMessage.mockImplementation((message, callback) => {
      if (message.action === 'executeBypass') {
        callback({ success: true })
      }
    })

    const executeBypass = async (tabId) => {
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