#!/usr/bin/env python3
"""AIQTP DeFi Yield Scanner.

Pulls the full DeFi Llama yields universe and filters for high-quality,
investible pools.  Two categories are reported:

  1. STABLE / LOW-RISK    stablecoin pools, no IL, TVL >= $10M, APY >= 5%
  2. BLUE-CHIP HIGH-YIELD any pool, APY >= 10%, TVL >= $5M, with risk flag

Outputs a human-readable table and a JSON file at ./bot_state/yields.json.

Run once:
    python bots/yield_scanner.py

Run as a worker (every 30 min):
    YIELD_SCAN_INTERVAL=1800 python bots/yield_scanner.py --loop
"""
from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
import urllib.request
from pathlib import Path
from typing import Any

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s [%(levelname)s] yield-scanner — %(message)s")
log = logging.getLogger("yield-scanner")

UA = {"User-Agent": "Mozilla/5.0 (AIQTP yield scanner)"}
LLAMA_POOLS_URL = "https://yields.llama.fi/pools"
STATE_DIR = Path(os.getenv("BOT_STATE_DIR", "./bot_state"))
STATE_DIR.mkdir(parents=True, exist_ok=True)
OUT_FILE = STATE_DIR / "yields.json"

MIN_APY = float(os.getenv("YIELD_MIN_APY", "10"))
MIN_TVL = float(os.getenv("YIELD_MIN_TVL_USD", "5000000"))
STABLE_MIN_APY = float(os.getenv("YIELD_STABLE_MIN_APY", "5"))
STABLE_MIN_TVL = float(os.getenv("YIELD_STABLE_MIN_TVL_USD", "10000000"))
MAX_APY = float(os.getenv("YIELD_MAX_APY", "200"))  # filter obvious outliers


def fetch_pools() -> list[dict]:
    req = urllib.request.Request(LLAMA_POOLS_URL, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as r:
        data = json.loads(r.read())
    return data.get("data", [])


def normalize(p: dict) -> dict:
    try:
        apy = float(p.get("apy") or 0)
    except Exception:
        apy = 0.0
    try:
        tvl = float(p.get("tvlUsd") or 0)
    except Exception:
        tvl = 0.0
    return {
        "project": p.get("project"),
        "chain": p.get("chain"),
        "symbol": p.get("symbol"),
        "apy": round(apy, 2),
        "apy_base": p.get("apyBase"),
        "apy_reward": p.get("apyReward"),
        "tvl_usd": int(tvl),
        "stablecoin": bool(p.get("stablecoin")),
        "ilRisk": p.get("ilRisk"),
        "exposure": p.get("exposure"),
        "pool_id": p.get("pool"),
        "url": f"https://defillama.com/yields/pool/{p.get('pool')}",
    }


def scan() -> dict:
    pools = [normalize(p) for p in fetch_pools()]

    stable_lowrisk = [
        p for p in pools
        if p["stablecoin"]
        and p["ilRisk"] == "no"
        and p["apy"] >= STABLE_MIN_APY
        and p["apy"] <= MAX_APY
        and p["tvl_usd"] >= STABLE_MIN_TVL
    ]
    stable_lowrisk.sort(key=lambda p: p["apy"], reverse=True)

    bluechip_chains = {"Ethereum", "Arbitrum", "Base", "Optimism", "Polygon",
                       "Solana", "BSC", "OP Mainnet", "Hyperliquid L1"}
    bluechip_projects = {
        "aave-v3", "compound-v3", "lido", "rocket-pool", "morpho-blue",
        "morpho-aave", "uniswap-v3", "uniswap-v4", "curve-dex", "pendle",
        "aerodrome-v1", "aerodrome-slipstream", "raydium-clmm", "orca-dex",
        "fluid-dex", "fluid-lending", "spark", "sky-lending", "ethena-usde",
    }
    bluechip = [
        p for p in pools
        if p["chain"] in bluechip_chains
        and p["project"] in bluechip_projects
        and p["apy"] >= MIN_APY
        and p["apy"] <= MAX_APY
        and p["tvl_usd"] >= MIN_TVL
    ]
    bluechip.sort(key=lambda p: p["apy"], reverse=True)

    return {
        "timestamp": int(time.time()),
        "stable_lowrisk": stable_lowrisk[:30],
        "bluechip_highyield": bluechip[:30],
        "stats": {
            "total_pools": len(pools),
            "stable_lowrisk_matches": len(stable_lowrisk),
            "bluechip_matches": len(bluechip),
        },
    }


def print_table(title: str, rows: list[dict]) -> None:
    print(f"\n=== {title} ===")
    if not rows:
        print("  (no matches)")
        return
    print(f"  {'APY':>7}  {'TVL':>10}  {'CHAIN':<14} {'PROJECT':<24} {'SYMBOL':<22} STABLE  IL")
    for r in rows:
        tvl_m = f"${r['tvl_usd']/1e6:>8.1f}M"
        print(f"  {r['apy']:>6.2f}%  {tvl_m}  {r['chain']:<14} {r['project']:<24} "
              f"{(r['symbol'] or '')[:22]:<22} {str(r['stablecoin']):<6}  {r['ilRisk']}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--loop", action="store_true",
                    help="run continuously every YIELD_SCAN_INTERVAL seconds")
    ap.add_argument("--quiet", action="store_true", help="suppress table output")
    args = ap.parse_args()
    interval = int(os.getenv("YIELD_SCAN_INTERVAL", "1800"))

    def one() -> None:
        try:
            report = scan()
        except Exception as e:  # noqa: BLE001
            log.error("scan failed: %s", e)
            return
        OUT_FILE.write_text(json.dumps(report, indent=2))
        log.info("scan complete — %s pools, %d stable/low-risk, %d blue-chip ≥%.0f%%; written to %s",
                 report["stats"]["total_pools"],
                 report["stats"]["stable_lowrisk_matches"],
                 report["stats"]["bluechip_matches"],
                 MIN_APY, OUT_FILE)
        if not args.quiet:
            print_table("STABLE / LOW-RISK (no IL, TVL>=$10M)", report["stable_lowrisk"][:20])
            print_table(f"BLUE-CHIP HIGH-YIELD (APY>={MIN_APY}%, TVL>=$5M)",
                        report["bluechip_highyield"][:20])

    one()
    if args.loop:
        while True:
            time.sleep(interval)
            one()
    return 0


if __name__ == "__main__":
    sys.exit(main())
