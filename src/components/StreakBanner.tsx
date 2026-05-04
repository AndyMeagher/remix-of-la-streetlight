import { Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";

const StreakBanner = () => {
  const { current_streak } = useStreak();
  const streak = current_streak ?? 0;

  const message =
    streak <= 1
      ? "You showed up today 💛"
      : `You're on a ${streak}-day streak`;

  const sub =
    streak <= 1
      ? "That matters. Glad you're here."
      : "One day at a time. Proud of you.";

  return (
    <div className="mb-5 flex items-center gap-3 bg-primary/10 border border-primary/25 rounded-xl px-3 py-2.5">
      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
        <Flame className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display text-foreground leading-tight">{message}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  );
};

export default StreakBanner;
