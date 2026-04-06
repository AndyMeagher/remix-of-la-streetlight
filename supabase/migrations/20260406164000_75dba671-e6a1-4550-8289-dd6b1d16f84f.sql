
CREATE TABLE public.resources (
  id text PRIMARY KEY,
  name text NOT NULL,
  category text NOT NULL,
  address text NOT NULL,
  distance text NOT NULL DEFAULT 'Varies',
  hours text NOT NULL DEFAULT 'Varies',
  phone text,
  website text,
  tags text[],
  lat double precision,
  lng double precision,
  open_time time without time zone,
  close_time time without time zone,
  open_days integer[],
  is_always_open boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view resources"
ON public.resources
FOR SELECT
USING (true);
