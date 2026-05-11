"""AIQTP trading strategies (grid, DCA, arbitrage, momentum)."""

from .routes import router as strategies_router

__all__ = ["strategies_router"]
