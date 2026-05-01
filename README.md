# Yet Another Input Logger (Educational)

> ⚠️ **Important:** This project is intended for **educational and debugging purposes only**. It must be used with **explicit user consent** and **clear disclosure**. Do not deploy on other users’ systems or collect sensitive data without permission.

## Overview

This Chrome Extension (Manifest V3) demonstrates how to:

* Capture browser events (keyboard, focus, visibility, network status)
* Batch and transmit events from a content script to a background service worker
* Persist logs by triggering downloads via the `chrome.downloads` API
* Work within MV3 constraints (service workers, limited APIs)

## Features

* Event monitoring:

  * Keyboard events (`keydown`)
  * Form focus events
  * Page visibility changes
  * Network status (online/offline)
* Buffered batching to reduce message overhead
* Periodic flushing of logs
* File export using Chrome’s downloads API
* Runs on all pages (configurable)

## Architecture

```
Content Script (content.js)
  └─ Captures events from the page
  └─ Buffers activity
  └─ Sends batched messages to background

Background Service Worker (background.js)
  └─ Receives messages
  └─ Aggregates logs
  └─ Exports logs via downloads API
```
## Data Encoding (Obfuscation Layer)

To avoid storing raw plain-text logs, the extension applies a lightweight encoding step before writing data to disk.

### How it Works

1. Log entries are accumulated in memory
2. Before saving, the buffer is transformed using a simple XOR operation
3. The result is Base64-encoded
4. The encoded string is embedded into the output file

### Algorithm

```js
function encodeData(data, salt) {
  let encoded = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
    encoded += String.fromCharCode(charCode);
  }
  return btoa(encoded);
}
```

### Notes

* This method is **not cryptographically secure**
* It provides only basic obfuscation to avoid plain-text readability
* It should **not be used for protecting sensitive or confidential data**

### Why Not Strong Encryption?

Stronger encryption (e.g., AES) would require:

* Key management
* Secure storage of keys
* Additional dependencies or Web Crypto API usage

For this project, a lightweight transformation was chosen to keep the implementation simple and focused on learning concepts.

### Possible Improvements

* Replace XOR with AES-GCM using Web Crypto API
* Add per-session random keys
* Include integrity checks (e.g., authentication tags)
* Allow configurable encoding/encryption modes


### Data Flow

1. User interacts with a webpage
2. Content script captures events
3. Events are buffered and periodically sent
4. Background worker aggregates and writes logs
5. Logs are downloaded to the user’s Downloads folder

## Manifest (MV3)

Key points:

* Uses `service_worker` (no persistent background pages)
* Requires `"downloads"` permission for file export
* Content scripts run on `<all_urls>` (can be restricted)

## Permissions

```json
{
  "permissions": [
    "downloads",
    "storage"
  ]
}
```

> Only request permissions you actually need. Limit host access where possible.

## Installation

1. Open `chrome://extensions`
2. Enable **Developer Mode**
3. Click **Load unpacked**
4. Select the project folder

## Usage

* Interact with web pages normally
* The extension records configured events
* Logs are saved to:

  ```
  Downloads/<your-subfolder>/
  ```

## Notes on File Saving

* Chrome extensions **cannot write to arbitrary system paths** (e.g., `C:\` or `E:\`)
* Files are always saved relative to the **Downloads directory**
* To avoid save dialogs:

  * Set `saveAs: false`
  * Disable “Ask where to save each file” in Chrome settings

## MV3 Limitations

* No DOM access in service workers
* `URL.createObjectURL()` is **not available** in service workers
* Use data URLs for downloads instead
* Background scripts are **ephemeral** (can stop at any time)

## Development Tips

* Use `chrome://extensions` → **Inspect views** for debugging
* Add error logging around downloads:

  ```js
  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
  }
  ```
* Prefer `chrome.alarms` over `setInterval` for reliability

## Privacy & Compliance

* Always inform users what data is collected
* Avoid collecting sensitive inputs (passwords, personal data)
* Provide opt-in/opt-out controls
* Follow Chrome Web Store policies

## Limitations

* Cannot write outside Downloads directory
* Subject to Chrome’s security restrictions
* May be throttled if running without user interaction

## Future Improvements

* Add UI for enabling/disabling logging
* Filter sensitive fields (e.g., password inputs)
* Export logs to a backend with user consent
* Add settings page for configuration

## License

For educational use only. Ensure compliance with local laws and platform policies.
