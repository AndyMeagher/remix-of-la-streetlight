import { useState } from "react";
import { Sparkles, Share2, Copy, Check } from "lucide-react";
import { useLightPoints, awardLightPoints } from "@/hooks/useLightPoints";

const LightPointsBadge = () => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { total_points = 0, today_points = 0, referral_code } = useLightPoints();

  const referralUrl = referral_code
    ? `${window.location.origin}/?ref=${referral_code}`
    : "";

  const handleShare = async () => {
    if (!referralUrl) return;
    const shareData = {
      title: "LA Streetlight",
      text: "A no-judgment app to find food, shelter, and support in LA. You're not alone 💛",
      url: referralUrl,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        await awardLightPoints("referral_share");
      } else {
        await navigator.clipboard.writeText(referralUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        await awardLightPoints("referral_share");
      }
    } catch {
      /* user cancelled */
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 bg-primary/15 border border-primary/30 rounded-full px-2.5 py-1 active:opacity-70 transition-opacity"
        aria-label={`${total_points} Light Points`}
      >
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary">{total_points}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-t-2xl sm:rounded-2xl p-5 w-full max-w-sm mx-0 sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-display text-lg text-foreground">Your Light</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Every step you take to care for yourself adds light. No competition — just you, glowing.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="bg-secondary border border-border rounded-xl p-3 text-center">
                <div className="text-2xl font-display text-primary">{total_points}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Lifetime</div>
              </div>
              <div className="bg-secondary border border-border rounded-xl p-3 text-center">
                <div className="text-2xl font-display text-primary">{today_points}</div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Today</div>
              </div>
            </div>

            <h3 className="text-xs font-semibold text-foreground mb-2">Ways to earn light</h3>
            <ul className="text-xs text-muted-foreground space-y-1 mb-5">
              <li>· Open the app each day → +5</li>
              <li>· View a resource (up to 5/day) → +1 each</li>
              <li>· Share a tip → +10</li>
              <li>· Share Streetlight with someone → +25</li>
              <li>· When they install it → +50</li>
            </ul>

            <h3 className="text-xs font-semibold text-foreground mb-2">Pass the light on</h3>
            <div className="flex gap-2 mb-3">
              <button
                onClick={handleShare}
                disabled={!referralUrl}
                className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground rounded-lg py-2 text-xs font-semibold disabled:opacity-40"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
              <button
                onClick={copyLink}
                disabled={!referralUrl}
                className="flex-1 flex items-center justify-center gap-1.5 bg-secondary border border-border text-foreground rounded-lg py-2 text-xs font-semibold disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="w-full text-xs text-muted-foreground py-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default LightPointsBadge;
