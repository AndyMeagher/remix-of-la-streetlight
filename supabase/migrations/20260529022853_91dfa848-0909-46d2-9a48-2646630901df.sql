ALTER TABLE public.notification_history
  ADD COLUMN IF NOT EXISTS campaign_message_id uuid REFERENCES public.campaign_messages(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS notification_history_device_campaign_idx
  ON public.notification_history (device_id, campaign_id);