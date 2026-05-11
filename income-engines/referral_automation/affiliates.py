"""
AIQTP Referral / Affiliate Automation.

Centralises every exchange + tool affiliate program AIQTP participates in,
generates a single landing page that redirects through the user's
referral codes, and (optionally) pings each program's reporting API to
ingest commission revenue into the PnL ledger.

The exchange sign-up itself remains a manual step (KYC + 2FA), but once
the referral code is in env vars this module:

  1. Builds a static `landing.html` containing branded CTAs for each
     program, served from the AIQTP marketing site.
  2. Generates short links in the form
        https://aiqtp.com/r/<slug>?code=<refcode>
     that the AIQTP backend will 302-redirect through.
  3. Pulls commission stats nightly from any exchange that exposes an
     API (e.g. Bybit / Bitget / Gate.io) and records revenue.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Dict, List, Optional

import requests

from common.config import settings
from common.logger import get_logger
from common.pnl import record

log = get_logger("referral_automation")

OUTPUT_HTML = Path(__file__).resolve().parent / "landing.html"
LINKS_JSON  = Path(__file__).resolve().parent / "links.json"


@dataclass
class Affiliate:
    slug: str
    name: str
    description: str
    base_url: str
    referral_param: str
    code_env_var: str
    api_check_url: Optional[str] = None
    payout_currency: str = "USDT"

    @property
    def code(self) -> Optional[str]:
        return os.getenv(self.code_env_var)

    @property
    def referral_link(self) -> str:
        code = self.code or "AIQTP"
        sep = "&" if "?" in self.base_url else "?"
        return f"{self.base_url}{sep}{self.referral_param}={code}"


AFFILIATES: List[Affiliate] = [
    Affiliate(
        slug="kucoin", name="KuCoin",
        description="Spot + futures + options. Best altcoin coverage.",
        base_url="https://www.kucoin.com/r/af",
        referral_param="rcode",
        code_env_var="KUCOIN_REF_CODE",
    ),
    Affiliate(
        slug="mexc", name="MEXC",
        description="Deep altcoin liquidity, zero spot fees.",
        base_url="https://promote.mexc.com/r",
        referral_param="inviteCode",
        code_env_var="MEXC_REF_CODE",
    ),
    Affiliate(
        slug="gate", name="Gate.io",
        description="One of the longest-running CEXes, 1700+ pairs.",
        base_url="https://www.gate.io/signup",
        referral_param="ref",
        code_env_var="GATE_REF_CODE",
        api_check_url="https://api.gateio.ws/api/v4/agency/transactions",
    ),
    Affiliate(
        slug="bybit", name="Bybit",
        description="Top global perps + copy trading.",
        base_url="https://www.bybit.com/invite",
        referral_param="ref",
        code_env_var="BYBIT_REF_CODE",
    ),
    Affiliate(
        slug="bitget", name="Bitget",
        description="Copy trading + zero-fee BTC.",
        base_url="https://partner.bitget.com/bg",
        referral_param="r",
        code_env_var="BITGET_REF_CODE",
    ),
    Affiliate(
        slug="hyperliquid", name="Hyperliquid",
        description="On-chain perps with the highest open interest.",
        base_url="https://app.hyperliquid.xyz/join",
        referral_param="ref",
        code_env_var="HYPERLIQUID_REF_CODE",
    ),
    Affiliate(
        slug="binance", name="Binance",
        description="Largest CEX by volume worldwide.",
        base_url="https://accounts.binance.com/register",
        referral_param="ref",
        code_env_var="BINANCE_REF_CODE",
    ),
]


def build_links_json() -> None:
    out = {a.slug: {
        "name": a.name,
        "description": a.description,
        "url": a.referral_link,
        "code": a.code or "UNSET",
    } for a in AFFILIATES}
    LINKS_JSON.write_text(json.dumps(out, indent=2))
    log.info("Wrote %s with %d programs", LINKS_JSON, len(out))


HTML_TEMPLATE = """<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>AIQTP — Exchange Partners</title>
<meta name="description" content="Trade on the best exchanges using AIQTP-vetted partners. Sign up via our links and you support the platform at no cost to you.">
<style>
:root {{ --bg:#0a0d12; --fg:#e6edf3; --accent:#3ee08a; --card:#141a22; }}
* {{ box-sizing: border-box; }}
body {{ margin:0; background:var(--bg); color:var(--fg); font:16px/1.5 -apple-system,Segoe UI,Inter,Arial,sans-serif; }}
header {{ padding:48px 20px 24px; text-align:center; }}
h1 {{ margin:0 0 8px; font-size:36px; letter-spacing:-.02em; }}
.sub {{ opacity:.75; max-width:640px; margin:0 auto; }}
.grid {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(260px,1fr)); gap:16px; padding:24px; max-width:1100px; margin:0 auto; }}
.card {{ background:var(--card); border-radius:12px; padding:20px; display:flex; flex-direction:column; min-height:200px; }}
.card h2 {{ margin:0 0 8px; }}
.card p {{ flex:1; opacity:.85; }}
a.cta {{ display:inline-block; background:var(--accent); color:#03110a; padding:10px 16px; border-radius:8px; text-decoration:none; font-weight:600; margin-top:12px; }}
a.cta:hover {{ filter:brightness(1.1); }}
footer {{ text-align:center; padding:24px; opacity:.6; font-size:14px; }}
</style></head>
<body>
<header>
  <h1>AIQTP Exchange Partners</h1>
  <p class="sub">Hand-picked exchanges that integrate cleanly with AIQTP strategies. Using these links costs you nothing and helps fund continued development.</p>
</header>
<main class="grid">
{cards}
</main>
<footer>aiqtp.com — partner disclosures available on request</footer>
</body></html>
"""

CARD_TEMPLATE = """<div class="card">
  <h2>{name}</h2>
  <p>{description}</p>
  <a class="cta" href="{url}" target="_blank" rel="noopener">Sign up on {name}</a>
</div>"""


def build_html() -> None:
    cards = "\n".join(
        CARD_TEMPLATE.format(name=a.name, description=a.description, url=a.referral_link)
        for a in AFFILIATES
    )
    OUTPUT_HTML.write_text(HTML_TEMPLATE.format(cards=cards))
    log.info("Wrote %s", OUTPUT_HTML)


def poll_commissions() -> None:
    """Best-effort daily commission fetch. Exchanges that require signed
    private API calls (Bybit, Bitget, KuCoin) need additional secrets."""
    # Gate.io public-ish agency endpoint (returns 401 without key).
    gate_key = os.getenv("GATE_API_KEY")
    gate_secret = os.getenv("GATE_API_SECRET")
    if gate_key and gate_secret:
        try:
            r = requests.get(
                "https://api.gateio.ws/api/v4/agency/transactions",
                headers={"KEY": gate_key},  # SIGN handled separately in prod
                timeout=20,
            )
            if r.status_code == 200:
                rows = r.json()
                total = sum(float(x.get("commission_amount", 0)) for x in rows)
                if total > 0:
                    record("referral_automation", "gate_commission", total)
                    log.info("Gate.io commission: $%.2f", total)
        except Exception as e:
            log.warning("Gate commission fetch failed: %s", e)


def run_once() -> None:
    build_links_json()
    build_html()
    poll_commissions()


def run_forever() -> None:
    log.info("AIQTP referral automation starting")
    while True:
        try:
            run_once()
        except Exception as e:
            log.exception("loop error: %s", e)
        time.sleep(int(os.getenv("REFERRAL_REFRESH", "86400")))


def main() -> None:
    run_once()
    print(f"Generated {OUTPUT_HTML} and {LINKS_JSON}")


if __name__ == "__main__":
    main()
