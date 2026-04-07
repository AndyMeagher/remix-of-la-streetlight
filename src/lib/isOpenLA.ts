/**
 * A schedule block: which days and what hours.
 */
export interface ScheduleBlock {
  days: number[];   // 0=Sun..6=Sat
  open: string;     // "HH:MM"
  close: string;    // "HH:MM"
}

/**
 * Determines if a resource is currently open based on LA timezone.
 * Checks `schedule` (JSONB array) first; falls back to flat open_time/close_time.
 */
export function isResourceOpen(resource: {
  is_always_open: boolean;
  open_time: string | null;
  close_time: string | null;
  open_days: number[] | null;
  schedule?: ScheduleBlock[] | null;
}): boolean {
  if (resource.is_always_open) return true;

  const now = new Date();
  const laFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "short",
  });

  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const currentDay = dayMap[dayFormatter.format(now)];
  const timeParts = laFormatter.format(now).split(":");
  const currentMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

  // --- Schedule-based check (preferred) ---
  if (resource.schedule && resource.schedule.length > 0) {
    const block = resource.schedule.find((b) => b.days.includes(currentDay));
    if (!block) return false; // not open today

    const [openH, openM] = block.open.split(":").map(Number);
    const [closeH, closeM] = block.close.split(":").map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    if (closeMinutes > openMinutes) {
      return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
    }
    return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
  }

  // --- Fallback: flat open_time / close_time ---
  if (!resource.open_time || !resource.close_time) return true; // "Varies" → default open

  if (resource.open_days) {
    if (currentDay !== undefined && !resource.open_days.includes(currentDay)) {
      return false;
    }
  }

  const [openH, openM] = resource.open_time.split(":").map(Number);
  const [closeH, closeM] = resource.close_time.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}
