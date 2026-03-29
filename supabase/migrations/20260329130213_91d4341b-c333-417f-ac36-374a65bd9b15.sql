DROP VIEW IF EXISTS public.saved_payment_methods_safe;

CREATE VIEW public.saved_payment_methods_safe AS
  SELECT 
    id, user_id, nickname, method_type, last_four, card_brand,
    bank_name, is_default, metadata, created_at, updated_at,
    exp_month, exp_year
  FROM public.saved_payment_methods;

REVOKE SELECT ON public.saved_payment_methods FROM anon, authenticated;
GRANT SELECT ON public.saved_payment_methods_safe TO authenticated;

ALTER VIEW public.saved_payment_methods_safe SET (security_invoker = true);