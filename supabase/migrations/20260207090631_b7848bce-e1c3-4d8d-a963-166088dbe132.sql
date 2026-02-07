-- Fix ERROR-level security issues

-- 1) profiles: Remove overly permissive "Authenticated users can view profiles" policy
-- Keep only "Users can view their own profile" and "Admins can view all profiles"
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- 2) exchange_trades: Remove "Anyone can view trades", add user-scoped policy
DROP POLICY IF EXISTS "Anyone can view trades" ON public.exchange_trades;

CREATE POLICY "Users can view own trades"
ON public.exchange_trades
FOR SELECT
TO authenticated
USING (
  buyer_user_id = auth.uid() 
  OR seller_user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

-- 3) security_audit_log: Restrict INSERT to prevent log injection
-- Drop the overly permissive insert policy
DROP POLICY IF EXISTS "System can insert logs" ON public.security_audit_log;

-- Only allow inserts via the log_security_event function (which runs as SECURITY DEFINER)
-- Regular users cannot directly insert; they must go through the function
CREATE POLICY "Only system functions can insert logs"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (
  -- Only admins can insert directly (for manual logging)
  -- All other inserts go through log_security_event() function
  public.has_role(auth.uid(), 'admin')
);

-- 4) ai_strategies_public: This is likely a VIEW not a TABLE, but add RLS if it's a table
DO $$
BEGIN
  -- Check if it's a table and add RLS
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'ai_strategies_public' AND c.relkind = 'r'
  ) THEN
    ALTER TABLE public.ai_strategies_public ENABLE ROW LEVEL SECURITY;
    
    EXECUTE 'DROP POLICY IF EXISTS "Users can view strategies" ON public.ai_strategies_public';
    
    EXECUTE 'CREATE POLICY "Users can view own or graduated strategies"
    ON public.ai_strategies_public
    FOR SELECT
    TO authenticated
    USING (
      user_id = auth.uid()
      OR is_graduated = true
      OR public.has_role(auth.uid(), ''admin'')
    )';
  END IF;
END $$;

-- 5) quwallet_wallets_safe is a VIEW - views inherit RLS from underlying tables
-- The underlying quwallet_wallets table already has proper RLS
-- No action needed for the view itself