CREATE OR REPLACE FUNCTION public.award_light_points(_device_id text, _action_type text, _ref_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _today date := (now() AT TIME ZONE 'America/Los_Angeles')::date;
  _points integer := 0;
  _daily_cap integer := 1;
  _today_count integer;
  _row public.light_points;
BEGIN
  CASE _action_type
    WHEN 'daily_open' THEN _points := 5; _daily_cap := 1;
    WHEN 'view_resource' THEN _points := 1; _daily_cap := 5;
    WHEN 'submit_tip' THEN _points := 10; _daily_cap := 1;
    WHEN 'tip_helpful' THEN _points := 5; _daily_cap := 999999;
    WHEN 'referral_share' THEN _points := 25; _daily_cap := 1;
    WHEN 'referral_install' THEN _points := 50; _daily_cap := 999999;
    WHEN 'milestone_complete' THEN _points := 10; _daily_cap := 13;
    WHEN 'vault_setup' THEN _points := 100; _daily_cap := 1;
    ELSE
      RETURN jsonb_build_object('awarded', 0, 'reason', 'unknown_action');
  END CASE;

  INSERT INTO public.light_points (device_id) VALUES (_device_id)
    ON CONFLICT (device_id) DO NOTHING;

  IF _action_type = 'view_resource' AND _ref_id IS NOT NULL THEN
    SELECT count(DISTINCT ref_id) INTO _today_count
      FROM public.light_actions
      WHERE device_id = _device_id
        AND action_type = 'view_resource'
        AND action_date = _today;
    IF _today_count >= _daily_cap THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'daily_cap');
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.light_actions
       WHERE device_id = _device_id AND action_type = 'view_resource'
         AND action_date = _today AND ref_id = _ref_id
    ) THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'already_awarded');
    END IF;
  ELSIF _action_type = 'milestone_complete' THEN
    IF _ref_id IS NULL THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'missing_ref');
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.light_actions
       WHERE device_id = _device_id AND action_type = 'milestone_complete'
         AND ref_id = _ref_id
    ) THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'already_awarded');
    END IF;
  ELSIF _action_type = 'vault_setup' THEN
    IF EXISTS (
      SELECT 1 FROM public.light_actions
       WHERE device_id = _device_id AND action_type = 'vault_setup'
    ) THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'already_awarded');
    END IF;
  ELSIF _action_type = 'tip_helpful' THEN
    IF _ref_id IS NULL THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'missing_ref');
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.light_actions
       WHERE action_type = 'tip_helpful' AND ref_id = _ref_id
    ) THEN
      RETURN jsonb_build_object('awarded', 0, 'reason', 'already_credited');
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

  UPDATE public.light_points
     SET today_points = CASE WHEN today_date = _today THEN today_points ELSE 0 END,
         today_date = _today
   WHERE device_id = _device_id;

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
$function$;