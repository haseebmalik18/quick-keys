const state = {
  enabled: true,
  shortcuts: {},
  settings: {
    startupEnabled: true,
    notifications: true
  }
};

function loadFromStorage() {
  chrome.storage.sync.get(['shortcuts', 'settings', 'enabled'], function(data) {
    if (data.shortcuts) {
      state.shortcuts = data.shortcuts;
    }
    
    if (data.settings) {
      state.settings = { ...state.settings, ...data.settings };
    }
    
    if (data.enabled !== undefined) {
      state.enabled = data.enabled;
    } else {
      state.enabled = state.settings.startupEnabled;
      chrome.storage.sync.set({ enabled: state.enabled });
    }
  });
}

function toggleExtension() {
  state.enabled = !state.enabled;
  chrome.storage.sync.set({ enabled: state.enabled });
  
  if (chrome.notifications) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Quickeys',
      message: 'Quickeys ' + (state.enabled ? 'enabled' : 'disabled')
    });
  }
}

function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'toggleExtension':
      state.enabled = message.enabled;
      chrome.storage.sync.set({ enabled: state.enabled });
      break;
      
    case 'getState':
      sendResponse({
        enabled: state.enabled,
        shortcutsCount: Object.keys(state.shortcuts).length
      });
      break;
  }
  
  return true;
}

function init() {
  loadFromStorage();
  chrome.runtime.onMessage.addListener(handleMessage);
}

init();