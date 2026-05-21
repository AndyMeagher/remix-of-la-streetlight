
CREATE TABLE public.peer_support_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL DEFAULT 'share',
  external_key text NOT NULL UNIQUE,
  title text NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time,
  end_time time,
  time_label text,
  location text NOT NULL CHECK (location IN ('dtla','culvercity','online')),
  location_label text,
  format text NOT NULL DEFAULT 'in-person' CHECK (format IN ('in-person','online','hybrid')),
  zoom_id text,
  zoom_url text,
  zoom_password text,
  description text,
  tags text[],
  active boolean NOT NULL DEFAULT true,
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.peer_support_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active peer support groups"
  ON public.peer_support_groups FOR SELECT
  USING (active = true);

CREATE INDEX idx_peer_support_groups_day ON public.peer_support_groups(day_of_week, start_time);
CREATE INDEX idx_peer_support_groups_location ON public.peer_support_groups(location);

CREATE TRIGGER trg_peer_support_groups_updated
BEFORE UPDATE ON public.peer_support_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.peer_support_refresh_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ran_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL DEFAULT 'share',
  success boolean NOT NULL,
  groups_count integer,
  error text
);

ALTER TABLE public.peer_support_refresh_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view refresh log"
  ON public.peer_support_refresh_log FOR SELECT
  USING (true);
