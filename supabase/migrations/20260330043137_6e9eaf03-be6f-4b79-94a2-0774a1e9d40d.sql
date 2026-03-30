DROP VIEW IF EXISTS public.faucet_leaderboard;
CREATE OR REPLACE VIEW public.faucet_leaderboard WITH (security_invoker = true) AS
SELECT 
  fc.user_id,
  COALESCE(p.username, 'Anon-' || LEFT(fc.user_id::text, 6)) as display_name,
  COUNT(*) as total_claims,
  COUNT(DISTINCT DATE(fc.created_at)) as active_days
FROM public.faucet_claims fc
LEFT JOIN public.profiles p ON p.id = fc.user_id
GROUP BY fc.user_id, p.username
ORDER BY total_claims DESC
LIMIT 20;