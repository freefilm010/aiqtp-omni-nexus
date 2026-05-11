"""
Web3 helper functions: provider construction, gas estimation, ERC20 helpers.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, Optional

from web3 import Web3

try:
    # web3.py >= 7
    from web3.middleware import ExtraDataToPOAMiddleware as _POA_MIDDLEWARE
except ImportError:  # pragma: no cover
    # web3.py < 7
    from web3.middleware import geth_poa_middleware as _POA_MIDDLEWARE  # type: ignore

from .config import settings
from .logger import get_logger

log = get_logger("chain")

ABI_DIR = Path(__file__).resolve().parent.parent / "abis"


@lru_cache(maxsize=8)
def w3(chain: str = "arbitrum") -> Web3:
    """Return a cached Web3 HTTP client for the given chain."""
    rpc_map = {
        "arbitrum": settings.arbitrum_rpc,
        "optimism": settings.optimism_rpc,
        "base": settings.base_rpc,
        "ethereum": settings.ethereum_rpc,
    }
    url = rpc_map.get(chain)
    if not url:
        raise ValueError(f"Unknown chain: {chain}")
    client = Web3(Web3.HTTPProvider(url, request_kwargs={"timeout": 20}))
    # Most L2s use the POA-style extraData; add the middleware defensively.
    try:
        client.middleware_onion.inject(_POA_MIDDLEWARE, layer=0)
    except Exception:
        pass
    return client


def load_abi(name: str) -> Any:
    """Load a JSON ABI from income-engines/abis/<name>.json."""
    path = ABI_DIR / f"{name}.json"
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def erc20(client: Web3, address: str):
    return client.eth.contract(
        address=Web3.to_checksum_address(address),
        abi=load_abi("erc20"),
    )


def gas_price_gwei(client: Web3) -> float:
    return float(Web3.from_wei(client.eth.gas_price, "gwei"))


def is_safe_to_send(client: Web3) -> bool:
    """Pre-flight safety check before broadcasting any tx."""
    if settings.dry_run:
        log.info("DRY_RUN=true; skipping broadcast")
        return False
    gp = gas_price_gwei(client)
    if gp > settings.max_gas_gwei:
        log.warning("Gas %.4f gwei exceeds MAX_GAS_GWEI=%.4f", gp, settings.max_gas_gwei)
        return False
    if not settings.private_key:
        log.error("PRIVATE_KEY missing; cannot sign tx")
        return False
    return True


def account_address(client: Web3) -> Optional[str]:
    if not settings.private_key:
        return None
    acct = client.eth.account.from_key(settings.private_key)
    return acct.address
