-- Add device_id column to street_tips for rate limiting
ALTER TABLE public.street_tips ADD COLUMN IF NOT EXISTS device_id text;

-- Remove the public INSERT policy - tips will go through edge function
DROP POLICY IF EXISTS "Anyone can add tips" ON public.street_tips;