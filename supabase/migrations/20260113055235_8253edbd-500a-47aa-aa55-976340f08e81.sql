-- Drop existing functions first
DROP FUNCTION IF EXISTS public.get_strategy_code(UUID);
DROP FUNCTION IF EXISTS public.get_factor_code(UUID);

-- Recreate get_strategy_code function with corrected parameter order
CREATE FUNCTION public.get_strategy_code(p_strategy_id UUID)
RETURNS TABLE(code TEXT, is_protected BOOLEAN, is_owner BOOLEAN) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_owner_id UUID;
  v_is_protected BOOLEAN;
  v_code TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is admin (FIXED: correct parameter order - was has_role('admin', auth.uid()))
  SELECT public.has_role(auth.uid(), 'admin') INTO v_is_admin;
  
  -- Get strategy details
  SELECT s.user_id, s.code_protected, s.code
  INTO v_owner_id, v_is_protected, v_code
  FROM ai_strategies s
  WHERE s.id = p_strategy_id;
  
  -- If strategy not found
  IF v_owner_id IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::BOOLEAN, NULL::BOOLEAN;
    RETURN;
  END IF;
  
  -- If user is owner or admin, return full code
  IF v_user_id = v_owner_id OR v_is_admin THEN
    RETURN QUERY SELECT v_code, v_is_protected, (v_user_id = v_owner_id);
    RETURN;
  END IF;
  
  -- If protected and not owner/admin, return obfuscated
  IF v_is_protected THEN
    RETURN QUERY SELECT '// Code is protected by creator'::TEXT, TRUE, FALSE;
    RETURN;
  END IF;
  
  -- Not protected, return code
  RETURN QUERY SELECT v_code, FALSE, FALSE;
END;
$$;

-- Recreate get_factor_code function with corrected parameter order
CREATE FUNCTION public.get_factor_code(p_factor_id UUID)
RETURNS TABLE(code TEXT, is_protected BOOLEAN, is_owner BOOLEAN) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_owner_id UUID;
  v_is_protected BOOLEAN;
  v_code TEXT;
  v_is_admin BOOLEAN;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  -- Check if user is admin (FIXED: correct parameter order - was has_role('admin', auth.uid()))
  SELECT public.has_role(auth.uid(), 'admin') INTO v_is_admin;
  
  -- Get factor details
  SELECT f.user_id, f.code_protected, f.code
  INTO v_owner_id, v_is_protected, v_code
  FROM ai_factors f
  WHERE f.id = p_factor_id;
  
  -- If factor not found
  IF v_owner_id IS NULL THEN
    RETURN QUERY SELECT NULL::TEXT, NULL::BOOLEAN, NULL::BOOLEAN;
    RETURN;
  END IF;
  
  -- If user is owner or admin, return full code
  IF v_user_id = v_owner_id OR v_is_admin THEN
    RETURN QUERY SELECT v_code, v_is_protected, (v_user_id = v_owner_id);
    RETURN;
  END IF;
  
  -- If protected and not owner/admin, return obfuscated
  IF v_is_protected THEN
    RETURN QUERY SELECT '// Code is protected by creator'::TEXT, TRUE, FALSE;
    RETURN;
  END IF;
  
  -- Not protected, return code
  RETURN QUERY SELECT v_code, FALSE, FALSE;
END;
$$;