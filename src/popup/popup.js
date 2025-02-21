document.addEventListener('DOMContentLoaded', function() {
  const elements = {
    extensionToggle: document.getElementById('extension-toggle'),
    addShortcutBtn: document.getElementById('add-shortcut-btn'),
    openSettingsBtn: document.getElementById('open-settings-btn'),
    shortcutsList: document.getElementById('shortcuts-list')
  };

  loadSettings();
  loadShortcuts();

  elements.extensionToggle.addEventListener('change', toggleExtension);
  elements.addShortcutBtn.addEventListener('click', addShortcut);
  elements.openSettingsBtn.addEventListener('click', openSettings);

  function loadSettings() {
    chrome.runtime.sendMessage({action: 'getState'}, function(response) {
      if (response) {
        elements.extensionToggle.checked = response.enabled;
      }
    });
  }

  function loadShortcuts() {
    chrome.storage.sync.get(['shortcuts'], function(data) {
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

    elements.shortcutsList.innerHTML = shortcutEntries.map(([key, shortcut]) => `
      <div class="shortcut-item">
        <span class="shortcut-key">${key}</span>
        <span class="shortcut-action">${shortcut.action}</span>
      </div>
    `).join('');
  }

  function toggleExtension() {
    const enabled = elements.extensionToggle.checked;
    chrome.runtime.sendMessage({
      action: 'toggleExtension',
      enabled: enabled
    });
  }

  function addShortcut() {
    chrome.runtime.openOptionsPage();
  }

  function openSettings() {
    chrome.runtime.openOptionsPage();
  }
});