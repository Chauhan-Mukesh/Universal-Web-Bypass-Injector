// Popup script for Universal Web Bypass Injector

document.addEventListener('DOMContentLoaded', function() {
  // Get current tab information
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    const currentTab = tabs[0];
    const currentUrlElement = document.getElementById('current-url');
    
    if (currentTab && currentTab.url) {
      try {
        const url = new URL(currentTab.url);
        currentUrlElement.textContent = url.hostname;
      } catch (error) {
        currentUrlElement.textContent = 'Invalid URL';
      }
    } else {
      currentUrlElement.textContent = 'No active tab';
    }
  });
  
  // Optional: Add click handlers for future features
  // For example, a toggle button or settings
});