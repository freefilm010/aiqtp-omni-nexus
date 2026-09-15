CREATE TABLE IF NOT EXISTS public.strategy_capital_deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id uuid NOT NULL REFERENCES public.ai_strategies(id) ON DELETE CASCADE,
  allocated_usd numeric(20,8) NOT NULL CHECK (allocated_usd > 0),
  reinvest_percent numeric(5,2) NOT NULL DEFAULT 100 CHECK (reinvest_percent >= 0 AND reinvest_percent <= 100),
  mode text NOT NULL DEFAULT 'validation' CHECK (mode IN ('validation','live')),
  funding_source text NOT NULL DEFAULT 'platform_wallet',
  status text NOT NULL DEFAULT 'pending_execution_credentials'
    CHECK (status IN ('pending_execution_credentials','running','paused','closed')),
  realized_pnl_usd numeric(20,8) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.strategy_capital_deployments TO authenticated;
GRANT ALL ON public.strategy_capital_deployments TO service_role;

ALTER TABLE public.strategy_capital_deployments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owners and admins can read deployments" ON public.strategy_capital_deployments;
CREATE POLICY "owners and admins can read deployments"
ON public.strategy_capital_deployments FOR SELECT TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admins manage deployments" ON public.strategy_capital_deployments;
CREATE POLICY "admins manage deployments"
ON public.strategy_capital_deployments FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_strategy_capital_deployments_user
  ON public.strategy_capital_deployments(user_id, status);

DROP TRIGGER IF EXISTS set_strategy_capital_deployments_updated_at ON public.strategy_capital_deployments;
CREATE TRIGGER set_strategy_capital_deployments_updated_at
BEFORE UPDATE ON public.strategy_capital_deployments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();