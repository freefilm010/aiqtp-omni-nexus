import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { scanArbitrage, type ArbOpportunity, type ExchangeConfig } from "@/lib/exchange/arbitrageEngine";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Real public tickers — no keys required, no synthetic prices. */
async function loadVenues(): Promise<ExchangeConfig[]> {
  const venues: ExchangeConfig[] = [];

  const tasks: { name: string; feePct: number; latencyMs: number; run: () => Promise<number> }[] = [
    {
      name: "Binance",
      feePct: 0.001,
      latencyMs: 25,
      run: async () => {
        const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
        return Number((await r.json()).price);
      },
    },
    {
      name: "Kraken",
      feePct: 0.0016,
      latencyMs: 60,
      run: async () => {
        const r = await fetch("https://api.kraken.com/0/public/Ticker?pair=XBTUSDT");
        const j = await r.json();
        const k = Object.keys(j.result)[0];
        return Number(j.result[k].c[0]);
      },
    },
    {
      name: "Coinbase",
      feePct: 0.006,
      latencyMs: 45,
      run: async () => {
        const r = await fetch("https://api.exchange.coinbase.com/products/BTC-USDT/ticker");
        return Number((await r.json()).price);
      },
    },
    {
      name: "Bitstamp",
      feePct: 0.004,
      latencyMs: 70,
      run: async () => {
        const r = await fetch("https://www.bitstamp.net/api/v2/ticker/btcusdt/");
        return Number((await r.json()).last);
      },
    },
  ];

  await Promise.all(
    tasks.map(async (t) => {
      try {
        const price = await t.run();
        if (Number.isFinite(price) && price > 0) {
          venues.push({ name: t.name, feePct: t.feePct, latencyMs: t.latencyMs, price, liquidityDepth: 0.5 });
        }
      } catch {
        /* venue unreachable from browser — omitted rather than faked */
      }
    }),
  );

  return venues;
}

const ArbitrageScannerPanel = () => {
  const [venues, setVenues] = useState<ExchangeConfig[]>([]);
  const [opps, setOpps] = useState<ArbOpportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const scan = async () => {
    setLoading(true);
    const v = await loadVenues();
    setVenues(v);
    setOpps(scanArbitrage(v, 0));
    setLoading(false);
  };

  useEffect(() => {
    void scan();
    const id = setInterval(scan, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Cross-Exchange Arbitrage</CardTitle>
            <CardDescription className="text-xs">
              BTC/USDT across live public venues · fee- and latency-aware net edge.
            </CardDescription>
          </div>
          <Button size="sm" variant="ghost" onClick={scan} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading && !venues.length ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Polling venues…
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {venues.map((v) => (
                <Badge key={v.name} variant="outline" className="text-[10px] font-mono">
                  {v.name} ${v.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </Badge>
              ))}
              {venues.length < 2 && (
                <span className="text-[10px] text-muted-foreground">
                  Need 2+ reachable venues to compute an edge.
                </span>
              )}
            </div>
            {opps.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No fee-positive edge right now — spreads are inside execution cost.
              </p>
            ) : (
              opps.map((o, i) => (
                <div key={i} className="flex items-center justify-between border-b border-border/50 py-1.5">
                  <span className="text-xs font-mono">
                    buy {o.buyVenue} → sell {o.sellVenue}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    net ${o.netEdge.toFixed(2)} · ${o.estimatedProfitUsd.toFixed(2)} @ {o.maxSize} BTC ·{" "}
                    {o.latencyRisk}ms
                  </span>
                </div>
              ))
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ArbitrageScannerPanel;
