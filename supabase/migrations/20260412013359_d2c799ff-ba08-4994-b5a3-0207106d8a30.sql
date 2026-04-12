DROP VIEW IF EXISTS public.faucet_leaderboard;
CREATE OR REPLACE VIEW public.faucet_leaderboard WITH (security_invoker = true) AS
SELECT 
  fc.user_id,
  COALESCE(p.username, 'Anon-' || LEFT(fc.user_id::text, 6)) as display_name,
  COUNT(*) as total_claims,
  COUNT(DISTINCT DATE(fc.created_at)) as active_days,
  COALESCE(arb.arb_profit, 0) as arb_profit,
  COALESCE(arb.arb_trades, 0) as arb_trades
FROM public.faucet_claims fc
LEFT JOIN public.profiles p ON p.id = fc.user_id
LEFT JOIN (
  SELECT 
    'system' as user_ref,
    SUM(estimated_profit) as arb_profit,
    COUNT(*) as arb_trades
  FROM public.arbitrage_opportunities
  WHERE estimated_profit > 0
) arb ON true
GROUP BY fc.user_id, p.username, arb.arb_profit, arb.arb_trades
ORDER BY total_claims DESC
LIMIT 20;