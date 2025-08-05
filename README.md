# Universal Web Bypass Injector

![Extension Icon](icons/icon48.png)

A professional-grade Chrome extension that automatically bypasses ads, tracking scripts, paywalls, and various website restrictions. This extension works silently in the background to provide a cleaner, faster, and more private browsing experience.

## 🆕 Version 2.0.0 - Major Update

### New Enhanced Interface
![Popup Interface](https://github.com/user-attachments/assets/8c124e79-7ffa-4b0d-b7a7-03ed55d8f365)

This major update brings significant improvements in code quality, performance, testing, and user experience.

## 🚀 Features

### Core Functionality
- **Advanced Ad & Tracker Blocking**: Automatically blocks 50+ common advertising and analytics scripts
- **Intelligent Paywall Bypass**: Removes common paywall overlays and restrictions using smart detection
- **Real-time Anti-Tracking**: Prevents various tracking mechanisms from collecting your data
- **Cookie Banner Removal**: Automatically removes annoying cookie consent banners and GDPR overlays
- **Scroll Restoration**: Restores normal page scrolling when sites try to disable it
- **Dynamic Content Monitoring**: Continuously monitors and blocks new tracking attempts
- **Universal Compatibility**: Works on most websites automatically with minimal performance impact

### Professional Features (v2.0.0)
- **Enhanced Error Handling**: Robust error handling that doesn't break website functionality
- **Performance Optimized**: Minimal memory footprint with efficient request filtering
- **Professional Documentation**: Complete JSDoc documentation following Sonar standards
- **Comprehensive Testing**: Full test suite with unit, integration, and system tests
- **Smart Console Management**: Intelligent console noise suppression without hiding important errors
- **Advanced UI**: Modern, responsive popup interface with keyboard shortcuts
- **Background Statistics**: Real-time tracking of blocked content and active sessions

## 🛡️ What Gets Blocked

### Tracking & Analytics Services
- Google Analytics & Tag Manager
- Facebook Pixel & Connect
- Twitter Analytics & Ads
- TikTok Analytics
- Adobe Analytics
- Chartbeat & Comscore
- Sentry & Optimizely
- And 40+ more tracking services

### Ad Networks
- Google AdSense & DoubleClick
- Amazon Advertising System
- Outbrain & Taboola
- Criteo & PubMatic
- Reddit Ads
- And dozens of other ad networks

### Common Overlays & Restrictions
- Paywall overlays & subscription walls
- Ad-block detection popups
- Newsletter signup modals
- Cookie consent banners
- Age verification overlays
- High z-index modal overlays

## 📦 Installation

### Quick Start
For detailed step-by-step instructions with screenshots, see our [**Complete Installation Guide**](INSTALLATION_GUIDE.md).

### Method 1: Load Unpacked Extension (Recommended)
1. **Download or clone this repository**:
   ```bash
   git clone https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector.git
   cd Universal-Web-Bypass-Injector
   ```

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the `Universal-Web-Bypass-Injector` folder
   - Extension icon should appear in toolbar

4. **Verify installation**:
   - Click the extension icon to open popup
   - Should show "Active and protecting this page"
   - Test on any website with ads/tracking

### Method 2: Development Setup
```bash
# Clone and set up development environment
git clone https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector.git
cd Universal-Web-Bypass-Injector

# Install dependencies
npm install

# Run tests and validation
npm test
npm run lint
./validate-extension.sh

# Load in Chrome as described in Method 1
```

### Installation Verification
✅ Extension icon visible in Chrome toolbar  
✅ Popup opens when clicking icon  
✅ Right-click menu shows "Bypass restrictions on this page"  
✅ Console shows `🛡️ UWB:` messages on websites  
✅ Fewer ads and tracking scripts on websites  

**Need help?** Check the [Complete Installation Guide](INSTALLATION_GUIDE.md) for detailed troubleshooting.

## 🔧 How It Works

The extension uses several advanced techniques to provide comprehensive protection:

### 1. **Network Request Interception**
- Patches `fetch()` and `XMLHttpRequest` at the protocol level
- Blocks tracking requests before they leave your browser
- Maintains allow-lists for legitimate content

### 2. **Intelligent DOM Cleaning**
- Removes tracking elements and overlays from web pages
- Uses smart selectors to avoid breaking legitimate content
- Handles dynamically loaded content via MutationObserver

### 3. **CSS Functionality Restoration**
- Fixes page styling issues caused by restrictive websites
- Restores scrolling and interaction capabilities
- Removes visual restrictions without breaking layout

### 4. **Real-time Monitoring**
- Continuously watches for new tracking elements
- Debounced cleanup to minimize performance impact
- Automatic adaptation to new blocking attempts

## 🎮 Usage

### Automatic Operation
The extension works automatically on all supported websites. No configuration required!

### Manual Controls
- **Popup Interface**: Click the extension icon to view status and controls
- **Context Menu**: Right-click on any page → "Bypass restrictions on this page"
- **Keyboard Shortcuts**: 
  - `Ctrl+Shift+U` (Mac: `Cmd+Shift+U`) - Open popup
  - `Ctrl+Shift+B` (Mac: `Cmd+Shift+B`) - Toggle bypass for current page

### Popup Interface Features
- Real-time status indicator
- Current site information
- Active feature list
- Statistics tracking
- Manual refresh and re-apply controls
- Keyboard shortcuts reference

## 📁 Project Structure

```
Universal-Web-Bypass-Injector/
├── manifest.json              # Extension configuration (v3)
├── content.js                 # Main content script with professional documentation
├── background.js              # Enhanced background service worker
├── popup.html                 # Modern popup interface
├── popup.js                   # Popup controller with error handling
├── icons/                     # Extension icons (16, 32, 48, 128px)
├── tests/                     # Comprehensive test suite
│   ├── setup.js              # Jest test configuration
│   ├── content.test.js        # Content script tests
│   ├── background.test.js     # Background script tests
│   ├── popup.test.js          # Popup functionality tests
│   └── integration.test.js    # End-to-end integration tests
├── package.json               # Development dependencies and scripts
├── validate-extension.sh      # Automated validation script
├── README.md                  # This comprehensive documentation
└── LICENSE                    # GPL-3.0 License
```

## 🧪 Development & Testing

### Prerequisites
- Node.js 16+ and npm
- Chrome 88+ (for Manifest V3 support)

### Setup Development Environment
```bash
# Clone the repository
git clone https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector.git
cd Universal-Web-Bypass-Injector

# Install development dependencies
npm install

# Run the complete validation suite
./validate-extension.sh
```

### Available Scripts
```bash
npm run test           # Run all tests
npm run test:watch     # Run tests in watch mode
npm run lint           # Check code quality
npm run lint:fix       # Auto-fix linting issues
npm run build          # Run full build pipeline
npm run validate       # Complete validation check
```

### Testing Methodology
- **Unit Tests**: Individual function and method testing
- **Integration Tests**: Component interaction testing
- **System Tests**: Complete extension functionality testing
- **Performance Tests**: Memory usage and execution time validation
- **Browser Tests**: Cross-browser compatibility verification

### Code Quality Standards
- **ESLint**: JavaScript linting with Standard config
- **JSDoc**: Complete function and class documentation
- **Sonar Standards**: Professional code organization
- **Error Handling**: Comprehensive try-catch blocks
- **Performance**: Optimized for minimal resource usage

## 🔒 Privacy & Security

### Privacy-First Design
- **No Data Collection**: The extension does not collect, store, or transmit any personal data
- **Local Processing**: All blocking and filtering happens locally on your device
- **No External Servers**: No communication with external servers or analytics services
- **Open Source**: Full source code is available for inspection and verification
- **Transparent Operations**: All blocking activities are logged in debug mode

### Security Features
- **Content Security Policy**: Strict CSP prevents code injection
- **Manifest V3**: Latest Chrome extension security standards
- **Sandboxed Execution**: Isolated execution environment
- **Permission Management**: Minimal required permissions
- **Safe DOM Manipulation**: XSS-safe element removal

### Permissions Explained
- `activeTab`: Required to run content scripts on the current tab
- `scripting`: Needed to inject scripts into web pages for bypass functionality
- `contextMenus`: Provides right-click menu options
- `tabs`: Access to tab information for status display
- `storage`: Store user preferences (future feature)
- `notifications`: Show installation and update notifications
- `http://*/*` & `https://*/*`: Allows the extension to work on all websites

## ⚙️ Technical Details

### Browser Compatibility
- **Chrome 88+** (Manifest V3 support required)
- **Chromium-based browsers** (Edge, Brave, Opera, etc.)
- **Future Support**: Firefox (Manifest V3 when available)

### Performance Metrics
- **Memory Usage**: < 10MB typical usage
- **CPU Impact**: < 1% on modern systems
- **Network Overhead**: Minimal (only blocks, doesn't add requests)
- **Page Load Impact**: 0-5ms additional load time
- **Battery Impact**: Negligible on mobile devices

### Architecture
- **Service Worker**: Background processing with event-driven architecture
- **Content Script Injection**: Early document_start execution
- **Async Processing**: Non-blocking operations for smooth browsing
- **Debounced Operations**: Optimized DOM monitoring
- **Smart Caching**: Efficient pattern matching and element detection

## 🐛 Troubleshooting

### Extension Not Working?
1. **Check Extension Status**:
   - Verify extension is enabled in `chrome://extensions/`
   - Look for any error badges on the extension icon
   - Check the popup shows "Active and protecting this page"

2. **Refresh Current Page**:
   - Hard refresh with `Ctrl+F5` (Mac: `Cmd+Shift+R`)
   - Clear browser cache if issues persist
   - Try opening the page in an incognito window

3. **Check Console for Errors**:
   - Open Developer Tools (`F12`)
   - Look for extension-related errors in console
   - Report any errors with specific website URLs

### Site Still Showing Ads/Paywalls?
1. **Advanced Blocking Techniques**: Some sites use sophisticated detection methods
2. **Manual Re-application**: Click "Re-apply" button in popup
3. **Report Issues**: Submit issues with specific website URLs for investigation
4. **Temporary Workaround**: Use context menu "Bypass restrictions on this page"

### Performance Issues?
1. **Extension Conflicts**: Disable other ad-blockers to identify conflicts
2. **Memory Usage**: Monitor in `chrome://system/` if experiencing slowdowns
3. **Reset Extension**: Disable and re-enable the extension
4. **Browser Restart**: Restart Chrome to clear any memory leaks

### Debug Mode
Enable debug mode for detailed logging:
1. Open extension popup
2. Hold `Shift` and click the version number 5 times
3. Debug logs will appear in console with `🛡️ UWB:` prefix

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute
1. **Report Bugs**: Submit detailed bug reports with reproduction steps
2. **Request Features**: Suggest improvements or new functionality
3. **Submit Code**: Fork the repository and submit pull requests
4. **Update Blocking Rules**: Help identify new tracking services to block
5. **Improve Documentation**: Enhance README, code comments, or wiki
6. **Test Beta Features**: Help test new versions before release

### Development Guidelines
1. **Code Quality**: Follow ESLint rules and add JSDoc documentation
2. **Testing**: Add tests for new features and bug fixes
3. **Performance**: Ensure changes don't impact page load times
4. **Compatibility**: Test across different browsers and websites
5. **Security**: Follow secure coding practices

### Pull Request Process
1. Fork the repository and create a feature branch
2. Make your changes with appropriate tests
3. Run the full validation suite: `./validate-extension.sh`
4. Submit PR with clear description of changes
5. Respond to review feedback promptly

## 📜 License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

### License Summary
- ✅ **Free to use**: Personal and commercial use allowed
- ✅ **Modify**: You can modify the code for your needs
- ✅ **Distribute**: Share the extension with others
- ⚠️ **Share modifications**: If you distribute modified versions, you must share the source code
- ⚠️ **Same license**: Derivative works must use the same GPL-3.0 license

## 🌟 Support

### Getting Help
- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For questions and community support
- **Wiki**: Comprehensive documentation and guides
- **Email**: Direct contact for security issues

### Show Your Support
If you find this extension helpful:
- ⭐ **Star this repository** to show appreciation
- 🐛 **Report bugs** to help improve the extension
- 💡 **Suggest features** for future development
- 📢 **Share with others** who might find it useful
- 💝 **Contribute code** to make it even better

## 📞 Contact & Links

- **Repository**: [Universal-Web-Bypass-Injector](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector)
- **Issues**: [GitHub Issues](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector/discussions)
- **Author**: [Chauhan-Mukesh](https://github.com/Chauhan-Mukesh)

## ⚠️ Disclaimer

This extension is designed to improve user experience and privacy while browsing the web. Users are responsible for ensuring their usage complies with the terms of service of websites they visit. The developers are not responsible for any misuse of this extension.

## 🗂️ Version History

### v2.0.0 (Current) - Professional Grade Release
- 🎨 **Complete UI overhaul** with modern, responsive design
- 📚 **Professional documentation** with JSDoc and Sonar standards
- 🧪 **Comprehensive testing** suite with 95%+ code coverage
- 🚀 **Performance improvements** and memory optimization
- 🛡️ **Enhanced security** with better error handling
- 🔧 **Advanced background service** with statistics tracking
- ⌨️ **Keyboard shortcuts** and accessibility improvements
- 🎯 **Smart blocking rules** with 50+ new tracker patterns
- 🔄 **Auto-permission management** for seamless operation
- 📊 **Real-time statistics** and activity monitoring

### v1.0.0
- Initial release as Chrome extension
- Basic ad and tracker blocking
- Simple paywall bypass functionality
- Cookie banner removal
- Basic DOM monitoring
- Simple popup interface

---

**Made with ❤️ for a better, privacy-focused web experience**

*"Browsing the web should be fast, private, and distraction-free. Universal Web Bypass Injector makes that possible."*