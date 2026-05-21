import { useMemo, useState } from "react";
import { Loader2, RefreshCw, Video, MapPin, Phone, Copy, Users, CheckCircle2, ExternalLink } from "lucide-react";
import { usePeerSupport, type PeerGroup } from "@/hooks/usePeerSupport";
import { toast } from "@/components/ui/use-toast";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const LOCATION_INFO: Record<string, { label: string; address: string; phone: string; mapsUrl: string }> = {
  dtla: {
    label: "Downtown LA",
    address: "425 S Broadway, Los Angeles, CA 90013",
    phone: "2132130100",
    mapsUrl: "https://maps.google.com/?q=425+S+Broadway+Los+Angeles+CA+90013",
  },
  culvercity: {
    label: "Culver City",
    address: "6666 Green Valley Circle, Culver City, CA 90230",
    phone: "3103058878",
    mapsUrl: "https://maps.google.com/?q=6666+Green+Valley+Circle+Culver+City+CA+90230",
  },
  online: { label: "Online", address: "Zoom", phone: "", mapsUrl: "" },
};

const FORMAT_BADGE: Record<string, string> = {
  "in-person": "bg-accent/20 text-accent border-accent/30",
  online: "bg-primary/20 text-primary border-primary/30",
  hybrid: "bg-secondary text-foreground border-border",
};

function formatVerified(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = (now - d.getTime()) / 1000 / 60 / 60 / 24;
  if (diff < 1) return "today";
  if (diff < 2) return "yesterday";
  if (diff < 7) return `${Math.floor(diff)} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PeerSupport = () => {
  const { groups, loading, refreshing, lastVerified, refresh } = usePeerSupport();
  const todayLA = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })).getDay();
  const [day, setDay] = useState<number>(todayLA);
  const [formatFilter, setFormatFilter] = useState<"all" | "in-person" | "online" | "hybrid">("all");
  const [locationFilter, setLocationFilter] = useState<"all" | "dtla" | "culvercity">("all");

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      if (g.day_of_week !== day) return false;
      if (formatFilter !== "all" && g.format !== formatFilter) return false;
      if (locationFilter !== "all" && g.location !== locationFilter && g.format !== "online") return false;
      return true;
    });
  }, [groups, day, formatFilter, locationFilter]);

  const countByDay = useMemo(() => {
    const m = new Array(7).fill(0);
    groups.forEach((g) => (m[g.day_of_week] += 1));
    return m;
  }, [groups]);

  const handleRefresh = async () => {
    const result = await refresh();
    if (result?.success) {
      toast({ title: "Schedule refreshed", description: `Verified ${result.groups_count} meetings with SHARE!` });
    } else {
      toast({ title: "Refresh failed", description: result?.error || "Try again in a moment.", variant: "destructive" });
    }
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: `${label} copied` });
    } catch {
      toast({ title: "Couldn't copy", variant: "destructive" });
    }
  };

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1">
          <h2 className="font-display text-xl text-foreground">Peer to Peer Support</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Powered by{" "}
            <a
              href="https://www.shareselfhelp.org"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Share Help LA <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-muted-foreground hover:text-primary disabled:opacity-50 flex items-center gap-1 px-2 py-1"
          aria-label="Refresh schedule"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-1.5 mb-4 text-[11px] text-muted-foreground">
        <CheckCircle2 className="w-3 h-3 text-safe" />
        <span>Verified {formatVerified(lastVerified)} · {groups.length} active meetings</span>
      </div>

      <div className="bg-primary/5 border border-primary/15 rounded-lg px-3 py-2 mb-4">
        <p className="text-xs text-foreground/90 leading-relaxed">
          Free, peer-led support groups for anxiety, depression, trauma, recovery, and more. No appointment, no insurance, no judgment. Drop in.
        </p>
      </div>

      {/* Day chips */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto -mx-4 px-4 pb-1">
        {DAYS.map((d, i) => {
          const active = i === day;
          const isToday = i === todayLA;
          return (
            <button
              key={d}
              onClick={() => setDay(i)}
              className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[52px] px-3 py-2 rounded-lg border transition-colors ${
                active
                  ? "bg-primary text-primary-foreground border-primary streetlight-glow"
                  : "bg-card text-foreground border-border active:bg-secondary"
              }`}
            >
              <span className="text-[10px] uppercase tracking-wide opacity-70">{isToday ? "Today" : d}</span>
              <span className="font-display text-sm leading-tight">{!isToday ? d : DAYS[i]}</span>
              <span className={`text-[10px] mt-0.5 ${active ? "opacity-90" : "text-muted-foreground"}`}>
                {countByDay[i]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {(["all", "in-person", "online", "hybrid"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFormatFilter(f)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              formatFilter === f
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {f === "all" ? "All formats" : f}
          </button>
        ))}
        <span className="w-px bg-border mx-1" />
        {(["all", "dtla", "culvercity"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLocationFilter(l)}
            className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${
              locationFilter === l
                ? "bg-primary/15 text-primary border-primary/40"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {l === "all" ? "All locations" : l === "dtla" ? "DTLA" : "Culver City"}
          </button>
        ))}
      </div>

      <h3 className="font-display text-sm text-muted-foreground mb-2">
        {DAYS_LONG[day]} · {filtered.length} {filtered.length === 1 ? "meeting" : "meetings"}
      </h3>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 px-4">
          <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
          <p className="text-sm text-muted-foreground">
            {groups.length === 0
              ? "No meetings loaded yet. Tap Refresh to fetch the latest schedule."
              : "No meetings match these filters for this day."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((g) => (
            <GroupCard key={g.id} group={g} onCopy={copy} />
          ))}
        </div>
      )}
    </div>
  );
};

function GroupCard({ group, onCopy }: { group: PeerGroup; onCopy: (t: string, label: string) => void }) {
  const loc = LOCATION_INFO[group.location];
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="font-display text-sm text-foreground leading-snug flex-1">{group.title}</h4>
        <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${FORMAT_BADGE[group.format]}`}>
          {group.format === "in-person" ? "In person" : group.format === "online" ? "Online" : "Hybrid"}
        </span>
      </div>
      <p className="text-sm text-foreground/80 mb-1">{group.time_label}</p>
      {(group.format === "in-person" || group.format === "hybrid") && loc && (
        <p className="text-xs text-muted-foreground mb-2 flex items-start gap-1">
          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{loc.label} · {loc.address}</span>
        </p>
      )}
      {group.description && (
        <p className="text-xs text-muted-foreground/90 mb-2 leading-relaxed">{group.description}</p>
      )}
      {group.tags && group.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {group.tags.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{t}</span>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-2 mt-3">
        {(group.format === "online" || group.format === "hybrid") && group.zoom_url && (
          <a
            href={group.zoom_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-primary text-primary-foreground active:opacity-80"
          >
            <Video className="w-3.5 h-3.5" /> Join Zoom
          </a>
        )}
        {(group.format === "online" || group.format === "hybrid") && group.zoom_id && (
          <button
            onClick={() => onCopy(group.zoom_id!, "Zoom ID")}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground border border-border active:opacity-80"
          >
            <Copy className="w-3.5 h-3.5" /> ID {group.zoom_id}
          </button>
        )}
        {group.zoom_password && (
          <button
            onClick={() => onCopy(group.zoom_password!, "Password")}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground border border-border active:opacity-80"
          >
            <Copy className="w-3.5 h-3.5" /> Pwd
          </button>
        )}
        {(group.format === "in-person" || group.format === "hybrid") && loc?.mapsUrl && (
          <a
            href={loc.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground border border-border active:opacity-80"
          >
            <MapPin className="w-3.5 h-3.5" /> Directions
          </a>
        )}
        {(group.format === "in-person" || group.format === "hybrid") && loc?.phone && (
          <a
            href={`tel:${loc.phone}`}
            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-secondary text-foreground border border-border active:opacity-80"
          >
            <Phone className="w-3.5 h-3.5" /> Call site
          </a>
        )}
      </div>
    </div>
  );
}

export default PeerSupport;
