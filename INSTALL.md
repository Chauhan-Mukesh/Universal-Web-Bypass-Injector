# Installation Guide

## How to Install the Universal Web Bypass Injector Chrome Extension

### Method 1: Load Unpacked Extension (Recommended for Testing)

1. **Enable Developer Mode**:
   - Open Google Chrome
   - Navigate to `chrome://extensions/`
   - Toggle on "Developer mode" in the top-right corner

2. **Load the Extension**:
   - Click "Load unpacked" button
   - Navigate to and select this folder (`Universal-Web-Bypass-Injector`)
   - The extension will appear in your extensions list

3. **Verify Installation**:
   - Look for the extension icon in your browser toolbar
   - Click the icon to open the popup and verify it shows "Active and protecting this page"

### Method 2: Pack Extension (For Distribution)

1. **Create Extension Package**:
   - In `chrome://extensions/`, click "Pack extension"
   - Select the extension folder
   - Chrome will create a `.crx` file and `.pem` key

2. **Install Packed Extension**:
   - Drag and drop the `.crx` file onto the Chrome extensions page
   - Confirm the installation

### Testing the Extension

1. **Visit a Test Site**:
   - Go to any website with ads or tracking (e.g., news sites)
   - Open the extension popup to see if it's active

2. **Check Developer Console**:
   - Press F12 to open Developer Tools
   - Go to Console tab
   - Look for fewer tracking requests and blocked network calls

3. **Verify Functionality**:
   - Ads should be blocked or reduced
   - Paywall overlays should be removed (on supported sites)
   - Page scrolling should work normally

### Troubleshooting

- **Extension not loading**: Check that all files are present and JavaScript syntax is valid
- **Not working on a site**: Try refreshing the page; some sites require reload for content script injection
- **Performance issues**: Make sure no other ad blockers are conflicting

### Permissions Explained

The extension requests these permissions:
- `activeTab`: To run on the current tab
- `scripting`: To inject content scripts
- `contextMenus`: For right-click menu options
- `http://*/*` & `https://*/*`: To work on all websites