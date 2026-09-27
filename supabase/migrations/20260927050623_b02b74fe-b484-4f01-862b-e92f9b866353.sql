REVOKE SELECT ON public.feature_flags FROM anon, authenticated;
GRANT SELECT (id, flag_key, display_name, description, is_enabled, audience, category, created_at, updated_at) ON public.feature_flags TO anon, authenticated;
GRANT UPDATE, INSERT, DELETE ON public.feature_flags TO authenticated;