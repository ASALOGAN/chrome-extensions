# Chrome Web Store submission draft

## Name

Edcite Login Assistant

## Short description

Manage local Edcite server accounts and automate login with optional redirects.

## Detailed description

Edcite Login Assistant helps authorized Edcite users manage multiple Edcite server profiles and account types in one browser popup. Users can save server URLs, account types, usernames, passwords, and optional redirect paths locally, then launch the selected Edcite login flow.

The extension is restricted to Edcite domains and does not operate as a general-purpose login manager for unrelated websites. It does not operate a remote credential service or sell user data.

## User data disclosure

This extension handles authentication information supplied by the user, including usernames and passwords. It stores usernames and encrypted passwords in Chrome extension local storage on the user's device so the user can reuse saved accounts. Passwords are encrypted locally with AES-GCM and decrypted only in memory during login. The extension uses the credentials only to automate login to the Edcite server selected by the user. It does not intentionally transmit saved credentials to the extension author, advertising networks, analytics providers, or data brokers.

Users can review and delete saved servers, users, passwords, and redirects from the extension's management controls.

## Permissions justification

- `storage`: save and manage the user's local Edcite server profiles and credentials.
- `scripting`: fill the selected Edcite login form.
- Host permissions: limited to `*.edcite.com` and `*.edcite-dev.com`.

## Privacy policy URL

Host `PRIVACY.md` at a public HTTPS URL owned or administered by the developer, such as GitHub Pages, and enter that URL in the Chrome Web Store Developer Dashboard. A local file path is not sufficient for Store submission.
