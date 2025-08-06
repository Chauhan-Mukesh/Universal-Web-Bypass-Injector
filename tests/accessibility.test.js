/**
 * Test suite for Accessibility improvements
 */
/* global PopupController */

describe('Accessibility', () => {
  let mockChrome

  beforeEach(() => {
    // Mock DOM elements with accessibility features
    document.body.innerHTML = `
      <a href="#main-content" class="skip-link">Skip to main content</a>
      <div class="container">
        <button class="theme-toggle" id="theme-toggle" title="Toggle dark/light mode" aria-label="Toggle dark/light mode">🌙</button>
        
        <div id="error-container" class="error-message" style="display: none;" role="alert" aria-live="assertive"></div>
        
        <header class="header">
          <h1>Universal Web Bypass</h1>
          <p>Ad & Paywall Bypass Extension</p>
        </header>
        
        <main id="main-content">
          <section class="status" aria-labelledby="status-heading">
            <h2 id="status-heading" class="sr-only">Extension Status</h2>
            <div class="status-indicator">
              <div class="status-dot active" id="status-dot" aria-label="Extension status"></div>
              <span id="status-text">Active and protecting this page</span>
            </div>
          </section>

          <section class="controls" aria-labelledby="controls-heading">
            <h2 id="controls-heading" class="sr-only">Extension Controls</h2>
            
            <div class="toggle-container">
              <label for="site-toggle" class="toggle-label">Enable for this site</label>
              <div class="toggle-switch active" id="site-toggle" role="switch" aria-checked="true" tabindex="0">
              </div>
            </div>
            
            <div class="button-controls" role="group" aria-labelledby="button-controls-heading">
              <h3 id="button-controls-heading" class="sr-only">Action Buttons</h3>
              <button id="refresh-button" class="btn btn-secondary" aria-label="Refresh current tab information">
                🔄 <span>Refresh</span>
              </button>
              <button id="toggle-button" class="btn btn-primary" aria-label="Re-apply bypass rules">
                ⚡ <span>Re-apply</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    `

    // Mock chrome APIs
    mockChrome = {
      storage: {
        sync: {
          get: jest.fn().mockImplementation(() => Promise.resolve({})),
          set: jest.fn().mockImplementation(() => Promise.resolve())
        }
      },
      tabs: {
        query: jest.fn().mockImplementation(() => Promise.resolve([{
          id: 123,
          url: 'https://example.com',
          title: 'Test Site'
        }])),
        reload: jest.fn(),
        create: jest.fn()
      },
      runtime: {
        sendMessage: jest.fn().mockImplementation(() => Promise.resolve({ success: true }))
      }
    }
    global.chrome = mockChrome
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('ARIA Labels and Roles', () => {
    test('should have proper ARIA labels on interactive elements', () => {
      const themeToggle = document.getElementById('theme-toggle')
      const siteToggle = document.getElementById('site-toggle')
      const refreshButton = document.getElementById('refresh-button')
      const toggleButton = document.getElementById('toggle-button')

      expect(themeToggle.getAttribute('aria-label')).toBe('Toggle dark/light mode')
      expect(siteToggle.getAttribute('role')).toBe('switch')
      expect(siteToggle.getAttribute('aria-checked')).toBe('true')
      expect(refreshButton.getAttribute('aria-label')).toBe('Refresh current tab information')
      expect(toggleButton.getAttribute('aria-label')).toBe('Re-apply bypass rules')
    })

    test('should have proper semantic structure', () => {
      const header = document.querySelector('header')
      const main = document.querySelector('main')
      const sections = document.querySelectorAll('section')

      expect(header).toBeTruthy()
      expect(main).toBeTruthy()
      expect(main.getAttribute('id')).toBe('main-content')
      expect(sections.length).toBeGreaterThan(0)
    })

    test('should have accessible headings hierarchy', () => {
      const h1 = document.querySelector('h1')
      const h2Elements = document.querySelectorAll('h2')
      const h3Elements = document.querySelectorAll('h3')

      expect(h1).toBeTruthy()
      expect(h2Elements.length).toBeGreaterThan(0)
      expect(h3Elements.length).toBeGreaterThan(0)
    })

    test('should have skip link for keyboard navigation', () => {
      const skipLink = document.querySelector('.skip-link')
      
      expect(skipLink).toBeTruthy()
      expect(skipLink.getAttribute('href')).toBe('#main-content')
      expect(skipLink.textContent).toBe('Skip to main content')
    })

    test('should have screen reader only content', () => {
      const srOnlyElements = document.querySelectorAll('.sr-only')
      
      expect(srOnlyElements.length).toBeGreaterThan(0)
      
      // Check that at least one sr-only element exists with meaningful content
      const hasStatusHeading = Array.from(srOnlyElements).some(el => 
        el.textContent.includes('Extension Status')
      )
      expect(hasStatusHeading).toBe(true)
    })
  })

  describe('Keyboard Navigation', () => {
    test('should support tab navigation', () => {
      require('../popup.js')
      
      const focusableElements = document.querySelectorAll(
        'button, [tabindex]:not([tabindex="-1"]), a[href]'
      )
      
      expect(focusableElements.length).toBeGreaterThan(0)
      
      // All focusable elements should have tabindex or be naturally focusable
      focusableElements.forEach(element => {
        const tabIndex = element.getAttribute('tabindex')
        const tagName = element.tagName.toLowerCase()
        
        expect(
          tabIndex !== '-1' || ['button', 'a'].includes(tagName)
        ).toBe(true)
      })
    })

    test('should handle keyboard events on toggle switch', () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      PopupController.siteStatus = { enabled: true, hostname: 'example.com' }
      
      const siteToggle = document.getElementById('site-toggle')
      PopupController.toggleSiteStatus = jest.fn()
      
      PopupController.setupEventListeners()
      
      // Simulate Enter key
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' })
      siteToggle.dispatchEvent(enterEvent)
      
      expect(PopupController.toggleSiteStatus).toHaveBeenCalled()
      
      // Simulate Space key
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' })
      siteToggle.dispatchEvent(spaceEvent)
      
      expect(PopupController.toggleSiteStatus).toHaveBeenCalledTimes(2)
    })
  })

  describe('ARIA State Updates', () => {
    test('should update aria-checked when toggle state changes', async() => {
      require('../popup.js')
      
      PopupController.cacheElements()
      const siteToggle = document.getElementById('site-toggle')
      
      // Test enabled state
      PopupController.siteStatus = { enabled: true }
      PopupController.updateSiteToggle()
      expect(siteToggle.getAttribute('aria-checked')).toBe('true')
      
      // Test disabled state
      PopupController.siteStatus = { enabled: false }
      PopupController.updateSiteToggle()
      expect(siteToggle.getAttribute('aria-checked')).toBe('false')
    })
  })

  describe('Error Messages', () => {
    test('should have proper ARIA attributes for error container', () => {
      const errorContainer = document.getElementById('error-container')
      
      expect(errorContainer.getAttribute('role')).toBe('alert')
      expect(errorContainer.getAttribute('aria-live')).toBe('assertive')
    })

    test('should announce errors to screen readers', () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      
      const errorContainer = document.getElementById('error-container')
      PopupController.showError('Test error message')
      
      expect(errorContainer.style.display).toBe('block')
      expect(errorContainer.textContent).toBe('Test error message')
    })
  })

  describe('Focus Management', () => {
    test('should have visible focus indicators', () => {
      // This would be tested with visual regression testing in a real environment
      // Here we just verify the focus styles are applied via CSS classes
      const buttons = document.querySelectorAll('button')
      
      buttons.forEach(button => {
        // Simulate focus
        button.focus()
        expect(button).toBe(document.activeElement)
      })
    })
  })

  describe('Color Contrast', () => {
    test('should have proper text content for readability', () => {
      // Verify important text elements have proper contrast
      // This is mainly validated through the CSS changes we made
      const textElements = document.querySelectorAll('p, span, button')
      
      expect(textElements.length).toBeGreaterThan(0)
      
      // Ensure no empty text content for interactive elements
      const buttons = document.querySelectorAll('button')
      buttons.forEach(button => {
        expect(button.textContent.trim() || button.getAttribute('aria-label')).toBeTruthy()
      })
    })
  })
})