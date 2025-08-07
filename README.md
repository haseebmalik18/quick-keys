# Quickeys - Custom Browser Keyboard Shortcuts

A Chrome extension that enables users to create personalized keyboard shortcuts for enhanced browser productivity and workflow automation.

## Project Overview

Quickeys solves the problem of repetitive browser actions by allowing users to create custom keyboard shortcuts for frequently used tasks. The extension provides 50+ built-in actions across navigation, tab management, media control, and page manipulation, with support for site-specific shortcuts and intelligent conflict resolution.

## Tech Stack

- **JavaScript (ES6+)** - Core extension logic and DOM manipulation
- **Chrome Extension API** - Manifest V3 with service workers
- **Webpack 5** - Module bundling and build optimization
- **CSS3** - User interface styling
- **Chrome Storage API** - Settings and shortcuts persistence

## Installation

Install Quickeys directly from the [Chrome Web Store](https://chromewebstore.google.com/detail/quickeys-custom-keyboard/biphbdgnppemddehflmppkimnjhhkohp)

## Features

### Core Functionality
- Custom keyboard shortcuts using any key combination
- Site-specific shortcuts with wildcard pattern matching
- 50+ built-in actions across 8 categories
- Real-time visual feedback system
- Dynamic permission management

### Action Categories
- **Navigation**: Scroll controls, history navigation, URL copying
- **Tab Management**: Create, close, switch, pin, mute tabs
- **Window Control**: New windows, fullscreen, minimize/maximize
- **Media Control**: Play/pause, volume adjustment, skip controls
- **Clipboard Operations**: Copy URLs, titles, selected text
- **Accessibility**: Font size adjustment, dark mode, reader mode
- **DOM Interaction**: Element clicking, form filling, visibility toggles
- **Custom Automation**: JavaScript code execution with security sandboxing

### Advanced Features
- Cross-site compatibility with conflict resolution
- Permission-aware action execution
- Pattern caching for performance optimization
- Multi-context script execution (main/isolated world)

## Future Improvements

- **Shortcut conflict detection and warnings** - Alert users when shortcuts conflict with existing browser or website shortcuts
- **Command palette with fuzzy search** - Searchable popup to quickly find and execute actions by typing
- **Firefox and Edge browser ports** - Cross-browser compatibility using WebExtensions API
- **Bookmark integration as keyboard shortcuts** - Convert bookmarks into assignable keyboard shortcuts
- **Pre-built shortcut templates** - Ready-made shortcut collections for popular websites like Gmail, GitHub, Twitter
- **Text expander functionality** - Type abbreviations that auto-expand into longer text (e.g., "@@" becomes email address)
- **Form auto-fill shortcuts** - Quick shortcuts to fill common form fields with saved data

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Author**: HaseebUlhaq Malik