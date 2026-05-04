-- Prevent non-admins from setting/changing admin_approved on ai_strategies
CREATE OR REPLACE FUNCTION public.guard_ai_strategies_admin_approved()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.admin_approved, false) = true
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.admin_approved := false;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF COALESCE(NEW.admin_approved, false) IS DISTINCT FROM COALESCE(OLD.admin_approved, false)
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      NEW.admin_approved := OLD.admin_approved;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_ai_strategies_admin_approved_trg ON public.ai_strategies;
CREATE TRIGGER guard_ai_strategies_admin_approved_trg
BEFORE INSERT OR UPDATE ON public.ai_strategies
FOR EACH ROW
EXECUTE FUNCTION public.guard_ai_strategies_admin_approved();