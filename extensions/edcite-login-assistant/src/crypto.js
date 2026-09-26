const PASSWORD_KEY_STORAGE = "passwordEncryptionKey";

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function getPasswordKey() {
  const stored = await chrome.storage.local.get(PASSWORD_KEY_STORAGE);
  if (stored[PASSWORD_KEY_STORAGE]) {
    return crypto.subtle.importKey("raw", base64ToBytes(stored[PASSWORD_KEY_STORAGE]), "AES-GCM", false, ["encrypt", "decrypt"]);
  }

  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const rawKey = await crypto.subtle.exportKey("raw", key);
  await chrome.storage.local.set({ [PASSWORD_KEY_STORAGE]: bytesToBase64(new Uint8Array(rawKey)) });
  return key;
}

async function encryptPassword(password) {
  const key = await getPasswordKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(password);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return { version: 1, algorithm: "AES-GCM", iv: bytesToBase64(iv), ciphertext: bytesToBase64(new Uint8Array(ciphertext)) };
}

async function decryptPassword(value) {
  if (typeof value === "string") return value;
  if (!value || value.version !== 1 || value.algorithm !== "AES-GCM") throw new Error("Unsupported stored password format.");
  const key = await getPasswordKey();
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: base64ToBytes(value.iv) }, key, base64ToBytes(value.ciphertext));
  return new TextDecoder().decode(plaintext);
}
