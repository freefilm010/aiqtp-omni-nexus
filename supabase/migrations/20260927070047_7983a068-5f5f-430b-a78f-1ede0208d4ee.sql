DROP POLICY IF EXISTS "Anyone can read likes" ON public.capitol_community_likes;
CREATE POLICY "Users read own likes or admin" ON public.capitol_community_likes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.capitol_community_likes FROM anon;
DROP POLICY IF EXISTS "Anyone can read votes" ON public.suggestion_votes;
CREATE POLICY "Users read own votes or admin" ON public.suggestion_votes FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
REVOKE SELECT ON public.suggestion_votes FROM anon;