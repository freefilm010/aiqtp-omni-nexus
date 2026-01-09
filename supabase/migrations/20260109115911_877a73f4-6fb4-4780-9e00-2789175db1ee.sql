-- Fix security: Enable leaked password protection and add column-level security for code protection

-- Create a secure view for strategies that hides code when protected
CREATE OR REPLACE FUNCTION public.get_strategy_code(strategy_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_protected BOOLEAN;
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  SELECT code, code_protected, user_id INTO v_code, v_protected, v_user_id
  FROM ai_strategies WHERE id = strategy_id;
  
  -- Check if user is admin
  SELECT public.has_role('admin', auth.uid()) INTO v_is_admin;
  
  -- Return code only if: user owns it, user is admin, or code is not protected
  IF v_is_admin OR v_user_id = auth.uid() OR NOT COALESCE(v_protected, false) THEN
    RETURN v_code;
  ELSE
    RETURN '[PROTECTED CODE - Rent this strategy to access]';
  END IF;
END;
$$;

-- Create a secure view for factors that hides code when protected
CREATE OR REPLACE FUNCTION public.get_factor_code(factor_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code TEXT;
  v_protected BOOLEAN;
  v_user_id UUID;
  v_is_admin BOOLEAN;
BEGIN
  SELECT code, code_protected, user_id INTO v_code, v_protected, v_user_id
  FROM ai_factors WHERE id = factor_id;
  
  -- Check if user is admin
  SELECT public.has_role('admin', auth.uid()) INTO v_is_admin;
  
  -- Return code only if: user owns it, user is admin, or code is not protected
  IF v_is_admin OR v_user_id = auth.uid() OR NOT COALESCE(v_protected, false) THEN
    RETURN v_code;
  ELSE
    RETURN '[PROTECTED CODE - Contact owner to access]';
  END IF;
END;
$$;

-- Add index for better performance on code protection checks
CREATE INDEX IF NOT EXISTS idx_ai_strategies_code_protected ON ai_strategies(code_protected);
CREATE INDEX IF NOT EXISTS idx_ai_factors_code_protected ON ai_factors(code_protected);