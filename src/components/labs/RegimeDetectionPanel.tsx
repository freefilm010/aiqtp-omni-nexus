import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useOhlcv } from "@/hooks/useOhlcv";
import { RegimeDetector, calculateRegimeFeatures, type RegimeFeatures } from "@/lib/ml/regimeDetection";
import { Loader2 } from "lucide-react";

const RegimeDetectionPanel = ({ symbol = "BTCUSDT" }: { symbol?: string }) => {
  const { data: candles, isLoading, error } = useOhlcv(symbol, "1h", 400);

  const state = useMemo(() => {
    if (!candles || candles.length < 120) return null;
    const rows = candles.map((c) => ({ close: c.close, volume: c.volume }));
    const featureSeries: RegimeFeatures[] = [];
    for (let i = 60; i < rows.length; i += 4) {
      featureSeries.push(calculateRegimeFeatures(rows.slice(0, i + 1), 20));
    }
    if (!featureSeries.length) return null;
    return new RegimeDetector(60).detectRegime(featureSeries);
  }, [candles]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Regime Detection (HMM)</CardTitle>
        <CardDescription className="text-xs">
          8-state hidden Markov model over live {symbol} hourly candles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading candles…
          </div>
        ) : error || !state ? (
          <p className="text-xs text-destructive">
            {error instanceof Error ? error.message : "Not enough history to classify a regime."}
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Badge className="text-[10px] font-mono uppercase">{state.regime.replace(/_/g, " ")}</Badge>
              <span className="text-xs font-mono text-muted-foreground">
                {(state.probability * 100).toFixed(1)}% conf · {state.duration} bars
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              <span className="text-muted-foreground">Trend</span>
              <span className="text-right">{(state.features.trend * 100).toFixed(3)}%</span>
              <span className="text-muted-foreground">Volatility</span>
              <span className="text-right">{(state.features.volatility * 100).toFixed(2)}%</span>
              <span className="text-muted-foreground">Momentum</span>
              <span className="text-right">{(state.features.momentum * 100).toFixed(2)}%</span>
              <span className="text-muted-foreground">Volume ratio</span>
              <span className="text-right">{state.features.volume.toFixed(2)}x</span>
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Transition probabilities</p>
              {Object.entries(state.transitionProbabilities)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([r, p]) => (
                  <div key={r} className="flex items-center gap-2">
                    <span className="text-[10px] font-mono w-32 truncate">{r.replace(/_/g, " ")}</span>
                    <Progress value={p * 100} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-mono w-10 text-right">{(p * 100).toFixed(0)}%</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default RegimeDetectionPanel;
