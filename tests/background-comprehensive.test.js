/**
 * @file Comprehensive Background Service Tests
 * @description Comprehensive test suite to achieve ≥90% coverage for background.js
 */

describe('BackgroundService Comprehensive Coverage', () => {
  let BackgroundService;
  let mockChrome;
  let originalConsole;

  beforeEach(() => {
    // Save original console
    originalConsole = global.console;
    
    // Setup comprehensive chrome mock
    mockChrome = {
      storage: {
        sync: {
          get: jest.fn((keys, callback) => {
            const result = {};
            if (callback) callback(result);
            return Promise.resolve(result);
          }),
          set: jest.fn((data, callback) => {
            if (callback) callback();
            return Promise.resolve();
          })
        }
      },
      runtime: {
        onInstalled: { addListener: jest.fn() },
        onMessage: { addListener: jest.fn() },
        sendMessage: jest.fn(),
        getManifest: jest.fn(() => ({ version: '2.0.0' })),
        getURL: jest.fn((path) => `chrome-extension://test-id/${path}`),
        lastError: null
      },
      action: {
        onClicked: { addListener: jest.fn() },
        openPopup: jest.fn()
      },
      contextMenus: {
        create: jest.fn(),
        onClicked: { addListener: jest.fn() }
      },
      tabs: {
        onUpdated: { addListener: jest.fn() },
        onRemoved: { addListener: jest.fn() },
        query: jest.fn(),
        reload: jest.fn()
      },
      scripting: {
        executeScript: jest.fn(() => Promise.resolve([{ result: 'success' }]))
      },
      notifications: {
        create: jest.fn((options, callback) => {
          if (callback) callback('notification-id');
          return 'notification-id';
        })
      }
    };

    global.chrome = mockChrome;
    global.console = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    // Clear require cache and reload
    delete require.cache[require.resolve('../background.js')];
    require('../background.js');
    BackgroundService = global.BackgroundService;
  });

  afterEach(() => {
    global.console = originalConsole;
    jest.clearAllMocks();
  });

  describe('Initialization Error Handling', () => {
    test('should handle initialization errors gracefully', async() => {
      // Mock method to throw error
      const originalSetupEventListeners = BackgroundService.setupEventListeners;
      BackgroundService.setupEventListeners = jest.fn(() => {
        throw new Error('Setup failed');
      });

      await BackgroundService.init();
      
      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error during initialization:', expect.any(Error));
      
      // Restore original method
      BackgroundService.setupEventListeners = originalSetupEventListeners;
    });

    test('should handle storage loading errors', async() => {
      chrome.storage.sync.get.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      await BackgroundService.loadStorageData();
      
      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error loading storage data:', expect.any(Error));
    });

    test('should handle storage saving errors', async() => {
      chrome.storage.sync.set.mockImplementationOnce(() => {
        throw new Error('Storage save error');
      });

      await BackgroundService.saveStorageData();
      
      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error saving storage data:', expect.any(Error));
    });
  });

  describe('Installation Handling', () => {
    test('should handle chrome_update installation reason', () => {
      const details = { reason: 'chrome_update' };
      
      BackgroundService.handleInstallation(details);
      
      expect(console.log).toHaveBeenCalledWith('[UWB Background] Chrome browser updated');
    });

    test('should handle shared_module_update installation reason', () => {
      const details = { reason: 'shared_module_update' };
      
      BackgroundService.handleInstallation(details);
      
      expect(console.log).toHaveBeenCalledWith('[UWB Background] Shared module updated');
    });

    test('should handle installation errors', () => {
      // Mock getManifest to throw error
      chrome.runtime.getManifest.mockImplementationOnce(() => {
        throw new Error('Manifest error');
      });

      const details = { reason: 'install' };
      BackgroundService.handleInstallation(details);
      
      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error handling installation:', expect.any(Error));
    });

    test('should handle update with version comparison error', () => {
      BackgroundService.handleUpdate('invalid.version', '2.0.0');
      
      // Should not crash, isMajorUpdate should return false for invalid versions
      expect(console.log).toHaveBeenCalledWith('[UWB Background] Updated from vinvalid.version to v2.0.0');
    });
  });

  describe('Welcome Notification Handling', () => {
    test('should handle notification creation with runtime error', () => {
      chrome.runtime.lastError = { message: 'Notification permission denied' };
      
      BackgroundService.showWelcomeNotification();
      
      expect(chrome.notifications.create).toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith('[UWB Background] Notification creation failed:', 'Notification permission denied');
      
      // Clean up
      chrome.runtime.lastError = null;
    });

    test('should handle notification creation when API is unavailable', () => {
      // Mock chrome.notifications.create to throw error
      const originalCreate = chrome.notifications.create;
      chrome.notifications.create = jest.fn(() => {
        throw new Error('Notifications API unavailable');
      });
      
      BackgroundService.showWelcomeNotification();
      
      expect(console.warn).toHaveBeenCalledWith('[UWB Background] Notifications not available:', 'Notifications API unavailable');
      
      // Restore API
      chrome.notifications.create = originalCreate;
    });

    test('should handle notification creation error', () => {
      chrome.notifications.create.mockImplementationOnce(() => {
        throw new Error('Notification error');
      });
      
      BackgroundService.showWelcomeNotification();
      
      expect(console.warn).toHaveBeenCalledWith('[UWB Background] Notifications not available:', 'Notification error');
    });
  });

  describe('Message Handling Edge Cases', () => {
    test('should handle unknown message actions', () => {
      const request = { action: 'unknownAction' };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleMessage(request, sender, sendResponse);

      expect(console.log).toHaveBeenCalledWith('[UWB Background] Unknown message action: unknownAction');
      expect(sendResponse).toHaveBeenCalledWith({ error: 'Unknown action' });
    });

    test('should handle message processing errors', () => {
      const request = { action: 'getTabInfo' };
      const sender = { tab: { id: 'invalid-id' } }; // Invalid tab ID
      const sendResponse = jest.fn();

      // Mock activeTabs.get to throw error
      const originalGet = BackgroundService.activeTabs.get;
      BackgroundService.activeTabs.get = jest.fn(() => {
        throw new Error('Tab processing error');
      });

      BackgroundService.handleMessage(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({
        error: expect.any(String)
      }));
      
      // Restore original
      BackgroundService.activeTabs.get = originalGet;
    });

    test('should handle setSiteStatus errors', async() => {
      // Mock saveStorageData to throw error
      const originalSaveStorageData = BackgroundService.saveStorageData;
      BackgroundService.saveStorageData = jest.fn().mockRejectedValue(new Error('Save failed'));

      const request = { action: 'setSiteStatus', hostname: 'example.com', enabled: true };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleMessage(request, sender, sendResponse);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Save failed' });

      // Restore original method
      BackgroundService.saveStorageData = originalSaveStorageData;
    });
  });

  describe('Tab Management Edge Cases', () => {
    test('should handle tab update errors', () => {
      // Mock updateTabInfo to throw error
      const originalUpdateTabInfo = BackgroundService.updateTabInfo;
      BackgroundService.updateTabInfo = jest.fn(() => {
        throw new Error('Update tab info error');
      });

      const tabId = 123;
      const changeInfo = { status: 'complete' };
      const tab = { url: 'https://example.com', title: 'Test' };

      BackgroundService.handleTabUpdate(tabId, changeInfo, tab);

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error handling tab update:', expect.any(Error));
      
      // Restore original
      BackgroundService.updateTabInfo = originalUpdateTabInfo;
    });

    test('should handle tab removal errors', () => {
      // Mock activeTabs.has to throw error
      const originalActiveTabs = BackgroundService.activeTabs;
      BackgroundService.activeTabs = {
        has: jest.fn(() => { throw new Error('Map error'); }),
        delete: jest.fn(),
        get: jest.fn(),
        set: jest.fn()
      };

      BackgroundService.handleTabRemoval(123);

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error handling tab removal:', expect.any(Error));

      // Restore original
      BackgroundService.activeTabs = originalActiveTabs;
    });

    test('should handle updateTabInfo errors', () => {
      // Mock activeTabs.get to throw error
      const originalActiveTabs = BackgroundService.activeTabs;
      BackgroundService.activeTabs = {
        get: jest.fn(() => { throw new Error('Get error'); }),
        set: jest.fn(),
        has: jest.fn(),
        delete: jest.fn()
      };

      BackgroundService.updateTabInfo(123, { url: 'test' });

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error updating tab info:', expect.any(Error));

      // Restore original
      BackgroundService.activeTabs = originalActiveTabs;
    });
  });

  describe('Context Menu Handling', () => {
    test('should handle context menu setup errors', () => {
      chrome.contextMenus.create.mockImplementationOnce(() => {
        throw new Error('Context menu error');
      });

      BackgroundService.setupContextMenu();

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error setting up context menu:', expect.any(Error));
    });

    test('should handle unknown context menu item clicks', () => {
      const info = { menuItemId: 'unknown-item' };
      const tab = { id: 123 };

      BackgroundService.handleContextMenuClick(info, tab);

      expect(console.log).toHaveBeenCalledWith('[UWB Background] Unknown context menu item: unknown-item');
    });

    test('should handle context menu click for openPopup', () => {
      const info = { menuItemId: 'openPopup' };
      const tab = { id: 123 };

      BackgroundService.handleContextMenuClick(info, tab);

      expect(chrome.action.openPopup).toHaveBeenCalled();
    });

    test('should handle context menu click errors', () => {
      chrome.action.openPopup.mockImplementationOnce(() => {
        throw new Error('Popup error');
      });

      const info = { menuItemId: 'openPopup' };
      const tab = { id: 123 };

      BackgroundService.handleContextMenuClick(info, tab);

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error handling context menu click:', expect.any(Error));
    });
  });

  describe('Script Execution Edge Cases', () => {
    test('should handle invalid tab ID for script execution', () => {
      BackgroundService.executeBypassOnTab(-1);

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Invalid tab ID for script execution');
      expect(chrome.scripting.executeScript).not.toHaveBeenCalled();
    });

    test('should handle script execution failure', async() => {
      chrome.scripting.executeScript.mockRejectedValueOnce(new Error('Script error'));

      const tabId = 123;
      BackgroundService.executeBypassOnTab(tabId);

      // Wait for promise to resolve
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(console.error).toHaveBeenCalledWith(`[UWB Background] Failed to execute script on tab ${tabId}:`, expect.any(Error));
    });

    test('should handle executeBypassOnTab errors', () => {
      // Mock executeScript to throw synchronously
      chrome.scripting.executeScript.mockImplementationOnce(() => {
        throw new Error('Sync script error');
      });

      BackgroundService.executeBypassOnTab(123);

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error executing bypass on tab:', expect.any(Error));
    });
  });

  describe('Action Click Handling', () => {
    test('should handle action click errors', () => {
      // Mock updateTabInfo to throw error
      const originalUpdateTabInfo = BackgroundService.updateTabInfo;
      BackgroundService.updateTabInfo = jest.fn(() => {
        throw new Error('Update error');
      });

      const tab = { id: 123, url: 'https://example.com' };
      BackgroundService.handleActionClick(tab);

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error handling action click:', expect.any(Error));

      // Restore original method
      BackgroundService.updateTabInfo = originalUpdateTabInfo;
    });
  });

  describe('Bypass Status Handling', () => {
    test('should handle bypass status for disabled site', () => {
      // Add site to disabled list
      BackgroundService.disabledSites.add('example.com');

      const request = { action: 'bypassStatus', url: 'https://example.com' };
      const sender = { tab: { id: 123, url: 'https://example.com' } };
      const sendResponse = jest.fn();

      BackgroundService.handleBypassStatus(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ success: false, disabled: true });

      // Clean up
      BackgroundService.disabledSites.delete('example.com');
    });

    test('should handle bypass status errors', () => {
      // Mock URL constructor to throw
      const originalURL = global.URL;
      global.URL = jest.fn(() => {
        throw new Error('URL error');
      });

      const request = { action: 'bypassStatus', url: 'invalid-url' };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleBypassStatus(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ error: 'URL error' });

      // Restore original URL
      global.URL = originalURL;
    });
  });

  describe('Blocked Element Logging', () => {
    test('should handle logBlockedElement with missing data', () => {
      const request = { action: 'logBlockedElement' };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ error: 'No log data provided' });
    });

    test('should handle logBlockedElement errors', () => {
      // Mock stats to throw error when accessing blockedElements
      const originalStats = BackgroundService.stats;
      BackgroundService.stats = {
        ...originalStats,
        get blockedElements() {
          throw new Error('Stats error');
        }
      };

      const request = { 
        action: 'logBlockedElement', 
        data: { type: 'ad', url: 'https://example.com' } 
      };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Stats error' });

      // Restore original stats
      BackgroundService.stats = originalStats;
    });
  });

  describe('Version Management', () => {
    test('should handle major update detection with invalid versions', () => {
      const result = BackgroundService.isMajorUpdate('invalid', '2.0.0');
      expect(result).toBe(false);
    });

    test('should handle major update detection correctly', () => {
      const result1 = BackgroundService.isMajorUpdate('1.9.9', '2.0.0');
      expect(result1).toBe(true);

      const result2 = BackgroundService.isMajorUpdate('2.0.0', '2.1.0');
      expect(result2).toBe(false);
    });
  });

  describe('URL Support Detection', () => {
    test('should handle invalid URLs in isSupportedUrl', () => {
      const result1 = BackgroundService.isSupportedUrl(null);
      expect(result1).toBe(false);

      const result2 = BackgroundService.isSupportedUrl('invalid-url');
      expect(result2).toBe(false);

      const result3 = BackgroundService.isSupportedUrl('');
      expect(result3).toBe(false);
    });
  });

  describe('Event Listener Setup', () => {
    test('should handle event listener setup errors', () => {
      // Mock addEventListener to throw error
      const originalAddListener = chrome.runtime.onInstalled.addListener;
      chrome.runtime.onInstalled.addListener = jest.fn(() => {
        throw new Error('Listener error');
      });

      BackgroundService.setupEventListeners();

      expect(console.error).toHaveBeenCalledWith('[UWB Background] Error setting up event listeners:', expect.any(Error));

      // Restore original
      chrome.runtime.onInstalled.addListener = originalAddListener;
    });
  });

  describe('Statistics Operations', () => {
    test('should handle detailed stats calculation edge cases', () => {
      // Test with empty blocked requests
      BackgroundService.stats.blockedRequests = [];
      const stats = BackgroundService.getDetailedStats();
      
      expect(stats.today).toBe(0);
      expect(stats.week).toBe(0);
      expect(stats.topSites).toEqual([]);
    });

    test('should handle stats with blocked requests', () => {
      const now = Date.now();
      BackgroundService.stats.blockedRequests = [
        { type: 'ad', timestamp: now - 1000 },
        { type: 'tracker', timestamp: now - 25 * 60 * 60 * 1000 }, // 25 hours ago
        { type: 'ad', timestamp: now - 8 * 24 * 60 * 60 * 1000 } // 8 days ago
      ];

      const stats = BackgroundService.getDetailedStats();
      
      expect(stats.today).toBe(1);
      expect(stats.week).toBe(2);
      expect(stats.byType.ad).toBe(2);
      expect(stats.byType.tracker).toBe(1);
    });
  });

  describe('Tab Info Handling', () => {
    test('should handle getTabInfo with no tab', () => {
      const request = { action: 'getTabInfo' };
      const sender = {}; // No tab
      const sendResponse = jest.fn();

      BackgroundService.handleGetTabInfo(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({
        url: 'unknown',
        title: 'unknown',
        id: -1
      }));
    });

    test('should handle getTabInfo errors', () => {
      // Mock activeTabs.get to throw
      const originalActiveTabs = BackgroundService.activeTabs;
      BackgroundService.activeTabs = {
        get: jest.fn(() => { throw new Error('Tab error'); }),
        set: jest.fn(),
        has: jest.fn(),
        delete: jest.fn()
      };

      const request = { action: 'getTabInfo', tabId: 123 };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleGetTabInfo(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Tab error' });

      // Restore original
      BackgroundService.activeTabs = originalActiveTabs;
    });
  });

  describe('Site Status Handling', () => {
    test('should handle getSiteStatus errors', () => {
      // Mock disabledSites.has to throw
      const originalDisabledSites = BackgroundService.disabledSites;
      BackgroundService.disabledSites = {
        has: jest.fn(() => { throw new Error('Set error'); }),
        add: jest.fn(),
        delete: jest.fn()
      };

      const request = { action: 'getSiteStatus', hostname: 'example.com' };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleGetSiteStatus(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ error: 'Set error' });

      // Restore original
      BackgroundService.disabledSites = originalDisabledSites;
    });
  });

  describe('Additional Coverage Tests', () => {
    test('should handle storage data loading with existing data', async() => {
      const testData = {
        disabledSites: ['example.com', 'test.com'],
        statistics: { totalBlocked: 50 }
      };

      chrome.storage.sync.get.mockImplementationOnce((keys, callback) => {
        if (callback) callback(testData);
        return Promise.resolve(testData);
      });

      await BackgroundService.loadStorageData();

      expect(BackgroundService.disabledSites.has('example.com')).toBe(true);
      expect(BackgroundService.disabledSites.has('test.com')).toBe(true);
      expect(BackgroundService.stats.totalBlocked).toBe(50);
    });

    test('should handle bypass context menu click', () => {
      const info = { menuItemId: 'bypassPage' };
      const tab = { id: 123 };

      BackgroundService.handleContextMenuClick(info, tab);

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        files: ['content.js']
      });
    });

    test('should handle tab updates for non-complete status', () => {
      const tabId = 123;
      const changeInfo = { status: 'loading' };
      const tab = { url: 'https://example.com', title: 'Test' };

      // Should not trigger updateTabInfo for non-complete status
      const spy = jest.spyOn(BackgroundService, 'updateTabInfo');
      
      BackgroundService.handleTabUpdate(tabId, changeInfo, tab);

      expect(spy).not.toHaveBeenCalled();
      
      spy.mockRestore();
    });

    test('should handle supported URLs correctly', () => {
      expect(BackgroundService.isSupportedUrl('https://example.com')).toBe(true);
      expect(BackgroundService.isSupportedUrl('http://example.com')).toBe(true);
      expect(BackgroundService.isSupportedUrl('ftp://example.com')).toBe(false);
      expect(BackgroundService.isSupportedUrl('chrome://extensions')).toBe(false);
    });

    test('should handle blocked element logging with URL parsing', () => {
      const request = { 
        action: 'logBlockedElement', 
        data: { 
          type: 'ad', 
          url: 'https://example.com/path'
        } 
      };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith({ success: true });
      expect(BackgroundService.stats.blockedElements.length).toBeGreaterThan(0);
      expect(BackgroundService.stats.elementsBlocked).toBeGreaterThan(0);
    });

    test('should handle bypass status with complete URL processing', () => {
      // Ensure example.com is NOT in disabled sites
      BackgroundService.disabledSites.delete('example.com');
      
      const request = { 
        action: 'bypassStatus', 
        url: 'https://different-example.com/path',
        blockedCount: 5
      };
      const sender = { tab: { id: 123, url: 'https://different-example.com/path' } };
      const sendResponse = jest.fn();

      BackgroundService.handleBypassStatus(request, sender, sendResponse);

      expect(sendResponse).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        stats: expect.any(Object)
      }));
      
      expect(BackgroundService.stats.totalBlocked).toBeGreaterThanOrEqual(5);
      expect(BackgroundService.stats.siteStatistics['different-example.com']).toBeDefined();
    });

    test('should handle major version update correctly', () => {
      BackgroundService.stats.totalBlocked = 100;
      
      BackgroundService.handleUpdate('1.9.9', '2.0.0');
      
      // Should reset stats for major update
      expect(BackgroundService.stats.totalBlocked).toBe(0);
    });

    test('should limit blocked requests array size', () => {
      // Fill with many blocked requests
      for (let i = 0; i < 1500; i++) {
        BackgroundService.stats.blockedRequests.push({
          url: `https://example${i}.com`,
          hostname: `example${i}.com`,
          type: 'ad',
          timestamp: Date.now(),
          tabId: 123
        });
      }

      const request = { 
        action: 'bypassStatus', 
        url: 'https://newsite.com',
        blockedCount: 1
      };
      const sender = { tab: { id: 123, url: 'https://newsite.com' } };
      const sendResponse = jest.fn();

      BackgroundService.handleBypassStatus(request, sender, sendResponse);

      // Should be limited to 1000
      expect(BackgroundService.stats.blockedRequests.length).toBeLessThanOrEqual(1000);
    });

    test('should limit blocked elements array size', () => {
      // Fill with many blocked elements
      for (let i = 0; i < 600; i++) {
        BackgroundService.stats.blockedElements.push({
          type: 'ad',
          url: `https://example${i}.com`,
          timestamp: Date.now()
        });
      }

      const request = { 
        action: 'logBlockedElement', 
        data: { 
          type: 'tracker', 
          url: 'https://newsite.com'
        } 
      };
      const sender = { tab: { id: 123 } };
      const sendResponse = jest.fn();

      BackgroundService.handleLogBlockedElement(request, sender, sendResponse);

      // Should be limited to 250 after cleanup
      expect(BackgroundService.stats.blockedElements.length).toBeLessThanOrEqual(250);
    });

    test('should handle tab removal for non-existent tab', () => {
      const originalSize = BackgroundService.activeTabs.size;
      
      BackgroundService.handleTabRemoval(999); // Non-existent tab
      
      expect(BackgroundService.activeTabs.size).toBe(originalSize);
    });
  });
});