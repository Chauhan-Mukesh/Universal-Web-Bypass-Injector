// Background script for Universal Web Bypass Injector
// Handles extension lifecycle and provides additional functionality

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Universal Web Bypass Injector installed successfully');
  } else if (details.reason === 'update') {
    console.log('Universal Web Bypass Injector updated to version', chrome.runtime.getManifest().version);
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // The popup will handle the interaction, but we can add additional logic here if needed
  console.log('Extension icon clicked for tab:', tab.url);
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getTabInfo') {
    // Provide tab information to popup
    sendResponse({
      url: sender.tab?.url || 'unknown',
      title: sender.tab?.title || 'unknown'
    });
  } else if (request.action === 'bypassStatus') {
    // Log bypass activity
    console.log('Bypass applied on:', sender.tab?.url);
    sendResponse({ success: true });
  }
  
  return true; // Keep message channel open for async response
});

// Optional: Add context menu item
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'bypassPage',
    title: 'Bypass restrictions on this page',
    contexts: ['page']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'bypassPage') {
    // Inject content script manually if needed
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
  }
});