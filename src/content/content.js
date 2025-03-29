import "../content/content.css";

let port = null;
let notificationElement = null;
let fontAwesomeInjected = false;
let lastUrl = window.location.href;
const pageInfo = {
  url: window.location.href,
  domain: window.location.hostname,
};

function initialize() {
  connectPort();
  injectStyles();
  setupEventListeners();
  sendPageInfo();
  observeUrlChanges();
  notifyContentScriptLoaded();
}

function connectPort() {
  if (port) return;

  try {
    if (chrome.runtime && chrome.runtime.id) {
      port = chrome.runtime.connect({ name: "keyCommandPort" });
      port.onDisconnect.addListener(() => {
        port = null;
      });
    }
  } catch (error) {
    port = null;
  }
}

function injectStyles() {
  try {
    if (document.querySelector('link[href*="content.css"]')) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("content.css");
    document.head.appendChild(link);
  } catch (error) {}
}

function ensureFontAwesome() {
  if (fontAwesomeInjected) return;
  if (document.querySelector('link[href*="font-awesome"]')) {
    fontAwesomeInjected = true;
    return;
  }

  try {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
    document.head.appendChild(link);
    fontAwesomeInjected = true;
  } catch (error) {}
}

const notifications = {
  copyTitle: {
    message: "Page title copied to clipboard",
    icon: "fas fa-heading",
  },
  copyUrl: {
    message: "URL copied to clipboard",
    icon: "fas fa-link",
  },
  copyAllLinks: {
    message: (details) => `${details.count} links copied to clipboard`,
    icon: "fas fa-copy",
  },
  clearCacheAndReload: {
    message: "Cache cleared and page reloaded",
    icon: "fas fa-sync-alt",
  },
  copySelection: {
    message: "Selected text copied",
    icon: "fas fa-copy",
  },
  fillForm: {
    message: "Form field filled",
    icon: "fas fa-keyboard",
  },
  playPause: {
    message: (details) => (details.playing ? "Media playing" : "Media paused"),
    icon: (details) => (details.playing ? "fas fa-play" : "fas fa-pause"),
  },
  muteUnmute: {
    message: (details) => (details.muted ? "Audio muted" : "Audio unmuted"),
    icon: (details) =>
      details.muted ? "fas fa-volume-mute" : "fas fa-volume-up",
  },
  volumeUp: {
    message: "Volume increased",
    icon: "fas fa-volume-up",
  },
  volumeDown: {
    message: "Volume decreased",
    icon: "fas fa-volume-down",
  },
  increaseFontSize: {
    message: "Font size increased",
    icon: "fas fa-text-height",
  },
  closeCookieNotices: {
    message: (details) =>
      details.noticesClosed
        ? `Cookie notices handled (${details.noticesClosed}): ${
            details.action === "rejected"
              ? "Rejected"
              : details.action === "hidden"
              ? "Removed from page"
              : "No action"
          }`
        : "No cookie notices found",
    icon: "fas fa-cookie-bite",
  },
  pasteAndGo: {
    message: (details) =>
      details.wasUrl
        ? `Navigating to URL: ${truncateText(details.text, 25)}`
        : `Searching for: ${truncateText(details.text, 25)}`,
    icon: (details) => (details.wasUrl ? "fas fa-link" : "fas fa-search"),
  },
  error: {
    message: (details) => details.message || "Operation failed",
    icon: "fas fa-exclamation-circle",
  },
  decreaseFontSize: {
    message: "Font size decreased",
    icon: "fas fa-text-height",
  },
  toggleDarkMode: {
    message: "Dark mode toggled",
    icon: "fas fa-moon",
  },
  toggleReaderMode: {
    message: "Reader mode toggled",
    icon: "fas fa-book-reader",
  },
  focusAddressBar: {
    message: "Address bar focused",
    icon: "fas fa-search",
  },
  back: {
    message: "Navigated back",
    icon: "fas fa-arrow-left",
  },
  forward: {
    message: "Navigated forward",
    icon: "fas fa-arrow-right",
  },
};

function truncateText(text, maxLength) {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

function showActionNotification(action, details = {}) {
  try {
    if (!notifications[action]) return;

    ensureFontAwesome();

    const notificationConfig = notifications[action];
    const message =
      typeof notificationConfig.message === "function"
        ? notificationConfig.message(details)
        : notificationConfig.message;

    const icon =
      typeof notificationConfig.icon === "function"
        ? notificationConfig.icon(details)
        : notificationConfig.icon;

    if (!notificationElement) {
      notificationElement = document.createElement("div");
      notificationElement.className = "keycommand-notification";
      document.body.appendChild(notificationElement);
    }

    notificationElement.innerHTML = `<i class="${icon}"></i>${message}`;

    notificationElement.classList.remove("show");

    void notificationElement.offsetWidth;
    notificationElement.classList.add("show");

    clearTimeout(notificationElement.timeout);
    notificationElement.timeout = setTimeout(() => {
      notificationElement.classList.remove("show");
    }, 2000);
  } catch (error) {}
}

function sendPageInfo() {
  try {
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({
        action: "pageInfo",
        page: pageInfo,
      });
    }
  } catch (error) {}
}

function sendKeyEvent(event) {
  try {
    if (
      event.type === "keydown" &&
      ["Control", "Alt", "Shift", "Meta"].includes(event.key) &&
      !event.ctrlKey &&
      !event.altKey &&
      !event.shiftKey &&
      !event.metaKey
    ) {
      return;
    }

    if (!chrome.runtime?.id) return;

    const simplifiedEvent = {
      type: event.type,
      key: event.key,
      keyCode: event.keyCode,
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
    };

    chrome.runtime.sendMessage({ action: "getCurrentTab" }, function (tab) {
      if (chrome.runtime.lastError) return;

      if (!port) connectPort();

      if (port) {
        try {
          port.postMessage({
            type: "keyEvent",
            event: simplifiedEvent,
            tab: tab || { url: window.location.href },
          });
        } catch (error) {
          port = null;
        }
      }
    });
  } catch (error) {}
}

function setupEventListeners() {
  document.addEventListener("keydown", sendKeyEvent, true);
  document.addEventListener("keyup", sendKeyEvent, true);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") {
      connectPort();
      sendPageInfo();
    }
  });

  window.addEventListener("pageshow", function (event) {
    if (event.persisted) {
      connectPort();
      sendPageInfo();
    }
  });

  chrome.runtime.onMessage.addListener(function (
    message,
    sender,
    sendResponse
  ) {
    try {
      if (message.action === "executeCustomCode" && message.code) {
        const result = new Function(message.code)();
        sendResponse({ success: true, result });
      } else if (
        message.action === "executeFunction" &&
        message.functionString
      ) {
        const func = new Function(`return ${message.functionString}`)();
        const result = func(...(message.args || []));
        sendResponse({ success: true, result });
      } else if (message.action === "showNotification" && message.actionType) {
        showActionNotification(message.actionType, message.details || {});
        sendResponse({ success: true });
      }
      return true;
    } catch (error) {
      sendResponse({ success: false, error: error.message });
      return true;
    }
  });
}

function observeUrlChanges() {
  try {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function () {
      originalPushState.apply(this, arguments);
      updateUrl();
    };

    history.replaceState = function () {
      originalReplaceState.apply(this, arguments);
      updateUrl();
    };

    window.addEventListener("popstate", updateUrl);

    function updateUrl() {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        pageInfo.url = lastUrl;
        sendPageInfo();
      }
    }
  } catch (error) {
    try {
      const urlObserver = new MutationObserver(() => {
        if (window.location.href !== lastUrl) {
          lastUrl = window.location.href;
          pageInfo.url = lastUrl;
          sendPageInfo();
        }
      });

      urlObserver.observe(document, { subtree: true, childList: true });
    } catch (error) {}
  }
}

function notifyContentScriptLoaded() {
  try {
    if (chrome.runtime?.id) {
      chrome.runtime.sendMessage({ action: "contentScriptLoaded" });
    }
  } catch (error) {}
}

initialize();