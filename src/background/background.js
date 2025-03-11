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

const notifications = (() => {
  const queue = [];
  let isProcessing = false;
  
  const processQueue = () => {
    if (queue.length === 0) {
      isProcessing = false;
      return;
    }
    
    isProcessing = true;
    const { message, callback } = queue.shift();
    
    if (state.settings.notifications && chrome.notifications) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'KeyCommand',
        message: message
      }, () => {
        if (callback) callback();
        setTimeout(processQueue, 1000);
      });
    } else {
      if (callback) callback();
      setTimeout(processQueue, 50);
    }
  };
  
  return {
    show: (message, callback) => {
      queue.push({ message, callback });
      if (!isProcessing) {
        processQueue();
      }
    }
  };
})();

function getRequiredPermissionsForAction(action) {
  for (const category of Object.values(actionCategories)) {
    if (category.actions && category.actions[action]) {
      return category.actions[action].permissions || [];
    }
  }
  return [];
}

function checkPermissionsForAction(action) {
  const requiredPermissions = getRequiredPermissionsForAction(action);
  
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return Promise.resolve(true);
  }
  
  const filteredPermissions = requiredPermissions.filter(
    perm => perm !== "host" && perm !== "storage"
  );
  
  if (filteredPermissions.length === 0) {
    return Promise.resolve(true);
  }
  
  return new Promise((resolve) => {
    chrome.permissions.contains(
      { permissions: filteredPermissions },
      (result) => {
        resolve(result);
      }
    );
  });
}

function executeBasicAction(shortcut, tab) {
  const action = shortcut.action;
  
  checkPermissionsForAction(action).then((hasPermissions) => {
    if (!hasPermissions) {
      const requiredPermissions = getRequiredPermissionsForAction(action);
      const filteredPermissions = requiredPermissions.filter(
        perm => perm !== "host" && perm !== "storage"
      );
      const permissionNames = filteredPermissions.map(p => p).join(", ");
      
      if (permissionNames.length > 0) {
        notifications.show(
          `Cannot execute "${action}": Missing permissions (${permissionNames})`
        );
        return;
      }
    }
    
    executeActionImplementation(shortcut, tab);
  });
}

function executeActionImplementation(shortcut, tab) {
  try {
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
      case 'back':
        chrome.tabs.goBack(tab.id);
        break;
      case 'forward':
        chrome.tabs.goForward(tab.id);
        break;
      case 'reload':
        chrome.tabs.reload(tab.id);
        break;
      case 'duplicateTab':
        chrome.tabs.duplicate(tab.id);
        break;
      case 'newWindow':
        chrome.windows.create({});
        break;
      case 'closeWindow':
        chrome.windows.remove(tab.windowId);
        break;
      case 'fullscreen':
        chrome.windows.get(tab.windowId, (window) => {
          const newState = window.state === 'fullscreen' ? 'normal' : 'fullscreen';
          chrome.windows.update(tab.windowId, { state: newState });
        });
        break;
      case 'openBookmarks':
        chrome.tabs.create({ url: 'chrome://bookmarks/' });
        break;
      case 'openHistory':
        chrome.tabs.create({ url: 'chrome://history/' });
        break;
      case 'openDownloads':
        chrome.tabs.create({ url: 'chrome://downloads/' });
        break;
      case 'openSettings':
        chrome.tabs.create({ url: 'chrome://settings/' });
        break;
      default:
        console.log('Unknown action:', shortcut.action);
        break;
    }
  } catch (error) {
    console.error('Error executing action:', error);
    notifications.show('Error: ' + error.message);
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

const actionCategories = {
  navigation: {
    name: "Navigation",
    actions: {
      back: {
        name: "Go Back",
        description: "Navigate to the previous page in history",
        params: {},
        permissions: ["tabs"],
      },
      forward: {
        name: "Go Forward",
        description: "Navigate to the next page in history",
        params: {},
        permissions: ["tabs"],
      },
      reload: {
        name: "Reload Page",
        description: "Refresh the current page",
        params: {},
        permissions: [],
      },
      scrollTop: {
        name: "Scroll to Top",
        description: "Scroll to the top of the page",
        params: {},
        permissions: ["scripting", "host"],
      },
      scrollBottom: {
        name: "Scroll to Bottom",
        description: "Scroll to the bottom of the page",
        params: {},
        permissions: ["scripting", "host"],
      },
      openWebsite: {
        name: "Open Website",
        description: "Open a specific website",
        params: {
          url: {
            type: "text",
            label: "URL",
            placeholder: "https://example.com",
          },
        },
        permissions: ["tabs"],
      },
    },
  },
  tabs: {
    name: "Tabs",
    actions: {
      newTab: {
        name: "New Tab",
        description: "Open a new tab",
        params: {},
        permissions: [],
      },
      closeTab: {
        name: "Close Current Tab",
        description: "Close the current tab",
        params: {},
        permissions: ["tabs"],
      },
      nextTab: {
        name: "Next Tab",
        description: "Switch to the next tab",
        params: {},
        permissions: ["tabs"],
      },
      prevTab: {
        name: "Previous Tab",
        description: "Switch to the previous tab",
        params: {},
        permissions: ["tabs"],
      },
      duplicateTab: {
        name: "Duplicate Tab",
        description: "Create a duplicate of the current tab",
        params: {},
        permissions: ["tabs"],
      },
    },
  },
  windows: {
    name: "Windows",
    actions: {
      newWindow: {
        name: "New Window",
        description: "Open a new browser window",
        params: {},
        permissions: ["tabs"],
      },
      closeWindow: {
        name: "Close Window",
        description: "Close the current window",
        params: {},
        permissions: ["tabs"],
      },
      fullscreen: {
        name: "Toggle Fullscreen",
        description: "Enter or exit fullscreen mode",
        params: {},
        permissions: ["tabs"],
      },
    },
  },
  site: {
    name: "Website",
    actions: {
      clickElement: {
        name: "Click Element",
        description: "Click on an element by CSS selector",
        params: {
          selector: {
            type: "text",
            label: "CSS Selector",
            placeholder: "button.submit",
          },
        },
        permissions: ["scripting", "host"],
      },
      fillForm: {
        name: "Fill Form Field",
        description: "Fill a form field with text",
        params: {
          selector: {
            type: "text",
            label: "Field Selector",
            placeholder: "input[name='search']",
          },
          text: { type: "text", label: "Text", placeholder: "Your text here" },
        },
        permissions: ["scripting", "host"],
      },
      scrollTop: {
        name: "Scroll to Top",
        description: "Scroll to the top of the page",
        params: {},
        permissions: ["scripting", "host"],
      },
      scrollBottom: {
        name: "Scroll to Bottom",
        description: "Scroll to the bottom of the page",
        params: {},
        permissions: ["scripting", "host"],
      },
    },
  },
  clipboard: {
    name: "Clipboard",
    actions: {
      copyUrl: {
        name: "Copy Current URL",
        description: "Copy the current page URL to clipboard",
        params: {},
        permissions: ["scripting", "host"],
      },
      copyTitle: {
        name: "Copy Page Title",
        description: "Copy the current page title to clipboard",
        params: {},
        permissions: ["scripting", "host"],
      },
      copySelection: {
        name: "Copy Selected Text",
        description: "Copy currently selected text to clipboard",
        params: {},
        permissions: ["scripting", "host"],
      },
    },
  },
  media: {
    name: "Media",
    actions: {
      playPause: {
        name: "Play/Pause Media",
        description: "Toggle play/pause state of media on page",
        params: {},
        permissions: ["scripting", "host"],
      },
      muteUnmute: {
        name: "Mute/Unmute Media",
        description: "Toggle mute state of media on page",
        params: {},
        permissions: ["scripting", "host"],
      },
      volumeUp: {
        name: "Volume Up",
        description: "Increase volume of media on page",
        params: {},
        permissions: ["scripting", "host"],
      },
      volumeDown: {
        name: "Volume Down",
        description: "Decrease volume of media on page",
        params: {},
        permissions: ["scripting", "host"],
      },
      skipForward: {
        name: "Skip Forward",
        description: "Skip forward in media playback",
        params: {},
        permissions: ["scripting", "host"],
      },
      skipBackward: {
        name: "Skip Backward",
        description: "Skip backward in media playback",
        params: {},
        permissions: ["scripting", "host"],
      },
    },
  },
  accessibility: {
    name: "Accessibility",
    actions: {
      increaseFontSize: {
        name: "Increase Font Size",
        description: "Make text larger on the page",
        params: {},
        permissions: ["scripting", "host"],
      },
      decreaseFontSize: {
        name: "Decrease Font Size",
        description: "Make text smaller on the page",
        params: {},
        permissions: ["scripting", "host"],
      },
      toggleDarkMode: {
        name: "Toggle Dark Mode",
        description: "Switch between light and dark page styles",
        params: {},
        permissions: ["scripting", "host"],
      },
      toggleReaderMode: {
        name: "Toggle Reader Mode",
        description: "Enable or disable reader view",
        params: {},
        permissions: ["scripting", "host"],
      },
      speakSelection: {
        name: "Speak Selected Text",
        description: "Use text-to-speech on selected text",
        params: {},
        permissions: ["scripting", "host"],
      },
      stopSpeaking: {
        name: "Stop Speaking",
        description: "Stop text-to-speech",
        params: {},
        permissions: ["scripting", "host"],
      },
    },
  },
  chrome: {
    name: "Chrome Pages",
    actions: {
      openBookmarks: {
        name: "Open Bookmarks",
        description: "Open Chrome's bookmarks page",
        params: {},
        permissions: [],
      },
      openHistory: {
        name: "Open History",
        description: "Open Chrome's history page",
        params: {},
        permissions: [],
      },
      openDownloads: {
        name: "Open Downloads",
        description: "Open Chrome's downloads page",
        params: {},
        permissions: [],
      },
      openSettings: {
        name: "Open Settings",
        description: "Open Chrome's settings page",
        params: {},
        permissions: [],
      },
    },
  },
  advanced: {
    name: "Advanced",
    actions: {
      custom: {
        name: "Custom JavaScript",
        description: "Run custom JavaScript code",
        params: {
          code: {
            type: "textarea",
            label: "JavaScript Code",
            placeholder: "// Your code here",
          },
        },
        permissions: ["scripting", "host"],
      },
    },
  },
};

const commandActionMap = {
  'back': 'back',
  'forward': 'forward',
  'new-tab': 'newTab',
  'close-tab': 'closeTab',
  'next-tab': 'nextTab',
  'prev-tab': 'prevTab'
};

function handleChromeCommand(command) {
  if (!state.enabled) return;
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (!tabs || tabs.length === 0) return;
    
    const tab = tabs[0];
    const actionName = commandActionMap[command];
    
    if (actionName) {
      const tempShortcut = {
        action: actionName,
        isChromeNative: true
      };
      executeBasicAction(tempShortcut, tab);
    }
  });
}

function init() {
  loadFromStorage();
  chrome.runtime.onMessage.addListener(handleMessage);
  
  if (chrome.commands && chrome.commands.onCommand) {
    chrome.commands.onCommand.addListener(handleChromeCommand);
  }
  
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