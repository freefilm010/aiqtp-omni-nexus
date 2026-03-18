
-- ============================================
-- 1. ADD USDT + ETH PAIRS FOR ALL 3 TOKENS
-- ============================================

-- QTC/USDT
INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, is_active, min_order_size, max_order_size, price_precision, quantity_precision, maker_fee_percent, taker_fee_percent, last_price, bid_price, ask_price)
VALUES 
  ('f8766e19-0ae9-4791-9198-5fd50852ff85', 'USDT', 'QTC/USDT', true, 1, 10000000, 8, 8, 0.10, 0.15, 0.001, 0.00099, 0.00101),
  ('f8766e19-0ae9-4791-9198-5fd50852ff85', 'ETH', 'QTC/ETH', true, 1, 10000000, 12, 8, 0.10, 0.15, 0.0000004, 0.00000039, 0.00000041);

-- QAQI/USDT + QAQI/BTC + QAQI/ETH
INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, is_active, min_order_size, max_order_size, price_precision, quantity_precision, maker_fee_percent, taker_fee_percent, last_price, bid_price, ask_price)
VALUES 
  ('79df9737-2ca6-4ba2-afc8-ad129950aac7', 'USDT', 'QAQI/USDT', true, 1, 10000000, 8, 8, 0.10, 0.15, 0.0005, 0.000495, 0.000505),
  ('79df9737-2ca6-4ba2-afc8-ad129950aac7', 'BTC', 'QAQI/BTC', true, 1, 10000000, 12, 8, 0.10, 0.15, 0.000000005, 0.0000000049, 0.0000000051),
  ('79df9737-2ca6-4ba2-afc8-ad129950aac7', 'ETH', 'QAQI/ETH', true, 1, 10000000, 12, 8, 0.10, 0.15, 0.0000002, 0.00000019, 0.00000021);

-- AIQTP/USDT + AIQTP/BTC + AIQTP/ETH
INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, is_active, min_order_size, max_order_size, price_precision, quantity_precision, maker_fee_percent, taker_fee_percent, last_price, bid_price, ask_price)
VALUES 
  ('535df12c-e51d-47c6-bb0c-e392c8adec67', 'USDT', 'AIQTP/USDT', true, 1, 10000000, 8, 8, 0.10, 0.15, 0.0008, 0.000792, 0.000808),
  ('535df12c-e51d-47c6-bb0c-e392c8adec67', 'BTC', 'AIQTP/BTC', true, 1, 10000000, 12, 8, 0.10, 0.15, 0.000000008, 0.0000000079, 0.0000000081),
  ('535df12c-e51d-47c6-bb0c-e392c8adec67', 'ETH', 'AIQTP/ETH', true, 1, 10000000, 12, 8, 0.10, 0.15, 0.00000032, 0.00000031, 0.00000033);

-- ============================================
-- 2. CROSS-PAIRS BETWEEN OUR TOKENS
-- ============================================
INSERT INTO public.exchange_pairs (base_token_id, quote_currency, pair_symbol, is_active, min_order_size, max_order_size, price_precision, quantity_precision, maker_fee_percent, taker_fee_percent, last_price, bid_price, ask_price)
VALUES 
  ('79df9737-2ca6-4ba2-afc8-ad129950aac7', 'QTC', 'QAQI/QTC', true, 1, 10000000, 8, 8, 0.05, 0.08, 0.5, 0.495, 0.505),
  ('535df12c-e51d-47c6-bb0c-e392c8adec67', 'QTC', 'AIQTP/QTC', true, 1, 10000000, 8, 8, 0.05, 0.08, 0.8, 0.792, 0.808);

-- ============================================
-- 3. SEED CIRCULATING SUPPLY FOR QAQI & AIQTP
-- ============================================
UPDATE public.platform_tokens 
SET circulating_supply = 25000000, updated_at = now()
WHERE symbol = 'QAQI';

UPDATE public.platform_tokens 
SET circulating_supply = 37500000, updated_at = now()
WHERE symbol = 'AIQTP';

-- ============================================
-- 4. ADD PRICE FEEDS FOR NEW PAIRS
-- ============================================
INSERT INTO public.token_price_feeds (token_id, base_currency, price, volume_24h, market_cap, source)
VALUES
  ('f8766e19-0ae9-4791-9198-5fd50852ff85', 'USDT', 0.001, 0, 50000, 'internal'),
  ('f8766e19-0ae9-4791-9198-5fd50852ff85', 'ETH', 0.0000004, 0, 50000, 'internal'),
  ('79df9737-2ca6-4ba2-afc8-ad129950aac7', 'USDT', 0.0005, 0, 12500, 'internal'),
  ('79df9737-2ca6-4ba2-afc8-ad129950aac7', 'BTC', 0.000000005, 0, 12500, 'internal'),
  ('79df9737-2ca6-4ba2-afc8-ad129950aac7', 'ETH', 0.0000002, 0, 12500, 'internal'),
  ('535df12c-e51d-47c6-bb0c-e392c8adec67', 'USDT', 0.0008, 0, 30000, 'internal'),
  ('535df12c-e51d-47c6-bb0c-e392c8adec67', 'BTC', 0.000000008, 0, 30000, 'internal'),
  ('535df12c-e51d-47c6-bb0c-e392c8adec67', 'ETH', 0.00000032, 0, 30000, 'internal');

-- ============================================
-- 5. FEE VOUCHER / DISCOUNT SYSTEM
-- ============================================

-- Fee discount tiers based on token holdings
CREATE TABLE IF NOT EXISTS public.fee_discount_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol varchar NOT NULL DEFAULT 'QTC',
  tier_name varchar NOT NULL,
  min_holding numeric NOT NULL,
  fee_discount_percent numeric NOT NULL,  -- e.g. 25 = 25% off fees
  futures_voucher_monthly numeric DEFAULT 0,  -- $ value of monthly futures voucher
  extra_perks jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fee_discount_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read fee tiers" ON public.fee_discount_tiers FOR SELECT USING (true);

-- Seed fee discount tiers for QTC holders
INSERT INTO public.fee_discount_tiers (token_symbol, tier_name, min_holding, fee_discount_percent, futures_voucher_monthly, extra_perks) VALUES
  ('QTC', 'Bronze Holder', 1000, 10, 5, '["priority_support"]'),
  ('QTC', 'Silver Holder', 10000, 20, 15, '["priority_support","reduced_withdrawal"]'),
  ('QTC', 'Gold Holder', 100000, 35, 50, '["priority_support","reduced_withdrawal","exclusive_signals"]'),
  ('QTC', 'Platinum Holder', 500000, 50, 150, '["priority_support","zero_withdrawal","exclusive_signals","vip_chat"]'),
  ('QTC', 'Diamond Holder', 1000000, 70, 500, '["priority_support","zero_withdrawal","exclusive_signals","vip_chat","personal_manager"]'),
  ('QAQI', 'QAQI Supporter', 5000, 15, 10, '["ai_priority_queue"]'),
  ('QAQI', 'QAQI Power', 50000, 30, 40, '["ai_priority_queue","advanced_models"]'),
  ('QAQI', 'QAQI Elite', 500000, 50, 200, '["ai_priority_queue","advanced_models","custom_training"]'),
  ('AIQTP', 'AIQTP Starter', 5000, 12, 8, '["platform_beta_access"]'),
  ('AIQTP', 'AIQTP Pro', 50000, 28, 35, '["platform_beta_access","governance_vote"]'),
  ('AIQTP', 'AIQTP Whale', 500000, 55, 250, '["platform_beta_access","governance_vote","revenue_share"]');

-- User fee vouchers (issued monthly or as rewards)
CREATE TABLE IF NOT EXISTS public.fee_vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  voucher_type varchar NOT NULL DEFAULT 'fee_discount',  -- fee_discount, futures_credit, gas_rebate
  value_usd numeric NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,  -- for % based vouchers
  token_paid varchar,  -- which token was used/held to earn this
  valid_from timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  is_used boolean DEFAULT false,
  used_at timestamptz,
  used_on_transaction_id uuid,
  source varchar DEFAULT 'holding_reward',  -- holding_reward, contest_prize, referral, purchase
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.fee_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own vouchers" ON public.fee_vouchers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts vouchers" ON public.fee_vouchers FOR INSERT TO authenticated WITH CHECK (true);

-- Token burn mechanism for fee payments (deflationary)
CREATE TABLE IF NOT EXISTS public.token_burns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_symbol varchar NOT NULL,
  amount_burned numeric NOT NULL,
  burn_reason varchar NOT NULL DEFAULT 'fee_payment',  -- fee_payment, voucher_purchase, voluntary
  usd_value_at_burn numeric,
  fee_discount_applied numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.token_burns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own burns" ON public.token_burns FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins read all burns" ON public.token_burns FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System inserts burns" ON public.token_burns FOR INSERT TO authenticated WITH CHECK (true);
