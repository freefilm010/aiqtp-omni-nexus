/**
 * AdvancedTradingChart — wraps the professional TradingViewChart
 * with symbol selector for the Advanced Trading page.
 */
import { useState } from "react";
import TradingViewChart from "./TradingViewChart";

type SymbolValue = "BTC/USDT" | "ETH/USDT" | "SOL/USDT" | "BNB/USDT" | "XRP/USDT" | "ADA/USDT" | "DOGE/USDT" | "AVAX/USDT";
type TimeframeValue = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";

interface AdvancedChartProps {
  symbol?: string;
  basePrice?: number;
}

const AdvancedTradingChart = ({ symbol = "BTC/USDT" }: AdvancedChartProps) => {
  const [sym, setSym] = useState<SymbolValue>(symbol as SymbolValue);
  const [tf, setTf] = useState<TimeframeValue>("15m");

  return (
    <TradingViewChart
      height={580}
      symbol={sym}
      timeframe={tf}
      onSymbolChange={setSym}
      onTimeframeChange={setTf}
      pollMs={30_000}
    />
  );
};

export default AdvancedTradingChart;
