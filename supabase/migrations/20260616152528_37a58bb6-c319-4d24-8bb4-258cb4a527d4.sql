WITH campaign AS (
  INSERT INTO public.scheduled_campaigns (id, name, start_date, end_date, recurrence, active)
  VALUES (gen_random_uuid(), 'Hope the Mission — Free Resources', '2026-06-16', '2026-06-16', 'none', true)
  RETURNING id
)
INSERT INTO public.campaign_messages (campaign_id, title, body)
SELECT id, 'Luce', 'Hey — free meals, phones, hygiene kits, and community at Hope the Mission in North Hollywood. Today only, 9AM to 1PM. No pressure, just thought you should know. 💛'
FROM campaign;