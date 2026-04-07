import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { isResourceOpen, type ScheduleBlock } from "@/lib/isOpenLA";
import type { Resource } from "@/components/ResourceCard";

interface DbResource {
  id: string;
  name: string;
  category: string;
  address: string;
  distance: string;
  hours: string;
  phone: string | null;
  website: string | null;
  tags: string[] | null;
  lat: number | null;
  lng: number | null;
  open_time: string | null;
  close_time: string | null;
  open_days: number[] | null;
  is_always_open: boolean;
  schedule: ScheduleBlock[] | null;
}

function toResource(db: DbResource): Resource & { lat: number | null; lng: number | null; category: string } {
  return {
    id: db.id,
    name: db.name,
    address: db.address,
    distance: db.distance,
    hours: db.hours,
    phone: db.phone ?? undefined,
    website: db.website ?? undefined,
    tags: db.tags ?? undefined,
    isOpen: isResourceOpen(db),
    lat: db.lat,
    lng: db.lng,
    category: db.category,
  };
}

export function useResources() {
  const [dbResources, setDbResources] = useState<DbResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    supabase
      .from("resources")
      .select("*")
      .then(({ data }) => {
        if (data) setDbResources(data as DbResource[]);
        setLoading(false);
      });
  }, []);

  // Re-compute isOpen every 60s
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const resources = useMemo(() => {
    // tick is used to trigger re-computation
    void tick;
    return dbResources.map(toResource);
  }, [dbResources, tick]);

  const shelterResources = useMemo(() => resources.filter((r) => r.category === "shelter"), [resources]);
  const foodResources = useMemo(() => resources.filter((r) => r.category === "food"), [resources]);
  const medicalResources = useMemo(() => resources.filter((r) => r.category === "medical"), [resources]);
  const transitionalResources = useMemo(() => resources.filter((r) => r.category === "transitional"), [resources]);
  const traffickingResources = useMemo(() => resources.filter((r) => r.category === "trafficking"), [resources]);
  const dropinResources = useMemo(() => resources.filter((r) => r.category === "dropin"), [resources]);

  return {
    loading,
    resources,
    shelterResources,
    foodResources,
    medicalResources,
    transitionalResources,
    traffickingResources,
    dropinResources,
  };
}
