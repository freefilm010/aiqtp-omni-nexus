-- 1) Public-safe supported chains table without rpc_url
CREATE TABLE IF NOT EXISTS public.supported_chains_public (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  chain_type TEXT NOT NULL,
  explorer_url TEXT,
  logo_url TEXT,
  is_evm_compatible BOOLEAN,
  is_active BOOLEAN,
  native_token_coingecko_id TEXT,
  features JSONB,
  created_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.supported_chains_public ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users view supported chains public" ON public.supported_chains_public;
CREATE POLICY "Authenticated users view supported chains public"
ON public.supported_chains_public
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Admins manage supported chains public" ON public.supported_chains_public;
CREATE POLICY "Admins manage supported chains public"
ON public.supported_chains_public
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.supported_chains_public (
  id, name, symbol, chain_type, explorer_url, logo_url,
  is_evm_compatible, is_active, native_token_coingecko_id, features, created_at
)
SELECT
  id, name, symbol, chain_type, explorer_url, logo_url,
  is_evm_compatible, is_active, native_token_coingecko_id, features, created_at
FROM public.supported_chains
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  symbol = EXCLUDED.symbol,
  chain_type = EXCLUDED.chain_type,
  explorer_url = EXCLUDED.explorer_url,
  logo_url = EXCLUDED.logo_url,
  is_evm_compatible = EXCLUDED.is_evm_compatible,
  is_active = EXCLUDED.is_active,
  native_token_coingecko_id = EXCLUDED.native_token_coingecko_id,
  features = EXCLUDED.features,
  created_at = EXCLUDED.created_at;

CREATE OR REPLACE FUNCTION public.sync_supported_chains_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.supported_chains_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.supported_chains_public (
    id, name, symbol, chain_type, explorer_url, logo_url,
    is_evm_compatible, is_active, native_token_coingecko_id, features, created_at
  ) VALUES (
    NEW.id, NEW.name, NEW.symbol, NEW.chain_type, NEW.explorer_url, NEW.logo_url,
    NEW.is_evm_compatible, NEW.is_active, NEW.native_token_coingecko_id, NEW.features, NEW.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    symbol = EXCLUDED.symbol,
    chain_type = EXCLUDED.chain_type,
    explorer_url = EXCLUDED.explorer_url,
    logo_url = EXCLUDED.logo_url,
    is_evm_compatible = EXCLUDED.is_evm_compatible,
    is_active = EXCLUDED.is_active,
    native_token_coingecko_id = EXCLUDED.native_token_coingecko_id,
    features = EXCLUDED.features,
    created_at = EXCLUDED.created_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_supported_chains_public_trigger ON public.supported_chains;
CREATE TRIGGER sync_supported_chains_public_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.supported_chains
FOR EACH ROW EXECUTE FUNCTION public.sync_supported_chains_public();

-- 2) Private RPC endpoints table (admin only)
CREATE TABLE IF NOT EXISTS public.supported_chain_rpc_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id TEXT NOT NULL UNIQUE REFERENCES public.supported_chains(id) ON DELETE CASCADE,
  rpc_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.supported_chain_rpc_endpoints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage supported chain RPC endpoints" ON public.supported_chain_rpc_endpoints;
CREATE POLICY "Admins manage supported chain RPC endpoints"
ON public.supported_chain_rpc_endpoints
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.supported_chain_rpc_endpoints (chain_id, rpc_url)
SELECT id, rpc_url
FROM public.supported_chains
WHERE rpc_url IS NOT NULL
ON CONFLICT (chain_id)
DO UPDATE SET rpc_url = EXCLUDED.rpc_url, updated_at = now();

DROP POLICY IF EXISTS "Authenticated users view supported chains" ON public.supported_chains;

-- 3) Tighten market alerts to owner-only
DROP POLICY IF EXISTS "Users insert own alerts" ON public.market_alerts;
DROP POLICY IF EXISTS "Users can create alerts" ON public.market_alerts;
DROP POLICY IF EXISTS "Users read own alerts" ON public.market_alerts;
DROP POLICY IF EXISTS "Users update own alerts" ON public.market_alerts;

CREATE POLICY "Users read own alerts"
ON public.market_alerts
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users insert own alerts"
ON public.market_alerts
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own alerts"
ON public.market_alerts
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

ALTER TABLE public.market_alerts
ALTER COLUMN user_id SET NOT NULL;

-- 4) Tighten activity log writes
DROP POLICY IF EXISTS "Users can insert own activity" ON public.platform_activity_log;
CREATE POLICY "Users can insert own activity"
ON public.platform_activity_log
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND activity_type IN (
    'login', 'logout', 'page_view', 'trade', 'strategy_create', 'strategy_update',
    'factor_create', 'backtest_run', 'faucet_claim', 'chat_start', 'settings_update',
    'profile_update', 'feedback_submit'
  )
  AND category IN (
    'auth', 'navigation', 'portfolio', 'trading', 'strategy', 'factor',
    'analytics', 'settings', 'profile', 'faucet', 'chat', 'feedback'
  )
  AND char_length(description) <= 500
);

-- 5) Restrict payment method reads to owners only
DROP POLICY IF EXISTS "Users can view accessible payment methods" ON public.saved_payment_methods;
DROP POLICY IF EXISTS "Admins can view all payment methods" ON public.saved_payment_methods;
CREATE POLICY "Users can view own payment methods"
ON public.saved_payment_methods
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
