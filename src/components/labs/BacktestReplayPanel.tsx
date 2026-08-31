import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { runBacktest, type BacktestResult, type BacktestTrade } from "@/lib/backtest/replayEngine";
import { Loader2 } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const BacktestReplayPanel = () => {
  const { user } = useAuth();
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let alive = true;
    (async () => {
      const { data, error: e } = await supabase
        .from("trades")
        .select("symbol, type, quantity, price, total, created_at, executed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(2000);
      if (!alive) return;
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      const trades: BacktestTrade[] = (data ?? []).map((t) => ({
        symbol: t.symbol,
        side: String(t.type).toLowerCase().includes("sell") ? "sell" : "buy",
        quantity: Number(t.quantity) || 0,
        price: Number(t.price) || 0,
        fee: Math.abs(Number(t.total ?? 0)) * 0.001,
        timestamp: String(t.executed_at ?? t.created_at),
      }));
      setCount(trades.length);
      setResult(trades.length ? runBacktest(trades, 10000) : null);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Backtest Replay</CardTitle>
        <CardDescription className="text-xs">
          Replays your recorded executions into an equity curve, drawdown and Sharpe. Real fills only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading executions…
          </div>
        ) : error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : !result ? (
          <p className="text-xs text-muted-foreground">
            {count === 0
              ? "No executions recorded yet — the replay stays empty until real trades land. Nothing is simulated here."
              : "Sign in to replay your executions."}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              <span className="text-muted-foreground">Trades</span>
              <span className="text-right">{result.tradeCount}</span>
              <span className="text-muted-foreground">Total return</span>
              <span className={`text-right ${result.totalReturn >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                {result.totalReturnPercent.toFixed(2)}%
              </span>
              <span className="text-muted-foreground">Max drawdown</span>
              <span className="text-right text-destructive">{result.maxDrawdownPercent.toFixed(2)}%</span>
              <span className="text-muted-foreground">Win rate</span>
              <span className="text-right">{result.winRate.toFixed(1)}%</span>
              <span className="text-muted-foreground">Sharpe</span>
              <span className="text-right">{result.sharpeRatio.toFixed(2)}</span>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={result.equityCurve}>
                  <XAxis dataKey="timestamp" hide />
                  <YAxis hide domain={["auto", "auto"]} />
                  <Tooltip
                    contentStyle={{ fontSize: 11 }}
                    formatter={(v: number) => [`$${v.toFixed(2)}`, "Equity"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BacktestReplayPanel;
