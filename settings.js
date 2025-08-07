/**
 * @file Settings Page Controller
 * @version 1.0.0
 * @description Settings page functionality for Universal Web Bypass Injector
 * @license GPL-3.0
 * @author Chauhan-Mukesh
 */

/**
 * @class SettingsController
 * @classdesc Main controller for the settings page
 */
const SettingsController = {
  /**
   * Settings configuration
   * @type {Object}
   */
  settings: {
    darkMode: false,
    extensionEnabled: true,
    notificationLevel: 'important',
    aggressiveBlocking: true,
    blockAnalytics: true,
    blockSocial: true
  },

  /**
   * UI element references
   * @type {Object}
   */
  elements: {},

  /**
   * Initializes the settings controller
   * @public
   */
  async init() {
    try {
      this.cacheElements()
      this.setupEventListeners()
      await this.loadSettings()
      this.updateUI()
      console.log('[UWB Settings] Initialized successfully')
    } catch (error) {
      console.error('[UWB Settings] Initialization error:', error)
      this.showMessage('Failed to initialize settings', 'error')
    }
  },

  /**
   * Caches DOM element references
   * @private
   */
  cacheElements() {
    this.elements = {
      // Controls
      darkModeToggle: document.getElementById('dark-mode-toggle'),
      extensionEnabledToggle: document.getElementById('extension-enabled-toggle'),
      notificationLevel: document.getElementById('notification-level'),
      aggressiveBlockingToggle: document.getElementById('aggressive-blocking-toggle'),
      blockAnalyticsToggle: document.getElementById('block-analytics-toggle'),
      blockSocialToggle: document.getElementById('block-social-toggle'),
      
      // Actions
      saveSettingsBtn: document.getElementById('save-settings-btn'),
      cancelBtn: document.getElementById('cancel-btn'),
      clearStatsBtn: document.getElementById('clear-stats-btn'),
      resetSettingsBtn: document.getElementById('reset-settings-btn'),
      backLink: document.getElementById('back-link'),
      
      // Status
      statusMessage: document.getElementById('status-message')
    }
  },

  /**
   * Sets up event listeners
   * @private
   */
  setupEventListeners() {
    try {
      // Toggle switches
      const toggles = [
        { element: this.elements.darkModeToggle, setting: 'darkMode' },
        { element: this.elements.extensionEnabledToggle, setting: 'extensionEnabled' },
        { element: this.elements.aggressiveBlockingToggle, setting: 'aggressiveBlocking' },
        { element: this.elements.blockAnalyticsToggle, setting: 'blockAnalytics' },
        { element: this.elements.blockSocialToggle, setting: 'blockSocial' }
      ]

      toggles.forEach(({ element, setting }) => {
        if (element) {
          element.addEventListener('click', () => {
            this.toggleSetting(setting)
          })
          
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              this.toggleSetting(setting)
            }
          })
        }
      })

      // Notification level select
      if (this.elements.notificationLevel) {
        this.elements.notificationLevel.addEventListener('change', (e) => {
          this.settings.notificationLevel = e.target.value
        })
      }

      // Action buttons
      if (this.elements.saveSettingsBtn) {
        this.elements.saveSettingsBtn.addEventListener('click', () => {
          this.saveSettings()
        })
      }

      if (this.elements.cancelBtn) {
        this.elements.cancelBtn.addEventListener('click', () => {
          this.loadSettings()
        })
      }

      if (this.elements.clearStatsBtn) {
        this.elements.clearStatsBtn.addEventListener('click', () => {
          this.clearStatistics()
        })
      }

      if (this.elements.resetSettingsBtn) {
        this.elements.resetSettingsBtn.addEventListener('click', () => {
          this.resetSettings()
        })
      }

      if (this.elements.backLink) {
        this.elements.backLink.addEventListener('click', (e) => {
          e.preventDefault()
          this.goBack()
        })
      }

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        this.handleKeyboardShortcuts(e)
      })

      console.log('[UWB Settings] Event listeners setup complete')
    } catch (error) {
      console.error('[UWB Settings] Error setting up event listeners:', error)
    }
  },

  /**
   * Loads settings from storage
   * @private
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get([
        'uwb_settings',
        'uwb_theme_preference'
      ])

      if (result.uwb_settings) {
        this.settings = { ...this.settings, ...result.uwb_settings }
      }

      // Load theme preference
      if (result.uwb_theme_preference) {
        this.settings.darkMode = result.uwb_theme_preference === 'dark'
      }

      console.log('[UWB Settings] Settings loaded')
    } catch (error) {
      console.error('[UWB Settings] Error loading settings:', error)
      this.showMessage('Failed to load settings', 'error')
      throw error
    }
  },

  /**
   * Saves settings to storage
   * @private
   */
  async saveSettings() {
    try {
      // Show saving feedback
      if (this.elements.saveSettingsBtn) {
        this.elements.saveSettingsBtn.textContent = 'Saving...'
        this.elements.saveSettingsBtn.disabled = true
      }

      await chrome.storage.sync.set({
        uwb_settings: this.settings,
        uwb_theme_preference: this.settings.darkMode ? 'dark' : 'light'
      })

      this.showMessage('Settings saved successfully', 'success')
      
      // Reset button
      if (this.elements.saveSettingsBtn) {
        this.elements.saveSettingsBtn.textContent = 'Save Settings'
        this.elements.saveSettingsBtn.disabled = false
      }

      console.log('[UWB Settings] Settings saved')
    } catch (error) {
      console.error('[UWB Settings] Error saving settings:', error)
      this.showMessage('Failed to save settings', 'error')
      
      // Reset button
      if (this.elements.saveSettingsBtn) {
        this.elements.saveSettingsBtn.textContent = 'Save Settings'
        this.elements.saveSettingsBtn.disabled = false
      }
      throw error
    }
  },

  /**
   * Toggles a boolean setting
   * @param {string} settingName - Name of the setting to toggle
   * @private
   */
  toggleSetting(settingName) {
    // Only toggle if the setting is boolean
    if (typeof this.settings[settingName] === 'boolean') {
      this.settings[settingName] = !this.settings[settingName]
      this.updateUI()
      
      // Apply dark mode immediately
      if (settingName === 'darkMode') {
        this.applyTheme()
      }
    }
  },

  /**
   * Updates the UI to reflect current settings
   * @private
   */
  updateUI() {
    try {
      // Update toggles
      const toggleMappings = [
        { element: this.elements.darkModeToggle, setting: 'darkMode' },
        { element: this.elements.extensionEnabledToggle, setting: 'extensionEnabled' },
        { element: this.elements.aggressiveBlockingToggle, setting: 'aggressiveBlocking' },
        { element: this.elements.blockAnalyticsToggle, setting: 'blockAnalytics' },
        { element: this.elements.blockSocialToggle, setting: 'blockSocial' }
      ]

      toggleMappings.forEach(({ element, setting }) => {
        if (element) {
          const isActive = this.settings[setting]
          element.className = isActive ? 'toggle-switch active' : 'toggle-switch'
          element.setAttribute('aria-checked', isActive.toString())
        }
      })

      // Update notification level
      if (this.elements.notificationLevel) {
        this.elements.notificationLevel.value = this.settings.notificationLevel
      }

      // Apply theme
      this.applyTheme()
    } catch (error) {
      console.error('[UWB Settings] Error updating UI:', error)
    }
  },

  /**
   * Applies the current theme
   * @private
   */
  applyTheme() {
    if (this.settings.darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  },

  /**
   * Clears statistics
   * @private
   */
  async clearStatistics() {
    try {
      if (confirm('Are you sure you want to clear all statistics? This action cannot be undone.')) {
        await chrome.storage.sync.remove(['uwb_statistics'])
        
        // Notify background script to clear statistics
        chrome.runtime.sendMessage({
          action: 'clearStatistics'
        })

        this.showMessage('Statistics cleared successfully', 'success')
      }
    } catch (error) {
      console.error('[UWB Settings] Error clearing statistics:', error)
      this.showMessage('Failed to clear statistics', 'error')
    }
  },

  /**
   * Resets all settings to defaults
   * @private
   */
  async resetSettings() {
    try {
      if (confirm('Are you sure you want to reset all settings to defaults? This will clear your current configuration.')) {
        // Reset to default settings
        this.settings = {
          darkMode: false,
          extensionEnabled: true,
          notificationLevel: 'important',
          aggressiveBlocking: true,
          blockAnalytics: true,
          blockSocial: true
        }

        await this.saveSettings()
        this.updateUI()
        this.showMessage('Settings reset to defaults', 'success')
      }
    } catch (error) {
      console.error('[UWB Settings] Error resetting settings:', error)
      this.showMessage('Failed to reset settings', 'error')
    }
  },

  /**
   * Goes back to the extension popup
   * @private
   */
  goBack() {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.close()
    }
  },

  /**
   * Shows a status message
   * @param {string} message - Message to show
   * @param {string} type - Message type ('success' or 'error')
   * @private
   */
  showMessage(message, type = 'success') {
    try {
      const messageElement = this.elements.statusMessage
      if (!messageElement) return

      messageElement.textContent = message
      messageElement.className = `status-message ${type}`
      messageElement.style.display = 'block'

      // Auto-hide after 5 seconds
      setTimeout(() => {
        messageElement.style.display = 'none'
      }, 5000)
    } catch (error) {
      console.error('[UWB Settings] Error showing message:', error)
    }
  },

  /**
   * Handles keyboard shortcuts
   * @param {KeyboardEvent} event - Keyboard event
   * @private
   */
  handleKeyboardShortcuts(event) {
    try {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
          case 'S':
            event.preventDefault()
            this.saveSettings()
            break
          case 'r':
          case 'R':
            event.preventDefault()
            this.resetSettings()
            break
          case 'z':
          case 'Z':
            event.preventDefault()
            this.loadSettings()
            break
        }
      }

      if (event.key === 'Escape') {
        this.goBack()
      }
    } catch (error) {
      console.error('[UWB Settings] Error handling keyboard shortcut:', error)
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  SettingsController.init()
})

// Make SettingsController available globally for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SettingsController
} else if (typeof window !== 'undefined') {
  window.SettingsController = SettingsController
}