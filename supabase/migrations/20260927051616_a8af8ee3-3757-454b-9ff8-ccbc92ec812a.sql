DROP POLICY IF EXISTS "Anyone can read feature flags" ON public.feature_flags;
CREATE OR REPLACE FUNCTION public.list_feature_flags()
RETURNS TABLE(id uuid, flag_key text, display_name text, description text, is_enabled boolean, audience text, category text, updated_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT f.id, f.flag_key::text, f.display_name::text, f.description::text, f.is_enabled, f.audience::text, f.category::text, f.updated_at
  FROM public.feature_flags f
  WHERE f.audience::text IN ('public','authenticated','beta')
     OR public.has_role(auth.uid(), 'admin')
  ORDER BY f.category, f.display_name
$$;
REVOKE ALL ON FUNCTION public.list_feature_flags() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_feature_flags() TO anon, authenticated, service_role;