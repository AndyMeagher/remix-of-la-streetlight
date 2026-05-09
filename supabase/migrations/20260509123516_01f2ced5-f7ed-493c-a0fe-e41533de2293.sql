
-- Campaigns table
CREATE TABLE public.scheduled_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  recurrence text NOT NULL DEFAULT 'none', -- 'none' | 'yearly'
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.scheduled_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaigns"
  ON public.scheduled_campaigns FOR SELECT
  USING (true);

-- Campaign messages
CREATE TABLE public.campaign_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.scheduled_campaigns(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Luce 💛',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_campaign_messages_campaign ON public.campaign_messages(campaign_id);

ALTER TABLE public.campaign_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view campaign messages"
  ON public.campaign_messages FOR SELECT
  USING (true);

-- Track campaign delivery on existing notification_history
ALTER TABLE public.notification_history
  ADD COLUMN campaign_id uuid REFERENCES public.scheduled_campaigns(id) ON DELETE SET NULL;

CREATE INDEX idx_notification_history_campaign ON public.notification_history(device_id, campaign_id) WHERE campaign_id IS NOT NULL;
