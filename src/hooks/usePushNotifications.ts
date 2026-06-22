import { useCallback, useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { supabase } from "@/integrations/supabase/client";

const VAPID_PUBLIC_KEY =
  "BEzy9XbX5PrQalbKsXuDLZ9OT33rLhjTLk1dhyDhkk-QeI4In3pQkvcDP3DjUmVSxyba8Njd2pyjGiydRNS9fAA";

const isNative = Capacitor.isNativePlatform();

export interface ForegroundNotification {
  title: string;
  body: string;
}

function getDeviceId(): string {
  let id = localStorage.getItem("luce-device-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("luce-device-id", id);
  }
  return id;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function mapNativePermission(status: string): NotificationPermission {
  if (status === "granted") return "granted";
  if (status === "denied") return "denied";
  return "default";
}

async function registerTokenWithSupabase(token: string) {
  const { error } = await supabase.functions.invoke("register-device-token", {
    body: {
      device_id: getDeviceId(),
      platform: Capacitor.getPlatform(),
      token,
    },
  });
  if (error) console.error("[PushNotif] Supabase registration error:", error);
}

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    isNative
      ? "default"
      : typeof Notification !== "undefined"
        ? Notification.permission
        : "default",
  );
  // Initialize from localStorage so returning opted-in users start as subscribed
  // without needing to wait for the FCM registration event.
  const [isSubscribed, setIsSubscribed] = useState(
    localStorage.getItem("luce-notif-opted-in") === "true",
  );
  const [foregroundNotification, setForegroundNotification] =
    useState<ForegroundNotification | null>(null);

  const clearForegroundNotification = useCallback(() => {
    setForegroundNotification(null);
  }, []);

  useEffect(() => {
    console.log("[PushNotif] isNative:", isNative, "platform:", Capacitor.getPlatform());
    if (!isNative) {
      let swMessageHandler: ((event: MessageEvent) => void) | null = null;
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(console.error);

        // Surface tapped-notification content from the SW so the user can
        // re-read the message after the OS notification disappears.
        swMessageHandler = (event: MessageEvent) => {
          const d = event.data;
          if (d?.kind === "notification-click") {
            setForegroundNotification({
              title: d.title ?? "Luce",
              body: d.body ?? "",
            });
          }
        };
        navigator.serviceWorker.addEventListener("message", swMessageHandler);

        // Cold-start path: SW opened a new window with notif content in URL.
        try {
          const params = new URLSearchParams(window.location.search);
          const title = params.get("notifTitle");
          const body = params.get("notifBody");
          if (title || body) {
            setForegroundNotification({ title: title ?? "Luce", body: body ?? "" });
            params.delete("notifTitle");
            params.delete("notifBody");
            params.delete("notifType");
            const qs = params.toString();
            window.history.replaceState(
              {},
              "",
              window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash,
            );
          }
        } catch {
          // ignore
        }
      }
      checkWebSubscription();
      return () => {
        if (swMessageHandler && "serviceWorker" in navigator) {
          navigator.serviceWorker.removeEventListener("message", swMessageHandler);
        }
      };
    }

    let cancelled = false;
    let listenerHandles: Array<{ remove: () => Promise<void> }> = [];

    (async () => {
      console.log("[PushNotif] setting up listeners");
      const handles = await Promise.all([
        // Global registration listener — handles token refresh for returning opted-in users
        // on subsequent app launches. The initial opt-in registration is handled directly
        // inside subscribeNative() to avoid depending on whether Firebase re-fires the event
        // for a cached token (it may not on Android when the token hasn't changed).
        PushNotifications.addListener("registration", async (token) => {
          const hasOptedIn = localStorage.getItem("luce-notif-opted-in") === "true";
          console.log("[PushNotif] global registration event — opted-in:", hasOptedIn, "token:", token.value.slice(0, 20));
          if (!hasOptedIn) return;
          await registerTokenWithSupabase(token.value);
          setIsSubscribed(true);
        }),

        PushNotifications.addListener("registrationError", (err) => {
          console.error("[PushNotif] registration error:", err);
        }),

        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          setForegroundNotification({
            title: notification.title ?? "Luce",
            body: notification.body ?? "",
          });
        }),

        PushNotifications.addListener("pushNotificationActionPerformed", () => {
          // User tapped a background notification — nothing extra needed for now
        }),
      ]);

      if (cancelled) {
        handles.forEach((h) => h.remove());
        return;
      }
      listenerHandles = handles;

      console.log("[PushNotif] checking permissions");
      const status = await PushNotifications.checkPermissions();
      console.log("[PushNotif] permission status:", status.receive);
      const perm = mapNativePermission(status.receive);
      setPermission(perm);
      // Call register() when permission is already granted (returning user) so the global
      // listener above can refresh the FCM/APNs token with Supabase.
      if (perm === "granted") {
        console.log("[PushNotif] permission granted, calling register() for token refresh");
        await PushNotifications.register();
      }
    })();

    return () => {
      cancelled = true;
      listenerHandles.forEach((h) => h.remove());
    };
  }, []);

  async function checkWebSubscription() {
    try {
      const reg = await navigator.serviceWorker?.ready;
      const sub = await reg?.pushManager?.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      // not supported
    }
  }

  async function subscribe() {
    return isNative ? subscribeNative() : subscribeWeb();
  }

  async function subscribeNative(): Promise<boolean> {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (
        permStatus.receive === "prompt" ||
        permStatus.receive === "prompt-with-rationale"
      ) {
        // iOS shows system dialog here. Android 12 skips this (POST_NOTIFICATIONS
        // didn't exist yet); Android 13+ shows the system dialog.
        permStatus = await PushNotifications.requestPermissions();
      }
      const perm = mapNativePermission(permStatus.receive);
      setPermission(perm);
      if (perm !== "granted") return false;

      localStorage.setItem("luce-notif-opted-in", "true");
      setIsSubscribed(true);

      // Set up a one-shot listener BEFORE calling register() so we're guaranteed
      // to capture the token even if Firebase returns it synchronously from cache.
      // On Android, Firebase may have fired onNewToken at app startup (which our
      // global listener rejected since opted-in was false at the time), and may
      // not re-fire if the token is unchanged — so we can't rely on the global
      // listener to deliver the token for the initial opt-in.
      let resolveToken!: (t: string) => void;
      let rejectToken!: (e: Error) => void;
      const tokenPromise = new Promise<string>((res, rej) => {
        resolveToken = res;
        rejectToken = rej;
      });
      const timeout = setTimeout(
        () => rejectToken(new Error("FCM registration timed out")),
        15000,
      );
      const handle = await PushNotifications.addListener("registration", (t) => {
        clearTimeout(timeout);
        resolveToken(t.value);
      });

      await PushNotifications.register();
      const token = await tokenPromise;
      await handle.remove();

      console.log("[PushNotif] subscribeNative: registering token with Supabase");
      await registerTokenWithSupabase(token);
      return true;
    } catch (err) {
      console.error("[PushNotif] subscribeNative failed:", err);
      localStorage.removeItem("luce-notif-opted-in");
      setIsSubscribed(false);
      return false;
    }
  }

  async function subscribeWeb() {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          .buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();
      const deviceId = getDeviceId();

      await supabase.functions.invoke("register-device-token", {
        body: {
          device_id: deviceId,
          platform: "web",
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys!.p256dh!,
          auth: subJson.keys!.auth!,
        },
      });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("[PushNotif] subscribeWeb failed:", err);
      return false;
    }
  }

  return {
    permission,
    isSubscribed,
    subscribe,
    foregroundNotification,
    clearForegroundNotification,
  };
}
