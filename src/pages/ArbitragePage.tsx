import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  TrendingUp,
  ArrowRight,
  Loader2,
  RefreshCw,
  Zap,
  DollarSign,
  BarChart3,
  Activity,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { renderApi } from "@/lib/render-api";

const REFRESH_INTERVAL_MS = 15_000;

type Opportunity = {
  pair: string;
  buy_exchange: string;
  sell_exchange: string;
  buy_price: number;
  sell_price: number;
  spread_pct: number;
  profit_per_1000: number;
  volume_24h?: number;
  confidence?: number;
};

// ---------- Skeleton ----------
const OpportunitySkeletonCard = () => (
  <Card className="animate-pulse">
    <CardContent className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-5 w-24 rounded bg-muted" />
        <div className="h-5 w-16 rounded bg-muted" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-4 w-20 rounded bg-muted" />
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-4 w-20 rounded bg-muted" />
      </div>
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="h-8 w-20 rounded bg-muted" />
      </div>
    </CardContent>
  </Card>
);

// ---------- Opportunity Card ----------
type OpportunityCardProps = {
  opp: Opportunity;
  amount: number;
  onExecute: (opp: Opportunity) => void;
  executing: boolean;
};

const OpportunityCard = ({ opp, amount, onExecute, executing }: OpportunityCardProps) => {
  const isProfitable = opp.spread_pct >= 0.3;
  const profitForAmount = (opp.profit_per_1000 / 1000) * amount;

  return (
    <Card
      className={`transition-all hover:shadow-md hover:shadow-primary/10 border ${
        isProfitable ? "border-green-500/30" : "border-border/50"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-base tracking-wide">{opp.pair}</span>
          <Badge
            variant={isProfitable ? "default" : "secondary"}
            className={isProfitable ? "bg-green-600/20 text-green-400 border-green-500/30" : ""}
          >
            {opp.spread_pct.toFixed(3)}% spread
          </Badge>
        </div>

        {/* Exchange route */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded">
            {opp.buy_exchange}
          </span>
          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium text-foreground bg-muted/40 px-2 py-0.5 rounded">
            {opp.sell_exchange}
          </span>
        </div>

        {/* Prices */}
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div>
            <span className="text-red-400">Buy</span> @ ${opp.buy_price.toFixed(4)}
          </div>
          <div>
            <span className="text-green-400">Sell</span> @ ${opp.sell_price.toFixed(4)}
          </div>
        </div>

        {/* Profit & Execute */}
        <div className="flex items-center justify-between pt-1">
          <div className="text-sm">
            <span className="text-muted-foreground">Profit / $1k: </span>
            <span className={`font-semibold ${isProfitable ? "text-green-400" : "text-muted-foreground"}`}>
              ${opp.profit_per_1000.toFixed(2)}
            </span>
            {amount !== 1000 && (
              <span className="ml-2 text-xs text-muted-foreground">
                (${profitForAmount.toFixed(2)} for ${amount})
              </span>
            )}
          </div>
          <Button
            size="sm"
            disabled={executing}
            onClick={() => onExecute(opp)}
            className={`gap-1.5 ${
              isProfitable
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            {executing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Zap className="h-3.5 w-3.5" />
            )}
            Execute
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ---------- Main Page ----------
export default function ArbitragePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [scanning, setScanning] = useState(false);
  const [executingPair, setExecutingPair] = useState<string | null>(null);
  const [amount, setAmount] = useState("100");
  const [lastScan, setLastScan] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scan = useCallback(async (silent = false) => {
    if (!silent) setScanning(true);
    setError(null);
    try {
      const data = await renderApi.arbitrage.scan(2);
      setOpportunities(Array.isArray(data) ? data : []);
      setLastScan(new Date());
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      if (!silent) toast.error("Scan failed", { description: msg });
    } finally {
      if (!silent) setScanning(false);
    }
  }, []);

  // Auto-scan on mount + interval
  useEffect(() => {
    scan(false);
    intervalRef.current = setInterval(() => scan(true), REFRESH_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [scan]);

  const handleExecute = async (opp: Opportunity) => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Enter a valid USDT amount");
      return;
    }
    setExecutingPair(opp.pair);
    try {
      const result = await renderApi.arbitrage.execute(
        opp.pair,
        opp.buy_exchange,
        opp.sell_exchange,
        amt
      );
      toast.success(`Trade executed: ${opp.pair}`, {
        description: result?.message ?? `${opp.buy_exchange} → ${opp.sell_exchange} for $${amt}`,
      });
    } catch (e: unknown) {
      toast.error("Execution failed", {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setExecutingPair(null);
    }
  };

  // Derived stats
  const totalOpps = opportunities.length;
  const bestSpread = totalOpps > 0 ? Math.max(...opportunities.map((o) => o.spread_pct)) : 0;
  const avgProfit =
    totalOpps > 0
      ? opportunities.reduce((sum, o) => sum + o.profit_per_1000, 0) / totalOpps
      : 0;
  const profitableOpps = opportunities.filter((o) => o.spread_pct >= 0.3);
  const amountNum = parseFloat(amount) || 100;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-6xl py-12 space-y-8">
        {/* Title */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <TrendingUp className="h-9 w-9 text-green-400" />
            Arbitrage Scanner
          </h1>
          <p className="text-muted-foreground">
            Real-time cross-exchange spread detection. Scans every 15 seconds.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Opportunities</p>
                <p className="text-2xl font-bold">{totalOpps}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-400 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Best Spread</p>
                <p className="text-2xl font-bold text-green-400">{bestSpread.toFixed(3)}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-amber-400 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg Profit / $1k</p>
                <p className="text-2xl font-bold text-amber-400">${avgProfit.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-blue-400 shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Profitable</p>
                <p className="text-2xl font-bold text-blue-400">{profitableOpps.length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-amber-400" />
              Trade Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2 w-48">
                <Label>Deploy Amount (USDT)</Label>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                />
                <div className="flex gap-2">
                  {["100", "500", "1000", "5000"].map((v) => (
                    <Button
                      key={v}
                      variant="outline"
                      size="sm"
                      className="text-xs px-2"
                      onClick={() => setAmount(v)}
                    >
                      ${v}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <Button
                  onClick={() => scan(false)}
                  disabled={scanning}
                  className="gap-2"
                >
                  {scanning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  {scanning ? "Scanning…" : "Scan Now"}
                </Button>
                {lastScan && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last scan: {lastScan.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error state */}
        {error && !scanning && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-medium">Scanner error</p>
              <p className="text-xs opacity-80">{error}</p>
            </div>
          </div>
        )}

        {/* Opportunities grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              Live Opportunities
              {profitableOpps.length > 0 && (
                <Badge className="ml-2 bg-green-600/20 text-green-400 border-green-500/30">
                  {profitableOpps.length} actionable
                </Badge>
              )}
            </h2>
            {scanning && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Refreshing…
              </div>
            )}
          </div>

          {scanning && opportunities.length === 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <OpportunitySkeletonCard key={i} />
              ))}
            </div>
          ) : opportunities.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">No opportunities detected</p>
                <p className="text-sm mt-1">
                  Markets may be tight right now. Auto-scanning every 15 seconds.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 gap-2"
                  onClick={() => scan(false)}
                  disabled={scanning}
                >
                  <RefreshCw className="h-4 w-4" />
                  Scan Now
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Sort: profitable first, then by spread desc */}
              {[...opportunities]
                .sort((a, b) => b.spread_pct - a.spread_pct)
                .map((opp) => (
                  <OpportunityCard
                    key={`${opp.pair}-${opp.buy_exchange}-${opp.sell_exchange}`}
                    opp={opp}
                    amount={amountNum}
                    onExecute={handleExecute}
                    executing={executingPair === opp.pair}
                  />
                ))}
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center">
          Arbitrage opportunities are indicative only. Execution involves network latency, fees, and
          slippage. Always verify before deploying capital.
        </p>
      </main>
      <Footer />
    </div>
  );
}
