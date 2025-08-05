/**
 * @file Universal Web Bypass Injector Statistics Page Script
 * @version 2.0.0
 * @description Statistics page functionality for detailed analytics
 * @license GPL-3.0
 * @author Chauhan-Mukesh
 * @since 2.0.0
 */

/**
 * @class StatisticsController
 * @classdesc Main controller for the statistics page.
 */
const StatisticsController = {
  /**
   * Statistics data.
   * @type {Object}
   */
  data: null,

  /**
   * UI element references.
   * @type {Object}
   */
  elements: {},

  /**
   * Auto-refresh interval.
   * @type {number|null}
   */
  refreshInterval: null,

  /**
   * Initializes the statistics controller.
   * @public
   */
  async init() {
    try {
      this.cacheElements()
      this.setupEventListeners()
      await this.loadStatistics()
      this.setupAutoRefresh()
      console.log('[UWB Statistics] Initialized successfully')
    } catch (error) {
      console.error('[UWB Statistics] Initialization error:', error)
      this.showError('Failed to initialize statistics page')
    }
  },

  /**
   * Caches DOM element references for better performance.
   * @private
   */
  cacheElements() {
    this.elements = {
      loadingState: document.getElementById('loading-state'),
      statsContent: document.getElementById('stats-content'),
      refreshBtn: document.getElementById('refresh-btn'),
      exportBtn: document.getElementById('export-btn'),
      resetBtn: document.getElementById('reset-btn'),
      
      // Overview stats
      totalBlocked: document.getElementById('total-blocked'),
      todayBlocked: document.getElementById('today-blocked'),
      weekBlocked: document.getElementById('week-blocked'),
      activeTabs: document.getElementById('active-tabs'),
      disabledSites: document.getElementById('disabled-sites'),
      uptime: document.getElementById('uptime'),
      
      // Charts and tables
      typeChart: document.getElementById('type-chart'),
      sitesTable: document.getElementById('sites-table'),
      activityTable: document.getElementById('activity-table'),
      disabledSitesTable: document.getElementById('disabled-sites-table')
    }
  },

  /**
   * Sets up event listeners for UI interactions.
   * @private
   */
  setupEventListeners() {
    try {
      // Refresh button
      if (this.elements.refreshBtn) {
        this.elements.refreshBtn.addEventListener('click', () => {
          this.refreshData()
        })
      }

      // Export button
      if (this.elements.exportBtn) {
        this.elements.exportBtn.addEventListener('click', () => {
          this.exportData()
        })
      }

      // Reset button
      if (this.elements.resetBtn) {
        this.elements.resetBtn.addEventListener('click', () => {
          this.resetStatistics()
        })
      }

      console.log('[UWB Statistics] Event listeners setup complete')
    } catch (error) {
      console.error('[UWB Statistics] Error setting up event listeners:', error)
    }
  },

  /**
   * Loads statistics data from the background script.
   * @private
   * @returns {Promise<void>}
   */
  async loadStatistics() {
    try {
      const response = await this.sendMessage({
        action: 'getDetailedStats'
      })

      if (response && !response.error) {
        this.data = response
        this.updateUI()
        this.showContent()
      } else {
        throw new Error(response?.error || 'Failed to load statistics')
      }
    } catch (error) {
      console.error('[UWB Statistics] Error loading statistics:', error)
      this.showError('Failed to load statistics data')
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
   * Updates the UI with current statistics data.
   * @private
   */
  updateUI() {
    try {
      this.updateOverviewStats()
      this.updateTypeChart()
      this.updateSitesTable()
      this.updateActivityTable()
      this.updateDisabledSitesTable()
      this.addAnimations()
    } catch (error) {
      console.error('[UWB Statistics] Error updating UI:', error)
    }
  },

  /**
   * Updates the overview statistics cards.
   * @private
   */
  updateOverviewStats() {
    try {
      if (this.elements.totalBlocked) {
        this.elements.totalBlocked.textContent = this.formatNumber(this.data.total || 0)
      }
      
      if (this.elements.todayBlocked) {
        this.elements.todayBlocked.textContent = this.formatNumber(this.data.today || 0)
      }
      
      if (this.elements.weekBlocked) {
        this.elements.weekBlocked.textContent = this.formatNumber(this.data.week || 0)
      }
      
      if (this.elements.activeTabs) {
        this.elements.activeTabs.textContent = this.data.activeTabs || 0
      }
      
      if (this.elements.disabledSites) {
        this.elements.disabledSites.textContent = (this.data.disabledSites || []).length
      }
      
      if (this.elements.uptime) {
        const uptimeMs = this.data.uptime || 0
        const uptimeMinutes = Math.floor(uptimeMs / 60000)
        this.elements.uptime.textContent = this.formatDuration(uptimeMinutes)
      }
    } catch (error) {
      console.error('[UWB Statistics] Error updating overview stats:', error)
    }
  },

  /**
   * Updates the blocked by type chart.
   * @private
   */
  updateTypeChart() {
    try {
      if (!this.elements.typeChart) return

      const byType = this.data.byType || {}
      const types = Object.entries(byType).sort(([,a], [,b]) => b - a)
      
      if (types.length === 0) {
        this.elements.typeChart.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📊</div>
            <p>No blocked items by type yet</p>
          </div>
        `
        return
      }

      const maxValue = Math.max(...types.map(([,value]) => value))
      
      this.elements.typeChart.innerHTML = types.map(([type, count]) => {
        const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0
        return `
          <div class="bar-item">
            <div class="bar-label">${this.capitalizeFirst(type)}</div>
            <div class="bar-visual">
              <div class="bar-fill" style="width: ${percentage}%"></div>
            </div>
            <div class="bar-value">${this.formatNumber(count)}</div>
          </div>
        `
      }).join('')
    } catch (error) {
      console.error('[UWB Statistics] Error updating type chart:', error)
    }
  },

  /**
   * Updates the top blocked sites table.
   * @private
   */
  updateSitesTable() {
    try {
      if (!this.elements.sitesTable) return

      const topSites = this.data.topSites || []
      
      if (topSites.length === 0) {
        this.elements.sitesTable.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 20px; color: #64748b;">
              No sites with blocked content yet
            </td>
          </tr>
        `
        return
      }

      this.elements.sitesTable.innerHTML = topSites.map(([hostname, stats]) => {
        const lastActivity = stats.lastActivity ? new Date(stats.lastActivity).toLocaleDateString() : 'Never'
        const isDisabled = (this.data.disabledSites || []).includes(hostname)
        
        return `
          <tr>
            <td>
              <strong>${hostname}</strong>
            </td>
            <td>${this.formatNumber(stats.blocked)}</td>
            <td>${lastActivity}</td>
            <td>
              <span class="tag ${isDisabled ? 'error' : 'success'}">
                ${isDisabled ? 'Disabled' : 'Active'}
              </span>
            </td>
          </tr>
        `
      }).join('')
    } catch (error) {
      console.error('[UWB Statistics] Error updating sites table:', error)
    }
  },

  /**
   * Updates the recent activity table.
   * @private
   */
  updateActivityTable() {
    try {
      if (!this.elements.activityTable) return

      const recentBlocked = this.data.recentBlocked || []
      
      if (recentBlocked.length === 0) {
        this.elements.activityTable.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 20px; color: #64748b;">
              No recent activity
            </td>
          </tr>
        `
        return
      }

      this.elements.activityTable.innerHTML = recentBlocked.slice(0, 20).map(item => {
        const time = new Date(item.timestamp).toLocaleTimeString()
        const hostname = item.hostname || 'Unknown'
        const type = item.type || 'unknown'
        const url = item.url || ''
        const shortUrl = url.length > 50 ? url.substring(0, 50) + '...' : url
        
        return `
          <tr>
            <td>${time}</td>
            <td><strong>${hostname}</strong></td>
            <td>
              <span class="tag">${this.capitalizeFirst(type)}</span>
            </td>
            <td title="${url}">${shortUrl}</td>
          </tr>
        `
      }).join('')
    } catch (error) {
      console.error('[UWB Statistics] Error updating activity table:', error)
    }
  },

  /**
   * Updates the disabled sites table.
   * @private
   */
  updateDisabledSitesTable() {
    try {
      if (!this.elements.disabledSitesTable) return

      const disabledSites = this.data.disabledSites || []
      
      if (disabledSites.length === 0) {
        this.elements.disabledSitesTable.innerHTML = `
          <tr>
            <td colspan="3" style="text-align: center; padding: 20px; color: #64748b;">
              No disabled sites
            </td>
          </tr>
        `
        return
      }

      this.elements.disabledSitesTable.innerHTML = disabledSites.map(hostname => {
        return `
          <tr>
            <td><strong>${hostname}</strong></td>
            <td>
              <span class="tag error">Disabled</span>
            </td>
            <td>
              <button class="btn btn-secondary" onclick="StatisticsController.enableSite('${hostname}')">
                Enable
              </button>
            </td>
          </tr>
        `
      }).join('')
    } catch (error) {
      console.error('[UWB Statistics] Error updating disabled sites table:', error)
    }
  },

  /**
   * Enables a disabled site.
   * @param {string} hostname - The hostname to enable.
   * @public
   */
  async enableSite(hostname) {
    try {
      const response = await this.sendMessage({
        action: 'setSiteStatus',
        hostname: hostname,
        enabled: true
      })

      if (response && !response.error) {
        // Refresh data to update UI
        await this.loadStatistics()
      } else {
        throw new Error(response?.error || 'Failed to enable site')
      }
    } catch (error) {
      console.error('[UWB Statistics] Error enabling site:', error)
      this.showError(`Failed to enable ${hostname}`)
    }
  },

  /**
   * Adds animations to UI elements.
   * @private
   */
  addAnimations() {
    try {
      // Add fade-in animation to stat cards
      const statCards = document.querySelectorAll('.stat-card')
      statCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.add('animate-fade-in')
        }, index * 100)
      })

      // Add fade-in animation to sections
      const sections = document.querySelectorAll('.section')
      sections.forEach((section, index) => {
        setTimeout(() => {
          section.classList.add('animate-fade-in')
        }, (index + statCards.length) * 100)
      })
    } catch (error) {
      console.error('[UWB Statistics] Error adding animations:', error)
    }
  },

  /**
   * Shows the main content and hides loading state.
   * @private
   */
  showContent() {
    try {
      if (this.elements.loadingState) {
        this.elements.loadingState.style.display = 'none'
      }
      if (this.elements.statsContent) {
        this.elements.statsContent.style.display = 'block'
      }
    } catch (error) {
      console.error('[UWB Statistics] Error showing content:', error)
    }
  },

  /**
   * Refreshes the statistics data.
   * @private
   */
  async refreshData() {
    try {
      if (this.elements.refreshBtn) {
        this.elements.refreshBtn.textContent = '🔄 Refreshing...'
        this.elements.refreshBtn.disabled = true
      }

      await this.loadStatistics()

      if (this.elements.refreshBtn) {
        this.elements.refreshBtn.textContent = '🔄 Refresh Data'
        this.elements.refreshBtn.disabled = false
      }
    } catch (error) {
      console.error('[UWB Statistics] Error refreshing data:', error)
      this.showError('Failed to refresh data')

      if (this.elements.refreshBtn) {
        this.elements.refreshBtn.textContent = '🔄 Refresh Data'
        this.elements.refreshBtn.disabled = false
      }
    }
  },

  /**
   * Exports statistics data as JSON.
   * @private
   */
  exportData() {
    try {
      const dataStr = JSON.stringify(this.data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `uwb-statistics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('[UWB Statistics] Error exporting data:', error)
      this.showError('Failed to export data')
    }
  },

  /**
   * Resets all statistics after confirmation.
   * @private
   */
  async resetStatistics() {
    try {
      const confirmed = confirm('Are you sure you want to reset all statistics? This action cannot be undone.')
      
      if (!confirmed) return

      const response = await this.sendMessage({
        action: 'resetStats'
      })

      if (response && !response.error) {
        // Refresh data to update UI
        await this.loadStatistics()
      } else {
        throw new Error(response?.error || 'Failed to reset statistics')
      }
    } catch (error) {
      console.error('[UWB Statistics] Error resetting statistics:', error)
      this.showError('Failed to reset statistics')
    }
  },

  /**
   * Sets up auto-refresh functionality.
   * @private
   */
  setupAutoRefresh() {
    try {
      // Refresh every 30 seconds
      this.refreshInterval = setInterval(() => {
        this.loadStatistics()
      }, 30000)
    } catch (error) {
      console.error('[UWB Statistics] Error setting up auto-refresh:', error)
    }
  },

  /**
   * Utility function to format numbers with commas.
   * @param {number} num - Number to format.
   * @returns {string} Formatted number.
   * @private
   */
  formatNumber(num) {
    return new Intl.NumberFormat().format(num)
  },

  /**
   * Utility function to format duration.
   * @param {number} minutes - Duration in minutes.
   * @returns {string} Formatted duration.
   * @private
   */
  formatDuration(minutes) {
    if (minutes < 60) {
      return `${minutes}m`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return `${hours}h ${mins}m`
    } else {
      const days = Math.floor(minutes / 1440)
      const hours = Math.floor((minutes % 1440) / 60)
      return `${days}d ${hours}h`
    }
  },

  /**
   * Utility function to capitalize first letter.
   * @param {string} str - String to capitalize.
   * @returns {string} Capitalized string.
   * @private
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
  },

  /**
   * Shows an error message.
   * @param {string} message - Error message to display.
   * @private
   */
  showError(message) {
    try {
      // You could implement a more sophisticated error display here
      console.error('[UWB Statistics] Error:', message)
      alert(message) // Simple fallback for now
    } catch (error) {
      console.error('[UWB Statistics] Error showing error message:', error)
    }
  },

  /**
   * Cleanup method for proper resource disposal.
   * @public
   */
  destroy() {
    try {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
      console.log('[UWB Statistics] Statistics controller destroyed')
    } catch (error) {
      console.error('[UWB Statistics] Error during cleanup:', error)
    }
  }
}

// Initialize statistics when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  StatisticsController.init().catch(error => {
    console.error('[UWB Statistics] Failed to initialize:', error)
  })
})

// Handle page unload
window.addEventListener('beforeunload', () => {
  StatisticsController.destroy()
})

// Make StatisticsController available globally for button onclick events
if (typeof window !== 'undefined') {
  window.StatisticsController = StatisticsController
}