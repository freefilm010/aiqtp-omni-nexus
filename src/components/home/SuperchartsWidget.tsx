import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import TradingViewChart from "@/components/trading/TradingViewChart";
import { Activity, BarChart3, Maximize2, RadioTower, RefreshCw, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { useMarketPrices, type MarketPrice } from "@/hooks/useMarketPrices";

type ChartSymbol =
  | "BTC/USDT"
  | "ETH/USDT"
  | "SOL/USDT"
  | "BNB/USDT"
  | "XRP/USDT"
  | "ADA/USDT"
  | "DOGE/USDT"
  | "AVAX/USDT";

const SYMBOLS: Array<{ value: ChartSymbol; label: string; name: string }> = [
  { value: "BTC/USDT", label: "BTC", name: "Bitcoin" },
  { value: "ETH/USDT", label: "ETH", name: "Ethereum" },
  { value: "SOL/USDT", label: "SOL", name: "Solana" },
  { value: "BNB/USDT", label: "BNB", name: "BNB" },
  { value: "XRP/USDT", label: "XRP", name: "XRP" },
  { value: "ADA/USDT", label: "ADA", name: "Cardano" },
  { value: "DOGE/USDT", label: "DOGE", name: "Dogecoin" },
  { value: "AVAX/USDT", label: "AVAX", name: "Avalanche" },
];

const formatCurrency = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1_000) return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(8)}`;
};

const formatCompactUsd = (value?: number) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(0)}`;
};

const normalizeSymbol = (symbol: ChartSymbol) => symbol.split("/")[0];

const uniquePrices = (prices: MarketPrice[]) => {
  const seen = new Set<string>();
  return prices.filter((price) => {
    if (!price?.symbol || price.symbol.includes("/") || seen.has(price.symbol)) return false;
    seen.add(price.symbol);
    return true;
  });
};

const SuperchartsWidget = () => {
  const [symbol, setSymbol] = useState<ChartSymbol>("BTC/USDT");
  const { getPrice, getAllPrices, isPolling, loading, lastSyncError, refresh } = useMarketPrices(10_000);

  const selectedSymbol = normalizeSymbol(symbol);
  const selectedPrice = getPrice(selectedSymbol);

  const marketRows = useMemo(
    () =>
      uniquePrices(getAllPrices())
        .filter((price) => price.priceNumeric > 0)
        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
        .slice(0, 10),
    [getAllPrices]
  );

  const marketStats = useMemo(() => {
    const rows = uniquePrices(getAllPrices()).filter((price) => price.priceNumeric > 0);
    const advancing = rows.filter((price) => price.changePercent >= 0).length;
    const declining = Math.max(rows.length - advancing, 0);
    const volume = rows.reduce((sum, price) => sum + (Number(price.volumeNumeric) || 0), 0);
    const marketCap = rows.reduce((sum, price) => sum + (Number(price.marketCap) || 0), 0);
    const newestUpdate = rows.reduce((newest, price) => {
      const ts = price.lastUpdate ? new Date(price.lastUpdate).getTime() : 0;
      return Math.max(newest, ts);
    }, 0);
    const ageMs = newestUpdate ? Date.now() - newestUpdate : Number.POSITIVE_INFINITY;
    return { advancing, declining, volume, marketCap, ageMs, count: rows.length };
  }, [getAllPrices]);

  const isRealTime = isPolling && marketStats.ageMs <= 5_000;
  const selectedChange = selectedPrice?.changePercent ?? 0;
  const selectedDirection = selectedChange >= 0 ? "up" : "down";

  return (
    <Card className="overflow-hidden border-panel-border bg-panel shadow-card">
      <div className="border-b border-panel-border bg-panel-header">
        <div className="flex flex-col gap-3 px-3 py-3 md:px-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center border border-panel-border bg-secondary">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h3 className="font-mono text-sm font-bold uppercase tracking-normal text-foreground md:text-base">
                    Institutional Market Terminal
                  </h3>
                  <span className="inline-flex items-center gap-1 border border-panel-border bg-secondary px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                    <RadioTower className="h-3 w-3" />
                    {isRealTime ? "Live <5s" : loading ? "Syncing" : "Awaiting fresh tick"}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Real exchange charting + backend market feed. No synthetic candles. No paper values.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 border border-panel-border"
                onClick={() => void refresh()}
                aria-label="Refresh market prices"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Link to="/advanced-trading" aria-label="Open full trading terminal">
                <Button variant="ghost" size="icon" className="h-8 w-8 border border-panel-border">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <div className="border border-panel-border bg-secondary/60 px-3 py-2">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">24h Volume</div>
              <div className="font-mono text-sm font-semibold text-foreground">{formatCompactUsd(marketStats.volume)}</div>
            </div>
            <div className="border border-panel-border bg-secondary/60 px-3 py-2">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">Tracked Cap</div>
              <div className="font-mono text-sm font-semibold text-foreground">{formatCompactUsd(marketStats.marketCap)}</div>
            </div>
            <div className="border border-panel-border bg-secondary/60 px-3 py-2">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">Breadth</div>
              <div className="font-mono text-sm font-semibold text-foreground">{marketStats.advancing}↑ / {marketStats.declining}↓</div>
            </div>
            <div className="border border-panel-border bg-secondary/60 px-3 py-2">
              <div className="font-mono text-[10px] uppercase text-muted-foreground">Coverage</div>
              <div className="font-mono text-sm font-semibold text-foreground">{marketStats.count || "—"} live assets</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid min-h-[620px] grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 border-panel-border xl:border-r">
          <div className="flex flex-col gap-3 border-b border-panel-border bg-secondary/30 px-3 py-3 md:flex-row md:items-center md:justify-between md:px-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-foreground md:text-3xl">{selectedSymbol}</span>
                <span className="font-mono text-xs uppercase text-muted-foreground">{SYMBOLS.find((item) => item.value === symbol)?.name}</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
                <span className="text-lg font-semibold text-foreground">{formatCurrency(selectedPrice?.priceNumeric)}</span>
                <span className={selectedDirection === "up" ? "text-success" : "text-destructive"}>
                  {selectedDirection === "up" ? "+" : ""}{selectedChange.toFixed(2)}%
                </span>
                <span className="text-muted-foreground">Vol {selectedPrice?.volume ?? "—"}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:justify-end">
              {SYMBOLS.map((item) => {
                const price = getPrice(normalizeSymbol(item.value));
                const active = symbol === item.value;
                const positive = (price?.changePercent ?? 0) >= 0;
                return (
                  <button
                    key={item.value}
                    onClick={() => setSymbol(item.value)}
                    className={
                      "min-h-12 border px-2 py-1 text-left font-mono transition-smooth " +
                      (active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-panel-border bg-panel hover:border-primary/70 hover:bg-secondary")
                    }
                  >
                    <span className="block text-[11px] font-bold">{item.label}</span>
                    <span className={"block text-[10px] " + (active ? "text-primary-foreground" : positive ? "text-success" : "text-destructive")}>
                      {price ? `${positive ? "+" : ""}${price.changePercent.toFixed(2)}%` : "—"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <TradingViewChart height={500} showToolbar symbol={symbol} defaultTimeframe="1h" />
        </div>

        <aside className="flex min-h-0 flex-col bg-panel-header">
          <div className="border-b border-panel-border px-3 py-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-xs font-bold uppercase text-foreground">Live Market Matrix</h4>
              <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-success" />
                Honest feed
              </span>
            </div>
            {lastSyncError ? <p className="mt-1 font-mono text-[10px] text-warning">{lastSyncError}</p> : null}
          </div>

          <div className="grid grid-cols-[1fr_auto_auto] border-b border-panel-border px-3 py-2 font-mono text-[10px] uppercase text-muted-foreground">
            <span>Asset</span>
            <span>Price</span>
            <span className="pl-3 text-right">24h</span>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {marketRows.length > 0 ? (
              marketRows.map((row) => {
                const positive = row.changePercent >= 0;
                return (
                  <button
                    key={row.symbol}
                    className="grid w-full grid-cols-[1fr_auto_auto] items-center gap-2 border-b border-panel-border px-3 py-2 text-left font-mono transition-smooth hover:bg-secondary/80"
                    onClick={() => {
                      const next = SYMBOLS.find((item) => normalizeSymbol(item.value) === row.symbol)?.value;
                      if (next) setSymbol(next);
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-bold text-foreground">{row.symbol}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{row.name}</span>
                    </span>
                    <span className="text-xs text-foreground">{formatCurrency(row.priceNumeric)}</span>
                    <span className={"flex items-center justify-end gap-1 pl-2 text-xs " + (positive ? "text-success" : "text-destructive")}>
                      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {positive ? "+" : ""}{row.changePercent.toFixed(2)}%
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex h-full min-h-48 items-center justify-center px-4 text-center font-mono text-xs text-muted-foreground">
                Waiting for the live market feed. Nothing synthetic is displayed.
              </div>
            )}
          </div>

          <div className="border-t border-panel-border px-3 py-3">
            <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase text-muted-foreground">
              <span>Real-time breadth</span>
              <span>{marketStats.count ? `${Math.round((marketStats.advancing / marketStats.count) * 100)}% bid` : "—"}</span>
            </div>
            <div className="grid h-3 grid-cols-12 overflow-hidden border border-panel-border bg-secondary">
              {Array.from({ length: 12 }).map((_, index) => {
                const threshold = marketStats.count ? (marketStats.advancing / marketStats.count) * 12 : 0;
                return <span key={index} className={index < threshold ? "bg-success" : "bg-destructive"} />;
              })}
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
              <Activity className="h-3 w-3 text-primary" />
              Data age: {Number.isFinite(marketStats.ageMs) ? `${Math.max(0, Math.round(marketStats.ageMs / 1000))}s` : "—"}
            </div>
          </div>
        </aside>
      </div>
    </Card>
  );
};

export default SuperchartsWidget;
