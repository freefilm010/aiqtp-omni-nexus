-- Seed charter-mode flags into existing feature_flags schema
INSERT INTO public.feature_flags (flag_key, display_name, description, is_enabled, audience, category) VALUES
  ('charter_review_mode', 'Charter Review Mode', 'Lock platform into OCC charter review posture: no destructive ops, audit-only mode', false, 'admin', 'compliance'),
  ('require_admin_2fa', 'Require Admin 2FA', 'Require 2FA on all admin sessions', true, 'admin', 'security'),
  ('high_value_withdraw_freeze', 'High-Value Withdrawal Freeze', 'Freeze withdrawals over $25k pending manual review', false, 'admin', 'compliance'),
  ('reconciliation_daily_run', 'Daily Reconciliation', 'Run automated daily Stripe vs DB reconciliation', true, 'admin', 'finance')
ON CONFLICT (flag_key) DO NOTHING;

-- Revoke anon execute on sensitive RPCs
REVOKE EXECUTE ON FUNCTION public.increment_wallet_balance(varchar, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon;
REVOKE EXECUTE ON FUNCTION public.process_profit_distribution(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.record_operator_transaction(uuid, uuid, numeric, varchar, varchar, text, varchar, uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.create_operator_with_wallet(uuid, varchar, varchar, uuid, boolean, varchar[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_token_price(uuid, varchar, numeric) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.credit_faucet_claim(uuid, text, numeric, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.update_paper_portfolio(uuid, text, numeric, numeric) FROM anon;