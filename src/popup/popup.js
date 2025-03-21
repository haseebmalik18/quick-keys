import "../popup/popup.css";

document.addEventListener("DOMContentLoaded", function () {
  const elements = {
    extensionToggle: document.getElementById("extension-toggle"),
    addShortcutBtn: document.getElementById("add-shortcut-btn"),
    openSettingsBtn: document.getElementById("open-settings-btn"),
    shortcutsList: document.getElementById("shortcuts-list"),
    currentSiteName: document.getElementById("current-site-name"),
    darkModeToggle: document.getElementById("dark-mode-toggle"),
  };

  syncChromeNativeShortcuts().then(() => {
    loadSettings();
    loadShortcuts();
    getCurrentTabInfo();
  });

  setupDarkMode();

  elements.extensionToggle.addEventListener("change", toggleExtension);
  elements.addShortcutBtn.addEventListener("click", addShortcut);
  elements.openSettingsBtn.addEventListener("click", openSettings);

  elements.shortcutsList.addEventListener("click", handleShortcutAction);

  // Add quick action button listeners
  document.querySelectorAll('.quick-action-btn').forEach(btn => {
    btn.addEventListener('click', handleQuickAction);
  });

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

  async function syncChromeNativeShortcuts() {
    return new Promise((resolve) => {
      chrome.commands.getAll((commands) => {
        chrome.storage.sync.get(["shortcuts"], (data) => {
          const shortcuts = data.shortcuts || {};
          let hasUpdates = false;

          commands.forEach((command) => {
            if (command.shortcut && commandActionMap[command.name]) {
              const shortcutKey = command.shortcut
                .toLowerCase()
                .replace(/\+/g, "+");
              const actionName = commandActionMap[command.name];

              if (
                !shortcuts[shortcutKey] ||
                shortcuts[shortcutKey].action !== actionName
              ) {
                shortcuts[shortcutKey] = {
                  action: actionName,
                  type: "global",
                  isChromeNative: true,
                };
                hasUpdates = true;
              }
            }
          });

          if (hasUpdates) {
            chrome.storage.sync.set({ shortcuts }, () => {
              chrome.runtime.sendMessage({
                action: "shortcutsChanged",
                shortcuts: shortcuts,
              });
              resolve();
            });
          } else {
            resolve();
          }
        });
      });
    });
  }

  function setupDarkMode() {
    chrome.storage.local.get(["darkMode"], (data) => {
      if (data.darkMode) {
        elements.darkModeToggle.checked = true;
        document.body.classList.add("dark-mode");
      }
    });

    elements.darkModeToggle.addEventListener("change", () => {
      const isDark = elements.darkModeToggle.checked;
      chrome.storage.local.set({ darkMode: isDark });
      document.body.classList.toggle("dark-mode", isDark);
    });
  }

  function loadSettings() {
    chrome.runtime.sendMessage({ action: "getState" }, function (response) {
      if (response) {
        elements.extensionToggle.checked = response.enabled;
      }
    });
  }

  function loadShortcuts() {
    chrome.storage.sync.get(["shortcuts"], function (data) {
      if (data.shortcuts && Object.keys(data.shortcuts).length > 0) {
        displayShortcuts(data.shortcuts);
      }
    });
  }

  function displayShortcuts(shortcuts) {
    const shortcutEntries = Object.entries(shortcuts).slice(0, 3);

    if (shortcutEntries.length === 0) {
      return;
    }

    elements.shortcutsList.innerHTML = shortcutEntries
      .map(
        ([key, shortcut]) => `
      <div class="shortcut-item" data-key="${key}">
        <div class="shortcut-details">
          <span class="shortcut-key">${key}</span>
          <span class="shortcut-action">${shortcut.action}</span>
        </div>
        <button class="shortcut-execute" title="Execute shortcut">
          <i class="fas fa-play"></i>
        </button>
      </div>
    `
      )
      .join("");
  }

  function getCurrentTabInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const tab = tabs[0];
        const url = new URL(tab.url);
        elements.currentSiteName.textContent = url.hostname;
      }
    });
  }

  function handleShortcutAction(event) {
    if (event.target.closest(".shortcut-execute")) {
      const shortcutItem = event.target.closest(".shortcut-item");
      const shortcutKey = shortcutItem.dataset.key;

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length > 0) {
          chrome.runtime.sendMessage({
            action: "executeShortcut",
            key: shortcutKey,
            tab: tabs[0],
          });
        }
      });
    }
  }

  function toggleExtension() {
    const enabled = elements.extensionToggle.checked;
    chrome.runtime.sendMessage({
      action: "toggleExtension",
      enabled: enabled,
    });
  }

  function addShortcut() {
    chrome.runtime.openOptionsPage();
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  function handleQuickAction(event) {
    const action = event.currentTarget.dataset.action;
    
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs.length > 0) {
        const tempShortcut = { action: action };
        chrome.runtime.sendMessage({
          action: "executeShortcut",
          key: `quick-${action}`,
          tab: tabs[0]
        });

        // Send directly to background for immediate execution
        chrome.runtime.sendMessage({
          action: "executeAction",
          shortcut: tempShortcut,
          tab: tabs[0]
        });
      }
    });
  }
});