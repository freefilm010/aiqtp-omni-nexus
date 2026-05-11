# Referral / Affiliate Automation

Generates a single branded landing page at `landing.html` that funnels visitors through AIQTP's exchange referral codes, plus a machine-readable `links.json` consumed by the main site for short-link redirects.

## Supported programs

KuCoin · MEXC · Gate.io · Bybit · Bitget · Binance · Hyperliquid

Each program reads its code from a dedicated env var:

| Variable | Required for |
|----------|--------------|
| `KUCOIN_REF_CODE` | KuCoin |
| `MEXC_REF_CODE` | MEXC |
| `GATE_REF_CODE` | Gate.io |
| `BYBIT_REF_CODE` | Bybit |
| `BITGET_REF_CODE` | Bitget |
| `BINANCE_REF_CODE` | Binance |
| `HYPERLIQUID_REF_CODE` | Hyperliquid |

If a code is missing, the link falls back to `AIQTP` as the referral code so it remains attributable to the platform.

## Usage

```bash
python -m referral_automation.affiliates
```

This writes:

- `landing.html` – a stand-alone, dark-themed page (drop it into the AIQTP marketing site at `/partners`).
- `links.json` – `{ slug: { name, description, url, code } }` for the React frontend to consume.

## Commission ingestion

The `poll_commissions()` function calls partner reporting endpoints when keys are present (e.g. `GATE_API_KEY` + `GATE_API_SECRET`). Recognised payments are appended to the shared PnL ledger under engine name `referral_automation`. Signed request paths for Bybit / Bitget / KuCoin require additional implementation that depends on each exchange's auth scheme — start with the documented prefix in `affiliates.py`.

## Wiring into the AIQTP site

Add a redirector to the existing Next/Vite app:

```ts
// /api/r/[slug].ts
import links from "../../income-engines/referral_automation/links.json";
export default function handler(req, res) {
  const target = links[req.query.slug]?.url ?? "https://www.aiqtp.com";
  res.redirect(302, target);
}
```

Then short URLs like `https://aiqtp.com/r/kucoin` will 302 through to the partner with the right code attached.
