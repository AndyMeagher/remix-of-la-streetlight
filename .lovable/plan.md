

# Fix: Remove Public Access to Device Tokens Table

## Problem
The `device_tokens` table has public INSERT and UPDATE policies, allowing anyone to write or overwrite any device's push token. Without authentication, there's no way to scope these policies to "own device only" at the database level.

## Solution
Move token registration behind a backend function. The client calls the function with its device info; the function uses the service role to upsert. All public RLS policies on `device_tokens` are removed — the table becomes service-role-only.

## Steps

### 1. Create edge function `register-device-token`
A simple function that accepts `{ device_id, platform, token, p256dh?, auth? }` in the request body and upserts into `device_tokens` using the service role client. Validates input (required fields, platform must be `ios` or `web`).

### 2. Migration: drop all public policies on `device_tokens`
Remove the remaining INSERT and UPDATE policies. The table keeps RLS enabled but has zero public policies — only service-role access works.

### 3. Update `src/hooks/usePushNotifications.ts`
Replace the two direct `supabase.from("device_tokens").upsert(...)` calls (one for iOS native at line 68, one for web push later in the file) with `supabase.functions.invoke("register-device-token", { body: {...} })`.

## Files changed
- **New**: `supabase/functions/register-device-token/index.ts`
- **New migration**: drop public INSERT/UPDATE policies on `device_tokens`
- **Modified**: `src/hooks/usePushNotifications.ts` — use edge function instead of direct table writes

