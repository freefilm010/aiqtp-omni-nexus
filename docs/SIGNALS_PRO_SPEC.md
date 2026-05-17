# AIQTP Signals Pro — Product Spec

**Status:** Draft v1 (2026-05-17)
**Owner:** founder
**Goal:** Launch first paid product in 30–60 days. Reach $5–10k MRR within 6 months.

---

## 1. Why this product first

AIQTP already has most of the technical scaffolding for a multi-broker signals subscription:

| Need | What exists | Gap |
|---|---|---|
| Signal generation | `src/lib/automation/signalEngine.ts` (TradingSignal, SignalFactor, AutomatedRule types) | Real signal output, not just types |
| Strategy backtest | `src/components/strategy/StrategyBacktest.tsx`, `src/components/strategy/BacktestHistoricalInsights.tsx`, `src/lib/backtesting/engine.ts` | Already built |
| Strategy marketplace UI | `src/components/strategy/StrategyMarketplace.tsx`, `StrategyTemplates.tsx`, `LiveStrategies.tsx` | UI exists; needs subscription gate |
| Multi-broker adapters | `trading-service/connectors/*`, `src/components/admin/ExchangeManager.tsx` | 10+ brokers wired |
| Payments | `src/components/payments/StripeEmbeddedCheckout.tsx`, `src/lib/stripe.ts`, edge function `create-deposit-checkout` | Works for one-time deposits; needs subscription mode |
| User auth + accounts | Supabase auth + RLS; profiles table | Solid |
| Webhook handling | edge function `payments-webhook` | Needs subscription event handling (`customer.subscription.created/updated/deleted`, `invoice.payment_succeeded`) |

**This is a configure + integrate effort, not a build-from-scratch effort.** Realistic to launch beta inside 30 days, full paid in 60.

## 2. Product description

> **AIQTP Signals Pro** is an AI-generated trading signals service for self-directed traders. Subscribers get a daily watchlist, multi-timeframe entry/exit signals, and alerts pushed to email + (optional) webhook for downstream automation. **You bring your own broker account** — AIQTP does not custody funds, place orders on your behalf (in the SaaS tier), or hold customer assets.

This positioning matters legally: as a **software/signals service** (not a broker, not an investment adviser giving personalized advice, not a custodian), AIQTP avoids the most expensive regulatory categories.

**Important boundary:** signals are **generic market commentary**, not personalized investment advice. The published [SEC adviser regs](https://www.sec.gov/divisions/investment/iaregulation/memoia.htm) treat newsletter-style market commentary as protected free speech (per the [Lowe v. SEC](https://supreme.justia.com/cases/federal/us/472/181/) decision) provided the service is non-personalized, impersonal, bona fide publishing, and not crisis-driven. We stay in that lane.

## 3. Tiers

```
┌─────────────────────────────────────────────────────────────────────┐
│ Tier        Price/mo   Annual      What's included                  │
├─────────────────────────────────────────────────────────────────────┤
│ Free                $0          —    • Daily market summary email   │
│                                       • 1 stock + 1 crypto signal   │
│                                       • Public strategy templates   │
│                                       • Paper trading only          │
├─────────────────────────────────────────────────────────────────────┤
│ Signals Pro     $49 / mo    $470/yr  • All Free, plus:              │
│  (RECOMMENDED                         • 10–20 signals/day across    │
│   FOR LAUNCH)                            equities + crypto          │
│                                       • Multi-timeframe (1h–1d)     │
│                                       • Stop-loss + target on every │
│                                          signal                     │
│                                       • Email + SMS alerts          │
│                                       • Strategy backtest tool      │
│                                       • Watchlist sync (mobile)     │
├─────────────────────────────────────────────────────────────────────┤
│ Pro Trader     $149 / mo   $1,430/yr • All Pro, plus:               │
│                                       • Real-time signals           │
│                                       • Webhook delivery (for       │
│                                          custom automation)         │
│                                       • Bring-your-own-broker auto- │
│                                          execution (Alpaca paper +  │
│                                          live; opt-in)              │
│                                       • Advanced strategy builder   │
│                                       • Priority support            │
├─────────────────────────────────────────────────────────────────────┤
│ Elite          $299 / mo   $2,870/yr • All Pro Trader, plus:        │
│                                       • Multi-broker auto-execution │
│                                          (Tradier, Binance, Kraken) │
│                                       • Custom strategy development │
│                                       • 1:1 onboarding call         │
│                                       • Discord access              │
└─────────────────────────────────────────────────────────────────────┘
```

Annual pricing = 2 months free (20% discount), encourages upfront commitment + reduces churn impact.

## 4. What we will NOT promise (legal guardrails)

These claims must NOT appear anywhere in marketing, app UI, or sales material:

- ❌ Specific ROI percentages ("34% monthly return", "18% APY")
- ❌ "Guaranteed" anything
- ❌ "Risk-free"
- ❌ Cherry-picked winning trade screenshots without full backtest context
- ❌ Testimonials we don't actually have or that exaggerate gains
- ❌ "Federal banking charter pending" or similar regulatory implications
- ❌ Claims of outperformance vs benchmarks without compliant performance reporting
- ❌ Fabricated user counts, AUM, or "X users earning Y"

Every page that references performance MUST include:

> *Hypothetical or backtested performance does not reflect actual trading and does not guarantee future results. AIQTP provides general market commentary and software tools only. We are not a registered investment adviser or broker-dealer. You are responsible for your own trades. Trading involves substantial risk of loss.*

## 5. Stripe wiring (concrete, what to build)

### 5a. Stripe Dashboard setup (operator action — 30 min)

1. Stripe Dashboard → Products → Create Product
   - "AIQTP Signals Pro" with recurring monthly $49 price + recurring yearly $470 price
   - "AIQTP Pro Trader" with $149/mo + $1,430/yr
   - "AIQTP Elite" with $299/mo + $2,870/yr
2. Save the `price_*` IDs — we'll reference them in code

### 5b. New Supabase edge function: `create-subscription-checkout`

Mirror `create-deposit-checkout` but call `stripe.checkout.sessions.create({ mode: 'subscription', line_items: [{ price: priceId, quantity: 1 }], ... })` instead of `mode: 'payment'`.

```typescript
// supabase/functions/create-subscription-checkout/index.ts (sketch)
import Stripe from 'https://esm.sh/stripe@14.21.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

Deno.serve(async (req) => {
  const { priceId, customerId, userId, returnUrl } = await req.json();
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    customer: customerId,
    metadata: { user_id: userId },
    return_url: returnUrl ?? `${Deno.env.get('SITE_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
  });
  return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
    headers: { 'content-type': 'application/json' },
  });
});
```

### 5c. Webhook handler upgrade

Extend existing `supabase/functions/payments-webhook/index.ts` to handle:

| Stripe event | Action |
|---|---|
| `checkout.session.completed` (mode=subscription) | INSERT into `user_subscriptions` table, set status = active |
| `customer.subscription.updated` | UPDATE status (active/past_due/canceled) |
| `customer.subscription.deleted` | UPDATE status = canceled, expires_at = period_end |
| `invoice.payment_succeeded` | Renew expires_at; log to `subscription_invoices` |
| `invoice.payment_failed` | Mark past_due; send email |

### 5d. Database schema additions

```sql
-- supabase/migrations/YYYYMMDD_user_subscriptions.sql
create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text unique not null,
  stripe_price_id text not null,
  tier text not null check (tier in ('signals_pro','pro_trader','elite')),
  status text not null check (status in ('active','past_due','canceled','incomplete')),
  current_period_end timestamptz not null,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_subs_user on public.user_subscriptions(user_id);
create index idx_subs_active on public.user_subscriptions(user_id, status) where status = 'active';

-- RLS: users see only their own subscriptions
alter table public.user_subscriptions enable row level security;
create policy "users read own subs" on public.user_subscriptions
  for select using (auth.uid() = user_id);

-- Helper function for access checks
create function public.has_active_subscription(p_user uuid, p_tier text default null)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.user_subscriptions
    where user_id = p_user
      and status = 'active'
      and current_period_end > now()
      and (p_tier is null or tier = p_tier)
  );
$$;
```

### 5e. Frontend changes

- **New page** `src/pages/SubscriptionPage.tsx` — replaces or sits alongside existing PricingPage. Three cards. CTA on each → embedded Stripe Elements checkout (already exists for deposits; just point at new edge function).
- **Access gate**: hook `useActiveSubscription()` calling RPC `has_active_subscription`. Wrap signal feed components in `<RequireSubscription tier="signals_pro">`.
- **Customer portal**: button on user account page → `stripe.billingPortal.sessions.create()` via new edge function `create-billing-portal-session`. Lets users cancel/upgrade themselves; reduces support burden.

## 6. Signal generation — content side

The technical engine exists. The product side needs:

- **Daily signal scheduler**: cron-triggered edge function or Render cron job that runs `signalEngine.ts` against the configured universe (~50 equities + ~20 crypto), persists results to `daily_signals` table.
- **Email delivery**: integrate Resend (cheap, dev-friendly) for templated daily summary email. SMS = Twilio for Pro Trader+.
- **Signal feed UI**: list view + detail view + filtering by symbol/timeframe/strength.
- **Performance tracking**: track each signal vs actual price 24h/7d/30d later. **This is mandatory** for any future compliant performance claims AND for product improvement.

Reasonable starting universe:
- **Equities**: SPY, QQQ, IWM, top 30 S&P names, top 10 ARKK names
- **Crypto**: BTC, ETH, SOL, AVAX, LINK, top 15 by market cap from CoinGecko

Signal frequency budget for Signals Pro tier: ~10–20 actionable signals/day total. Real-time tier (Pro Trader+): event-driven, no fixed cadence.

## 7. Marketing & launch plan

### Pre-launch (Days 1–14)
- Replace fabricated landing with honest beta copy (✅ done in security PR)
- Add `/signals-pro` landing page describing the product
- Set up email capture (Resend free tier or Beehiiv)
- Write 3 substantive blog posts on signal methodology (RSI+EMA confirmation, volume profile, position sizing). Establishes credibility, SEO.
- Post to r/algotrading, r/Daytrading, r/options (be a contributor, not a spammer)

### Beta launch (Days 14–30)
- Open beta to first 50 users at $24/mo (half price) for honest feedback
- Daily signal delivery starts
- Iterate on signal quality, email format, UX based on beta feedback

### Full launch (Days 30–60)
- Open to all at full pricing
- Affiliate program (you already have `ExchangeAffiliateLinks` infrastructure)
- Begin paid acquisition test (Reddit/X/Google) at $50 CAC ceiling
- Target metrics for end of month 2:
  - 25–50 paying subscribers
  - $1.2k–$2.5k MRR
  - <5% monthly churn
  - <$50 CAC

## 8. Success metrics & sunset criteria

**Continue if:**
- $5k+ MRR within 6 months
- <8% monthly churn
- 4.0+ average rating from active users

**Pivot if:**
- <$1k MRR by month 4 despite focused marketing
- Churn >15%/mo
- CAC >LTV

**Sunset if:**
- After pivot, still no signal of demand by month 9

The willingness to sunset is what makes the focus credible.

## 9. Out of scope for Signals Pro

These belong in separate workstreams, not piled onto this launch:

- ❌ Stablecoin issuance (separate 5-10 year regulatory arc)
- ❌ Full broker-dealer (Pro Trader auto-execution rides on Alpaca's BD; we're a tool, not a BD)
- ❌ Investment advisory (we're publisher under Lowe shield, not RIA)
- ❌ NFT marketplace
- ❌ Casino / sports betting
- ❌ Prop firm farming (Apex ToS violation territory anyway)
- ❌ DeFi yield farming
- ❌ Token economy (QTC/AIQ/NXS)
- ❌ Federal charter UI components (admin-only, not in this product)
- ❌ Quantum-themed marketing claims unless we ship the actual ML-KEM + ML-DSA implementation

These stay in the repo (work already done is preserved) but are NOT promoted to users. Future products grow from this first paid base.

## 10. Open questions for founder

1. **Stripe live or test mode for beta?** (Test mode = no real charges; cleaner first 50 users)
2. **Email provider preference?** (Resend, Postmark, SendGrid — I'd default to Resend for dev velocity)
3. **Domain for marketing site?** (aiqtp.com keeps platform; spin up signals.aiqtp.com or use /signals path?)
4. **Affiliate program ON or OFF for beta?** (OFF is simpler initially)
5. **Free tier email frequency?** (Daily is the lead-gen workhorse; weekly is lower touch)
