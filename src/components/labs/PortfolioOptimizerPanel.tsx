import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  calculateCorrelationMatrix,
  meanVarianceOptimization,
  riskParityPortfolio,
  minimumVariancePortfolio,
  equalWeightPortfolio,
  type Asset,
  type PortfolioMetrics,
} from "@/lib/portfolio/optimization";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const UNIVERSE = ["BTC/USDT", "ETH/USDT", "XMR/USDT", "BNB/USDT", "LINK/USDT"];
const ANNUAL = Math.sqrt(365);

async function dailyCloses(symbol: string): Promise<number[]> {
  const { data, error } = await supabase.functions.invoke("ccxt-trading", {
    body: { action: "fetch_ohlcv", symbol, timeframe: "1d", limit: 180 },
  });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || `candles unavailable for ${symbol}`);
  return (data.data as { close: number }[]).map((r) => Number(r.close));
}

const PortfolioOptimizerPanel = () => {
  const [series, setSeries] = useState<{ symbol: string; returns: number[] }[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all(
      UNIVERSE.map(async (s) => {
        const closes = await dailyCloses(s);
        const returns = closes.slice(1).map((c, i) => c / closes[i] - 1);
        return { symbol: s, returns };
      }),
    )
      .then((r) => alive && setSeries(r))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const results = useMemo(() => {
    if (!series) return null;
    const assets: Asset[] = series.map((s) => {
      const m = s.returns.reduce((a, b) => a + b, 0) / s.returns.length;
      const v = Math.sqrt(s.returns.reduce((a, b) => a + (b - m) ** 2, 0) / (s.returns.length - 1));
      return {
        symbol: s.symbol.replace("USDT", ""),
        expectedReturn: m * 365,
        volatility: v * ANNUAL,
        weight: 1 / series.length,
      };
    });
    const corr = calculateCorrelationMatrix(series.map((s) => s.returns));
    return {
      assets,
      models: [
        { name: "Max Sharpe (mean-variance)", m: meanVarianceOptimization(assets, corr, { maxWeight: 0.6 }) },
        { name: "Risk parity", m: riskParityPortfolio(assets, corr) },
        { name: "Minimum variance", m: minimumVariancePortfolio(assets, corr) },
        { name: "Equal weight", m: equalWeightPortfolio(assets) },
      ] as { name: string; m: PortfolioMetrics }[],
    };
  }, [series]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Portfolio Optimizer</CardTitle>
        <CardDescription className="text-xs">
          180 days of real daily returns · annualized · correlation-aware allocation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : !results ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Estimating covariance…
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {results.assets.map((a) => (
                <Badge key={a.symbol} variant="outline" className="text-[10px] font-mono">
                  {a.symbol} μ {(a.expectedReturn * 100).toFixed(0)}% σ {(a.volatility * 100).toFixed(0)}%
                </Badge>
              ))}
            </div>
            {results.models.map(({ name, m }) => (
              <div key={name} className="border-b border-border/50 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{name}</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    ret {(m.expectedReturn * 100).toFixed(1)}% · vol {(m.volatility * 100).toFixed(1)}% · SR{" "}
                    {m.sharpeRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                  {[...m.weights.entries()].map(([sym, w]) => (
                    <span key={sym} className="text-[10px] font-mono text-muted-foreground">
                      {sym} {(w * 100).toFixed(1)}%
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PortfolioOptimizerPanel;
