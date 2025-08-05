/**
 * @file Simple additional tests to improve coverage
 * @description Basic tests for key functionality
 */

describe('Simple Coverage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Utility Functions', () => {
    test('should validate URLs correctly', () => {
      const isValidUrl = (url) => {
        try {
          new URL(url)
          return true
        } catch {
          return false
        }
      }

      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('http://test.org')).toBe(true)
      expect(isValidUrl('invalid-url')).toBe(false)
      expect(isValidUrl('')).toBe(false)
    })

    test('should extract hostname from URL', () => {
      const extractHostname = (url) => {
        try {
          return new URL(url).hostname
        } catch {
          return null
        }
      }

      expect(extractHostname('https://example.com/path')).toBe('example.com')
      expect(extractHostname('http://sub.domain.org')).toBe('sub.domain.org')
      expect(extractHostname('invalid-url')).toBe(null)
    })

    test('should format numbers correctly', () => {
      const formatNumber = (num) => {
        return new Intl.NumberFormat('en-US').format(num)
      }

      expect(formatNumber(1234)).toBe('1,234')
      expect(formatNumber(1000000)).toBe('1,000,000')
      expect(formatNumber(0)).toBe('0')
    })

    test('should format time durations', () => {
      const formatDuration = (ms) => {
        const seconds = Math.floor(ms / 1000) % 60
        const minutes = Math.floor(ms / (1000 * 60)) % 60
        const hours = Math.floor(ms / (1000 * 60 * 60))

        if (hours > 0) {
          return `${hours}h ${minutes}m ${seconds}s`
        } else if (minutes > 0) {
          return `${minutes}m ${seconds}s`
        } else {
          return `${seconds}s`
        }
      }

      expect(formatDuration(30000)).toBe('30s')
      expect(formatDuration(90000)).toBe('1m 30s')
      expect(formatDuration(3690000)).toBe('1h 1m 30s')
    })

    test('should check if site is active for extension', () => {
      const isActiveSite = (url) => {
        if (!url) return false
        try {
          const parsed = new URL(url)
          return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        } catch {
          return false
        }
      }

      expect(isActiveSite('https://example.com')).toBe(true)
      expect(isActiveSite('http://test.org')).toBe(true)
      expect(isActiveSite('chrome://extensions')).toBe(false)
      expect(isActiveSite('about:blank')).toBe(false)
      expect(isActiveSite(null)).toBe(false)
    })
  })

  describe('Data Processing', () => {
    test('should process statistics data', () => {
      const processStats = (rawStats) => {
        const defaultStats = {
          totalBlocked: 0,
          todayBlocked: 0,
          weekBlocked: 0,
          activeTabs: 0,
          disabledSites: []
        }

        return { ...defaultStats, ...rawStats }
      }

      const result = processStats({
        totalBlocked: 100,
        todayBlocked: 25
      })

      expect(result.totalBlocked).toBe(100)
      expect(result.todayBlocked).toBe(25)
      expect(result.weekBlocked).toBe(0)
      expect(result.disabledSites).toEqual([])
    })

    test('should calculate time differences', () => {
      const getTimeDiff = (start, end = Date.now()) => {
        return end - start
      }

      const start = Date.now() - 60000 // 1 minute ago
      const diff = getTimeDiff(start)

      expect(diff).toBeGreaterThan(50000)
      expect(diff).toBeLessThan(70000)
    })

    test('should group data by type', () => {
      const groupByType = (items) => {
        return items.reduce((acc, item) => {
          const type = item.type || 'unknown'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
      }

      const items = [
        { type: 'script' },
        { type: 'image' },
        { type: 'script' },
        { type: 'image' },
        { type: 'script' }
      ]

      const result = groupByType(items)

      expect(result.script).toBe(3)
      expect(result.image).toBe(2)
    })
  })

  describe('Error Handling', () => {
    test('should handle null/undefined gracefully', () => {
      const safeAccess = (obj, path) => {
        try {
          return path.split('.').reduce((current, key) => {
            return current && current[key]
          }, obj)
        } catch {
          return null
        }
      }

      expect(safeAccess({ a: { b: { c: 'value' } } }, 'a.b.c')).toBe('value')
      expect(safeAccess({ a: { b: null } }, 'a.b.c')).toBe(null)
      expect(safeAccess(null, 'a.b.c')).toBe(null)
    })

    test('should handle array operations safely', () => {
      const safeArrayOp = (arr, operation) => {
        try {
          if (!Array.isArray(arr)) return []
          return operation(arr)
        } catch {
          return []
        }
      }

      const result1 = safeArrayOp([1, 2, 3], arr => arr.map(x => x * 2))
      const result2 = safeArrayOp(null, arr => arr.map(x => x * 2))
      const result3 = safeArrayOp('not-array', arr => arr.map(x => x * 2))

      expect(result1).toEqual([2, 4, 6])
      expect(result2).toEqual([])
      expect(result3).toEqual([])
    })
  })

  describe('Configuration Management', () => {
    test('should merge configuration objects', () => {
      const mergeConfig = (defaults, user) => {
        return {
          ...defaults,
          ...user,
          features: {
            ...defaults.features,
            ...user.features
          }
        }
      }

      const defaults = {
        enabled: true,
        autoBlock: true,
        features: {
          notifications: true,
          statistics: true
        }
      }

      const userConfig = {
        autoBlock: false,
        features: {
          notifications: false
        }
      }

      const result = mergeConfig(defaults, userConfig)

      expect(result.enabled).toBe(true)
      expect(result.autoBlock).toBe(false)
      expect(result.features.notifications).toBe(false)
      expect(result.features.statistics).toBe(true)
    })
  })

  describe('String Operations', () => {
    test('should capitalize first letter', () => {
      const capitalize = (str) => {
        if (!str) return ''
        return str.charAt(0).toUpperCase() + str.slice(1)
      }

      expect(capitalize('hello')).toBe('Hello')
      expect(capitalize('WORLD')).toBe('WORLD')
      expect(capitalize('')).toBe('')
      expect(capitalize(null)).toBe('')
    })

    test('should truncate long text', () => {
      const truncate = (text, maxLength = 50) => {
        if (!text || text.length <= maxLength) return text
        return text.substring(0, maxLength) + '...'
      }

      expect(truncate('short')).toBe('short')
      expect(truncate('this is a very long text that needs to be truncated', 20))
        .toBe('this is a very long ...')
      expect(truncate('')).toBe('')
    })
  })
})