
-- Fix security definer view - use security_invoker instead
DROP VIEW IF EXISTS public.automation_templates_safe;
CREATE VIEW public.automation_templates_safe
WITH (security_invoker = true) AS
SELECT id, name, description, category, subcategory, trigger_type, action_type,
       trigger_config, action_config, schedule, is_active, is_system,
       run_count, last_run_at, user_id, created_at, updated_at
FROM public.automation_templates;
