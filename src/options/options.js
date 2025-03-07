document.addEventListener('DOMContentLoaded', function() {
    const elements = {
        navLinks: document.querySelectorAll('.nav-link'),
        sections: document.querySelectorAll('.section'),
        addShortcutBtn: document.getElementById('add-shortcut'),
        shortcutModal: document.getElementById('shortcut-modal'),
        modalClose: document.querySelector('.modal-close'),
        saveShortcutBtn: document.getElementById('save-shortcut'),
        cancelShortcutBtn: document.getElementById('cancel-shortcut'),
        shortcutKeyInput: document.getElementById('shortcut-key'),
        actionCategorySelect: document.getElementById('action-category'),
        actionSelect: document.getElementById('action-select'),
        shortcutsList: document.getElementById('shortcuts-list'),
        startupEnabledCheck: document.getElementById('startup-enabled'),
        notificationsEnabledCheck: document.getElementById('notifications-enabled'),
        permissionsList: document.getElementById('permissions-list')
    };

    let isCapturingKey = false;
    let currentShortcutKeys = [];

    // Initialize
    loadSettings();
    loadShortcuts();
    setupEventListeners();
    populateActionCategories();
    checkPermissions();

    function setupEventListeners() {
        // Navigation
        elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = e.target.closest('.nav-link').dataset.section;
                switchSection(section);
            });
        });

        // Modal
        elements.addShortcutBtn.addEventListener('click', openShortcutModal);
        elements.modalClose.addEventListener('click', closeShortcutModal);
        elements.cancelShortcutBtn.addEventListener('click', closeShortcutModal);
        elements.saveShortcutBtn.addEventListener('click', saveShortcut);

        // Shortcut key capture
        elements.shortcutKeyInput.addEventListener('click', startKeyCapture);
        document.addEventListener('keydown', captureKeyPress);

        // Action category change
        elements.actionCategorySelect.addEventListener('change', populateActions);

        // Settings
        elements.startupEnabledCheck.addEventListener('change', saveSettings);
        elements.notificationsEnabledCheck.addEventListener('change', saveSettings);

        // Click outside modal to close
        elements.shortcutModal.addEventListener('click', (e) => {
            if (e.target === elements.shortcutModal) {
                closeShortcutModal();
            }
        });
    }

    function switchSection(sectionName) {
        // Update navigation
        elements.navLinks.forEach(link => link.classList.remove('active'));
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');

        // Update sections
        elements.sections.forEach(section => section.classList.remove('active'));
        document.getElementById(`${sectionName}-section`).classList.add('active');
    }

    function openShortcutModal() {
        elements.shortcutModal.style.display = 'block';
        resetModal();
    }

    function closeShortcutModal() {
        elements.shortcutModal.style.display = 'none';
        isCapturingKey = false;
        currentShortcutKeys = [];
    }

    function resetModal() {
        elements.shortcutKeyInput.value = '';
        elements.actionCategorySelect.value = '';
        elements.actionSelect.innerHTML = '<option value="">Select action...</option>';
        currentShortcutKeys = [];
    }

    function startKeyCapture() {
        isCapturingKey = true;
        currentShortcutKeys = [];
        elements.shortcutKeyInput.value = 'Press keys...';
        elements.shortcutKeyInput.style.background = '#f0f8ff';
    }

    function captureKeyPress(e) {
        if (!isCapturingKey) return;

        e.preventDefault();
        e.stopPropagation();

        const key = e.key.toLowerCase();
        
        // Skip modifier keys on their own
        if (['control', 'alt', 'shift', 'meta'].includes(key)) {
            return;
        }

        const shortcutParts = [];
        if (e.ctrlKey) shortcutParts.push('ctrl');
        if (e.altKey) shortcutParts.push('alt');
        if (e.shiftKey) shortcutParts.push('shift');
        if (e.metaKey) shortcutParts.push('meta');
        shortcutParts.push(key);

        const shortcutKey = shortcutParts.join('+');
        elements.shortcutKeyInput.value = shortcutKey;
        elements.shortcutKeyInput.style.background = '';
        
        isCapturingKey = false;
    }

    function populateActionCategories() {
        // This would normally come from background script
        const categories = [
            { id: 'navigation', name: 'Navigation' },
            { id: 'tabs', name: 'Tabs' },
            { id: 'windows', name: 'Windows' },
            { id: 'chrome', name: 'Chrome Pages' }
        ];

        elements.actionCategorySelect.innerHTML = '<option value="">Select category...</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            elements.actionCategorySelect.appendChild(option);
        });
    }

    function populateActions() {
        const category = elements.actionCategorySelect.value;
        elements.actionSelect.innerHTML = '<option value="">Select action...</option>';

        if (!category) return;

        // Sample actions for each category
        const actions = {
            navigation: [
                { id: 'back', name: 'Go Back' },
                { id: 'forward', name: 'Go Forward' },
                { id: 'reload', name: 'Reload Page' }
            ],
            tabs: [
                { id: 'newTab', name: 'New Tab' },
                { id: 'closeTab', name: 'Close Tab' },
                { id: 'nextTab', name: 'Next Tab' },
                { id: 'prevTab', name: 'Previous Tab' }
            ],
            windows: [
                { id: 'newWindow', name: 'New Window' },
                { id: 'closeWindow', name: 'Close Window' },
                { id: 'fullscreen', name: 'Toggle Fullscreen' }
            ],
            chrome: [
                { id: 'openBookmarks', name: 'Open Bookmarks' },
                { id: 'openHistory', name: 'Open History' },
                { id: 'openDownloads', name: 'Open Downloads' }
            ]
        };

        if (actions[category]) {
            actions[category].forEach(action => {
                const option = document.createElement('option');
                option.value = action.id;
                option.textContent = action.name;
                elements.actionSelect.appendChild(option);
            });
        }
    }

    function saveShortcut() {
        const shortcutKey = elements.shortcutKeyInput.value;
        const action = elements.actionSelect.value;

        if (!shortcutKey || !action) {
            alert('Please fill in all fields');
            return;
        }

        chrome.storage.sync.get(['shortcuts'], (data) => {
            const shortcuts = data.shortcuts || {};
            shortcuts[shortcutKey] = {
                action: action,
                type: 'global'
            };

            chrome.storage.sync.set({ shortcuts }, () => {
                chrome.runtime.sendMessage({
                    action: 'shortcutsChanged',
                    shortcuts: shortcuts
                });
                loadShortcuts();
                closeShortcutModal();
            });
        });
    }

    function loadShortcuts() {
        chrome.storage.sync.get(['shortcuts'], (data) => {
            const shortcuts = data.shortcuts || {};
            displayShortcuts(shortcuts);
        });
    }

    function displayShortcuts(shortcuts) {
        const shortcutEntries = Object.entries(shortcuts);
        
        if (shortcutEntries.length === 0) {
            elements.shortcutsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-keyboard"></i>
                    <h3>No shortcuts configured</h3>
                    <p>Create your first shortcut to get started</p>
                </div>
            `;
            return;
        }

        elements.shortcutsList.innerHTML = shortcutEntries.map(([key, shortcut]) => `
            <div class="shortcut-item">
                <div class="shortcut-info">
                    <span class="shortcut-key">${key}</span>
                    <span class="shortcut-action">${shortcut.action}</span>
                </div>
                <button class="btn secondary delete-shortcut" data-key="${key}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');

        // Add delete event listeners
        document.querySelectorAll('.delete-shortcut').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const key = e.target.closest('.delete-shortcut').dataset.key;
                deleteShortcut(key);
            });
        });
    }

    function deleteShortcut(key) {
        if (!confirm('Are you sure you want to delete this shortcut?')) {
            return;
        }

        chrome.storage.sync.get(['shortcuts'], (data) => {
            const shortcuts = data.shortcuts || {};
            delete shortcuts[key];

            chrome.storage.sync.set({ shortcuts }, () => {
                chrome.runtime.sendMessage({
                    action: 'shortcutsChanged',
                    shortcuts: shortcuts
                });
                loadShortcuts();
            });
        });
    }

    function loadSettings() {
        chrome.storage.sync.get(['settings'], (data) => {
            const settings = data.settings || {};
            elements.startupEnabledCheck.checked = settings.startupEnabled !== false;
            elements.notificationsEnabledCheck.checked = settings.notifications !== false;
        });
    }

    function saveSettings() {
        const settings = {
            startupEnabled: elements.startupEnabledCheck.checked,
            notifications: elements.notificationsEnabledCheck.checked
        };

        chrome.storage.sync.set({ settings }, () => {
            chrome.runtime.sendMessage({
                action: 'settingsChanged',
                settings: settings
            });
        });
    }

    function checkPermissions() {
        const permissions = ['tabs', 'scripting'];
        
        permissions.forEach(permission => {
            chrome.permissions.contains({ permissions: [permission] }, (result) => {
                const button = document.querySelector(`[data-permission="${permission}"]`);
                if (button) {
                    if (result) {
                        button.textContent = 'Granted';
                        button.disabled = true;
                        button.classList.add('granted');
                    } else {
                        button.addEventListener('click', () => requestPermission(permission));
                    }
                }
            });
        });
    }

    function requestPermission(permission) {
        chrome.permissions.request({ permissions: [permission] }, (granted) => {
            if (granted) {
                checkPermissions();
            }
        });
    }
});