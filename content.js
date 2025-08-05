(function(){
  'use strict';

  // Prevent running on chrome:// or about:// pages to avoid errors
  if (window.location.protocol === 'chrome:' || 
      window.location.protocol === 'about:' || 
      window.location.href === 'about:blank') {
    return;
  }

  // Debug mode (can be enabled for troubleshooting)
  const DEBUG = false;
  const log = DEBUG ? console.log.bind(console, '🛡️ UWB:') : () => {};

  // Universal bypass function
  function universalBypass(){
    const BLOCKED_HOSTS = [
      'sb\\.scorecardresearch\\.com',
      'analytics\\.google\\.com',
      'google-analytics\\.com',
      'stats\\.g\\.doubleclick\\.net',
      'securepubads\\.g\\.doubleclick\\.net',
      'ads\\.pubmatic\\.com',
      'bat\\.bing\\.com',
      'analytics\\.tiktok\\.com',
      'connect\\.facebook\\.net',
      'static\\.ads-twitter\\.com',
      'ads\\.reddit\\.com',
      'sp\\.analytics\\.yahoo\\.com',
      'chartbeat\\.com',
      'chartbeat_mab\\.js',
      'imasdk\\.googleapis\\.com',
      'c\\.amazon-adsystem\\.com',
      'jsc\\.mgid\\.com',
      'comscore\\.(js|cloud)',
      'i\\.clean\\.gg',
      'm\\.stripe\\.network',
      'browser\\.sentry-cdn\\.com',
      'cdn\\.optimizely\\.com',
      'survey\\.survicate\\.com',
      'cdn\\.siftscience\\.com',
      'b-code\\.liadm\\.com',
      'impactcdn\\.com',
      'hb-scribd\\.s3\\.us-east-2\\.amazonaws\\.com',
      's-f\\.scribdassets\\.com',
      'googletagmanager\\.com',
      'googlesyndication\\.com',
      'amazon-adsystem\\.com',
      'adsystem\\.amazon',
      'outbrain\\.com',
      'taboola\\.com',
      'criteo\\.com',
      'pubmatic\\.com'
    ].map(p=>new RegExp(p,'i'));

    // Mute repetitive noise from console
    const SUPPRESS = [/^\[GET_CSS\]: result/, /net::ERR_BLOCKED_BY_CLIENT/, /Failed to load resource/];
    ['log','warn','error'].forEach(level=>{
      const orig=console[level];
      console[level]=(...args)=>{
        if(args.some(a=>SUPPRESS.some(rx=>rx.test(String(a))))) return;
        orig.apply(console,args);
      };
    });

    // Patch fetch to block tracking requests
    if (window.fetch && !window.fetch._bypassed) {
      const _fetch = window.fetch;
      window.fetch = function(req, init) {
        const url = (req && req.url) || req;
        if (typeof url === 'string' && BLOCKED_HOSTS.some(rx => rx.test(url))) {
          return new Promise(() => {}); // Never resolve blocked requests
        }
        return _fetch.apply(this, arguments);
      };
      window.fetch._bypassed = true;
    }

    // Patch XMLHttpRequest to block tracking requests
    if (window.XMLHttpRequest && !window.XMLHttpRequest.prototype._bypassed) {
      const proto = XMLHttpRequest.prototype;
      const originalOpen = proto.open;
      const originalSend = proto.send;
      
      proto.open = function(method, url) {
        this._isBlocked = typeof url === 'string' && BLOCKED_HOSTS.some(rx => rx.test(url));
        return originalOpen.apply(this, arguments);
      };
      
      proto.send = function(body) {
        if (this._isBlocked) return;
        return originalSend.apply(this, arguments);
      };
      
      window.XMLHttpRequest.prototype._bypassed = true;
    }

    // Function to remove blocked elements
    function removeBlockedElements() {
      try {
        // Remove tracking scripts and iframes
        ['script', 'iframe', 'img', 'embed', 'object'].forEach(tag => {
          document.querySelectorAll(`${tag}[src]`).forEach(el => {
            if (BLOCKED_HOSTS.some(rx => rx.test(el.src))) {
              console.log('🛡️ Blocked element:', el.src);
              el.remove();
            }
          });
        });

        // Remove common overlays, paywalls, and ad elements
        const blockSelectors = [
          '.adblock-overlay', '.disable-adblock', '.paywall', '.overlay',
          '[class*="paywall"]', '[id*="paywall"]', '[data-ad]', 
          'iframe[src*="ads"]', '.ad-container', '.advertisement',
          '[class*="ad-"]', '[id*="ad-"]', '.popup-overlay',
          '.modal-backdrop', '.cookie-banner', '.gdpr-banner',
          '[class*="modal"]', '[class*="popup"]', '[id*="popup"]',
          '.subscription-wall', '.premium-content-overlay',
          '[class*="subscribe"]', '[class*="membership"]'
        ];
        
        blockSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(element => {
            // Additional check to avoid removing important content
            if (element.offsetHeight > window.innerHeight * 0.3 || 
                element.classList.contains('paywall') ||
                element.classList.contains('overlay')) {
              console.log('🛡️ Removed overlay:', selector);
              element.remove();
            }
          });
        });
        
        // Remove elements with suspicious z-index values (likely overlays)
        document.querySelectorAll('*').forEach(el => {
          const style = window.getComputedStyle(el);
          const zIndex = parseInt(style.zIndex);
          if (zIndex > 9000 && style.position === 'fixed') {
            console.log('🛡️ Removed high z-index overlay:', el);
            el.remove();
          }
        });
      } catch (error) {
        // Silently handle any errors to avoid breaking the page
      }
    }

    // Apply CSS fixes to restore functionality
    function applyCSSFixes() {
      try {
        const style = document.createElement('style');
        style.textContent = `
          html, body {
            overflow: auto !important;
            filter: none !important;
            pointer-events: auto !important;
          }
          
          /* Remove common paywall styling */
          .paywall-blur { filter: none !important; }
          .paywall-overlay { display: none !important; }
          
          /* Ensure content is visible */
          [style*="display: none"] { display: block !important; }
          [style*="visibility: hidden"] { visibility: visible !important; }
          
          /* Remove scroll locks */
          body.no-scroll { overflow: auto !important; }
          body.modal-open { overflow: auto !important; }
        `;
        
        if (document.head) {
          document.head.appendChild(style);
        } else {
          document.addEventListener('DOMContentLoaded', () => {
            document.head.appendChild(style);
          });
        }
      } catch (error) {
        // Silently handle any errors
      }
    }

    // Run bypass functions
    removeBlockedElements();
    applyCSSFixes();

    // Set up mutation observer to handle dynamically added elements
    if (window.MutationObserver) {
      const observer = new MutationObserver(function(mutations) {
        let shouldCheck = false;
        mutations.forEach(mutation => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            shouldCheck = true;
          }
        });
        
        if (shouldCheck) {
          // Debounce the cleanup to avoid excessive calls
          clearTimeout(window._bypassCleanupTimeout);
          window._bypassCleanupTimeout = setTimeout(removeBlockedElements, 100);
        }
      });

      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }
  }

  // Run immediately if DOM is ready, otherwise wait for it
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', universalBypass);
  } else {
    universalBypass();
  }

  // Also run when the page is fully loaded
  if (document.readyState !== 'complete') {
    window.addEventListener('load', universalBypass);
  }
  
  // Log extension activation
  log('Extension activated on:', window.location.href);

})();