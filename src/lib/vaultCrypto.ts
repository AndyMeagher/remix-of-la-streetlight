// AES-GCM + PBKDF2 vault encryption tied to a user PIN.
// The PIN is never stored — losing it means losing the data.

const STORAGE_KEY = "luce_vault_v1";
const VERIFY_KEY = "luce_vault_verify_v1";

interface StoredEnvelope {
  salt: string;
  iv: string;
  data: string;
}

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(pin: string, salt: BufferSource): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(pin),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 150_000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptVault(pin: string, payload: unknown): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const enc = new TextEncoder();
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(JSON.stringify(payload)),
  );
  const env: StoredEnvelope = {
    salt: b64encode(salt),
    iv: b64encode(iv),
    data: b64encode(cipher),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(env));

  // Verification token so we can validate PIN without decrypting the full vault.
  const vSalt = crypto.getRandomValues(new Uint8Array(16));
  const vIv = crypto.getRandomValues(new Uint8Array(12));
  const vKey = await deriveKey(pin, vSalt);
  const vCipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: vIv },
    vKey,
    enc.encode("OK"),
  );
  localStorage.setItem(
    VERIFY_KEY,
    JSON.stringify({ salt: b64encode(vSalt), iv: b64encode(vIv), data: b64encode(vCipher) }),
  );
}

export async function decryptVault<T = unknown>(pin: string): Promise<T | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  const env = JSON.parse(raw) as StoredEnvelope;
  const key = await deriveKey(pin, b64decode(env.salt));
  try {
    const plain = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: b64decode(env.iv) },
      key,
      b64decode(env.data),
    );
    return JSON.parse(new TextDecoder().decode(plain)) as T;
  } catch {
    return null;
  }
}

export async function verifyPin(pin: string): Promise<boolean> {
  const raw = localStorage.getItem(VERIFY_KEY);
  if (!raw) return false;
  const env = JSON.parse(raw) as StoredEnvelope;
  const key = await deriveKey(pin, b64decode(env.salt));
  try {
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64decode(env.iv) }, key, b64decode(env.data));
    return true;
  } catch {
    return false;
  }
}

export function vaultExists(): boolean {
  return !!localStorage.getItem(STORAGE_KEY);
}

export function clearVault(): void {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(VERIFY_KEY);
}
