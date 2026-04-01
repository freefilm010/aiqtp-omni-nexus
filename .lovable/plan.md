

## Plan: Expand Faucet Assets + ZBD Wallet Integration

### Current State
- **Faucet**: 15 tokens across 4 categories (stablecoin, platform, testnet, defi) — all hardcoded in `CryptoFaucet.tsx`
- **Lightning Vault**: Database-backed (lightning_channels, lightning_transactions), supports BTC/ETH/USDC send/receive/swap with generated BOLT11 invoices, but no real Lightning Network connection
- **ZBD**: You have ZBD docs forked (`zbd-docs`), but no ZBD integration exists yet

### What We Can Build

#### 1. Expand Faucet with More Assets
Add new tokens to the hardcoded list and optionally a new "lightning" category:
- **Lightning tokens**: tSATS (testnet sats), tLNBTC (Lightning BTC)
- **More DeFi**: tSUSHI, tCOMP, tMKR, tCRV
- **L2 tokens**: tARB (Arbitrum), tOP (Optimism), tBASE
- **Privacy**: tXMR, tZEC testnet tokens
- **New category tab** "Lightning" in the faucet UI

#### 2. ZBD Wallet Connection to Lightning Vault
ZBD provides a real Lightning Network API for sending/receiving sats. Integration would:
- Add a **"Connect ZBD"** button in Lightning Vault
- Create an edge function `zbd-wallet` that proxies ZBD API calls (send, receive, wallet balance)
- Store the user's ZBD API key securely via the secrets system
- Enable **real Lightning deposits** by generating ZBD payment requests
- Show ZBD balance alongside vault balance

**Requires**: A ZBD API key (from https://dashboard.zebedee.io). Do you have one, or should we set up the integration flow to request it?

#### 3. Test Deposit from ZBD
Once connected, the flow would be:
- User clicks "Deposit from ZBD" in Lightning Vault
- Edge function calls ZBD API to create a withdrawal (ZBD → Vault)
- Transaction recorded in `lightning_transactions`
- Vault balance updated in `lightning_channels`

### Files to Change
| File | Change |
|------|--------|
| `src/components/faucet/CryptoFaucet.tsx` | Add ~12 new tokens + "lightning" category |
| `src/components/faucet/FaucetTokenList.tsx` | Add "Lightning" tab to categories |
| `src/pages/LightningVault.tsx` | Add ZBD connection UI + deposit flow |
| `supabase/functions/zbd-wallet/index.ts` | New edge function for ZBD API proxy |
| Migration | Add `zbd_api_key_encrypted` column or use secrets |

### Technical Details
- ZBD REST API endpoints: `POST /v0/charges` (receive), `POST /v0/payments` (send), `GET /v0/wallet` (balance)
- Edge function handles auth + proxies to ZBD with server-side API key
- Faucet expansion is purely frontend — no DB changes needed (uses existing `credit_faucet_claim` RPC)

