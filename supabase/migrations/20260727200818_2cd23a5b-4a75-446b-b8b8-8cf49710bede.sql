
-- 1) customer_feedback: add user_id column bound to auth.uid(), owner SELECT policy
ALTER TABLE public.customer_feedback
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Authenticated users can submit feedback" ON public.customer_feedback;
CREATE POLICY "Authenticated users can submit feedback"
  ON public.customer_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own feedback" ON public.customer_feedback;
CREATE POLICY "Users can view own feedback"
  ON public.customer_feedback FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2) influencer_referrals: explicit INSERT policy (admins only; referral creation is a server operation)
DROP POLICY IF EXISTS "Only admins can insert referrals" ON public.influencer_referrals;
CREATE POLICY "Only admins can insert referrals"
  ON public.influencer_referrals FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) avatars storage: owner-scoped listing (public URLs still resolve via CDN)
DROP POLICY IF EXISTS "Users can list own avatars" ON storage.objects;
CREATE POLICY "Users can list own avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4) Revoke EXECUTE on trigger-only and admin/service-only SECURITY DEFINER functions
DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'handle_new_user()',
    'handle_new_user_role()',
    'handle_updated_at()',
    'update_updated_at_column()',
    'assign_admin_to_approved_emails()',
    'bridge_reinvest_to_holdings()',
    'check_factor_achievements()',
    'check_rewards_budget()',
    'check_strategy_achievements()',
    'consolidate_auto_invest_allocation()',
    'enforce_system_template_no_webhook()',
    'guard_ai_strategies_admin_approved()',
    'guard_automation_templates_webhook_url()',
    'guard_saved_payment_methods_immutable_ids()',
    'recompute_allocation_percents()',
    'set_auto_invest_engine_user_id()',
    'set_compound_snapshot_owner()',
    'sync_copy_trading_leaders_public()',
    'sync_leaderboard_public()',
    'sync_satellite_services_public()',
    'sync_supported_chains_public()',
    'update_conversation_message_count()',
    'create_operator_with_wallet(uuid,character varying,character varying,uuid,boolean,character varying[])',
    'record_operator_transaction(uuid,uuid,numeric,character varying,character varying,text,character varying,uuid)',
    'update_market_price(text,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric,numeric)',
    'update_token_price(uuid,character varying,numeric)',
    'credit_platform_deposit(uuid,text,text,numeric,text,text)',
    'increment_wallet_balance(character varying,numeric)',
    'process_profit_distribution(uuid)',
    'mark_stale_agent_heartbeats(integer)',
    'log_security_event(text,jsonb,text)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    BEGIN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', fn);
    EXCEPTION WHEN undefined_function THEN
      -- skip missing signatures
      NULL;
    END;
  END LOOP;
END $$;
