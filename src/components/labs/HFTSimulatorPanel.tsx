import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  LATENCY_PROFILES,
  simulateHFTRoundTrip,
  type HFTSimResult,
  type QueuedOrder,
} from "@/lib/hft/hftSimulator";
import { Loader2, Gauge } from "lucide-react";

type Level = [number, number];

const HFTSimulatorPanel = () => {
  const [book, setBook] = useState<{ bids: Level[]; asks: Level[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [profileKey, setProfileKey] = useState(Object.keys(LATENCY_PROFILES)[0]);
  const [result, setResult] = useState<HFTSimResult | null>(null);

  const loadBook = async () => {
    try {
      const r = await fetch("https://api.binance.com/api/v3/depth?symbol=BTCUSDT&limit=20");
      if (!r.ok) throw new Error(`depth ${r.status}`);
      const j = await r.json();
      setBook({
        bids: (j.bids as string[][]).map((b) => [Number(b[0]), Number(b[1])] as Level),
        asks: (j.asks as string[][]).map((b) => [Number(b[0]), Number(b[1])] as Level),
      });
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  useEffect(() => {
    void loadBook();
    const id = setInterval(loadBook, 5000);
    return () => clearInterval(id);
  }, []);

  const run = () => {
    if (!book) return;
    const bestBid = book.bids[0][0];
    const existing: QueuedOrder[] = book.bids.slice(0, 10).map(([price, size], i) => ({
      id: `book-${i}`,
      price,
      size,
      side: "buy",
      timestamp: Date.now() - (10 - i) * 100,
      latencyMs: 0,
    }));
    // Liquidity per second estimated from the visible top-of-book depth.
    const liquidity = book.bids.slice(0, 5).reduce((s, [, sz]) => s + sz, 0);
    setResult(
      simulateHFTRoundTrip(
        LATENCY_PROFILES[profileKey],
        existing,
        { id: "ours", price: bestBid, size: 0.05, side: "buy", timestamp: Date.now() },
        Math.max(0.001, liquidity),
      ),
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">HFT Fill Simulator</CardTitle>
        <CardDescription className="text-xs">
          Queue position and fill probability against the live BTC/USDT order book.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : !book ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Streaming depth…
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-emerald-400">
                bid {book.bids[0][0].toLocaleString()} × {book.bids[0][1]}
              </span>
              <span className="text-destructive">
                ask {book.asks[0][0].toLocaleString()} × {book.asks[0][1]}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.keys(LATENCY_PROFILES).map((k) => (
                <Badge
                  key={k}
                  variant={k === profileKey ? "default" : "outline"}
                  className="text-[10px] cursor-pointer"
                  onClick={() => setProfileKey(k)}
                >
                  {k}
                </Badge>
              ))}
            </div>
            <Button size="sm" onClick={run}>
              <Gauge className="h-3.5 w-3.5 mr-1.5" /> Simulate 0.05 BTC passive bid
            </Button>
            {result && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] font-mono">
                <span className="text-muted-foreground">Order latency</span>
                <span className="text-right">{result.orderLatencyMs.toFixed(2)} ms</span>
                <span className="text-muted-foreground">Queue position</span>
                <span className="text-right">#{result.queuePosition}</span>
                <span className="text-muted-foreground">Fill probability</span>
                <span className="text-right">{(result.fillProbability * 100).toFixed(1)}%</span>
                <span className="text-muted-foreground">Expected fill</span>
                <span className="text-right">{result.expectedFillMs.toFixed(0)} ms</span>
                <span className="text-muted-foreground">Round trip</span>
                <span className="text-right">{result.roundTripMs.toFixed(2)} ms</span>
                <span className="text-muted-foreground">Outcome</span>
                <span className={`text-right ${result.wouldFill ? "text-emerald-400" : "text-destructive"}`}>
                  {result.wouldFill ? "FILLED" : "NO FILL"}
                </span>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default HFTSimulatorPanel;
