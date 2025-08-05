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
     * @property {string[]} PROTECTED_SITES - Sites where we should be more conservative.
     */
    config: {
      PROTECTED_SITES: [
        'dev.to',
        'github.com',
        'stackoverflow.com',
        'codepen.io',
        'jsfiddle.net',
        'codesandbox.io',
        'repl.it',
        'glitch.com',
        // Adult sites that commonly have JavaScript functionality issues
        'pornhub.com',
        'xvideos.com',
        'xnxx.com',
        'redtube.com',
        'youporn.com',
        'tube8.com',
        'spankbang.com',
        'xhamster.com',
        // Other sites with complex JavaScript functionality
        'moneycontrol.com',
        'bloomberg.com',
        'reuters.com',
        'cnn.com',
        'bbc.com',
        'netflix.com',
        'youtube.com',
        'twitch.tv',
        'discord.com',
        'slack.com',
        'zoom.us',
        'office.com',
        'live.com',
        'microsoft.com',
        // Banking and financial sites
        'paypal.com',
        'stripe.com',
        'visa.com',
        'mastercard.com',
        // E-commerce sites with complex checkouts
        'amazon.com',
        'ebay.com',
        'walmart.com',
        'target.com'
      ],
      BLOCKED_HOSTS: [
        // Analytics & Trackers (Core)
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
        
        // Enhanced Analytics & Trackers (EasyList/uBlock patterns)
        'hotjar\\.com',
        'fullstory\\.com',
        'mixpanel\\.com',
        'segment\\.(io|com)',
        'amplitude\\.com',
        'heap\\.io',
        'mouseflow\\.com',
        'crazyegg\\.com',
        'smartlook\\.com',
        'logrocket\\.com',
        'quantummetric\\.com',
        'contentsquare\\.net',
        'adobe\\.com/analytics',
        'omniture\\.com',
        'newrelic\\.com',
        'pingdom\\.net',
        'gtm\\.js',
        'gtag\\.js',
        
        // Ads & Ad Networks (Core)
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
        
        // Enhanced Ad Networks (EasyList patterns)
        'adsnative\\.com',
        'adsystem\\.com',
        'advertising\\.com',
        'adsystem\\.net',
        'adnxs\\.com',
        'appnexus\\.com',
        'rubiconproject\\.com',
        'openx\\.net',
        'indexexchange\\.com',
        'smartadserver\\.com',
        'adsystem\\.org',
        'spotxchange\\.com',
        'liveramp\\.com',
        'bidswitch\\.net',
        'rlcdn\\.com',
        'adsystem\\.eu',
        'teads\\.tv',
        'sovrn\\.com',
        'sharethrough\\.com',
        'amazon-adsystem',
        'googletag\\.js',
        
        // Social Media Trackers
        'tr\\.facebook\\.com',
        'analytics\\.twitter\\.com',
        'ads\\.linkedin\\.com',
        'ads\\.pinterest\\.com',
        'ads\\.snapchat\\.com',
        'ads\\.tiktok\\.com',
        
        // Privacy/GDPR Compliance
        'cookielaw\\.org',
        'onetrust\\.com',
        'trustarc\\.com',
        'consent\\.youtube\\.com',
        
        // Specific Content/Paywalls
        'hb-scribd\\.s3\\.us-east-2\\.amazonaws\\.com',
        's-f\\.scribdassets\\.com',
        'chartbeat_mab\\.js',
        
        // Anti-Adblock Detection
        'fuckadblock\\.js',
        'adblock-detector',
        'blockadblock',
        'anti-adblock',
        'adblock\\.js'
      ].map(pattern => new RegExp('^https?://([^/]+\\.)?' + pattern, 'i')),

      SELECTORS_TO_REMOVE: [
        // Ad/Anti-adblock overlays - more specific selectors
        '.adblock-overlay',
        '.disable-adblock',
        '[class*="adblock-"][class*="modal"]',
        '[class*="adblock-"][class*="popup"]',
        '[class*="anti-adblock"]',
        '[id*="adblock-detector"]',
        '[id*="anti-adb"]',
        '.adb-detector',
        '.anti-ad-blocker',
        
        // Paywalls/Overlays - more specific
        '.paywall-overlay',
        '.paywall-modal',
        '.subscription-overlay',
        '[class*="paywall"][class*="overlay"]',
        '[class*="paywall"][class*="modal"]',
        '[id*="paywall"][class*="overlay"]',
        '[id*="paywall"][class*="modal"]',
        '.premium-wall',
        '.subscriber-wall',
        '.registration-wall',
        '.login-wall',
        '.piano-template-modal',
        '.tp-modal',
        '.paid-content-overlay',
        
        // High z-index overlays (commonly used for paywalls)
        '[style*="z-index: 999999"]',
        '[style*="z-index: 9999"]',
        '[style*="z-index:999999"]',
        '[style*="z-index:9999"]',
        
        // Known ad containers
        '[data-ad-container]',
        '[data-ad-unit]',
        'iframe[src*="doubleclick"]',
        'iframe[src*="googlesyndication"]',
        '[class^="google-ad-"]',
        '[id^="google_ads"]',
        '.adsystem',
        '.ad-banner',
        '.advertisement',
        '[class*="adsense"]',
        
        // Additional specific selectors
        '.subscription-wall',
        '.premium-content-overlay',
        '.membership-paywall',
        '.content-gate',
        '.access-gate',
        '.signin-prompt',
        '.newsletter-signup-overlay',
        '.email-capture-modal',
        
        // Cookie/GDPR banners (commonly problematic)
        '.cookie-banner[style*="fixed"]',
        '.gdpr-banner[style*="fixed"]',
        '[class*="cookie"][class*="banner"][style*="z-index"]',
        '.consent-banner',
        '.privacy-banner',
        '.onetrust-banner-sdk',
        
        // Blur overlays commonly used for paywalls
        '[style*="filter: blur"]',
        '[style*="filter:blur"]',
        '.content-blur',
        '.blurred-content',
        
        // Modal and overlay patterns
        '.modal-backdrop',
        '.overlay-backdrop',
        '[class*="backdrop"][style*="position: fixed"]',
        '.popup-overlay',
        '.modal-overlay'
      ],

      CONSOLE_SUPPRESS: [
        /\[GET_CSS\]: result/,
        /net::ERR_BLOCKED_BY_CLIENT/,
        /Failed to load resource/,
        /Script error\./,
        /Non-Error promise rejection captured/,
        /Cannot read properties of undefined/,
        /reading 'classList'/,
        /Uncaught TypeError/,
        /was preloaded using link preload but not used/,
        /Please make sure it has an appropriate `as` value/,
        /The resource .* was preloaded/,
        /Local Storage is supported/,
        /overrideMethod @/
      ],

      // Restricted content patterns for graceful detection
      RESTRICTED_CONTENT_SELECTORS: [
        '.login-required',
        '.subscription-required',
        '.premium-content',
        '.member-only',
        '.signin-wall',
        '.registration-required',
        '[data-requires-login]',
        '[data-premium-content]',
        '.content-locked',
        '.access-denied',
        '.subscriber-only'
      ],

      // Anti-adblock dialog patterns
      ADBLOCK_DIALOG_SELECTORS: [
        '[class*="adblock"]',
        '[id*="adblock"]',
        '[class*="adblocker"]',
        '[id*="adblocker"]',
        '.ad-blocker-detected',
        '.adblock-detected',
        '.disable-adblock',
        '.please-disable-adblock',
        '[data-adblock-detector]',
        '.anti-adblock',
        '.adblock-warning',
        '.adblocker-warning'
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
     * Last mutation observer execution time for throttling.
     * @type {number}
     */
    lastMutationTime: 0,

    /**
     * Mutation observer throttle interval (ms).
     * @type {number}
     */
    mutationThrottleInterval: 200,

    /**
     * Element logging per site for diagnostics.
     * @type {Array<Object>}
     */
    blockedElementsLog: [],

    /**
     * Restricted content detection cache.
     * @type {boolean|null}
     */
    isRestrictedContent: null,

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
        // Check if extension is enabled for this site
        const hostname = window.location.hostname
        const isEnabled = await this._checkSiteEnabled(hostname)
        
        if (!isEnabled) {
          this._log(`Extension disabled for ${hostname}`)
          return
        }

        this._log('Activating script v2.0.0...')
        this.setupGlobalErrorHandler()
        this.suppressConsoleNoise()
        this.patchNetworkRequests()
        await this.restorePageFunctionality()
        this.cleanDOM()
        this.observeDOMChanges()
        
        // Enhanced restricted content detection and handling
        await this._detectRestrictedContent()
        
        // Enhanced anti-adblock circumvention
        this._removeAdblockDialogs()
        this._removeBlurOverlays()
        
        this.initialized = true
        this._log('Script is active. Page has been cleaned and is being monitored.')

        // Notify background script
        this._notifyBackgroundScript()
      } catch (error) {
        this._logError('init', error)
      }
    },

    /**
     * Checks if the current site is in the protected sites list.
     * @returns {boolean} - True if the site should use conservative cleaning.
     * @private
     */
    _isProtectedSite() {
      const hostname = window.location.hostname.toLowerCase()
      return this.config.PROTECTED_SITES.some(site => 
        hostname === site || hostname.endsWith('.' + site)
      )
    },

    /**
     * Detects if content is restricted due to login/premium gating and handles gracefully.
     * @private
     * @returns {boolean} - True if restricted content was detected and handled.
     */
    _handleRestrictedContent() {
      try {
        const restrictedIndicators = [
          // Login/subscription requirements
          '.login-required',
          '.subscription-required',
          '.premium-content',
          '.member-only',
          '.subscriber-only',
          // Common text patterns
          '[class*="signin"][class*="required"]',
          '[id*="login"][id*="required"]',
          // Specific platform indicators
          '.piano-offer-template',
          '.meter-paywall',
          '.article-gate',
          '.content-lock'
        ]

        const restrictedElements = restrictedIndicators
          .map(selector => document.querySelectorAll(selector))
          .filter(nodeList => nodeList.length > 0)

        if (restrictedElements.length > 0) {
          this._log('Detected restricted content, attempting graceful handling...')
          
          // Check for Internet Archive availability
          this._suggestAlternativeAccess()
          
          // Look for free preview content
          this._revealPreviewContent()
          
          return true
        }

        return false
      } catch (error) {
        this._logError('_handleRestrictedContent', error)
        return false
      }
    },

    /**
     * Suggests alternative access methods for restricted content.
     * @private
     */
    _suggestAlternativeAccess() {
      try {
        const currentUrl = window.location.href
        const archiveUrl = `https://web.archive.org/web/${currentUrl}`
        
        // Create a non-intrusive suggestion banner
        const banner = document.createElement('div')
        banner.id = 'uwb-access-banner'
        banner.style.cssText = `
          position: fixed;
          top: 10px;
          right: 10px;
          background: #4f46e5;
          color: white;
          padding: 12px 16px;
          border-radius: 8px;
          font-family: system-ui, sans-serif;
          font-size: 14px;
          z-index: 1000000;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          max-width: 300px;
          cursor: pointer;
          transition: all 0.3s ease;
        `
        
        banner.innerHTML = `
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🌐</span>
            <span>Content restricted? Try Internet Archive</span>
            <span style="margin-left: auto; font-size: 18px;">&times;</span>
          </div>
        `
        
        banner.addEventListener('click', (e) => {
          e.preventDefault()
          if (e.target.textContent === '×') {
            banner.remove()
          } else {
            window.open(archiveUrl, '_blank')
          }
        })
        
        document.body.appendChild(banner)
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (banner.parentNode) {
            banner.remove()
          }
        }, 10000)
        
        this._log('Alternative access suggestion displayed')
      } catch (error) {
        this._logError('_suggestAlternativeAccess', error)
      }
    },

    /**
     * Attempts to reveal any available preview content.
     * @private
     */
    _revealPreviewContent() {
      try {
        // Remove common blur filters used on restricted content
        const blurredElements = document.querySelectorAll('[style*="blur"], .blurred, .preview-only')
        blurredElements.forEach(element => {
          element.style.filter = 'none'
          element.style.webkitFilter = 'none'
          if (element.classList.contains('blurred')) {
            element.classList.remove('blurred')
          }
        })

        // Restore text content that might be truncated
        const truncatedElements = document.querySelectorAll('.truncated, .preview-text, [class*="fade-out"]')
        truncatedElements.forEach(element => {
          element.style.maxHeight = 'none'
          element.style.overflow = 'visible'
          element.style.webkitMaskImage = 'none'
          element.style.maskImage = 'none'
        })

        if (blurredElements.length > 0 || truncatedElements.length > 0) {
          this._log('Revealed preview content where possible')
        }
      } catch (error) {
        this._logError('_revealPreviewContent', error)
      }
    },

    /**
     * Checks if the extension is enabled for the current site.
     * @param {string} hostname - The hostname to check.
     * @returns {Promise<boolean>} - True if enabled, false if disabled.
     * @private
     */
    async _checkSiteEnabled(hostname) {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          const response = await new Promise((resolve) => {
            chrome.runtime.sendMessage({
              action: 'getSiteStatus',
              hostname: hostname
            }, resolve)
          })
          
          return response && response.enabled !== false
        }
        return true // Default to enabled if can't check
      } catch (error) {
        this._logError('_checkSiteEnabled', error)
        return true // Default to enabled on error
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
      } catch (_error) {
        // Silently handle chrome API errors
      }
    },

    /**
     * Sets up a global error handler to catch and suppress common JavaScript errors.
     * @private
     */
    setupGlobalErrorHandler() {
      try {
        const isProtected = this._isProtectedSite()
        
        // Don't set up error handling on protected sites
        if (isProtected) {
          return
        }

        // Capture and suppress common errors that might be caused by blocked elements
        window.addEventListener('error', (event) => {
          const errorMessage = event.message || ''
          const errorSource = event.filename || ''
          
          // Check if this is a common error pattern we should suppress
          const shouldSuppress = this.config.CONSOLE_SUPPRESS.some(pattern => {
            try {
              return pattern.test(errorMessage) || pattern.test(errorSource)
            } catch (_patternError) {
              return false
            }
          })

          if (shouldSuppress) {
            event.preventDefault()
            event.stopPropagation()
            return false
          }
        }, true)

        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
          const errorMessage = event.reason ? String(event.reason) : ''
          
          // Check if this is a network error we caused
          if (errorMessage.includes('Bypassed fetch to') || 
              errorMessage.includes('net::ERR_BLOCKED_BY_CLIENT')) {
            event.preventDefault()
            return false
          }
        })
      } catch (error) {
        this._logError('setupGlobalErrorHandler', error)
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
     * Determines if an element is likely an ad or unwanted content.
     * @param {HTMLElement} element - The element to check.
     * @returns {boolean} - True if the element is likely an ad.
     * @private
     */
    _isLikelyAd(element) {
      try {
        const className = element.className || ''
        const id = element.id || ''
        
        // Check for common ad indicators
        const hasAdKeywords = /ad|advertisement|sponsor|promo|banner/i.test(className + ' ' + id)
        const hasAdSize = (element.offsetWidth === 728 && element.offsetHeight === 90) || // Leaderboard
                         (element.offsetWidth === 300 && element.offsetHeight === 250) || // Medium Rectangle
                         (element.offsetWidth === 320 && element.offsetHeight === 50)    // Mobile Banner
        
        // Don't remove if it contains essential content indicators
        const hasEssentialContent = element.querySelector('article, main, .content, [role="main"], [role="article"]')
        const isNavigation = /nav|menu|header|footer/i.test(className + ' ' + id)
        
        return hasAdKeywords || hasAdSize && !hasEssentialContent && !isNavigation
      } catch (error) {
        this._logError('_isLikelyAd', error)
        return false
      }
    },

    /**
     * Removes an element from the DOM safely with additional safety checks.
     * @param {HTMLElement} element - The element to remove.
     * @private
     */
    _removeElement(element) {
      try {
        if (!element || !element.parentNode || typeof element.remove !== 'function') {
          return false
        }

        // Additional safety checks to prevent breaking essential elements
        const tagName = element.tagName ? element.tagName.toLowerCase() : ''
        const elementId = element.id || ''

        // Don't remove essential HTML elements
        if (['html', 'head', 'body', 'script', 'style'].includes(tagName)) {
          return false
        }

        // Don't remove elements that might be essential for functionality
        if (elementId.includes('main') || elementId.includes('content') || 
            elementId.includes('wrapper') || elementId.includes('container')) {
          return false
        }

        // Check if element has event listeners (might be functional)
        if (element.onclick || element.onload || element.onerror) {
          return false
        }

        element.remove()
        return true
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

        // Only suppress on non-protected sites to avoid hiding important errors
        const isProtected = this._isProtectedSite()
        if (isProtected) {
          this._log('Protected site detected, console suppression disabled')
          return
        }

        ;['log', 'warn', 'error'].forEach(level => {
          if (console[level] && !console[level]._bypassed) {
            originalMethods[level] = console[level]
            console[level] = (...args) => {
              try {
                const message = args.map(arg => {
                  if (typeof arg === 'string') return arg
                  if (arg && typeof arg === 'object') return arg.toString()
                  return String(arg)
                }).join(' ')

                // Check if message should be suppressed
                const shouldSuppress = this.config.CONSOLE_SUPPRESS.some(pattern => {
                  try {
                    return pattern.test(message)
                  } catch (_patternError) {
                    return false
                  }
                })

                if (!shouldSuppress) {
                  originalMethods[level].apply(console, args)
                }
              } catch (_messageError) {
                // If we can't process the message, let it through
                originalMethods[level].apply(console, args)
              }
            }
            console[level]._bypassed = true
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
        const isProtected = this._isProtectedSite()
        
        // Skip network patching on protected sites to avoid breaking functionality
        if (isProtected) {
          this._log('Protected site detected, network patching disabled')
          return
        }

        // Patch window.fetch
        if (window.fetch && !window.fetch._bypassed) {
          const originalFetch = window.fetch
          window.fetch = (resource, _init) => {
            try {
              const url = (resource && typeof resource === 'object') ? resource.url : resource

              if (this._isBlocked(url)) {
                this._log(`Blocked fetch request to: ${url}`)
                return Promise.reject(new Error(`Bypassed fetch to ${url}`))
              }

              return originalFetch.apply(window, arguments)
            } catch (_error) {
              // If there's an error in our interception, let the original request through
              return originalFetch.apply(window, arguments)
            }
          }
          window.fetch._bypassed = true
        }

        // Patch XMLHttpRequest
        if (window.XMLHttpRequest && !window.XMLHttpRequest.prototype._bypassed) {
          const xhrProto = XMLHttpRequest.prototype
          const originalOpen = xhrProto.open
          const originalSend = xhrProto.send

          xhrProto.open = function(method, url) {
            try {
              this._uwbBlocked = UniversalBypass._isBlocked(url)
              if (this._uwbBlocked) {
                UniversalBypass._log(`Blocked XHR request to: ${url}`)
              }
            } catch (_error) {
              // If there's an error checking, don't block
              this._uwbBlocked = false
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
        const isProtected = this._isProtectedSite()
        
        if (!scope.length) return

        // Use performance-optimized cleaning for large DOMs
        if (scope.length === 1 && scope[0] === document.documentElement) {
          this._cleanDOMOptimized(isProtected)
        } else {
          this._cleanDOMNodes(scope, isProtected)
        }
      } catch (error) {
        this._logError('cleanDOM', error)
      }
    },

    /**
     * Performance-optimized DOM cleaning for large documents
     * @param {boolean} isProtected - Whether the site is protected
     * @private
     */
    _cleanDOMOptimized(isProtected) {
      const startTime = performance.now()
      let removedCount = 0
      const nodeCount = document.querySelectorAll('*').length
      
      try {
        // Performance budget check for very large DOMs
        if (nodeCount > 10000) {
          this._log(`Warning: Large DOM detected (${nodeCount} nodes). Using minimal cleaning for performance.`)
          removedCount += this._cleanDOMMinimal()
        } else if (isProtected) {
          // Ultra-conservative cleaning for protected sites
          const elements = document.querySelectorAll('.adblock-overlay, .paywall-overlay, [data-ad-container]')
          for (let i = 0; i < elements.length; i++) {
            const element = elements[i]
            if (element && element.parentNode && this._isLikelyAd(element) && this._removeElement(element)) {
              removedCount++
            }
          }
        } else {
          // Fast DOM cleaning with minimal queries
          removedCount += this._fastCleanDOM()
        }

        // Minimal final cleanup - only critical operations
        if (!isProtected) {
          this._removeAdblockDialogs()
        }
        
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)
        
        // Performance monitoring and reporting
        if (duration > 1000) {
          this._logError('Performance Budget Exceeded', new Error(`DOM size: ${nodeCount} nodes — processing time: ${duration} ms (budget: 1000 ms)`))
        }
        
        if (removedCount > 0) {
          this._log(`Cleaned ${removedCount} elements from DOM (${nodeCount} nodes) in ${duration}ms`)
        }
      } catch (error) {
        const endTime = performance.now()
        const duration = Math.round(endTime - startTime)
        this._logError('cleanDOMOptimized', error)
        this._log(`DOM cleaning failed after ${duration}ms for ${nodeCount} nodes`)
      }
    },

    /**
     * Ultra-fast DOM cleaning with minimal operations
     * @returns {number} Number of elements removed
     * @private
     */
    _fastCleanDOM() {
      let removedCount = 0
      
      try {
        // Single query with most common patterns only
        const commonAds = document.querySelectorAll('.adblock-overlay, .paywall-overlay, .paywall-modal, .subscription-overlay, [data-ad-container], [data-ad-unit]')
        
        // Batch collect elements to remove
        const toRemove = []
        
        for (let i = 0; i < commonAds.length; i++) {
          const element = commonAds[i]
          if (element && element.parentNode) {
            toRemove.push(element)
          }
        }
        
        // Batch remove elements
        for (const element of toRemove) {
          if (element.parentNode) {
            element.parentNode.removeChild(element)
            removedCount++
            this._logBlockedElement('ad-element', element, 'fast-cleanup')
          }
        }
        
        // Quick check for blocked scripts/iframes with simple domain matching
        const scripts = document.querySelectorAll('script[src*="doubleclick"], script[src*="googlesyndication"], iframe[src*="doubleclick"], iframe[src*="googlesyndication"]')
        for (let i = 0; i < scripts.length; i++) {
          const element = scripts[i]
          if (element && element.parentNode) {
            element.parentNode.removeChild(element)
            removedCount++
            this._logBlockedElement('blocked-src', element, 'fast-cleanup')
          }
        }
        
      } catch (error) {
        this._logError('fastCleanDOM', error)
      }
      
      return removedCount
    },

    /**
     * Use TreeWalker for efficient DOM traversal and cleaning
     * @returns {number} Number of elements removed
     * @private
     */
    _cleanDOMWithTreeWalker() {
      let removedCount = 0
      
      try {
        const elementsToRemove = []
        
        // More efficient element collection using querySelectorAll with optimized selectors
        const quickSelectors = [
          // High-priority obvious ad/paywall elements
          '.adblock-overlay, .disable-adblock, .paywall-overlay, .paywall-modal',
          '.subscription-overlay, .premium-wall, [data-ad-container], [data-ad-unit]',
          // Common ad elements
          '.advertisement, .ad-banner, .adsystem',
          // High z-index overlays that are likely modals
          '[style*="z-index: 999"], [style*="z-index:999"]'
        ]
        
        // Fast regex patterns for common blocked domains
        const blockedDomainPattern = /(doubleclick|googlesyndication|googletagmanager|facebook\.net|google-analytics)/
        
        // Collect elements to remove using targeted queries
        for (const selector of quickSelectors) {
          try {
            const elements = document.querySelectorAll(selector)
            for (let i = 0; i < elements.length; i++) {
              const element = elements[i]
              if (element && element.parentNode) {
                elementsToRemove.push(element)
              }
            }
          } catch (_error) {
            // Skip invalid selectors
          }
        }
        
        // Quick scan for elements with blocked src attributes (most common case)
        const srcElements = document.querySelectorAll('script[src], iframe[src]')
        for (let i = 0; i < srcElements.length; i++) {
          const element = srcElements[i]
          const src = element.src
          if (src && blockedDomainPattern.test(src)) {
            elementsToRemove.push(element)
          }
        }
        
        // Remove duplicates and batch remove
        const uniqueElements = [...new Set(elementsToRemove)]
        for (const element of uniqueElements) {
          if (element.parentNode && this._removeElement(element)) {
            removedCount++
          }
        }
        
      } catch (error) {
        this._logError('cleanDOMWithTreeWalker', error)
        // Fallback to even simpler method
        removedCount += this._cleanDOMMinimal()
      }
      
      return removedCount
    },

    /**
     * Minimal DOM cleaning method for maximum performance
     * @returns {number} Number of elements removed
     * @private
     */
    _cleanDOMMinimal() {
      let removedCount = 0
      
      try {
        // Only target the most obvious and common elements
        const elements = document.querySelectorAll('.adblock-overlay, .paywall-overlay, .paywall-modal, [data-ad-container]')
        for (let i = 0; i < elements.length; i++) {
          const element = elements[i]
          if (element && element.parentNode && this._removeElement(element)) {
            removedCount++
          }
        }
      } catch (error) {
        this._logError('cleanDOMMinimal', error)
      }
      
      return removedCount
    },

    /**
     * Get selector groups for batched processing
     * @param {boolean} isProtected - Whether the site is protected
     * @returns {Array} Array of selector group objects
     * @private
     */
    _getSelectorGroups(isProtected) {
      if (isProtected) {
        return [{
          selectors: [
            '.adblock-overlay',
            '.disable-adblock',
            '.paywall-overlay',
            '.paywall-modal',
            '.subscription-overlay',
            '[data-ad-container]',
            '[data-ad-unit]',
            'iframe[src*="doubleclick"]',
            'iframe[src*="googlesyndication"]'
          ].join(', '),
          validator: (element) => this._isLikelyAd(element)
        }]
      }

      // Break large selector list into smaller, more efficient groups
      const allSelectors = this.config.SELECTORS_TO_REMOVE
      const selectorGroups = []
      const groupSize = 6 // Smaller groups for better performance
      
      for (let i = 0; i < allSelectors.length; i += groupSize) {
        const group = allSelectors.slice(i, i + groupSize)
        selectorGroups.push({
          selectors: group.join(', '),
          validator: null
        })
      }
      
      // Add src-based selectors as a separate group
      selectorGroups.push({
        selectors: 'script[src], iframe[src], img[src], embed[src], object[data]',
        validator: (element) => {
          const src = element.src || element.data
          return src && this._isBlocked(src)
        }
      })
      
      return selectorGroups
    },

    /**
     * Traditional DOM cleaning for specific node sets
     * @param {Array} scope - Nodes to clean
     * @param {boolean} isProtected - Whether the site is protected
     * @private
     */
    _cleanDOMNodes(scope, isProtected) {
      let removedCount = 0

      // Be more conservative on protected sites
      if (isProtected) {
        this._log('Protected site detected, using conservative cleaning')
        const conservativeSelectors = [
          '.adblock-overlay',
          '.disable-adblock',
          '.paywall-overlay',
          '.paywall-modal',
          '.subscription-overlay',
          '[data-ad-container]',
          '[data-ad-unit]',
          'iframe[src*="doubleclick"]',
          'iframe[src*="googlesyndication"]'
        ].join(', ')

        scope.forEach(node => {
          if (!node || !node.nodeType) return
          try {
            if (node.querySelectorAll) {
              const elementsToRemove = node.querySelectorAll(conservativeSelectors)
              elementsToRemove.forEach(element => {
                if (this._isLikelyAd(element) && this._removeElement(element)) {
                  removedCount++
                }
              })
            }
          } catch (error) {
            this._logError('cleanDOM conservative mode', error)
          }
        })
      } else {
        // Normal cleaning for other sites - use chunked selectors
        const selectorGroups = this._getSelectorGroups(false)
        
        selectorGroups.forEach(group => {
          scope.forEach(node => {
            if (!node || !node.nodeType) return

            try {
              // Check if the node itself matches
              if (node.matches && node.matches(group.selectors)) {
                const isValid = group.validator ? group.validator(node) : true
                if (isValid && this._removeElement(node)) {
                  removedCount++
                }
              }

              // Query for children matching the selectors
              if (node.querySelectorAll) {
                const elementsToRemove = node.querySelectorAll(group.selectors)
                elementsToRemove.forEach(element => {
                  const isValid = group.validator ? group.validator(element) : true
                  if (isValid && this._removeElement(element)) {
                    removedCount++
                  }
                })
              }
            } catch (error) {
              this._logError('cleanDOM selector matching', error)
            }
          })
        })
      }

      // Remove high z-index overlays (likely modals/paywalls) - skip for protected sites
      if (!isProtected) {
        this._removeHighZIndexOverlays(scope)
        this._removeAdblockDialogs()
        this._removeBlurOverlays()
      }

      if (removedCount > 0) {
        this._log(`Cleaned ${removedCount} elements from DOM`)
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
            } catch (_error) {
              // Silently continue on style computation errors
            }
          })
        })
      } catch (error) {
        this._logError('_removeHighZIndexOverlays', error)
      }
    },

    /**
     * Detects and handles restricted content gracefully.
     * @private
     * @returns {Promise<boolean>} Whether content is restricted
     */
    async _detectRestrictedContent() {
      try {
        if (this.isRestrictedContent !== null) {
          return this.isRestrictedContent
        }

        const restrictedElements = document.querySelectorAll(
          this.config.RESTRICTED_CONTENT_SELECTORS.join(', ')
        )

        if (restrictedElements.length > 0) {
          this._log(`Detected ${restrictedElements.length} restricted content indicators`)
          this.isRestrictedContent = true
          await this._showFallbackMessage()
          return true
        }

        // Check for common login/subscription text patterns
        const textPatterns = [
          /log\s*in\s*to\s*continue/i,
          /subscribe\s*to\s*read/i,
          /premium\s*members\s*only/i,
          /sign\s*up\s*to\s*view/i,
          /registration\s*required/i
        ]

        const bodyText = document.body ? document.body.innerText : ''
        const hasRestrictedPattern = textPatterns.some(pattern => pattern.test(bodyText))

        if (hasRestrictedPattern) {
          this._log('Detected restricted content based on text patterns')
          this.isRestrictedContent = true
          await this._showFallbackMessage()
          return true
        }

        this.isRestrictedContent = false
        return false
      } catch (error) {
        this._logError('_detectRestrictedContent', error)
        return false
      }
    },

    /**
     * Shows fallback message for restricted content with Internet Archive option.
     * @private
     */
    async _showFallbackMessage() {
      try {
        const existingMessage = document.getElementById('uwb-fallback-message')
        if (existingMessage) return

        const messageDiv = document.createElement('div')
        messageDiv.id = 'uwb-fallback-message'
        messageDiv.setAttribute('data-uwb-injected', 'true')
        messageDiv.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
            font-size: 14px;
            max-width: 320px;
            line-height: 1.4;
          ">
            <div style="margin-bottom: 10px; font-weight: 600;">
              🛡️ Universal Web Bypass
            </div>
            <div style="margin-bottom: 12px;">
              This content appears to be restricted. Try viewing it through:
            </div>
            <a href="https://web.archive.org/web/*/${window.location.href}" 
               target="_blank" 
               style="
                 color: #a8e6cf;
                 text-decoration: none;
                 font-weight: 500;
                 display: inline-block;
                 margin-bottom: 8px;
               ">
              📚 Internet Archive
            </a>
            <div style="
              font-size: 11px;
              opacity: 0.8;
              cursor: pointer;
              text-align: right;
            " onclick="this.parentElement.parentElement.remove()">
              ✕ Close
            </div>
          </div>
        `

        document.body.appendChild(messageDiv)
        this._log('Fallback message displayed for restricted content')

        // Auto-remove after 10 seconds
        setTimeout(() => {
          if (messageDiv.parentElement) {
            messageDiv.remove()
          }
        }, 10000)
      } catch (error) {
        this._logError('_showFallbackMessage', error)
      }
    },

    /**
     * Detects and removes anti-adblock dialogs.
     * @private
     */
    _removeAdblockDialogs() {
      try {
        let removedCount = 0
        const adblockSelectors = this.config.ADBLOCK_DIALOG_SELECTORS

        adblockSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          elements.forEach(element => {
            if (this._isLikelyAdblockDialog(element)) {
              this._logBlockedElement('adblock-dialog', element, selector)
              if (this._removeElement(element)) {
                removedCount++
              }
            }
          })
        })

        // Also check for common anti-adblock text patterns
        const allElements = document.querySelectorAll('div, section, article, aside')
        allElements.forEach(element => {
          const text = element.innerText || ''
          if (this._containsAdblockText(text) && this._isLikelyAdblockDialog(element)) {
            this._logBlockedElement('adblock-dialog-text', element, 'text-based')
            if (this._removeElement(element)) {
              removedCount++
            }
          }
        })

        if (removedCount > 0) {
          this._log(`Removed ${removedCount} anti-adblock dialogs`)
        }
      } catch (error) {
        this._logError('_removeAdblockDialogs', error)
      }
    },

    /**
     * Checks if an element is likely an anti-adblock dialog.
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} Whether element is likely an adblock dialog
     * @private
     */
    _isLikelyAdblockDialog(element) {
      try {
        if (!element || !element.style) return false

        const style = window.getComputedStyle(element)
        const hasHighZIndex = parseInt(style.zIndex, 10) > 1000
        const isFixedOrAbsolute = ['fixed', 'absolute'].includes(style.position)
        const isLargeEnough = element.offsetHeight > 100 && element.offsetWidth > 200
        const isVisible = style.display !== 'none' && style.visibility !== 'hidden'

        return hasHighZIndex && isFixedOrAbsolute && isLargeEnough && isVisible
      } catch (_error) {
        return false
      }
    },

    /**
     * Checks if text contains anti-adblock messaging.
     * @param {string} text - Text to check
     * @returns {boolean} Whether text contains adblock messaging
     * @private
     */
    _containsAdblockText(text) {
      const adblockPatterns = [
        /disable.*ad.?block/i,
        /turn.*off.*ad.?block/i,
        /ad.?block.*detected/i,
        /please.*whitelist/i,
        /add.*to.*whitelist/i,
        /disable.*ad.?blocker/i,
        /we.*noticed.*ad.?block/i,
        /support.*us.*disable.*ad/i
      ]

      return adblockPatterns.some(pattern => pattern.test(text))
    },

    /**
     * Logs blocked elements for diagnostics.
     * @param {string} type - Type of blocked element
     * @param {HTMLElement} element - The blocked element
     * @param {string} selector - Selector used to find element
     * @private
     */
    _logBlockedElement(type, element, selector) {
      try {
        const logEntry = {
          type,
          selector,
          tagName: element.tagName,
          className: element.className,
          id: element.id,
          url: window.location.href,
          timestamp: Date.now()
        }

        this.blockedElementsLog.push(logEntry)
        
        // Keep only last 100 entries to prevent memory issues
        if (this.blockedElementsLog.length > 100) {
          this.blockedElementsLog = this.blockedElementsLog.slice(-50)
        }

        this._log(`Blocked element: ${type} - ${element.tagName}.${element.className}`)
        
        // Send to background script for storage
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
          chrome.runtime.sendMessage({
            action: 'logBlockedElement',
            data: logEntry
          }).catch(() => {
            // Silently fail if background script not available
          })
        }
      } catch (error) {
        this._logError('_logBlockedElement', error)
      }
    },

    /**
     * Enhanced blur overlay removal with more aggressive detection.
     * @private
     */
    _removeBlurOverlays() {
      try {
        let removedCount = 0
        
        // Check for CSS filter blur
        const allElements = document.querySelectorAll('*')
        allElements.forEach(element => {
          try {
            const style = window.getComputedStyle(element)
            if (style.filter && style.filter.includes('blur')) {
              element.style.filter = 'none'
              this._logBlockedElement('blur-overlay', element, 'css-filter')
              removedCount++
            }
          } catch (_error) {
            // Silently continue
          }
        })

        // Remove blur class-based overlays
        const blurSelectors = [
          '.content-blur',
          '.blurred-content',
          '[class*="blur"]',
          '[style*="blur"]'
        ]

        blurSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector)
          elements.forEach(element => {
            element.style.filter = 'none'
            element.style.webkitFilter = 'none'
            this._logBlockedElement('blur-class', element, selector)
            removedCount++
          })
        })

        if (removedCount > 0) {
          this._log(`Removed blur from ${removedCount} elements`)
        }
      } catch (error) {
        this._logError('_removeBlurOverlays', error)
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
            const now = Date.now()
            
            // Throttle mutations for performance on rapidly changing pages
            if (now - this.lastMutationTime < this.mutationThrottleInterval) {
              return
            }
            
            this.lastMutationTime = now
            
            let shouldClean = false
            const addedNodes = []
            let mutationCount = 0

            for (const mutation of mutations) {
              mutationCount++
              
              // Limit processing for very large mutation sets
              if (mutationCount > 50) {
                this._log('Large mutation set detected, limiting processing for performance')
                break
              }
              
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
