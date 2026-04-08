-- Remove all public policies from push_subscriptions
DROP POLICY IF EXISTS "Anyone can insert subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can read subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can update subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Service can delete expired subscriptions" ON public.push_subscriptions;

-- Remove all public policies from notification_history
DROP POLICY IF EXISTS "Anyone can insert history" ON public.notification_history;
DROP POLICY IF EXISTS "Anyone can read history" ON public.notification_history;