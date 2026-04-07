

# Set Up Cron Job for Luce Notifications

## Problem
The `send-luce-notifications` edge function is deployed but has no cron job triggering it, so notifications never actually send.

## Solution
Insert a `cron.schedule` entry that invokes the function periodically. The function already handles its own rate limiting (24h between sends, 10AM–8PM PT window, max 5/week), so we just need to trigger it frequently enough within that window.

**Schedule**: Every 30 minutes — the function's internal logic decides whether to actually send. This gives enough granularity for the randomized delivery window.

## Steps

### 1. Enable `pg_cron` and `pg_net` extensions
Run a migration to ensure both extensions are enabled.

### 2. Insert the cron job
Use the Supabase insert tool (not migration, since it contains project-specific URL and anon key) to schedule:
```sql
select cron.schedule(
  'send-luce-notifications',
  '*/30 * * * *',
  $$ select net.http_post(
    url:='https://ttvfuukzrwjpfzxshyob.supabase.co/functions/v1/send-luce-notifications',
    headers:='{"Content-Type":"application/json","Authorization":"Bearer <anon_key>"}'::jsonb,
    body:='{}'::jsonb
  ) as request_id; $$
);
```

### Files changed
- **New migration**: enable `pg_cron` and `pg_net` extensions
- **Database insert**: cron job schedule (via insert tool, not migration)

