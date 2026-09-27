-- Tighten access rules on four tables to mirror the hardened Test environment.

-- marketplace_suggestions -----------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read suggestions" ON public.marketplace_suggestions;
DROP POLICY IF EXISTS "Owners and admins read suggestions" ON public.marketplace_suggestions;
DROP POLICY IF EXISTS "Auth users can insert suggestions" ON public.marketplace_suggestions;
DROP POLICY IF EXISTS "Users can update own suggestions" ON public.marketplace_suggestions;
CREATE POLICY "Owners and admins read suggestions" ON public.marketplace_suggestions
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Auth users can insert suggestions" ON public.marketplace_suggestions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestions" ON public.marketplace_suggestions
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_suggestions TO authenticated;
GRANT ALL ON public.marketplace_suggestions TO service_role;
REVOKE ALL ON public.marketplace_suggestions FROM anon;

-- community_predictions -------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can read predictions" ON public.community_predictions;
DROP POLICY IF EXISTS "Owners and admins read predictions" ON public.community_predictions;
DROP POLICY IF EXISTS "Auth users create predictions" ON public.community_predictions;
CREATE POLICY "Owners and admins read predictions" ON public.community_predictions
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Auth users create predictions" ON public.community_predictions
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_predictions TO authenticated;
GRANT ALL ON public.community_predictions TO service_role;
REVOKE ALL ON public.community_predictions FROM anon;

-- arbitrage_opportunities ------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone authenticated can view arbitrage" ON public.arbitrage_opportunities;
DROP POLICY IF EXISTS "Admin can manage arbitrage" ON public.arbitrage_opportunities;
CREATE POLICY "Admin can manage arbitrage" ON public.arbitrage_opportunities
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arbitrage_opportunities TO authenticated;
GRANT ALL ON public.arbitrage_opportunities TO service_role;
REVOKE ALL ON public.arbitrage_opportunities FROM anon;

-- shared_script_likes ----------------------------------------------------------------------
DROP POLICY IF EXISTS "Likes visible to all auth" ON public.shared_script_likes;
DROP POLICY IF EXISTS "Users view own likes" ON public.shared_script_likes;
DROP POLICY IF EXISTS "Users like as self" ON public.shared_script_likes;
DROP POLICY IF EXISTS "Users unlike own" ON public.shared_script_likes;
CREATE POLICY "Users view own likes" ON public.shared_script_likes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Users like as self" ON public.shared_script_likes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.shared_script_likes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
GRANT SELECT, INSERT, DELETE ON public.shared_script_likes TO authenticated;
GRANT ALL ON public.shared_script_likes TO service_role;
REVOKE ALL ON public.shared_script_likes FROM anon;