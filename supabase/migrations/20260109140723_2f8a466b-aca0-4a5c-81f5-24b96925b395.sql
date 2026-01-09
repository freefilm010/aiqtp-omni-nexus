-- ===========================================
-- $QTC TOKEN & QUWALLET CORE INFRASTRUCTURE
-- Real blockchain-like ledger system
-- ===========================================

-- QTC Token Ledger - Actual token balances and transactions
CREATE TABLE public.qtc_ledger (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  balance DECIMAL(28, 8) NOT NULL DEFAULT 0,
  locked_balance DECIMAL(28, 8) NOT NULL DEFAULT 0,
  staked_balance DECIMAL(28, 8) NOT NULL DEFAULT 0,
  nonce BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QTC Transactions - Immutable transaction history
CREATE TABLE public.qtc_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tx_hash TEXT NOT NULL UNIQUE,
  block_height BIGINT NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(28, 8) NOT NULL,
  fee DECIMAL(28, 8) NOT NULL DEFAULT 0.001,
  nonce BIGINT NOT NULL,
  signature TEXT NOT NULL,
  proof_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  tx_type TEXT NOT NULL DEFAULT 'transfer',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

-- QTC Blocks - Block history with PoTR proofs
CREATE TABLE public.qtc_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  block_height BIGINT NOT NULL UNIQUE,
  block_hash TEXT NOT NULL UNIQUE,
  previous_hash TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  validator_id TEXT NOT NULL,
  resonance_proof JSONB NOT NULL,
  transaction_count INT NOT NULL DEFAULT 0,
  total_fees DECIMAL(28, 8) NOT NULL DEFAULT 0,
  block_reward DECIMAL(28, 8) NOT NULL DEFAULT 12.5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QuWallet Core - Real wallet storage with encrypted keys
CREATE TABLE public.quwallet_wallets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  wallet_name TEXT NOT NULL,
  wallet_address TEXT NOT NULL UNIQUE,
  -- Post-quantum public keys (safe to store)
  kyber_public_key TEXT NOT NULL,
  dilithium_public_key TEXT NOT NULL,
  -- Classical public key for legacy compatibility
  ecdsa_public_key TEXT,
  -- Encrypted private keys (AES-256-GCM encrypted)
  encrypted_private_keys TEXT NOT NULL,
  key_derivation_salt TEXT NOT NULL,
  -- Wallet metadata
  wallet_type TEXT NOT NULL DEFAULT 'standard',
  is_hardware BOOLEAN DEFAULT false,
  hardware_type TEXT,
  multi_sig_config JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QuWallet Addresses - Derived addresses for each network
CREATE TABLE public.quwallet_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_id UUID REFERENCES public.quwallet_wallets(id) ON DELETE CASCADE,
  network TEXT NOT NULL,
  address TEXT NOT NULL,
  address_type TEXT NOT NULL DEFAULT 'external',
  derivation_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_id, network, derivation_path)
);

-- Validator Registry - PoTR validators
CREATE TABLE public.qtc_validators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.qtc_ledger(wallet_address),
  validator_key TEXT NOT NULL UNIQUE,
  stake_amount DECIMAL(28, 8) NOT NULL DEFAULT 0,
  reputation_score DECIMAL(5, 4) NOT NULL DEFAULT 1.0,
  blocks_validated BIGINT NOT NULL DEFAULT 0,
  total_rewards DECIMAL(28, 8) NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  quantum_backend TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Genesis block and initial distribution
INSERT INTO public.qtc_blocks (
  block_height, block_hash, previous_hash, merkle_root, validator_id, 
  resonance_proof, transaction_count, total_fees, block_reward
) VALUES (
  0,
  'qtc_genesis_0000000000000000000000000000000000000000000000000000000000000000',
  '0000000000000000000000000000000000000000000000000000000000000000',
  'genesis_merkle_root_aiqtp_2025',
  'genesis_validator',
  '{"type": "genesis", "message": "AIQTP Genesis Block - Quantum Time Crystal Chain Initialized", "timestamp": "2025-01-01T00:00:00Z"}',
  1, 0, 1000000000
);

-- Treasury wallet with initial supply (1 billion QTC)
INSERT INTO public.qtc_ledger (wallet_address, balance) VALUES 
  ('qu_treasury_aiqtp_genesis_000000000000000000000000000000', 1000000000),
  ('qu_rewards_pool_000000000000000000000000000000000000000', 0),
  ('qu_staking_pool_00000000000000000000000000000000000000', 0);

-- Genesis transaction
INSERT INTO public.qtc_transactions (
  tx_hash, block_height, from_address, to_address, amount, fee, nonce, signature, status, tx_type
) VALUES (
  'tx_genesis_0000000000000000000000000000000000000000000000000000000000000000',
  0,
  'qu_genesis_mint',
  'qu_treasury_aiqtp_genesis_000000000000000000000000000000',
  1000000000,
  0,
  0,
  'genesis_signature',
  'confirmed',
  'genesis'
);

-- Enable RLS
ALTER TABLE public.qtc_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qtc_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qtc_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quwallet_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quwallet_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qtc_validators ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qtc_ledger (public read, admin write)
CREATE POLICY "Anyone can view ledger balances" ON public.qtc_ledger FOR SELECT USING (true);
CREATE POLICY "Admins can manage ledger" ON public.qtc_ledger FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for qtc_transactions (public read)
CREATE POLICY "Anyone can view transactions" ON public.qtc_transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create transactions" ON public.qtc_transactions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for qtc_blocks (public read)
CREATE POLICY "Anyone can view blocks" ON public.qtc_blocks FOR SELECT USING (true);
CREATE POLICY "Admins can create blocks" ON public.qtc_blocks FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for quwallet_wallets (users own their wallets)
CREATE POLICY "Users can view own wallets" ON public.quwallet_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own wallets" ON public.quwallet_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wallets" ON public.quwallet_wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.quwallet_wallets FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for quwallet_addresses
CREATE POLICY "Users can view own addresses" ON public.quwallet_addresses FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.quwallet_wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid()));
CREATE POLICY "Users can create own addresses" ON public.quwallet_addresses FOR INSERT 
  WITH CHECK (EXISTS (SELECT 1 FROM public.quwallet_wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid()));

-- RLS Policies for validators
CREATE POLICY "Anyone can view validators" ON public.qtc_validators FOR SELECT USING (true);
CREATE POLICY "Admins can manage validators" ON public.qtc_validators FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Indexes for performance
CREATE INDEX idx_qtc_ledger_address ON public.qtc_ledger(wallet_address);
CREATE INDEX idx_qtc_transactions_from ON public.qtc_transactions(from_address);
CREATE INDEX idx_qtc_transactions_to ON public.qtc_transactions(to_address);
CREATE INDEX idx_qtc_transactions_block ON public.qtc_transactions(block_height);
CREATE INDEX idx_qtc_transactions_status ON public.qtc_transactions(status);
CREATE INDEX idx_qtc_blocks_height ON public.qtc_blocks(block_height);
CREATE INDEX idx_quwallet_user ON public.quwallet_wallets(user_id);
CREATE INDEX idx_quwallet_address ON public.quwallet_wallets(wallet_address);

-- Triggers for updated_at
CREATE TRIGGER update_qtc_ledger_timestamp
  BEFORE UPDATE ON public.qtc_ledger
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quwallet_timestamp
  BEFORE UPDATE ON public.quwallet_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_validators_timestamp
  BEFORE UPDATE ON public.qtc_validators
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();