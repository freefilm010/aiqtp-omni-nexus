import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Loader2 } from "lucide-react";

interface Level {
  price: number;
  size: number;
}

interface Row extends Level {
  total: number;
  percentage: number;
}

interface OrderBookProps {
  symbol?: string;
  levels?: number;
}

const buildRows = (levels: Level[]): Row[] => {
  let running = 0;
  const withTotals = levels.map((l) => {
    running += l.size;
    return { ...l, total: running };
  });
  const max = running || 1;
  return withTotals.map((r) => ({ ...r, percentage: (r.total / max) * 100 }));
};

const fmt = (n: number, d = 2) =>
  n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });

/**
 * Live L2 order book sourced from real exchange depth (Binance, Kraken fallback)
 * through the backend ccxt-trading function. No synthetic levels.
 */
const OrderBook = ({ symbol = "BTC/USDT", levels = 15 }: OrderBookProps) => {
  const [book, setBook] = useState<{ bids: Level[]; asks: Level[]; source: string; timestamp: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error: fnError } = await supabase.functions.invoke("ccxt-trading", {
        body: { action: "fetch_order_book", exchange: "binance", symbol, limit: levels },
      });
      if (!alive) return;
      if (fnError || !data?.success) {
        setError(fnError?.message || data?.error || "Order book unavailable");
        setLoading(false);
        return;
      }
      setBook(data.data);
      setError(null);
      setLoading(false);
    };
    load();
    const id = setInterval(load, 2000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [symbol, levels]);

  const bids = useMemo(() => buildRows(book?.bids ?? []), [book]);
  const asks = useMemo(() => buildRows(book?.asks ?? []), [book]);

  const bestBid = bids[0]?.price ?? 0;
  const bestAsk = asks[0]?.price ?? 0;
  const spread = bestAsk && bestBid ? bestAsk - bestBid : 0;
  const spreadPct = bestBid ? (spread / bestBid) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Order Book · {symbol}
        </CardTitle>
        {book && (
          <Badge variant="outline" className="text-[10px] font-mono uppercase">
            {book.source}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-6">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading live depth…
          </div>
        ) : error ? (
          <p className="text-xs text-destructive py-4">{error}</p>
        ) : (
          <>
            <ScrollArea className="h-[220px] pr-2">
              <div className="space-y-0.5">
                {[...asks].reverse().map((a, i) => (
                  <div key={`a${i}`} className="relative grid grid-cols-3 text-[11px] font-mono py-0.5">
                    <div
                      className="absolute inset-y-0 right-0 bg-destructive/10"
                      style={{ width: `${a.percentage}%` }}
                    />
                    <span className="relative text-destructive">{fmt(a.price)}</span>
                    <span className="relative text-right">{fmt(a.size, 4)}</span>
                    <span className="relative text-right text-muted-foreground">{fmt(a.total, 3)}</span>
                  </div>
                ))}
              </div>
              <div className="my-2 flex items-center justify-between border-y border-border/60 py-1.5 text-[11px] font-mono">
                <span className="text-muted-foreground">Spread</span>
                <span>
                  {fmt(spread)} ({spreadPct.toFixed(3)}%)
                </span>
              </div>
              <div className="space-y-0.5">
                {bids.map((b, i) => (
                  <div key={`b${i}`} className="relative grid grid-cols-3 text-[11px] font-mono py-0.5">
                    <div
                      className="absolute inset-y-0 right-0 bg-primary/10"
                      style={{ width: `${b.percentage}%` }}
                    />
                    <span className="relative text-primary">{fmt(b.price)}</span>
                    <span className="relative text-right">{fmt(b.size, 4)}</span>
                    <span className="relative text-right text-muted-foreground">{fmt(b.total, 3)}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Live L2 depth · refreshed every 2s · {new Date(book?.timestamp ?? Date.now()).toLocaleTimeString()}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderBook;
