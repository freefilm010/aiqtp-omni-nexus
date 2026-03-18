
CREATE TABLE public.customer_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_type text NOT NULL DEFAULT 'suggestion',
  subject text,
  message text NOT NULL,
  rating integer,
  submission_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  route_hash text NOT NULL DEFAULT encode(gen_random_bytes(8), 'hex'),
  is_read boolean DEFAULT false,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can submit feedback (no auth required for accessibility)
CREATE POLICY "Anyone can submit feedback"
  ON public.customer_feedback FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read feedback
CREATE POLICY "Admins can read feedback"
  ON public.customer_feedback FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can update feedback
CREATE POLICY "Admins can update feedback"
  ON public.customer_feedback FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
