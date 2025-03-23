const state = {
  enabled: true,
  shortcuts: {},
  settings: {
    startupEnabled: true,
    notifications: true,
    conflictMode: "site-first",
    shortcutDelay: 0,
  },
  keyState: {
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
    lastKey: null,
    lastKeyTime: 0,
  },
  patternCache: {},
};

const commandActionMap = {
  back: "back",
  forward: "forward",
  "new-tab": "newTab",
  "close-tab": "closeTab",
  "next-tab": "nextTab",
  "prev-tab": "prevTab",
  "duplicate-tab": "duplicateTab",
  "pin-tab": "pinTab",
  "mute-tab": "muteTab",
  "new-window": "newWindow",
  "close-window": "closeWindow",
  fullscreen: "fullscreen",
  "open-bookmarks": "openBookmarks",
  "open-history": "openHistory",
  "open-downloads": "openDownloads",
  "open-settings": "openSettings",
  "clear-cache-reload": "clearCacheAndReload",
  "open-incognito": "openInIncognito",
  "open-website-1": "openWebsite1",
  "open-website-2": "openWebsite2",
  "open-website-3": "openWebsite3",
  "open-website-4": "openWebsite4",
};

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
      clearCacheAndReload: {
        name: "Clear Cache & Reload",
        description: "Clear browser cache and reload the page",
        params: {},
        permissions: ["browsingData"],
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
      scrollDown: {
        name: "Scroll Down",
        description: "Scroll down one page",
        params: {},
        permissions: ["scripting", "host"],
      },
      scrollUp: {
        name: "Scroll Up",
        description: "Scroll up one page",
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
      navigatePath: {
        name: "Navigate to Path",
        description: "Navigate to a specific path on current site",
        params: {
          path: { type: "text", label: "Path", placeholder: "/settings" },
        },
        permissions: ["scripting", "host"],
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
      closeTabsToRight: {
        name: "Close All Tabs to the Right",
        description: "Close all tabs to the right of current tab",
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
      firstTab: {
        name: "First Tab",
        description: "Switch to the first tab",
        params: {},
        permissions: ["tabs"],
      },
      lastTab: {
        name: "Last Tab",
        description: "Switch to the last tab",
        params: {},
        permissions: ["tabs"],
      },
      duplicateTab: {
        name: "Duplicate Tab",
        description: "Create a duplicate of the current tab",
        params: {},
        permissions: ["tabs"],
      },
      pinTab: {
        name: "Pin/Unpin Tab",
        description: "Toggle pin state of current tab",
        params: {},
        permissions: ["tabs"],
      },
      muteTab: {
        name: "Mute/Unmute Tab",
        description: "Toggle mute state of current tab",
        params: {},
        permissions: ["tabs"],
      },
      openInIncognito: {
        name: "Open in Incognito",
        description: "Open current page in incognito window",
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
      minimizeWindow: {
        name: "Minimize Window",
        description: "Minimize the current window",
        params: {},
        permissions: ["tabs"],
      },
      maximizeWindow: {
        name: "Maximize Window",
        description: "Maximize the current window",
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
      submitForm: {
        name: "Submit Form",
        description: "Submit a form",
        params: {
          selector: {
            type: "text",
            label: "Form Selector",
            placeholder: "form#search",
          },
        },
        permissions: ["scripting", "host"],
      },
      focusElement: {
        name: "Focus Element",
        description: "Set focus to an element",
        params: {
          selector: {
            type: "text",
            label: "Element Selector",
            placeholder: "input#search",
          },
        },
        permissions: ["scripting", "host"],
      },
      toggleElement: {
        name: "Toggle Element Visibility",
        description: "Show/hide an element",
        params: {
          selector: {
            type: "text",
            label: "Element Selector",
            placeholder: "div.sidebar",
          },
        },
        permissions: ["scripting", "host"],
      },
      toggleElementOutlines: {
        name: "Toggle Element Outlines",
        description: "Show or hide outlines around page elements",
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
      copyAllLinks: {
        name: "Copy All Links on Page",
        description: "Copy all links from the current page to clipboard",
        params: {},
        permissions: ["scripting", "host"],
      },
      pasteAndGo: {
        name: "Paste and Navigate",
        description: "Paste clipboard content and navigate to it as URL",
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
      openExtensions: {
        name: "Open Extensions",
        description: "Open Chrome's extensions page",
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

function loadFromStorage() {
  chrome.storage.sync.get(
    ["shortcuts", "settings", "enabled"],
    function (data) {
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
    }
  );
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
  
  if (!shortcut) return;

  if (shortcut.type === 'site' && shortcut.sitePattern) {
    if (!tab || !tab.url) return;

    let regex = state.patternCache[shortcut.sitePattern];
    if (!regex) {
      const pattern = shortcut.sitePattern.replace(/\*/g, '.*');
      regex = new RegExp('^' + pattern + '$');
      state.patternCache[shortcut.sitePattern] = regex;
    }

    if (!regex.test(tab.url)) {
      if (state.settings.conflictMode === 'global-first') {
        const globalShortcut = Object.entries(state.shortcuts).find(
          ([key, config]) => key === shortcutKey && config.type === 'global'
        );

        if (globalShortcut) {
          triggerShortcut(shortcutKey, tab);
        }
      }
      return;
    }
  }

  triggerShortcut(shortcutKey, tab);
}

function triggerShortcut(shortcutKey, tab) {
  if (state.settings.shortcutDelay > 0) {
    setTimeout(() => {
      executeShortcut(shortcutKey, tab);
    }, state.settings.shortcutDelay);
  } else {
    executeShortcut(shortcutKey, tab);
  }
}

function executeShortcut(key, tab) {
  if (!state.enabled) return;

  const shortcut = state.shortcuts[key];
  if (!shortcut) return;

  if (shortcut.isChromeNative) {
    return;
  }

  executeAction(shortcut, tab);
}

function executeAction(shortcut, tab) {
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
          `Cannot execute "${action}": Missing permissions (${permissionNames}). Redirecting to permissions page...`
        );

        chrome.storage.local.set({
          permissionRedirect: {
            action: action,
            missingPermissions: permissionNames,
            time: Date.now()
          }
        }, function() {
          chrome.runtime.openOptionsPage();
        });

        return;
      }
    }

    executeActionImplementation(shortcut, tab);
  });
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

function executeScriptInTab(tab, func, args = []) {
  if (!tab || !tab.id) return Promise.reject(new Error('Invalid tab'));
  
  if (chrome.scripting) {
    return chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: func,
      args: args
    }).catch((err) => {
      if (err.message.includes('permission')) {
        notifications.show('Permission error: Required permissions not granted');
      } else {
        notifications.show('Error: ' + err.message);
      }
      return Promise.reject(err);
    });
  } else {
    return new Promise((resolve, reject) => {
      try {
        chrome.tabs.sendMessage(tab.id, {
          action: 'executeFunction',
          functionString: func.toString(),
          args: args
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
            return;
          }
          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

function executeActionImplementation(shortcut, tab) {
  try {
    console.log('executeActionImplementation called with:', {
      action: shortcut.action,
      tab: tab?.id
    });

    switch (shortcut.action) {
      case 'back':
        chrome.tabs.goBack(tab.id);
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNotification',
          actionType: 'back'
        });
        break;

      case 'forward':
        chrome.tabs.goForward(tab.id);
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNotification',
          actionType: 'forward'
        });
        break;

      case 'reload':
        chrome.tabs.reload(tab.id);
        break;

      case 'scrollTop':
        executeScriptInTab(tab, () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        break;

      case 'scrollBottom':
        executeScriptInTab(tab, () => {
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
          });
        });
        break;

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

      case 'duplicateTab':
        chrome.tabs.duplicate(tab.id);
        break;

      case 'firstTab':
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, { active: true });
          }
        });
        break;

      case 'lastTab':
        chrome.tabs.query({ currentWindow: true }, (tabs) => {
          if (tabs && tabs.length > 0) {
            chrome.tabs.update(tabs[tabs.length - 1].id, { active: true });
          }
        });
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

      case 'clickElement':
        if (shortcut.params && shortcut.params.selector) {
          executeScriptInTab(tab, (selector) => {
            const element = document.querySelector(selector);
            if (element) element.click();
          }, [shortcut.params.selector]);
        }
        break;

      case 'fillForm':
        if (shortcut.params && shortcut.params.selector && shortcut.params.text) {
          executeScriptInTab(tab, (selector, text) => {
            const element = document.querySelector(selector);
            if (element) {
              element.value = text;
              const event = new Event('input', { bubbles: true });
              element.dispatchEvent(event);
            }
          }, [shortcut.params.selector, shortcut.params.text])
          .then(() => {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'fillForm'
            });
          }).catch(() => {});
        }
        break;

      case 'copyUrl':
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs && tabs.length > 0) {
            const tab = tabs[0];
            
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              function: () => {
                return new Promise((resolve) => {
                  if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(window.location.href)
                      .then(() => resolve({ success: true, method: 'clipboard-api' }))
                      .catch((error) => {
                        try {
                          const textArea = document.createElement('textarea');
                          textArea.value = window.location.href;
                          textArea.style.position = 'fixed';
                          document.body.appendChild(textArea);
                          textArea.focus();
                          textArea.select();
                          
                          const successful = document.execCommand('copy');
                          document.body.removeChild(textArea);
                          
                          if (successful) {
                            resolve({ success: true, method: 'execCommand' });
                          } else {
                            resolve({ success: false, error: 'execCommand failed', method: 'execCommand' });
                          }
                        } catch (e) {
                          resolve({ success: false, error: e.toString() });
                        }
                      });
                  } else {
                    try {
                      const textArea = document.createElement('textarea');
                      textArea.value = window.location.href;
                      textArea.style.position = 'fixed';
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      
                      const successful = document.execCommand('copy');
                      document.body.removeChild(textArea);
                      
                      if (successful) {
                        resolve({ success: true, method: 'execCommand' });
                      } else {
                        resolve({ success: false, error: 'execCommand failed', method: 'execCommand' });
                      }
                    } catch (e) {
                      resolve({ success: false, error: e.toString() });
                    }
                  }
                });
              }
            }).then((results) => {
              if (results && results[0] && results[0].result && results[0].result.success) {
                chrome.tabs.sendMessage(tab.id, {
                  action: 'showNotification',
                  actionType: 'copyUrl'
                });
              } else if (results && results[0] && results[0].result) {
                console.error('Copy failed:', results[0].result.error);
                chrome.tabs.sendMessage(tab.id, {
                  action: 'showNotification',
                  actionType: 'error',
                  details: { message: 'Failed to copy URL: ' + results[0].result.error }
                });
              }
            }).catch((err) => {
              console.error('Script execution error:', err);
            });
          }
        });
        break;

      case 'copyTitle':
        executeScriptInTab(tab, () => {
          try {
            navigator.clipboard.writeText(document.title);
            return { success: true };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }).then((result) => {
          if (result && result[0] && result[0].result && result[0].result.success) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'copyTitle'
            });
          }
        }).catch(() => {});
        break;

      case 'copySelection':
        executeScriptInTab(tab, () => {
          try {
            const selection = window.getSelection().toString();
            if (selection) {
              navigator.clipboard.writeText(selection);
              return { success: true };
            }
            return { success: false, reason: 'No text selected' };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }).then((result) => {
          if (result && result[0] && result[0].result && result[0].result.success) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'copySelection'
            });
          }
        }).catch(() => {});
        break;

      case 'playPause':
        executeScriptInTab(tab, () => {
          const media = document.querySelector('video, audio');
          if (media) {
            const wasPlaying = !media.paused;
            if (media.paused) media.play();
            else media.pause();
            return { playing: !wasPlaying };
          }
          return { playing: false, noMedia: true };
        }).then((result) => {
          if (result && result[0] && result[0].result) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'playPause',
              details: result[0].result
            });
          }
        }).catch(() => {});
        break;

      case 'muteUnmute':
        executeScriptInTab(tab, () => {
          const media = document.querySelector('video, audio');
          if (media) {
            media.muted = !media.muted;
            return { muted: media.muted };
          }
          return { muted: false, noMedia: true };
        }).then((result) => {
          if (result && result[0] && result[0].result) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'muteUnmute',
              details: result[0].result
            });
          }
        }).catch(() => {});
        break;

      case 'volumeUp':
        executeScriptInTab(tab, () => {
          const media = document.querySelector('video, audio');
          if (media && media.volume < 1) {
            const oldVolume = media.volume;
            media.volume = Math.min(1, media.volume + 0.1);
            return { success: true, oldVolume, newVolume: media.volume };
          }
          return { success: false };
        }).then((result) => {
          if (result && result[0] && result[0].result && result[0].result.success) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'volumeUp'
            });
          }
        }).catch(() => {});
        break;

      case 'volumeDown':
        executeScriptInTab(tab, () => {
          const media = document.querySelector('video, audio');
          if (media && media.volume > 0) {
            const oldVolume = media.volume;
            media.volume = Math.max(0, media.volume - 0.1);
            return { success: true, oldVolume, newVolume: media.volume };
          }
          return { success: false };
        }).then((result) => {
          if (result && result[0] && result[0].result && result[0].result.success) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'volumeDown'
            });
          }
        }).catch(() => {});
        break;

      case 'increaseFontSize':
        executeScriptInTab(tab, () => {
          try {
            const html = document.documentElement;
            const currentSize = parseFloat(window.getComputedStyle(html).fontSize);
            html.style.fontSize = (currentSize * 1.1) + 'px';
            return { success: true, oldSize: currentSize, newSize: currentSize * 1.1 };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }).then((result) => {
          if (result && result[0] && result[0].result && result[0].result.success) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'increaseFontSize'
            });
          }
        }).catch(() => {});
        break;

      case 'decreaseFontSize':
        executeScriptInTab(tab, () => {
          try {
            const html = document.documentElement;
            const currentSize = parseFloat(window.getComputedStyle(html).fontSize);
            html.style.fontSize = (currentSize * 0.9) + 'px';
            return { success: true, oldSize: currentSize, newSize: currentSize * 0.9 };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }).then((result) => {
          if (result && result[0] && result[0].result && result[0].result.success) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'decreaseFontSize'
            });
          }
        }).catch(() => {});
        break;

      case 'toggleDarkMode':
        executeScriptInTab(tab, () => {
          try {
            if (!document.querySelector('#keycommand-darkmode-style')) {
              const style = document.createElement('style');
              style.id = 'keycommand-darkmode-style';
              style.textContent = `
                html { filter: invert(100%) hue-rotate(180deg); }
                img, video { filter: invert(100%) hue-rotate(180deg); }
              `;
              document.head.appendChild(style);
              return { enabled: true };
            } else {
              const style = document.querySelector('#keycommand-darkmode-style');
              if (style && style.parentNode) {
                style.parentNode.removeChild(style);
              }
              return { enabled: false };
            }
          } catch (e) {
            return { error: e.message };
          }
        }).then((result) => {
          if (result && result[0] && result[0].result) {
            chrome.tabs.sendMessage(tab.id, {
              action: 'showNotification',
              actionType: 'toggleDarkMode',
              details: result[0].result
            });
          }
        }).catch(() => {});
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

      case 'custom':
        if (shortcut.params && shortcut.params.code) {
          executeCustomCode(tab, shortcut.params.code)
            .then(() => {})
            .catch(() => {});
        } else {
          notifications.show('Error: No custom code defined for this shortcut');
        }
        break;

      default:
        console.log('Unknown action:', shortcut.action);
        break;
    }
  } catch (error) {
    console.error('Error in executeActionImplementation:', error);
    notifications.show('Error: ' + error.message);
  }
}

function executeCustomCode(tab, code) {
  if (!tab || !tab.id) {
    notifications.show('Error: Invalid tab');
    return Promise.reject(new Error('Invalid tab'));
  }
  
  if (!code || typeof code !== 'string' || code.trim() === '') {
    notifications.show('Error: No code provided');
    return Promise.reject(new Error('Invalid code'));
  }
  
  return chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: function(codeString) {
      try {
        let result;
        
        try {
          result = eval(codeString);
        } catch (evalError) {
          try {
            const func = new Function(codeString);
            result = func();
          } catch (funcError) {
            const asyncFunc = new Function(`return (async function() { ${codeString} })();`);
            result = asyncFunc();
          }
        }
        
        return {
          success: true,
          result: result,
          timestamp: new Date().toISOString(),
          url: window.location.href
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString(),
          url: window.location.href
        };
      }
    },
    args: [code.trim()],
    world: 'MAIN'
  }).then((results) => {
    if (results && results.length > 0) {
      const result = results[0].result;
      
      if (result && result.success) {
        notifications.show('Custom code executed successfully');
        
        chrome.tabs.sendMessage(tab.id, {
          action: 'showNotification',
          actionType: 'custom',
          details: { message: 'Custom code executed successfully' }
        }).catch(() => {});
        
        return results;
      } else if (result) {
        notifications.show(`Custom code failed: ${result.error}`);
        return Promise.reject(new Error(result.error));
      }
    }
    
    notifications.show('Custom code execution failed: No results returned');
    return Promise.reject(new Error('No results returned'));
  }).catch((err) => {
    if (
      err.message.includes("Cannot access") ||
      err.message.includes("scripting")
    ) {
      return chrome.scripting
        .executeScript({
          target: { tabId: tab.id },
          func: function (codeString) {
            try {
              const result = eval(codeString);
              return {
                success: true,
                result: result,
                method: "isolated-world",
                timestamp: new Date().toISOString(),
              };
            } catch (error) {
              return {
                success: false,
                error: error.message,
                method: "isolated-world",
                timestamp: new Date().toISOString(),
              };
            }
          },
          args: [code.trim()],
          world: "ISOLATED",
        })
        .then((isolatedResults) => {
          if (
            isolatedResults &&
            isolatedResults[0] &&
            isolatedResults[0].result.success
          ) {
            notifications.show("Custom code executed (limited access)");
            return isolatedResults;
          } else {
            throw new Error(
              isolatedResults[0]?.result?.error || "Execution failed"
            );
          }
        });
    }

    let errorMessage = "Failed to execute custom code";
    if (err.message.includes("Cannot access")) {
      errorMessage = "Cannot execute code on this page (restricted)";
    } else if (err.message.includes("permission")) {
      errorMessage = "Missing permissions to execute code";
    } else if (err.message) {
      errorMessage = `Execution error: ${err.message}`;
    }

    notifications.show(errorMessage);
    return Promise.reject(err);
  });
}

function handleMessage(message, sender, sendResponse) {
  switch (message.action) {
    case 'toggleExtension':
      state.enabled = message.enabled;
      chrome.storage.sync.set({ enabled: state.enabled });
      notifications.show('KeyCommand ' + (state.enabled ? 'enabled' : 'disabled'));
      break;
      
    case 'shortcutsChanged':
      state.shortcuts = message.shortcuts;
      state.patternCache = {};
      break;
      
    case 'settingsChanged':
      state.settings = message.settings;
      break;

    case 'executeShortcut':
      executeShortcut(message.key, message.tab);
      break;

    case 'executeAction':
      executeAction(message.shortcut, message.tab);
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
      firstTab: {
        name: "First Tab",
        description: "Switch to the first tab",
        params: {},
        permissions: ["tabs"],
      },
      lastTab: {
        name: "Last Tab",
        description: "Switch to the last tab",
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