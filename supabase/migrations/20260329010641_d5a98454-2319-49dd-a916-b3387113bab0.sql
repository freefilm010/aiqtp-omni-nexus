
-- ============================================================
-- MOVE SENSITIVE COLUMNS TO DEDICATED SECRETS TABLES
-- These tables have NO RLS SELECT policies - only service role can read
-- ============================================================

-- 1. Create secrets vault for wallet private keys (solana)
CREATE TABLE IF NOT EXISTS public.wallet_key_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL UNIQUE,
  wallet_source text NOT NULL, -- 'solana_wallets' or 'quwallet_wallets'
  encrypted_key_data text NOT NULL,
  key_derivation_salt text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.wallet_key_vault ENABLE ROW LEVEL SECURITY;
-- NO SELECT policies - only service_role can access this table

-- 2. Create secrets vault for API keys (connected accounts)
CREATE TABLE IF NOT EXISTS public.account_key_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL UNIQUE,
  api_key_encrypted text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.account_key_vault ENABLE ROW LEVEL SECURITY;
-- NO SELECT policies - only service_role can access

-- 3. Migrate existing data from solana_wallets
INSERT INTO public.wallet_key_vault (wallet_id, wallet_source, encrypted_key_data)
SELECT id, 'solana_wallets', encrypted_private_key
FROM public.solana_wallets
WHERE encrypted_private_key IS NOT NULL
ON CONFLICT (wallet_id) DO NOTHING;

-- 4. Migrate existing data from quwallet_wallets
INSERT INTO public.wallet_key_vault (wallet_id, wallet_source, encrypted_key_data, key_derivation_salt)
SELECT id, 'quwallet_wallets', encrypted_private_keys, key_derivation_salt
FROM public.quwallet_wallets
WHERE encrypted_private_keys IS NOT NULL
ON CONFLICT (wallet_id) DO NOTHING;

-- 5. Migrate existing data from connected_accounts
INSERT INTO public.account_key_vault (account_id, api_key_encrypted)
SELECT id, api_key_encrypted
FROM public.connected_accounts
WHERE api_key_encrypted IS NOT NULL
ON CONFLICT (account_id) DO NOTHING;

-- 6. Drop the sensitive columns from source tables
ALTER TABLE public.solana_wallets DROP COLUMN IF EXISTS encrypted_private_key;
ALTER TABLE public.quwallet_wallets DROP COLUMN IF EXISTS encrypted_private_keys;
ALTER TABLE public.quwallet_wallets DROP COLUMN IF EXISTS key_derivation_salt;
ALTER TABLE public.connected_accounts DROP COLUMN IF EXISTS api_key_encrypted;

-- 7. Faucet claims: hash the ip_address and drop raw column
ALTER TABLE public.faucet_claims ADD COLUMN IF NOT EXISTS ip_hash text;
UPDATE public.faucet_claims SET ip_hash = encode(sha256(ip_address::bytea), 'hex') WHERE ip_address IS NOT NULL AND ip_hash IS NULL;
ALTER TABLE public.faucet_claims DROP COLUMN IF EXISTS ip_address;

-- 8. Fix QTC transactions policy - was already changed but scanner found old one
DROP POLICY IF EXISTS "Anyone can view transactions" ON public.qtc_transactions;
-- Recreate only if it doesn't already exist as authenticated
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'qtc_transactions' AND policyname = 'Authenticated users view transactions'
  ) THEN
    EXECUTE $p$
      CREATE POLICY "Authenticated users view transactions"
        ON public.qtc_transactions FOR SELECT
        TO authenticated
        USING (true)
    $p$;
  END IF;
END $$;
