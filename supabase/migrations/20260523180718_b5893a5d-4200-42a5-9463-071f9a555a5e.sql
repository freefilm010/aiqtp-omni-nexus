-- Lock trigger-only function from direct client execution.
REVOKE EXECUTE ON FUNCTION public.guard_saved_payment_methods_immutable_ids() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guard_saved_payment_methods_immutable_ids() TO service_role;

-- Sanitized public mirror for satellite services: excludes affiliate_code, revenue_share_percent,
-- api_url, websocket_url, and revenue_model.
CREATE TABLE IF NOT EXISTS public.satellite_services_public (
  id uuid PRIMARY KEY,
  name varchar NOT NULL,
  category varchar NOT NULL,
  subcategory varchar,
  description text,
  logo_url text,
  website_url text,
  supported_chains text[],
  features jsonb,
  is_usa_compatible boolean,
  is_crypto_native boolean,
  requires_api_key boolean,
  is_active boolean,
  sort_order integer,
  created_at timestamptz,
  updated_at timestamptz
);

ALTER TABLE public.satellite_services_public ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active satellite services public" ON public.satellite_services_public;
DROP POLICY IF EXISTS "Admins manage satellite services public" ON public.satellite_services_public;

CREATE POLICY "Anyone can view active satellite services public"
ON public.satellite_services_public
FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE POLICY "Admins manage satellite services public"
ON public.satellite_services_public
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.satellite_services_public (
  id, name, category, subcategory, description, logo_url, website_url,
  supported_chains, features, is_usa_compatible, is_crypto_native,
  requires_api_key, is_active, sort_order, created_at, updated_at
)
SELECT
  id, name, category, subcategory, description, logo_url, website_url,
  supported_chains, features, is_usa_compatible, is_crypto_native,
  requires_api_key, is_active, sort_order, created_at, updated_at
FROM public.satellite_services
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  subcategory = EXCLUDED.subcategory,
  description = EXCLUDED.description,
  logo_url = EXCLUDED.logo_url,
  website_url = EXCLUDED.website_url,
  supported_chains = EXCLUDED.supported_chains,
  features = EXCLUDED.features,
  is_usa_compatible = EXCLUDED.is_usa_compatible,
  is_crypto_native = EXCLUDED.is_crypto_native,
  requires_api_key = EXCLUDED.requires_api_key,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at;

CREATE OR REPLACE FUNCTION public.sync_satellite_services_public()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.satellite_services_public WHERE id = OLD.id;
    RETURN OLD;
  END IF;

  INSERT INTO public.satellite_services_public (
    id, name, category, subcategory, description, logo_url, website_url,
    supported_chains, features, is_usa_compatible, is_crypto_native,
    requires_api_key, is_active, sort_order, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.name, NEW.category, NEW.subcategory, NEW.description, NEW.logo_url, NEW.website_url,
    NEW.supported_chains, NEW.features, NEW.is_usa_compatible, NEW.is_crypto_native,
    NEW.requires_api_key, NEW.is_active, NEW.sort_order, NEW.created_at, NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    subcategory = EXCLUDED.subcategory,
    description = EXCLUDED.description,
    logo_url = EXCLUDED.logo_url,
    website_url = EXCLUDED.website_url,
    supported_chains = EXCLUDED.supported_chains,
    features = EXCLUDED.features,
    is_usa_compatible = EXCLUDED.is_usa_compatible,
    is_crypto_native = EXCLUDED.is_crypto_native,
    requires_api_key = EXCLUDED.requires_api_key,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order,
    created_at = EXCLUDED.created_at,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_satellite_services_public_trigger ON public.satellite_services;
CREATE TRIGGER sync_satellite_services_public_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.satellite_services
FOR EACH ROW EXECUTE FUNCTION public.sync_satellite_services_public();

REVOKE EXECUTE ON FUNCTION public.sync_satellite_services_public() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_satellite_services_public() TO service_role;

-- Remove anonymous/raw public read path from the source table.
DROP POLICY IF EXISTS "Anyone can view active satellite services" ON public.satellite_services;
DROP POLICY IF EXISTS "Authenticated can view active satellite services" ON public.satellite_services;
CREATE POLICY "Admins can view satellite services"
ON public.satellite_services
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Automation templates can contain webhook destinations. Keep them admin-only at the table layer.
DROP POLICY IF EXISTS "Authenticated users view system or own templates" ON public.automation_templates;
DROP POLICY IF EXISTS "Users can manage own templates" ON public.automation_templates;
DROP POLICY IF EXISTS "Admins can manage all templates" ON public.automation_templates;
CREATE POLICY "Admins can manage all automation templates"
ON public.automation_templates
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Remove any currently stored raw webhook destinations; future destinations should be configured server-side only.
UPDATE public.automation_templates
SET webhook_url = NULL
WHERE webhook_url IS NOT NULL;