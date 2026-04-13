-- Restore faucet_claims and auto_invest_transactions to realtime publication
-- Both tables have existing RLS: users can only see their own rows (auth.uid() = user_id)
ALTER PUBLICATION supabase_realtime ADD TABLE public.faucet_claims;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_invest_transactions;