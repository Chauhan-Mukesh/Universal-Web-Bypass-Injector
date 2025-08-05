/**
 * @file Simple Background Tests
 * @description Basic functional tests for background script
 */

describe('BackgroundService Basic Tests', () => {
  let BackgroundService

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock basic chrome APIs
    global.chrome = {
      storage: {
        sync: {
          get: jest.fn((keys, callback) => {
            if (callback) callback({})
            return Promise.resolve({})
          }),
          set: jest.fn((data, callback) => {
            if (callback) callback()
            return Promise.resolve()
          })
        }
      },
      runtime: {
        onInstalled: { addListener: jest.fn() },
        onMessage: { addListener: jest.fn() },
        getManifest: jest.fn(() => ({ version: '2.0.0' }))
      },
      action: {
        onClicked: { addListener: jest.fn() }
      },
      contextMenus: {
        create: jest.fn(),
        onClicked: { addListener: jest.fn() }
      },
      tabs: {
        onUpdated: { addListener: jest.fn() },
        onRemoved: { addListener: jest.fn() }
      },
      scripting: {
        executeScript: jest.fn(() => Promise.resolve())
      }
    }

    delete require.cache[require.resolve('../background.js')]
    require('../background.js')
    BackgroundService = global.BackgroundService
  })

  test('should be defined', () => {
    expect(BackgroundService).toBeDefined()
  })

  test('should have required properties', () => {
    expect(BackgroundService.stats).toBeDefined()
    expect(BackgroundService.disabledSites).toBeDefined()
    expect(BackgroundService.activeTabs).toBeDefined()
  })

  test('should initialize without errors', async() => {
    await expect(BackgroundService.init()).resolves.not.toThrow()
  })

  test('should setup event listeners', async() => {
    await BackgroundService.init()
    expect(chrome.runtime.onInstalled.addListener).toHaveBeenCalled()
    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled()
  })

  test('should handle basic stats operations', () => {
    const initialTotal = BackgroundService.stats.totalBlocked
    expect(typeof initialTotal).toBe('number')
  })

  test('should handle tab tracking', () => {
    BackgroundService.updateTabInfo(123, { url: 'https://example.com' })
    expect(BackgroundService.activeTabs.has(123)).toBe(true)
  })

  test('should support URL validation', () => {
    expect(BackgroundService.isSupportedUrl('https://example.com')).toBe(true)
    expect(BackgroundService.isSupportedUrl('chrome://extensions')).toBe(false)
  })

  test('should provide stats', () => {
    const stats = BackgroundService.getStats()
    expect(stats).toHaveProperty('totalBlocked')
    expect(stats).toHaveProperty('activeTabsCount')
  })

  test('should provide detailed stats', () => {
    const detailedStats = BackgroundService.getDetailedStats()
    expect(detailedStats).toHaveProperty('total')
    expect(detailedStats).toHaveProperty('today')
    expect(detailedStats).toHaveProperty('week')
  })

  test('should handle stats reset', async() => {
    BackgroundService.stats.totalBlocked = 100
    await BackgroundService.resetStats()
    expect(BackgroundService.stats.totalBlocked).toBe(0)
  })
})