import { useState } from "react";
import TradingViewChart from "./TradingViewChart";

type SymbolValue = "BTC/USDT" | "ETH/USDT" | "SOL/USDT" | "BNB/USDT" | "XRP/USDT" | "ADA/USDT" | "DOGE/USDT" | "AVAX/USDT";
type TimeframeValue = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

const AdvancedCharts = () => {
  const [symbol, setSymbol] = useState<SymbolValue>("BTC/USDT");
  const [timeframe, setTimeframe] = useState<TimeframeValue>("1h");

  return (
    <div className="space-y-4">
      <TradingViewChart
        height={620}
        symbol={symbol}
        timeframe={timeframe}
        onSymbolChange={setSymbol}
        onTimeframeChange={setTimeframe}
        pollMs={30_000}
      />
    </div>
  );
};

export default AdvancedCharts;
