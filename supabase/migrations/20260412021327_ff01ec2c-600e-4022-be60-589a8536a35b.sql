
DROP VIEW IF EXISTS public.faucet_leaderboard;

CREATE OR REPLACE VIEW public.faucet_leaderboard AS
WITH claims AS (
  SELECT
    fc.user_id,
    COUNT(*)::int AS total_claims,
    COUNT(DISTINCT DATE(fc.created_at))::int AS active_days
  FROM public.faucet_claims fc
  GROUP BY fc.user_id
),
arb AS (
  SELECT
    'global'::text AS key,
    COALESCE(SUM(ao.estimated_profit), 0) AS arb_profit,
    COUNT(*)::int AS arb_trades
  FROM public.arbitrage_opportunities ao
),
autoinvest AS (
  SELECT
    ait.engine_id,
    aie.user_id,
    COALESCE(SUM(ait.amount_usd), 0) AS invest_total,
    COUNT(*)::int AS invest_txns
  FROM public.auto_invest_transactions ait
  JOIN public.auto_invest_engine aie ON aie.id = ait.engine_id
  GROUP BY ait.engine_id, aie.user_id
),
ai_strats AS (
  SELECT
    s.user_id,
    COUNT(*)::int AS strategies_created,
    COUNT(*) FILTER (WHERE s.is_graduated = true)::int AS strategies_graduated
  FROM public.ai_strategies s
  GROUP BY s.user_id
),
ai_facs AS (
  SELECT
    f.user_id,
    COUNT(*)::int AS factors_created
  FROM public.ai_factors f
  GROUP BY f.user_id
),
all_users AS (
  SELECT user_id FROM claims
  UNION SELECT user_id FROM autoinvest
  UNION SELECT user_id FROM ai_strats
  UNION SELECT user_id FROM ai_facs
)
SELECT
  au.user_id,
  COALESCE(p.full_name, 'User ' || LEFT(au.user_id::text, 6)) AS display_name,
  COALESCE(c.total_claims, 0) AS total_claims,
  COALESCE(c.active_days, 0) AS active_days,
  COALESCE(arb.arb_profit, 0) AS arb_profit,
  COALESCE(arb.arb_trades, 0) AS arb_trades,
  COALESCE(ai.invest_total, 0) AS invest_total,
  COALESCE(ai.invest_txns, 0) AS invest_txns,
  COALESCE(s.strategies_created, 0) AS strategies_created,
  COALESCE(s.strategies_graduated, 0) AS strategies_graduated,
  COALESCE(f.factors_created, 0) AS factors_created,
  (
    COALESCE(c.total_claims, 0) * 1
    + COALESCE(c.active_days, 0) * 5
    + COALESCE(arb.arb_trades, 0) * 10
    + COALESCE(ai.invest_txns, 0) * 2
    + COALESCE(s.strategies_created, 0) * 50
    + COALESCE(s.strategies_graduated, 0) * 200
    + COALESCE(f.factors_created, 0) * 30
  ) AS composite_score
FROM all_users au
LEFT JOIN claims c ON c.user_id = au.user_id
LEFT JOIN arb ON TRUE
LEFT JOIN autoinvest ai ON ai.user_id = au.user_id
LEFT JOIN ai_strats s ON s.user_id = au.user_id
LEFT JOIN ai_facs f ON f.user_id = au.user_id
LEFT JOIN public.profiles p ON p.id = au.user_id
ORDER BY composite_score DESC;
