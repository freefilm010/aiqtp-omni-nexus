CREATE OR REPLACE VIEW public.faucet_leaderboard AS
WITH claims AS (
  SELECT
    fc.user_id,
    count(*)::integer AS total_claims,
    count(DISTINCT date(fc.created_at))::integer AS active_days
  FROM public.faucet_claims fc
  GROUP BY fc.user_id
), arb AS (
  SELECT
    'global'::text AS key,
    COALESCE(sum(ao.estimated_profit), 0::numeric) AS arb_profit,
    count(*)::integer AS arb_trades
  FROM public.arbitrage_opportunities ao
), autoinvest AS (
  SELECT
    ait.engine_id,
    aie.user_id,
    COALESCE(sum(ait.amount_usd), 0::numeric) AS invest_total,
    count(*)::integer AS invest_txns
  FROM public.auto_invest_transactions ait
  JOIN public.auto_invest_engine aie ON aie.id = ait.engine_id
  GROUP BY ait.engine_id, aie.user_id
), ai_strats AS (
  SELECT
    s.user_id,
    count(*)::integer AS strategies_created,
    count(*) FILTER (WHERE s.is_graduated = true)::integer AS strategies_graduated
  FROM public.ai_strategies s
  GROUP BY s.user_id
), ai_facs AS (
  SELECT
    f.user_id,
    count(*)::integer AS factors_created
  FROM public.ai_factors f
  GROUP BY f.user_id
), all_users AS (
  SELECT user_id FROM claims
  UNION
  SELECT user_id FROM autoinvest
  UNION
  SELECT user_id FROM ai_strats
  UNION
  SELECT user_id FROM ai_facs
)
SELECT
  au.user_id,
  COALESCE(NULLIF(p.username, ''), 'User ' || left(au.user_id::text, 6)) AS display_name,
  COALESCE(c.total_claims, 0) AS total_claims,
  COALESCE(c.active_days, 0) AS active_days,
  COALESCE(arb.arb_profit, 0::numeric) AS arb_profit,
  COALESCE(arb.arb_trades, 0) AS arb_trades,
  COALESCE(ai.invest_total, 0::numeric) AS invest_total,
  COALESCE(ai.invest_txns, 0) AS invest_txns,
  COALESCE(s.strategies_created, 0) AS strategies_created,
  COALESCE(s.strategies_graduated, 0) AS strategies_graduated,
  COALESCE(f.factors_created, 0) AS factors_created,
  COALESCE(c.total_claims, 0) * 1
    + COALESCE(c.active_days, 0) * 5
    + COALESCE(arb.arb_trades, 0) * 10
    + COALESCE(ai.invest_txns, 0) * 2
    + COALESCE(s.strategies_created, 0) * 50
    + COALESCE(s.strategies_graduated, 0) * 200
    + COALESCE(f.factors_created, 0) * 30 AS composite_score
FROM all_users au
LEFT JOIN claims c ON c.user_id = au.user_id
LEFT JOIN arb ON true
LEFT JOIN autoinvest ai ON ai.user_id = au.user_id
LEFT JOIN ai_strats s ON s.user_id = au.user_id
LEFT JOIN ai_facs f ON f.user_id = au.user_id
LEFT JOIN public.profiles p ON p.id = au.user_id
ORDER BY (
  COALESCE(c.total_claims, 0) * 1
    + COALESCE(c.active_days, 0) * 5
    + COALESCE(arb.arb_trades, 0) * 10
    + COALESCE(ai.invest_txns, 0) * 2
    + COALESCE(s.strategies_created, 0) * 50
    + COALESCE(s.strategies_graduated, 0) * 200
    + COALESCE(f.factors_created, 0) * 30
) DESC;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, avatar_url, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data ->> 'username', ''),
      NULLIF(split_part(NEW.email, '@', 1), '')
    ),
    NEW.raw_user_meta_data ->> 'avatar_url',
    NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    full_name = NULL,
    updated_at = now();
  RETURN NEW;
END;
$$;