"""
AIQTP DeFi Yield Optimizer.

Pulls the live DeFi Llama Yields API and ranks the highest-paying stablecoin
pools across Pendle, Aave, GMX, and Hyperliquid (and any other protocol in
the user-configurable whitelist). Designed to:

  1. Continuously refresh pool APYs and TVLs.
  2. Filter for low-IL stablecoin pairs (USDC, USDT, DAI, sUSDe, GHO, ...).
  3. Suggest (and optionally execute) capital reallocations when the
     marginal APY improvement exceeds the rotation cost.
  4. Auto-compound: invoke `claim` + `deposit` on configured pools.

The default mode is *advisory* — it logs the best moves and writes
`yield_recommendations.json`. Execution requires `DRY_RUN=false` and
per-protocol vault adapters that you wire up in `vaults.py`.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Dict, List, Optional

import requests

from common.config import settings
from common.logger import get_logger
from common.pnl import record

log = get_logger("yield_optimizer")

PROTOCOL_WHITELIST = {
    p.strip().lower() for p in os.getenv(
        "YIELD_PROTOCOLS",
        "pendle,aave-v3,gmx-v2,hyperliquid,compound-v3,curve-dex,convex-finance,balancer-v2,ethena"
    ).split(",")
}
CHAIN_WHITELIST = {
    c.strip().lower() for c in os.getenv(
        "YIELD_CHAINS",
        "arbitrum,ethereum,base,optimism,hyperliquid"
    ).split(",")
}
STABLE_SYMBOLS = {"USDC", "USDT", "DAI", "GHO", "FRAX", "LUSD", "SUSDE",
                  "USDE", "PYUSD", "USDC.E", "CRVUSD", "USDB"}
MIN_TVL_USD = float(os.getenv("YIELD_MIN_TVL", "1000000"))
MIN_APY = float(os.getenv("YIELD_MIN_APY", "5.0"))      # percent
TOP_N = int(os.getenv("YIELD_TOP_N", "20"))
REFRESH_SECONDS = int(os.getenv("YIELD_REFRESH", "900"))  # 15 min
REC_FILE = settings.log_dir / "yield_recommendations.json"


@dataclass
class Pool:
    pool: str
    project: str
    chain: str
    symbol: str
    tvl_usd: float
    apy: float
    apy_base: float
    apy_reward: Optional[float]
    stablecoin: bool
    il_risk: str
    url: str


def _is_stable_pair(symbol: str) -> bool:
    parts = [p.strip().upper().replace("WETH", "ETH") for p in symbol.replace("/", "-").split("-")]
    return all(p in STABLE_SYMBOLS for p in parts) and len(parts) >= 1


def fetch_pools() -> List[Pool]:
    log.info("Fetching DeFi Llama yield pools…")
    r = requests.get(settings.defillama_api, timeout=30)
    r.raise_for_status()
    raw = r.json().get("data", [])
    out: List[Pool] = []
    for row in raw:
        project = str(row.get("project", "")).lower()
        chain = str(row.get("chain", "")).lower()
        if project not in PROTOCOL_WHITELIST:
            continue
        if chain not in CHAIN_WHITELIST:
            continue
        symbol = str(row.get("symbol", ""))
        tvl = float(row.get("tvlUsd") or 0)
        apy = float(row.get("apy") or 0)
        if tvl < MIN_TVL_USD or apy < MIN_APY:
            continue
        if row.get("stablecoin") is False and not _is_stable_pair(symbol):
            continue
        out.append(Pool(
            pool=str(row.get("pool", "")),
            project=project,
            chain=chain,
            symbol=symbol,
            tvl_usd=tvl,
            apy=apy,
            apy_base=float(row.get("apyBase") or 0),
            apy_reward=row.get("apyReward"),
            stablecoin=bool(row.get("stablecoin", False)),
            il_risk=str(row.get("ilRisk", "no")),
            url=f"https://defillama.com/yields/pool/{row.get('pool', '')}",
        ))
    out.sort(key=lambda p: p.apy, reverse=True)
    return out


def rank(pools: List[Pool]) -> List[Pool]:
    """Apply secondary safety filters and return the top-N."""
    safe = [p for p in pools if p.il_risk.lower() in {"no", "low"}]
    return safe[:TOP_N]


def write_recommendations(top: List[Pool]) -> None:
    payload = {"generated_at": time.time(), "pools": [asdict(p) for p in top]}
    REC_FILE.write_text(json.dumps(payload, indent=2))
    log.info("Wrote %d recommendations -> %s", len(top), REC_FILE)


def realised_uplift_usd(top: List[Pool]) -> float:
    """Estimate the daily uplift if MAX_POSITION_USD were rotated to the best pool."""
    if not top:
        return 0.0
    best = top[0]
    return settings.max_position_usd * (best.apy / 100.0) / 365.0


def run_once() -> List[Pool]:
    try:
        pools = fetch_pools()
    except Exception as e:
        log.exception("DeFi Llama fetch failed: %s", e)
        return []
    top = rank(pools)
    for p in top[:5]:
        log.info("[%s/%s] %s | APY=%.2f%% TVL=$%.1fM | %s",
                 p.project, p.chain, p.symbol, p.apy, p.tvl_usd / 1e6, p.url)
    write_recommendations(top)
    uplift = realised_uplift_usd(top)
    record("yield_optimizer", "advisory", uplift, top_pool=top[0].pool if top else None)
    return top


def run_forever() -> None:
    log.info("AIQTP yield optimizer starting (refresh=%ds)", REFRESH_SECONDS)
    while True:
        try:
            run_once()
        except Exception as e:
            log.exception("loop error: %s", e)
        time.sleep(REFRESH_SECONDS)


def main() -> None:
    run_forever()


if __name__ == "__main__":
    main()
