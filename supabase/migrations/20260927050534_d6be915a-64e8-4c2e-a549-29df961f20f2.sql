-- arbitrage: admin-only (not read by the app client)
DROP POLICY IF EXISTS "Authenticated users can view arbitrage" ON public.arbitrage_opportunities;

-- script likes: users see only their own likes (counts live on shared_scripts.likes)
DROP POLICY IF EXISTS "Likes visible to all auth" ON public.shared_script_likes;
CREATE POLICY "Users view own likes" ON public.shared_script_likes FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- suggestions: table rows readable by owner/admin; public board served without author ids
DROP POLICY IF EXISTS "Anyone can read suggestions" ON public.marketplace_suggestions;
CREATE POLICY "Owners and admins read suggestions" ON public.marketplace_suggestions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.list_marketplace_suggestions()
RETURNS TABLE(id uuid, title text, description text, category text, status text, votes integer, comments integer, is_hot boolean, created_at timestamptz, is_mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.id, s.title, s.description, s.category, s.status, s.votes::int, s.comments::int, s.is_hot, s.created_at,
         (auth.uid() IS NOT NULL AND s.user_id = auth.uid())
  FROM public.marketplace_suggestions s
$$;
REVOKE ALL ON FUNCTION public.list_marketplace_suggestions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_marketplace_suggestions() TO anon, authenticated, service_role;

-- vote counts maintained server-side
CREATE OR REPLACE FUNCTION public.sync_suggestion_votes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid := COALESCE(NEW.suggestion_id, OLD.suggestion_id);
BEGIN
  UPDATE public.marketplace_suggestions SET votes = (SELECT count(*) FROM public.suggestion_votes WHERE suggestion_id = v_id), updated_at = now() WHERE id = v_id;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.sync_suggestion_votes() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_sync_suggestion_votes ON public.suggestion_votes;
CREATE TRIGGER trg_sync_suggestion_votes AFTER INSERT OR DELETE ON public.suggestion_votes FOR EACH ROW EXECUTE FUNCTION public.sync_suggestion_votes();