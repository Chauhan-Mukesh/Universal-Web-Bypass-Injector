# Changelog

All notable changes to the Universal Web Bypass Injector extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### 📋 Documentation Consolidation
- **Documentation Restructure**: Consolidated markdown documentation for better organization
  - Created comprehensive TODO.md with all actionable project items
  - Created DEVELOPMENT.md consolidating technical documentation
  - Enhanced SECURITY.md with consolidated security information
  - Removed redundant and temporary documentation files
- **Developer Experience**: Improved development workflow documentation
  - Consolidated CI/CD, testing, and performance documentation
  - Enhanced setup and contribution guidelines
  - Better organized technical resources

### Added
- **Fixed Statistics Page Access**: Resolved ERR_FILE_NOT_FOUND error when clicking "Click to view detailed statistics"
  - Added `statistics.html` and `statistics.js` to build and packaging scripts
  - Updated production build optimization to include statistics.js
  - Complete statistics functionality testing and validation
- **Enhanced Ad Blocking Filters**: Integrated latest open-source ad block filters
  - Added patterns from EasyList and uBlock Origin (80+ new patterns)
  - Enhanced analytics and tracker blocking (HotJar, FullStory, Mixpanel, Segment, etc.)
  - Improved ad network detection (AppNexus, Rubicon, OpenX, Smart AdServer, etc.)
  - Added social media tracker blocking (Facebook Pixel, Twitter Analytics, LinkedIn Ads)
  - Enhanced GDPR/privacy compliance blocking (OneTrust, CookieLaw, TrustArc)
- **Improved Restricted Content Handling**: 
  - Graceful detection of login/premium gated content
  - Non-intrusive Internet Archive suggestions for restricted content
  - Automatic blur filter removal for preview content
  - Enhanced paywall overlay detection and removal
- **Enhanced Anti-Adblock Circumvention**:
  - Added detection for anti-adblock scripts (fuckadblock.js, blockadblock, etc.)
  - Improved modal and overlay removal with high z-index detection
  - Better paywall detection patterns (Piano, subscription walls, etc.)
  - Enhanced content gate and access barrier removal

### Fixed
- **Build System**: Statistics files now properly included in extension builds
- **Packaging**: Extension packages now include all required files for proper functionality
- **File Access**: Chrome extension URLs now resolve correctly for statistics page
- **Test Suite**: Fixed 25 failing statistics tests, improved test coverage to 76.88%
- **Security Issues**: Resolved all security vulnerabilities (2 medium, 1 low severity)
  - Enhanced Content Security Policy with stricter directives
  - Enforced HTTPS-only external connectivity
  - Improved secret scanning and CI/CD security

### Enhanced
- **Blocking Rules**: Expanded from ~20 to 80+ blocking patterns
- **DOM Selectors**: Enhanced from basic patterns to comprehensive paywall/overlay detection
- **Error Handling**: More graceful handling of restricted content with user-friendly fallbacks
- **Code Quality**: All changes maintain 100% ESLint compliance and enhanced test coverage
- **Performance**: Optimized DOM cleaning for large pages (<1000ms for 5000+ nodes)
- **Security**: Strengthened security posture with comprehensive policy updates

## [2.0.0] - 2024-XX-XX

### Added
- Professional-grade Chrome extension with Manifest V3 support
- Comprehensive testing suite with 146 tests
- Enhanced UI with modern popup interface  
- Real-time statistics and activity monitoring
- Advanced background service worker
- Keyboard shortcuts and accessibility improvements
- Automated CI/CD pipeline with GitHub Actions

### Security
- Content Security Policy implementation
- Minimal permission requirements
- Sandboxed execution environment
- XSS-safe DOM manipulation

### Performance
- Memory usage optimized to <10MB
- CPU impact minimized to <1%
- Non-blocking async operations
- Debounced DOM monitoring

---

## Version History

- **v2.0.0**: Major professional-grade release with comprehensive testing and CI/CD
- **v1.0.0**: Initial release with basic ad and tracker blocking functionality

---

## Notes

### Compliance
All bypass and ad-blocking functionality complies with:
- Chrome Web Store policies
- Website terms of service where applicable
- Privacy regulations (GDPR, CCPA)

### Browser Support
- Chrome 88+ (Manifest V3 required)
- Chromium-based browsers (Edge, Brave, Opera)
- Future Firefox support planned (when Manifest V3 available)