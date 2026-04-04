
CREATE TABLE public.tip_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tip_id UUID NOT NULL REFERENCES public.street_tips(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tip_id, device_id)
);

ALTER TABLE public.tip_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can report tips" ON public.tip_reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read reports" ON public.tip_reports
  FOR SELECT USING (true);

CREATE INDEX idx_tip_reports_tip_id ON public.tip_reports(tip_id);
