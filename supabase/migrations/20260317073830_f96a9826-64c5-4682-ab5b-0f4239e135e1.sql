
-- Fix views to use security_invoker so they respect base table RLS
ALTER VIEW public.quwallet_wallets_safe SET (security_invoker = true);
ALTER VIEW public.ai_strategies_public SET (security_invoker = true);
ALTER VIEW public.data_aggregator_bots_public SET (security_invoker = true);
