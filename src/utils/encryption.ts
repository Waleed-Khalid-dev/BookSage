import { invokePython } from '../services/pythonService';

let cachedKey: CryptoKey | null = null;
let initPromise: Promise<void> | null = null;

// A static salt used to derive the key from the hardware ID.
// This ensures the derived key is unique to BookSage on this machine.
const APP_SALT = new TextEncoder().encode("booksage-secure-local-storage-salt-2026");

async function getHardwareId(): Promise<string> {
  try {
    const res = await invokePython({ command: 'get_hardware_id' });
    if (res.status === 'success' && res.hardware_id) {
      return res.hardware_id;
    }
  } catch (err) {
    console.error("Failed to get hardware ID from python", err);
  }
  // Fallback to a browser-specific ID if python fails (though it shouldn't)
  return navigator.userAgent;
}

async function deriveKey(): Promise<CryptoKey> {
  const hwId = await getHardwareId();
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(hwId),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: APP_SALT,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function initEncryption() {
  if (cachedKey) return;
  if (!initPromise) {
    initPromise = deriveKey().then(key => {
      cachedKey = key;
    });
  }
  return initPromise;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptData(plainText: string): Promise<string> {
  await initEncryption();
  if (!cachedKey) throw new Error("Encryption key not initialized");

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherText = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cachedKey,
    enc.encode(plainText)
  );

  // Combine IV and CipherText into a single base64 string
  const combined = new Uint8Array(iv.length + cipherText.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherText), iv.length);
  
  return bufferToBase64(combined.buffer);
}

export async function decryptData(cipherB64: string): Promise<string | null> {
  if (!cipherB64) return null;
  
  try {
    await initEncryption();
    if (!cachedKey) throw new Error("Encryption key not initialized");

    const combined = new Uint8Array(base64ToBuffer(cipherB64));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      cachedKey,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (err) {
    console.error("Decryption failed", err);
    return null;
  }
}
