import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { usePriceHistory } from "@/hooks/usePriceHistory";
import {
  computePortfolioRisk,
  valueAtRisk,
  conditionalVaR,
  runStressTest,
  STRESS_SCENARIOS,
} from "@/lib/risk/riskEngine";

const SYMBOLS = ["BTC", "ETH", "SOL"];

const pct = (v: number) => `${(v * 100).toFixed(2)}%`;

export default function RiskAnalyticsPanel() {
  const [symbol, setSymbol] = useState("BTC");
  const { data: history, isLoading } = usePriceHistory(symbol);

  const returns = useMemo(() => {
    const pts = history ?? [];
    const out: number[] = [];
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1].price_usd;
      if (prev > 0) out.push((pts[i].price_usd - prev) / prev);
    }
    return out;
  }, [history]);

  const metrics = useMemo(() => computePortfolioRisk(returns), [returns]);
  const lastPrice = history?.length ? history[history.length - 1].price_usd : 0;

  const stress = useMemo(
    () =>
      lastPrice > 0
        ? STRESS_SCENARIOS.map((s) => runStressTest([{ symbol, value: lastPrice }], s))
        : [],
    [lastPrice, symbol],
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">Risk Analytics Engine</CardTitle>
          <CardDescription className="text-xs">
            VaR / CVaR / Sharpe computed from recorded price history — no simulated inputs.
          </CardDescription>
        </div>
        <Select value={symbol} onValueChange={setSymbol}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {SYMBOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="text-xs text-muted-foreground">Loading recorded history…</p>
        ) : returns.length < 5 ? (
          <p className="text-xs text-muted-foreground">
            Not enough recorded history for {symbol} yet ({returns.length} observations). Metrics appear once the
            price recorder has collected at least 5 points.
          </p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["VaR 95%", pct(valueAtRisk(returns, 0.95))],
                ["VaR 99%", pct(valueAtRisk(returns, 0.99))],
                ["CVaR 95%", pct(conditionalVaR(returns, 0.95))],
                ["Max Drawdown", pct(metrics.maxDrawdown)],
                ["Sharpe", metrics.sharpeRatio.toFixed(2)],
                ["Sortino", metrics.sortinoRatio.toFixed(2)],
                ["Calmar", metrics.calmarRatio.toFixed(2)],
                ["Observations", String(returns.length)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border p-2">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
                  <p className="text-sm font-mono">{value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-medium mb-2">Stress Scenarios (per 1 {symbol} @ ${lastPrice.toLocaleString()})</p>
              <div className="space-y-1">
                {stress.map((s) => (
                  <div key={s.scenario} className="flex items-center justify-between text-xs border-b border-border/50 py-1">
                    <span className="text-muted-foreground">{s.scenario}</span>
                    <Badge variant="outline" className="font-mono">
                      {s.portfolioLoss.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })} ({pct(s.portfolioLossPct)})
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
