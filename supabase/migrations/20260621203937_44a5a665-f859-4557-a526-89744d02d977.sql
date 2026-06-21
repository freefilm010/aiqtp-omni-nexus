CREATE INDEX IF NOT EXISTS idx_market_prices_market_cap_desc
  ON public.market_prices (market_cap DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_market_prices_coin_market_cap
  ON public.market_prices (coin_id, market_cap DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_token_price_feeds_base_currency_updated
  ON public.token_price_feeds (base_currency, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_platform_tokens_active_symbol
  ON public.platform_tokens (is_active, symbol);

CREATE INDEX IF NOT EXISTS idx_exchange_pairs_usd_last_price
  ON public.exchange_pairs (quote_currency, last_price, updated_at DESC)
  WHERE last_price IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ai_signals_active_created
  ON public.ai_signals (is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_screener_results_active_category
  ON public.screener_results (is_active, category, id);

CREATE INDEX IF NOT EXISTS idx_traditional_assets_active_market_cap
  ON public.traditional_assets (is_active, market_cap DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_market_coins_active_rank
  ON public.market_coins (is_active, market_cap_rank ASC NULLS LAST);