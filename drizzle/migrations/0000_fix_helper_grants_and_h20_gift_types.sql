GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION private.owns_auto_invest_engine(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

ALTER TABLE public.h20_distributions DROP CONSTRAINT h20_distributions_distribution_type_check;
ALTER TABLE public.h20_distributions ADD CONSTRAINT h20_distributions_distribution_type_check
  CHECK (distribution_type = ANY (ARRAY['GIFT','GRANT','WATER_PROTECTION_FUNDING','PROJECT_PAYMENT','SERVICE_PAYMENT','INFRASTRUCTURE_FUNDING','REIMBURSEMENT','OTHER_APPROVED_DISTRIBUTION','DONATION']));
COMMENT ON CONSTRAINT h20_distributions_distribution_type_check ON public.h20_distributions IS 'DONATION retained only for legacy rows; DEPRECATED, not offered in UI. Use GIFT only where less-than-full consideration is documented.';