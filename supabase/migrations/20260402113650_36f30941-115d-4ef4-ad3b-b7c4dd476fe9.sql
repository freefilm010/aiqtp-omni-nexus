
CREATE TABLE public.charter_entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  state_name VARCHAR(100) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_type VARCHAR(20) NOT NULL DEFAULT 'subsidiary',
  ein VARCHAR(20),
  filing_status VARCHAR(30) NOT NULL DEFAULT 'not_started',
  formation_date DATE,
  fundraising_target NUMERIC(15,2) NOT NULL DEFAULT 5000000,
  funds_raised NUMERIC(15,2) NOT NULL DEFAULT 0,
  linked_user_id UUID,
  ai_president_name VARCHAR(100),
  ai_president_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  annual_revenue_cap NUMERIC(15,2) NOT NULL DEFAULT 5000000,
  compliance_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  bank_account_status VARCHAR(20) NOT NULL DEFAULT 'not_opened',
  social_media_status VARCHAR(20) NOT NULL DEFAULT 'not_setup',
  priority_order INT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.charter_entities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all charter entities"
ON public.charter_entities FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert charter entities"
ON public.charter_entities FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update charter entities"
ON public.charter_entities FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete charter entities"
ON public.charter_entities FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_charter_entities_updated_at
BEFORE UPDATE ON public.charter_entities
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
