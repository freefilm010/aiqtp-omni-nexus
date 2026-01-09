-- Add column to track admin-controlled wallets
ALTER TABLE quwallet_wallets ADD COLUMN IF NOT EXISTS is_admin_controlled boolean DEFAULT false;

-- Add treasury metadata to qtc_ledger
ALTER TABLE qtc_ledger ADD COLUMN IF NOT EXISTS wallet_type text DEFAULT 'user';
ALTER TABLE qtc_ledger ADD COLUMN IF NOT EXISTS controlled_by uuid;

-- Update genesis treasury to be controlled by admin
UPDATE qtc_ledger 
SET wallet_type = 'treasury', controlled_by = 'e2618acb-f33d-42b5-b8ed-2318a09c6326'
WHERE wallet_address = 'qu_treasury_aiqtp_genesis_000000000000000000000000000000';

UPDATE qtc_ledger 
SET wallet_type = 'rewards_pool', controlled_by = 'e2618acb-f33d-42b5-b8ed-2318a09c6326'
WHERE wallet_address = 'qu_rewards_pool_000000000000000000000000000000000000000';

UPDATE qtc_ledger 
SET wallet_type = 'staking_pool', controlled_by = 'e2618acb-f33d-42b5-b8ed-2318a09c6326'
WHERE wallet_address = 'qu_staking_pool_00000000000000000000000000000000000000';

-- Create admin treasury management table
CREATE TABLE IF NOT EXISTS qtc_treasury_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text UNIQUE NOT NULL,
  config_value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid
);

-- Insert treasury configuration
INSERT INTO qtc_treasury_config (config_key, config_value, updated_by) VALUES
('total_supply', '{"amount": 1000000000, "unit": "QTC"}', 'e2618acb-f33d-42b5-b8ed-2318a09c6326'),
('faucet_enabled', '{"enabled": true, "daily_limit": 100, "per_claim": 10}', 'e2618acb-f33d-42b5-b8ed-2318a09c6326'),
('admin_addresses', '{"primary": "1drrey@gmail.com", "secondary": "1drrey@duck.com"}', 'e2618acb-f33d-42b5-b8ed-2318a09c6326')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, updated_at = now();

-- RLS for treasury config
ALTER TABLE qtc_treasury_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage treasury config" ON qtc_treasury_config;
CREATE POLICY "Admins can manage treasury config"
ON qtc_treasury_config FOR ALL
USING (has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Anyone can view treasury config" ON qtc_treasury_config;
CREATE POLICY "Anyone can view treasury config"
ON qtc_treasury_config FOR SELECT
USING (true);