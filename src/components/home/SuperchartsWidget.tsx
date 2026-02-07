import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TradingViewChart from "@/components/trading/TradingViewChart";
import { useExchangeTicker } from "@/hooks/useExchangeTicker";
import { Maximize2 } from "lucide-react";

const SYMBOLS = [
  { value: "BTC/USDT", label: "BTC" },
  { value: "ETH/USDT", label: "ETH" },
  { value: "SOL/USDT", label: "SOL" },
] as const;

type ChartSymbol =
  | "BTC/USDT"
  | "ETH/USDT"
  | "SOL/USDT"
  | "BNB/USDT"
  | "XRP/USDT"
  | "ADA/USDT"
  | "DOGE/USDT"
  | "AVAX/USDT";

type TimeframeValue = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

const TIMEFRAMES: { value: TimeframeValue; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "5m", label: "5M" },
  { value: "15m", label: "15M" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
];

const formatPrice = (price: number) =>
  price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SuperchartsWidget = () => {
  const [symbol, setSymbol] = useState<ChartSymbol>("BTC/USDT");
  const [timeframe, setTimeframe] = useState<TimeframeValue>("1h");
  const symbolCfg = useMemo(() => SYMBOLS.find((s) => s.value === symbol) ?? SYMBOLS[0], [symbol]);

  const { ticker, isLive } = useExchangeTicker({ exchange: "kraken", symbol, pollMs: 10_000 });

  return (
    <Card className="overflow-hidden card-premium border-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-panel-border bg-panel-header">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
            {SYMBOLS.map((s) => (
              <button
                key={s.value}
                onClick={() => setSymbol(s.value)}
                className={
                  "px-2 py-1 rounded text-[10px] font-mono font-medium transition-smooth " +
                  (symbol === s.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {ticker ? (
              <>
                <span className="font-mono text-lg font-bold text-foreground">${formatPrice(ticker.last)}</span>
                <Badge
                  variant="outline"
                  className={
                    ticker.changePercent >= 0
                      ? "text-success border-success/50 text-[9px]"
                      : "text-destructive border-destructive/50 text-[9px]"
                  }
                >
                  {ticker.changePercent >= 0 ? "+" : ""}
                  {ticker.changePercent.toFixed(2)}%
                </Badge>
              </>
            ) : (
              <span className="font-mono text-lg font-bold text-muted-foreground">—</span>
            )}

            <Badge
              variant="outline"
              className={isLive ? "text-success border-success/50 text-[8px]" : "text-muted-foreground text-[8px]"}
            >
              {isLive ? "LIVE" : "DELAYED"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md bg-secondary p-1">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf.value}
                onClick={() => setTimeframe(tf.value)}
                className={
                  "px-2 py-1 rounded text-[9px] font-mono font-medium transition-smooth " +
                  (timeframe === tf.value
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {tf.label}
              </button>
            ))}
          </div>

          <Link to="/advanced-trading" aria-label="Open full trading terminal">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Chart */}
      <div className="p-3">
        <TradingViewChart
          height={220}
          showToolbar={false}
          symbol={symbolCfg.value}
          timeframe={timeframe}
          onSymbolChange={(s) => setSymbol(s as ChartSymbol)}
          onTimeframeChange={(tf) => setTimeframe(tf)}
          pollMs={60_000}
        />
      </div>
    </Card>
  );
};

export default SuperchartsWidget;
