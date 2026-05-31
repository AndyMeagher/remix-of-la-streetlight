import { useState, useEffect } from "react";
import { Bell, X, Share } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { playLuceSound } from "@/hooks/useLuceSound";
import luceMascot from "@/assets/luce-mascot.png";

// ── Constants ──────────────────────────────────────────────
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24h (was 3 days)
const MAX_DISMISSALS = 3;
const INITIAL_DELAY_MS = 8000;
const APP_OPENS_KEY = "luce-app-opens";
const DISMISS_COUNT_KEY = "luce-notif-dismiss-count";
const DISMISS_AT_KEY = "luce-notif-dismissed";
const VALUE_MOMENT_KEY = "luce-notif-value-moment";

// Dispatch a "value moment" — call from anywhere in the app after the user
// experiences something positive (saving a resource, completing a tip, etc.).
// The prompt will re-evaluate and may surface.
export function triggerLuceNotifValueMoment() {
  localStorage.setItem(VALUE_MOMENT_KEY, Date.now().toString());
  window.dispatchEvent(new CustomEvent("luce-notif-value-moment"));
}

// ── Environment detection ─────────────────────────────────
function isIOSSafariNonStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  if (!isIOS) return false;
  // Chrome / Firefox / Edge on iOS — push still unsupported in non-standalone
  // but the "Add to Home Screen" instructions are Safari-specific.
  const isSafari = /^((?!chrome|android|crios|fxios|edgios).)*safari/i.test(ua);
  const isStandalone =
    (window.navigator as any).standalone === true ||
    window.matchMedia?.("(display-mode: standalone)").matches;
  return isSafari && !isStandalone;
}

function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

// ── Component ──────────────────────────────────────────────
const LuceNotificationPrompt = () => {
  const {
    permission,
    isSubscribed,
    subscribe,
    foregroundNotification,
    clearForegroundNotification,
  } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const [notifFadeOut, setNotifFadeOut] = useState(false);
  const [variant, setVariant] = useState<"subscribe" | "install-ios">("subscribe");

  // Track app opens (per session) for value-moment trigger
  useEffect(() => {
    const count = parseInt(localStorage.getItem(APP_OPENS_KEY) || "0", 10) + 1;
    localStorage.setItem(APP_OPENS_KEY, count.toString());
  }, []);

  // Subscription prompt visibility logic
  useEffect(() => {
    const evaluate = (delayMs: number) => {
      if (isSubscribed || permission === "denied") return undefined;

      // Cap at MAX_DISMISSALS total before going quiet permanently
      const dismissCount = parseInt(
        localStorage.getItem(DISMISS_COUNT_KEY) || "0",
        10,
      );
      if (dismissCount >= MAX_DISMISSALS) return undefined;

      // Respect 24h cooldown after last dismissal
      const dismissedAt = parseInt(
        localStorage.getItem(DISMISS_AT_KEY) || "0",
        10,
      );
      if (dismissedAt && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS) {
        return undefined;
      }

      // Decide variant: iOS Safari (non-standalone) gets install instructions
      // instead of the (unsupported) push prompt
      const needsInstall = isIOSSafariNonStandalone() || !pushSupported();
      setVariant(needsInstall ? "install-ios" : "subscribe");

      const timer = setTimeout(() => {
        setVisible(true);
        setFadeOut(false);
        playLuceSound();
      }, delayMs);
      return () => clearTimeout(timer);
    };

    // Initial delayed eval on mount / state change
    const cleanup = evaluate(INITIAL_DELAY_MS);

    // Re-evaluate immediately when a value moment fires (e.g. after saving
    // a resource). Short delay so the success UI lands first.
    const onValueMoment = () => {
      evaluate(1500);
    };
    window.addEventListener("luce-notif-value-moment", onValueMoment);

    // Auto value moment: 3rd or later app open
    const opens = parseInt(localStorage.getItem(APP_OPENS_KEY) || "0", 10);
    if (opens >= 3) {
      // Treat repeat visits as a value moment too
      const lastAuto = parseInt(
        localStorage.getItem("luce-notif-last-auto") || "0",
        10,
      );
      if (Date.now() - lastAuto > DISMISS_COOLDOWN_MS) {
        localStorage.setItem("luce-notif-last-auto", Date.now().toString());
      }
    }

    return () => {
      cleanup?.();
      window.removeEventListener("luce-notif-value-moment", onValueMoment);
    };
  }, [isSubscribed, permission]);

  // Auto-dismiss foreground notification after 10 s
  useEffect(() => {
    if (!foregroundNotification) {
      setNotifFadeOut(false);
      return;
    }
    const fadeTimer = setTimeout(() => setNotifFadeOut(true), 9700);
    const clearTimer = setTimeout(clearForegroundNotification, 10000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [foregroundNotification, clearForegroundNotification]);

  const dismissPrompt = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      const count = parseInt(
        localStorage.getItem(DISMISS_COUNT_KEY) || "0",
        10,
      );
      localStorage.setItem(DISMISS_COUNT_KEY, (count + 1).toString());
      localStorage.setItem(DISMISS_AT_KEY, Date.now().toString());
    }, 300);
  };

  const handleSubscribe = async () => {
    await subscribe();
    setFadeOut(true);
    setTimeout(() => setVisible(false), 300);
  };

  const dismissNotif = () => {
    setNotifFadeOut(true);
    setTimeout(clearForegroundNotification, 300);
  };

  return (
    <>
      {/* ── Foreground push notification banner ── */}
      {foregroundNotification && (
        <div
          className={`fixed top-4 left-4 right-4 max-w-lg mx-auto z-50 transition-all duration-300 ${
            notifFadeOut
              ? "opacity-0 -translate-y-2"
              : "opacity-100 translate-y-0"
          }`}
        >
          <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
            <button
              onClick={dismissNotif}
              className="absolute top-3 right-3 text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <img
                src={luceMascot}
                alt="Luce"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 pr-4">
                <p className="text-sm text-foreground font-medium mb-1">
                  {foregroundNotification.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {foregroundNotification.body}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Subscription / install prompt ── */}
      {visible && (
        <div
          className={`fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 transition-all duration-300 ${
            fadeOut ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
          }`}
        >
          <div className="bg-card border border-border rounded-2xl p-4 shadow-lg relative">
            <button
              onClick={dismissPrompt}
              className="absolute top-3 right-3 text-muted-foreground"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <img
                src={luceMascot}
                alt="Luce"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 pr-4">
                {variant === "subscribe" ? (
                  <>
                    <p className="text-sm text-foreground font-medium mb-1">
                      Want me to check in sometimes? 💛
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      I'll send a few gentle messages a week — encouragement,
                      reminders, and tips from the community. No spam, ever.
                    </p>
                    <button
                      onClick={handleSubscribe}
                      className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold active:opacity-90 transition-opacity"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      Yeah, check in on me
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-foreground font-medium mb-1">
                      Add me to your home screen 💛
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      To get gentle check-ins from me on your iPhone, tap{" "}
                      <Share className="inline w-3.5 h-3.5 -mt-0.5" />{" "}
                      <span className="font-semibold">Share</span> in Safari,
                      then <span className="font-semibold">Add to Home Screen</span>.
                      Open me from there and I can message you.
                    </p>
                    <button
                      onClick={dismissPrompt}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold active:opacity-90 transition-opacity"
                    >
                      Got it
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LuceNotificationPrompt;
