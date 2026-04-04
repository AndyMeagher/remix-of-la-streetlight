
CREATE TABLE public.device_tokens (
  device_id text PRIMARY KEY,
  platform text NOT NULL CHECK (platform IN ('ios', 'web')),
  token text NOT NULL,
  p256dh text,
  auth text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert device tokens"
ON public.device_tokens FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Anyone can read device tokens"
ON public.device_tokens FOR SELECT
TO public
USING (true);

CREATE POLICY "Anyone can update device tokens"
ON public.device_tokens FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete device tokens"
ON public.device_tokens FOR DELETE
TO public
USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_device_tokens_updated_at
BEFORE UPDATE ON public.device_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
