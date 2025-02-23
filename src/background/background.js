const state = {
  enabled: true,
  shortcuts: {},
  settings: {
    startupEnabled: true,
    notifications: true,
    conflictMode: "site-first",
    shortcutDelay: 0
  },
  keyState: {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    lastKey: null,
    lastKeyTime: 0
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

function processKeyEvent(event, tab) {
  if (!state.enabled) return;
  
  const key = event.key.toLowerCase();
  
  if (event.type === 'keydown') {
    if (key === 'control') state.keyState.ctrl = true;
    else if (key === 'alt') state.keyState.alt = true;
    else if (key === 'shift') state.keyState.shift = true;
    else if (key === 'meta') state.keyState.meta = true;
    else {
      state.keyState.lastKey = key;
      state.keyState.lastKeyTime = Date.now();
      checkForShortcut(tab);
    }
  } else if (event.type === 'keyup') {
    if (key === 'control') state.keyState.ctrl = false;
    else if (key === 'alt') state.keyState.alt = false;
    else if (key === 'shift') state.keyState.shift = false;
    else if (key === 'meta') state.keyState.meta = false;
  }
}

function checkForShortcut(tab) {
  if (!state.keyState.lastKey) return;
  
  const shortcutParts = [];
  if (state.keyState.ctrl) shortcutParts.push('ctrl');
  if (state.keyState.alt) shortcutParts.push('alt');
  if (state.keyState.shift) shortcutParts.push('shift');
  if (state.keyState.meta) shortcutParts.push('meta');
  shortcutParts.push(state.keyState.lastKey);
  
  const shortcutKey = shortcutParts.join('+');
  const shortcut = state.shortcuts[shortcutKey];
  
  if (shortcut) {
    executeBasicAction(shortcut, tab);
  }
}

function executeBasicAction(shortcut, tab) {
  switch (shortcut.action) {
    case 'newTab':
      chrome.tabs.create({});
      break;
    case 'closeTab':
      chrome.tabs.remove(tab.id);
      break;
    case 'nextTab':
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const currentIndex = tabs.findIndex(t => t.id === tab.id);
        const nextIndex = (currentIndex + 1) % tabs.length;
        chrome.tabs.update(tabs[nextIndex].id, { active: true });
      });
      break;
    case 'prevTab':
      chrome.tabs.query({ currentWindow: true }, (tabs) => {
        const currentIndex = tabs.findIndex(t => t.id === tab.id);
        const prevIndex = currentIndex === 0 ? tabs.length - 1 : currentIndex - 1;
        chrome.tabs.update(tabs[prevIndex].id, { active: true });
      });
      break;
  }
}

function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'toggleExtension':
      state.enabled = message.enabled;
      chrome.storage.sync.set({ enabled: state.enabled });
      break;
      
    case 'shortcutsChanged':
      state.shortcuts = message.shortcuts;
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
  
  chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === 'keyCommandPort') {
      port.onMessage.addListener(function(msg) {
        if (msg.type === 'keyEvent') {
          processKeyEvent(msg.event, msg.tab);
        }
      });
    }
  });
}

init();