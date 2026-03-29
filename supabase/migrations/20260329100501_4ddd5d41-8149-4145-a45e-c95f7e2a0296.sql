
-- Revoke direct SELECT on sensitive Stripe columns from public roles
REVOKE SELECT (stripe_payment_method_id, stripe_customer_id) ON public.saved_payment_methods FROM anon, authenticated;
