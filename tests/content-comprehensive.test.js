/**
 * @file Comprehensive Content Script Tests
 * @description Complete test suite to achieve ≥90% coverage for content.js
 */

describe('UniversalBypass Comprehensive Coverage', () => {
  let originalWindow;
  let originalDocument;
  let originalChrome;
  let mockElement;
  let UniversalBypass;

  beforeEach(() => {
    // Save originals
    originalWindow = global.window;
    originalDocument = global.document;
    originalChrome = global.chrome;

    // Reset mocks
    jest.clearAllMocks();

    // Mock comprehensive DOM element
    mockElement = {
      tagName: 'DIV',
      className: '',
      id: '',
      src: '',
      data: '',
      innerHTML: '',
      innerText: '',
      textContent: '',
      style: { 
        filter: '',
        webkitFilter: '',
        maxHeight: '',
        overflow: '',
        webkitMaskImage: '',
        maskImage: '',
        display: '',
        visibility: '',
        position: '',
        zIndex: '1'
      },
      offsetWidth: 100,
      offsetHeight: 100,
      onclick: null,
      onload: null,
      onerror: null,
      classList: {
        contains: jest.fn(() => false),
        remove: jest.fn(),
        add: jest.fn()
      },
      remove: jest.fn(),
      parentNode: {
        removeChild: jest.fn()
      },
      querySelector: jest.fn(() => mockElement),
      querySelectorAll: jest.fn(() => [mockElement]),
      matches: jest.fn(() => false),
      appendChild: jest.fn(),
      insertBefore: jest.fn()
    };

    // Mock comprehensive window
    global.window = {
      location: {
        protocol: 'https:',
        hostname: 'example.com',
        href: 'https://example.com'
      },
      addEventListener: jest.fn(),
      fetch: jest.fn(),
      XMLHttpRequest: jest.fn(() => ({
        open: jest.fn(),
        send: jest.fn()
      })),
      getComputedStyle: jest.fn(() => ({
        filter: 'none',
        position: 'static',
        zIndex: '1'
      })),
      innerHeight: 600,
      MutationObserver: jest.fn(() => ({
        observe: jest.fn(),
        disconnect: jest.fn()
      })),
      URL: jest.fn((url) => ({
        hostname: 'example.com',
        protocol: 'https:'
      }))
    };

    // Mock comprehensive document
    global.document = {
      readyState: 'complete',
      documentElement: mockElement,
      head: mockElement,
      body: mockElement,
      getElementById: jest.fn(() => mockElement),
      querySelector: jest.fn(() => mockElement),
      querySelectorAll: jest.fn(() => [mockElement]),
      createElement: jest.fn(() => mockElement),
      addEventListener: jest.fn()
    };

    // Mock Chrome APIs
    global.chrome = {
      runtime: {
        sendMessage: jest.fn((message, callback) => {
          const responses = {
            getSiteStatus: { enabled: true, hostname: 'example.com' },
            bypassStatus: { success: true },
            logBlockedElement: { success: true }
          };
          const response = responses[message.action] || { success: true };
          if (callback) setTimeout(() => callback(response), 1);
          return Promise.resolve(response);
        })
      }
    };

    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    // Mock URL constructor
    global.URL = jest.fn((url) => ({
      hostname: 'example.com',
      protocol: 'https:'
    }));

    // Load content script and get UniversalBypass
    delete require.cache[require.resolve('../content.js')];
    require('../content.js');
    UniversalBypass = global.UniversalBypass;
  });

  afterEach(() => {
    global.window = originalWindow;
    global.document = originalDocument;
    global.chrome = originalChrome;
  });

  describe('Early Exit Conditions', () => {
    test('should exit early for chrome: protocol', () => {
      global.window = {
        location: { protocol: 'chrome:', href: 'chrome://extensions' }
      };

      // Re-require to test early exit
      delete require.cache[require.resolve('../content.js')];
      const result = require('../content.js');
      
      // Should not define UniversalBypass
      expect(global.UniversalBypass).toBeUndefined();
    });

    test('should exit early for about: protocol', () => {
      global.window = {
        location: { protocol: 'about:', href: 'about:blank' }
      };

      delete require.cache[require.resolve('../content.js')];
      require('../content.js');
      
      expect(global.UniversalBypass).toBeUndefined();
    });

    test('should exit early for chrome-extension: protocol', () => {
      global.window = {
        location: { protocol: 'chrome-extension:', href: 'chrome-extension://test' }
      };

      delete require.cache[require.resolve('../content.js')];
      require('../content.js');
      
      expect(global.UniversalBypass).toBeUndefined();
    });
  });

  describe('Protected Sites Detection', () => {
    test('should detect protected sites correctly', () => {
      // Mock the protected site check directly
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'github.com' };
      
      const isProtected = UniversalBypass._isProtectedSite();
      expect(isProtected).toBe(true);
      
      global.window.location = originalLocation;
    });

    test('should detect non-protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      
      const isProtected = UniversalBypass._isProtectedSite();
      expect(isProtected).toBe(false);
      
      global.window.location = originalLocation;
    });

    test('should handle subdomain protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'api.github.com' };
      
      const isProtected = UniversalBypass._isProtectedSite();
      expect(isProtected).toBe(true);
      
      global.window.location = originalLocation;
    });
  });

  describe('Site Status Checking', () => {
    test('should check site status successfully', async () => {
      const result = await UniversalBypass._checkSiteEnabled('example.com');
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'getSiteStatus',
        hostname: 'example.com'
      }, expect.any(Function));
      expect(result).toBe(true);
    });

    test('should handle site status check errors', async () => {
      chrome.runtime.sendMessage.mockImplementationOnce(() => {
        throw new Error('Runtime error');
      });

      const result = await UniversalBypass._checkSiteEnabled('example.com');
      
      expect(result).toBe(true); // Default to enabled on error
    });

    test('should handle disabled site response', async () => {
      chrome.runtime.sendMessage.mockImplementationOnce((message, callback) => {
        if (callback) callback({ enabled: false });
      });

      const result = await UniversalBypass._checkSiteEnabled('example.com');
      
      expect(result).toBe(false);
    });
  });

  describe('Error Handling and Logging', () => {
    test('should log errors with context', () => {
      UniversalBypass._logError('test-context', new Error('Test error'));
      
      expect(console.error).toHaveBeenCalledWith('🛡️ UWB Error in test-context:', expect.any(Error));
    });

    test('should respect debug mode for logging', () => {
      UniversalBypass.DEBUG = true;
      UniversalBypass._log('Test message');
      
      expect(console.log).toHaveBeenCalledWith('🛡️ UWB:', 'Test message');
      
      UniversalBypass.DEBUG = false;
    });

    test('should not log when debug is disabled', () => {
      UniversalBypass.DEBUG = false;
      UniversalBypass._log('Test message');
      
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('URL Blocking Detection', () => {
    test('should detect blocked URLs correctly', () => {
      const blockedUrl = 'https://analytics.google.com/track';
      const result = UniversalBypass._isBlocked(blockedUrl);
      
      expect(result).toBe(true);
    });

    test('should handle non-blocked URLs', () => {
      const cleanUrl = 'https://example.com/page';
      const result = UniversalBypass._isBlocked(cleanUrl);
      
      expect(result).toBe(false);
    });

    test('should handle invalid URLs', () => {
      const result1 = UniversalBypass._isBlocked(null);
      const result2 = UniversalBypass._isBlocked('');
      const result3 = UniversalBypass._isBlocked(123);
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });

    test('should handle regex errors gracefully', () => {
      // Mock regex test to throw error
      const originalConfig = UniversalBypass.config.BLOCKED_HOSTS;
      UniversalBypass.config.BLOCKED_HOSTS = [{
        test: jest.fn(() => { throw new Error('Regex error'); })
      }];

      const result = UniversalBypass._isBlocked('https://test.com');
      
      expect(result).toBe(false);
      
      // Restore
      UniversalBypass.config.BLOCKED_HOSTS = originalConfig;
    });
  });

  describe('Ad Detection', () => {
    test('should detect likely ads by class name', () => {
      mockElement.className = 'advertisement';
      mockElement.offsetWidth = 728;
      mockElement.offsetHeight = 90;
      
      const result = UniversalBypass._isLikelyAd(mockElement);
      expect(result).toBe(true);
    });

    test('should detect ads by common dimensions', () => {
      mockElement.className = '';
      mockElement.offsetWidth = 300;
      mockElement.offsetHeight = 250;
      
      const result = UniversalBypass._isLikelyAd(mockElement);
      expect(result).toBe(true);
    });

    test('should not flag essential content as ads', () => {
      mockElement.className = 'advertisement';
      mockElement.querySelector = jest.fn(() => ({
        tagName: 'ARTICLE'
      }));
      
      const result = UniversalBypass._isLikelyAd(mockElement);
      expect(result).toBe(false);
    });

    test('should handle ad detection errors', () => {
      const errorElement = {
        get className() { throw new Error('Property error'); }
      };
      
      const result = UniversalBypass._isLikelyAd(errorElement);
      expect(result).toBe(false);
    });
  });

  describe('Element Removal', () => {
    test('should remove elements safely', () => {
      const result = UniversalBypass._removeElement(mockElement);
      
      expect(mockElement.remove).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should not remove essential elements', () => {
      mockElement.tagName = 'HTML';
      
      const result = UniversalBypass._removeElement(mockElement);
      
      expect(mockElement.remove).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should not remove elements with essential IDs', () => {
      mockElement.id = 'main-content';
      
      const result = UniversalBypass._removeElement(mockElement);
      
      expect(mockElement.remove).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should not remove elements with event listeners', () => {
      mockElement.onclick = jest.fn();
      
      const result = UniversalBypass._removeElement(mockElement);
      
      expect(mockElement.remove).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    test('should handle removal errors gracefully', () => {
      mockElement.remove = jest.fn(() => { throw new Error('Remove error'); });
      
      const result = UniversalBypass._removeElement(mockElement);
      
      expect(result).toBe(false);
    });

    test('should handle null elements', () => {
      const result = UniversalBypass._removeElement(null);
      
      expect(result).toBe(false);
    });
  });

  describe('Console Noise Suppression', () => {
    test('should suppress console noise on non-protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      
      UniversalBypass.suppressConsoleNoise();
      
      // Original methods should be preserved
      expect(console.log._bypassed).toBe(true);
      expect(console.warn._bypassed).toBe(true);
      expect(console.error._bypassed).toBe(true);
      
      global.window.location = originalLocation;
    });

    test('should not suppress console on protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'github.com' };
      
      UniversalBypass.suppressConsoleNoise();
      
      expect(console.log._bypassed).toBeUndefined();
      
      global.window.location = originalLocation;
    });

    test('should suppress matching console patterns', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      const originalLog = console.log;
      
      UniversalBypass.suppressConsoleNoise();
      
      // Test suppressed message
      console.log('net::ERR_BLOCKED_BY_CLIENT error occurred');
      expect(originalLog).not.toHaveBeenCalled();
      
      // Test non-suppressed message
      console.log('Normal log message');
      expect(originalLog).toHaveBeenCalledWith('Normal log message');
      
      global.window.location = originalLocation;
    });

    test('should handle console suppression errors', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      
      // Mock console methods that throw errors
      const originalLog = console.log;
      console.log = jest.fn(() => { throw new Error('Console error'); });
      
      UniversalBypass.suppressConsoleNoise();
      
      // Should not crash
      expect(console.log._bypassed).toBe(true);
      
      global.window.location = originalLocation;
    });
  });

  describe('Network Request Patching', () => {
    test('should patch fetch for non-protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      const originalFetch = window.fetch;
      
      UniversalBypass.patchNetworkRequests();
      
      expect(window.fetch).not.toBe(originalFetch);
      expect(window.fetch._bypassed).toBe(true);
      
      global.window.location = originalLocation;
    });

    test('should not patch network on protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'github.com' };
      const originalFetch = window.fetch;
      
      UniversalBypass.patchNetworkRequests();
      
      expect(window.fetch).toBe(originalFetch);
      
      global.window.location = originalLocation;
    });

    test('should block fetch requests to blocked URLs', async () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      UniversalBypass.patchNetworkRequests();
      
      try {
        await window.fetch('https://analytics.google.com/track');
      } catch (error) {
        expect(error.message).toContain('Bypassed fetch');
      }
      
      global.window.location = originalLocation;
    });

    test('should allow fetch requests to clean URLs', async () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      const mockResponse = { ok: true };
      const originalFetch = window.fetch;
      window.fetch = jest.fn().mockResolvedValue(mockResponse);
      
      UniversalBypass.patchNetworkRequests();
      
      const result = await window.fetch('https://example.com/clean');
      expect(result).toBe(mockResponse);
      
      global.window.location = originalLocation;
    });

    test('should handle fetch patching errors', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      delete window.fetch; // Remove fetch to test error handling
      
      UniversalBypass.patchNetworkRequests();
      
      // Should not crash
      expect(console.error).not.toHaveBeenCalled();
      
      global.window.location = originalLocation;
    });

    test('should patch XMLHttpRequest', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      const originalXHR = window.XMLHttpRequest;
      
      UniversalBypass.patchNetworkRequests();
      
      expect(XMLHttpRequest.prototype._bypassed).toBe(true);
      
      global.window.location = originalLocation;
    });

    test('should block XHR requests to blocked URLs', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      UniversalBypass.patchNetworkRequests();
      
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://analytics.google.com/track');
      xhr.send();
      
      expect(xhr._uwbBlocked).toBe(true);
      
      global.window.location = originalLocation;
    });
  });

  describe('DOM Cleaning', () => {
    test('should clean DOM selectors on non-protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      mockElement.matches = jest.fn(() => true);
      
      UniversalBypass.cleanDOM([mockElement]);
      
      expect(mockElement.remove).toHaveBeenCalled();
      
      global.window.location = originalLocation;
    });

    test('should use conservative cleaning on protected sites', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'github.com' };
      mockElement.className = 'adblock-overlay';
      
      UniversalBypass.cleanDOM([mockElement]);
      
      // Should still remove obvious ad elements even on protected sites
      expect(mockElement.remove).toHaveBeenCalled();
      
      global.window.location = originalLocation;
    });

    test('should clean elements with blocked src attributes', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      mockElement.tagName = 'SCRIPT';
      mockElement.src = 'https://analytics.google.com/script.js';
      mockElement.matches = jest.fn(() => true);
      
      UniversalBypass.cleanDOM([mockElement]);
      
      expect(mockElement.remove).toHaveBeenCalled();
      
      global.window.location = originalLocation;
    });

    test('should handle DOM cleaning errors gracefully', () => {
      global.window.location.hostname = 'example.com';
      mockElement.querySelectorAll = jest.fn(() => { throw new Error('Query error'); });
      
      UniversalBypass.cleanDOM([mockElement]);
      
      expect(console.error).toHaveBeenCalled();
    });

    test('should handle empty node list', () => {
      UniversalBypass.cleanDOM([]);
      
      // Should not crash
      expect(console.error).not.toHaveBeenCalled();
    });

    test('should handle null nodes', () => {
      UniversalBypass.cleanDOM([null, undefined]);
      
      // Should not crash
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('High Z-Index Overlay Removal', () => {
    test('should remove high z-index overlays', () => {
      global.window.location.hostname = 'example.com';
      global.window.getComputedStyle = jest.fn(() => ({
        zIndex: '9999',
        position: 'fixed'
      }));
      mockElement.offsetHeight = 400; // > 30% of window height
      
      UniversalBypass._removeHighZIndexOverlays([mockElement]);
      
      expect(mockElement.remove).toHaveBeenCalled();
    });

    test('should not remove low z-index elements', () => {
      global.window.getComputedStyle = jest.fn(() => ({
        zIndex: '100',
        position: 'fixed'
      }));
      
      UniversalBypass._removeHighZIndexOverlays([mockElement]);
      
      expect(mockElement.remove).not.toHaveBeenCalled();
    });

    test('should handle getComputedStyle errors', () => {
      global.window.getComputedStyle = jest.fn(() => { throw new Error('Style error'); });
      
      UniversalBypass._removeHighZIndexOverlays([mockElement]);
      
      // Should not crash
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('Restricted Content Detection', () => {
    test('should detect restricted content', async () => {
      document.querySelectorAll = jest.fn(() => [mockElement]);
      
      const result = await UniversalBypass._detectRestrictedContent();
      
      expect(result).toBe(true);
      expect(UniversalBypass.isRestrictedContent).toBe(true);
    });

    test('should detect restricted content by text patterns', async () => {
      document.querySelectorAll = jest.fn(() => []);
      document.body = { innerText: 'Please log in to continue reading this article' };
      
      const result = await UniversalBypass._detectRestrictedContent();
      
      expect(result).toBe(true);
    });

    test('should not detect restricted content on clean pages', async () => {
      document.querySelectorAll = jest.fn(() => []);
      document.body = { innerText: 'This is a normal article without restrictions' };
      
      const result = await UniversalBypass._detectRestrictedContent();
      
      expect(result).toBe(false);
    });

    test('should handle detection errors', async () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Query error'); });
      
      const result = await UniversalBypass._detectRestrictedContent();
      
      expect(result).toBe(false);
    });

    test('should return cached result', async () => {
      UniversalBypass.isRestrictedContent = true;
      
      const result = await UniversalBypass._detectRestrictedContent();
      
      expect(result).toBe(true);
    });
  });

  describe('Fallback Message Display', () => {
    test('should show fallback message for restricted content', async () => {
      document.getElementById = jest.fn(() => null); // No existing message
      
      await UniversalBypass._showFallbackMessage();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    test('should not show duplicate fallback messages', async () => {
      document.getElementById = jest.fn(() => mockElement); // Existing message
      
      await UniversalBypass._showFallbackMessage();
      
      expect(document.createElement).not.toHaveBeenCalled();
    });

    test('should handle fallback message errors', async () => {
      document.createElement = jest.fn(() => { throw new Error('Create error'); });
      
      await UniversalBypass._showFallbackMessage();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Anti-Adblock Circumvention', () => {
    test('should remove anti-adblock dialogs', () => {
      mockElement.className = 'adblock-detected';
      global.window.getComputedStyle = jest.fn(() => ({
        zIndex: '9999',
        position: 'fixed',
        display: 'block',
        visibility: 'visible'
      }));
      mockElement.offsetHeight = 200;
      mockElement.offsetWidth = 300;
      
      UniversalBypass._removeAdblockDialogs();
      
      expect(mockElement.remove).toHaveBeenCalled();
    });

    test('should detect adblock text patterns', () => {
      const result = UniversalBypass._containsAdblockText('Please disable your ad blocker to continue');
      
      expect(result).toBe(true);
    });

    test('should not detect clean text as adblock', () => {
      const result = UniversalBypass._containsAdblockText('This is normal content');
      
      expect(result).toBe(false);
    });

    test('should identify likely adblock dialogs', () => {
      global.window.getComputedStyle = jest.fn(() => ({
        zIndex: '9999',
        position: 'fixed',
        display: 'block',
        visibility: 'visible'
      }));
      mockElement.offsetHeight = 200;
      mockElement.offsetWidth = 300;
      
      const result = UniversalBypass._isLikelyAdblockDialog(mockElement);
      
      expect(result).toBe(true);
    });

    test('should not flag small elements as adblock dialogs', () => {
      global.window.getComputedStyle = jest.fn(() => ({
        zIndex: '9999',
        position: 'fixed',
        display: 'block',
        visibility: 'visible'
      }));
      mockElement.offsetHeight = 50;
      mockElement.offsetWidth = 50;
      
      const result = UniversalBypass._isLikelyAdblockDialog(mockElement);
      
      expect(result).toBe(false);
    });
  });

  describe('Blur Overlay Removal', () => {
    test('should remove CSS filter blur', () => {
      global.window.getComputedStyle = jest.fn(() => ({
        filter: 'blur(5px)'
      }));
      document.querySelectorAll = jest.fn(() => [mockElement]);
      
      UniversalBypass._removeBlurOverlays();
      
      expect(mockElement.style.filter).toBe('none');
    });

    test('should remove blur class overlays', () => {
      document.querySelectorAll = jest.fn((selector) => {
        if (selector.includes('blur')) return [mockElement];
        return [];
      });
      
      UniversalBypass._removeBlurOverlays();
      
      expect(mockElement.style.filter).toBe('none');
      expect(mockElement.style.webkitFilter).toBe('none');
    });

    test('should handle blur removal errors', () => {
      global.window.getComputedStyle = jest.fn(() => { throw new Error('Style error'); });
      document.querySelectorAll = jest.fn(() => [mockElement]);
      
      UniversalBypass._removeBlurOverlays();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Element Logging', () => {
    test('should log blocked elements', () => {
      UniversalBypass._logBlockedElement('ad', mockElement, '.advertisement');
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'logBlockedElement',
        data: expect.objectContaining({
          type: 'ad',
          selector: '.advertisement',
          tagName: 'DIV'
        })
      }, expect.any(Function));
    });

    test('should limit blocked elements log size', () => {
      // Fill log to capacity
      for (let i = 0; i < 150; i++) {
        UniversalBypass.blockedElementsLog.push({ type: 'test', id: i });
      }
      
      UniversalBypass._logBlockedElement('new', mockElement, '.new');
      
      expect(UniversalBypass.blockedElementsLog.length).toBeLessThanOrEqual(50);
    });

    test('should handle logging errors', () => {
      chrome.runtime.sendMessage.mockImplementationOnce(() => {
        throw new Error('Send error');
      });
      
      UniversalBypass._logBlockedElement('ad', mockElement, '.advertisement');
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Page Functionality Restoration', () => {
    test('should restore page functionality', async () => {
      document.getElementById = jest.fn(() => null); // No existing styles
      
      await UniversalBypass.restorePageFunctionality();
      
      expect(document.createElement).toHaveBeenCalledWith('style');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    test('should not add duplicate styles', async () => {
      document.getElementById = jest.fn(() => mockElement); // Existing styles
      
      await UniversalBypass.restorePageFunctionality();
      
      expect(document.createElement).not.toHaveBeenCalled();
    });

    test('should handle style injection errors', async () => {
      document.head = null;
      
      await UniversalBypass.restorePageFunctionality();
      
      // Should not crash
      expect(console.error).not.toHaveBeenCalled();
    });
  });

  describe('DOM Mutation Observation', () => {
    test('should setup mutation observer', () => {
      UniversalBypass.observeDOMChanges();
      
      expect(window.MutationObserver).toHaveBeenCalled();
      expect(UniversalBypass.observer).toBeDefined();
    });

    test('should handle missing MutationObserver', () => {
      const originalMutationObserver = window.MutationObserver;
      window.MutationObserver = undefined;
      
      UniversalBypass.observeDOMChanges();
      
      expect(console.log).toHaveBeenCalledWith('MutationObserver not available');
      
      window.MutationObserver = originalMutationObserver;
    });

    test('should handle mutation observer errors', () => {
      window.MutationObserver = jest.fn(() => { throw new Error('Observer error'); });
      
      UniversalBypass.observeDOMChanges();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Background Communication', () => {
    test('should notify background script', () => {
      UniversalBypass._notifyBackgroundScript();
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'bypassStatus',
        url: 'https://example.com',
        timestamp: expect.any(Number)
      });
    });

    test('should handle notification errors gracefully', () => {
      chrome.runtime.sendMessage.mockImplementationOnce(() => {
        throw new Error('Runtime error');
      });
      
      UniversalBypass._notifyBackgroundScript();
      
      // Should not crash
      expect(console.error).not.toHaveBeenCalled();
    });

    test('should handle missing chrome runtime', () => {
      const originalChrome = global.chrome;
      global.chrome = undefined;
      
      UniversalBypass._notifyBackgroundScript();
      
      // Should not crash
      expect(console.error).not.toHaveBeenCalled();
      
      global.chrome = originalChrome;
    });
  });

  describe('Initialization and Cleanup', () => {
    test('should initialize successfully', async () => {
      await UniversalBypass.init();
      
      expect(UniversalBypass.initialized).toBe(true);
    });

    test('should handle initialization when already initialized', async () => {
      UniversalBypass.initialized = true;
      
      await UniversalBypass.init();
      
      expect(console.log).toHaveBeenCalledWith('Already initialized, skipping...');
    });

    test('should cleanup resources on destroy', () => {
      UniversalBypass.observer = { disconnect: jest.fn() };
      UniversalBypass.cleanupTimeout = 123;
      
      UniversalBypass.destroy();
      
      expect(UniversalBypass.observer.disconnect).toHaveBeenCalled();
      expect(UniversalBypass.initialized).toBe(false);
    });

    test('should handle cleanup errors', () => {
      UniversalBypass.observer = {
        disconnect: jest.fn(() => { throw new Error('Disconnect error'); })
      };
      
      UniversalBypass.destroy();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Alternative Access Suggestions', () => {
    test('should suggest alternative access methods', () => {
      UniversalBypass._suggestAlternativeAccess();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(mockElement.appendChild).toHaveBeenCalled();
    });

    test('should handle suggestion display errors', () => {
      document.createElement = jest.fn(() => { throw new Error('Create error'); });
      
      UniversalBypass._suggestAlternativeAccess();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Preview Content Revelation', () => {
    test('should reveal preview content', () => {
      document.querySelectorAll = jest.fn((selector) => {
        if (selector.includes('blur')) return [mockElement];
        if (selector.includes('truncated')) return [mockElement];
        return [];
      });
      
      UniversalBypass._revealPreviewContent();
      
      expect(mockElement.style.filter).toBe('none');
      expect(mockElement.style.maxHeight).toBe('none');
    });

    test('should handle preview revelation errors', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Query error'); });
      
      UniversalBypass._revealPreviewContent();
      
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Content Restrictions Handling', () => {
    test('should handle restricted content gracefully', () => {
      document.querySelectorAll = jest.fn(() => [mockElement]);
      
      const result = UniversalBypass._handleRestrictedContent();
      
      expect(result).toBe(true);
    });

    test('should not handle unrestricted content', () => {
      document.querySelectorAll = jest.fn(() => []);
      
      const result = UniversalBypass._handleRestrictedContent();
      
      expect(result).toBe(false);
    });

    test('should handle restricted content detection errors', () => {
      document.querySelectorAll = jest.fn(() => { throw new Error('Query error'); });
      
      const result = UniversalBypass._handleRestrictedContent();
      
      expect(result).toBe(false);
    });
  });

  describe('Global Error Handling', () => {
    test('should setup global error handler on non-protected sites', () => {
      const originalLocation = global.window.location;
      const mockAddEventListener = jest.fn();
      global.window.location = { hostname: 'example.com' };
      global.window.addEventListener = mockAddEventListener;
      
      UniversalBypass.setupGlobalErrorHandler();
      
      expect(mockAddEventListener).toHaveBeenCalledWith('error', expect.any(Function), true);
      expect(mockAddEventListener).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
      
      global.window.location = originalLocation;
    });

    test('should not setup error handler on protected sites', () => {
      const originalLocation = global.window.location;
      const mockAddEventListener = jest.fn();
      global.window.location = { hostname: 'github.com' };
      global.window.addEventListener = mockAddEventListener;
      
      UniversalBypass.setupGlobalErrorHandler();
      
      // Should return early
      expect(mockAddEventListener).not.toHaveBeenCalled();
      
      global.window.location = originalLocation;
    });

    test('should handle error handler setup errors', () => {
      const originalLocation = global.window.location;
      global.window.location = { hostname: 'example.com' };
      global.window.addEventListener = jest.fn(() => { throw new Error('Listener error'); });
      
      UniversalBypass.setupGlobalErrorHandler();
      
      expect(console.error).toHaveBeenCalled();
      
      global.window.location = originalLocation;
    });
  });
});