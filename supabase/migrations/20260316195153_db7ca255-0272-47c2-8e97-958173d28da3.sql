INSERT INTO education_courses (title, description, category, level, duration_minutes, lessons_count, is_active, is_premium)
VALUES
  ('Getting Started with AIQTP', 'Complete onboarding guide — account setup, navigation, and first trade', 'basics', 'beginner', 30, 6, true, false),
  ('Crypto Trading Fundamentals', 'Master spot trading, order types, and risk management basics', 'trading', 'beginner', 45, 8, true, false),
  ('Stock & ETF Trading with Alpaca', 'US equities trading — paper and live modes, market/limit orders, positions', 'trading', 'beginner', 40, 7, true, false),
  ('AI Strategy Builder Masterclass', 'Build, backtest, and graduate AI trading strategies to the marketplace', 'ai', 'intermediate', 90, 12, true, false),
  ('HiveMind Swarm Intelligence', 'Deploy specialist agents and consensus voting for autonomous trading decisions', 'ai', 'advanced', 60, 8, true, true),
  ('Quantum Computing for Traders', 'IBM Qiskit integration, HRP optimization, and quantum-enhanced portfolios', 'technical', 'advanced', 75, 10, true, true),
  ('DeFi Sniping & Token Analysis', 'DEX screening, honeypot detection, liquidity analysis, and early-stage tokens', 'defi', 'intermediate', 50, 8, true, false),
  ('Payment Processing & Deposits', 'Stripe, PayPal, and Plaid bank linking for account funding and withdrawals', 'basics', 'beginner', 20, 4, true, false),
  ('NFT Creation & Marketplace', 'Mint, list, and trade NFTs — including bot persona trading cards', 'defi', 'intermediate', 45, 7, true, false),
  ('Copy Trading & Social Features', 'Follow top traders, manage copy allocations, and the Elite Creators Club', 'trading', 'beginner', 35, 6, true, false),
  ('Data Bot Builder & Token Mining', 'Build data aggregation bots, earn data tokens, and monetize on the marketplace', 'ai', 'intermediate', 55, 9, true, true),
  ('Risk Management & Portfolio Optimization', 'Advanced risk analytics, VaR calculations, and AI-driven portfolio rebalancing', 'risk', 'advanced', 65, 10, true, true),
  ('Freqtrade Strategy Studio', 'Design, configure, and deploy Freqtrade-compatible trading strategies', 'trading', 'advanced', 70, 9, true, true),
  ('Auto-Invest Engine Setup', 'Configure automated DCA, AI-driven allocations, and reinvestment compounding', 'trading', 'intermediate', 40, 6, true, false),
  ('QuantClaw Agent Deployment', 'Deploy the QuantClaw research and execution agent for systematic trading', 'ai', 'advanced', 55, 8, true, true);

INSERT INTO education_articles (title, category, excerpt, content, read_time_minutes, is_published)
VALUES
  ('Understanding Order Types', 'trading', 'Market, limit, stop, and stop-limit orders explained', 'A comprehensive guide to order types. Market orders execute immediately. Limit orders let you set price. Stop orders trigger at a price level. Stop-limit combines both.', 5, true),
  ('What is Paper Trading?', 'basics', 'Practice trading with virtual funds before risking real capital', 'Paper trading simulates real market conditions using virtual money. AIQTP supports paper trading via Alpaca for stocks and internal engine for crypto.', 4, true),
  ('AI Strategy Graduation Pipeline', 'ai', 'How strategies move from sandbox to marketplace', 'The graduation pipeline evaluates strategies on profitability, consistency, and minimum backtests. Graduated strategies earn creators passive income.', 6, true),
  ('Post-Quantum Cryptography Explained', 'technical', 'Lattice-based signatures and quantum-resistant encryption', 'AIQTP implements CRYSTALS-Kyber and CRYSTALS-Dilithium for quantum-resistant key exchange and digital signatures.', 8, true),
  ('DeFi Honeypot Detection Guide', 'defi', 'How to identify scam tokens before investing', 'Honeypot tokens prevent selling. Key red flags include high buy/sell tax, short locked liquidity, unverified contracts, and concentrated holders.', 5, true),
  ('HiveMind Consensus Explained', 'ai', 'How swarm intelligence agents vote on trading signals', 'The HiveMind system deploys 7 specialist agents. Consensus requires majority agreement. Underperforming agents are automatically retrained.', 7, true),
  ('Connecting Bank Accounts via Plaid', 'basics', 'Step-by-step guide to linking your bank account', 'Plaid provides secure bank connections. Navigate to Connections then Payment Hub then Bank tab. ACH transfers process in 1-3 business days.', 3, true),
  ('Stripe vs PayPal Comparison', 'basics', 'Comparing payment processing options', 'Stripe supports cards, Apple Pay, Google Pay, and ACH. PayPal adds PayPal balance and Venmo. For recurring subscriptions, Stripe is recommended.', 4, true);