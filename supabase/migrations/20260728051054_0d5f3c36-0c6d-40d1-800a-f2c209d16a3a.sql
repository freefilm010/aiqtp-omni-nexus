REVOKE ALL ON FUNCTION public.repair_auto_invest_allocation_duplicates() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.repair_auto_invest_allocation_duplicates() FROM anon;
REVOKE ALL ON FUNCTION public.repair_auto_invest_allocation_duplicates() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.repair_auto_invest_allocation_duplicates() TO service_role;