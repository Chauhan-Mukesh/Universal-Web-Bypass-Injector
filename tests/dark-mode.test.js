/**
 * Test suite for Dark Mode functionality
 */

describe('Dark Mode', () => {
  let mockChrome
  
  beforeEach(() => {
    // Mock DOM elements
    document.body.innerHTML = `
      <div class="container">
        <button id="theme-toggle" class="theme-toggle">🌙</button>
        <div class="header">
          <h1>Universal Web Bypass</h1>
          <p>Ad & Paywall Bypass Extension</p>
        </div>
        <div class="status">
          <div class="status-indicator">
            <div class="status-dot" id="status-dot"></div>
            <span id="status-text">Active</span>
          </div>
        </div>
      </div>
    `

    // Mock chrome storage
    mockChrome = {
      storage: {
        sync: {
          get: jest.fn().mockImplementation((keys) => {
            return Promise.resolve({})
          }),
          set: jest.fn().mockImplementation(() => Promise.resolve())
        }
      }
    }
    global.chrome = mockChrome

    // Clear any existing classes
    document.body.classList.remove('dark-mode')
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Theme Toggle', () => {
    test('should toggle from light to dark mode', async () => {
      // Load popup script
      require('../popup.js')
      
      // Initialize PopupController
      PopupController.cacheElements()
      
      // Initially should be light mode
      expect(document.body.classList.contains('dark-mode')).toBe(false)
      
      // Toggle to dark mode
      PopupController.toggleTheme()
      
      // Should now be dark mode
      expect(document.body.classList.contains('dark-mode')).toBe(true)
      expect(PopupController.theme.current).toBe('dark')
    })

    test('should toggle from dark to light mode', async () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      
      // Start with dark mode
      PopupController.theme.current = 'dark'
      PopupController.applyTheme('dark')
      expect(document.body.classList.contains('dark-mode')).toBe(true)
      
      // Toggle to light mode
      PopupController.toggleTheme()
      
      // Should now be light mode
      expect(document.body.classList.contains('dark-mode')).toBe(false)
      expect(PopupController.theme.current).toBe('light')
    })

    test('should update theme toggle button icon', async () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      const themeToggle = document.getElementById('theme-toggle')
      
      // Initially should show moon (light mode)
      PopupController.applyTheme('light')
      expect(themeToggle.textContent).toBe('🌙')
      
      // After switching to dark mode, should show sun
      PopupController.applyTheme('dark')
      expect(themeToggle.textContent).toBe('☀️')
    })

    test('should save theme preference to storage', async () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      
      // Toggle theme
      await PopupController.saveTheme('dark')
      
      // Should have called chrome storage
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith({
        'uwb_theme_preference': 'dark'
      })
    })

    test('should load theme preference from storage', async () => {
      // Mock storage returning dark theme
      mockChrome.storage.sync.get.mockImplementation(() => {
        return Promise.resolve({ 'uwb_theme_preference': 'dark' })
      })

      require('../popup.js')
      
      PopupController.cacheElements()
      
      await PopupController.loadTheme()
      
      expect(PopupController.theme.current).toBe('dark')
      expect(document.body.classList.contains('dark-mode')).toBe(true)
    })

    test('should default to light theme if no preference stored', async () => {
      // Mock storage returning empty
      mockChrome.storage.sync.get.mockImplementation(() => {
        return Promise.resolve({})
      })

      require('../popup.js')
      
      PopupController.cacheElements()
      
      await PopupController.loadTheme()
      
      expect(PopupController.theme.current).toBe('light')
      expect(document.body.classList.contains('dark-mode')).toBe(false)
    })

    test('should handle storage errors gracefully', async () => {
      // Mock storage error
      mockChrome.storage.sync.get.mockImplementation(() => {
        return Promise.reject(new Error('Storage error'))
      })

      require('../popup.js')
      
      PopupController.cacheElements()
      
      // Should not throw and default to light theme
      await expect(PopupController.loadTheme()).resolves.not.toThrow()
      expect(document.body.classList.contains('dark-mode')).toBe(false)
    })
  })

  describe('CSS Classes', () => {
    test('should apply dark-mode class to body', () => {
      require('../popup.js')
      
      PopupController.applyTheme('dark')
      expect(document.body.classList.contains('dark-mode')).toBe(true)
      
      PopupController.applyTheme('light')
      expect(document.body.classList.contains('dark-mode')).toBe(false)
    })
  })

  describe('Event Listeners', () => {
    test('should handle theme toggle button click', () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      PopupController.setupEventListeners()
      
      const themeToggle = document.getElementById('theme-toggle')
      const initialTheme = PopupController.theme.current
      
      // Simulate click
      themeToggle.click()
      
      // Theme should have changed
      expect(PopupController.theme.current).not.toBe(initialTheme)
    })
  })
})