import { Sparkles, Flame } from "lucide-react";
import { useLightPoints } from "@/hooks/useLightPoints";
import { useStreak } from "@/hooks/useStreak";

interface FloatingStatsProps {
  onClick?: () => void;
}

const FloatingStats = ({ onClick }: FloatingStatsProps) => {
  const { total_points = 0 } = useLightPoints();
  const { current_streak } = useStreak();
  const streak = current_streak ?? 0;

  return (
    <button
      onClick={onClick}
      aria-label={`${total_points} Light Points, ${streak} day streak`}
      className="fixed top-3 right-3 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/60 backdrop-blur-md border border-primary/30 shadow-[0_0_20px_hsl(var(--primary)/0.35)] active:opacity-70 transition-opacity"
    >
      <span className="flex items-center gap-1">
        <Sparkles className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary tabular-nums">{total_points}</span>
      </span>
      <span className="w-px h-3 bg-primary/30" />
      <span className="flex items-center gap-1">
        <Flame className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-primary tabular-nums">{streak}</span>
      </span>
    </button>
  );
};

export default FloatingStats;
