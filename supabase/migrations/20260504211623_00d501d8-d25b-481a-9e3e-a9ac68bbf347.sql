
-- Per-device Light Points totals
CREATE TABLE public.light_points (
  device_id text PRIMARY KEY,
  total_points integer NOT NULL DEFAULT 0,
  today_points integer NOT NULL DEFAULT 0,
  today_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Los_Angeles')::date,
  referral_code text NOT NULL DEFAULT substr(md5(random()::text), 1, 8) UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.light_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view light points"
  ON public.light_points FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert light points"
  ON public.light_points FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can update light points"
  ON public.light_points FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Action log (used for caps + referral dedupe)
CREATE TABLE public.light_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  action_type text NOT NULL,
  ref_id text,
  action_date date NOT NULL DEFAULT (now() AT TIME ZONE 'America/Los_Angeles')::date,
  points_awarded integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_light_actions_device_date ON public.light_actions(device_id, action_type, action_date);
CREATE INDEX idx_light_actions_referral ON public.light_actions(action_type, ref_id) WHERE action_type = 'referral_install';

ALTER TABLE public.light_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view actions"
  ON public.light_actions FOR SELECT TO public USING (true);

CREATE POLICY "Anyone can insert actions"
  ON public.light_actions FOR INSERT TO public WITH CHECK (true);

-- Award function: enforces daily caps + resets today_points when date rolls over
CREATE OR REPLACE FUNCTION public.award_light_points(
  _device_id text,
  _action_type text,
  _ref_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'America/Los_Angeles')::date;
  _points integer := 0;
  _daily_cap integer := 1;
  _today_count integer;
  _row public.light_points;
  _referrer_device text;
BEGIN
  -- Determine points + daily cap
  CASE _action_type
    WHEN 'daily_open' THEN _points := 5; _daily_cap := 1;
    WHEN 'view_resource' THEN _points := 1; _daily_cap := 5;
    WHEN 'submit_tip' THEN _points := 10; _daily_cap := 1;
    WHEN 'referral_share' THEN _points := 25; _daily_cap := 1;
    WHEN 'referral_install' THEN _points := 50; _daily_cap := 999999;
    ELSE
      RETURN jsonb_build_object('awarded', 0, 'reason', 'unknown_action');
  END CASE;

  -- Ensure row exists
  INSERT INTO public.light_points (device_id) VALUES (_device_id)
    ON CONFLICT (device_id) DO NOTHING;

  -- Daily-cap check
  IF _action_type = 'view_resource' AND _ref_id IS NOT NULL THEN
    -- Cap unique resource views per day
    SELECT count(DISTINCT ref_id) INTO _today_count
      FROM public.light_actions
      WHERE device_id = _device_id
        AND action_type = 'view_resource'
        AND action_date = _today;
    IF _today_count >= _daily_cap THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'daily_cap');
    END IF;
    -- Don't double-award same resource same day
    IF EXISTS (
      SELECT 1 FROM public.light_actions
       WHERE device_id = _device_id AND action_type = 'view_resource'
         AND action_date = _today AND ref_id = _ref_id
    ) THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'already_awarded');
    END IF;
  ELSIF _action_type IN ('daily_open','submit_tip','referral_share') THEN
    SELECT count(*) INTO _today_count
      FROM public.light_actions
      WHERE device_id = _device_id
        AND action_type = _action_type
        AND action_date = _today;
    IF _today_count >= _daily_cap THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'daily_cap');
    END IF;
  ELSIF _action_type = 'referral_install' THEN
    -- One install credit per installed device (ref_id = installed device_id)
    IF _ref_id IS NULL THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'missing_ref');
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.light_actions
       WHERE action_type = 'referral_install' AND ref_id = _ref_id
    ) THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'already_credited');
    END IF;
  END IF;

  -- Reset today's total if date rolled over
  UPDATE public.light_points
     SET today_points = CASE WHEN today_date = _today THEN today_points ELSE 0 END,
         today_date = _today
   WHERE device_id = _device_id;

  -- Award
  UPDATE public.light_points
     SET total_points = total_points + _points,
         today_points = today_points + _points,
         updated_at = now()
   WHERE device_id = _device_id
   RETURNING * INTO _row;

  INSERT INTO public.light_actions (device_id, action_type, ref_id, action_date, points_awarded)
    VALUES (_device_id, _action_type, _ref_id, _today, _points);

  RETURN jsonb_build_object(
    'awarded', _points,
    'total', _row.total_points,
    'today', _row.today_points
  );
END;
$$;

-- Helper: award the referrer when a new device installs via a ref code
CREATE OR REPLACE FUNCTION public.credit_referrer(
  _new_device_id text,
  _ref_code text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer text;
BEGIN
  SELECT device_id INTO _referrer FROM public.light_points WHERE referral_code = _ref_code;
  IF _referrer IS NULL OR _referrer = _new_device_id THEN
    RETURN jsonb_build_object('awarded', 0, 'reason', 'invalid_ref');
  END IF;
  RETURN public.award_light_points(_referrer, 'referral_install', _new_device_id);
END;
$$;

-- updated_at trigger
CREATE TRIGGER trg_light_points_updated_at
  BEFORE UPDATE ON public.light_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
