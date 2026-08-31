import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOhlcv } from "@/hooks/useOhlcv";
import {
  ChartPatternDetector,
  detectCandlestickPatterns,
  detectSupportResistance,
  type PriceData,
} from "@/lib/ml/patternRecognition";
import { Loader2 } from "lucide-react";

const PatternRecognitionPanel = ({ symbol = "BTCUSDT" }: { symbol?: string }) => {
  const { data: candles, isLoading, error } = useOhlcv(symbol, "4h", 300);

  const result = useMemo(() => {
    if (!candles || candles.length < 60) return null;
    const prices: PriceData[] = candles.map((c) => ({
      timestamp: c.timestamp,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume,
    }));
    return {
      chart: new ChartPatternDetector(prices).detectAllPatterns().slice(0, 6),
      candlestick: detectCandlestickPatterns(prices).slice(-6).reverse(),
      levels: detectSupportResistance(prices).slice(0, 6),
      last: prices[prices.length - 1].close,
    };
  }, [candles]);

  const dirColor = (d: string) =>
    d === "bullish" ? "text-emerald-400" : d === "bearish" ? "text-destructive" : "text-muted-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Chart Pattern Recognition</CardTitle>
        <CardDescription className="text-xs">
          Classical + candlestick pattern detection on live {symbol} 4h candles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning…
          </div>
        ) : error || !result ? (
          <p className="text-xs text-destructive">
            {error instanceof Error ? error.message : "Insufficient candle history."}
          </p>
        ) : (
          <>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Chart patterns</p>
              {result.chart.length === 0 ? (
                <p className="text-xs text-muted-foreground">No formation above confidence threshold right now.</p>
              ) : (
                result.chart.map((p, i) => (
                  <div key={`${p.name}-${i}`} className="flex items-center justify-between border-b border-border/50 py-1">
                    <span className="text-xs font-mono">{p.name}</span>
                    <span className="flex items-center gap-2">
                      <span className={`text-[10px] ${dirColor(p.direction)}`}>{p.direction}</span>
                      <span className="text-[10px] text-muted-foreground">
                        tgt ${p.targetPrice.toFixed(0)} · {(p.confidence * 100).toFixed(0)}%
                      </span>
                    </span>
                  </div>
                ))
              )}
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Recent candlesticks</p>
              <div className="flex flex-wrap gap-1.5">
                {result.candlestick.length === 0 ? (
                  <span className="text-xs text-muted-foreground">None detected.</span>
                ) : (
                  result.candlestick.map((c, i) => (
                    <Badge key={`${c.name}-${i}`} variant="outline" className={`text-[10px] ${dirColor(c.direction)}`}>
                      {c.name}
                    </Badge>
                  ))
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">
                Support / resistance (last ${result.last.toLocaleString(undefined, { maximumFractionDigits: 2 })})
              </p>
              {result.levels.map((l, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/50 py-1">
                  <span className={`text-xs font-mono ${l.type === "support" ? "text-emerald-400" : "text-destructive"}`}>
                    {l.type} ${l.level.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {l.touches} touches · strength {(l.strength * 100).toFixed(0)}%
                    {l.isBreaking ? " · breaking" : ""}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default PatternRecognitionPanel;
