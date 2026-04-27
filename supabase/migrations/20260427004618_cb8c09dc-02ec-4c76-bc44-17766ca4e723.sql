-- =============================================================
-- 1) REALTIME AUTHORIZATION — restrict channel subscriptions
-- =============================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior permissive policies we may have added before
DROP POLICY IF EXISTS "auth_users_read_own_topics" ON realtime.messages;
DROP POLICY IF EXISTS "auth_users_write_own_topics" ON realtime.messages;
DROP POLICY IF EXISTS "public_market_topics_read" ON realtime.messages;

-- Allow authenticated users to subscribe to:
--   * their own user id channel        e.g.  user:<uid>
--   * their own auto-invest engine     e.g.  engine:<engine_id> they own
--   * their own chat conversations     e.g.  conversation:<id> they own
--   * public market topics             e.g.  market:*, prices:*, public:*
CREATE POLICY "auth_users_read_own_topics"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- public market data channels
  realtime.topic() LIKE 'market:%'
  OR realtime.topic() LIKE 'prices:%'
  OR realtime.topic() LIKE 'public:%'
  -- user-scoped channel
  OR realtime.topic() = 'user:' || auth.uid()::text
  -- auto-invest engine the user owns
  OR (
    realtime.topic() LIKE 'engine:%'
    AND EXISTS (
      SELECT 1 FROM public.auto_invest_engine e
      WHERE e.id::text = split_part(realtime.topic(), ':', 2)
        AND e.user_id = auth.uid()
    )
  )
  -- chat conversation the user owns
  OR (
    realtime.topic() LIKE 'conversation:%'
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id::text = split_part(realtime.topic(), ':', 2)
        AND c.user_id = auth.uid()
    )
  )
  -- admin override
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- Allow same scope to broadcast/presence (write side)
CREATE POLICY "auth_users_write_own_topics"
ON realtime.messages
FOR INSERT
TO authenticated
WITH CHECK (
  realtime.topic() = 'user:' || auth.uid()::text
  OR (
    realtime.topic() LIKE 'engine:%'
    AND EXISTS (
      SELECT 1 FROM public.auto_invest_engine e
      WHERE e.id::text = split_part(realtime.topic(), ':', 2)
        AND e.user_id = auth.uid()
    )
  )
  OR (
    realtime.topic() LIKE 'conversation:%'
    AND EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id::text = split_part(realtime.topic(), ':', 2)
        AND c.user_id = auth.uid()
    )
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
);

-- =============================================================
-- 2) AUTOMATION TEMPLATES — stop raw webhook_url leaking
-- =============================================================
-- Tighten the SELECT policy: non-owners/non-admins never see rows
-- where webhook_url is present at all (only fully-masked rows).
DROP POLICY IF EXISTS "Authenticated users view system or own templates" ON public.automation_templates;

CREATE POLICY "Authenticated users view system or own templates"
ON public.automation_templates
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR (is_system = true AND webhook_url IS NULL)
);

-- Belt-and-suspenders: enforce that system templates can never store
-- a raw webhook_url (use webhook_url_masked instead).
CREATE OR REPLACE FUNCTION public.enforce_system_template_no_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_system = true THEN
    NEW.webhook_url := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_system_template_no_webhook ON public.automation_templates;
CREATE TRIGGER trg_system_template_no_webhook
BEFORE INSERT OR UPDATE ON public.automation_templates
FOR EACH ROW EXECUTE FUNCTION public.enforce_system_template_no_webhook();

-- Scrub any existing system rows that already hold a raw webhook_url
UPDATE public.automation_templates
SET webhook_url = NULL
WHERE is_system = true AND webhook_url IS NOT NULL;