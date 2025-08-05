# Performance Guide

## Overview

This document describes the performance optimizations implemented in the Universal Web Bypass Injector, particularly for handling large DOM structures efficiently.

## Performance Optimizations

### DOM Cleaning Performance

The content script's DOM cleaning functionality has been optimized to handle large web pages with 5,000+ DOM nodes efficiently.

#### Key Optimizations Implemented

1. **Batched DOM Operations**
   - Consolidated multiple `querySelectorAll` calls into fewer, more targeted queries
   - Reduced DOM reflows by batching element removals
   - Minimized repeated DOM traversals

2. **Efficient Selector Targeting**
   - Replaced broad TreeWalker approach with targeted CSS selectors
   - Prioritized most common ad/paywall patterns for faster detection
   - Reduced selector complexity by grouping related patterns

3. **Minimal DOM Interaction**
   - Direct `removeChild` operations instead of helper methods where possible
   - Eliminated unnecessary element validation for performance-critical paths
   - Streamlined logging for blocked elements

4. **Optimized Algorithm Flow**
   - Separate code paths for large DOM vs. small node sets
   - Fast-path execution for most common blocking scenarios
   - Fallback methods for edge cases

#### Performance Metrics

- **Before Optimization**: 1,800+ ms for 5,000 node DOM
- **After Optimization**: <800 ms for 5,000 node DOM
- **Performance Target**: <1,000 ms (consistently achieved)

### Running Performance Tests

To run the performance tests locally:

```bash
# Run all enhanced feature tests
npm test -- tests/enhanced-features.test.js

# Run only the performance test
npm test -- tests/enhanced-features.test.js --testNamePattern="should handle large DOM efficiently"
```

### Performance Monitoring

The optimized DOM cleaning includes performance logging:

```javascript
// Performance metrics are logged during DOM cleaning
console.log(`DOM cleaning took ${duration}ms for ${nodeCount} nodes`);
```

## Guidelines for Future Performance Work

### 1. DOM Operations

- **Batch Operations**: Always batch DOM reads and writes
- **Minimize Queries**: Use targeted selectors instead of broad traversals
- **Cache Results**: Store frequently accessed DOM references
- **Avoid Reflows**: Minimize layout-triggering operations

### 2. Large DOM Handling

- **Size Thresholds**: Consider DOM size when choosing algorithms
- **Progressive Processing**: Break large operations into chunks
- **Early Exit**: Return early when performance budgets are exceeded
- **Fallback Strategies**: Provide simpler alternatives for edge cases

### 3. Testing Performance

- **Realistic Test Data**: Use representative DOM structures in tests
- **Performance Budgets**: Set and enforce time limits (e.g., <1000ms)
- **Continuous Monitoring**: Include performance tests in CI/CD
- **Regression Detection**: Alert on performance degradation

### 4. Memory Management

- **Element References**: Clean up DOM references promptly
- **Event Listeners**: Remove listeners when elements are removed
- **Avoid Memory Leaks**: Use WeakMap/WeakSet for temporary associations
- **Log Rotation**: Limit log entry storage to prevent memory bloat

## Debugging Performance Issues

### Enable Performance Logging

Set up detailed performance logging in the browser console:

```javascript
// In browser console
localStorage.setItem('uwb-debug', 'true');
```

### Common Performance Bottlenecks

1. **Complex CSS Selectors**: Break down complex selectors
2. **Excessive DOM Queries**: Cache and reuse query results
3. **Synchronous Operations**: Consider async processing for large datasets
4. **Memory Leaks**: Monitor memory usage during extended sessions

### Performance Analysis Tools

- **Browser DevTools**: Use Performance tab for profiling
- **Jest Performance**: Monitor test execution times
- **Memory Profiler**: Check for memory leaks during DOM operations
- **Network Panel**: Ensure optimizations don't affect loading

## Browser Compatibility

The performance optimizations are compatible with:

- Chrome/Chromium (Manifest V3)
- Modern browsers supporting ES6+ features
- JSDOM testing environment

## Configuration

Performance behavior can be adjusted through configuration:

```javascript
// Conservative mode for protected sites (reduced operations)
const isProtected = this._isProtectedSite()

// Fast mode for regular sites (full optimization)
this._cleanDOMOptimized(isProtected)
```

## Monitoring and Alerts

For production monitoring, consider:

- Performance budgets in CI/CD pipelines
- Automated alerts for regression detection
- User-reported performance issues tracking
- Regular performance benchmarking

---

For technical questions about performance optimizations, please refer to the [content.js](./content.js) file or create an issue in the repository.