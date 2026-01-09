-- Add supported blockchains and exchanges table
CREATE TABLE public.supported_chains (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  chain_type TEXT NOT NULL, -- 'layer1', 'layer2', 'sidechain', 'privacy'
  rpc_url TEXT,
  explorer_url TEXT,
  logo_url TEXT,
  is_evm_compatible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  native_token_coingecko_id TEXT,
  features JSONB DEFAULT '{}', -- smart_contracts, staking, privacy, zk_proofs, etc
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE public.supported_exchanges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  exchange_type TEXT NOT NULL, -- 'cex', 'dex', 'hybrid'
  api_url TEXT,
  websocket_url TEXT,
  logo_url TEXT,
  supported_chains TEXT[] DEFAULT '{}',
  trading_pairs_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  requires_api_key BOOLEAN DEFAULT true,
  features JSONB DEFAULT '{}', -- spot, futures, margin, options, etc
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS with public read
ALTER TABLE public.supported_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supported_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view supported chains" ON public.supported_chains FOR SELECT USING (true);
CREATE POLICY "Anyone can view supported exchanges" ON public.supported_exchanges FOR SELECT USING (true);

-- Seed supported blockchains
INSERT INTO public.supported_chains (id, name, symbol, chain_type, is_evm_compatible, native_token_coingecko_id, features) VALUES
('ethereum', 'Ethereum', 'ETH', 'layer1', true, 'ethereum', '{"smart_contracts": true, "staking": true, "erc20": true, "erc721": true}'),
('solana', 'Solana', 'SOL', 'layer1', false, 'solana', '{"smart_contracts": true, "staking": true, "spl_tokens": true, "high_tps": true}'),
('bitcoin', 'Bitcoin', 'BTC', 'layer1', false, 'bitcoin', '{"lightning": true, "ordinals": true, "taproot": true}'),
('stellar', 'Stellar', 'XLM', 'layer1', false, 'stellar', '{"smart_contracts": true, "soroban": true, "cross_border": true}'),
('algorand', 'Algorand', 'ALGO', 'layer1', false, 'algorand', '{"smart_contracts": true, "pure_pos": true, "atomic_transfers": true}'),
('avalanche', 'Avalanche', 'AVAX', 'layer1', true, 'avalanche-2', '{"smart_contracts": true, "subnets": true, "high_tps": true}'),
('arbitrum', 'Arbitrum', 'ARB', 'layer2', true, 'arbitrum', '{"optimistic_rollup": true, "ethereum_l2": true}'),
('base', 'Base', 'ETH', 'layer2', true, 'ethereum', '{"optimistic_rollup": true, "coinbase_l2": true}'),
('polygon', 'Polygon', 'MATIC', 'layer2', true, 'matic-network', '{"pos_chain": true, "zkevm": true}'),
('optimism', 'Optimism', 'OP', 'layer2', true, 'optimism', '{"optimistic_rollup": true}'),
('zcash', 'Zcash', 'ZEC', 'privacy', false, 'zcash', '{"zk_snarks": true, "shielded_txs": true, "privacy": true}'),
('monero', 'Monero', 'XMR', 'privacy', false, 'monero', '{"ring_signatures": true, "stealth_addresses": true, "privacy": true}'),
('dash', 'Dash', 'DASH', 'layer1', false, 'dash', '{"instant_send": true, "private_send": true, "masternodes": true}'),
('starknet', 'StarkNet', 'STRK', 'layer2', false, 'starknet', '{"zk_rollup": true, "cairo": true, "validity_proofs": true}'),
('zksync', 'zkSync Era', 'ETH', 'layer2', true, 'ethereum', '{"zk_rollup": true, "account_abstraction": true}'),
('scroll', 'Scroll', 'ETH', 'layer2', true, 'ethereum', '{"zk_rollup": true, "evm_equivalent": true}'),
('linea', 'Linea', 'ETH', 'layer2', true, 'ethereum', '{"zk_rollup": true, "consensys": true}'),
('bnb', 'BNB Chain', 'BNB', 'layer1', true, 'binancecoin', '{"smart_contracts": true, "high_tps": true}'),
('tron', 'TRON', 'TRX', 'layer1', false, 'tron', '{"smart_contracts": true, "high_tps": true, "usdt_home": true}'),
('cardano', 'Cardano', 'ADA', 'layer1', false, 'cardano', '{"smart_contracts": true, "plutus": true, "pos": true}'),
('dogecoin', 'Dogecoin', 'DOGE', 'layer1', false, 'dogecoin', '{"meme": true, "pow": true}'),
('litecoin', 'Litecoin', 'LTC', 'layer1', false, 'litecoin', '{"lightning": true, "mimblewimble": true}'),
('ravencoin', 'Ravencoin', 'RVN', 'layer1', false, 'ravencoin', '{"asset_creation": true, "pow": true}'),
('cosmos', 'Cosmos Hub', 'ATOM', 'layer1', false, 'cosmos', '{"ibc": true, "staking": true, "governance": true}'),
('polkadot', 'Polkadot', 'DOT', 'layer1', false, 'polkadot', '{"parachains": true, "cross_chain": true, "staking": true}'),
('near', 'NEAR Protocol', 'NEAR', 'layer1', false, 'near', '{"sharding": true, "account_abstraction": true}'),
('fantom', 'Fantom', 'FTM', 'layer1', true, 'fantom', '{"dag": true, "high_tps": true}'),
('sui', 'Sui', 'SUI', 'layer1', false, 'sui', '{"move_language": true, "parallel_execution": true}'),
('aptos', 'Aptos', 'APT', 'layer1', false, 'aptos', '{"move_language": true, "block_stm": true}'),
('sei', 'Sei', 'SEI', 'layer1', false, 'sei-network', '{"trading_optimized": true, "parallel_execution": true}'),
('injective', 'Injective', 'INJ', 'layer1', false, 'injective-protocol', '{"defi_optimized": true, "mev_resistant": true}')
ON CONFLICT (id) DO NOTHING;

-- Seed supported exchanges
INSERT INTO public.supported_exchanges (id, name, exchange_type, supported_chains, requires_api_key, features) VALUES
('binance', 'Binance', 'cex', ARRAY['ethereum', 'bnb', 'solana', 'bitcoin'], true, '{"spot": true, "futures": true, "margin": true, "options": true, "staking": true}'),
('coinbase', 'Coinbase', 'cex', ARRAY['ethereum', 'solana', 'bitcoin', 'base'], true, '{"spot": true, "staking": true, "custody": true}'),
('kucoin', 'KuCoin', 'cex', ARRAY['ethereum', 'solana', 'bitcoin', 'bnb'], true, '{"spot": true, "futures": true, "margin": true, "lending": true}'),
('gateio', 'Gate.io', 'cex', ARRAY['ethereum', 'solana', 'bitcoin', 'bnb', 'tron'], true, '{"spot": true, "futures": true, "margin": true}'),
('okx', 'OKX', 'cex', ARRAY['ethereum', 'solana', 'bitcoin', 'polygon'], true, '{"spot": true, "futures": true, "options": true}'),
('bybit', 'Bybit', 'cex', ARRAY['ethereum', 'solana', 'bitcoin'], true, '{"spot": true, "derivatives": true, "copy_trading": true}'),
('kraken', 'Kraken', 'cex', ARRAY['ethereum', 'bitcoin', 'monero', 'zcash'], true, '{"spot": true, "futures": true, "staking": true}'),
('htx', 'HTX (Huobi)', 'cex', ARRAY['ethereum', 'bitcoin', 'tron'], true, '{"spot": true, "futures": true}'),
('mexc', 'MEXC', 'cex', ARRAY['ethereum', 'solana', 'bitcoin', 'bnb'], true, '{"spot": true, "futures": true}'),
('bitget', 'Bitget', 'cex', ARRAY['ethereum', 'solana', 'bitcoin'], true, '{"spot": true, "futures": true, "copy_trading": true}'),
('uniswap', 'Uniswap', 'dex', ARRAY['ethereum', 'arbitrum', 'polygon', 'base', 'optimism'], false, '{"amm": true, "concentrated_liquidity": true}'),
('raydium', 'Raydium', 'dex', ARRAY['solana'], false, '{"amm": true, "clmm": true}'),
('orca', 'Orca', 'dex', ARRAY['solana'], false, '{"amm": true, "whirlpools": true}'),
('jupiter', 'Jupiter', 'dex', ARRAY['solana'], false, '{"aggregator": true, "limit_orders": true, "dca": true}'),
('pancakeswap', 'PancakeSwap', 'dex', ARRAY['bnb', 'ethereum', 'arbitrum'], false, '{"amm": true, "farms": true}'),
('sushiswap', 'SushiSwap', 'dex', ARRAY['ethereum', 'arbitrum', 'polygon', 'avalanche'], false, '{"amm": true, "cross_chain": true}'),
('curve', 'Curve Finance', 'dex', ARRAY['ethereum', 'arbitrum', 'polygon', 'avalanche'], false, '{"stable_swap": true, "gauge": true}'),
('traderjoe', 'Trader Joe', 'dex', ARRAY['avalanche', 'arbitrum'], false, '{"amm": true, "liquidity_book": true}'),
('gmx', 'GMX', 'dex', ARRAY['arbitrum', 'avalanche'], false, '{"perpetuals": true, "glp": true}'),
('dydx', 'dYdX', 'dex', ARRAY['ethereum', 'cosmos'], false, '{"perpetuals": true, "orderbook": true}'),
('1inch', '1inch', 'dex', ARRAY['ethereum', 'bnb', 'polygon', 'arbitrum', 'optimism', 'avalanche'], false, '{"aggregator": true, "limit_orders": true}'),
('paraswap', 'ParaSwap', 'dex', ARRAY['ethereum', 'polygon', 'bnb', 'arbitrum', 'avalanche'], false, '{"aggregator": true}'),
('stellarx', 'StellarX', 'dex', ARRAY['stellar'], false, '{"orderbook": true, "stellar_dex": true}'),
('tinyman', 'Tinyman', 'dex', ARRAY['algorand'], false, '{"amm": true}'),
('algofi', 'AlgoFi', 'dex', ARRAY['algorand'], false, '{"amm": true, "lending": true}')
ON CONFLICT (id) DO NOTHING;

-- Add chain-specific wallet support to solana_wallets -> make it generic
ALTER TABLE public.solana_wallets ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';
ALTER TABLE public.dex_pairs ADD COLUMN IF NOT EXISTS base_token_coingecko_id TEXT;
ALTER TABLE public.dex_pairs ADD COLUMN IF NOT EXISTS quote_token_coingecko_id TEXT;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_supported_chains_type ON public.supported_chains(chain_type);
CREATE INDEX IF NOT EXISTS idx_supported_exchanges_type ON public.supported_exchanges(exchange_type);