# Edcite Login Assistant

Edcite Login Assistant stores server profiles and credentials locally in the browser and automates login on approved Edcite domains.

## Installation for testing

1. Extract the release ZIP.
2. Open `chrome://extensions`.
3. Enable Developer mode.
4. Select **Load unpacked**.
5. Choose the extracted `edcite-login-assistant` folder containing `manifest.json`.

## First setup

1. Open the extension.
2. Select **Manage accounts**.
3. Add a server using its complete `http://` or `https://` URL.
4. Add an account type, user ID, and password.
5. Add redirects from the Redirects tab if needed.

Passwords are encrypted locally with AES-GCM before being stored in Chrome extension local storage on the user's device. They are not included in this package or transmitted to Edcite Login Assistant services. This protects against casual plaintext inspection; users should still protect their browser profile.

## Supported domains

The extension is restricted to `*.edcite.com` and `*.edcite-dev.com`.

## Tested servers

- `https://ed11s.edcite.com/`
- `https://www.edcite.com/`
- `http://edtest80.edcite-dev.com/`
- `http://pubdev80.edcite-dev.com/`
- `http://pubdev90.edcite-dev.com/`
- `https://www.edcite-dev.com/`
- `https://pubdev.edcite-dev.com/`
