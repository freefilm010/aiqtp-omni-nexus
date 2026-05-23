DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND roles @> ARRAY['public']::name[]
      AND (
        COALESCE(qual, '') ILIKE '%has_role%'
        OR COALESCE(with_check, '') ILIKE '%has_role%'
      )
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated',
      r.policyname,
      r.schemaname,
      r.tablename
    );
  END LOOP;
END $$;