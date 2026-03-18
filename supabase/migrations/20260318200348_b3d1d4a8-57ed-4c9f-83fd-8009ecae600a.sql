
CREATE TABLE public.satellite_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  category varchar NOT NULL,
  subcategory varchar,
  description text,
  logo_url text,
  website_url text,
  api_url text,
  websocket_url text,
  supported_chains text[] DEFAULT '{}',
  features jsonb DEFAULT '{}',
  is_usa_compatible boolean DEFAULT false,
  is_crypto_native boolean DEFAULT true,
  requires_api_key boolean DEFAULT false,
  affiliate_code text,
  revenue_model varchar,
  revenue_share_percent numeric(5,2) DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.satellite_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active satellite services"
  ON public.satellite_services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins manage satellite services"
  ON public.satellite_services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.user_service_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES public.satellite_services(id) ON DELETE CASCADE,
  connection_status varchar DEFAULT 'pending',
  api_key_hash text,
  external_account_id text,
  metadata jsonb DEFAULT '{}',
  connected_at timestamptz,
  last_sync_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, service_id)
);

ALTER TABLE public.user_service_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own service connections"
  ON public.user_service_connections FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all service connections"
  ON public.user_service_connections FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
