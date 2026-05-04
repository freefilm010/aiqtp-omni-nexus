-- ============================================================================
-- Revenue Infrastructure: Plaid ACH, PayPal deposits, auto-invest cron,
-- affiliate referral capture, platform revenue tracking
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. plaid_items — stores Plaid access tokens per user
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plaid_items (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text       NOT NULL,
  item_id     text        NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own plaid items"
  ON public.plaid_items FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Service role manages plaid items"
  ON public.plaid_items FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 2. pending_ach_transfers — ACH bank transfer queue
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pending_ach_transfers (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id  text          NOT NULL,
  amount_usd  numeric(12,2) NOT NULL CHECK (amount_usd >= 20),
  status      text          NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','settled','failed','cancelled')),
  transfer_ref text,
  settled_at  timestamptz,
  created_at  timestamptz   NOT NULL DEFAULT now()
);
ALTER TABLE public.pending_ach_transfers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own ach transfers"
  ON public.pending_ach_transfers FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages ach transfers"
  ON public.pending_ach_transfers FOR ALL USING (auth.role() = 'service_role');

-- ---------------------------------------------------------------------------
-- 3. affiliate_signups — track referral codes at signup (lifetime revenue)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.affiliate_signups (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referred_user_id uuid       NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  referrer_code   text        NOT NULL,
  referrer_user_id uuid       REFERENCES auth.users(id) ON DELETE SET NULL,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own referral"
  ON public.affiliate_signups FOR SELECT TO authenticated
  USING (referred_user_id = auth.uid() OR referrer_user_id = auth.uid());
CREATE POLICY "Service role manages affiliate signups"
  ON public.affiliate_signups FOR ALL USING (auth.role() = 'service_role');

-- Index for fast referrer lookup (needed for affiliate earnings calc)
CREATE INDEX IF NOT EXISTS idx_affiliate_signups_referrer
  ON public.affiliate_signups (referrer_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_signups_referrer_user
  ON public.affiliate_signups (referrer_user_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 4. user_referral_codes — give each user a unique shareable ref code
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_referral_codes (
  user_id     uuid  PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text  NOT NULL UNIQUE DEFAULT upper(substring(gen_random_uuid()::text, 1, 8)),
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own referral code"
  ON public.user_referral_codes FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Service role manages referral codes"
  ON public.user_referral_codes FOR ALL USING (auth.role() = 'service_role');

-- Auto-generate a referral code for every new user
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_referral_codes (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_referral_code ON auth.users;
CREATE TRIGGER on_user_created_referral_code
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.generate_referral_code();

-- ---------------------------------------------------------------------------
-- 5. RPC: record_affiliate_signup — call after new user signup
--    Matches referral code to referrer and records the relationship
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_affiliate_signup(
  p_referred_user_id  uuid,
  p_referral_code     text,
  p_utm_source        text DEFAULT NULL,
  p_utm_medium        text DEFAULT NULL,
  p_utm_campaign      text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_referrer_user_id uuid;
BEGIN
  -- Look up who owns this referral code
  SELECT user_id INTO v_referrer_user_id
  FROM public.user_referral_codes
  WHERE code = upper(p_referral_code);

  -- Don't let users refer themselves
  IF v_referrer_user_id = p_referred_user_id THEN
    RETURN;
  END IF;

  INSERT INTO public.affiliate_signups (
    referred_user_id, referrer_code, referrer_user_id,
    utm_source, utm_medium, utm_campaign
  ) VALUES (
    p_referred_user_id, upper(p_referral_code), v_referrer_user_id,
    p_utm_source, p_utm_medium, p_utm_campaign
  )
  ON CONFLICT (referred_user_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_affiliate_signup(uuid,text,text,text,text) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 6. View: affiliate_earnings_summary — referrer sees lifetime earnings
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.affiliate_earnings_summary AS
SELECT
  s.referrer_user_id,
  s.referrer_code,
  COUNT(s.id)                                          AS total_referrals,
  COALESCE(SUM(fe.platform_fee_usd * 0.10), 0)        AS lifetime_earnings_usd,
  COALESCE(SUM(CASE WHEN fe.status='collected' THEN fe.platform_fee_usd * 0.10 ELSE 0 END), 0) AS paid_earnings_usd
FROM public.affiliate_signups s
LEFT JOIN public.platform_fee_events fe
  ON fe.user_id = s.referred_user_id
GROUP BY s.referrer_user_id, s.referrer_code;

GRANT SELECT ON public.affiliate_earnings_summary TO authenticated;

-- ---------------------------------------------------------------------------
-- 7. pg_cron: auto-invest engine runs every hour (if pg_cron enabled)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'auto-invest-hourly',
      '0 * * * *',
      $$
        SELECT net.http_post(
          url := current_setting('app.supabase_url') || '/functions/v1/auto-invest',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.service_role_key')
          ),
          body := '{"action":"analyze","engine_id":"default"}'::jsonb
        );
      $$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available — skip auto-invest schedule';
END;
$$;
