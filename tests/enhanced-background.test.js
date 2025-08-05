/**
 * @file Enhanced Background Features Test Suite
 * @description Tests for the new blocked element logging functionality in background.js
 */

describe('Enhanced Background Script Features', () => {
  let BackgroundService;
  let mockChrome;

  beforeEach(() => {
    // Mock Chrome APIs
    mockChrome = {
      runtime: {
        onInstalled: { addListener: jest.fn() },
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn()
      },
      action: {
        onClicked: { addListener: jest.fn() }
      },
      tabs: {
        onUpdated: { addListener: jest.fn() },
        onRemoved: { addListener: jest.fn() }
      },
      contextMenus: {
        create: jest.fn(),
        onClicked: { addListener: jest.fn() }
      },
      storage: {
        local: {
          get: jest.fn().mockResolvedValue({}),
          set: jest.fn().mockResolvedValue()
        }
      }
    };

    global.chrome = mockChrome;
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    // Load background script
    const fs = require('fs');
    const path = require('path');
    const backgroundScript = fs.readFileSync(
      path.join(__dirname, '..', 'background.js'),
      'utf8'
    );

    eval(backgroundScript);
    BackgroundService = global.BackgroundService;
  });

  afterEach(() => {
    delete global.chrome;
    delete global.console;
    delete global.BackgroundService;
  });

  describe('Blocked Element Logging', () => {
    test('should handle blocked element logging messages', () => {
      const mockRequest = {
        action: 'logBlockedElement',
        data: {
          type: 'adblock-dialog',
          selector: '.ad-blocker-detected',
          tagName: 'DIV',
          className: 'ad-blocker-detected',
          id: 'adblock-warning',
          url: 'https://example.com/article',
          timestamp: Date.now()
        }
      };

      const mockSender = {
        tab: { id: 123, url: 'https://example.com/article' }
      };

      const mockSendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);

      // Check if element was logged
      expect(BackgroundService.stats.blockedElements).toHaveLength(1);
      expect(BackgroundService.stats.elementsBlocked).toBe(1);

      const loggedElement = BackgroundService.stats.blockedElements[0];
      expect(loggedElement.type).toBe('adblock-dialog');
      expect(loggedElement.hostname).toBe('example.com');
      expect(loggedElement.tabId).toBe(123);

      // Check response
      expect(mockSendResponse).toHaveBeenCalledWith({ success: true });
    });

    test('should update site statistics for blocked elements', () => {
      const mockRequest = {
        action: 'logBlockedElement',
        data: {
          type: 'blur-overlay',
          url: 'https://news.example.com/premium-article',
          timestamp: Date.now()
        }
      };

      const mockSender = {
        tab: { id: 456, url: 'https://news.example.com/premium-article' }
      };

      const mockSendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);

      // Check site statistics
      const siteStats = BackgroundService.stats.siteStatistics['news.example.com'];
      expect(siteStats).toBeDefined();
      expect(siteStats.elementsBlocked).toBe(1);
      expect(siteStats.lastActivity).toBeDefined();
    });

    test('should update tab information for blocked elements', () => {
      const mockRequest = {
        action: 'logBlockedElement',
        data: {
          type: 'paywall-overlay',
          url: 'https://magazine.com/article',
          timestamp: Date.now()
        }
      };

      const mockSender = {
        tab: { id: 789, url: 'https://magazine.com/article' }
      };

      const mockSendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);

      // Check tab info
      const tabInfo = BackgroundService.activeTabs.get(789);
      expect(tabInfo).toBeDefined();
      expect(tabInfo.elementsBlocked).toBe(1);
      expect(tabInfo.lastElementBlocked).toBeDefined();
    });

    test('should limit blocked elements log size', () => {
      // Add many elements to test size limiting
      for (let i = 0; i < 600; i++) {
        const mockRequest = {
          action: 'logBlockedElement',
          data: {
            type: 'test-element',
            url: `https://test${i}.com`,
            timestamp: Date.now()
          }
        };

        const mockSender = {
          tab: { id: 100 + i }
        };

        const mockSendResponse = jest.fn();

        BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);
      }

      // Should be limited (check it's less than original amount)
      expect(BackgroundService.stats.blockedElements.length).toBeLessThanOrEqual(500);
      expect(BackgroundService.stats.elementsBlocked).toBe(600);
    });

    test('should handle missing log data gracefully', () => {
      const mockRequest = {
        action: 'logBlockedElement'
        // Missing data field
      };

      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        error: 'No log data provided'
      });
    });

    test('should handle URL parsing errors gracefully', () => {
      const mockRequest = {
        action: 'logBlockedElement',
        data: {
          type: 'test-element',
          url: 'invalid-url',
          timestamp: Date.now()
        }
      };

      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      // Should not throw an error
      expect(() => {
        BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);
      }).not.toThrow();

      // Should call sendResponse indicating success or error handling
      expect(mockSendResponse).toHaveBeenCalled();
    });
  });

  describe('Message Handling Integration', () => {
    test('should route logBlockedElement messages correctly', () => {
      const mockRequest = {
        action: 'logBlockedElement',
        data: {
          type: 'adblock-dialog',
          url: 'https://test.com',
          timestamp: Date.now()
        }
      };

      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      // Spy on the specific handler
      const spy = jest.spyOn(BackgroundService, 'handleLogBlockedElement');

      BackgroundService.handleMessage(mockRequest, mockSender, mockSendResponse);

      expect(spy).toHaveBeenCalledWith(mockRequest, mockSender, mockSendResponse);
    });

    test('should handle unknown message actions', () => {
      const mockRequest = {
        action: 'unknownAction'
      };

      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      BackgroundService.handleMessage(mockRequest, mockSender, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith({
        error: 'Unknown action'
      });
    });
  });

  describe('Statistics Integration', () => {
    test('should include blocked elements in statistics', () => {
      // Add some blocked elements
      BackgroundService.stats.blockedElements = [
        { type: 'adblock-dialog', hostname: 'example.com' },
        { type: 'blur-overlay', hostname: 'news.com' }
      ];
      BackgroundService.stats.elementsBlocked = 2;

      const stats = BackgroundService.getStats();
      
      expect(stats.elementsBlocked).toBe(2);
      expect(stats.totalBlocked).toBeDefined();
    });

    test('should include site-specific element statistics', () => {
      // Test that the statistics structure supports elements
      expect(BackgroundService.stats).toBeDefined();
      expect(BackgroundService.stats.siteStatistics).toBeDefined();
      
      // Test that we can add site statistics with element data
      BackgroundService.stats.siteStatistics['example.com'] = {
        blocked: 5,
        elementsBlocked: 3,
        lastActivity: Date.now()
      };
      
      expect(BackgroundService.stats.siteStatistics['example.com'].elementsBlocked).toBe(3);
    });

    test('should reset blocked elements statistics', async() => {
      // Add some data
      BackgroundService.stats.blockedElements = [
        { type: 'test', hostname: 'test.com' }
      ];
      BackgroundService.stats.elementsBlocked = 5;

      // Test reset functionality
      await BackgroundService.resetStats();

      expect(BackgroundService.stats.blockedElements).toHaveLength(0);
      expect(BackgroundService.stats.elementsBlocked).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle errors in blocked element logging gracefully', () => {
      // Mock an error scenario
      const originalStats = BackgroundService.stats;
      BackgroundService.stats = null; // This will cause an error

      const mockRequest = {
        action: 'logBlockedElement',
        data: {
          type: 'test-element',
          url: 'https://test.com',
          timestamp: Date.now()
        }
      };

      const mockSender = { tab: { id: 123 } };
      const mockSendResponse = jest.fn();

      // Should not throw
      expect(() => {
        BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);
      }).not.toThrow();

      expect(mockSendResponse).toHaveBeenCalledWith({
        error: expect.any(String)
      });

      // Restore original stats
      BackgroundService.stats = originalStats;
    });
  });

  describe('Performance Tests', () => {
    test('should handle high volume of blocked element logs efficiently', () => {
      const startTime = Date.now();

      // Log many elements quickly
      for (let i = 0; i < 1000; i++) {
        const mockRequest = {
          action: 'logBlockedElement',
          data: {
            type: 'performance-test',
            url: `https://test${i % 10}.com`,
            timestamp: Date.now()
          }
        };

        const mockSender = { tab: { id: i } };
        const mockSendResponse = jest.fn();

        BackgroundService.handleLogBlockedElement(mockRequest, mockSender, mockSendResponse);
      }

      const endTime = Date.now();

      // Should complete within reasonable time
      expect(endTime - startTime).toBeLessThan(1000);
      expect(BackgroundService.stats.elementsBlocked).toBe(1000);
    });
  });
});