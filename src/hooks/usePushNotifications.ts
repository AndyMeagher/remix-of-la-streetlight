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

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>(
    isNative
      ? "default"
      : typeof Notification !== "undefined"
        ? Notification.permission
        : "default",
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [foregroundNotification, setForegroundNotification] =
    useState<ForegroundNotification | null>(null);

  const clearForegroundNotification = useCallback(() => {
    setForegroundNotification(null);
  }, []);

  useEffect(() => {
    console.log("[PushNotif] isNative:", isNative, "platform:", Capacitor.getPlatform());
    if (isNative) {
      let cancelled = false;
      let listenerHandles: Array<{ remove: () => Promise<void> }> = [];

      (async () => {
        console.log("[PushNotif] setting up listeners");
        // Register listeners before checking permission so we never miss the registration event
        const handles = await Promise.all([
          PushNotifications.addListener("registration", async (token) => {
            console.log("[PushNotif] registration token received:", token.value.slice(0, 20));
            const platform = Capacitor.getPlatform();
            // On Android, Firebase fires this event automatically on startup before the user
            // has granted POST_NOTIFICATIONS permission. Skip until they actually grant it.
            if (platform === "android") {
              const status = await PushNotifications.checkPermissions();
              console.log("[PushNotif] android display permission on registration:", status.receive);
              if (status.receive !== "granted") return;
            }
            const deviceId = getDeviceId();
            await supabase.functions.invoke("register-device-token", {
              body: {
                device_id: deviceId,
                platform,
                token: token.value,
              },
            });
            setIsSubscribed(true);
          }),

          PushNotifications.addListener("registrationError", (err) => {
            console.error("[PushNotif] registration error:", err);
          }),

          PushNotifications.addListener(
            "pushNotificationReceived",
            (notification) => {
              // App is foregrounded — system won't show a banner, so we display in-app
              setForegroundNotification({
                title: notification.title ?? "Luce 💛",
                body: notification.body ?? "",
              });
            },
          ),

          PushNotifications.addListener(
            "pushNotificationActionPerformed",
            () => {
              // User tapped a background notification — nothing extra needed for now
            },
          ),
        ]);

        if (cancelled) {
          handles.forEach((h) => h.remove());
          return;
        }
        listenerHandles = handles;

        // If permission already granted, re-register to refresh the token
        console.log("[PushNotif] checking permissions");
        const status = await PushNotifications.checkPermissions();
        console.log("[PushNotif] permission status:", status.receive);
        const perm = mapNativePermission(status.receive);
        setPermission(perm);
        if (perm === "granted") {
          console.log("[PushNotif] permission granted, calling register()");
          await PushNotifications.register();
          console.log("[PushNotif] register() called");
        } else {
          console.log("[PushNotif] permission not granted, skipping register(). mapped perm:", perm);
        }
      })();

      return () => {
        cancelled = true;
        listenerHandles.forEach((h) => h.remove());
      };
    } else {
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("/sw.js").catch(console.error);
      }
      checkWebSubscription();
    }
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

  async function subscribeNative() {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (
        permStatus.receive === "prompt" ||
        permStatus.receive === "prompt-with-rationale"
      ) {
        permStatus = await PushNotifications.requestPermissions();
      }
      const perm = mapNativePermission(permStatus.receive);
      setPermission(perm);
      if (perm !== "granted") return false;

      // The "registration" listener will fire and store the token + set isSubscribed
      await PushNotifications.register();
      return true;
    } catch (err) {
      console.error("Native push subscription failed:", err);
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
      console.error("Push subscription failed:", err);
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
