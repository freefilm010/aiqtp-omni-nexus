CREATE POLICY "System runtime config is backend only"
ON public.system_runtime_config
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);