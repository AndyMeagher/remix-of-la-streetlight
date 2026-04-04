
-- Push notification subscriptions (anonymous, device-based)
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_notified_at timestamptz,
  notifications_this_week integer NOT NULL DEFAULT 0,
  week_start timestamptz
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert subscriptions"
  ON public.push_subscriptions FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read subscriptions"
  ON public.push_subscriptions FOR SELECT TO public
  USING (true);

CREATE POLICY "Anyone can update subscriptions"
  ON public.push_subscriptions FOR UPDATE TO public
  USING (true) WITH CHECK (true);

-- Notification history to prevent repeats
CREATE TABLE public.notification_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  message_index integer NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert history"
  ON public.notification_history FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read history"
  ON public.notification_history FOR SELECT TO public
  USING (true);

-- Index for efficient lookups
CREATE INDEX idx_notification_history_device_recent
  ON public.notification_history (device_id, sent_at DESC);

CREATE INDEX idx_push_subscriptions_device
  ON public.push_subscriptions (device_id);
