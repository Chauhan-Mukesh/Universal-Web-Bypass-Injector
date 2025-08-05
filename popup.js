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
   * Extension statistics.
   * @type {Object}
   */
  stats: {
    blocked: 0,
    active: false
  },

  /**
   * UI element references.
   * @type {Object}
   */
  elements: {},

  /**
   * Initializes the popup controller.
   * @public
   */
  async init() {
    try {
      this.cacheElements()
      this.setupEventListeners()
      await this.loadCurrentTab()
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
      toggleButton: document.getElementById('toggle-button')
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
          lastActivity: response.lastActivity
        }
      }
    } catch (error) {
      console.log('[UWB Popup] Could not load tab stats:', error.message)
      // Don't show error to user for stats loading failures
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
      this.updateVersion()
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
      const isActive = this.isExtensionActive()

      if (this.elements.statusDot) {
        this.elements.statusDot.style.backgroundColor = isActive ? '#48bb78' : '#e53e3e'
      }

      if (this.elements.statusText) {
        this.elements.statusText.textContent = isActive
          ? 'Active and protecting this page'
          : 'Inactive on this page'
      }

      // Update stats if container exists
      this.updateStatsDisplay()
    } catch (error) {
      console.error('[UWB Popup] Error updating status:', error)
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
document.addEventListener('DOMContentLoaded', () => {
  PopupController.init().catch(error => {
    console.error('[UWB Popup] Failed to initialize:', error)
  })
})

// Handle popup unload
window.addEventListener('beforeunload', () => {
  PopupController.destroy()
})

// Make PopupController available globally for testing
if (typeof window !== 'undefined') {
  window.PopupController = PopupController
}
