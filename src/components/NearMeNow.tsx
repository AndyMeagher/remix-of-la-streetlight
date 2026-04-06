import { useState, useCallback } from "react";
import { MapPin, Navigation, Clock, Phone, ExternalLink, Filter, Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "./ui/button";
import { useResources } from "../hooks/useResources";
import type { Resource } from "./ResourceCard";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

type CategoryFilter = "all" | "shelter" | "food" | "medical";

interface NearbyResource extends Resource {
  calculatedDistance: number;
  category: string;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getDirectionsUrl(address: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

const NearMeNow = () => {
  const { shelterResources, foodResources, medicalResources, resources } = useResources();
  const [status, setStatus] = useState<"idle" | "loading" | "results" | "denied" | "error">("idle");
  const [results, setResults] = useState<NearbyResource[]>([]);
  const [openOnly, setOpenOnly] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");

  const findNearby = useCallback(async () => {
    setStatus("loading");

    try {
      let latitude: number;
      let longitude: number;

      if (Capacitor.getPlatform() === "ios") {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== "granted") {
          setStatus("denied");
          return;
        }
        const pos = await Geolocation.getCurrentPosition({
          enableHighAccuracy: false,
          timeout: 10000,
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } else {
        if (!navigator.geolocation) {
          setStatus("error");
          return;
        }
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 60000,
          });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      }

      const allResources = resources
        .filter((r) => ["shelter", "food", "medical"].includes(r.category))
        .filter((r) => r.lat != null && r.lng != null);

      const nearby: NearbyResource[] = allResources
        .map((r) => {
          const dist = haversineDistance(latitude, longitude, r.lat!, r.lng!);
          return { ...r, calculatedDistance: parseFloat(dist.toFixed(1)) };
        })
        .filter((r) => r.calculatedDistance <= 10)
        .sort((a, b) => a.calculatedDistance - b.calculatedDistance);

      setResults(nearby);
      setStatus("results");
    } catch (err: unknown) {
      if (
        err instanceof GeolocationPositionError &&
        err.code === err.PERMISSION_DENIED
      ) {
        setStatus("denied");
      } else {
        setStatus("error");
      }
    }
  }, [resources]);

  const filtered = results.filter((r) => {
    if (openOnly && !r.isOpen) return false;
    if (categoryFilter !== "all" && r.category !== categoryFilter) return false;
    return true;
  });

  const categoryLabel = (cat: string) => {
    if (cat === "shelter") return "Shelter";
    if (cat === "food") return "Food";
    if (cat === "medical") return "Medical";
    return cat;
  };

  if (status === "idle") {
    return (
      <div className="px-4 pt-8 pb-24 flex flex-col items-center gap-6">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
          <Navigation className="w-8 h-8 text-primary" />
        </div>
        <h2 className="font-display text-xl text-foreground text-center">Near Me Now</h2>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Find the closest shelters, food, and medical resources to your current location.
        </p>
        <Button onClick={findNearby} size="lg" className="w-full max-w-xs text-base font-semibold py-6">
          <MapPin className="w-5 h-5 mr-2" />
          Find Resources Near Me
        </Button>
        <div className="flex items-start gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-2 max-w-xs">
          <ShieldCheck className="w-4 h-4 text-safe mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your location is only used to find nearby resources. It is not saved or shared.
          </p>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="px-4 pt-16 pb-24 flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Finding resources near you…</p>
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="px-4 pt-12 pb-24 flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="w-10 h-10 text-warning" />
        <h3 className="font-display text-lg text-foreground">Location Access Denied</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          Please enable location access in your browser settings to use this feature.
        </p>
        <Button variant="outline" onClick={() => setStatus("idle")}>Go Back</Button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="px-4 pt-12 pb-24 flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive" />
        <h3 className="font-display text-lg text-foreground">Something Went Wrong</h3>
        <p className="text-sm text-muted-foreground max-w-xs">
          We couldn't get your location. Please try again.
        </p>
        <Button variant="outline" onClick={() => setStatus("idle")}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl text-foreground">Nearby Resources</h2>
        <Button variant="ghost" size="sm" onClick={findNearby} className="text-xs text-primary">
          <Navigation className="w-3.5 h-3.5 mr-1" /> Refresh
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex items-center gap-1 mr-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        {(["all", "shelter", "food", "medical"] as CategoryFilter[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
              categoryFilter === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-secondary text-muted-foreground border-border"
            }`}
          >
            {cat === "all" ? "All" : categoryLabel(cat)}
          </button>
        ))}
        <button
          onClick={() => setOpenOnly(!openOnly)}
          className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ml-auto ${
            openOnly
              ? "bg-safe/15 text-safe border-safe/30"
              : "bg-secondary text-muted-foreground border-border"
          }`}
        >
          Open Now
        </button>
      </div>

      <div className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-1.5 mb-4">
        <ShieldCheck className="w-3.5 h-3.5 text-safe flex-shrink-0" />
        <p className="text-[10px] text-muted-foreground">
          Your location is only used to find nearby resources. It is not saved or shared.
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground mb-2">No nearby resources found.</p>
          <p className="text-xs text-muted-foreground">Try expanding your search or changing filters.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => { setOpenOnly(false); setCategoryFilter("all"); }}>
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.slice(0, 5).map((resource) => (
            <div key={resource.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/70">
                      {categoryLabel(resource.category)}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        resource.isOpen
                          ? "bg-safe/15 text-safe"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {resource.isOpen ? "Open" : "Closed"}
                    </span>
                  </div>
                  <h3 className="font-display text-base text-foreground leading-snug">{resource.name}</h3>
                </div>
                <span className="text-sm font-semibold text-primary whitespace-nowrap">
                  {resource.calculatedDistance} mi
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{resource.address}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                <Clock className="w-3 h-3 flex-shrink-0" />
                <span>{resource.hours}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={getDirectionsUrl(resource.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-lg active:opacity-80 transition-opacity"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Get Directions
                </a>
                {resource.phone && (
                  <a
                    href={`tel:${resource.phone}`}
                    className="inline-flex items-center gap-1.5 bg-secondary text-foreground text-xs font-medium px-3 py-2 rounded-lg border border-border active:bg-muted transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call
                  </a>
                )}
                {resource.website && (
                  <a
                    href={resource.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 bg-secondary text-foreground text-xs font-medium px-3 py-2 rounded-lg border border-border active:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NearMeNow;
