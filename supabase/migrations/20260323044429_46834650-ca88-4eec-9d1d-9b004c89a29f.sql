-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.customer_feedback;

-- Create a new policy requiring authentication
CREATE POLICY "Authenticated users can submit feedback"
  ON public.customer_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (true);