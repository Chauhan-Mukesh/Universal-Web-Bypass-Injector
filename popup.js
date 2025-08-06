/**
 * @file Universal Web Bypass Injector Popup Script
 * @version 2.0.0
 * @description Popup interface script with enhanced functionality,
 * error handling, and user experience improvements.
 * @license GPL-3.0
 * @author Chauhan-Mukesh
 * @since 1.0.0
 */

/**
 * @class PopupController
 * @classdesc Main controller for the popup interface.
 */
const PopupController = {
  /**
   * Current tab information.
   * @type {Object|null}
   */
  currentTab: null,

  /**
   * Current site status
   * @type {Object}
   */
  siteStatus: {
    enabled: true,
    hostname: null
  },

  /**
   * Extension statistics.
   * @type {Object}
   */
  stats: {
    blocked: 0,
    active: false,
    sessionStartTime: Date.now(),
    sitesDisabled: []
  },

  /**
   * UI element references.
   * @type {Object}
   */
  elements: {},

  /**
   * Theme configuration.
   * @type {Object}
   */
  theme: {
    current: 'light', // 'light' or 'dark'
    storageKey: 'uwb_theme_preference'
  },

  /**
   * Initializes the popup controller.
   * @public
   */
  async init() {
    try {
      this.cacheElements()
      this.setupEventListeners()
      await this.loadTheme()
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

  /**
   * Caches DOM element references for better performance.
   * @private
   */
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
      sessionTime: document.getElementById('session-time'),
      themeToggle: document.getElementById('theme-toggle')
    }
  },

  /**
   * Sets up event listeners for UI interactions.
   * @private
   */
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

      // Theme toggle
      if (this.elements.themeToggle) {
        this.elements.themeToggle.addEventListener('click', () => {
          this.toggleTheme()
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

  /**
   * Loads information about the current active tab.
   * @private
   * @returns {Promise<void>}
   */
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

  /**
   * Queries for the current active tab.
   * @private
   * @returns {Promise<Array>}
   */
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

  /**
   * Loads statistics for the current tab.
   * @private
   * @returns {Promise<void>}
   */
  async loadTabStats() {
    try {
      if (!this.currentTab || !this.currentTab.id) return

      const response = await this.sendMessage({
        action: 'getTabInfo',
        tabId: this.currentTab.id
      })

      if (response && !response.error) {
        this.stats = {
          blocked: response.totalBlocked || 0,
          active: response.bypassActive || true,
          lastActivity: response.lastActivity,
          sessionStartTime: response.sessionStartTime || Date.now()
        }
      }
    } catch (error) {
      console.log('[UWB Popup] Could not load tab stats:', error.message)
      // Don't show error to user for stats loading failures
    }
  },

  /**
   * Loads the site status (enabled/disabled) for the current hostname.
   * @private
   * @returns {Promise<void>}
   */
  async loadSiteStatus() {
    try {
      if (!this.currentTab || !this.currentTab.url) return

      const url = new URL(this.currentTab.url)
      const hostname = url.hostname
      this.siteStatus.hostname = hostname

      const response = await this.sendMessage({
        action: 'getSiteStatus',
        hostname: hostname
      })

      if (response && !response.error) {
        this.siteStatus.enabled = response.enabled !== false
      }
    } catch (error) {
      console.log('[UWB Popup] Could not load site status:', error.message)
    }
  },

  /**
   * Loads extension statistics.
   * @private
   * @returns {Promise<void>}
   */
  async loadStatistics() {
    try {
      const response = await this.sendMessage({
        action: 'getStats'
      })

      if (response && !response.error) {
        this.stats = {
          ...this.stats,
          ...response
        }
      }
    } catch (error) {
      console.log('[UWB Popup] Could not load statistics:', error.message)
    }
  },

  /**
   * Sends a message to the background script.
   * @param {Object} message - Message to send.
   * @returns {Promise<Object>}
   * @private
   */
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

  /**
   * Updates the popup UI with current information.
   * @private
   */
  updateUI() {
    try {
      this.updateCurrentUrl()
      this.updateStatus()
      this.updateSiteToggle()
      this.updateStatistics()
      this.updateVersion()
      this.addAnimations()
    } catch (error) {
      console.error('[UWB Popup] Error updating UI:', error)
    }
  },

  /**
   * Updates the current URL display.
   * @private
   */
  updateCurrentUrl() {
    try {
      if (!this.elements.currentUrl) return

      if (this.currentTab && this.currentTab.url) {
        const url = new URL(this.currentTab.url)
        this.elements.currentUrl.textContent = url.hostname
        this.elements.currentUrl.title = this.currentTab.url
      } else {
        this.elements.currentUrl.textContent = 'No active tab'
      }
    } catch (error) {
      console.error('[UWB Popup] Error updating URL:', error)
      if (this.elements.currentUrl) {
        this.elements.currentUrl.textContent = 'Invalid URL'
      }
    }
  },

  /**
   * Updates the extension status display.
   * @private
   */
  updateStatus() {
    try {
      const isActive = this.isExtensionActive() && this.siteStatus.enabled

      if (this.elements.statusDot) {
        this.elements.statusDot.style.backgroundColor = isActive ? '#48bb78' : '#e53e3e'
        this.elements.statusDot.className = isActive ? 'status-dot active' : 'status-dot inactive'
      }

      if (this.elements.statusText) {
        this.elements.statusText.textContent = isActive
          ? 'Active and protecting this page'
          : this.siteStatus.enabled ? 'Inactive on this page' : 'Disabled for this site'
      }

      // Update stats if container exists
      this.updateStatsDisplay()
    } catch (error) {
      console.error('[UWB Popup] Error updating status:', error)
    }
  },

  /**
   * Updates the site toggle switch display.
   * @private
   */
  updateSiteToggle() {
    try {
      if (!this.elements.siteToggle) return

      const isEnabled = this.siteStatus.enabled
      this.elements.siteToggle.className = isEnabled ? 'toggle-switch active' : 'toggle-switch'
      this.elements.siteToggle.setAttribute('aria-checked', isEnabled.toString())
    } catch (error) {
      console.error('[UWB Popup] Error updating site toggle:', error)
    }
  },

  /**
   * Updates the statistics display.
   * @private
   */
  updateStatistics() {
    try {
      if (!this.elements.statsSummary) return

      // Show statistics if we have meaningful data
      if (this.stats.blocked > 0 || this.stats.sessionsActive > 0) {
        this.elements.statsSummary.style.display = 'block'
        this.elements.statsSummary.classList.add('animate-fade-in')

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
    } catch (error) {
      console.error('[UWB Popup] Error updating statistics:', error)
    }
  },

  /**
   * Adds animations to UI elements.
   * @private
   */
  addAnimations() {
    try {
      // Add slide-in animation to main container
      const container = document.querySelector('.container')
      if (container) {
        container.classList.add('animate-slide-in')
      }

      // Add staggered animations to feature list items
      const featureItems = document.querySelectorAll('.feature-list li')
      featureItems.forEach((item, index) => {
        setTimeout(() => {
          item.classList.add('animate-fade-in')
        }, index * 100)
      })
    } catch (error) {
      console.error('[UWB Popup] Error adding animations:', error)
    }
  },

  /**
   * Updates the statistics display.
   * @private
   */
  updateStatsDisplay() {
    try {
      const statsContainer = this.elements.statsContainer
      if (!statsContainer) return

      if (this.stats.blocked > 0) {
        statsContainer.innerHTML = `
          <div class="stats-item">
            <strong>${this.stats.blocked}</strong> items blocked
          </div>
        `
        statsContainer.style.display = 'block'
      } else {
        statsContainer.style.display = 'none'
      }
    } catch (error) {
      console.error('[UWB Popup] Error updating stats display:', error)
    }
  },

  /**
   * Updates the version display.
   * @private
   */
  updateVersion() {
    try {
      if (this.elements.version) {
        const manifest = chrome.runtime.getManifest()
        const versionText = this.elements.version.textContent
        this.elements.version.textContent = versionText.replace('v1.0.0', `v${manifest.version}`)
      }
    } catch (error) {
      console.error('[UWB Popup] Error updating version:', error)
    }
  },

  /**
   * Determines if the extension is active on the current page.
   * @returns {boolean}
   * @private
   */
  isExtensionActive() {
    try {
      if (!this.currentTab || !this.currentTab.url) return false

      const url = new URL(this.currentTab.url)
      const protocol = url.protocol

      // Extension doesn't work on browser internal pages
      if (protocol === 'chrome:' ||
          protocol === 'about:' ||
          protocol === 'moz-extension:' ||
          protocol === 'chrome-extension:') {
        return false
      }

      return protocol === 'http:' || protocol === 'https:'
    } catch (_error) {
      return false
    }
  },

  /**
   * Opens the help page in a new tab.
   * @private
   */
  openHelpPage() {
    try {
      chrome.tabs.create({
        url: 'https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector#readme'
      })
      window.close() // Close popup after opening help
    } catch (error) {
      console.error('[UWB Popup] Error opening help page:', error)
      this.showError('Could not open help page')
    }
  },

  /**
   * Toggles the site status (enabled/disabled) for the current hostname.
   * @private
   */
  async toggleSiteStatus() {
    try {
      if (!this.siteStatus.hostname) {
        this.showError('No valid site to toggle')
        return
      }

      const newStatus = !this.siteStatus.enabled
      
      // Add visual feedback
      if (this.elements.siteToggle) {
        this.elements.siteToggle.style.opacity = '0.6'
      }

      const response = await this.sendMessage({
        action: 'setSiteStatus',
        hostname: this.siteStatus.hostname,
        enabled: newStatus
      })

      if (response && !response.error) {
        this.siteStatus.enabled = newStatus
        this.updateUI()
        
        // Show feedback message
        const message = newStatus 
          ? `Extension enabled for ${this.siteStatus.hostname}`
          : `Extension disabled for ${this.siteStatus.hostname}`
        
        this.showMessage(message, 'success')
        
        // Refresh page if disabled
        if (!newStatus && this.currentTab && this.currentTab.id) {
          setTimeout(() => {
            chrome.tabs.reload(this.currentTab.id)
          }, 1000)
        }
      } else {
        throw new Error(response?.error || 'Failed to toggle site status')
      }
    } catch (error) {
      console.error('[UWB Popup] Error toggling site status:', error)
      this.showError('Failed to toggle site status')
    } finally {
      // Restore visual feedback
      if (this.elements.siteToggle) {
        this.elements.siteToggle.style.opacity = '1'
      }
    }
  },

  /**
   * Opens the detailed statistics page.
   * @private
   */
  openStatisticsPage() {
    try {
      chrome.tabs.create({
        url: chrome.runtime.getURL('statistics.html')
      })
      window.close() // Close popup after opening statistics
    } catch (error) {
      console.error('[UWB Popup] Error opening statistics page:', error)
      this.showError('Could not open statistics page')
    }
  },

  /**
   * Shows a success message to the user.
   * @param {string} message - Message to display.
   * @param {string} type - Message type ('success', 'info', 'warning').
   * @private
   */
  showMessage(message, type = 'info') {
    try {
      let messageContainer = document.getElementById('message-container')

      if (!messageContainer) {
        messageContainer = document.createElement('div')
        messageContainer.id = 'message-container'
        messageContainer.style.cssText = `
          background: ${type === 'success' ? '#d4edda' : '#d1ecf1'};
          border: 1px solid ${type === 'success' ? '#c3e6cb' : '#bee5eb'};
          color: ${type === 'success' ? '#155724' : '#0c5460'};
          border-radius: 4px;
          padding: 8px;
          margin: 8px 0;
          font-size: 12px;
          display: none;
        `

        const container = document.querySelector('.container')
        if (container) {
          container.insertBefore(messageContainer, container.firstChild)
        }
      }

      messageContainer.textContent = message
      messageContainer.style.display = 'block'

      // Auto-hide message after 3 seconds
      setTimeout(() => {
        if (messageContainer.style.display === 'block') {
          messageContainer.style.display = 'none'
        }
      }, 3000)
    } catch (error) {
      console.error('[UWB Popup] Error showing message:', error)
    }
  },

  /**
   * Refreshes the current tab information.
   * @private
   */
  async refreshCurrentTab() {
    try {
      if (this.elements.refreshButton) {
        this.elements.refreshButton.textContent = 'Refreshing...'
        this.elements.refreshButton.disabled = true
      }

      await this.loadCurrentTab()
      await this.loadSiteStatus()
      await this.loadStatistics()
      this.updateUI()

      if (this.elements.refreshButton) {
        this.elements.refreshButton.textContent = 'Refresh'
        this.elements.refreshButton.disabled = false
      }
    } catch (error) {
      console.error('[UWB Popup] Error refreshing tab:', error)
      this.showError('Failed to refresh tab information')

      if (this.elements.refreshButton) {
        this.elements.refreshButton.textContent = 'Refresh'
        this.elements.refreshButton.disabled = false
      }
    }
  },

  /**
   * Toggles the bypass functionality for the current tab.
   * @private
   */
  async toggleBypass() {
    try {
      if (!this.currentTab || !this.currentTab.id) {
        this.showError('No active tab to toggle bypass')
        return
      }

      await this.sendMessage({
        action: 'executeBypass',
        tabId: this.currentTab.id
      })

      // Refresh the tab to apply changes
      chrome.tabs.reload(this.currentTab.id)

      // Update UI after a short delay
      setTimeout(() => {
        this.loadCurrentTab().then(() => this.updateUI())
      }, 1000)
    } catch (error) {
      console.error('[UWB Popup] Error toggling bypass:', error)
      this.showError('Failed to toggle bypass')
    }
  },

  /**
   * Handles keyboard shortcuts.
   * @param {KeyboardEvent} event - Keyboard event.
   * @private
   */
  handleKeyboardShortcuts(event) {
    try {
      switch (event.key) {
        case 'r':
        case 'R':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.refreshCurrentTab()
          }
          break
        case 'h':
        case 'H':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            this.openHelpPage()
          }
          break
        case 'Escape':
          window.close()
          break
      }
    } catch (error) {
      console.error('[UWB Popup] Error handling keyboard shortcut:', error)
    }
  },

  /**
   * Shows an error message to the user.
   * @param {string} message - Error message to display.
   * @private
   */
  showError(message) {
    try {
      let errorContainer = this.elements.errorContainer

      if (!errorContainer) {
        // Create error container if it doesn't exist
        errorContainer = document.createElement('div')
        errorContainer.id = 'error-container'
        errorContainer.className = 'error-message'
        errorContainer.style.cssText = `
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 4px;
          color: #c33;
          padding: 8px;
          margin: 8px 0;
          font-size: 12px;
          display: none;
        `

        const firstChild = document.body.firstChild
        if (firstChild) {
          document.body.insertBefore(errorContainer, firstChild)
        } else {
          document.body.appendChild(errorContainer)
        }

        this.elements.errorContainer = errorContainer
      }

      errorContainer.textContent = message
      errorContainer.style.display = 'block'

      // Auto-hide error after 5 seconds
      setTimeout(() => {
        if (errorContainer.style.display === 'block') {
          errorContainer.style.display = 'none'
        }
      }, 5000)
    } catch (error) {
      console.error('[UWB Popup] Error showing error message:', error)
    }
  },

  /**
   * Loads the saved theme preference and applies it.
   * @private
   * @returns {Promise<void>}
   */
  async loadTheme() {
    try {
      const result = await chrome.storage.sync.get([this.theme.storageKey])
      const savedTheme = result[this.theme.storageKey] || 'light'
      this.theme.current = savedTheme
      this.applyTheme(savedTheme)
    } catch (error) {
      console.error('[UWB Popup] Error loading theme:', error)
      // Default to light theme
      this.applyTheme('light')
    }
  },

  /**
   * Toggles between light and dark themes.
   * @public
   */
  toggleTheme() {
    const newTheme = this.theme.current === 'light' ? 'dark' : 'light'
    this.theme.current = newTheme
    this.applyTheme(newTheme)
    this.saveTheme(newTheme)
  },

  /**
   * Applies the specified theme to the popup.
   * @param {string} theme - Theme to apply ('light' or 'dark')
   * @private
   */
  applyTheme(theme) {
    const body = document.body
    const themeToggle = this.elements.themeToggle
    
    if (theme === 'dark') {
      body.classList.add('dark-mode')
      if (themeToggle) themeToggle.textContent = '☀️'
    } else {
      body.classList.remove('dark-mode')
      if (themeToggle) themeToggle.textContent = '🌙'
    }
  },

  /**
   * Saves the theme preference to storage.
   * @param {string} theme - Theme to save
   * @private
   */
  async saveTheme(theme) {
    try {
      await chrome.storage.sync.set({ [this.theme.storageKey]: theme })
    } catch (error) {
      console.error('[UWB Popup] Error saving theme:', error)
    }
  },

  /**
   * Cleanup method for proper resource disposal.
   * @public
   */
  destroy() {
    try {
      // Remove event listeners if needed
      console.log('[UWB Popup] Popup controller destroyed')
    } catch (error) {
      console.error('[UWB Popup] Error during cleanup:', error)
    }
  }
}

// Initialize popup when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    PopupController.init().catch(error => {
      console.error('[UWB Popup] Failed to initialize:', error)
    })
  })
}

// Handle popup unload - wrap in safety check for testing
if (typeof window !== 'undefined' && window.addEventListener) {
  window.addEventListener('beforeunload', () => {
    PopupController.destroy()
  })
}

// Make PopupController available globally for testing
if (typeof window !== 'undefined') {
  window.PopupController = PopupController
}
