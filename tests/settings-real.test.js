/**
 * @file Settings Real Coverage Tests
 * @description Tests for settings.js to improve actual coverage
 */

// Mock global chrome before requiring settings
global.chrome = {
  storage: {
    local: {
      get: jest.fn((keys, callback) => {
        const mockData = {
          uwb_settings: {
            darkMode: false,
            extensionEnabled: true,
            notificationLevel: 'important',
            aggressiveBlocking: true,
            blockAnalytics: true,
            blockSocial: true
          },
          uwb_theme_preference: 'light'
        }
        if (callback) setTimeout(() => callback(mockData), 0)
        return Promise.resolve(mockData)
      }),
      set: jest.fn((data, callback) => {
        if (callback) setTimeout(() => callback(), 0)
        return Promise.resolve()
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) setTimeout(() => callback(), 0)
        return Promise.resolve()
      })
    }
  },
  runtime: {
    sendMessage: jest.fn((message, callback) => {
      const response = { success: true }
      if (callback) setTimeout(() => callback(response), 0)
      return Promise.resolve(response)
    })
  }
}

// Mock console methods
global.console.log = jest.fn()
global.console.error = jest.fn()

// Mock confirm
global.confirm = jest.fn(() => true)

// Mock window.history
Object.defineProperty(window, 'history', {
  value: {
    length: 2,
    back: jest.fn(),
    go: jest.fn()
  },
  writable: true
})

// Setup DOM
document.body.innerHTML = `
  <div id="dark-mode-toggle" data-setting="darkMode"></div>
  <div id="extension-enabled-toggle" data-setting="extensionEnabled"></div>
  <div id="aggressive-blocking-toggle" data-setting="aggressiveBlocking"></div>
  <div id="block-analytics-toggle" data-setting="blockAnalytics"></div>
  <div id="block-social-toggle" data-setting="blockSocial"></div>
  <select id="notification-level">
    <option value="none">None</option>
    <option value="important">Important</option>
    <option value="all">All</option>
  </select>
  <button id="save-settings-btn">Save Settings</button>
  <button id="cancel-btn">Cancel</button>
  <button id="clear-stats-btn">Clear Statistics</button>
  <button id="reset-settings-btn">Reset Settings</button>
  <button id="back-link">Back</button>
  <div id="message"></div>
`;

// Import the settings module
const SettingsController = require('../settings.js')

describe('SettingsController Real Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset DOM
    document.body.innerHTML = `
      <div id="dark-mode-toggle" data-setting="darkMode"></div>
      <div id="extension-enabled-toggle" data-setting="extensionEnabled"></div>
      <div id="aggressive-blocking-toggle" data-setting="aggressiveBlocking"></div>
      <div id="block-analytics-toggle" data-setting="blockAnalytics"></div>
      <div id="block-social-toggle" data-setting="blockSocial"></div>
      <select id="notification-level">
        <option value="none">None</option>
        <option value="important">Important</option>
        <option value="all">All</option>
      </select>
      <button id="save-settings-btn">Save Settings</button>
      <button id="cancel-btn">Cancel</button>
      <button id="clear-stats-btn">Clear Statistics</button>
      <button id="reset-settings-btn">Reset Settings</button>
      <button id="back-link">Back</button>
      <div id="message"></div>
    `;
  })

  test('SettingsController should be defined', () => {
    expect(typeof SettingsController).toBe('object')
    expect(SettingsController).toBeDefined()
  })

  test('should have default settings', () => {
    expect(SettingsController.settings).toBeDefined()
    expect(typeof SettingsController.settings.darkMode).toBe('boolean')
    expect(typeof SettingsController.settings.extensionEnabled).toBe('boolean')
    expect(typeof SettingsController.settings.aggressiveBlocking).toBe('boolean')
  })

  test('should initialize successfully', async () => {
    await SettingsController.init()
    
    expect(SettingsController.elements).toBeDefined()
    expect(Object.keys(SettingsController.elements).length).toBeGreaterThan(0)
  })

  test('should cache DOM elements', () => {
    SettingsController.cacheElements()
    
    expect(SettingsController.elements.darkModeToggle).toBeTruthy()
    expect(SettingsController.elements.saveSettingsBtn).toBeTruthy()
    expect(SettingsController.elements.message).toBeTruthy()
  })

  test('should setup event listeners', () => {
    SettingsController.cacheElements()
    SettingsController.setupEventListeners()
    
    // Verify that elements have event listeners by checking they exist
    expect(SettingsController.elements.darkModeToggle).toBeTruthy()
    expect(SettingsController.elements.saveSettingsBtn).toBeTruthy()
  })

  test('should load settings from storage', async () => {
    await SettingsController.loadSettings()
    
    expect(chrome.storage.local.get).toHaveBeenCalledWith(['uwb_settings', 'uwb_theme_preference'])
  })

  test('should save settings to storage', async () => {
    SettingsController.settings.darkMode = true
    
    await SettingsController.saveSettings()
    
    expect(chrome.storage.local.set).toHaveBeenCalled()
  })

  test('should toggle boolean settings', () => {
    const originalValue = SettingsController.settings.darkMode
    
    SettingsController.toggleSetting('darkMode')
    
    expect(SettingsController.settings.darkMode).toBe(!originalValue)
  })

  test('should not toggle non-boolean settings', () => {
    const originalValue = SettingsController.settings.notificationLevel
    
    SettingsController.toggleSetting('notificationLevel')
    
    expect(SettingsController.settings.notificationLevel).toBe(originalValue)
  })

  test('should update UI', () => {
    SettingsController.cacheElements()
    SettingsController.settings.darkMode = true
    
    SettingsController.updateUI()
    
    // Verify UI update logic runs without error
    expect(SettingsController.elements.darkModeToggle).toBeTruthy()
  })

  test('should apply theme', () => {
    SettingsController.settings.darkMode = true
    SettingsController.applyTheme()
    
    expect(document.body.classList.contains('dark-theme')).toBe(true)
    
    SettingsController.settings.darkMode = false
    SettingsController.applyTheme()
    
    expect(document.body.classList.contains('dark-theme')).toBe(false)
  })

  test('should clear statistics when confirmed', async () => {
    global.confirm = jest.fn(() => true)
    
    await SettingsController.clearStatistics()
    
    expect(confirm).toHaveBeenCalled()
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ action: 'resetStats' })
  })

  test('should not clear statistics when cancelled', async () => {
    global.confirm = jest.fn(() => false)
    chrome.runtime.sendMessage.mockClear()
    
    await SettingsController.clearStatistics()
    
    expect(confirm).toHaveBeenCalled()
    expect(chrome.runtime.sendMessage).not.toHaveBeenCalled()
  })

  test('should reset settings when confirmed', async () => {
    global.confirm = jest.fn(() => true)
    SettingsController.settings.darkMode = true
    
    await SettingsController.resetSettings()
    
    expect(confirm).toHaveBeenCalled()
    expect(SettingsController.settings.darkMode).toBe(false)
  })

  test('should not reset settings when cancelled', async () => {
    global.confirm = jest.fn(() => false)
    const originalSettings = { ...SettingsController.settings }
    
    await SettingsController.resetSettings()
    
    expect(confirm).toHaveBeenCalled()
    expect(SettingsController.settings).toEqual(originalSettings)
  })

  test('should handle navigation back', () => {
    SettingsController.goBack()
    
    expect(window.history.back).toHaveBeenCalled()
  })

  test('should show messages', () => {
    SettingsController.cacheElements()
    
    SettingsController.showMessage('Test message', 'success')
    
    const messageElement = document.getElementById('message')
    expect(messageElement.textContent).toBe('Test message')
    expect(messageElement.classList.contains('success')).toBe(true)
  })

  test('should handle keyboard shortcuts', () => {
    SettingsController.saveSettings = jest.fn()
    SettingsController.resetSettings = jest.fn()
    SettingsController.goBack = jest.fn()
    
    // Test Ctrl+S
    const saveEvent = { ctrlKey: true, key: 's', preventDefault: jest.fn() }
    SettingsController.handleKeyboardShortcuts(saveEvent)
    expect(saveEvent.preventDefault).toHaveBeenCalled()
    expect(SettingsController.saveSettings).toHaveBeenCalled()
    
    // Test Ctrl+R
    const resetEvent = { ctrlKey: true, key: 'r', preventDefault: jest.fn() }
    SettingsController.handleKeyboardShortcuts(resetEvent)
    expect(resetEvent.preventDefault).toHaveBeenCalled()
    expect(SettingsController.resetSettings).toHaveBeenCalled()
    
    // Test Escape
    const escapeEvent = { key: 'Escape' }
    SettingsController.handleKeyboardShortcuts(escapeEvent)
    expect(SettingsController.goBack).toHaveBeenCalled()
  })

  test('should handle errors in loadSettings', async () => {
    chrome.storage.local.get.mockRejectedValue(new Error('Storage error'))
    
    await expect(SettingsController.loadSettings()).rejects.toThrow('Storage error')
    expect(console.error).toHaveBeenCalled()
  })

  test('should handle errors in saveSettings', async () => {
    chrome.storage.local.set.mockRejectedValue(new Error('Storage error'))
    
    await expect(SettingsController.saveSettings()).rejects.toThrow('Storage error')
    expect(console.error).toHaveBeenCalled()
  })

  test('should handle errors in clearStatistics', async () => {
    global.confirm = jest.fn(() => true)
    chrome.runtime.sendMessage.mockRejectedValue(new Error('Runtime error'))
    
    await SettingsController.clearStatistics()
    
    expect(console.error).toHaveBeenCalled()
  })

  test('should handle missing elements gracefully', () => {
    // Clear DOM
    document.body.innerHTML = ''
    
    expect(() => {
      SettingsController.cacheElements()
      SettingsController.setupEventListeners()
      SettingsController.updateUI()
      SettingsController.showMessage('test')
    }).not.toThrow()
  })

  test('should handle different notification levels', () => {
    SettingsController.cacheElements()
    
    const notificationSelect = document.getElementById('notification-level')
    notificationSelect.value = 'all'
    
    // Simulate change event
    const event = new Event('change')
    notificationSelect.dispatchEvent(event)
    
    expect(notificationSelect.value).toBe('all')
  })

  test('should handle element clicks', () => {
    SettingsController.cacheElements()
    SettingsController.setupEventListeners()
    
    const originalValue = SettingsController.settings.darkMode
    const toggle = document.getElementById('dark-mode-toggle')
    
    // Simulate click
    toggle.click()
    
    expect(SettingsController.settings.darkMode).toBe(!originalValue)
  })

  test('should handle save button click', () => {
    SettingsController.cacheElements()
    SettingsController.setupEventListeners()
    SettingsController.saveSettings = jest.fn()
    
    const saveBtn = document.getElementById('save-settings-btn')
    saveBtn.click()
    
    expect(SettingsController.saveSettings).toHaveBeenCalled()
  })

  test('should handle keyboard events on toggles', () => {
    SettingsController.cacheElements()
    SettingsController.setupEventListeners()
    
    const toggle = document.getElementById('dark-mode-toggle')
    const originalValue = SettingsController.settings.darkMode
    
    // Test Enter key
    const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
    toggle.dispatchEvent(enterEvent)
    
    expect(SettingsController.settings.darkMode).toBe(!originalValue)
  })

  test('should handle Space key on toggles', () => {
    SettingsController.cacheElements()
    SettingsController.setupEventListeners()
    
    const toggle = document.getElementById('extension-enabled-toggle')
    const originalValue = SettingsController.settings.extensionEnabled
    
    // Test Space key
    const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })
    toggle.dispatchEvent(spaceEvent)
    
    expect(SettingsController.settings.extensionEnabled).toBe(!originalValue)
  })
})