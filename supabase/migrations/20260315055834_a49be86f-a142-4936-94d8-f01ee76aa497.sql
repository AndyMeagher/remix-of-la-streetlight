
-- Create street tips table for anonymous tips
CREATE TABLE public.street_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  upvotes INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.street_tips ENABLE ROW LEVEL SECURITY;

-- Anyone can read tips
CREATE POLICY "Anyone can view tips" ON public.street_tips
  FOR SELECT USING (true);

-- Anyone can insert tips (anonymous)
CREATE POLICY "Anyone can add tips" ON public.street_tips
  FOR INSERT WITH CHECK (true);

-- Allow anonymous upvoting via update
CREATE POLICY "Anyone can upvote tips" ON public.street_tips
  FOR UPDATE USING (true) WITH CHECK (true);
