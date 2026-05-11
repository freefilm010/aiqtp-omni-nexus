"""
Centralised configuration for all AIQTP income engines.

Every value is read from environment variables so secrets never live
in the repository. A `.env` file in the income-engines/ folder is loaded
automatically if python-dotenv is installed.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv

    _DOTENV_PATH = Path(__file__).resolve().parent.parent / ".env"
    if _DOTENV_PATH.exists():
        load_dotenv(_DOTENV_PATH)
except Exception:
    # python-dotenv is optional. If missing, real env vars are still used.
    pass


def _bool(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}


def _float(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return float(raw)
    except ValueError:
        return default


def _int(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    # --- Chain RPCs (HTTP + WSS) -----------------------------------------
    arbitrum_rpc: str = os.getenv("ARBITRUM_RPC", "https://arb1.arbitrum.io/rpc")
    arbitrum_ws: str = os.getenv("ARBITRUM_WS", "wss://arb1.arbitrum.io/ws")
    optimism_rpc: str = os.getenv("OPTIMISM_RPC", "https://mainnet.optimism.io")
    base_rpc: str = os.getenv("BASE_RPC", "https://mainnet.base.org")
    ethereum_rpc: str = os.getenv("ETHEREUM_RPC", "https://eth.llamarpc.com")
    solana_rpc: str = os.getenv("SOLANA_RPC", "https://api.mainnet-beta.solana.com")

    # --- Wallets ---------------------------------------------------------
    eth_wallet: str = os.getenv(
        "ETH_WALLET", "0xf77Ebc11C2bEe9e3ecefC13CB58CA261f6694c4F"
    )
    sol_wallet: str = os.getenv(
        "SOL_WALLET", "4ic7WGkXYPQm5xkcuCDveDDRuKDBucMTKkk9b8TEZtuh"
    )
    private_key: Optional[str] = os.getenv("PRIVATE_KEY")  # NEVER commit
    sol_private_key: Optional[str] = os.getenv("SOL_PRIVATE_KEY")

    # --- Safety guards ---------------------------------------------------
    dry_run: bool = _bool("DRY_RUN", True)
    max_gas_gwei: float = _float("MAX_GAS_GWEI", 0.5)  # Arbitrum is cheap
    min_profit_usd: float = _float("MIN_PROFIT_USD", 5.0)
    max_position_usd: float = _float("MAX_POSITION_USD", 1000.0)

    # --- External APIs ---------------------------------------------------
    defillama_api: str = "https://yields.llama.fi/pools"
    coingecko_api: str = "https://api.coingecko.com/api/v3"
    telegram_bot_token: Optional[str] = os.getenv("TELEGRAM_BOT_TOKEN")
    telegram_chat_id: Optional[str] = os.getenv("TELEGRAM_CHAT_ID")
    stripe_signal_link: str = os.getenv(
        "STRIPE_SIGNAL_LINK", "https://buy.stripe.com/aiqtp-signals"
    )

    # --- Site ------------------------------------------------------------
    site_url: str = os.getenv("SITE_URL", "https://www.aiqtp.com")

    # --- Logging ---------------------------------------------------------
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    log_dir: Path = Path(os.getenv("LOG_DIR", str(Path(__file__).resolve().parent.parent / "logs")))


settings = Settings()
settings.log_dir.mkdir(parents=True, exist_ok=True)
