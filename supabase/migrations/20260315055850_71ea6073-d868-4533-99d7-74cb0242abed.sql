
-- Remove overly permissive update policy
DROP POLICY "Anyone can upvote tips" ON public.street_tips;

-- Create a secure function to increment upvotes only
CREATE OR REPLACE FUNCTION public.upvote_tip(tip_id UUID)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.street_tips SET upvotes = upvotes + 1 WHERE id = tip_id;
$$;
