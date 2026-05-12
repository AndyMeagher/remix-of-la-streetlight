import { useEffect, useMemo, useState } from "react";
import { Check, Lock, Sparkles } from "lucide-react";
import { awardLightPoints } from "@/hooks/useLightPoints";
import { toast } from "@/hooks/use-toast";

type Category = "foundation" | "documents" | "wellness" | "independence" | "education";

interface Milestone {
  id: string;
  title: string;
  description: string;
  category: Category;
}

const MILESTONES: Milestone[] = [
  { id: "safety", title: "Safety", description: "I have a safe place to sleep", category: "foundation" },
  { id: "state_id", title: "State ID", description: "I have a California State ID or Driver's License", category: "documents" },
  { id: "ssn", title: "Social Security Card", description: "My SSN card is secured", category: "documents" },
  { id: "birth_cert", title: "Birth Certificate", description: "I have a copy of my birth certificate", category: "documents" },
  { id: "health", title: "Health Coverage", description: "I'm enrolled in Medi-Cal or health insurance", category: "wellness" },
  { id: "mentor", title: "Found a Mentor", description: "I have a trusted adult in my corner", category: "wellness" },
  { id: "bank", title: "Bank Account", description: "I have a checking or savings account", category: "independence" },
  { id: "ged", title: "GED", description: "I passed my GED or equivalency exam", category: "education" },
  { id: "diploma", title: "Diploma", description: "I earned a high school diploma", category: "education" },
  { id: "school", title: "Enrolled in School", description: "I'm in school, college, or vocational training", category: "education" },
  { id: "license", title: "Driver's License", description: "I'm licensed to drive", category: "independence" },
  { id: "job", title: "First Job", description: "I'm employed", category: "independence" },
  { id: "housing", title: "Stable Housing", description: "I have my own stable home", category: "independence" },
];

const CATEGORY_COLOR: Record<Category, string> = {
  foundation: "#ef4444",
  documents: "#3b82f6",
  wellness: "#22c55e",
  independence: "#f5b942",
  education: "#a855f7",
};

const CATEGORY_LABEL: Record<Category, string> = {
  foundation: "Foundation",
  documents: "Documents",
  wellness: "Wellness",
  independence: "Independence",
  education: "Education",
};

const STORAGE_KEY = "luce_journey_v1";

function loadProgress(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

const LightJourney = () => {
  const [progress, setProgress] = useState<Record<string, boolean>>(loadProgress);
  const [selected, setSelected] = useState<Milestone | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const completedCount = useMemo(
    () => MILESTONES.filter((m) => progress[m.id]).length,
    [progress],
  );

  const toggle = async (m: Milestone) => {
    const wasComplete = !!progress[m.id];
    setProgress((p) => ({ ...p, [m.id]: !wasComplete }));
    if (!wasComplete) {
      const result = await awardLightPoints("milestone_complete", m.id);
      if (result?.awarded) {
        toast({
          title: `+${result.awarded} Light Points`,
          description: `${m.title} unlocked. Keep going. ✨`,
        });
      } else {
        toast({ title: `${m.title} unlocked ✨`, description: "One step closer." });
      }
    }
    setSelected(null);
  };

  // Layout: zigzag left/right
  const COLS = 2;
  const ROW_H = 110;
  const positions = MILESTONES.map((_, i) => {
    const row = i;
    const leftFirst = row % 2 === 0;
    return { x: leftFirst ? 22 : 78, y: 60 + row * ROW_H };
  });

  const pathD = positions
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      const prev = positions[i - 1];
      const midY = (prev.y + p.y) / 2;
      return `C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
    })
    .join(" ");

  const totalH = 60 + MILESTONES.length * ROW_H;

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="mb-4">
        <h2 className="font-display text-xl text-foreground">Light Journey</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your road to independence — one step at a time.
        </p>
      </div>

      {/* Progress card */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center streetlight-glow">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">Milestones lit</p>
          <p className="font-display text-lg text-foreground">
            {completedCount} <span className="text-muted-foreground text-sm">of {MILESTONES.length}</span>
          </p>
        </div>
        <div className="text-xs text-primary font-semibold">+10 each</div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(CATEGORY_LABEL) as Category[]).map((c) => (
          <div key={c} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLOR[c] }} />
            {CATEGORY_LABEL[c]}
          </div>
        ))}
      </div>

      {/* Path map */}
      <div className="relative" style={{ height: totalH }}>
        <svg
          viewBox={`0 0 100 ${totalH}`}
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <defs>
            <linearGradient id="journey-glow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(43 96% 64%)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="hsl(43 96% 64%)" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d={pathD}
            fill="none"
            stroke="url(#journey-glow)"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeDasharray="2 2"
          />
        </svg>

        {MILESTONES.map((m, i) => {
          const pos = positions[i];
          const done = !!progress[m.id];
          const color = CATEGORY_COLOR[m.category];
          return (
            <button
              key={m.id}
              onClick={() => setSelected(m)}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 active:scale-95 transition-transform"
              style={{ left: `${pos.x}%`, top: pos.y }}
            >
              <div
                className="relative w-14 h-14 rounded-full flex items-center justify-center font-display text-base text-white shadow-lg"
                style={{
                  background: done ? color : `${color}40`,
                  border: `2px solid ${color}`,
                  boxShadow: done ? `0 0 18px ${color}80` : "none",
                }}
              >
                {done ? <Check className="w-6 h-6" /> : <span>{i + 1}</span>}
              </div>
              <span className="text-[11px] font-medium text-foreground bg-background/70 px-1.5 py-0.5 rounded max-w-[110px] text-center leading-tight">
                {m.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Milestone modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{
                  background: `${CATEGORY_COLOR[selected.category]}30`,
                  border: `2px solid ${CATEGORY_COLOR[selected.category]}`,
                }}
              >
                {progress[selected.id] ? (
                  <Check className="w-5 h-5" style={{ color: CATEGORY_COLOR[selected.category] }} />
                ) : (
                  <Lock className="w-4 h-4" style={{ color: CATEGORY_COLOR[selected.category] }} />
                )}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide" style={{ color: CATEGORY_COLOR[selected.category] }}>
                  {CATEGORY_LABEL[selected.category]}
                </p>
                <h3 className="font-display text-lg text-foreground">{selected.title}</h3>
              </div>
            </div>
            <p className="text-sm text-foreground mb-5">{selected.description}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 bg-secondary text-secondary-foreground rounded-lg py-2.5 text-sm font-medium"
              >
                Close
              </button>
              <button
                onClick={() => toggle(selected)}
                className="flex-1 bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium"
              >
                {progress[selected.id] ? "Mark not done" : "I did this ✨"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LightJourney;
