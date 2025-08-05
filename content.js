/**
 * @file Universal Web Bypass Injector Content Script (Professional Grade)
 * @version 2.0.0
 * @description A robust content script to block ads, trackers, and paywalls.
 * Designed for performance, maintainability, and professional standards.
 * @license GPL-3.0
 * @author Chauhan-Mukesh
 * @since 1.0.0
 */

(function() {
  'use strict'

  // Prevent running on restricted pages to avoid errors
  if (window.location.protocol === 'chrome:' ||
      window.location.protocol === 'about:' ||
      window.location.href === 'about:blank' ||
      window.location.protocol === 'moz-extension:' ||
      window.location.protocol === 'chrome-extension:') {
    return
  }

  /**
   * @class UniversalBypass
   * @classdesc Main class to encapsulate all bypass logic with professional error handling.
   */
  const UniversalBypass = {
    /**
     * Configuration object for the script.
     * @property {RegExp[]} BLOCKED_HOSTS - A list of compiled regex for blocked domains.
     * @property {string[]} SELECTORS_TO_REMOVE - CSS selectors for elements to remove from the DOM.
     * @property {string[]} CONSOLE_SUPPRESS - Console message patterns to suppress.
     */
    config: {
      BLOCKED_HOSTS: [
        // Analytics & Trackers
        'sb\\.scorecardresearch\\.com',
        'analytics\\.google\\.com',
        'google-analytics\\.com',
        'stats\\.g\\.doubleclick\\.net',
        'bat\\.bing\\.com',
        'analytics\\.tiktok\\.com',
        'connect\\.facebook\\.net',
        'sp\\.analytics\\.yahoo\\.com',
        'chartbeat\\.com',
        'comscore\\.(js|cloud)',
        'browser\\.sentry-cdn\\.com',
        'cdn\\.optimizely\\.com',
        'survey\\.survicate\\.com',
        'cdn\\.siftscience\\.com',
        'i\\.clean\\.gg',
        'm\\.stripe\\.network',
        'googletagmanager\\.com',
        // Ads
        'securepubads\\.g\\.doubleclick\\.net',
        'ads\\.pubmatic\\.com',
        'static\\.ads-twitter\\.com',
        'ads\\.reddit\\.com',
        'imasdk\\.googleapis\\.com',
        'c\\.amazon-adsystem\\.com',
        'jsc\\.mgid\\.com',
        'b-code\\.liadm\\.com',
        'impactcdn\\.com',
        'googlesyndication\\.com',
        'amazon-adsystem\\.com',
        'adsystem\\.amazon',
        'outbrain\\.com',
        'taboola\\.com',
        'criteo\\.com',
        'pubmatic\\.com',
        // Specific Content/Paywalls
        'hb-scribd\\.s3\\.us-east-2\\.amazonaws\\.com',
        's-f\\.scribdassets\\.com',
        'chartbeat_mab\\.js'
      ].map(pattern => new RegExp('^https?://([^/]+\\.)?' + pattern, 'i')),

      SELECTORS_TO_REMOVE: [
        // Ad/Anti-adblock overlays
        '.adblock-overlay',
        '.disable-adblock',
        '[class*="adblock"]',
        // Paywalls/Overlays
        '.paywall',
        '.overlay',
        '[class*="paywall"]',
        '[id*="paywall"]',
        // Known ad containers
        '[data-ad-container]',
        '[data-ad-unit]',
        'iframe[src*="ads"]',
        '[class*="google-ad"]',
        '[id*="google_ads"]',
        // Additional common selectors
        '.popup-overlay',
        '.modal-backdrop',
        '.cookie-banner',
        '.gdpr-banner',
        '[class*="modal"]',
        '[class*="popup"]',
        '[id*="popup"]',
        '.subscription-wall',
        '.premium-content-overlay',
        '[class*="subscribe"]',
        '[class*="membership"]'
      ],

      CONSOLE_SUPPRESS: [
        /^\[GET_CSS\]: result/,
        /net::ERR_BLOCKED_BY_CLIENT/,
        /Failed to load resource/,
        /Script error\./,
        /Non-Error promise rejection captured/
      ]
    },

    /**
     * Debug mode configuration.
     * @type {boolean}
     */
    DEBUG: false,

    /**
     * The MutationObserver instance.
     * @type {MutationObserver|null}
     */
    observer: null,

    /**
     * Cleanup timeout reference.
     * @type {number|null}
     */
    cleanupTimeout: null,

    /**
     * Extension initialization flag.
     * @type {boolean}
     */
    initialized: false,

    /**
     * Logger function that respects debug mode.
     * @param {...any} args - Arguments to log.
     * @private
     */
    _log(...args) {
      if (this.DEBUG) {
        console.log('🛡️ UWB:', ...args)
      }
    },

    /**
     * Safe error logging.
     * @param {string} context - Error context.
     * @param {Error} error - Error object.
     * @private
     */
    _logError(context, error) {
      if (this.DEBUG) {
        console.error(`🛡️ UWB Error in ${context}:`, error)
      }
    },

    /**
     * Initializes the bypass script.
     * @public
     * @returns {Promise<void>}
     */
    async init() {
      if (this.initialized) {
        this._log('Already initialized, skipping...')
        return
      }

      try {
        this._log('Activating script v2.0.0...')
        this.suppressConsoleNoise()
        this.patchNetworkRequests()
        await this.restorePageFunctionality()
        this.cleanDOM()
        this.observeDOMChanges()
        this.initialized = true
        this._log('Script is active. Page has been cleaned and is being monitored.')

        // Notify background script
        this._notifyBackgroundScript()
      } catch (error) {
        this._logError('init', error)
      }
    },

    /**
     * Notifies the background script of successful activation.
     * @private
     */
    _notifyBackgroundScript() {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.sendMessage({
            action: 'bypassStatus',
            url: window.location.href,
            timestamp: Date.now()
          }).catch(() => {
            // Silently handle errors (extension context might not be available)
          })
        }
      } catch (error) {
        // Silently handle chrome API errors
      }
    },

    /**
     * Checks if a given URL matches any of the blocked hosts.
     * @param {string} url - The URL to check.
     * @returns {boolean} - True if the URL is blocked, false otherwise.
     * @private
     */
    _isBlocked(url) {
      if (!url || typeof url !== 'string') return false

      try {
        return this.config.BLOCKED_HOSTS.some(regex => regex.test(url))
      } catch (error) {
        this._logError('_isBlocked', error)
        return false
      }
    },

    /**
     * Removes an element from the DOM safely.
     * @param {HTMLElement} element - The element to remove.
     * @private
     */
    _removeElement(element) {
      try {
        if (element && element.parentNode && typeof element.remove === 'function') {
          element.remove()
          return true
        }
      } catch (error) {
        this._logError('_removeElement', error)
      }
      return false
    },

    /**
     * Suppresses repetitive console errors from blocked requests to keep the console clean.
     * @private
     */
    suppressConsoleNoise() {
      try {
        const originalMethods = {}

        ;['log', 'warn', 'error'].forEach(level => {
          originalMethods[level] = console[level]
          console[level] = (...args) => {
            const message = args.map(String).join(' ')

            // Check if message should be suppressed
            const shouldSuppress = this.config.CONSOLE_SUPPRESS.some(pattern =>
              pattern.test(message)
            )

            if (!shouldSuppress) {
              originalMethods[level].apply(console, args)
            }
          }
        })
      } catch (error) {
        this._logError('suppressConsoleNoise', error)
      }
    },

    /**
     * Patches window.fetch and XMLHttpRequest to intercept and block unwanted network requests.
     * @private
     */
    patchNetworkRequests() {
      try {
        // Patch window.fetch
        if (window.fetch && !window.fetch._bypassed) {
          const originalFetch = window.fetch
          window.fetch = (resource, init) => {
            const url = (resource && typeof resource === 'object') ? resource.url : resource

            if (this._isBlocked(url)) {
              this._log(`Blocked fetch request to: ${url}`)
              return Promise.reject(new Error(`Bypassed fetch to ${url}`))
            }

            return originalFetch.apply(window, arguments)
          }
          window.fetch._bypassed = true
        }

        // Patch XMLHttpRequest
        if (window.XMLHttpRequest && !window.XMLHttpRequest.prototype._bypassed) {
          const xhrProto = XMLHttpRequest.prototype
          const originalOpen = xhrProto.open
          const originalSend = xhrProto.send

          xhrProto.open = function(method, url) {
            this._uwbBlocked = UniversalBypass._isBlocked(url)
            if (this._uwbBlocked) {
              UniversalBypass._log(`Blocked XHR request to: ${url}`)
            }
            return originalOpen.apply(this, arguments)
          }

          xhrProto.send = function() {
            if (this._uwbBlocked) return
            return originalSend.apply(this, arguments)
          }

          window.XMLHttpRequest.prototype._bypassed = true
        }
      } catch (error) {
        this._logError('patchNetworkRequests', error)
      }
    },

    /**
     * Cleans the DOM of unwanted elements based on selectors and blocked sources.
     * @param {NodeList|HTMLElement[]} [nodes] - A specific set of nodes to clean. Defaults to the whole document.
     * @private
     */
    cleanDOM(nodes) {
      try {
        const scope = nodes ? Array.from(nodes) : [document.documentElement]
        let removedCount = 0

        if (!scope.length) return

        // Remove elements matching the selector list
        const selectors = this.config.SELECTORS_TO_REMOVE.join(', ')

        scope.forEach(node => {
          if (!node || !node.nodeType) return

          try {
            // Check if the node itself is an element and matches
            if (node.matches && node.matches(selectors)) {
              if (this._removeElement(node)) {
                removedCount++
              }
            }

            // Query for children matching the selectors
            if (node.querySelectorAll) {
              const elementsToRemove = node.querySelectorAll(selectors)
              elementsToRemove.forEach(element => {
                if (this._removeElement(element)) {
                  removedCount++
                }
              })
            }
          } catch (error) {
            this._logError('cleanDOM selector matching', error)
          }
        })

        // Remove elements with src attributes pointing to blocked hosts
        const srcSelectors = 'script[src], iframe[src], img[src], embed[src], object[data]'

        scope.forEach(node => {
          if (!node || !node.nodeType) return

          try {
            // Check node itself
            if (node.matches && node.matches(srcSelectors)) {
              const src = node.src || node.data
              if (src && this._isBlocked(src)) {
                this._log(`Removed element with blocked src: ${node.tagName} -> ${src}`)
                if (this._removeElement(node)) {
                  removedCount++
                }
              }
            }

            // Check children
            if (node.querySelectorAll) {
              const srcElements = node.querySelectorAll(srcSelectors)
              srcElements.forEach(element => {
                const src = element.src || element.data
                if (src && this._isBlocked(src)) {
                  this._log(`Removed element with blocked src: ${element.tagName} -> ${src}`)
                  if (this._removeElement(element)) {
                    removedCount++
                  }
                }
              })
            }
          } catch (error) {
            this._logError('cleanDOM src checking', error)
          }
        })

        // Remove high z-index overlays (likely modals/paywalls)
        this._removeHighZIndexOverlays(scope)

        if (removedCount > 0) {
          this._log(`Cleaned ${removedCount} elements from DOM`)
        }
      } catch (error) {
        this._logError('cleanDOM', error)
      }
    },

    /**
     * Removes elements with suspiciously high z-index values (likely overlays).
     * @param {HTMLElement[]} scope - Elements to check.
     * @private
     */
    _removeHighZIndexOverlays(scope) {
      try {
        scope.forEach(node => {
          if (!node || !node.querySelectorAll) return

          const allElements = node.querySelectorAll('*')
          allElements.forEach(element => {
            try {
              const style = window.getComputedStyle(element)
              const zIndex = parseInt(style.zIndex, 10)

              if (zIndex > 9000 &&
                  (style.position === 'fixed' || style.position === 'absolute') &&
                  element.offsetHeight > window.innerHeight * 0.3) {
                this._log(`Removed high z-index overlay: ${element.tagName}, z-index: ${zIndex}`)
                this._removeElement(element)
              }
            } catch (error) {
              // Silently continue on style computation errors
            }
          })
        })
      } catch (error) {
        this._logError('_removeHighZIndexOverlays', error)
      }
    },

    /**
     * Injects CSS to restore page functionality (e.g., scrolling) that may be disabled.
     * @private
     * @returns {Promise<void>}
     */
    async restorePageFunctionality() {
      return new Promise((resolve) => {
        try {
          const styleId = 'universal-bypass-styles'

          // Don't add styles more than once
          if (document.getElementById(styleId)) {
            resolve()
            return
          }

          const style = document.createElement('style')
          style.id = styleId
          style.setAttribute('data-uwb-injected', 'true')
          style.textContent = `
            /* Universal Web Bypass Injector Styles */
            html, body {
              overflow: auto !important;
              position: static !important;
              filter: none !important;
              pointer-events: auto !important;
            }
            
            /* Remove common paywall styling */
            .paywall-blur { 
              filter: none !important; 
            }
            
            .paywall-overlay,
            ${this.config.SELECTORS_TO_REMOVE.join(',\n            ')} {
              display: none !important;
              opacity: 0 !important;
              visibility: hidden !important;
            }
            
            /* Ensure content is visible */
            [style*="display: none"] { 
              display: block !important; 
            }
            
            [style*="visibility: hidden"] { 
              visibility: visible !important; 
            }
            
            /* Remove scroll locks */
            body.no-scroll, 
            body.modal-open,
            body.scroll-disabled {
              overflow: auto !important;
            }
            
            /* Fix common overlay issues */
            div[style*="position: fixed"][style*="z-index"] {
              z-index: 1 !important;
            }
          `

          const addStyle = () => {
            try {
              if (document.head) {
                document.head.appendChild(style)
                this._log('CSS fixes applied successfully')
                resolve()
              } else {
                // Retry if head is not available yet
                setTimeout(addStyle, 10)
              }
            } catch (error) {
              this._logError('addStyle', error)
              resolve()
            }
          }

          addStyle()
        } catch (error) {
          this._logError('restorePageFunctionality', error)
          resolve()
        }
      })
    },

    /**
     * Uses a MutationObserver to efficiently handle dynamically loaded content.
     * @private
     */
    observeDOMChanges() {
      try {
        if (this.observer) {
          this.observer.disconnect()
        }

        if (!window.MutationObserver) {
          this._log('MutationObserver not available')
          return
        }

        this.observer = new MutationObserver((mutations) => {
          try {
            let shouldClean = false
            const addedNodes = []

            for (const mutation of mutations) {
              if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach(node => {
                  if (node.nodeType === Node.ELEMENT_NODE) {
                    addedNodes.push(node)
                    shouldClean = true
                  }
                })
              }
            }

            if (shouldClean) {
              // Debounce cleanup to avoid excessive calls
              if (this.cleanupTimeout) {
                clearTimeout(this.cleanupTimeout)
              }

              this.cleanupTimeout = setTimeout(() => {
                this.cleanDOM(addedNodes)
              }, 100)
            }
          } catch (error) {
            this._logError('MutationObserver callback', error)
          }
        })

        this.observer.observe(document.documentElement, {
          childList: true,
          subtree: true,
          attributes: false,
          attributeOldValue: false,
          characterData: false,
          characterDataOldValue: false
        })

        this._log('DOM mutation observer started')
      } catch (error) {
        this._logError('observeDOMChanges', error)
      }
    },

    /**
     * Cleanup method to properly dispose of resources.
     * @public
     */
    destroy() {
      try {
        if (this.observer) {
          this.observer.disconnect()
          this.observer = null
        }

        if (this.cleanupTimeout) {
          clearTimeout(this.cleanupTimeout)
          this.cleanupTimeout = null
        }

        // Remove injected styles
        const style = document.getElementById('universal-bypass-styles')
        if (style) {
          this._removeElement(style)
        }

        this.initialized = false
        this._log('Extension destroyed and cleaned up')
      } catch (error) {
        this._logError('destroy', error)
      }
    }
  }

  // --- Execution ---
  // Wrap in a try/catch block for safety
  try {
    // Initialize immediately if DOM is ready, otherwise wait for it
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        UniversalBypass.init()
      })
    } else {
      UniversalBypass.init()
    }

    // Also run when the page is fully loaded to catch late-loading elements
    if (document.readyState !== 'complete') {
      window.addEventListener('load', () => {
        // Re-run cleaning for elements added after initial load
        setTimeout(() => {
          UniversalBypass.cleanDOM()
        }, 1000)
      })
    }

    // Make UniversalBypass available globally for testing
    if (typeof window !== 'undefined') {
      window.UniversalBypass = UniversalBypass
    }
  } catch (error) {
    console.error('[UWB] Critical error during script execution:', error)
  }
})()
