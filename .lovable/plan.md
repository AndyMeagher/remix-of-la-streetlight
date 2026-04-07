

# Fix Multi-Schedule Resources Without a New Table

## Problem
Resources with different hours on different days (e.g. "Mon–Fri 3–7PM, Sat–Sun 9AM–3PM") are stored with a single `open_time`/`close_time` pair, causing incorrect open/closed status.

## Solution
Add a `schedule` JSONB column to the existing `resources` table. For resources with multiple schedule blocks, store them as a JSON array. The `isOpenLA` logic checks `schedule` first, falls back to the existing flat columns.

### Schedule format
```json
[
  {"days": [1,2,3,4,5], "open": "15:00", "close": "19:00"},
  {"days": [0,6], "open": "09:00", "close": "15:00"}
]
```

## Steps

### 1. Migration: add `schedule` column
Add a nullable `schedule jsonb` column to `resources`.

### 2. Update data for multi-schedule resources
Use the insert tool to set the `schedule` column for the ~10 resources that have different hours on different days (e.g. d4, d5, d6, d7, d8, d9, d10, d11, d3, d14).

### 3. Update `src/lib/isOpenLA.ts`
- Accept an optional `schedule` parameter (JSON array)
- If `schedule` is present: find the entry whose `days` array includes the current LA day-of-week, then check if current LA time is within that entry's open/close window
- If no `schedule`: use existing `open_time`/`close_time`/`open_days` logic (unchanged)

### 4. Update `src/hooks/useResources.ts`
- Add `schedule` to the `DbResource` interface
- Pass `schedule` through to `isResourceOpen`

### Files changed
- **New migration**: adds `schedule` column
- **Data update**: ~10 resources get their `schedule` populated
- **`src/lib/isOpenLA.ts`**: schedule-aware logic
- **`src/hooks/useResources.ts`**: include `schedule` in fetch and pass-through

