import { useState } from "react";
import TradingViewChart from "./TradingViewChart";

const AdvancedCharts = () => {
  const [symbol, setSymbol] = useState<"BTC/USDT" | "ETH/USDT" | "SOL/USDT" | "BNB/USDT" | "XRP/USDT" | "ADA/USDT" | "DOGE/USDT" | "AVAX/USDT">(
    "BTC/USDT"
  );
  const [timeframe, setTimeframe] = useState<"1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w">("1h");

  return (
    <div className="space-y-4">
      <TradingViewChart
        height={580}
        symbol={symbol}
        timeframe={timeframe}
        onSymbolChange={setSymbol}
        onTimeframeChange={setTimeframe}
      />
    </div>
  );
};

export default AdvancedCharts;
