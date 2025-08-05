# Universal Web Bypass Injector

![Extension Icon](icons/icon48.png)

A powerful Chrome extension that automatically bypasses ads, tracking scripts, paywalls, and various website restrictions. This extension works silently in the background to provide a cleaner, faster, and more private browsing experience.

## 🚀 Features

- **Ad & Tracker Blocking**: Automatically blocks common advertising and analytics scripts
- **Paywall Bypass**: Removes common paywall overlays and restrictions
- **Anti-Tracking**: Prevents various tracking mechanisms from collecting your data
- **Cookie Banner Removal**: Automatically removes annoying cookie consent banners
- **Scroll Restoration**: Restores normal page scrolling when sites try to disable it
- **Real-time Protection**: Continuously monitors and blocks new tracking attempts
- **Universal Compatibility**: Works on most websites automatically

## 🛡️ What Gets Blocked

### Tracking & Analytics Services
- Google Analytics
- Google Tag Manager
- Facebook Pixel
- Twitter Analytics
- TikTok Analytics
- Adobe Analytics
- And many more...

### Ad Networks
- Google AdSense
- Amazon Advertising
- Outbrain
- Taboola
- Criteo
- And dozens of other ad networks

### Common Overlays
- Paywall overlays
- Ad-block detection popups
- Newsletter signup modals
- Cookie consent banners
- Age verification overlays

## 📦 Installation

### From Chrome Web Store (Coming Soon)
1. Visit the Chrome Web Store
2. Search for "Universal Web Bypass Injector"
3. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the extension folder
5. The extension will be installed and ready to use

## 🔧 How It Works

The extension uses several techniques to provide comprehensive protection:

1. **Request Interception**: Blocks tracking requests at the network level using `fetch()` and `XMLHttpRequest` patching
2. **DOM Cleaning**: Removes tracking elements and overlays from web pages
3. **CSS Restoration**: Fixes page styling issues caused by restrictive websites
4. **Mutation Monitoring**: Continuously watches for new tracking elements being added to pages

## 📁 Project Structure

```
Universal-Web-Bypass-Injector/
├── manifest.json          # Extension configuration
├── content.js             # Main content script (runs on web pages)
├── background.js           # Background service worker
├── popup.html             # Extension popup interface
├── popup.js               # Popup functionality
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md              # This file
└── LICENSE                # GPL-3.0 License
```

## 🔒 Privacy

This extension operates with privacy as a core principle:

- **No Data Collection**: The extension does not collect, store, or transmit any personal data
- **Local Processing**: All blocking and filtering happens locally on your device
- **No External Servers**: No communication with external servers or analytics services
- **Open Source**: Full source code is available for inspection and verification

## ⚙️ Technical Details

### Permissions Explained
- `activeTab`: Required to run content scripts on the current tab
- `scripting`: Needed to inject scripts into web pages
- `http://*/*` & `https://*/*`: Allows the extension to work on all websites

### Browser Compatibility
- Chrome 88+ (Manifest V3 support required)
- Chromium-based browsers (Edge, Brave, Opera, etc.)

### Performance Impact
- Minimal memory footprint
- Efficient request filtering
- Non-blocking operation
- No impact on page load times

## 🐛 Troubleshooting

### Extension Not Working?
1. Check that the extension is enabled in `chrome://extensions/`
2. Refresh the page you're trying to use it on
3. Check the extension popup to see if it's active

### Site Still Showing Ads/Paywalls?
1. Some sites use advanced techniques that may require updates to the blocking rules
2. Try refreshing the page
3. Report the issue with the specific website URL

### Performance Issues?
1. The extension is designed to be lightweight
2. If you experience slowdowns, try disabling other extensions to identify conflicts

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Report Bugs**: Submit issues with detailed descriptions and steps to reproduce
2. **Request Features**: Suggest new features or improvements
3. **Submit Code**: Fork the repository and submit pull requests
4. **Update Blocking Rules**: Help identify new tracking services to block

### Development Setup
1. Clone the repository
2. Make your changes
3. Test the extension in Chrome developer mode
4. Submit a pull request with a clear description

## 📜 License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Free to use**: Personal and commercial use allowed
- ✅ **Modify**: You can modify the code for your needs
- ✅ **Distribute**: Share the extension with others
- ⚠️ **Share modifications**: If you distribute modified versions, you must also share the source code
- ⚠️ **Same license**: Derivative works must use the same GPL-3.0 license

## 🌟 Support

If you find this extension helpful, please:
- ⭐ Star this repository
- 🐛 Report any bugs you encounter
- 💡 Suggest new features
- 📢 Share with others who might find it useful

## 📞 Contact

- **GitHub Issues**: For bug reports and feature requests
- **Repository**: [Universal-Web-Bypass-Injector](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector)

## ⚠️ Disclaimer

This extension is designed to improve user experience and privacy. Users are responsible for ensuring their usage complies with the terms of service of websites they visit. The developers are not responsible for any misuse of this extension.

## 🗂️ Version History

### v1.0.0 (Current)
- Initial release as Chrome extension
- Comprehensive ad and tracker blocking
- Paywall bypass functionality
- Cookie banner removal
- Real-time DOM monitoring
- Clean, user-friendly popup interface

---

**Made with ❤️ for a better web experience**