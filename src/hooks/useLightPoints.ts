import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { playLightEarnedSound, playTipSubmittedSound } from "@/lib/feedbackSounds";

export type LightAction =
  | "daily_open"
  | "view_resource"
  | "submit_tip"
  | "referral_share"
  | "referral_install"
  | "milestone_complete"
  | "vault_setup";

export function getDeviceId(): string {
  let id = localStorage.getItem("luce_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("luce_device_id", id);
  }
  return id;
}

interface LightPointsRow {
  total_points: number;
  today_points: number;
  referral_code: string;
}

let cache: LightPointsRow | null = null;
const listeners = new Set<(r: LightPointsRow) => void>();

async function ensureRow(deviceId: string): Promise<LightPointsRow> {
  const { data } = await supabase
    .from("light_points")
    .select("total_points, today_points, referral_code, today_date")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (data) {
    const todayLA = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
    const today_points = data.today_date === todayLA ? data.today_points : 0;
    return { total_points: data.total_points, today_points, referral_code: data.referral_code };
  }
  const { data: inserted } = await supabase
    .from("light_points")
    .insert({ device_id: deviceId })
    .select("total_points, today_points, referral_code")
    .single();
  return inserted as LightPointsRow;
}

function notify(row: LightPointsRow) {
  cache = row;
  listeners.forEach((l) => l(row));
}

export async function awardLightPoints(action: LightAction, refId?: string) {
  const deviceId = getDeviceId();
  const { data, error } = await supabase.rpc("award_light_points", {
    _device_id: deviceId,
    _action_type: action,
    _ref_id: refId ?? null,
  });
  if (error) return null;
  const result = data as { awarded: number; total?: number; today?: number; reason?: string };
  if (result?.awarded > 0 && typeof result.total === "number") {
    notify({
      total_points: result.total,
      today_points: result.today ?? 0,
      referral_code: cache?.referral_code ?? "",
    });
    if (action === "submit_tip") {
      playTipSubmittedSound();
    } else {
      playLightEarnedSound();
    }
  }
  return result;
}

export function useLightPoints() {
  const [row, setRow] = useState<LightPointsRow | null>(cache);

  useEffect(() => {
    const deviceId = getDeviceId();
    let mounted = true;
    ensureRow(deviceId).then((r) => {
      if (!mounted) return;
      cache = { ...cache, ...r };
      setRow(cache);
    });
    const listener = (r: LightPointsRow) => setRow(r);
    listeners.add(listener);
    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  const refresh = useCallback(async () => {
    const r = await ensureRow(getDeviceId());
    notify(r);
  }, []);

  return { ...row, refresh };
}

/** Awards daily_open once per session-load (RPC enforces real daily cap). */
export async function awardDailyOpenIfNeeded() {
  const key = "luce_last_daily_open";
  const todayLA = new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  if (localStorage.getItem(key) === todayLA) return;
  const result = await awardLightPoints("daily_open");
  if (result && result.awarded >= 0) localStorage.setItem(key, todayLA);
}

/** Process ?ref=CODE on first launch, credit the referrer once. */
export async function processReferralIfPresent() {
  const url = new URL(window.location.href);
  const ref = url.searchParams.get("ref");
  if (!ref) return;
  url.searchParams.delete("ref");
  window.history.replaceState({}, "", url.toString());

  if (localStorage.getItem("luce_referral_processed")) return;
  const deviceId = getDeviceId();
  await supabase.rpc("credit_referrer", {
    _new_device_id: deviceId,
    _ref_code: ref,
  });
  localStorage.setItem("luce_referral_processed", "1");
}
