# Universal Web Bypass Injector - Complete Installation Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Method 1: Direct Download (Recommended)](#method-1-direct-download-recommended)
- [Method 2: Load Unpacked Extension (For Development)](#method-2-load-unpacked-extension-for-development)
- [Method 3: Build from Source](#method-3-build-from-source)
- [Verification Steps](#verification-steps)
- [Troubleshooting](#troubleshooting)
- [Usage Guide](#usage-guide)
- [Advanced Configuration](#advanced-configuration)

## Prerequisites

Before installing the Universal Web Bypass Injector extension, ensure you have:

- **Google Chrome** version 88 or later (for Manifest V3 support)
- **Chromium-based browsers** also supported (Edge, Brave, Opera, etc.)
- **Developer mode** access in your browser
- **Basic computer skills** for file management

## Method 1: Direct Download (Recommended)

🎯 **This is the easiest method for most users!**

The Universal Web Bypass Injector provides ready-to-use packages that you can download and install directly without building from source.

### Step 1: Download the Extension Package

1. **Visit the [Releases Page](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector/releases)**
2. **Find the latest release** and look for the **Assets** section
3. **Download one of these packages**:
   - `universal-web-bypass-injector-production-vX.X.X-TIMESTAMP.zip` - **Recommended for most users**
   - `universal-web-bypass-injector-development-vX.X.X-TIMESTAMP.zip` - For testing/development

### Step 2: Extract the Package
1. **Locate the downloaded ZIP file** in your Downloads folder
2. **Right-click** the ZIP file and select **"Extract All..."** or **"Extract Here"**
3. **Choose a permanent location** for the extension folder (e.g., `Documents/Chrome Extensions/`)
4. **Remember this location** - you'll need it for installation

> ⚠️ **Important**: Don't delete the extracted folder after installation, as Chrome needs access to these files!

### Step 3: Install in Chrome
1. **Open Google Chrome**
2. **Navigate to**: `chrome://extensions/`
3. **Enable Developer Mode** (toggle in top-right corner)
4. **Click "Load unpacked"**
5. **Select the extracted folder** (the one containing `manifest.json`)
6. **Click "Select Folder"**

### Step 4: Verify Installation
- The extension should appear in your extensions list
- Look for the **Universal Web Bypass Injector** icon in your browser toolbar
- The extension should be **enabled** by default

### 🔐 Package Verification (Optional but Recommended)

For security-conscious users, each release includes checksums to verify package integrity:

1. **Download the checksums file**: Look for `*.checksums.txt` in the release assets
2. **Verify the package**: 
   ```bash
   # On Windows (PowerShell)
   Get-FileHash universal-web-bypass-injector-*.zip -Algorithm SHA256
   
   # On macOS/Linux
   sha256sum universal-web-bypass-injector-*.zip
   ```
3. **Compare the output** with the value in the checksums file

### 🔄 Auto-Updates
When using this method, you'll need to manually check for updates:
1. Visit the releases page periodically
2. Download newer versions when available
3. Remove the old extension and install the new one

---

## Method 2: Load Unpacked Extension (For Development)

This method is perfect for developers or if you want to modify the extension code.

### Step 1: Download the Source Code
1. **Clone the repository** or **download as ZIP**:
   ```bash
   git clone https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector.git
   cd Universal-Web-Bypass-Injector
   ```
   Or download the ZIP file from the GitHub repository and extract it to a folder.

2. **Install dependencies and build** (required for local development):
   ```bash
   npm install
   npm run build
   ```
   This creates the `dist/` folder with the built extension files.

### Step 2: Access Chrome Extensions Page
1. **Open Google Chrome**
2. **Navigate to the extensions page** using one of these methods:
   - Type `chrome://extensions/` in the address bar and press Enter
   - Click the three dots menu (⋮) → More Tools → Extensions
   - Use keyboard shortcut: `Ctrl+Shift+Delete` then click "Extensions"

![Chrome Extensions Page](https://via.placeholder.com/800x400/4285f4/ffffff?text=Chrome+Extensions+Page)

### Step 3: Enable Developer Mode
1. **Look for the "Developer mode" toggle** in the top-right corner of the extensions page
2. **Click the toggle** to enable Developer mode
3. **New buttons will appear**: "Load unpacked", "Pack extension", "Update"

![Developer Mode Toggle](https://via.placeholder.com/800x200/34a853/ffffff?text=Developer+Mode+Toggle)

### Step 4: Load the Extension
1. **Click "Load unpacked"** button
2. **Navigate to the Universal-Web-Bypass-Injector/dist folder** (the built extension)
3. **Select the dist folder** containing the built extension files (manifest.json should be visible inside)
4. **Click "Select Folder"**

![Load Unpacked Dialog](https://via.placeholder.com/600x400/fbbc04/ffffff?text=Load+Unpacked+Dialog)

### Step 5: Verify Installation
The extension should now appear in your extensions list with:
- ✅ **Extension name**: "Universal Web Bypass Injector"
- ✅ **Version**: 2.0.0
- ✅ **Status**: Enabled
- ✅ **Icon**: Visible in the Chrome toolbar

![Extension Installed](https://via.placeholder.com/800x300/ea4335/ffffff?text=Extension+Successfully+Installed)

## Method 3: Build from Source

For developers who want to build the extension from source code or set up a development environment:

### Step 1: Set Up Development Environment
```bash
# Clone the repository
git clone https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector.git
cd Universal-Web-Bypass-Injector

# Install development dependencies
npm install

# Run tests to ensure everything works
npm test

# Run linting
npm run lint

# Build the extension
npm run build

# Run complete validation
npm run validate
```

### Step 2: Load in Chrome
Follow Steps 2-5 from Method 1 to load the extension.

### Step 3: Development Workflow
```bash
# Make changes to the code

# Run tests after changes
npm test

# Run linting
npm run lint

# Build extension
npm run build

# Run all validations
npm run validate

# Reload extension in Chrome
# Go to chrome://extensions/ and click the reload button on your extension
```

## Verification Steps

After installation, verify the extension is working correctly:

### 1. Check Extension Icon
- **Look for the extension icon** in the Chrome toolbar
- **Icon should be visible** and clickable
- **Tooltip should show**: "Universal Web Bypass Injector"

### 2. Test Popup Interface
1. **Click the extension icon**
2. **Popup should open** showing the interface
3. **Should display**: "Active and protecting this page"
4. **Should show current site**: The URL of the active tab

![Popup Interface](https://via.placeholder.com/340x400/4285f4/ffffff?text=Popup+Interface)

### 3. Test on a Website
1. **Visit a news website** with ads (e.g., CNN, BBC, etc.)
2. **Open Developer Tools** (F12)
3. **Check the Console tab** for messages starting with `🛡️ UWB:`
4. **Look for blocked requests** in the Network tab
5. **Notice fewer ads** and tracking scripts

### 4. Test Context Menu
1. **Right-click on any webpage**
2. **Look for**: "Bypass restrictions on this page"
3. **Click the option** to manually trigger bypass

![Context Menu](https://via.placeholder.com/300x200/34a853/ffffff?text=Context+Menu+Option)

## Troubleshooting

### Extension Not Loading
**Problem**: Extension doesn't appear after loading
**Solutions**:
- ✅ Ensure you selected the correct folder (containing manifest.json)
- ✅ Check that Developer mode is enabled
- ✅ Look for error messages in the extensions page
- ✅ Try refreshing the extensions page

### Extension Icon Not Visible
**Problem**: Can't see the extension icon in toolbar
**Solutions**:
- ✅ Click the puzzle piece icon (🧩) in Chrome toolbar
- ✅ Pin the "Universal Web Bypass Injector" extension
- ✅ Check if extension is enabled in chrome://extensions/

![Pin Extension](https://via.placeholder.com/400x300/fbbc04/ffffff?text=Pin+Extension+to+Toolbar)

### Popup Not Opening
**Problem**: Clicking icon doesn't open popup
**Solutions**:
- ✅ Check for JavaScript errors in Developer Tools
- ✅ Reload the extension in chrome://extensions/
- ✅ Restart Chrome browser
- ✅ Check if popup.html exists in extension folder

### Not Blocking Ads/Trackers
**Problem**: Still seeing ads and tracking
**Solutions**:
- ✅ Refresh the webpage after installing extension
- ✅ Check console for UWB messages
- ✅ Try manually clicking "Re-apply" in popup
- ✅ Some advanced tracking may require multiple page loads

### Performance Issues
**Problem**: Browser running slowly
**Solutions**:
- ✅ Disable other ad-blockers to avoid conflicts
- ✅ Check memory usage in Chrome Task Manager
- ✅ Restart browser if needed
- ✅ Report performance issues on GitHub

## Usage Guide

### Basic Usage
The extension works automatically on all websites. No configuration needed!

### Manual Controls
- **Extension Icon**: Click to view status and controls
- **Context Menu**: Right-click → "Bypass restrictions on this page"
- **Keyboard Shortcuts**:
  - `Ctrl+Shift+U` (Mac: `Cmd+Shift+U`) - Open popup
  - `Ctrl+Shift+B` (Mac: `Cmd+Shift+B`) - Toggle bypass

### Popup Interface Features
- 🟢 **Status Indicator**: Shows if extension is active
- 📊 **Current Site Info**: Displays the active website
- 🔄 **Refresh Button**: Updates tab information
- ⚡ **Re-apply Button**: Manually triggers bypass
- 📋 **Feature List**: Shows active protection features
- ⌨️ **Keyboard Shortcuts**: Reference guide

![Popup Features](https://via.placeholder.com/340x500/4285f4/ffffff?text=Popup+Features+Overview)

## Advanced Configuration

### For Developers
Enable debug mode for detailed logging:
1. Open popup interface
2. Hold `Shift` and click version number 5 times
3. Check browser console for detailed logs

### Custom Blocking Rules
The extension uses predefined rules in `content.js`. To modify:
1. Edit the `BLOCKED_HOSTS` array for domains
2. Edit the `SELECTORS_TO_REMOVE` array for CSS selectors
3. Reload the extension after changes

### Performance Tuning
- Monitor memory usage in Chrome Task Manager
- Check extension activity in chrome://extensions/
- Use browser's Developer Tools to analyze performance

## Security Notes

### Permissions Explained
The extension requests these permissions:
- `activeTab`: Run on current tab only
- `scripting`: Inject content scripts for bypass functionality
- `contextMenus`: Add right-click menu options
- `tabs`: Access tab information for status display
- `storage`: Store user preferences (future feature)
- `notifications`: Show installation notifications
- `http://*/*` & `https://*/*`: Work on all websites

### Privacy Protection
- ✅ **No data collection**: Extension doesn't collect personal data
- ✅ **Local processing**: All blocking happens on your device
- ✅ **No external servers**: No communication with external services
- ✅ **Open source**: Full code available for inspection

## Getting Help

### Documentation
- **README.md**: Comprehensive project overview
- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Community support and questions

### Support Channels
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector/discussions)
- 📧 **Security Issues**: Contact maintainer directly

### Contributing
Contributions welcome! See the main README.md for contribution guidelines.

---

**🎉 Congratulations!** You've successfully installed the Universal Web Bypass Injector extension. Enjoy a cleaner, faster, and more private browsing experience!

*For more information, visit the [main repository](https://github.com/Chauhan-Mukesh/Universal-Web-Bypass-Injector).*