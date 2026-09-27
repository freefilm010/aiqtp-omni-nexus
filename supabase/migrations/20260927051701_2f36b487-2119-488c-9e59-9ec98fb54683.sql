DROP POLICY IF EXISTS "Anyone authenticated can view arbitrage" ON public.arbitrage_opportunities;
DROP POLICY IF EXISTS "Authenticated users can view arbitrage" ON public.arbitrage_opportunities;

DROP POLICY IF EXISTS "Anyone can read predictions" ON public.community_predictions;
CREATE POLICY "Owners and admins read predictions" ON public.community_predictions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.list_community_predictions(p_limit integer DEFAULT 30)
RETURNS TABLE(id uuid, ticker text, prediction_type text, direction text, target_price numeric, target_date date, confidence numeric, reasoning text, outcome text, outcome_resolved_at timestamptz, accuracy_score numeric, upvotes integer, created_at timestamptz, is_mine boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.ticker::text, p.prediction_type::text, p.direction::text, p.target_price::numeric, p.target_date::date,
         p.confidence::numeric, p.reasoning::text, p.outcome::text, p.outcome_resolved_at, p.accuracy_score::numeric,
         p.upvotes::int, p.created_at, (auth.uid() IS NOT NULL AND p.user_id = auth.uid())
  FROM public.community_predictions p
  ORDER BY p.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit,30),1),100)
$$;
REVOKE ALL ON FUNCTION public.list_community_predictions(integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_community_predictions(integer) TO anon, authenticated, service_role;