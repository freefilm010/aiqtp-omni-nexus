import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TradingViewChart from "@/components/trading/TradingViewChart";
import { Maximize2 } from "lucide-react";

type ChartSymbol =
  | "BTC/USDT"
  | "ETH/USDT"
  | "SOL/USDT"
  | "BNB/USDT"
  | "XRP/USDT"
  | "ADA/USDT"
  | "DOGE/USDT"
  | "AVAX/USDT";

const SYMBOLS = [
  { value: "BTC/USDT" as ChartSymbol, label: "BTC" },
  { value: "ETH/USDT" as ChartSymbol, label: "ETH" },
  { value: "SOL/USDT" as ChartSymbol, label: "SOL" },
];

const SuperchartsWidget = () => {
  const [symbol, setSymbol] = useState<ChartSymbol>("BTC/USDT");

  return (
    <Card className="overflow-hidden card-premium border-none">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-panel-border bg-panel-header">
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

        <Link to="/advanced-trading" aria-label="Open full trading terminal">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Chart — real TradingView widget */}
      <TradingViewChart
        height={280}
        showToolbar={false}
        symbol={symbol}
        defaultTimeframe="1h"
      />
    </Card>
  );
};

export default SuperchartsWidget;
