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
                      event.target.contentEditable === 'true';
  
  if (isInputField) return;
  
  const keyData = {
    key: event.key.toLowerCase(),
    type: event.type,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    metaKey: event.metaKey
  };
  
  port.postMessage({
    type: 'keyEvent',
    event: keyData,
    tab: { url: window.location.href }
  });
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