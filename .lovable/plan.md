

# Plan: Dynamic Open/Closed Status + Backend Resource Data

## Overview
Move all resource data from the hardcoded `resourceData.ts` file into a database table, and compute `isOpen` dynamically based on the current time in Los Angeles (Pacific Time) using structured open/close hours.

## What Changes

### 1. Create `resources` database table
A new table storing all resource data with structured schedule fields:

| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | e.g. "s1", "f2" |
| name | text | |
| category | text | "shelter", "food", "medical", "transitional", "trafficking" |
| address | text | |
| distance | text | Static default distance |
| hours | text | Human-readable hours string (display only) |
| phone | text (nullable) | |
| website | text (nullable) | |
| tags | text[] (nullable) | Array of tag strings |
| lat | float (nullable) | For geolocation |
| lng | float (nullable) | For geolocation |
| open_time | time (nullable) | e.g. 09:00 — null means 24h or "Varies" |
| close_time | time (nullable) | e.g. 17:00 |
| open_days | int[] (nullable) | Days of week (0=Sun..6=Sat), null = every day |
| is_always_open | boolean | True for "24 Hours" resources |
| created_at | timestamptz | |

RLS: public read access (SELECT for everyone), restricted write.

### 2. Seed the table
Insert all ~50 resources from the current `resourceData.ts` into the table via a migration, parsing hours like "9AM–5PM" into `open_time`/`close_time` fields and setting `is_always_open` for "24 Hours" entries. Resources with "Varies" hours will have null schedule fields and default to showing as open.

### 3. Create a utility to compute `isOpen` dynamically
A client-side helper function that:
- Gets the current time in `America/Los_Angeles` timezone
- For each resource: if `is_always_open` → true; if `open_time`/`close_time` are set → compare current LA time; if schedule is null → default to true (for "Varies" entries)
- Also checks `open_days` against current LA day-of-week

### 4. Create a React hook `useResources`
- Fetches resources from the database on mount, grouped by category
- Computes `isOpen` dynamically for each resource
- Re-computes every 60 seconds so status updates in real-time
- Returns the same shaped data the app currently expects (`shelterResources`, `foodResources`, etc.)

### 5. Update consuming components
- **Index.tsx**: Replace static imports from `resourceData.ts` with the `useResources` hook
- **NearMeNow.tsx**: Use the hook instead of importing from `resourceData.ts`; use `lat`/`lng` from the database instead of the separate `resourceCoordinates` map
- **ResourceCard.tsx**: No interface changes needed — `isOpen` is still a boolean on the `Resource` type
- **resourceData.ts**: Remove or keep as fallback only

### 6. Remove hardcoded data
Delete the static arrays from `resourceData.ts` once the backend is in place.

## Technical Details

- **Timezone handling**: Uses `Intl.DateTimeFormat` with `timeZone: 'America/Los_Angeles'` — no extra libraries needed
- **Schedule parsing**: Hours like "Mon–Thu 8:30AM–5PM" will be simplified to primary open/close times; complex multi-schedule resources can be handled with the `open_days` array
- **Fallback**: Resources with unparseable or "Varies" hours default to showing as open, matching current behavior
- **No authentication required**: Resources are public data, so the table uses public SELECT policies

