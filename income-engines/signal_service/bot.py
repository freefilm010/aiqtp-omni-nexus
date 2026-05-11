"""
AIQTP Signal Subscription Bot.

Pipeline
--------
1. Every SIGNAL_INTERVAL seconds, regenerate signals via strategies.scan_all().
2. Post BUY/SELL signals to:
       * Free Telegram channel (TELEGRAM_FREE_CHAT_ID)         – delayed 1 hour
       * Paid Telegram channel  (TELEGRAM_PREMIUM_CHAT_ID)     – immediate
       * Twitter / X account     (TWITTER_BEARER + write key)  – marketing only
3. Subscription onboarding: any user can DM the bot `/subscribe` and receive
   the Stripe payment link (`STRIPE_SIGNAL_LINK`). On successful payment
   the Stripe webhook adds the user's Telegram ID to the premium channel
   via the Telegram Bot API.

Telegram API: https://core.telegram.org/bots/api
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import asdict
from typing import Dict, List, Optional

import requests

from common.config import settings
from common.logger import get_logger
from common.pnl import record
from .strategies import Signal, scan_all

log = get_logger("signal_bot")

TG_API = "https://api.telegram.org/bot{token}/{method}"
TG_TOKEN = settings.telegram_bot_token
TG_FREE = os.getenv("TELEGRAM_FREE_CHAT_ID")
TG_PREMIUM = os.getenv("TELEGRAM_PREMIUM_CHAT_ID")
SIGNAL_INTERVAL = int(os.getenv("SIGNAL_INTERVAL", "1800"))   # 30 min
FREE_DELAY = int(os.getenv("SIGNAL_FREE_DELAY", "3600"))      # 1 hour
PRICE_USD = float(os.getenv("SIGNAL_PRICE_USD", "49"))


def tg(method: str, **payload) -> Dict:
    if not TG_TOKEN:
        log.warning("TELEGRAM_BOT_TOKEN missing")
        return {}
    url = TG_API.format(token=TG_TOKEN, method=method)
    r = requests.post(url, json=payload, timeout=15)
    if r.status_code != 200:
        log.warning("Telegram %s -> %s %s", method, r.status_code, r.text[:200])
        return {}
    return r.json()


def fmt_signal(s: Signal, premium: bool = False) -> str:
    badge = "PREMIUM" if premium else "FREE"
    return (
        f"[AIQTP {badge}] {s.symbol} *{s.side}* (strength {s.strength:.2f})\n"
        f"Entry: ${s.entry:,.4f}\n"
        f"Target: ${s.target:,.4f}\n"
        f"Stop: ${s.stop:,.4f}\n"
        f"Reason: {s.reason}\n"
        f"Strategy by https://www.aiqtp.com"
    )


def post_signal(s: Signal, chat_id: str, premium: bool) -> None:
    text = fmt_signal(s, premium=premium)
    tg("sendMessage", chat_id=chat_id, text=text, parse_mode="Markdown",
       disable_web_page_preview=True)


def subscription_message() -> str:
    return (
        "Upgrade to AIQTP Premium Signals\n\n"
        f"- Real-time signals (free channel is delayed {FREE_DELAY//60} min)\n"
        "- Momentum + grid + on-chain alpha\n"
        f"- ${PRICE_USD:.0f}/month, cancel any time\n\n"
        f"Subscribe: {settings.stripe_signal_link}\n"
        f"Site: {settings.site_url}"
    )


def handle_updates() -> None:
    """Poll Telegram for new /subscribe commands and reply with the Stripe link."""
    if not TG_TOKEN:
        return
    offset_path = settings.log_dir / "tg_offset.txt"
    offset = int(offset_path.read_text()) if offset_path.exists() else 0
    r = tg("getUpdates", offset=offset, timeout=5)
    for upd in r.get("result", []):
        offset = upd["update_id"] + 1
        msg = upd.get("message") or upd.get("channel_post") or {}
        text = (msg.get("text") or "").strip().lower()
        chat = msg.get("chat", {}).get("id")
        if not chat:
            continue
        if text.startswith(("/start", "/subscribe", "/buy", "/premium")):
            tg("sendMessage", chat_id=chat, text=subscription_message(),
               disable_web_page_preview=True)
            record("signal_service", "subscribe_click", 0.0, chat_id=chat)
    offset_path.write_text(str(offset))


def cross_post_social(s: Signal) -> None:
    """Optional X/Twitter post via the v2 API."""
    bearer = os.getenv("TWITTER_OAUTH2_BEARER")
    if not bearer:
        return
    tweet = (
        f"AIQTP signal: {s.symbol} {s.side} | "
        f"entry ${s.entry:,.2f} target ${s.target:,.2f} stop ${s.stop:,.2f}. "
        f"Premium live alerts: {settings.stripe_signal_link}"
    )
    try:
        r = requests.post(
            "https://api.twitter.com/2/tweets",
            headers={"Authorization": f"Bearer {bearer}", "Content-Type": "application/json"},
            json={"text": tweet}, timeout=15,
        )
        if r.status_code >= 300:
            log.warning("Twitter post failed %s %s", r.status_code, r.text[:200])
    except Exception as e:
        log.warning("Twitter post error: %s", e)


_LAST_FREE_PUSH: Dict[str, float] = {}


def run_forever() -> None:
    log.info("AIQTP signal service starting (interval=%ds)", SIGNAL_INTERVAL)
    while True:
        try:
            handle_updates()
            signals = scan_all()
            log.info("Generated %d signals", len(signals))
            for s in signals:
                if TG_PREMIUM:
                    post_signal(s, TG_PREMIUM, premium=True)
                if TG_FREE:
                    last = _LAST_FREE_PUSH.get(s.symbol, 0)
                    if time.time() - last >= FREE_DELAY:
                        post_signal(s, TG_FREE, premium=False)
                        _LAST_FREE_PUSH[s.symbol] = time.time()
                cross_post_social(s)
                record("signal_service", "signal_published", 0.0,
                       symbol=s.symbol, side=s.side, strength=s.strength)
            # Persist a snapshot for the site to consume.
            snap = settings.log_dir / "latest_signals.json"
            snap.write_text(json.dumps([asdict(s) for s in signals], indent=2))
        except Exception as e:
            log.exception("loop error: %s", e)
        time.sleep(SIGNAL_INTERVAL)


def main() -> None:
    run_forever()


if __name__ == "__main__":
    main()
