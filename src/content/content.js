let port;
let notificationQueue = [];
let isShowingNotification = false;

function connectToBackground() {
  port = chrome.runtime.connect({ name: 'keyCommandPort' });
  
  port.onDisconnect.addListener(() => {
    setTimeout(connectToBackground, 1000);
  });
}

function handleKeyEvent(event) {
  if (!port) return;
  
  const isInputField = event.target.tagName === 'INPUT' || 
                      event.target.tagName === 'TEXTAREA' || 
                      event.target.contentEditable === 'true' ||
                      event.target.isContentEditable;
  
  if (isInputField) return;
  
  // Prevent default for common shortcuts to avoid conflicts
  const shortcutKeys = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'];
  if (shortcutKeys.includes(event.key) && (event.ctrlKey || event.altKey || event.shiftKey)) {
    event.preventDefault();
  }
  
  const keyData = {
    key: event.key.toLowerCase(),
    type: event.type,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey,
    timestamp: Date.now()
  };
  
  port.postMessage({
    type: 'keyEvent',
    event: keyData,
    tab: { 
      url: window.location.href,
      title: document.title,
      id: getCurrentTabId()
    }
  });
}

function getCurrentTabId() {
  return chrome.runtime?.id || Math.random().toString(36).substr(2, 9);
}

function showNotification(message, type = 'success', duration = 2000) {
  notificationQueue.push({ message, type, duration });
  
  if (!isShowingNotification) {
    processNotificationQueue();
  }
}

function processNotificationQueue() {
  if (notificationQueue.length === 0) {
    isShowingNotification = false;
    return;
  }
  
  isShowingNotification = true;
  const { message, type, duration } = notificationQueue.shift();
  
  const notification = document.createElement('div');
  notification.className = `quickeys-notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      processNotificationQueue();
    }, 300);
  }, duration);
}

function getActionDisplayName(actionType, details = {}) {
  const actionNames = {
    back: 'Go Back',
    forward: 'Go Forward',
    reload: 'Page Reloaded',
    newTab: 'New Tab Opened',
    closeTab: 'Tab Closed',
    nextTab: 'Switched to Next Tab',
    prevTab: 'Switched to Previous Tab',
    duplicateTab: 'Tab Duplicated',
    pinTab: 'Tab Pinned/Unpinned',
    muteTab: 'Tab Muted/Unmuted',
    newWindow: 'New Window Opened',
    closeWindow: 'Window Closed',
    fullscreen: 'Fullscreen Toggled',
    copyUrl: 'URL Copied to Clipboard',
    copyTitle: 'Page Title Copied',
    copySelection: 'Selection Copied',
    fillForm: 'Form Field Filled',
    playPause: 'Media Play/Pause',
    muteUnmute: 'Media Muted/Unmuted',
    volumeUp: 'Volume Increased',
    volumeDown: 'Volume Decreased',
    increaseFontSize: 'Font Size Increased',
    decreaseFontSize: 'Font Size Decreased',
    toggleDarkMode: 'Dark Mode Toggled',
    toggleReaderMode: 'Reader Mode Toggled',
    pasteAndGo: details.wasUrl ? `Navigated to ${details.text}` : `Searched for "${details.text}"`,
    closeTabsToRight: `Closed ${details.count} tabs`,
    openInIncognito: 'Opened in Incognito',
    clearCacheAndReload: 'Cache Cleared & Reloaded',
    toggleElementOutlines: details.added ? 'Element outlines shown' : 'Element outlines hidden',
    copyAllLinks: `Copied ${details.count} links`,
    custom: details.message || 'Custom code executed'
  };
  
  return actionNames[actionType] || 'Action executed';
}

function handleMessage(message) {
  if (message.action === 'showNotification') {
    const displayName = getActionDisplayName(message.actionType, message.details);
    
    if (message.actionType === 'error') {
      showNotification(message.details.message, 'error');
    } else {
      showNotification(displayName, 'success');
    }
  } else if (message.action === 'executeFunction') {
    try {
      const func = new Function('return ' + message.functionString)();
      const result = func.apply(null, message.args || []);
      chrome.runtime.sendMessage({ result: result });
    } catch (error) {
      chrome.runtime.sendMessage({ error: error.message });
    }
  }
}

chrome.runtime.onMessage.addListener(handleMessage);

function addVisualFeedback(element, type = 'success') {
  if (!element) return;
  
  const originalTransition = element.style.transition;
  const originalBoxShadow = element.style.boxShadow;
  
  const colors = {
    success: '0 0 10px rgba(76, 175, 80, 0.6)',
    error: '0 0 10px rgba(244, 67, 54, 0.6)',
    info: '0 0 10px rgba(33, 150, 243, 0.6)'
  };
  
  element.style.transition = 'box-shadow 0.3s ease';
  element.style.boxShadow = colors[type] || colors.success;
  
  setTimeout(() => {
    element.style.transition = originalTransition;
    element.style.boxShadow = originalBoxShadow;
  }, 1000);
}

function highlightClickableElements() {
  const clickableElements = document.querySelectorAll('button, a, [onclick], [role="button"], input[type="button"], input[type="submit"]');
  
  clickableElements.forEach((element, index) => {
    if (index < 10) { // Only highlight first 10 elements
      element.style.outline = `2px solid rgba(33, 150, 243, 0.5)`;
      element.style.outlineOffset = '2px';
      
      const label = document.createElement('span');
      label.textContent = (index + 1).toString();
      label.style.cssText = `
        position: absolute;
        top: -10px;
        left: -10px;
        background: #2196F3;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        z-index: 10000;
        pointer-events: none;
      `;
      
      element.style.position = 'relative';
      element.appendChild(label);
    }
  });
  
  setTimeout(() => {
    clickableElements.forEach(element => {
      element.style.outline = '';
      element.style.outlineOffset = '';
      const label = element.querySelector('span');
      if (label && label.textContent.match(/^\d+$/)) {
        label.remove();
      }
    });
  }, 3000);
}

function init() {
  connectToBackground();
  
  document.addEventListener('keydown', handleKeyEvent, true);
  document.addEventListener('keyup', handleKeyEvent, true);
  
  chrome.runtime.onMessage.addListener(handleMessage);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}