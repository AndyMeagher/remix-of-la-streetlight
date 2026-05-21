import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PeerGroup = {
  id: string;
  title: string;
  day_of_week: number;
  start_time: string | null;
  end_time: string | null;
  time_label: string;
  location: "dtla" | "culvercity" | "online";
  location_label: string;
  format: "in-person" | "online" | "hybrid";
  zoom_id: string | null;
  zoom_url: string | null;
  zoom_password: string | null;
  description: string | null;
  tags: string[] | null;
  last_verified_at: string;
};

export function usePeerSupport() {
  const [groups, setGroups] = useState<PeerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastVerified, setLastVerified] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("peer_support_groups")
      .select("*")
      .eq("active", true)
      .order("day_of_week", { ascending: true })
      .order("start_time", { ascending: true });
    if (!error && data) {
      setGroups(data as PeerGroup[]);
      if (data.length) {
        const latest = data.reduce((a: any, b: any) => (a.last_verified_at > b.last_verified_at ? a : b));
        setLastVerified(latest.last_verified_at);
      }
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("refresh-peer-support");
      if (error) throw error;
      await load();
      return data;
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { groups, loading, refreshing, lastVerified, refresh, reload: load };
}
