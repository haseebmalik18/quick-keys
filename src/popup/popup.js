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

  const ignoredCommands = ["_execute_action", "toggle-extension"];

  /**
   * Sets up dark mode toggle functionality
   */
  function setupDarkMode() {
    if (!elements.darkModeToggle) return;

    chrome.storage.sync.get("darkMode", function (data) {
      const isDarkMode = data.darkMode || false;
      document.body.classList.toggle("dark-mode", isDarkMode);
      elements.darkModeToggle.checked = isDarkMode;
    });

    elements.darkModeToggle.addEventListener("change", function () {
      const isDarkMode = this.checked;
      document.body.classList.toggle("dark-mode", isDarkMode);
      chrome.storage.sync.set({ darkMode: isDarkMode });
    });

    chrome.storage.onChanged.addListener(function (changes) {
      if (changes.darkMode) {
        const isDarkMode = changes.darkMode.newValue;
        document.body.classList.toggle("dark-mode", isDarkMode);
        elements.darkModeToggle.checked = isDarkMode;
      }
    });
  }

  /**
   * Loads extension settings from Chrome storage
   */
  function loadSettings() {
    chrome.storage.sync.get("settings", function (data) {
      if (data.settings) {
        elements.extensionToggle.checked = data.settings.enabled;
      } else {
        chrome.storage.sync.get("enabled", function (legacyData) {
          elements.extensionToggle.checked = legacyData.enabled !== false;
        });
      }
    });
  }

  /**
   * Loads and displays user shortcuts in the popup
   */
  function loadShortcuts() {
    chrome.storage.sync.get("shortcuts", function (data) {
      const shortcuts = data.shortcuts || {};
      elements.shortcutsList.innerHTML = "";

      if (Object.keys(shortcuts).length === 0) {
        elements.shortcutsList.innerHTML = '<div class="empty-state">...</div>';
      } else {
        const fragment = document.createDocumentFragment();
        Object.entries(shortcuts).forEach(([key, config]) => {
          const shortcutItem = createShortcutElement(key, config);
          fragment.appendChild(shortcutItem);
        });
        elements.shortcutsList.appendChild(fragment);
      }
    });
  }

  /**
   * Handles shortcut action button clicks
   * @param {Event} event - Click event
   */
  function handleShortcutAction(event) {
    if (event.target.tagName !== "I") return;

    event.stopPropagation();
    const action = event.target.className;
    const key = event.target.dataset.key;

    if (action.includes("fa-edit")) {
      editShortcut(key);
    } else if (action.includes("fa-trash")) {
      event.preventDefault();
      deleteShortcut(key);
    } else if (action.includes("fa-cog")) {
      openChromeShortcuts(event.target.dataset.action);
    }
  }

  /**
   * Creates DOM element for shortcut display
   * @param {string} key - Keyboard shortcut combination
   * @param {Object} config - Shortcut configuration
   * @returns {HTMLElement} Shortcut display element
   */
  function createShortcutElement(key, config) {
    const shortcutItem = document.createElement("div");
    shortcutItem.className = "shortcut-item";

    const shortcutInfo = document.createElement("div");
    shortcutInfo.className = "shortcut-info";

    const shortcutKeys = document.createElement("div");
    shortcutKeys.className = "shortcut-keys";
    shortcutKeys.textContent = formatKeyCombo(key);

    if (config.isChromeNative) {
      const chromeBadge = document.createElement("span");
      chromeBadge.className = "chrome-badge";
      chromeBadge.innerHTML = '<i class="fab fa-chrome"></i>';
      chromeBadge.title = "Chrome native shortcut";
      shortcutKeys.appendChild(chromeBadge);
    }

    const shortcutAction = document.createElement("div");
    shortcutAction.className = "shortcut-action";
    shortcutAction.textContent = formatAction(config.action, config.params);

    shortcutInfo.appendChild(shortcutKeys);
    shortcutInfo.appendChild(shortcutAction);

    const shortcutControls = document.createElement("div");
    shortcutControls.className = "shortcut-controls";

    if (config.isChromeNative) {
      const configureIcon = document.createElement("i");
      configureIcon.className = "fas fa-cog";
      configureIcon.title = "Configure in Chrome";
      configureIcon.dataset.action = config.action;
      shortcutControls.appendChild(configureIcon);
    } else {
      const editIcon = document.createElement("i");
      editIcon.className = "fas fa-edit";
      editIcon.title = "Edit shortcut";
      editIcon.dataset.key = key;

      const deleteIcon = document.createElement("i");
      deleteIcon.className = "fas fa-trash";
      deleteIcon.title = "Delete shortcut";
      deleteIcon.dataset.key = key;

      shortcutControls.appendChild(editIcon);
      shortcutControls.appendChild(deleteIcon);
    }

    shortcutItem.appendChild(shortcutInfo);
    shortcutItem.appendChild(shortcutControls);

    return shortcutItem;
  }

  /**
   * Formats keyboard combination for display
   * @param {string} key - Raw key combination
   * @returns {string} Formatted key display
   */
  function formatKeyCombo(key) {
    if (key.startsWith("meta") && key.length > 4 && !key.includes("+")) {
      const letter = key.substring(4);
      return `Command + ${letter.toUpperCase()}`;
    }

    return key
      .split("+")
      .map((k) => {
        const lowerK = k.toLowerCase();
        if (lowerK === "ctrl") return "Ctrl";
        if (lowerK === "alt") return "Alt";
        if (lowerK === "shift") return "Shift";
        if (lowerK === "meta" || lowerK === "command" || lowerK === "⌘")
          return "Command";
        if (k.length === 1) return k.toUpperCase();
        return k.charAt(0).toUpperCase() + k.slice(1);
      })
      .join(" + ");
  }

  function formatAction(action, params) {
    try {
      switch (action) {
        case "openSite":
          return `Open ${new URL(params.url).hostname}`;
        case "newTab":
          return "Open new tab";
        case "navigate":
          return `Go to ${params.url}`;
        default:
          return (
            action.charAt(0).toUpperCase() +
            action.slice(1).replace(/([A-Z])/g, " $1")
          );
      }
    } catch (e) {
      return (
        action.charAt(0).toUpperCase() +
        action.slice(1).replace(/([A-Z])/g, " $1")
      );
    }
  }

  /**
   * Toggles extension enabled state
   */
  function toggleExtension() {
    const enabled = elements.extensionToggle.checked;

    chrome.storage.sync.get("settings", function (data) {
      const settings = data.settings || {
        enabled: true,
        startupEnabled: true,
        notifications: true,
        conflictMode: "site-first",
        shortcutDelay: 0,
      };

      settings.enabled = enabled;

      chrome.storage.sync.set({ settings }, function () {
        chrome.runtime.sendMessage({ action: "toggleExtension", enabled });
      });
    });
  }

  chrome.storage.onChanged.addListener(function (changes) {
    if (changes.settings && changes.settings.newValue) {
      const enabled = changes.settings.newValue.enabled;
      if (elements.extensionToggle) {
        elements.extensionToggle.checked = enabled;
      }
    }
  });

  function addShortcut() {
    chrome.runtime.openOptionsPage(function () {
      chrome.runtime.sendMessage({ action: "initShortcutCreation" });
    });
  }

  function editShortcut(key) {
    chrome.runtime.openOptionsPage(function () {
      chrome.runtime.sendMessage({ action: "editShortcut", key });
    });
  }

  function openChromeShortcuts(action) {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" }, () => {
      chrome.storage.local.set({
        lastCommandRedirect: {
          action: action,
          time: Date.now(),
        },
      });
    });
  }

  function deleteShortcut(key) {
    if (
      confirm(
        `Are you sure you want to delete the shortcut "${formatKeyCombo(key)}"?`
      )
    ) {
      chrome.storage.sync.get("shortcuts", function (data) {
        const shortcuts = data.shortcuts || {};

        if (shortcuts[key]) {
          delete shortcuts[key];

          chrome.storage.sync.set({ shortcuts }, function () {
            loadShortcuts();
            chrome.runtime.sendMessage({
              action: "shortcutsChanged",
              shortcuts: shortcuts,
            });
          });
        }
      });
    }
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }

  /**
   * Gets current tab information for site-specific shortcuts
   */
  function getCurrentTabInfo() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (!tabs || !tabs[0]) return;

      try {
        const url = new URL(tabs[0].url);
        const hostname = url.hostname;

        chrome.storage.sync.get("shortcuts", function (data) {
          const shortcuts = data.shortcuts || {};
          const siteSpecificShortcuts = Object.values(shortcuts).filter(
            (shortcut) =>
              shortcut.sitePattern && hostname.match(shortcut.sitePattern)
          );

          elements.currentSiteName.textContent =
            siteSpecificShortcuts.length > 0
              ? `${siteSpecificShortcuts.length} shortcuts for ${hostname}`
              : hostname;
        });
      } catch (e) {
        elements.currentSiteName.textContent = "Current site";
      }
    });
  }

  /**
   * Syncs Chrome native shortcuts with extension shortcuts
   * @returns {Promise} Sync completion promise
   */
  async function syncChromeNativeShortcuts() {
    try {
      const data = await new Promise((resolve) =>
        chrome.storage.sync.get("shortcuts", resolve)
      );
      const existingShortcuts = data.shortcuts || {};

      const commands = await new Promise((resolve) =>
        chrome.commands.getAll(resolve)
      );

      let shortcutsChanged = false;
      let addedCount = 0;
      let updatedCount = 0;
      let removedCount = 0;

      const existingChromeShortcuts = Object.entries(existingShortcuts)
        .filter(([_, config]) => config.isChromeNative)
        .map(([key, config]) => ({ key, action: config.action }));

      const activeCommandMap = {};
      commands.forEach((command) => {
        if (ignoredCommands.includes(command.name)) return;

        const actionName = getChromeCommandAction(command.name);
        if (!actionName) return;

        if (command.shortcut) {
          activeCommandMap[actionName] = command.shortcut;
        }
      });

      for (const { key, action } of existingChromeShortcuts) {
        if (!activeCommandMap[action]) {
          delete existingShortcuts[key];
          shortcutsChanged = true;
          removedCount++;
        }
      }

      commands.forEach((command) => {
        if (!command.shortcut || ignoredCommands.includes(command.name)) return;

        const actionName = getChromeCommandAction(command.name);
        if (!actionName) return;

        const shortcutKey = formatChromeShortcut(command.shortcut);

        const existingShortcut = Object.entries(existingShortcuts).find(
          ([_, config]) => config.action === actionName && config.isChromeNative
        );

        if (!existingShortcut || existingShortcut[0] !== shortcutKey) {
          const actionNameDisplay = actionName
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase());

          existingShortcuts[shortcutKey] = {
            type: "global",
            action: actionName,
            description: actionNameDisplay,
            isChromeNative: true,
            isSetup: true,
            params: {},
          };

          if (!existingShortcut) {
            addedCount++;
          } else {
            updatedCount++;
          }

          shortcutsChanged = true;
        }
      });

      if (shortcutsChanged) {
        await new Promise((resolve) =>
          chrome.storage.sync.set({ shortcuts: existingShortcuts }, resolve)
        );

        chrome.runtime.sendMessage({
          action: "shortcutsChanged",
          shortcuts: existingShortcuts,
        });
      }

      return { addedCount, updatedCount, removedCount };
    } catch (error) {
      console.error("Error syncing Chrome shortcuts:", error);
      return { error };
    }
  }

  function getChromeCommandAction(commandName) {
    return commandActionMap[commandName] || null;
  }

  function formatChromeShortcut(chromeShortcut) {
    let normalizedShortcut = chromeShortcut
      .replace(/⌘/g, "meta")
      .replace(/Command\+/gi, "meta+")
      .toLowerCase();

    if (
      normalizedShortcut.startsWith("meta") &&
      !normalizedShortcut.includes("+")
    ) {
      normalizedShortcut = "meta+" + normalizedShortcut.substring(4);
    }

    return normalizedShortcut;
  }
});