-- The public permission-check wrappers call private helpers and previously ran
-- as the caller, requiring USAGE ON SCHEMA private for every authenticated user.
-- The publish pipeline does not carry schema-level ACLs to production, which kept
-- users on live getting "permission denied". Convert the wrappers to SECURITY
-- DEFINER (owner: postgres, which has USAGE on private) with a locked search_path.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT private.has_role(_user_id, _role);
$function$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(user_uuid uuid, check_env text DEFAULT 'live'::text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT private.has_active_subscription(user_uuid, check_env);
$function$;

CREATE OR REPLACE FUNCTION public.owns_auto_invest_engine(_engine_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $function$
  SELECT private.owns_auto_invest_engine(_engine_id);
$function$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_auto_invest_engine(uuid) TO authenticated;