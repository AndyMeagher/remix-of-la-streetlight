-- Drop all remaining public policies on device_tokens
DROP POLICY IF EXISTS "Anyone can insert device tokens" ON public.device_tokens;
DROP POLICY IF EXISTS "Devices can update own token" ON public.device_tokens;
