// One-off broadcast to ALL opted-in devices. Bypasses rate-limit & delivery window.
// POST body: { title: string, body: string, type?: string, bundleId?: string, secret: string }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── helpers (copied from send-luce-notifications) ───
function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(base64 + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function createPkcs8FromRaw(rawPrivateKey: Uint8Array, rawPublicKey: Uint8Array): ArrayBuffer {
  const pkcs8Header = new Uint8Array([
    0x30, 0x81, 0x87, 0x02, 0x01, 0x00, 0x30, 0x13,
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02,
    0x01, 0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d,
    0x03, 0x01, 0x07, 0x04, 0x6d, 0x30, 0x6b, 0x02,
    0x01, 0x01, 0x04, 0x20
  ]);
  const middlePart = new Uint8Array([0xa1, 0x44, 0x03, 0x42, 0x00]);
  const result = new Uint8Array(pkcs8Header.length + rawPrivateKey.length + middlePart.length + rawPublicKey.length);
  result.set(pkcs8Header, 0);
  result.set(rawPrivateKey, pkcs8Header.length);
  result.set(middlePart, pkcs8Header.length + rawPrivateKey.length);
  result.set(rawPublicKey, pkcs8Header.length + rawPrivateKey.length + middlePart.length);
  return result.buffer;
}

async function encryptPayload(p256dhKey: string, authSecret: string, plaintext: Uint8Array) {
  const clientPublicKey = base64UrlDecode(p256dhKey);
  const clientAuth = base64UrlDecode(authSecret);
  const localKeyPair = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const localPublicKeyRaw = new Uint8Array(await crypto.subtle.exportKey("raw", localKeyPair.publicKey));
  const clientKey = await crypto.subtle.importKey("raw", clientPublicKey.buffer as ArrayBuffer, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const sharedSecret = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: clientKey }, localKeyPair.privateKey, 256));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const authInfo = new TextEncoder().encode("WebPush: info\0");
  const authInfoFull = new Uint8Array(authInfo.length + clientPublicKey.length + localPublicKeyRaw.length);
  authInfoFull.set(authInfo, 0);
  authInfoFull.set(clientPublicKey, authInfo.length);
  authInfoFull.set(localPublicKeyRaw, authInfo.length + clientPublicKey.length);
  const authHkdfKey = await crypto.subtle.importKey("raw", clientAuth.buffer as ArrayBuffer, "HKDF", false, ["deriveBits"]);
  const prk = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: sharedSecret, info: authInfoFull }, authHkdfKey, 256));
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const prkKey = await crypto.subtle.importKey("raw", prk, "HKDF", false, ["deriveBits"]);
  const cek = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: cekInfo }, prkKey, 128));
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt, info: nonceInfo }, prkKey, 96));
  const paddedPlaintext = new Uint8Array(plaintext.length + 1);
  paddedPlaintext.set(plaintext, 0);
  paddedPlaintext[plaintext.length] = 2;
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPlaintext));
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs);
  header[20] = localPublicKeyRaw.length;
  header.set(localPublicKeyRaw, 21);
  const encrypted = new Uint8Array(header.length + ciphertext.length);
  encrypted.set(header, 0);
  encrypted.set(ciphertext, header.length);
  return { encrypted };
}

async function sendWebPush(sub: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const rawPrivateKey = base64UrlDecode(vapidPrivateKey);
  const rawPublicKey = base64UrlDecode(vapidPublicKey);
  const endpoint = new URL(sub.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;
  const now = Math.floor(Date.now() / 1000);
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ aud: audience, exp: now + 12 * 3600, sub: "mailto:luce@lastreetlight.app" })));
  const unsignedToken = `${headerB64}.${claimsB64}`;
  const key = await crypto.subtle.importKey("pkcs8", createPkcs8FromRaw(rawPrivateKey, rawPublicKey), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken));
  const jwt = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
  const { encrypted } = await encryptPayload(sub.p256dh, sub.auth, new TextEncoder().encode(payload));
  const vapidHeader = `vapid t=${jwt}, k=${base64UrlEncode(rawPublicKey)}`;
  const response = await fetch(sub.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/octet-stream", "Content-Encoding": "aes128gcm", "TTL": "86400", Authorization: vapidHeader },
    body: encrypted,
  });
  if (!response.ok && response.status === 410) return { expired: true, status: 410 };
  return { expired: false, status: response.status };
}

let _apnsJwtCache: { jwt: string; createdAt: number } | null = null;
async function createApnsJwt(): Promise<string> {
  // APNs returns 429 TooManyProviderTokenUpdates if JWT is regenerated too often.
  // Reuse for ~30 min.
  if (_apnsJwtCache && Date.now() - _apnsJwtCache.createdAt < 30 * 60 * 1000) {
    return _apnsJwtCache.jwt;
  }
  const keyId = Deno.env.get("APNS_KEY_ID")!;
  const teamId = Deno.env.get("APNS_TEAM_ID")!;
  const privateKeyPem = Deno.env.get("APNS_KEY")!;
  const pemContents = privateKeyPem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const keyData = base64UrlDecode(pemContents.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
  const key = await crypto.subtle.importKey("pkcs8", keyData.buffer as ArrayBuffer, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const now = Math.floor(Date.now() / 1000);
  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "ES256", kid: keyId })));
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ iss: teamId, iat: now })));
  const unsignedToken = `${headerB64}.${claimsB64}`;
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(unsignedToken));
  const jwt = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
  _apnsJwtCache = { jwt, createdAt: Date.now() };
  return jwt;
}

async function sendApnsPush(deviceToken: string, title: string, body: string, bundleId: string) {
  const jwt = await createApnsJwt();
  const url = `https://api.push.apple.com/3/device/${deviceToken}`;
  const iosPayload = JSON.stringify({
    aps: { alert: { title, body }, sound: "default", "mutable-content": 1 },
    type: "announcement",
  });
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `bearer ${jwt}`,
      "apns-topic": bundleId,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "Content-Type": "application/json",
    },
    body: iosPayload,
  });
  if (response.status === 410) { await response.text(); return { expired: true, status: 410 }; }
  if (response.status === 400) {
    const b = await response.text();
    try { const p = JSON.parse(b); if (p.reason === "BadDeviceToken" || p.reason === "Unregistered") return { expired: true, status: 400 }; } catch { /* ignore */ }
    return { expired: false, status: 400 };
  }
  return { expired: false, status: response.status };
}

function pemToBytes(pem: string): ArrayBuffer {
  const base64 = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function sendFcmPush(token: string, title: string, body: string) {
  const sa = JSON.parse(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON")!);
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  })));
  const sigInput = `${header}.${claims}`;
  const cryptoKey = await crypto.subtle.importKey("pkcs8", pemToBytes(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sigBytes = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(sigInput));
  const jwt = `${sigInput}.${base64UrlEncode(new Uint8Array(sigBytes))}`;
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const { access_token } = await tokenRes.json();
  const fcmRes = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        notification: { title, body },
        data: { type: "announcement" },
        android: { notification: { icon: "ic_launcher", color: "#FFD700", channel_id: "luce_notifications" } },
      },
    }),
  });
  const status = fcmRes.status;
  if (status === 404 || status === 410) return { expired: true, status };
  return { expired: false, status };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const title = String(body.title || "LA Street Light").slice(0, 200);
    const messageBody = String(body.body || "").slice(0, 500);
    const bundleId = String(body.bundleId || "com.lastreetlight.lastreetlight");
    if (!messageBody) {
      return new Response(JSON.stringify({ error: "body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: devices } = await supabase.from("device_tokens").select("*");
    const { data: legacy } = await supabase.from("push_subscriptions").select("*");

    interface D { device_id: string; platform: "web"|"ios"|"android"; token: string; p256dh: string|null; auth: string|null; }
    const all: D[] = [];
    const seen = new Set<string>();
    for (const d of devices ?? []) {
      all.push({ device_id: d.device_id, platform: d.platform as D["platform"], token: d.token, p256dh: d.p256dh, auth: d.auth });
      seen.add(d.device_id);
    }
    for (const s of legacy ?? []) {
      if (seen.has(s.device_id)) continue;
      all.push({ device_id: s.device_id, platform: "web", token: s.endpoint, p256dh: s.p256dh, auth: s.auth });
    }

    let sent = 0, failed = 0, expired = 0;
    const errors: string[] = [];

    for (const device of all) {
      try {
        let result: { expired: boolean; status?: number };
        if (device.platform === "ios") {
          result = await sendApnsPush(device.token, title, messageBody, bundleId);
        } else if (device.platform === "android") {
          result = await sendFcmPush(device.token, title, messageBody);
        } else {
          if (!device.p256dh || !device.auth) { failed++; continue; }
          result = await sendWebPush({ endpoint: device.token, p256dh: device.p256dh, auth: device.auth }, JSON.stringify({ title, body: messageBody, type: "announcement" }));
        }
        if (result.expired) {
          expired++;
          await supabase.from("device_tokens").delete().eq("device_id", device.device_id);
          await supabase.from("push_subscriptions").delete().eq("device_id", device.device_id);
        } else if (result.status && result.status >= 400) {
          failed++;
          errors.push(`${device.platform} ${device.device_id.slice(0,8)}: ${result.status}`);
        } else {
          sent++;
          await supabase.from("notification_history").insert({ device_id: device.device_id, message_index: -2 });
        }
      } catch (err) {
        failed++;
        errors.push(`${device.platform} ${device.device_id.slice(0,8)}: ${String(err).slice(0, 80)}`);
      }
    }

    return new Response(JSON.stringify({ total: all.length, sent, failed, expired, errors: errors.slice(0, 10) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
