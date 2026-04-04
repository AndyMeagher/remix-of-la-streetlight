
CREATE POLICY "Service can delete expired subscriptions"
  ON public.push_subscriptions FOR DELETE TO public
  USING (true);
