CREATE TRIGGER bridge_reinvest_transactions_to_holdings
AFTER INSERT ON public.auto_invest_transactions
FOR EACH ROW
EXECUTE FUNCTION public.bridge_reinvest_to_holdings();

CREATE TRIGGER set_compound_snapshot_owner_before_insert
BEFORE INSERT ON public.compound_snapshots
FOR EACH ROW
EXECUTE FUNCTION public.set_compound_snapshot_owner();