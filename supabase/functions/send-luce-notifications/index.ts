import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MESSAGES = [
  // Encouragement (~75%)
  { body: "Hey... just checking in. You doing alright today?", type: "encouragement" },
  { body: "You've made it this far. That counts for something.", type: "encouragement" },
  { body: "Whatever today feels like—you don't have to carry it alone.", type: "encouragement" },
  { body: "No pressure—just a reminder I'm here if you need anything.", type: "encouragement" },
  { body: "You can take things one step at a time. That's enough.", type: "encouragement" },
  { body: "It's okay to pause. You don't always have to push through.", type: "encouragement" },
  { body: "You matter more than you probably feel right now.", type: "encouragement" },
  { body: "You're not invisible. I see you.", type: "encouragement" },
  { body: "You still deserve something good—even on a hard day.", type: "encouragement" },
  { body: "Need a safe place or something to eat? I can help you find it.", type: "encouragement" },
  { body: "Hey… you made it through today. I see you.", type: "encouragement" },
  { body: "You're not behind. You're carrying things most people don't understand.", type: "encouragement" },
  { body: "Let's just focus on this moment. You don't have to solve everything right now.", type: "encouragement" },
  { body: "You deserve to feel safe tonight. That still matters.", type: "encouragement" },
  { body: "If you're tired, rest. Your body's been holding a lot.", type: "encouragement" },
  { body: "It's okay to say no. You don't owe everyone access to you.", type: "encouragement" },
  { body: "What happened to you isn't all you are. Not even close.", type: "encouragement" },
  { body: "Even if today feels heavy, it doesn't erase your progress.", type: "encouragement" },
  { body: "You are not behind in life. You're moving through things most people never had to face.", type: "encouragement" },
  { body: "If today's heavy, we can figure out your next step together.", type: "encouragement" },
  { body: "You don't have to have it all figured out—just start where you are.", type: "encouragement" },
  { body: "This moment isn't the end of your story.", type: "encouragement" },
  { body: "Things can shift—even if it doesn't feel like it yet.", type: "encouragement" },
  { body: "You're still here... and that means something.", type: "encouragement" },
  // Community (~25%)
  { body: "If you've found something helpful here... you can pass it on. Drop a tip for someone else.", type: "community" },
  { body: "You never know who needs what you've learned. Want to leave a tip for someone coming up behind you?", type: "community" },
  { body: "This space works because people look out for each other. Got something to share?", type: "community" },
  { body: "Someone out there could use your experience. Leave a tip if you can.", type: "community" },
  { body: "What you've been through could help someone else get through. Want to share a tip?", type: "community" },
  { body: "Your voice matters here too. You can help someone else find their way.", type: "community" },
  { body: "Got a tip that could help someone? Drop it here.", type: "community" },
  { body: "Real talk helps real people. Leave a tip if you've got one.", type: "community" },
  { body: "Sometimes what we've learned the hard way can light the path for someone else.", type: "community" },
  { body: "You've made it through some things... someone else is still in it. Your words could help.", type: "community" },
];

const ENCOURAGEMENT_INDICES = MESSAGES.map((m, i) => m.type === "encouragement" ? i : -1).filter(i => i >= 0);
const COMMUNITY_INDICES = MESSAGES.map((m, i) => m.type === "community" ? i : -1).filter(i => i >= 0);

// Weighted random: 75% encouragement, 25% community
function pickMessageIndex(excludeIndices: number[]): number {
  const roll = Math.random();
  const pool = roll < 0.75 ? ENCOURAGEMENT_INDICES : COMMUNITY_INDICES;
  const available = pool.filter(i => !excludeIndices.includes(i));
  if (available.length === 0) {
    // Fallback: pick from any non-excluded
    const allAvailable = MESSAGES.map((_, i) => i).filter(i => !excludeIndices.includes(i));
    if (allAvailable.length === 0) return Math.floor(Math.random() * MESSAGES.length);
    return allAvailable[Math.floor(Math.random() * allAvailable.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

// Check if current hour is in acceptable delivery window (10am-8pm PT)
function isDeliveryWindow(): boolean {
  const now = new Date();
  // Convert to PT (UTC-7 or UTC-8 depending on DST)
  const ptOffset = -7; // Approximate, good enough
  const ptHour = (now.getUTCHours() + ptOffset + 24) % 24;
  return ptHour >= 10 && ptHour <= 20;
}

async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;

  // Import the VAPID private key
  const rawPrivateKey = base64UrlDecode(vapidPrivateKey);
  const rawPublicKey = base64UrlDecode(vapidPublicKey);

  // Create JWT for VAPID
  const endpoint = new URL(subscription.endpoint);
  const audience = `${endpoint.protocol}//${endpoint.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    aud: audience,
    exp: now + 12 * 3600,
    sub: "mailto:luce@lastreetlight.app",
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    createPkcs8FromRaw(rawPrivateKey, rawPublicKey),
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  const jwt = `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;

  // Encrypt the payload using Web Push encryption (aesgcm)
  const { encrypted, salt, localPublicKey } = await encryptPayload(
    subscription.p256dh,
    subscription.auth,
    new TextEncoder().encode(payload)
  );

  const vapidHeader = `vapid t=${jwt}, k=${base64UrlEncode(rawPublicKey)}`;

  const response = await fetch(subscription.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
      Authorization: vapidHeader,
    },
    body: encrypted,
  });

  if (!response.ok && response.status === 410) {
    // Subscription expired
    return { expired: true };
  }

  return { expired: false, status: response.status };
}

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
  // PKCS8 wrapper for EC P-256 private key
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

async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  plaintext: Uint8Array
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const clientPublicKey = base64UrlDecode(p256dhKey);
  const clientAuth = base64UrlDecode(authSecret);

  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  // Import client public key
  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKey,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      localKeyPair.privateKey,
      256
    )
  );

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // HKDF to derive keys using aes128gcm content encoding
  const authInfo = new TextEncoder().encode("WebPush: info\0");
  const authInfoFull = new Uint8Array(authInfo.length + clientPublicKey.length + localPublicKeyRaw.length);
  authInfoFull.set(authInfo, 0);
  authInfoFull.set(clientPublicKey, authInfo.length);
  authInfoFull.set(localPublicKeyRaw, authInfo.length + clientPublicKey.length);

  // IKM = HKDF(auth_secret, shared_secret, authInfo, 32)
  const authHkdfKey = await crypto.subtle.importKey("raw", clientAuth, "HKDF", false, ["deriveBits"]);
  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: sharedSecret, info: authInfoFull },
      authHkdfKey,
      256
    )
  );

  // CEK = HKDF(salt, prk, "Content-Encoding: aes128gcm\0", 16)
  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const prkKey = await crypto.subtle.importKey("raw", prk, "HKDF", false, ["deriveBits"]);
  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
      prkKey,
      128
    )
  );

  // Nonce = HKDF(salt, prk, "Content-Encoding: nonce\0", 12)
  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      prkKey,
      96
    )
  );

  // Add padding delimiter
  const paddedPlaintext = new Uint8Array(plaintext.length + 1);
  paddedPlaintext.set(plaintext, 0);
  paddedPlaintext[plaintext.length] = 2; // delimiter

  // Encrypt
  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPlaintext)
  );

  // Build aes128gcm header: salt (16) + rs (4) + idlen (1) + keyid (65) + ciphertext
  const rs = 4096;
  const header = new Uint8Array(16 + 4 + 1 + localPublicKeyRaw.length);
  header.set(salt, 0);
  new DataView(header.buffer).setUint32(16, rs);
  header[20] = localPublicKeyRaw.length;
  header.set(localPublicKeyRaw, 21);

  const encrypted = new Uint8Array(header.length + ciphertext.length);
  encrypted.set(header, 0);
  encrypted.set(ciphertext, header.length);

  return { encrypted, salt, localPublicKey: localPublicKeyRaw };
}

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check delivery window
    if (!isDeliveryWindow()) {
      return new Response(JSON.stringify({ message: "Outside delivery window" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString();

    // Get all subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("push_subscriptions")
      .select("*");

    if (subsError) throw subsError;
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;

    for (const sub of subs) {
      // Reset weekly counter if new week
      const subWeekStart = sub.week_start ? new Date(sub.week_start) : null;
      let weeklyCount = sub.notifications_this_week || 0;
      if (!subWeekStart || subWeekStart < weekStart) {
        weeklyCount = 0;
      }

      // Max 5 per week
      if (weeklyCount >= 5) continue;

      // At least 24h between sends
      if (sub.last_notified_at) {
        const lastSent = new Date(sub.last_notified_at);
        const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) continue;
      }

      // Probabilistic send: ~3-5 per week = target ~0.57 per day
      // With cron running every 2 hours during delivery window (~5 runs/day),
      // probability per run = ~0.57/5 = ~0.11
      if (Math.random() > 0.12) continue;

      // Get recent message indices (last 7 days) to avoid repeats
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: history } = await supabase
        .from("notification_history")
        .select("message_index")
        .eq("device_id", sub.device_id)
        .gte("sent_at", sevenDaysAgo);

      const recentIndices = (history || []).map((h: { message_index: number }) => h.message_index);
      const messageIndex = pickMessageIndex(recentIndices);
      const message = MESSAGES[messageIndex];

      const payload = JSON.stringify({
        title: "Luce 💛",
        body: message.body,
        type: message.type,
      });

      const result = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload
      );

      if (result.expired) {
        // Remove expired subscription
        await supabase.from("push_subscriptions").delete().eq("device_id", sub.device_id);
        continue;
      }

      // Record history and update subscription
      await supabase.from("notification_history").insert({
        device_id: sub.device_id,
        message_index: messageIndex,
      });

      await supabase
        .from("push_subscriptions")
        .update({
          last_notified_at: now.toISOString(),
          notifications_this_week: weeklyCount + 1,
          week_start: weekStartStr,
        })
        .eq("device_id", sub.device_id);

      sent++;
    }

    return new Response(JSON.stringify({ message: `Sent ${sent} notifications` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
