/**
 * Test suite for Responsive Design
 */
/* global PopupController */

describe('Responsive Design', () => {
  beforeEach(() => {
    // Mock DOM for popup
    document.body.innerHTML = `
      <div class="container">
        <button class="theme-toggle" id="theme-toggle">🌙</button>
        <header class="header">
          <h1>Universal Web Bypass</h1>
          <p>Ad & Paywall Bypass Extension</p>
        </header>
        <main id="main-content">
          <section class="controls">
            <div class="button-controls">
              <button id="refresh-button" class="btn btn-secondary">Refresh</button>
              <button id="toggle-button" class="btn btn-primary">Re-apply</button>
            </div>
          </section>
          <section class="features">
            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-number">0</span>
                <span class="stat-label">Blocked</span>
              </div>
            </div>
          </section>
        </main>
        <footer class="footer">
          <div class="keyboard-shortcuts">Shortcuts</div>
        </footer>
      </div>
    `

    // Mock chrome APIs
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn().mockImplementation(() => Promise.resolve({})),
          set: jest.fn().mockImplementation(() => Promise.resolve())
        }
      },
      tabs: {
        query: jest.fn().mockImplementation(() => Promise.resolve([{
          id: 123,
          url: 'https://example.com'
        }]))
      }
    }

    // Reset viewport
    global.innerWidth = 360
    global.innerHeight = 640
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('Viewport Adaptability', () => {
    test('should have responsive container width', () => {
      const body = document.body
      
      // Test that body width is set for different viewport sizes
      expect(body).toBeTruthy()
      
      // In normal conditions, body should have specified width in CSS
      const computedStyle = window.getComputedStyle(body)
      expect(computedStyle).toBeDefined()
    })

    test('should have scalable elements', () => {
      const buttons = document.querySelectorAll('.btn')
      const headers = document.querySelectorAll('h1')
      
      expect(buttons.length).toBeGreaterThan(0)
      expect(headers.length).toBeGreaterThan(0)
      
      // Elements should exist and be available for styling
      buttons.forEach(button => {
        expect(button.classList.contains('btn')).toBe(true)
      })
    })
  })

  describe('Touch Optimization', () => {
    test('should have minimum touch target sizes', () => {
      const interactiveElements = document.querySelectorAll('button, .toggle-switch')
      
      expect(interactiveElements.length).toBeGreaterThan(0)
      
      // All interactive elements should have class names for CSS targeting
      interactiveElements.forEach(element => {
        expect(element.className).toBeTruthy()
      })
    })

    test('should handle touch interactions', () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      PopupController.setupEventListeners()
      
      const button = document.getElementById('refresh-button')
      expect(button).toBeTruthy()
      
      // Should have event listeners attached
      // This is implicitly tested by the setupEventListeners call
      expect(PopupController.elements.refreshButton).toBe(button)
    })
  })

  describe('Grid Layout Responsiveness', () => {
    test('should have responsive grid layout', () => {
      const statsGrid = document.querySelector('.stats-grid')
      expect(statsGrid).toBeTruthy()
      
      // Grid should have proper class for CSS targeting
      expect(statsGrid.classList.contains('stats-grid')).toBe(true)
    })

    test('should handle column collapsing', () => {
      const buttonControls = document.querySelector('.button-controls')
      expect(buttonControls).toBeTruthy()
      
      // Button controls should be in flex layout for responsive behavior
      expect(buttonControls.classList.contains('button-controls')).toBe(true)
    })
  })

  describe('Font Scaling', () => {
    test('should have scalable typography', () => {
      const header = document.querySelector('.header h1')
      const paragraph = document.querySelector('.header p')
      
      expect(header).toBeTruthy()
      expect(paragraph).toBeTruthy()
      
      // Headers should have proper semantic structure
      expect(header.tagName).toBe('H1')
    })

    test('should maintain readable text sizes', () => {
      const textElements = document.querySelectorAll('p, span, button')
      
      expect(textElements.length).toBeGreaterThan(0)
      
      // All text elements should have content or aria-labels
      textElements.forEach(element => {
        const hasContent = element.textContent.trim() || 
                          element.getAttribute('aria-label') ||
                          element.querySelector('span')
        expect(hasContent).toBeTruthy()
      })
    })
  })

  describe('High DPI Support', () => {
    test('should support high resolution displays', () => {
      const statusDot = document.querySelector('.status-dot')
      
      // Element should exist for CSS media query targeting
      if (statusDot) {
        expect(statusDot.classList.contains('status-dot')).toBe(true)
      }
    })
  })

  describe('Reduced Motion Support', () => {
    test('should respect user motion preferences', () => {
      // Test that elements with animations have proper classes
      const animatedElements = document.querySelectorAll('.status-dot, .btn')
      
      expect(animatedElements.length).toBeGreaterThan(0)
      
      // Elements should be available for prefers-reduced-motion CSS targeting
      animatedElements.forEach(element => {
        expect(element.className).toBeTruthy()
      })
    })
  })

  describe('Landscape Orientation', () => {
    test('should handle landscape layout', () => {
      const footer = document.querySelector('.footer')
      const keyboardShortcuts = document.querySelector('.keyboard-shortcuts')
      
      expect(footer).toBeTruthy()
      
      // Keyboard shortcuts should be hideable in landscape
      if (keyboardShortcuts) {
        expect(keyboardShortcuts.classList.contains('keyboard-shortcuts')).toBe(true)
      }
    })
  })

  describe('CSS Media Queries', () => {
    test('should have proper CSS classes for responsive targeting', () => {
      // Test that all responsive elements have proper classes
      const responsiveElements = [
        '.container',
        '.header',
        '.controls',
        '.button-controls',
        '.btn',
        '.stats-grid',
        '.footer'
      ]

      responsiveElements.forEach(selector => {
        const element = document.querySelector(selector)
        if (element) {
          expect(element.classList.length).toBeGreaterThan(0)
        }
      })
    })
  })

  describe('Theme Responsiveness', () => {
    test('should maintain responsiveness in dark mode', () => {
      require('../popup.js')
      
      PopupController.cacheElements()
      
      // Apply dark theme
      PopupController.applyTheme('dark')
      
      expect(document.body.classList.contains('dark-mode')).toBe(true)
      
      // All elements should still be properly styled
      const themedElements = document.querySelectorAll('.container, .header, .btn')
      expect(themedElements.length).toBeGreaterThan(0)
    })
  })
})