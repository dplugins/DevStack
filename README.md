# DevStack

A Chrome extension for developers with multiple tools to enhance your development workflow.

## Features

### 🔄 URL Swapper

Replace URLs on web pages to test with different environments:

- Swap source URLs with destination URLs
- Support for images, CSS, JS, media files, iframes, and inline CSS
- Optional menu link swapping with CSS selectors
- Origin-only matching mode

### 🧹 Cache Buster

Force reload of CSS/JS files without server changes:

- Add `?ver=timestamp` query parameters to CSS/JS files
- Disable browser cache for selected domains
- Target specific domains or apply globally
- Works with dynamically loaded content

## Installation

1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the DevStack folder
5. The extension icon will appear in your toolbar

## Usage

Click the DevStack icon to open the popup with two tabs:

### URL Swapper Tab

1. Toggle "Enabled" to activate URL swapping
2. Enter your source URL (e.g., `http://localhost:3000`)
3. Enter your destination URL (e.g., `https://example.com`)
4. Choose which types of assets to swap
5. Optionally add CSS selectors for menu links
6. Click "Save"

### Cache Buster Tab

1. Toggle "Enabled" to activate cache busting
2. Enable "Add ?ver=timestamp to CSS/JS" to add cache-busting parameters
3. Enable "Disable browser cache for selected domains" to prevent caching
4. Enter target domains (one per line) or leave empty for all domains
5. Click "Save"

## Development

The extension consists of:

- `popup.html` - Main UI with tabbed interface
- `popup.js` - Tab management and settings persistence
- `content.js` - URL Swapper functionality
- `cache-buster.js` - Cache busting functionality
- `manifest.json` - Extension configuration

## License

MIT
