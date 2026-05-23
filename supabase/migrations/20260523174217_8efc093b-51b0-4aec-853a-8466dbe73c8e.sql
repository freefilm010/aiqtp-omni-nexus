
-- 1) Restrict leaderboard_entries to authenticated only; public visitors use leaderboard_public
DROP POLICY IF EXISTS "Anyone can view leaderboards" ON public.leaderboard_entries;
DROP POLICY IF EXISTS "Authenticated users can view leaderboards" ON public.leaderboard_entries;
CREATE POLICY "Authenticated users can view leaderboards"
  ON public.leaderboard_entries
  FOR SELECT
  TO authenticated
  USING (true);

-- 2) Prevent users from mutating their saved Stripe identifiers
CREATE OR REPLACE FUNCTION public.guard_saved_payment_methods_immutable_ids()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id
     OR NEW.stripe_payment_method_id IS DISTINCT FROM OLD.stripe_payment_method_id
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Stripe identifiers and ownership cannot be modified';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_saved_payment_methods_immutable_ids ON public.saved_payment_methods;
CREATE TRIGGER guard_saved_payment_methods_immutable_ids
  BEFORE UPDATE ON public.saved_payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.guard_saved_payment_methods_immutable_ids();
