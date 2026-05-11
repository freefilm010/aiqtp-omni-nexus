# Crypto Signal Subscription Service

Generates real-time momentum + grid trading signals on the AIQTP coin universe, posts them to a free + premium Telegram channel, optionally cross-posts to X/Twitter, and converts paying subscribers via the existing Stripe payment link.

## Components

| File | Purpose |
|------|---------|
| `strategies.py` | Pure-Python signal generators (dual-momentum, Bollinger grid). Uses Coingecko free OHLC. |
| `bot.py` | Main loop: scan -> post to Telegram free + premium -> cross-post X -> persist `latest_signals.json`. Also polls `/subscribe` DMs. |
| `stripe_webhook.py` | FastAPI endpoint that receives `checkout.session.completed` from Stripe and auto-invites paying users to the premium Telegram channel. |

## Setup

1. **Create the Telegram bot**

   - Chat with [@BotFather](https://t.me/BotFather) -> `/newbot` -> copy the token.
   - Export `TELEGRAM_BOT_TOKEN`.
   - Create two private channels: free + premium. Add the bot as admin to both. Get the chat IDs by sending any message and calling `getUpdates`.

2. **Configure environment**

   | Var | Notes |
   |-----|-------|
   | `TELEGRAM_BOT_TOKEN` | From BotFather. |
   | `TELEGRAM_FREE_CHAT_ID` | Free channel ID (negative integer). |
   | `TELEGRAM_PREMIUM_CHAT_ID` | Premium channel ID. |
   | `STRIPE_SIGNAL_LINK` | Existing Stripe payment link, e.g. `https://buy.stripe.com/aiqtp-signals`. |
   | `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → "Signing secret". |
   | `TWITTER_OAUTH2_BEARER` | Optional cross-post. |
   | `SIGNAL_INTERVAL` | Seconds between scans (default 1800). |
   | `SIGNAL_FREE_DELAY` | Free channel lag in seconds (default 3600). |
   | `SIGNAL_PRICE_USD` | Marketing price shown in `/subscribe` reply. |

3. **Stripe webhook**

   ```bash
   uvicorn signal_service.stripe_webhook:app --host 0.0.0.0 --port 8088
   ```

   Point Stripe at `https://api.aiqtp.com/stripe/signals`. Add a custom field "Telegram username/ID" to the Stripe payment link so we can match payments to Telegram accounts.

4. **Run the signal loop**

   ```bash
   python -m signal_service.bot
   ```

## Funnel

```
/start  -> bot DM with marketing copy + Stripe link
Stripe payment success -> webhook creates single-use invite link
Invite link -> user joins premium channel
```

The PnL ledger records every `subscription_paid` event with the gross dollar amount, so the orchestrator's combined-PnL report reflects subscription revenue.
