
-- Fix inflated auto_invest data: testnet tokens were deployed at real market prices
-- Delete all transactions for assets that came from testnet faucet (everything except QTC, AIQ, NXS)
DELETE FROM auto_invest_transactions 
WHERE asset_symbol NOT IN ('QTC', 'AIQ', 'NXS');

-- Delete corresponding allocations
DELETE FROM auto_invest_allocations 
WHERE asset_symbol NOT IN ('QTC', 'AIQ', 'NXS');

-- Recalculate engine totals from remaining legitimate transactions
UPDATE auto_invest_engine
SET total_capital = COALESCE((
  SELECT SUM(amount_usd) FROM auto_invest_transactions WHERE engine_id = auto_invest_engine.id
), 0),
total_deployed = COALESCE((
  SELECT SUM(amount_usd) FROM auto_invest_transactions WHERE engine_id = auto_invest_engine.id
), 0),
cycle_count = COALESCE((
  SELECT COUNT(*) FROM auto_invest_transactions WHERE engine_id = auto_invest_engine.id
), 0),
updated_at = now();
