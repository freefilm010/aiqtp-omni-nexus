-- Move remaining SECURITY DEFINER helpers out of the exposed API schema.
-- Public wrappers become SECURITY INVOKER; the privileged bodies live in `private`.

-- 1. get_user_usd_balance
CREATE OR REPLACE FUNCTION private.get_user_usd_balance(p_user_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(quantity, 0)
  FROM public.portfolio_holdings
  WHERE user_id = p_user_id AND symbol = 'USD';
$$;
REVOKE ALL ON FUNCTION private.get_user_usd_balance(uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_user_usd_balance(p_user_id uuid DEFAULT NULL::uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT private.get_user_usd_balance(
    CASE
      WHEN p_user_id IS NULL OR p_user_id = auth.uid() THEN auth.uid()
      WHEN public.has_role(auth.uid(), 'admin') THEN p_user_id
      ELSE NULL::uuid
    END
  );
$$;

-- 2. get_factor_code
CREATE OR REPLACE FUNCTION private.get_factor_code(p_caller uuid, p_factor_id uuid)
RETURNS TABLE(code text, is_protected boolean, is_owner boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id UUID;
  v_is_protected BOOLEAN;
  v_code TEXT;
  v_is_admin BOOLEAN;
BEGIN
  IF p_caller IS NULL THEN
    RETURN;
  END IF;

  SELECT public.has_role(p_caller, 'admin') INTO v_is_admin;

  SELECT f.user_id, f.code_protected, f.code
  INTO v_owner_id, v_is_protected, v_code
  FROM public.ai_factors f
  WHERE f.id = p_factor_id;

  IF v_owner_id IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::BOOLEAN, NULL::BOOLEAN;
    RETURN;
  END IF;

  IF p_caller = v_owner_id OR v_is_admin THEN
    RETURN QUERY SELECT v_code, v_is_protected, (p_caller = v_owner_id);
    RETURN;
  END IF;

  IF v_is_protected THEN
    RETURN QUERY SELECT '// Code is protected by creator'::TEXT, TRUE, FALSE;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_code, FALSE, FALSE;
END;
$$;
REVOKE ALL ON FUNCTION private.get_factor_code(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_factor_code(p_factor_id uuid)
RETURNS TABLE(code text, is_protected boolean, is_owner boolean)
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT * FROM private.get_factor_code(auth.uid(), p_factor_id);
$$;

-- 3. get_strategy_code
CREATE OR REPLACE FUNCTION private.get_strategy_code(p_caller uuid, p_strategy_id uuid)
RETURNS TABLE(code text, is_protected boolean, is_owner boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner_id UUID;
  v_is_protected BOOLEAN;
  v_code TEXT;
  v_is_admin BOOLEAN;
BEGIN
  IF p_caller IS NULL THEN
    RETURN;
  END IF;

  SELECT public.has_role(p_caller, 'admin') INTO v_is_admin;

  SELECT s.user_id, s.code_protected, s.code
  INTO v_owner_id, v_is_protected, v_code
  FROM public.ai_strategies s
  WHERE s.id = p_strategy_id;

  IF v_owner_id IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::BOOLEAN, NULL::BOOLEAN;
    RETURN;
  END IF;

  IF p_caller = v_owner_id OR v_is_admin THEN
    RETURN QUERY SELECT v_code, v_is_protected, (p_caller = v_owner_id);
    RETURN;
  END IF;

  IF v_is_protected THEN
    RETURN QUERY SELECT '// Code is protected by creator'::TEXT, TRUE, FALSE;
    RETURN;
  END IF;

  RETURN QUERY SELECT v_code, FALSE, FALSE;
END;
$$;
REVOKE ALL ON FUNCTION private.get_strategy_code(uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.get_strategy_code(p_strategy_id uuid)
RETURNS TABLE(code text, is_protected boolean, is_owner boolean)
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT * FROM private.get_strategy_code(auth.uid(), p_strategy_id);
$$;

-- 4. log_security_event
CREATE OR REPLACE FUNCTION private.log_security_event(p_user_id uuid, p_event_type text, p_details jsonb, p_severity text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  INSERT INTO public.security_audit_log (event_type, user_id, details, severity)
  VALUES (left(p_event_type, 200), p_user_id, COALESCE(p_details, '{}'::jsonb), left(COALESCE(p_severity,'info'), 20))
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
REVOKE ALL ON FUNCTION private.log_security_event(uuid, text, jsonb, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.log_security_event(p_event_type text, p_details jsonb DEFAULT '{}'::jsonb, p_severity text DEFAULT 'info'::text)
RETURNS uuid
LANGUAGE sql
SET search_path TO 'public'
AS $$
  SELECT private.log_security_event(auth.uid(), p_event_type, p_details, p_severity);
$$;

-- Ensure the public invoker wrappers stay callable by signed-in users only.
REVOKE ALL ON FUNCTION public.get_user_usd_balance(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_factor_code(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_strategy_code(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_security_event(text, jsonb, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_usd_balance(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_factor_code(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_strategy_code(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, jsonb, text) TO authenticated, service_role;