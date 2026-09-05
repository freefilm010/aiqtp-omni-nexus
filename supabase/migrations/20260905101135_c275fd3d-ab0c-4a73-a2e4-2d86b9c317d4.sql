CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE TABLE IF NOT EXISTS public.system_runtime_config (
  key   text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON public.system_runtime_config FROM PUBLIC;
REVOKE ALL ON public.system_runtime_config FROM anon;
REVOKE ALL ON public.system_runtime_config FROM authenticated;
GRANT ALL ON public.system_runtime_config TO service_role;
ALTER TABLE public.system_runtime_config ENABLE ROW LEVEL SECURITY;