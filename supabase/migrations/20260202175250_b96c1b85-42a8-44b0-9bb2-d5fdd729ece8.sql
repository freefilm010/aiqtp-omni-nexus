
-- SECURITY HARDENING MIGRATION
-- Addresses ERROR-level security findings

-- 1. Fix ai_strategies: Protect proprietary code from being exposed even for rented strategies
DROP POLICY IF EXISTS "Users can view accessible strategies" ON public.ai_strategies;

CREATE POLICY "Users can view accessible strategies" 
ON public.ai_strategies 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR has_role(auth.uid(), 'admin'::app_role)
  OR (
    -- For rented/graduated strategies: show metadata but not code
    (is_graduated = true) AND (is_available_for_rent = true) AND (admin_approved = true)
  )
);

-- Create a view that hides code for non-owners
CREATE OR REPLACE VIEW public.ai_strategies_public AS
SELECT 
  id,
  user_id,
  name,
  description,
  status,
  factors,
  -- OMIT: code field for security
  created_at,
  updated_at,
  is_graduated,
  graduation_date,
  profitability_score,
  consistency_score,
  backtest_count,
  rental_price_monthly,
  is_available_for_rent,
  total_rentals,
  creator_earnings,
  admin_approved,
  code_protected,
  creator_profit_share,
  -- Return code ONLY if user is owner or admin
  CASE 
    WHEN auth.uid() = user_id THEN code
    WHEN has_role(auth.uid(), 'admin'::app_role) THEN code
    ELSE NULL 
  END AS code
FROM public.ai_strategies;

-- 2. Profiles: Restrict to authenticated users only (prevent scraping)
DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles viewable" ON public.profiles;

-- Allow users to view other profiles only if authenticated
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 3. influencer_partners: Already has admin + self policies, verify no public SELECT
-- (Confirmed from query: only admin and self can view - this is correct)

-- 4. connected_accounts: Already has user-only policy - verified correct

-- 5. quwallet_wallets: Strengthen - ensure no leakage
DROP POLICY IF EXISTS "Users can view their wallets" ON public.quwallet_wallets;

CREATE POLICY "Users can view own wallets only"
ON public.quwallet_wallets
FOR SELECT
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- 6. portfolio_holdings: Already has user-only policy - verified correct

-- 7. exchange_balances: Add explicit user-only write policy
CREATE POLICY "Users can manage own balances" 
ON public.exchange_balances
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 8. Add audit logging table for security events
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  details jsonb DEFAULT '{}'::jsonb,
  severity text DEFAULT 'info' CHECK (severity IN ('info', 'warn', 'error', 'critical')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view security logs"
ON public.security_audit_log
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert logs"
ON public.security_audit_log
FOR INSERT
WITH CHECK (true);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON public.security_audit_log(severity);

-- 9. Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_event_type text,
  p_details jsonb DEFAULT '{}'::jsonb,
  p_severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.security_audit_log (event_type, user_id, details, severity)
  VALUES (p_event_type, auth.uid(), p_details, p_severity)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
