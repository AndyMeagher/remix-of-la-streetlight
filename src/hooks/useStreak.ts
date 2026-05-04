import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getDeviceId } from "@/hooks/useLightPoints";
import { playStreakSound } from "@/lib/feedbackSounds";

interface StreakState {
  current_streak: number;
  last_active_date: string | null;
}

let cache: StreakState | null = null;
const listeners = new Set<(s: StreakState) => void>();

function notify(s: StreakState) {
  cache = s;
  listeners.forEach((l) => l(s));
}

/** Updates the streak via RPC. Safe to call on every app open. */
export async function bumpStreak() {
  const deviceId = getDeviceId();
  const { data, error } = await supabase.rpc("update_streak", {
    _device_id: deviceId,
  });
  if (error) return;
  const result = data as { streak: number; last_active: string };
  const prev = cache?.current_streak ?? 0;
  notify({ current_streak: result.streak, last_active_date: result.last_active });
  if (result.streak > prev) {
    playStreakSound();
  }
}

export function useStreak() {
  const [state, setState] = useState<StreakState | null>(cache);

  useEffect(() => {
    const deviceId = getDeviceId();
    let mounted = true;
    supabase
      .from("light_points")
      .select("current_streak, last_active_date")
      .eq("device_id", deviceId)
      .maybeSingle()
      .then(({ data }) => {
        if (!mounted || !data) return;
        const next = {
          current_streak: data.current_streak ?? 0,
          last_active_date: data.last_active_date,
        };
        cache = next;
        setState(next);
      });
    const listener = (s: StreakState) => setState(s);
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    await bumpStreak();
  }, []);

  return { ...state, refresh };
}
