import TradingViewChart from "./TradingViewChart";

interface AdvancedChartProps {
  symbol?: string;
  basePrice?: number;
}

const AdvancedTradingChart = ({ symbol = "BTC/USDT" }: AdvancedChartProps) => {
  return (
    <TradingViewChart
      height={580}
      symbol={symbol as "BTC/USDT"}
    />
  );
};

export default AdvancedTradingChart;
