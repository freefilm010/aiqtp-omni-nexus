-- Fix critical: Remove overly permissive SELECT policies
DROP POLICY IF EXISTS "Authenticated users can read balances" ON public.exchange_balances;
DROP POLICY IF EXISTS "Authenticated users can read holdings" ON public.data_token_holdings;