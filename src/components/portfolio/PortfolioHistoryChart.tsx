/**
 * PortfolioHistoryChart — time-series net worth visualization.
 */
import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePortfolioHistory } from "@/hooks/usePortfolioHistory";
import { LoadingSkeleton, EmptyState } from "@/components/ui/data-states";
import { TrendingUp } from "lucide-react";

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatValue = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
};

export default function PortfolioHistoryChart() {
  const { data: snapshots = [], isLoading } = usePortfolioHistory(30);

  const chartData = useMemo(
    () => snapshots.map((s) => ({ date: formatDate(s.createdAt), value: s.netWorth })),
    [snapshots]
  );

  if (isLoading) return <LoadingSkeleton rows={3} />;

  if (chartData.length < 2) {
    return (
      <EmptyState
        title="Not enough history"
        description="Portfolio snapshots are recorded every 5 minutes. Check back soon for your net worth chart."
        icon={<TrendingUp className="h-10 w-10" />}
      />
    );
  }

  const first = chartData[0].value;
  const last = chartData[chartData.length - 1].value;
  const change = last - first;
  const changePercent = first > 0 ? (change / first) * 100 : 0;
  const isUp = change >= 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Portfolio History (30d)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {formatValue(last)}{" "}
          <span className={isUp ? "text-primary" : "text-destructive"}>
            {isUp ? "+" : ""}
            {formatValue(change)} ({changePercent.toFixed(1)}%)
          </span>
        </p>
      </CardHeader>
      <CardContent className="p-2">
        <div className="w-full h-48">
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatValue}
                width={50}
              />
              <Tooltip
                formatter={(val: number) => [formatValue(val), "Net Worth"]}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
