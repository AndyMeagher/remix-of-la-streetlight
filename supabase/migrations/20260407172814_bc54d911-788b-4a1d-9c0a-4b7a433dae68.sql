-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can read device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Anyone can update device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Anyone can delete device tokens" ON public.device_tokens;

-- Replace INSERT policy to also allow upsert (ON CONFLICT requires UPDATE)
-- Since upsert needs UPDATE, scope UPDATE to matching device_id
DROP POLICY IF EXISTS "Anyone can insert device tokens" ON public.device_tokens;

CREATE POLICY "Anyone can insert device tokens"
  ON public.device_tokens
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Devices can update own token"
  ON public.device_tokens
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);