import { LineChart, Line, ResponsiveContainer } from "recharts";
import { usePriceHistory } from "@/hooks/usePriceHistory";

interface SparklineProps {
  symbol: string;
  className?: string;
}

export default function Sparkline({ symbol, className = "w-20 h-8" }: SparklineProps) {
  const { data = [], isLoading } = usePriceHistory(symbol);

  if (isLoading || data.length < 2) {
    return <div className={`${className} bg-muted/30 rounded animate-pulse`} />;
  }

  const first = data[0].price_usd;
  const last = data[data.length - 1].price_usd;
  const color = last >= first ? "hsl(var(--chart-2))" : "hsl(var(--destructive))";

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="price_usd"
            stroke={color}
            dot={false}
            strokeWidth={1.5}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
