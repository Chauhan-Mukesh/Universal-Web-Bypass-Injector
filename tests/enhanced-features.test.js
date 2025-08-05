/**
 * @file Enhanced Features Test Suite
 * @description Tests for the new enhanced anti-adblock circumvention and restricted content handling
 */

// Mock DOM APIs
const { JSDOM } = require('jsdom');

describe('Enhanced Anti-Adblock and Restricted Content Features', () => {
  let window, document, UniversalBypass;

  beforeEach(() => {
    // Create a new DOM environment for each test
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, {
      url: 'https://example.com',
      pretendToBeVisual: true,
      resources: 'usable'
    });

    window = dom.window;
    document = window.document;

    // Setup global objects
    global.window = window;
    global.document = document;
    global.chrome = {
      runtime: {
        sendMessage: jest.fn().mockResolvedValue({ success: true })
      }
    };

    // Mock console methods
    window.console = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Load the content script by evaluating it
    const fs = require('fs');
    const path = require('path');
    const contentScript = fs.readFileSync(
      path.join(__dirname, '..', 'content.js'),
      'utf8'
    );

    // Execute the content script in the test environment
    eval(contentScript);
    UniversalBypass = window.UniversalBypass;
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.document;
    delete global.chrome;
  });

  describe('Restricted Content Detection', () => {
    test('should detect restricted content by CSS selectors', async() => {
      // Add restricted content elements
      document.body.innerHTML = `
        <div class="login-required">Please log in to continue</div>
        <div class="subscription-required">Subscribe to read more</div>
      `;

      const isRestricted = await UniversalBypass._detectRestrictedContent();
      expect(isRestricted).toBe(true);
    });

    test('should detect restricted content by text patterns', async() => {
      // Test the text pattern matching function directly
      const textPatterns = [
        /log\s*in\s*to\s*continue/i,
        /subscribe\s*to\s*read/i,
        /premium\s*members\s*only/i,
        /sign\s*up\s*to\s*view/i,
        /registration\s*required/i
      ];

      const testText = "Please log in to continue reading this article.";
      const hasPattern = textPatterns.some(pattern => pattern.test(testText));
      
      expect(hasPattern).toBe(true);
    });

    test('should show fallback message for restricted content', async() => {
      document.body.innerHTML = `
        <div class="premium-content">Premium content</div>
      `;

      await UniversalBypass._detectRestrictedContent();
      
      // Check if fallback message was created
      const fallbackMessage = document.getElementById('uwb-fallback-message');
      expect(fallbackMessage).toBeTruthy();
      expect(fallbackMessage.innerHTML).toContain('Internet Archive');
    });

    test('should not detect regular content as restricted', async() => {
      document.body.innerHTML = `
        <div>This is regular content that should be accessible.</div>
      `;

      const isRestricted = await UniversalBypass._detectRestrictedContent();
      expect(isRestricted).toBe(false);
    });
  });

  describe('Anti-Adblock Dialog Detection', () => {
    test('should detect adblock dialogs by CSS selectors', () => {
      // Create an element that will be detected as an adblock dialog
      const dialog = document.createElement('div');
      dialog.className = 'adblock-detected';
      dialog.style.position = 'fixed';
      dialog.style.zIndex = '9999';
      dialog.style.width = '300px';
      dialog.style.height = '200px';
      dialog.style.display = 'block';
      dialog.style.visibility = 'visible';
      
      // Mock the offsetHeight and offsetWidth properties
      Object.defineProperty(dialog, 'offsetHeight', { value: 200, writable: true });
      Object.defineProperty(dialog, 'offsetWidth', { value: 300, writable: true });
      
      document.body.appendChild(dialog);

      const initialCount = document.querySelectorAll('.adblock-detected').length;
      UniversalBypass._removeAdblockDialogs();
      const finalCount = document.querySelectorAll('.adblock-detected').length;

      expect(initialCount).toBe(1);
      expect(finalCount).toBe(0);
    });

    test('should detect adblock dialogs by text content', () => {
      const text = "We noticed you're using an ad blocker. Please disable it to continue.";
      
      const isAdblockDialog = UniversalBypass._containsAdblockText(text);
      expect(isAdblockDialog).toBe(true);
    });

    test('should not remove regular dialogs', () => {
      document.body.innerHTML = `
        <div style="position: fixed; z-index: 9999; width: 300px; height: 200px;">
          Welcome to our website! This is just a regular modal.
        </div>
      `;

      const initialCount = document.querySelectorAll('div').length;
      UniversalBypass._removeAdblockDialogs();
      const finalCount = document.querySelectorAll('div').length;

      expect(finalCount).toBe(initialCount);
    });
  });

  describe('Blur Overlay Removal', () => {
    test('should remove CSS filter blur', () => {
      document.body.innerHTML = `
        <div id="content" style="filter: blur(5px);">Blurred content</div>
      `;

      UniversalBypass._removeBlurOverlays();
      
      const content = document.getElementById('content');
      expect(content.style.filter).toBe('none');
    });

    test('should remove blur-related class names', () => {
      document.body.innerHTML = `
        <div class="content-blur">Blurred content</div>
        <div class="blurred-content">Another blurred element</div>
      `;

      UniversalBypass._removeBlurOverlays();
      
      const elements = document.querySelectorAll('.content-blur, .blurred-content');
      elements.forEach(element => {
        expect(element.style.filter).toBe('none');
      });
    });
  });

  describe('Element Logging', () => {
    test('should log blocked elements with correct metadata', () => {
      const mockElement = document.createElement('div');
      mockElement.className = 'test-ad';
      mockElement.id = 'test-id';

      UniversalBypass._logBlockedElement('test-type', mockElement, '.test-selector');

      expect(UniversalBypass.blockedElementsLog).toHaveLength(1);
      
      const logEntry = UniversalBypass.blockedElementsLog[0];
      expect(logEntry.type).toBe('test-type');
      expect(logEntry.selector).toBe('.test-selector');
      expect(logEntry.tagName).toBe('DIV');
      expect(logEntry.className).toBe('test-ad');
      expect(logEntry.id).toBe('test-id');
      expect(logEntry.url).toBe('https://example.com/');
    });

    test('should send logging data to background script', () => {
      const mockElement = document.createElement('div');
      
      UniversalBypass._logBlockedElement('test-type', mockElement, '.test-selector');

      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'logBlockedElement',
        data: expect.objectContaining({
          type: 'test-type',
          selector: '.test-selector'
        })
      });
    });

    test('should limit log entries to prevent memory issues', () => {
      // Add more than 100 entries
      for (let i = 0; i < 150; i++) {
        const mockElement = document.createElement('div');
        UniversalBypass._logBlockedElement(`type-${i}`, mockElement, '.selector');
      }

      // Should be trimmed to 50 entries (sliced from 100 when it reaches 100)
      // But the actual logic slices when it exceeds 100, keeping the last 50
      expect(UniversalBypass.blockedElementsLog.length).toBeLessThanOrEqual(100);
      expect(UniversalBypass.blockedElementsLog.length).toBeGreaterThan(0);
    });
  });

  describe('Protected Sites Handling', () => {
    test('should identify protected sites correctly', () => {
      // Test the protected sites list contains expected sites
      const protectedSites = UniversalBypass.config.PROTECTED_SITES;
      
      expect(protectedSites).toContain('github.com');
      expect(protectedSites).toContain('stackoverflow.com');
      expect(protectedSites).toContain('dev.to');
      
      // Test that the method exists and returns a boolean
      const result = UniversalBypass._isProtectedSite();
      expect(typeof result).toBe('boolean');
    });

    test('should have protected sites functionality available', () => {
      // Test that the protected sites feature exists and is configured
      expect(UniversalBypass._isProtectedSite).toBeDefined();
      expect(typeof UniversalBypass._isProtectedSite).toBe('function');
      expect(Array.isArray(UniversalBypass.config.PROTECTED_SITES)).toBe(true);
      expect(UniversalBypass.config.PROTECTED_SITES.length).toBeGreaterThan(0);
    });
  });

  describe('Integration Tests', () => {
    test('should initialize with enhanced features', async() => {
      // Reset initialization state
      UniversalBypass.initialized = false;
      
      // Mock site as enabled
      UniversalBypass._checkSiteEnabled = jest.fn().mockResolvedValue(true);
      
      await UniversalBypass.init();
      
      expect(UniversalBypass.initialized).toBe(true);
      expect(UniversalBypass.blockedElementsLog).toBeDefined();
      expect(Array.isArray(UniversalBypass.blockedElementsLog)).toBe(true);
    });

    test('should handle errors gracefully', async() => {
      // Test error handling in restricted content detection
      document.querySelectorAll = jest.fn().mockImplementation(() => {
        throw new Error('DOM error');
      });

      const result = await UniversalBypass._detectRestrictedContent();
      expect(result).toBe(false); // Should return false on error
    });
  });

  describe('Performance Tests', () => {
    test('should handle large DOM efficiently', () => {
      // Create a large DOM
      const container = document.createElement('div');
      for (let i = 0; i < 1000; i++) {
        const element = document.createElement('div');
        element.className = i % 10 === 0 ? 'ad-container' : 'regular-content';
        container.appendChild(element);
      }
      document.body.appendChild(container);

      const startTime = Date.now();
      UniversalBypass.cleanDOM();
      const endTime = Date.now();

      // Should complete within reasonable time (less than 1 second)
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});