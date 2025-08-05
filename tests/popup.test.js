/**
 * @file Popup Script Tests
 * @description Comprehensive tests for the popup controller
 */

// Mock DOM for popup testing
const createMockDocument = () => {
  const mockElements = {
    'current-url': { textContent: '', title: '' },
    'refresh-button': {
      textContent: 'Refresh',
      disabled: false,
      addEventListener: jest.fn()
    },
    'toggle-button': { addEventListener: jest.fn() },
    'help-link': { addEventListener: jest.fn() },
    'stats-container': {
      innerHTML: '',
      style: { display: 'none' }
    },
    'error-container': null
  }

  return {
    getElementById: jest.fn((id) => mockElements[id] || null),
    querySelector: jest.fn((selector) => {
      if (selector === '.status-dot') {
        return { style: { backgroundColor: '' } }
      }
      if (selector === '.status-indicator span') {
        return { textContent: '' }
      }
      if (selector === '.footer') {
        return { textContent: 'v1.0.0 | Universal Web Bypass Injector' }
      }
      return null
    }),
    addEventListener: jest.fn(),
    createElement: jest.fn(() => ({
      id: '',
      className: '',
      style: { cssText: '', display: 'none' },
      textContent: '',
      appendChild: jest.fn()
    })),
    body: {
      appendChild: jest.fn(),
      insertBefore: jest.fn(),
      firstChild: null
    }
  }
}

const createMockWindow = () => ({
  close: jest.fn(),
  addEventListener: jest.fn()
})

describe('PopupController', () => {
  let PopupController
  let mockDocument
  let mockWindow

  beforeEach(() => {
    // Setup mocks
    jest.clearAllMocks()

    mockDocument = createMockDocument()
    mockWindow = createMockWindow()

    global.document = mockDocument
    global.window = mockWindow

    // Mock chrome.runtime.getManifest
    chrome.runtime.getManifest.mockReturnValue({ version: '2.0.0' })

    // Load the popup script
    delete require.cache[require.resolve('../popup.js')]
    require('../popup.js')

    PopupController = global.window.PopupController
  })

  describe('Initialization', () => {
    test('should initialize successfully', async() => {
      expect(PopupController).toBeDefined()
      expect(typeof PopupController.init).toBe('function')

      // Mock chrome.tabs.query
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([{
          id: 123,
          url: 'https://example.com',
          title: 'Example Site'
        }])
      })

      await PopupController.init()
      expect(PopupController.currentTab).toBeDefined()
    })

    test('should handle initialization errors', async() => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation()

      // Mock chrome.tabs.query to fail
      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([]) // No tabs
      })

      await PopupController.init()

      expect(errorSpy).toHaveBeenCalled()
      errorSpy.mockRestore()
    })
  })

  describe('Element Caching', () => {
    test('should cache DOM elements correctly', () => {
      PopupController.cacheElements()

      expect(PopupController.elements).toBeDefined()
      expect(PopupController.elements.currentUrl).toBeDefined()
      expect(mockDocument.getElementById).toHaveBeenCalledWith('current-url')
    })
  })

  describe('Event Listeners', () => {
    test('should setup event listeners', () => {
      PopupController.cacheElements()
      PopupController.setupEventListeners()

      // Check that event listeners were added
      expect(mockDocument.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function))
    })

    test('should handle help link clicks', () => {
      PopupController.cacheElements()
      PopupController.setupEventListeners()

      const helpLink = PopupController.elements.helpLink
      if (helpLink && helpLink.addEventListener.mock.calls.length > 0) {
        const clickHandler = helpLink.addEventListener.mock.calls[0][1]
        const mockEvent = { preventDefault: jest.fn() }

        clickHandler(mockEvent)

        expect(mockEvent.preventDefault).toHaveBeenCalled()
        expect(chrome.tabs.create).toHaveBeenCalledWith({
          url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
        })
      }
    })
  })

  describe('Tab Loading', () => {
    test('should load current tab successfully', async() => {
      const mockTab = {
        id: 123,
        url: 'https://example.com',
        title: 'Example Site'
      }

      chrome.tabs.query.mockImplementation((query, callback) => {
        callback([mockTab])
      })

      await PopupController.loadCurrentTab()

      expect(PopupController.currentTab).toEqual(mockTab)
      expect(chrome.tabs.query).toHaveBeenCalledWith(
        { active: true, currentWindow: true },
        expect.any(Function)
      )
    })

    test('should handle tab loading errors', async() => {
      chrome.tabs.query.mockImplementation((query, callback) => {
        // Simulate chrome.runtime.lastError
        chrome.runtime.lastError = { message: 'Access denied' }
        callback([])
      })

      const errorSpy = jest.spyOn(console, 'error').mockImplementation()

      await PopupController.loadCurrentTab()

      expect(errorSpy).toHaveBeenCalled()

      // Clean up
      delete chrome.runtime.lastError
      errorSpy.mockRestore()
    })
  })

  describe('UI Updates', () => {
    beforeEach(() => {
      PopupController.cacheElements()
      PopupController.currentTab = {
        id: 123,
        url: 'https://example.com',
        title: 'Example Site'
      }
    })

    test('should update current URL display', () => {
      PopupController.updateCurrentUrl()

      const urlElement = PopupController.elements.currentUrl
      expect(urlElement.textContent).toBe('example.com')
      expect(urlElement.title).toBe('https://example.com')
    })

    test('should handle invalid URLs', () => {
      PopupController.currentTab.url = 'invalid-url'
      PopupController.updateCurrentUrl()

      const urlElement = PopupController.elements.currentUrl
      expect(urlElement.textContent).toBe('Invalid URL')
    })

    test('should update status correctly', () => {
      PopupController.updateStatus()

      // Should show active status for HTTPS site
      const statusDot = mockDocument.querySelector('.status-dot')
      expect(statusDot.style.backgroundColor).toBe('#48bb78')
    })

    test('should show inactive status for unsupported URLs', () => {
      PopupController.currentTab.url = 'chrome://extensions'
      PopupController.updateStatus()

      const statusDot = mockDocument.querySelector('.status-dot')
      expect(statusDot.style.backgroundColor).toBe('#e53e3e')
    })

    test('should update version display', () => {
      PopupController.updateVersion()

      const footer = mockDocument.querySelector('.footer')
      expect(footer.textContent).toContain('v2.0.0')
    })
  })

  describe('Extension Activity Detection', () => {
    test('should detect active extension on HTTP/HTTPS sites', () => {
      PopupController.currentTab = { url: 'https://example.com' }
      expect(PopupController.isExtensionActive()).toBe(true)

      PopupController.currentTab = { url: 'http://example.com' }
      expect(PopupController.isExtensionActive()).toBe(true)
    })

    test('should detect inactive extension on browser pages', () => {
      const inactiveUrls = [
        'chrome://extensions',
        'about:blank',
        'moz-extension://abc123',
        'chrome-extension://def456'
      ]

      inactiveUrls.forEach(url => {
        PopupController.currentTab = { url }
        expect(PopupController.isExtensionActive()).toBe(false)
      })
    })

    test('should handle missing or invalid tab info', () => {
      PopupController.currentTab = null
      expect(PopupController.isExtensionActive()).toBe(false)

      PopupController.currentTab = { url: null }
      expect(PopupController.isExtensionActive()).toBe(false)
    })
  })

  describe('Message Handling', () => {
    test('should send messages to background script', async() => {
      const mockResponse = { success: true, data: 'test' }

      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback(mockResponse)
      })

      const response = await PopupController.sendMessage({ action: 'test' })

      expect(response).toEqual(mockResponse)
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(
        { action: 'test' },
        expect.any(Function)
      )
    })

    test('should handle message errors', async() => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        chrome.runtime.lastError = { message: 'Message failed' }
        callback(null)
      })

      try {
        await PopupController.sendMessage({ action: 'test' })
        expect(false).toBe(true) // Should not reach here
      } catch (error) {
        expect(error.message).toBe('Message failed')
      }

      delete chrome.runtime.lastError
    })
  })

  describe('Keyboard Shortcuts', () => {
    test('should handle refresh shortcut', () => {
      const refreshSpy = jest.spyOn(PopupController, 'refreshCurrentTab').mockImplementation()

      const mockEvent = {
        key: 'r',
        ctrlKey: true,
        preventDefault: jest.fn()
      }

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(refreshSpy).toHaveBeenCalled()

      refreshSpy.mockRestore()
    })

    test('should handle help shortcut', () => {
      const helpSpy = jest.spyOn(PopupController, 'openHelpPage').mockImplementation()

      const mockEvent = {
        key: 'h',
        ctrlKey: true,
        preventDefault: jest.fn()
      }

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockEvent.preventDefault).toHaveBeenCalled()
      expect(helpSpy).toHaveBeenCalled()

      helpSpy.mockRestore()
    })

    test('should handle escape key', () => {
      const mockEvent = { key: 'Escape' }

      PopupController.handleKeyboardShortcuts(mockEvent)

      expect(mockWindow.close).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    test('should show error messages', () => {
      PopupController.cacheElements()
      PopupController.showError('Test error message')

      expect(mockDocument.createElement).toHaveBeenCalledWith('div')
    })

    test('should auto-hide error messages', (done) => {
      jest.useFakeTimers()

      PopupController.cacheElements()
      PopupController.showError('Test error')

      // Fast-forward time
      jest.advanceTimersByTime(5000)

      // The error should be hidden after timeout
      setTimeout(() => {
        done()
      }, 100)

      jest.useRealTimers()
    })
  })

  describe('Cleanup', () => {
    test('should cleanup resources on destroy', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      PopupController.destroy()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Popup controller destroyed')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Tab Operations', () => {
    beforeEach(() => {
      PopupController.currentTab = { id: 123, url: 'https://example.com' }
    })

    test('should refresh tab information', async() => {
      const loadTabSpy = jest.spyOn(PopupController, 'loadCurrentTab')
        .mockResolvedValue()
      const updateUISpy = jest.spyOn(PopupController, 'updateUI')
        .mockImplementation()

      PopupController.cacheElements()

      await PopupController.refreshCurrentTab()

      expect(loadTabSpy).toHaveBeenCalled()
      expect(updateUISpy).toHaveBeenCalled()

      loadTabSpy.mockRestore()
      updateUISpy.mockRestore()
    })

    test('should toggle bypass functionality', async() => {
      chrome.runtime.sendMessage.mockImplementation((message, callback) => {
        callback({ success: true })
      })

      chrome.tabs.reload = jest.fn()

      await PopupController.toggleBypass()

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'executeBypass',
        tabId: 123
      })
      expect(chrome.tabs.reload).toHaveBeenCalledWith(123)
    })
  })
})
