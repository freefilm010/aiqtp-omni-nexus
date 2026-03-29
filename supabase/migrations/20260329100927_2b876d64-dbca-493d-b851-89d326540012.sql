
-- Secure automation webhook URLs: hide webhook_url from non-owner/non-admin users
-- by revoking column-level SELECT on webhook_url for authenticated role
REVOKE SELECT (webhook_url) ON public.automation_templates FROM anon, authenticated;

-- Create a safe view for user-facing queries that excludes webhook_url
CREATE OR REPLACE VIEW public.automation_templates_safe AS
SELECT id, name, description, category, subcategory, trigger_type, action_type,
       trigger_config, action_config, schedule, is_active, is_system,
       run_count, last_run_at, user_id, created_at, updated_at
FROM public.automation_templates;
