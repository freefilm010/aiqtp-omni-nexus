
-- Admin revenue and investment tracking tables
CREATE TABLE public.admin_revenue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  type TEXT NOT NULL DEFAULT 'subscription',
  status TEXT NOT NULL DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE public.admin_investments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  strategy TEXT NOT NULL DEFAULT 'aggressive',
  asset_type TEXT NOT NULL,
  asset_symbol TEXT NOT NULL,
  amount DECIMAL(20,8) NOT NULL,
  entry_price DECIMAL(20,8),
  current_value DECIMAL(20,8),
  allocation_percent DECIMAL(5,2) NOT NULL,
  is_stable BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_automation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  automation_type TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  details JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_processors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  is_configured BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}',
  last_health_check TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'pending_setup',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_processors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only policies (users with admin role)
CREATE POLICY "Admin can manage revenue" ON public.admin_revenue
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage investments" ON public.admin_investments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can view automation logs" ON public.admin_automation_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage payment processors" ON public.payment_processors
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can manage settings" ON public.admin_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin can view security logs" ON public.security_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Insert default payment processors
INSERT INTO public.payment_processors (name, status) VALUES
  ('stripe', 'pending_setup'),
  ('paypal', 'pending_setup'),
  ('onramper', 'pending_setup'),
  ('simplex', 'pending_setup'),
  ('moonpay', 'pending_setup');

-- Insert default admin settings
INSERT INTO public.admin_settings (key, value, category) VALUES
  ('investment_strategy', '{"type": "aggressive", "stable_percent": 30, "growth_percent": 70}', 'investment'),
  ('auto_reinvest', '{"enabled": true, "threshold": 100}', 'investment'),
  ('security_auto_update', '{"enabled": true, "frequency": "daily"}', 'security'),
  ('revenue_distribution', '{"reinvest": 60, "reserve": 25, "withdraw": 15}', 'revenue');

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_admin_investments_updated_at
  BEFORE UPDATE ON public.admin_investments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_processors_updated_at
  BEFORE UPDATE ON public.payment_processors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
