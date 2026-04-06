/**
 * Determines if a resource is currently open based on LA timezone.
 */
export function isResourceOpen(resource: {
  is_always_open: boolean;
  open_time: string | null;
  close_time: string | null;
  open_days: number[] | null;
}): boolean {
  if (resource.is_always_open) return true;
  if (!resource.open_time || !resource.close_time) return true; // "Varies" → default open

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

  // Get current LA time as minutes since midnight
  const timeParts = laFormatter.format(now).split(":");
  const currentMinutes = parseInt(timeParts[0]) * 60 + parseInt(timeParts[1]);

  // Check day of week (0=Sun..6=Sat)
  if (resource.open_days) {
    const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const currentDay = dayMap[dayFormatter.format(now)];
    if (currentDay !== undefined && !resource.open_days.includes(currentDay)) {
      return false;
    }
  }

  // Parse open/close times (format: "HH:MM:SS" or "HH:MM")
  const [openH, openM] = resource.open_time.split(":").map(Number);
  const [closeH, closeM] = resource.close_time.split(":").map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  if (closeMinutes > openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }
  // Overnight span (e.g., 10PM–6AM)
  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
}
