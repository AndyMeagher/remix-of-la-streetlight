import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { playLuceSound } from "@/hooks/useLuceSound";
import luceMascot from "@/assets/luce-mascot.png";

const LuceNotificationPrompt = () => {
  const { permission, isSubscribed, subscribe } = usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (isSubscribed || permission === "denied") return;
    const dismissed = localStorage.getItem("luce-notif-dismissed");
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10);
      // Show again after 3 days
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) return;
    }
    // Delay showing prompt so it doesn't compete with welcome modal
    const timer = setTimeout(() => {
      setVisible(true);
      playLuceSound();
    }, 8000);
    return () => clearTimeout(timer);
  }, [isSubscribed, permission]);

  const dismiss = () => {
    setFadeOut(true);
    setTimeout(() => {
      setVisible(false);
      localStorage.setItem("luce-notif-dismissed", Date.now().toString());
    }, 300);
  };

  const handleSubscribe = async () => {
    await subscribe();
    setFadeOut(true);
    setTimeout(() => setVisible(false), 300);
  };

  if (!visible || typeof Notification === "undefined") return null;

  return (
    <div
      className={`fixed bottom-20 left-4 right-4 max-w-lg mx-auto z-40 transition-all duration-300 ${
        fadeOut ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
      }`}
    >
      <div className="bg-card border border-border rounded-2xl p-4 shadow-lg">
        <button onClick={dismiss} className="absolute top-3 right-3 text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-start gap-3">
          <img
            src={luceMascot}
            alt="Luce"
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-sm text-foreground font-medium mb-1">
              Want me to check in sometimes? 💛
            </p>
            <p className="text-xs text-muted-foreground mb-3">
              I'll send a few gentle messages a week — encouragement, reminders, and tips from the community. No spam, ever.
            </p>
            <button
              onClick={handleSubscribe}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-xs font-semibold active:opacity-90 transition-opacity"
            >
              <Bell className="w-3.5 h-3.5" />
              Yeah, check in on me
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LuceNotificationPrompt;
