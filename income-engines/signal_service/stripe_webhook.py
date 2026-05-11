"""
Minimal FastAPI webhook that receives Stripe `checkout.session.completed`
events and adds the customer's Telegram ID to the premium channel.

Run with:
    uvicorn signal_service.stripe_webhook:app --host 0.0.0.0 --port 8088

Stripe must be configured to POST to https://api.aiqtp.com/stripe/signals.
"""

from __future__ import annotations

import os
from typing import Any, Dict

import requests
from fastapi import FastAPI, Header, HTTPException, Request

from common.config import settings
from common.logger import get_logger
from common.pnl import record

log = get_logger("stripe_webhook")
app = FastAPI(title="AIQTP Signal Stripe Webhook")

STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
TG_TOKEN = settings.telegram_bot_token
TG_PREMIUM = os.getenv("TELEGRAM_PREMIUM_CHAT_ID")


def _verify_signature(payload: bytes, sig_header: str) -> bool:
    if not STRIPE_WEBHOOK_SECRET:
        log.warning("STRIPE_WEBHOOK_SECRET not set; skipping verification (UNSAFE)")
        return True
    try:
        import stripe
        stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        return True
    except Exception as e:
        log.error("Stripe sig verify failed: %s", e)
        return False


def _add_to_premium(telegram_id: str) -> bool:
    if not TG_TOKEN or not TG_PREMIUM:
        return False
    # Invite link (channel must allow admins to create invite links).
    r = requests.post(
        f"https://api.telegram.org/bot{TG_TOKEN}/createChatInviteLink",
        json={"chat_id": TG_PREMIUM, "member_limit": 1, "name": f"sub-{telegram_id}"},
        timeout=15,
    )
    if r.status_code != 200:
        log.warning("createChatInviteLink failed %s %s", r.status_code, r.text[:200])
        return False
    invite = r.json().get("result", {}).get("invite_link")
    # DM the invite back to the user.
    requests.post(
        f"https://api.telegram.org/bot{TG_TOKEN}/sendMessage",
        json={
            "chat_id": telegram_id,
            "text": f"Welcome to AIQTP Premium Signals.\nJoin: {invite}",
        }, timeout=15,
    )
    return True


@app.post("/stripe/signals")
async def stripe_signals(req: Request, stripe_signature: str = Header(default="")) -> Dict[str, Any]:
    body = await req.body()
    if not _verify_signature(body, stripe_signature):
        raise HTTPException(status_code=400, detail="bad signature")
    event = await req.json()
    if event.get("type") != "checkout.session.completed":
        return {"ignored": event.get("type")}
    sess = event["data"]["object"]
    customer_email = sess.get("customer_details", {}).get("email")
    amount = float(sess.get("amount_total", 0)) / 100.0
    tg_id = (sess.get("custom_fields") or [{}])[0].get("text", {}).get("value")
    log.info("Stripe paid: $%.2f from %s tg=%s", amount, customer_email, tg_id)
    record("signal_service", "subscription_paid", amount,
           email=customer_email, tg=tg_id)
    if tg_id:
        _add_to_premium(str(tg_id))
    return {"ok": True}


@app.get("/healthz")
def health() -> Dict[str, str]:
    return {"status": "ok"}
