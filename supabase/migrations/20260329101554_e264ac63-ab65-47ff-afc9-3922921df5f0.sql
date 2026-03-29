
-- Allow users to insert their own faucet claims
DROP POLICY IF EXISTS "Admins insert faucet claims" ON public.faucet_claims;
CREATE POLICY "Users can insert own faucet claims"
  ON public.faucet_claims FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Make wallet_address nullable since we may not always have one
ALTER TABLE public.faucet_claims ALTER COLUMN wallet_address DROP NOT NULL;
ALTER TABLE public.faucet_claims ALTER COLUMN wallet_address SET DEFAULT '';
ALTER TABLE public.faucet_claims ALTER COLUMN chain SET DEFAULT 'platform';
