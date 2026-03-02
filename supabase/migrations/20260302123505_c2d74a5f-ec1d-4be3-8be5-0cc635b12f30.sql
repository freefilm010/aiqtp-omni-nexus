
-- Rate limit extension purchases (15% surcharge for extra AI calls)
CREATE TABLE public.rate_limit_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  function_name TEXT NOT NULL,
  extra_calls INTEGER NOT NULL DEFAULT 10,
  calls_used INTEGER NOT NULL DEFAULT 0,
  surcharge_percent NUMERIC NOT NULL DEFAULT 15,
  amount_charged NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 hour'),
  status TEXT NOT NULL DEFAULT 'active'
);

ALTER TABLE public.rate_limit_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own extensions"
  ON public.rate_limit_extensions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own extensions"
  ON public.rate_limit_extensions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own extensions"
  ON public.rate_limit_extensions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
