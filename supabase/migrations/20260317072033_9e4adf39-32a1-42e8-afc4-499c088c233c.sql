
-- Fix 1: Restrict forensic_transactions SELECT to admin-only
DROP POLICY IF EXISTS "Authenticated users can view forensic transactions" ON public.forensic_transactions;
DROP POLICY IF EXISTS "Anyone can view forensic transactions" ON public.forensic_transactions;

CREATE POLICY "Only admins can view forensic transactions"
  ON public.forensic_transactions
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Add RLS to quwallet_wallets_safe view
ALTER VIEW public.quwallet_wallets_safe SET (security_invoker = true);
ALTER VIEW public.quwallet_wallets_safe OWNER TO postgres;

-- Enable RLS on the underlying quwallet_wallets table policies already exist,
-- but ensure the safe view respects them via security_invoker.
-- Add explicit policy on the view if supported, otherwise rely on security_invoker
-- propagating the base table's RLS policies.
