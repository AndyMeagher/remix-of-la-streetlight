
ALTER TABLE public.light_points
  ADD COLUMN IF NOT EXISTS current_streak integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date;

CREATE OR REPLACE FUNCTION public.update_streak(_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _today date := (now() AT TIME ZONE 'America/Los_Angeles')::date;
  _last date;
  _streak integer;
BEGIN
  INSERT INTO public.light_points (device_id) VALUES (_device_id)
    ON CONFLICT (device_id) DO NOTHING;

  SELECT last_active_date, current_streak INTO _last, _streak
    FROM public.light_points WHERE device_id = _device_id;

  IF _last = _today THEN
    -- Already counted today
    NULL;
  ELSIF _last = _today - INTERVAL '1 day' THEN
    _streak := COALESCE(_streak, 0) + 1;
  ELSE
    -- First time, or missed a full day
    _streak := 1;
  END IF;

  UPDATE public.light_points
     SET current_streak = _streak,
         last_active_date = _today,
         updated_at = now()
   WHERE device_id = _device_id;

  RETURN jsonb_build_object('streak', _streak, 'last_active', _today);
END;
$$;
