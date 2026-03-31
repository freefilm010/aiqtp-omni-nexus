ALTER TABLE public.auto_invest_engine
ADD COLUMN IF NOT EXISTS user_id UUID;

WITH inferred_owner AS (
  SELECT user_id
  FROM public.faucet_claims
  GROUP BY user_id
  ORDER BY COUNT(*) DESC, user_id
  LIMIT 1
)
UPDATE public.auto_invest_engine e
SET user_id = inferred_owner.user_id
FROM inferred_owner
WHERE e.user_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.auto_invest_engine
    WHERE user_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Unable to backfill auto_invest_engine.user_id for all existing rows';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.set_auto_invest_engine_user_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_auto_invest_engine_user_id ON public.auto_invest_engine;
CREATE TRIGGER set_auto_invest_engine_user_id
BEFORE INSERT ON public.auto_invest_engine
FOR EACH ROW
EXECUTE FUNCTION public.set_auto_invest_engine_user_id();

ALTER TABLE public.auto_invest_engine
ALTER COLUMN user_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS auto_invest_engine_user_id_unique
ON public.auto_invest_engine (user_id);

CREATE INDEX IF NOT EXISTS auto_invest_engine_user_id_idx
ON public.auto_invest_engine (user_id);

CREATE OR REPLACE FUNCTION public.owns_auto_invest_engine(_engine_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.auto_invest_engine
    WHERE id = _engine_id
      AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.set_compound_snapshot_owner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    SELECT user_id INTO NEW.user_id
    FROM public.auto_invest_engine
    WHERE id = NEW.engine_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_compound_snapshot_owner ON public.compound_snapshots;
CREATE TRIGGER set_compound_snapshot_owner
BEFORE INSERT ON public.compound_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.set_compound_snapshot_owner();

DROP POLICY IF EXISTS "Admins manage auto invest engine" ON public.auto_invest_engine;
CREATE POLICY "Users manage own auto invest engine"
ON public.auto_invest_engine
FOR ALL
TO authenticated
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage auto invest allocations" ON public.auto_invest_allocations;
CREATE POLICY "Users manage own auto invest allocations"
ON public.auto_invest_allocations
FOR ALL
TO authenticated
USING (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage auto invest transactions" ON public.auto_invest_transactions;
CREATE POLICY "Users manage own auto invest transactions"
ON public.auto_invest_transactions
FOR ALL
TO authenticated
USING (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage auto invest ai logs" ON public.auto_invest_ai_logs;
CREATE POLICY "Users manage own auto invest ai logs"
ON public.auto_invest_ai_logs
FOR ALL
TO authenticated
USING (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.owns_auto_invest_engine(engine_id) OR public.has_role(auth.uid(), 'admin'));