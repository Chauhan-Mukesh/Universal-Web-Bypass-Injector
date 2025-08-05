/**
 * @file Universal Web Bypass Injector Background Service Worker
 * @version 2.0.0
 * @description Background script that handles extension lifecycle,
 * context menus, and communication with content scripts.
 * @license GPL-3.0
 * @author Chauhan-Mukesh
 * @since 1.0.0
 */

/**
 * @class BackgroundService
 * @classdesc Main background service class for the extension.
 */
const BackgroundService = {
  /**
   * Extension statistics.
   * @type {Object}
   */
  stats: {
    sessionsActive: 0,
    totalBlocked: 0,
    lastActivity: null
  },

  /**
   * Active tab information.
   * @type {Map<number, Object>}
   */
  activeTabs: new Map(),

  /**
   * Initializes the background service.
   * @public
   */
  init() {
    this.setupEventListeners()
    this.setupContextMenu()
    console.log('[UWB Background] Service initialized successfully')
  },

  /**
   * Sets up all event listeners for the extension.
   * @private
   */
  setupEventListeners() {
    try {
      // Handle extension installation and updates
      chrome.runtime.onInstalled.addListener((details) => {
        this.handleInstallation(details)
      })

      // Handle extension icon clicks
      chrome.action.onClicked.addListener((tab) => {
        this.handleActionClick(tab)
      })

      // Listen for messages from content scripts and popup
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse)
        return true // Keep message channel open for async responses
      })

      // Handle tab updates
      chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        this.handleTabUpdate(tabId, changeInfo, tab)
      })

      // Handle tab removal
      chrome.tabs.onRemoved.addListener((tabId) => {
        this.handleTabRemoval(tabId)
      })

      console.log('[UWB Background] Event listeners setup complete')
    } catch (error) {
      console.error('[UWB Background] Error setting up event listeners:', error)
    }
  },

  /**
   * Handles extension installation and updates.
   * @param {Object} details - Installation details.
   * @private
   */
  handleInstallation(details) {
    try {
      const version = chrome.runtime.getManifest().version

      switch (details.reason) {
        case 'install':
          console.log(`[UWB Background] Extension installed successfully v${version}`)
          this.showWelcomeNotification()
          break
        case 'update':
          console.log(`[UWB Background] Extension updated to v${version}`)
          this.handleUpdate(details.previousVersion, version)
          break
        case 'chrome_update':
          console.log('[UWB Background] Chrome browser updated')
          break
        case 'shared_module_update':
          console.log('[UWB Background] Shared module updated')
          break
      }
    } catch (error) {
      console.error('[UWB Background] Error handling installation:', error)
    }
  },

  /**
   * Shows welcome notification for new installations.
   * @private
   */
  showWelcomeNotification() {
    try {
      if (chrome.notifications) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Universal Web Bypass Injector',
          message: 'Extension installed! Your browsing experience is now enhanced with ad and paywall blocking.'
        })
      }
    } catch (error) {
      // Silently handle notification errors
      console.log('[UWB Background] Notifications not available')
    }
  },

  /**
   * Handles extension updates.
   * @param {string} previousVersion - Previous version number.
   * @param {string} currentVersion - Current version number.
   * @private
   */
  handleUpdate(previousVersion, currentVersion) {
    try {
      console.log(`[UWB Background] Updated from v${previousVersion} to v${currentVersion}`)

      // Reset statistics on major updates
      if (this.isMajorUpdate(previousVersion, currentVersion)) {
        this.resetStats()
      }
    } catch (error) {
      console.error('[UWB Background] Error handling update:', error)
    }
  },

  /**
   * Determines if this is a major version update.
   * @param {string} prev - Previous version.
   * @param {string} curr - Current version.
   * @returns {boolean} True if major update.
   * @private
   */
  isMajorUpdate(prev, curr) {
    try {
      const prevMajor = parseInt(prev.split('.')[0], 10)
      const currMajor = parseInt(curr.split('.')[0], 10)
      return currMajor > prevMajor
    } catch (error) {
      return false
    }
  },

  /**
   * Handles extension action (icon) clicks.
   * @param {Object} tab - Tab object.
   * @private
   */
  handleActionClick(tab) {
    try {
      console.log(`[UWB Background] Extension icon clicked for tab: ${tab.url}`)

      // The popup will handle the interaction, but we can add additional logic here
      this.updateTabInfo(tab.id, { lastClicked: Date.now() })
    } catch (error) {
      console.error('[UWB Background] Error handling action click:', error)
    }
  },

  /**
   * Handles messages from content scripts and popup.
   * @param {Object} request - Message request object.
   * @param {Object} sender - Message sender information.
   * @param {Function} sendResponse - Response callback function.
   * @private
   */
  handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getTabInfo':
          this.handleGetTabInfo(sender, sendResponse)
          break
        case 'bypassStatus':
          this.handleBypassStatus(request, sender, sendResponse)
          break
        case 'getStats':
          sendResponse(this.getStats())
          break
        case 'resetStats':
          this.resetStats()
          sendResponse({ success: true })
          break
        case 'executeBypass':
          this.executeBypassOnTab(sender.tab?.id || request.tabId)
          sendResponse({ success: true })
          break
        default:
          console.log(`[UWB Background] Unknown message action: ${request.action}`)
          sendResponse({ error: 'Unknown action' })
      }
    } catch (error) {
      console.error('[UWB Background] Error handling message:', error)
      sendResponse({ error: error.message })
    }
  },

  /**
   * Handles tab information requests.
   * @param {Object} sender - Message sender.
   * @param {Function} sendResponse - Response callback.
   * @private
   */
  handleGetTabInfo(sender, sendResponse) {
    try {
      const tabInfo = {
        url: sender.tab?.url || 'unknown',
        title: sender.tab?.title || 'unknown',
        id: sender.tab?.id || -1,
        timestamp: Date.now()
      }

      if (sender.tab?.id) {
        this.updateTabInfo(sender.tab.id, tabInfo)
      }

      sendResponse(tabInfo)
    } catch (error) {
      console.error('[UWB Background] Error getting tab info:', error)
      sendResponse({ error: error.message })
    }
  },

  /**
   * Handles bypass status updates from content scripts.
   * @param {Object} request - Request object.
   * @param {Object} sender - Message sender.
   * @param {Function} sendResponse - Response callback.
   * @private
   */
  handleBypassStatus(request, sender, sendResponse) {
    try {
      const tabId = sender.tab?.id
      const url = request.url || sender.tab?.url

      console.log(`[UWB Background] Bypass applied on: ${url}`)

      if (tabId) {
        this.updateTabInfo(tabId, {
          bypassActive: true,
          lastBypassTime: Date.now(),
          url
        })
      }

      this.stats.totalBlocked += request.blockedCount || 1
      this.stats.lastActivity = Date.now()

      sendResponse({ success: true, stats: this.getStats() })
    } catch (error) {
      console.error('[UWB Background] Error handling bypass status:', error)
      sendResponse({ error: error.message })
    }
  },

  /**
   * Updates tab information in memory.
   * @param {number} tabId - Tab ID.
   * @param {Object} info - Information to update.
   * @private
   */
  updateTabInfo(tabId, info) {
    try {
      const existing = this.activeTabs.get(tabId) || {}
      this.activeTabs.set(tabId, { ...existing, ...info })
    } catch (error) {
      console.error('[UWB Background] Error updating tab info:', error)
    }
  },

  /**
   * Handles tab updates.
   * @param {number} tabId - Tab ID.
   * @param {Object} changeInfo - Change information.
   * @param {Object} tab - Tab object.
   * @private
   */
  handleTabUpdate(tabId, changeInfo, tab) {
    try {
      if (changeInfo.status === 'complete' && tab.url) {
        this.updateTabInfo(tabId, {
          url: tab.url,
          title: tab.title,
          loadComplete: true,
          lastUpdated: Date.now()
        })

        // Check if this is a supported URL
        if (this.isSupportedUrl(tab.url)) {
          this.stats.sessionsActive++
        }
      }
    } catch (error) {
      console.error('[UWB Background] Error handling tab update:', error)
    }
  },

  /**
   * Handles tab removal.
   * @param {number} tabId - Tab ID.
   * @private
   */
  handleTabRemoval(tabId) {
    try {
      if (this.activeTabs.has(tabId)) {
        this.activeTabs.delete(tabId)
        this.stats.sessionsActive = Math.max(0, this.stats.sessionsActive - 1)
      }
    } catch (error) {
      console.error('[UWB Background] Error handling tab removal:', error)
    }
  },

  /**
   * Checks if a URL is supported by the extension.
   * @param {string} url - URL to check.
   * @returns {boolean} True if supported.
   * @private
   */
  isSupportedUrl(url) {
    try {
      if (!url) return false

      const protocol = new URL(url).protocol
      return protocol === 'http:' || protocol === 'https:'
    } catch (error) {
      return false
    }
  },

  /**
   * Sets up context menu for the extension.
   * @private
   */
  setupContextMenu() {
    try {
      chrome.contextMenus.create({
        id: 'bypassPage',
        title: 'Bypass restrictions on this page',
        contexts: ['page'],
        documentUrlPatterns: ['http://*/*', 'https://*/*']
      })

      chrome.contextMenus.create({
        id: 'separator1',
        type: 'separator',
        contexts: ['page']
      })

      chrome.contextMenus.create({
        id: 'openPopup',
        title: 'Open Universal Bypass settings',
        contexts: ['page']
      })

      chrome.contextMenus.onClicked.addListener((info, tab) => {
        this.handleContextMenuClick(info, tab)
      })

      console.log('[UWB Background] Context menu setup complete')
    } catch (error) {
      console.error('[UWB Background] Error setting up context menu:', error)
    }
  },

  /**
   * Handles context menu clicks.
   * @param {Object} info - Click information.
   * @param {Object} tab - Tab object.
   * @private
   */
  handleContextMenuClick(info, tab) {
    try {
      switch (info.menuItemId) {
        case 'bypassPage':
          this.executeBypassOnTab(tab.id)
          break
        case 'openPopup':
          chrome.action.openPopup()
          break
        default:
          console.log(`[UWB Background] Unknown context menu item: ${info.menuItemId}`)
      }
    } catch (error) {
      console.error('[UWB Background] Error handling context menu click:', error)
    }
  },

  /**
   * Manually executes bypass script on a specific tab.
   * @param {number} tabId - Tab ID.
   * @private
   */
  executeBypassOnTab(tabId) {
    try {
      if (!tabId || tabId < 0) {
        console.error('[UWB Background] Invalid tab ID for script execution')
        return
      }

      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      }).then(() => {
        console.log(`[UWB Background] Bypass script executed on tab ${tabId}`)
      }).catch((error) => {
        console.error(`[UWB Background] Failed to execute script on tab ${tabId}:`, error)
      })
    } catch (error) {
      console.error('[UWB Background] Error executing bypass on tab:', error)
    }
  },

  /**
   * Gets current extension statistics.
   * @returns {Object} Statistics object.
   * @public
   */
  getStats() {
    return {
      ...this.stats,
      activeTabsCount: this.activeTabs.size,
      uptime: Date.now() - (this.stats.startTime || Date.now())
    }
  },

  /**
   * Resets extension statistics.
   * @public
   */
  resetStats() {
    this.stats = {
      sessionsActive: 0,
      totalBlocked: 0,
      lastActivity: null,
      startTime: Date.now()
    }
    console.log('[UWB Background] Statistics reset')
  }
}

// Initialize the background service
try {
  BackgroundService.init()
} catch (error) {
  console.error('[UWB Background] Failed to initialize background service:', error)
}

// Expose BackgroundService for testing
if (typeof global !== 'undefined') {
  global.BackgroundService = BackgroundService
}
