
ALTER TABLE public.saved_payment_methods 
  ADD COLUMN exp_month INTEGER,
  ADD COLUMN exp_year INTEGER,
  ADD COLUMN stripe_payment_method_id TEXT,
  ADD COLUMN stripe_customer_id TEXT;
