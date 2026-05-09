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
  { body: "I hope you find your people.", type: "encouragement" },
  { body: "You've been through a lot.. It makes sense that trusting people is hard.", type: "encouragement" },
];

const ENCOURAGEMENT_INDICES = MESSAGES.map((m, i) => m.type === "encouragement" ? i : -1).filter(i => i >= 0);
const COMMUNITY_INDICES = MESSAGES.map((m, i) => m.type === "community" ? i : -1).filter(i => i >= 0);

function pickMessageIndex(excludeIndices: number[]): number {
  const roll = Math.random();
  const pool = roll < 0.75 ? ENCOURAGEMENT_INDICES : COMMUNITY_INDICES;
  const available = pool.filter(i => !excludeIndices.includes(i));
  if (available.length === 0) {
    const allAvailable = MESSAGES.map((_, i) => i).filter(i => !excludeIndices.includes(i));
    if (allAvailable.length === 0) return Math.floor(Math.random() * MESSAGES.length);
    return allAvailable[Math.floor(Math.random() * allAvailable.length)];
  }
  return available[Math.floor(Math.random() * available.length)];
}

function isDeliveryWindow(): boolean {
  const now = new Date();
  const ptOffset = -7;
  const ptHour = (now.getUTCHours() + ptOffset + 24) % 24;
  return ptHour >= 10 && ptHour < 22;
}

// ─── Base64url helpers ───

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

// ─── Web Push (VAPID) ───

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

async function encryptPayload(
  p256dhKey: string,
  authSecret: string,
  plaintext: Uint8Array
): Promise<{ encrypted: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const clientPublicKey = base64UrlDecode(p256dhKey);
  const clientAuth = base64UrlDecode(authSecret);

  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  const localPublicKeyRaw = new Uint8Array(
    await crypto.subtle.exportKey("raw", localKeyPair.publicKey)
  );

  const clientKey = await crypto.subtle.importKey(
    "raw",
    clientPublicKey.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: clientKey },
      localKeyPair.privateKey,
      256
    )
  );

  const salt = crypto.getRandomValues(new Uint8Array(16));

  const authInfo = new TextEncoder().encode("WebPush: info\0");
  const authInfoFull = new Uint8Array(authInfo.length + clientPublicKey.length + localPublicKeyRaw.length);
  authInfoFull.set(authInfo, 0);
  authInfoFull.set(clientPublicKey, authInfo.length);
  authInfoFull.set(localPublicKeyRaw, authInfo.length + clientPublicKey.length);

  const authHkdfKey = await crypto.subtle.importKey(
    "raw",
    clientAuth.buffer as ArrayBuffer,
    "HKDF",
    false,
    ["deriveBits"]
  );
  const prk = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt: sharedSecret, info: authInfoFull },
      authHkdfKey,
      256
    )
  );

  const cekInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\0");
  const prkKey = await crypto.subtle.importKey("raw", prk, "HKDF", false, ["deriveBits"]);
  const cek = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: cekInfo },
      prkKey,
      128
    )
  );

  const nonceInfo = new TextEncoder().encode("Content-Encoding: nonce\0");
  const nonce = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "HKDF", hash: "SHA-256", salt, info: nonceInfo },
      prkKey,
      96
    )
  );

  const paddedPlaintext = new Uint8Array(plaintext.length + 1);
  paddedPlaintext.set(plaintext, 0);
  paddedPlaintext[plaintext.length] = 2;

  const aesKey = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, aesKey, paddedPlaintext)
  );

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

async function sendWebPush(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: string
): Promise<{ expired: boolean; status?: number }> {
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;

  const rawPrivateKey = base64UrlDecode(vapidPrivateKey);
  const rawPublicKey = base64UrlDecode(vapidPublicKey);

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

  const { encrypted } = await encryptPayload(
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
    return { expired: true };
  }

  return { expired: false, status: response.status };
}

// ─── APNs (iOS) Push ───

async function createApnsJwt(): Promise<string> {
  const keyId = Deno.env.get("APNS_KEY_ID")!;
  const teamId = Deno.env.get("APNS_TEAM_ID")!;
  const privateKeyPem = Deno.env.get("APNS_KEY")!;

  // Parse the .p8 PEM key
  const pemContents = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const keyData = base64UrlDecode(
    pemContents.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
  );

  const key = await crypto.subtle.importKey(
    "pkcs8",
    keyData.buffer as ArrayBuffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const header = { alg: "ES256", kid: keyId };
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: teamId, iat: now };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const claimsB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(claims)));
  const unsignedToken = `${headerB64}.${claimsB64}`;

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    new TextEncoder().encode(unsignedToken)
  );

  return `${unsignedToken}.${base64UrlEncode(new Uint8Array(signature))}`;
}

async function sendApnsPush(
  deviceToken: string,
  payload: string,
  bundleId: string
): Promise<{ expired: boolean; status?: number }> {
  const jwt = await createApnsJwt();

  // Use production APNs endpoint
  const url = `https://api.push.apple.com/3/device/${deviceToken}`;

  const apnsPayload = JSON.parse(payload);
  const iosPayload = JSON.stringify({
    aps: {
      alert: {
        title: apnsPayload.title,
        body: apnsPayload.body,
      },
      sound: "default",
      "mutable-content": 1,
    },
    type: apnsPayload.type,
  });

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `bearer ${jwt}`,
        "apns-topic": bundleId,
        "apns-push-type": "alert",
        "apns-priority": "5",
        "apns-expiration": "0",
        "Content-Type": "application/json",
      },
      body: iosPayload,
    });

    // 410 Gone = token is no longer valid
    if (response.status === 410) {
      await response.text();
      return { expired: true };
    }

    // 400 BadDeviceToken
    if (response.status === 400) {
      const body = await response.text();
      try {
        const parsed = JSON.parse(body);
        if (parsed.reason === "BadDeviceToken" || parsed.reason === "Unregistered") {
          return { expired: true };
        }
        console.error("APNs 400 unexpected reason:", parsed.reason, body);
      } catch { console.error("APNs 400 non-JSON body:", body); }
      return { expired: false, status: 400 };
    }

    return { expired: false, status: response.status };
  } catch (err) {
    console.error("APNs send error:", err);
    return { expired: false, status: 500 };
  }
}

// ─── Firebase Cloud Messaging (Android) ───

function pemToBytes(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function sendFcmPush(
  token: string,
  payload: string,
): Promise<{ expired: boolean; status?: number }> {
  const serviceAccountJson = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON")!;
  const sa = JSON.parse(serviceAccountJson);

  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claims = base64UrlEncode(new TextEncoder().encode(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })));
  const sigInput = `${header}.${claims}`;

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    pemToBytes(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBytes = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", cryptoKey, new TextEncoder().encode(sigInput));
  const jwt = `${sigInput}.${base64UrlEncode(new Uint8Array(sigBytes))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const { access_token } = await tokenRes.json();

  const msg = JSON.parse(payload);
  const fcmRes = await fetch(
    `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: msg.title, body: msg.body },
          data: { type: msg.type ?? "encouragement" },
          android: {
            notification: {
              icon: "ic_launcher",
              color: "#FFD700",
              channel_id: "luce_notifications",
            },
          },
        },
      }),
    },
  );

  const status = fcmRes.status;
  if (status === 404 || status === 410) return { expired: true, status };
  return { expired: false, status };
}

// ─── Main handler ───

Deno.serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!isDeliveryWindow()) {
      return new Response(JSON.stringify({ message: "Outside delivery window" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();

    // ── Active scheduled campaign (LA date) ──
    const laTodayStr = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Los_Angeles",
      year: "numeric", month: "2-digit", day: "2-digit",
    }).format(now); // YYYY-MM-DD

    const { data: activeCampaigns } = await supabase
      .from("scheduled_campaigns")
      .select("id, name, start_date, end_date")
      .eq("active", true)
      .lte("start_date", laTodayStr)
      .gte("end_date", laTodayStr)
      .limit(1);

    let activeCampaign: { id: string; name: string; start_date: string; end_date: string } | null =
      activeCampaigns && activeCampaigns.length > 0 ? activeCampaigns[0] : null;
    let campaignMessages: Array<{ title: string; body: string }> = [];

    if (activeCampaign) {
      const { data: msgs } = await supabase
        .from("campaign_messages")
        .select("title, body")
        .eq("campaign_id", activeCampaign.id);
      campaignMessages = msgs ?? [];
      if (campaignMessages.length === 0) {
        console.log(`Campaign "${activeCampaign.name}" active but has no messages — skipping campaign mode.`);
        activeCampaign = null;
      } else {
        console.log(`Active campaign: "${activeCampaign.name}" with ${campaignMessages.length} messages.`);
      }
    }

    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekStartStr = weekStart.toISOString();

    // Get all device tokens
    const { data: devices, error: devicesError } = await supabase
      .from("device_tokens")
      .select("*");

    if (devicesError) throw devicesError;

    // Also get legacy push_subscriptions for backward compatibility
    const { data: legacySubs } = await supabase
      .from("push_subscriptions")
      .select("*");

    // Build unified list
    interface DeviceEntry {
      device_id: string;
      platform: "web" | "ios" | "android";
      token: string;
      p256dh: string | null;
      auth: string | null;
      last_notified_at: string | null;
      notifications_this_week: number;
      week_start: string | null;
    }

    const allDevices: DeviceEntry[] = [];

    // Add devices from new table
    if (devices) {
      for (const d of devices) {
        allDevices.push({
          device_id: d.device_id,
          platform: d.platform as "web" | "ios",
          token: d.token,
          p256dh: d.p256dh,
          auth: d.auth,
          last_notified_at: null, // will check notification_history
          notifications_this_week: 0,
          week_start: null,
        });
      }
    }

    // Add legacy web subscriptions (if not already in device_tokens)
    if (legacySubs) {
      const deviceTokenIds = new Set(allDevices.map(d => d.device_id));
      for (const sub of legacySubs) {
        if (!deviceTokenIds.has(sub.device_id)) {
          allDevices.push({
            device_id: sub.device_id,
            platform: "web",
            token: sub.endpoint,
            p256dh: sub.p256dh,
            auth: sub.auth,
            last_notified_at: sub.last_notified_at,
            notifications_this_week: sub.notifications_this_week || 0,
            week_start: sub.week_start,
          });
        }
      }
    }

    console.log(`Found ${allDevices.length} total devices`);

    if (allDevices.length === 0) {
      return new Response(JSON.stringify({ message: "No subscribers" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the iOS bundle ID from request body or use default
    let bundleId = "com.lastreetlight.lastreetlight";
    try {
      const body = await req.json();
      if (body?.bundleId) bundleId = body.bundleId;
    } catch { /* no body, use default */ }

    console.log(`Using bundle ID: ${bundleId}`);

    let sent = 0;

    for (const device of allDevices) {
      console.log(`Processing device ${device.device_id} (platform: ${device.platform}, token: ${device.token.slice(0, 20)}...)`);

      // Get rate-limiting info from notification_history
      const { data: recentHistory } = await supabase
        .from("notification_history")
        .select("sent_at, message_index")
        .eq("device_id", device.device_id)
        .gte("sent_at", weekStartStr)
        .order("sent_at", { ascending: false });

      const weeklyCount = recentHistory?.length || 0;
      console.log(`  Weekly count: ${weeklyCount}, last sent: ${recentHistory?.[0]?.sent_at ?? "never"}`);

      // Max 5 per week
      if (weeklyCount >= 5) continue;

      // At least 24h between sends
      if (recentHistory && recentHistory.length > 0) {
        const lastSent = new Date(recentHistory[0].sent_at);
        const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) continue;
      }

      // Also check legacy field for web devices
      if (device.last_notified_at) {
        const lastSent = new Date(device.last_notified_at);
        const hoursSince = (now.getTime() - lastSent.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) continue;
      }

      // ── Campaign delivery (takes precedence, bypasses 40% gate) ──
      if (activeCampaign) {
        const { data: alreadyGot } = await supabase
          .from("notification_history")
          .select("id")
          .eq("device_id", device.device_id)
          .eq("campaign_id", activeCampaign.id)
          .gte("sent_at", activeCampaign.start_date)
          .limit(1);

        if (!alreadyGot || alreadyGot.length === 0) {
          const pick = campaignMessages[Math.floor(Math.random() * campaignMessages.length)];
          const campaignPayload = JSON.stringify({
            title: pick.title || "Luce",
            body: pick.body,
            type: "encouragement",
          });

          let cResult: { expired: boolean; status?: number };
          try {
            if (device.platform === "ios") {
              cResult = await sendApnsPush(device.token, campaignPayload, bundleId);
            } else if (device.platform === "android") {
              cResult = await sendFcmPush(device.token, campaignPayload);
            } else {
              if (!device.p256dh || !device.auth) continue;
              cResult = await sendWebPush(
                { endpoint: device.token, p256dh: device.p256dh, auth: device.auth },
                campaignPayload,
              );
            }
          } catch (err) {
            console.error(`  Campaign send failed for ${device.device_id}:`, err);
            continue;
          }

          if (cResult.expired) {
            await supabase.from("device_tokens").delete().eq("device_id", device.device_id);
            await supabase.from("push_subscriptions").delete().eq("device_id", device.device_id);
            continue;
          }
          if (cResult.status && cResult.status >= 400) continue;

          await supabase.from("notification_history").insert({
            device_id: device.device_id,
            message_index: -1, // sentinel: campaign message, not pool index
            campaign_id: activeCampaign.id,
          });

          if (device.platform === "web") {
            await supabase
              .from("push_subscriptions")
              .update({
                last_notified_at: now.toISOString(),
                notifications_this_week: weeklyCount + 1,
                week_start: weekStartStr,
              })
              .eq("device_id", device.device_id);
          }

          sent++;
          continue; // skip the regular pool send for this device this run
        }
      }

      // Probabilistic send: ~0.40 chance per cron run (40%)
      if (Math.random() > 0.40) continue;


      // Get recent message indices (last 7 days) to avoid repeats
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: history } = await supabase
        .from("notification_history")
        .select("message_index")
        .eq("device_id", device.device_id)
        .gte("sent_at", sevenDaysAgo);

      const recentIndices = (history || []).map((h: { message_index: number }) => h.message_index);
      const messageIndex = pickMessageIndex(recentIndices);
      const message = MESSAGES[messageIndex];

      console.log(`  Sending message index ${messageIndex}: "${message.body.slice(0, 40)}..."`);

      const payload = JSON.stringify({
        title: "Luce",
        body: message.body,
        type: message.type,
      });

      let result: { expired: boolean; status?: number };

      try {
        if (device.platform === "ios") {
          console.log(`  Sending APNs push to token ${device.token.slice(0, 20)}...`);
          result = await sendApnsPush(device.token, payload, bundleId);
          console.log(`  APNs result: status=${result.status}, expired=${result.expired}`);
        } else if (device.platform === "android") {
          console.log(`  Sending FCM push to token ${device.token.slice(0, 20)}...`);
          result = await sendFcmPush(device.token, payload);
          console.log(`  FCM result: status=${result.status}, expired=${result.expired}`);
        } else {
          // Web push
          if (!device.p256dh || !device.auth) {
            console.warn(`  Skipping web device ${device.device_id}: missing p256dh or auth`);
            continue;
          }
          console.log(`  Sending web push to endpoint ${device.token.slice(0, 40)}...`);
          result = await sendWebPush(
            { endpoint: device.token, p256dh: device.p256dh, auth: device.auth },
            payload
          );
          console.log(`  Web push result: status=${result.status}, expired=${result.expired}`);
        }
      } catch (err) {
        console.error(`  Failed to send to ${device.device_id} (${device.platform}):`, err);
        continue;
      }

      if (result.expired) {
        console.log(`  Token expired, removing device ${device.device_id}`);
        await supabase.from("device_tokens").delete().eq("device_id", device.device_id);
        await supabase.from("push_subscriptions").delete().eq("device_id", device.device_id);
        continue;
      }

      if (result.status && result.status >= 400) {
        console.error(`  Non-success status ${result.status} for device ${device.device_id}, not recording history`);
        continue;
      }

      // Record history
      console.log(`  Recording notification history for device ${device.device_id}`);
      await supabase.from("notification_history").insert({
        device_id: device.device_id,
        message_index: messageIndex,
      });

      // Update legacy push_subscriptions if applicable
      if (device.platform === "web") {
        await supabase
          .from("push_subscriptions")
          .update({
            last_notified_at: now.toISOString(),
            notifications_this_week: weeklyCount + 1,
            week_start: weekStartStr,
          })
          .eq("device_id", device.device_id);
      }

      sent++;
    }

    console.log(`Done. Sent ${sent} notifications.`);
    return new Response(JSON.stringify({ message: `Sent ${sent} notifications` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Notification function error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
