ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_badge text DEFAULT '';

CREATE TABLE IF NOT EXISTS public.faucet_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_id text NOT NULL,
  interval_hours numeric NOT NULL DEFAULT 4,
  is_active boolean NOT NULL DEFAULT true,
  next_claim_at timestamptz DEFAULT now(),
  last_claimed_at timestamptz,
  total_auto_claims integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, token_id)
);

ALTER TABLE public.faucet_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own schedules" ON public.faucet_schedules
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage all schedules" ON public.faucet_schedules
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.compound_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  engine_id uuid NOT NULL,
  total_value numeric DEFAULT 0,
  total_deployed numeric DEFAULT 0,
  total_profit numeric DEFAULT 0,
  strategy_breakdown jsonb DEFAULT '[]',
  snapshot_at timestamptz DEFAULT now()
);

ALTER TABLE public.compound_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own snapshots" ON public.compound_snapshots
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "System inserts snapshots" ON public.compound_snapshots
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all snapshots" ON public.compound_snapshots
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));