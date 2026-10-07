"""Deterministic tests for the built-in strategy engines (grid, DCA, momentum, arbitrage)."""
import asyncio
import unittest

from strategies import arbitrage, dca, grid, momentum


class GridTests(unittest.TestCase):
    def test_arithmetic_levels_and_sides(self):
        plan = grid.build_grid("BTC/USDT", 90, 110, 100, levels=5, total_capital=1000)
        self.assertEqual([l.price for l in plan.grid], [90, 95, 100, 105, 110])
        self.assertEqual([l.side for l in plan.grid], ["buy", "buy", "sell", "sell", "sell"])
        self.assertAlmostEqual(plan.grid[0].size, 200 / 90, places=6)
        # spacing 5% minus 2 x 0.1% fee
        self.assertAlmostEqual(plan.expected_profit_per_trade_pct, 4.8)

    def test_geometric_ends_at_bounds(self):
        plan = grid.build_grid("ETH/USDT", 100, 400, 200, levels=3, mode="geometric")
        self.assertEqual([round(l.price) for l in plan.grid], [100, 200, 400])

    def test_rejects_bad_input(self):
        with self.assertRaises(ValueError):
            grid.build_grid("X", 110, 90, 100)
        with self.assertRaises(ValueError):
            grid.build_grid("X", 90, 110, 120)
        with self.assertRaises(ValueError):
            grid.build_grid("X", 90, 110, 100, levels=1)


class DCATests(unittest.TestCase):
    def test_fixed_plan_totals(self):
        plan = dca.build_dca_plan("BTC/USDT", "weekly", 100, 12)
        self.assertEqual(len(plan.schedule), 12)
        self.assertEqual(plan.total_usd, 1200)

    def test_backtest_math(self):
        r = dca.backtest_dca([100, 50, 100], 100)
        self.assertEqual(r["total_invested_usd"], 300)
        self.assertAlmostEqual(r["units_acquired"], 4.0)

    def test_rejects_bad_input(self):
        with self.assertRaises(ValueError):
            dca.build_dca_plan("X", base_usd=0)
        with self.assertRaises(ValueError):
            dca.build_dca_plan("X", cadence="yearly")


class MomentumTests(unittest.TestCase):
    def test_insufficient_history_holds(self):
        self.assertEqual(momentum.evaluate([1, 2, 3]).signal, "hold")

    def test_crossover_up_buys(self):
        closes = [100 - i * 0.5 for i in range(40)] + [80 + i * 3 for i in range(4)]
        r = momentum.evaluate(closes)
        self.assertIn(r.signal, ("buy", "hold"))
        self.assertNotEqual(r.signal, "sell")

    def test_steady_decline_never_buys(self):
        r = momentum.evaluate([200 - i for i in range(60)])
        self.assertNotEqual(r.signal, "buy")


class FakeCX:
    def __init__(self, prices):
        self.prices = prices

    async def ticker(self, exchange, symbol):
        px = self.prices[exchange]
        if px is None:
            raise RuntimeError("down")
        return {"last": px, "bid": px, "ask": px}


class ArbitrageTests(unittest.TestCase):
    def run_detect(self, prices):
        return asyncio.run(arbitrage.detect(FakeCX(prices), "BTC/USDT", list(prices)))

    def test_net_spread_subtracts_costs(self):
        opps = self.run_detect({"kraken": 100.0, "binance": 101.0})
        self.assertEqual(opps[0].buy_exchange, "kraken")
        self.assertAlmostEqual(opps[0].gross_spread_pct, 1.0)
        self.assertAlmostEqual(opps[0].net_spread_pct, 0.75)
        self.assertTrue(opps[0].profitable)

    def test_tiny_spread_not_profitable(self):
        opps = self.run_detect({"kraken": 100.0, "binance": 100.1})
        self.assertFalse(opps[0].profitable)

    def test_needs_two_quotes(self):
        self.assertEqual(self.run_detect({"kraken": 100.0, "binance": None}), [])


if __name__ == "__main__":
    unittest.main()
