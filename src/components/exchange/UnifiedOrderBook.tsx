import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface BookLevel {
  price: number;
  amount: number;
  total: number;
  exchanges: { name: string; amount: number }[];
  cumulative: number;
}

interface UnifiedBook {
  bids: BookLevel[];
  asks: BookLevel[];
  spread: number;
  spreadPercent: number;
  midPrice: number;
}

interface VenueBook {
  bids: { price: number; amount: number }[];
  asks: { price: number; amount: number }[];
}

const VENUES = [
  { id: "hollaex", name: "Platform Venue" },
  { id: "binance", name: "Binance" },
  { id: "kraken", name: "Kraken" },
  { id: "coinbase", name: "Coinbase" },
];
const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT'];

/** Real venue order books — one call per venue, failed venues omitted, never faked. */
async function fetchVenueBooks(symbol: string): Promise<Record<string, VenueBook>> {
  const results = await Promise.allSettled(
    VENUES.map(async (v) => {
      const { data, error } = await supabase.functions.invoke("ccxt-trading", {
        body: { action: "fetch_order_book", symbol, exchange: v.id, limit: 50 },
      });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "book unavailable");
      return { venue: v.id, book: data.data as VenueBook };
    }),
  );
  const books: Record<string, VenueBook> = {};
  for (const r of results) {
    if (r.status === "fulfilled") books[r.value.venue] = r.value.book;
  }
  return books;
}


const UnifiedOrderBook = () => {
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [grouping, setGrouping] = useState("0.5");
  const [showExchangeBreakdown, setShowExchangeBreakdown] = useState(true);
  const [books, setBooks] = useState<Record<string, VenueBook>>({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const b = await fetchVenueBooks(selectedPair);
    setBooks(b);
    setLastUpdate(new Date());
    setLoading(false);
  }, [selectedPair]);

  useEffect(() => {
    void load();
    const interval = setInterval(load, 10_000);
    return () => clearInterval(interval);
  }, [load]);

  const book = useMemo(() => {
    const groupSize = Number(grouping) || 0.5;
    const buildSide = (side: "bids" | "asks"): BookLevel[] => {
      const buckets = new Map<number, { amount: number; exchanges: { name: string; amount: number }[] }>();
      for (const [venueId, vb] of Object.entries(books)) {
        const label = VENUES.find((v) => v.id === venueId)?.name ?? venueId;
        for (const row of (vb as any)[side] ?? []) {
          const price = Number(row.price);
          const amount = Number(row.amount);
          if (!Number.isFinite(price) || !Number.isFinite(amount) || price <= 0 || amount <= 0) continue;
          const bucketPrice = Math.round(price / groupSize) * groupSize;
          const existing = buckets.get(bucketPrice);
          if (existing) {
            existing.amount += amount;
            const ex = existing.exchanges.find((e) => e.name === label);
            if (ex) ex.amount += amount;
            else existing.exchanges.push({ name: label, amount });
          } else {
            buckets.set(bucketPrice, { amount, exchanges: [{ name: label, amount }] });
          }
        }
      }
      const levels = Array.from(buckets.entries())
        .map(([price, b]) => ({ price, amount: b.amount, exchanges: b.exchanges, total: price * b.amount, cumulative: 0 }))
        .sort((a, b) => (side === "bids" ? b.price - a.price : a.price - b.price));
      let cumulative = 0;
      for (const l of levels) {
        cumulative += l.amount;
        l.cumulative = cumulative;
      }
      return levels;
    };
    const bids = buildSide("bids");
    const asks = buildSide("asks");
    const bestBid = bids[0]?.price || 0;
    const bestAsk = asks[0]?.price || 0;
    return {
      bids,
      asks,
      spread: bestAsk > 0 && bestBid > 0 ? bestAsk - bestBid : 0,
      spreadPercent: bestBid > 0 && bestAsk > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0,
      midPrice: bestAsk > 0 && bestBid > 0 ? (bestBid + bestAsk) / 2 : bestBid || bestAsk,
    };
  }, [books, grouping]);

  const maxCumulative = Math.max(
    ...book.bids.map((b) => b.cumulative),
    ...book.asks.map((a) => a.cumulative),
    1,
  );

  const getDepthWidth = (cumulative: number) => (cumulative / maxCumulative) * 100;

  const activeVenues = Object.keys(books).length;

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Order Book */}
      <Card className="col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Unified Order Book
              </CardTitle>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pairs.map((pair) => (
                    <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="ghost" onClick={load} disabled={loading}>
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              </Button>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Show Sources</Label>
                <Switch checked={showExchangeBreakdown} onCheckedChange={setShowExchangeBreakdown} />
              </div>
              <Select value={grouping} onValueChange={setGrouping}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1</SelectItem>
                  <SelectItem value="0.5">0.5</SelectItem>
                  <SelectItem value="1">1.0</SelectItem>
                  <SelectItem value="5">5.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Spread indicator */}
          <div className="flex items-center justify-center py-2 bg-muted/30 border-y gap-2">
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Polling {VENUES.length} venues…</span>
              </>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">
                  {activeVenues > 0 ? `${activeVenues} live venue${activeVenues === 1 ? "" : "s"}` : "No venue books reachable"}
                  {lastUpdate ? ` · ${lastUpdate.toLocaleTimeString()}` : ""}
                </span>
                {activeVenues > 0 && (
                  <>
                    <span className="text-sm text-muted-foreground">Spread:</span>
                    <span className="font-mono font-medium">${book.spread.toFixed(2)}</span>
                    <Badge variant="outline">{book.spreadPercent.toFixed(4)}%</Badge>
                  </>
                )}
              </>
            )}
          </div>

          {activeVenues === 0 && !loading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No venue order books are reachable right now. Nothing is simulated — retry when a venue responds.
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x">
              {/* Bids */}
              <div>
                <div className="grid grid-cols-4 text-xs text-muted-foreground px-4 py-2 bg-green-500/5">
                  <span>Price (USDT)</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Total</span>
                  <span className="text-right">Depth</span>
                </div>
                <ScrollArea className="h-[400px]">
                  {book.bids.map((level, i) => (
                    <div key={i} className="relative">
                      <div
                        className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                        style={{ width: `${getDepthWidth(level.cumulative)}%` }}
                      />
                      <div className="relative grid grid-cols-4 px-4 py-2 hover:bg-green-500/5">
                        <span className="font-mono text-green-500">
                          ${level.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-right font-mono">
                          {level.amount.toFixed(4)}
                        </span>
                        <span className="text-right font-mono text-muted-foreground">
                          ${level.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <div className="text-right">
                          {showExchangeBreakdown && (
                            <div className="flex justify-end gap-0.5">
                              {level.exchanges.map((ex, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] px-1 rounded bg-green-500/20 text-green-500"
                                  title={`${ex.name}: ${ex.amount.toFixed(4)}`}
                                >
                                  {ex.name.slice(0, 2)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Asks */}
              <div>
                <div className="grid grid-cols-4 text-xs text-muted-foreground px-4 py-2 bg-red-500/5">
                  <span>Price (USDT)</span>
                  <span className="text-right">Amount</span>
                  <span className="text-right">Total</span>
                  <span className="text-right">Depth</span>
                </div>
                <ScrollArea className="h-[400px]">
                  {book.asks.map((level, i) => (
                    <div key={i} className="relative">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-red-500/10"
                        style={{ width: `${getDepthWidth(level.cumulative)}%` }}
                      />
                      <div className="relative grid grid-cols-4 px-4 py-2 hover:bg-red-500/5">
                        <span className="font-mono text-red-500">
                          ${level.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-right font-mono">
                          {level.amount.toFixed(4)}
                        </span>
                        <span className="text-right font-mono text-muted-foreground">
                          ${level.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                        <div className="text-right">
                          {showExchangeBreakdown && (
                            <div className="flex justify-end gap-0.5">
                              {level.exchanges.map((ex, j) => (
                                <span
                                  key={j}
                                  className="text-[10px] px-1 rounded bg-red-500/20 text-red-500"
                                  title={`${ex.name}: ${ex.amount.toFixed(4)}`}
                                >
                                  {ex.name.slice(0, 2)}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Venue breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Venue Sources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {VENUES.map((v) => {
            const vb = books[v.id];
            return (
              <div key={v.id} className="flex items-center justify-between border-b border-border/50 py-2">
                <span className="text-xs font-mono">{v.name}</span>
                {vb ? (
                  <Badge variant="outline" className="text-[10px] font-mono text-emerald-400">
                    live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] text-muted-foreground">
                    unreachable
                  </Badge>
                )}
              </div>
            );
          })}
          <p className="text-[10px] text-muted-foreground pt-2">
            All levels come directly from each venue's public book. Nothing is simulated.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UnifiedOrderBook;
