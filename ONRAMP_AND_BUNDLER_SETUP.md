# AIQTP On-Ramp & Self-Hosted ERC-4337 Bundler Setup

## Overview

This document describes the **zero-external-dependency** architecture for:

1. **Fiat-to-Crypto On-Ramp**: Stripe → Uniswap V3 swap on Arbitrum
2. **ERC-4337 Bundler**: Self-hosted eth-infinitism bundler for gasless transactions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend (React)                                                 │
│ - CryptoOnramp component                                         │
│ - Stripe Embedded Checkout                                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ POST /functions/v1/onramp-initiate
                     v
┌─────────────────────────────────────────────────────────────────┐
│ Supabase Edge Functions                                          │
│ - onramp-initiate: Creates Stripe Checkout session              │
│ - onramp-webhook: Receives checkout.session.completed event     │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ POST /execute-swap (via HTTP)
                     v
┌─────────────────────────────────────────────────────────────────┐
│ onramp-service (Self-Hosted Python Worker)                      │
│ - FastAPI + web3.py                                              │
│ - Executes Uniswap V3 swaps on Arbitrum                         │
│ - Delivers USDC/ETH to destination wallet                       │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     │ web3.py JSON-RPC calls
                     v
            ┌────────────────────┐
            │ Arbitrum Mainnet   │
            │ - Uniswap V3       │
            │ - Chainlink Oracle │
            │ - WETH/USDC Pools  │
            └────────────────────┘
```

## 1. Self-Hosted ERC-4337 Bundler

### Quick Start

```bash
cd gasless-bot/bundler

# Copy environment variables
cp .env.example .env
# Edit .env and set:
#   ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
#   BUNDLER_BENEFICIARY=<your-address>

# Copy mnemonic
cp workdir/mnemonic.txt.example workdir/mnemonic.txt
# Edit workdir/mnemonic.txt and paste your mnemonic (12 or 24 words)

# Start the bundler
docker compose up -d

# Verify it's running
curl http://localhost:3000/rpc \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}'
# Should return: {"jsonrpc":"2.0","result":"0xa4b1","id":1}
```

### Configuration

**File**: `gasless-bot/bundler/workdir/bundler.config.json`

Key settings:
- `entryPoints`: `["0x0000000071727De22E5E9d8BAf0edAc6f37da032"]` (EntryPoint v0.7)
- `network`: Arbitrum One (chainId 42161)
- `mnemonic`: Loaded from `workdir/mnemonic.txt`
- `unsafe`: Set to `true` to run without external paymaster (self-funded mode)

### Paymaster Configuration

The bundler includes a **Verifying Paymaster** that can sponsor UserOperations:

- **Enabled by default**: Bundler will sponsor gas for UserOperations
- **Disable**: Set `unsafe: true` in `bundler.config.json` — UserOperations must be self-funded (Smart Account needs ETH)

### Updating gasless-bot to Use Self-Hosted Bundler

The `gasless-bot/bot/bot.py` and `gasless-bot/scripts/deploy_smart_account.py` have been updated to use the self-hosted bundler by default.

**Environment variables** (in `gasless-bot/.env`):

```bash
# Point to the self-hosted bundler
BUNDLER_RPC_URL=http://localhost:3000/rpc

# Paymaster endpoint (same as bundler by default)
PAYMASTER_RPC_URL=http://localhost:3000/rpc

# Enable/disable paymaster sponsorship
PAYMASTER_ENABLED=true
```

**To deploy a Smart Account**:

```bash
cd gasless-bot
python scripts/deploy_smart_account.py
# Output: SMART_ACCOUNT_ADDRESS=0x...
```

**To run the bot**:

```bash
cd gasless-bot
python bot/bot.py
```

---

## 2. Fiat-to-Crypto On-Ramp

### Architecture

1. **User initiates purchase** via frontend CryptoOnramp component
2. **onramp-initiate** creates a Stripe Checkout session with metadata:
   - `type: "crypto_onramp"`
   - `output_token: "USDC" | "ETH"`
   - `destination_wallet: "0x..."`
   - `amount_usd: "100.00"`
3. **User pays via Stripe** (embedded checkout)
4. **Stripe fires webhook** to `onramp-webhook` Supabase Edge Function
5. **onramp-webhook** verifies the signature and calls `onramp-service` POST `/execute-swap`
6. **onramp-service** (self-hosted Python worker):
   - Fetches current ETH/USD price from Chainlink
   - Converts USD to ETH amount
   - Executes Uniswap V3 swap: `ETH -> USDC` (or wraps ETH -> WETH)
   - Sends output token to destination wallet
   - Returns transaction hash
7. **onramp-webhook** updates the order status to `"swap_submitted"` or `"swap_failed"`

### Database Schema

**Table**: `onramp_orders`

```sql
CREATE TABLE onramp_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_intent TEXT,
  amount_usd DECIMAL(10, 2) NOT NULL,
  output_token TEXT NOT NULL CHECK (output_token IN ('USDC', 'ETH')),
  destination_wallet TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'arbitrum',
  status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN (
    'pending_payment', 'payment_confirmed', 'swap_submitted', 'swap_failed'
  )),
  tx_hash TEXT,
  error_message TEXT,
  environment TEXT NOT NULL DEFAULT 'live' CHECK (environment IN ('sandbox', 'live')),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_onramp_user_id ON onramp_orders(user_id);
CREATE INDEX idx_onramp_session_id ON onramp_orders(stripe_session_id);
CREATE INDEX idx_onramp_status ON onramp_orders(status);
```

### Setup Instructions

#### 1. Deploy Supabase Edge Functions

```bash
# Deploy onramp-initiate
supabase functions deploy onramp-initiate

# Deploy onramp-webhook
supabase functions deploy onramp-webhook
```

#### 2. Configure Stripe Webhook

In Stripe Dashboard:

1. Go to **Developers** → **Webhooks**
2. Add endpoint:
   - URL: `https://<your-supabase-project>.supabase.co/functions/v1/onramp-webhook?env=live`
   - Events: `checkout.session.completed`
3. Copy the webhook signing secret
4. Set in Supabase secrets:
   ```bash
   supabase secrets set STRIPE_WEBHOOK_SECRET="whsec_..."
   ```

#### 3. Start the onramp-service Worker

```bash
cd onramp-service

# Copy environment
cp .env.example .env
# Edit .env:
#   ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
#   ONRAMP_EXECUTOR_PRIVATE_KEY=<private-key-of-swap-executor>
#   ONRAMP_WORKER_SECRET=<shared-secret>

# Start locally (for testing)
pip install -r requirements.txt
python main.py

# Or start via Docker
docker build -t onramp-service .
docker run -p 8080:8080 --env-file .env onramp-service
```

#### 4. Configure onramp-webhook to Call onramp-service

Set Supabase secrets:

```bash
supabase secrets set ONRAMP_WORKER_URL="http://localhost:8080"  # local testing
# or
supabase secrets set ONRAMP_WORKER_URL="https://onramp-service.example.com"  # production
supabase secrets set ONRAMP_WORKER_SECRET="<shared-secret>"
```

### Frontend Integration

**Component**: `src/components/payments/CryptoOnramp.tsx`

```typescript
import CryptoOnramp from "@/components/payments/CryptoOnramp";

export default function BuyPage() {
  return (
    <CryptoOnramp
      environment="live"
      returnUrl="https://app.example.com/onramp-success"
    />
  );
}
```

### Testing

**Local test flow** (sandbox mode):

```bash
# 1. Start bundler
cd gasless-bot/bundler && docker compose up -d

# 2. Start onramp-service
cd onramp-service && python main.py

# 3. Call onramp-initiate (via Supabase CLI or curl)
curl -X POST http://localhost:54321/functions/v1/onramp-initiate \
  -H "Authorization: Bearer <jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "amountInCents": 10000,
    "outputToken": "USDC",
    "returnUrl": "http://localhost:3000/onramp-success",
    "environment": "sandbox",
    "userId": "<user-id>"
  }'

# 4. Use Stripe test card: 4242 4242 4242 4242
```

---

## Troubleshooting

### Bundler won't start

```bash
# Check logs
docker compose logs bundler

# Verify mnemonic is set
cat gasless-bot/bundler/workdir/mnemonic.txt

# Verify RPC endpoint is reachable
curl https://arb1.arbitrum.io/rpc \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"eth_blockNumber","params":[]}'
```

### onramp-service fails to execute swap

```bash
# Check logs
docker logs onramp-service

# Verify executor wallet has ETH
curl http://localhost:8080/health

# Check Uniswap V3 pool liquidity on Arbitrum
# https://app.uniswap.org/#/swap?chain=arbitrum
```

### Stripe webhook not firing

```bash
# In Stripe Dashboard, check webhook delivery logs
# Verify endpoint URL is correct and accessible
# Test webhook: Developers → Webhooks → Send test event
```

---

## Production Deployment

### Bundler

1. Deploy to a VPS or cloud provider (AWS, GCP, Azure)
2. Use a managed Arbitrum RPC (Alchemy, Infura, QuickNode)
3. Secure the mnemonic in a secrets manager (AWS Secrets Manager, HashiCorp Vault)
4. Set `unsafe: false` in `bundler.config.json` to enable external paymaster

### onramp-service

1. Deploy as a Docker container on a VPS or Kubernetes cluster
2. Use environment variables from a secrets manager
3. Set up reverse proxy (nginx) with SSL/TLS
4. Monitor executor wallet balance and auto-refill when low
5. Implement rate limiting and request signing

### Supabase Edge Functions

1. Secrets are managed via Supabase Dashboard
2. Functions are automatically deployed and scaled
3. Monitor logs in Supabase Dashboard → Functions

---

## Security Considerations

- **Private keys**: Never commit `.env` files. Use secrets managers.
- **Webhook verification**: Always verify Stripe webhook signatures.
- **Worker authentication**: Use `X-Worker-Secret` header to authenticate calls to onramp-service.
- **Slippage tolerance**: Set to 1% to protect against sandwich attacks.
- **Rate limiting**: Implement rate limits on onramp-initiate endpoint.
- **Executor wallet**: Keep only necessary ETH; rotate keys regularly.

---

## Next Steps

1. **Deploy bundler** to production VPS
2. **Deploy onramp-service** to production with auto-scaling
3. **Set up monitoring** for both services (logs, alerts, uptime)
4. **Test end-to-end** with small amounts before going live
5. **Implement analytics** to track on-ramp volume and success rates
