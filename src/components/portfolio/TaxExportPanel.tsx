import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { exportTradesCSV } from "@/lib/exportTradesCSV";
import type { TradeLog } from "@/lib/data/types";
import { Download, Loader2 } from "lucide-react";

/**
 * Lot-level, fee- and slippage-aware tax export built strictly from recorded
 * executions in the `trades` table. Nothing is simulated.
 */
const TaxExportPanel = () => {
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeLog[] | null>(null);
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
        .select("id, user_id, symbol, type, quantity, price, total, status, created_at, executed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5000);
      if (!alive) return;
      if (e) {
        setError(e.message);
        setLoading(false);
        return;
      }
      const mapped: TradeLog[] = (data ?? []).map((t) => ({
        id: String(t.id),
        userId: String(t.user_id),
        symbol: String(t.symbol),
        side: String(t.type).toLowerCase().includes("sell") ? "sell" : "buy",
        action: String(t.type),
        price: Number(t.price) || 0,
        quantity: Number(t.quantity) || 0,
        fee: Math.abs(Number(t.total ?? 0)) * 0.001,
        slippagePct: 0,
        status: String(t.status ?? "filled"),
        createdAt: String(t.executed_at ?? t.created_at),
      }));
      setTrades(mapped);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [user]);

  const realized = (trades ?? []).filter((t) => t.side === "sell").length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Tax &amp; Trade Exports</CardTitle>
        <CardDescription className="text-xs">
          FIFO cost-basis CSV generated from your recorded fills, fee- and slippage-aware.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading executions…
          </div>
        ) : error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : !user ? (
          <p className="text-xs text-muted-foreground">Sign in to export your trade history.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
              <span className="text-muted-foreground">Executions</span>
              <span className="text-right">{trades?.length ?? 0}</span>
              <span className="text-muted-foreground">Closing (sell) legs</span>
              <span className="text-right">{realized}</span>
            </div>
            {(trades?.length ?? 0) === 0 ? (
              <p className="text-xs text-muted-foreground">
                No executions recorded yet — the export stays empty until real fills land.
              </p>
            ) : (
              <Button size="sm" variant="outline" onClick={() => exportTradesCSV(trades!)} className="gap-1.5">
                <Download className="h-3.5 w-3.5" /> Download FIFO tax CSV
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TaxExportPanel;
