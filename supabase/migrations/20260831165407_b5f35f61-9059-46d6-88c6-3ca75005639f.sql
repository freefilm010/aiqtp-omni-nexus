CREATE TABLE IF NOT EXISTS public.quantum_asset_registry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  legacy_symbol TEXT NOT NULL,
  legacy_name TEXT NOT NULL,
  legacy_quantity NUMERIC NOT NULL DEFAULT 0,
  legacy_value_usd NUMERIC NOT NULL DEFAULT 0,
  quantum_symbol TEXT NOT NULL,
  quantum_class TEXT NOT NULL DEFAULT 'QTC',
  asset_hash TEXT NOT NULL,
  entropy_source TEXT NOT NULL DEFAULT 'local_csprng',
  quantum_backend TEXT,
  quantum_job_id TEXT,
  entropy_bits INTEGER NOT NULL DEFAULT 0,
  shannon_entropy NUMERIC,
  dilithium_public_key TEXT NOT NULL,
  attestation_signature TEXT NOT NULL,
  kem_algorithm TEXT NOT NULL DEFAULT 'ML-KEM-768',
  sig_algorithm TEXT NOT NULL DEFAULT 'ML-DSA-65',
  wallet_id UUID REFERENCES public.quwallet_wallets(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'attested',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_quantum_asset_user_symbol
  ON public.quantum_asset_registry (user_id, legacy_symbol);
CREATE INDEX IF NOT EXISTS idx_quantum_asset_user ON public.quantum_asset_registry (user_id, created_at DESC);

GRANT SELECT ON public.quantum_asset_registry TO authenticated;
GRANT ALL ON public.quantum_asset_registry TO service_role;

ALTER TABLE public.quantum_asset_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own quantum assets" ON public.quantum_asset_registry;
CREATE POLICY "Users read own quantum assets"
  ON public.quantum_asset_registry FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trg_quantum_asset_registry_updated_at ON public.quantum_asset_registry;
CREATE TRIGGER trg_quantum_asset_registry_updated_at
  BEFORE UPDATE ON public.quantum_asset_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();