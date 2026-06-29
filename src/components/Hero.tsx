import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Globe, Bot, TrendingUp, ChevronDown, Wifi, BarChart2, Crosshair, Minus, Square, Circle, PenTool, Search, FileCode, FlaskConical, Terminal, Cpu, LineChart, Rocket } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

const QuickStartStrategy = lazy(() => import("@/components/strategy/QuickStartStrategy"));
import { useKrakenTickers } from "@/hooks/useKrakenTickers";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { supabase } from "@/integrations/supabase/client";

const LiveTicker = ({ tickers }: { tickers: Record<string, any> }) => {
  const symbols = Object.keys(tickers).length > 0
    ? Object.entries(tickers)
        .sort((a, b) => (b[1].marketCap || 0) - (a[1].marketCap || 0))
        .map(([s]) => s)
    : [];

  const prices = symbols.map((s) => {
    const t = tickers[s];
    const change = t?.priceChangePercent ?? 0;
    const positive = change >= 0;
    return {
      symbol: s.replace("/USDT", "USD"),
      price: t?.lastPrice ?? 0,
      change,
      positive,
      ready: Boolean(t),
    };
  });

  return (
    <div className="absolute top-0 left-0 right-0 h-7 overflow-hidden border-b border-[hsl(222,14%,17%)] bg-[hsl(223,18%,9%)] z-20">
      <div className="flex h-full animate-ticker whitespace-nowrap">
        {[...prices, ...prices].map((ticker, i) => (
          <div key={i} className="flex h-full items-center gap-2 border-r border-[hsl(222,14%,17%)] px-3">
            <span className="font-mono text-[11px] font-medium text-foreground/90">{ticker.symbol}</span>
            <span className={`font-mono text-[11px] font-semibold ${ticker.positive ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
              {ticker.ready
                ? ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : "—"}
            </span>
            <span className={`font-mono text-[10px] ${ticker.positive ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
              {ticker.ready ? `${ticker.positive ? '+' : ''}${ticker.change.toFixed(2)}%` : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LeftToolbar = () => (
  <div className="absolute left-0 top-7 bottom-9 z-20 flex w-11 flex-col items-center gap-1 border-r border-[hsl(222,14%,17%)] bg-[hsl(223,18%,9%)] py-2">
    <button aria-label="Crosshair cursor tool" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <Crosshair className="w-4 h-4" />
    </button>
    <button aria-label="Trend line tool" className="flex h-8 w-8 items-center justify-center rounded bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)]">
      <Minus className="w-4 h-4" />
    </button>
    <button aria-label="Trend channel tool" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <TrendingUp className="w-4 h-4" />
    </button>
    <button aria-label="Rectangle annotation tool" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <Square className="w-4 h-4" />
    </button>
    <button aria-label="Ellipse annotation tool" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <Circle className="w-4 h-4" />
    </button>
    <button aria-label="Freehand drawing tool" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <PenTool className="w-4 h-4" />
    </button>
    <div className="flex-1" />
    <button aria-label="Switch to bar chart" className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <BarChart2 className="w-4 h-4" />
    </button>
  </div>
);

type LiveCandle = { o: number; h: number; l: number; c: number; v: number };

const formatPrice = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (value >= 1) return value.toFixed(2);
  if (value >= 0.01) return value.toFixed(4);
  return value.toFixed(8);
};

const MiniChartPanel = ({
  symbol,
  pair,
  timeframe,
  venue,
  featured = false,
}: {
  symbol: string;
  pair: string;
  timeframe: "1h" | "4h" | "1d";
  venue: string;
  featured?: boolean;
}) => {
  const { getPrice } = useMarketPrices(30_000);
  const live = getPrice(symbol);
  const [candles, setCandles] = useState<LiveCandle[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const { data } = await supabase.functions.invoke("ccxt-trading", {
        body: {
          action: "fetch_ohlcv",
          exchange: "binance",
          symbol: pair,
          timeframe,
          limit: 24,
        },
      });
      if (cancelled || !data?.success || !Array.isArray(data?.data)) return;
      const rows: LiveCandle[] = (data.data as any[])
        .map((row) => ({
          o: Number(row.open),
          h: Number(row.high),
          l: Number(row.low),
          c: Number(row.close),
          v: Number(row.quoteVolume ?? row.volume ?? 0),
        }))
        .filter((c) => [c.o, c.h, c.l, c.c].every((v) => Number.isFinite(v) && v > 0));
      setCandles(rows.slice(-12));
    };
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [pair, timeframe]);

  const lastCandle = candles[candles.length - 1];
  const firstCandle = candles[0];
  const livePrice = live?.priceNumeric ?? lastCandle?.c ?? 0;
  const changePct = live?.changePercent ?? (firstCandle && lastCandle ? ((lastCandle.c - firstCandle.o) / firstCandle.o) * 100 : 0);
  const positive = changePct >= 0;
  const changeAbs = firstCandle && lastCandle ? lastCandle.c - firstCandle.o : 0;
  const high = candles.length ? Math.max(...candles.map((c) => c.h)) : 0;
  const low = candles.length ? Math.min(...candles.map((c) => c.l)) : 0;
  const open = firstCandle?.o ?? 0;
  const maxVol = Math.max(1, ...candles.map((c) => c.v));
  const priceMin = candles.length ? Math.min(...candles.map((c) => c.l)) : 0;
  const priceMax = candles.length ? Math.max(...candles.map((c) => c.h)) : 1;
  const priceSpan = Math.max(priceMax - priceMin, 1e-9);
  const norm = (v: number) => 48 - ((v - priceMin) / priceSpan) * 44;
  const pricePath = candles.length
    ? candles
        .map((c, i) => `${i === 0 ? "M" : "L"} ${(i / Math.max(candles.length - 1, 1)) * 100} ${norm(c.c).toFixed(2)}`)
        .join(" ")
    : "";
  const change = `${positive ? "+" : ""}${changeAbs.toFixed(2)} (${positive ? "+" : ""}${changePct.toFixed(2)}%)`;
  const price = formatPrice(livePrice);
  const tfLabel = `${timeframe} · ${venue}`;

  return (
    <div className={`relative overflow-hidden group transition-all duration-500 ease-out ${featured ? 'bento-item-featured' : 'bento-item'}`}>
      <div className="absolute inset-0 bg-mesh-card opacity-50 pointer-events-none" />

      <div className="relative flex items-center justify-between border-b border-[hsl(222,14%,15%,0.5)] px-3 py-2 backdrop-blur-sm">
        <div className="min-w-0 flex items-center gap-2">
          <span className="truncate font-mono text-xs font-semibold text-foreground">{symbol}/USD</span>
          <span className="font-mono text-[10px] text-muted-foreground">{tfLabel}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 font-mono text-[9px] uppercase tracking-wider text-[hsl(162,91%,32%)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" />
            LIVE
          </span>
          <span className={`whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${positive ? 'text-[hsl(162,91%,32%)] bg-[hsl(162,91%,32%,0.1)]' : 'text-[hsl(355,88%,58%)] bg-[hsl(355,88%,58%,0.1)]'}`}>
            {change}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-hidden border-b border-[hsl(222,14%,12%,0.5)] bg-[hsl(223,18%,6%,0.4)] px-3 py-1.5">
        <span className="font-mono text-[9px] text-muted-foreground">O <span className="text-foreground/80">{formatPrice(open)}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">H <span className="text-[hsl(162,91%,32%)]">{formatPrice(high)}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">L <span className="text-[hsl(355,88%,58%)]">{formatPrice(low)}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">C <span className="text-foreground/80">{price}</span></span>
      </div>

      <div className="relative h-20 p-2 sm:h-32">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id={`miniGrid-${symbol}`} width="30" height="20" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 20" fill="none" stroke="hsl(222,14%,18%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#miniGrid-${symbol})`} />
        </svg>

        <div className="absolute inset-3 flex items-end justify-around gap-0.5">
          {candles.map((candle, i) => {
            const isBull = candle.c >= candle.o;
            const bodyPct = Math.min(95, Math.max(6, (Math.abs(candle.c - candle.o) / priceSpan) * 100));
            return (
              <div key={i} className="group/candle relative flex h-full flex-col items-center justify-end">
                <div
                  className={`w-2 rounded-sm transition-all duration-200 group-hover/candle:scale-110 ${isBull ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`}
                  style={{
                    height: `${bodyPct}%`,
                    boxShadow: isBull ? '0 0 8px hsl(162,91%,32%,0.3)' : '0 0 8px hsl(355,88%,58%,0.3)',
                  }}
                />
              </div>
            );
          })}
        </div>

        <svg className="absolute inset-3 opacity-70" preserveAspectRatio="none" viewBox="0 0 100 50">
          <defs>
            <filter id={`glow-${symbol}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {pricePath ? (
            <path
              d={pricePath}
              stroke={positive ? "hsl(162,91%,45%)" : "hsl(355,88%,58%)"}
              strokeWidth="1.5"
              fill="none"
              filter={`url(#glow-${symbol})`}
            />
          ) : null}
        </svg>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[hsl(224,100%,58%,0.9)] px-2 py-1 shadow-lg backdrop-blur-sm">
          <span className="font-mono text-[10px] font-bold text-white">{price}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex h-7 items-end gap-0.5 px-2 opacity-40">
        {candles.map((candle, i) => {
          const bull = candle.c >= candle.o;
          const height = `${Math.min(100, Math.max(6, (candle.v / maxVol) * 100))}%`;
          return (
            <div
              key={i}
              className={`flex-1 rounded-t-sm transition-all duration-300 ${bull ? 'bg-gradient-to-t from-[hsl(162,91%,32%,0.6)] to-[hsl(162,91%,32%,0.2)]' : 'bg-gradient-to-t from-[hsl(355,88%,58%,0.6)] to-[hsl(355,88%,58%,0.2)]'}`}
              style={{ height }}
            />
          );
        })}
      </div>

      <div className="absolute inset-0 opacity-0 transition-opacity duration-500 pointer-events-none group-hover:opacity-100 bg-gradient-to-t from-[hsl(224,100%,58%,0.05)] to-transparent" />
    </div>
  );
};

const BottomToolbar = ({ assetCount }: { assetCount: number }) => (
  <div className="absolute bottom-0 left-0 right-0 z-20 flex h-9 items-center border-t border-[hsl(222,14%,17%)] bg-[hsl(223,18%,9%)] px-3">
    <div className="flex items-center gap-1">
      <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-[hsl(222,14%,15%)] hover:text-foreground">
        <Search className="w-3.5 h-3.5" />
        Stock Screener
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-[hsl(222,14%,15%)] hover:text-foreground">
        <Terminal className="w-3.5 h-3.5" />
        Text Notes
      </button>
      <button className="flex items-center gap-1.5 rounded bg-[hsl(270,91%,65%,0.1)] px-3 py-1.5 text-[11px] font-medium text-[hsl(270,91%,65%)] transition-colors">
        <FileCode className="w-3.5 h-3.5" />
        Pine Editor
      </button>
      <button className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-[hsl(222,14%,15%)] hover:text-foreground">
        <FlaskConical className="w-3.5 h-3.5" />
        Strategy Tester
      </button>
      <button className="flex items-center gap-1.5 rounded bg-[hsl(162,91%,32%,0.1)] px-3 py-1.5 text-[11px] font-medium text-[hsl(162,91%,32%)] transition-colors">
        <LineChart className="w-3.5 h-3.5" />
        Live Trading ▲
      </button>
    </div>
    <div className="flex-1" />
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-1.5 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" />
        <span className="font-mono text-[10px] font-medium text-[hsl(162,91%,32%)]">LIVE</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">AIQTP™ Terminal v3.0</span>
      <div className="flex items-center gap-1.5">
        <Wifi className="w-3 h-3 text-[hsl(162,91%,32%)]" />
        <span className="font-mono text-[10px] text-muted-foreground">Connected</span>
      </div>
      <span className="font-mono text-[10px] font-medium text-[hsl(43,96%,56%)]">{assetCount || '—'} Assets</span>
      <span className="font-mono text-[10px] text-muted-foreground">UTC {new Date().toISOString().slice(11, 19)}</span>
    </div>
  </div>
);

const TerminalGridBackground = () => (
  <>
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="terminalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(220,15%,60%)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#terminalGrid)" />
    </svg>

    <div
      className="absolute inset-0 pointer-events-none opacity-[0.015]"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(220,15%,50%) 2px, hsl(220,15%,50%) 3px)',
        backgroundSize: '100% 4px',
      }}
    />

    <div className="absolute top-0 left-0 h-px w-32 bg-gradient-to-r from-[hsl(224,100%,58%,0.5)] to-transparent" />
    <div className="absolute top-0 left-0 h-32 w-px bg-gradient-to-b from-[hsl(224,100%,58%,0.5)] to-transparent" />
    <div className="absolute top-0 right-0 h-px w-32 bg-gradient-to-l from-[hsl(270,91%,65%,0.5)] to-transparent" />
    <div className="absolute top-0 right-0 h-32 w-px bg-gradient-to-b from-[hsl(270,91%,65%,0.5)] to-transparent" />
    <div className="absolute bottom-0 left-0 h-px w-32 bg-gradient-to-r from-[hsl(162,91%,32%,0.5)] to-transparent" />
    <div className="absolute bottom-0 left-0 h-32 w-px bg-gradient-to-t from-[hsl(162,91%,32%,0.5)] to-transparent" />
    <div className="absolute bottom-0 right-0 h-px w-32 bg-gradient-to-l from-[hsl(43,96%,56%,0.4)] to-transparent" />
    <div className="absolute bottom-0 right-0 h-32 w-px bg-gradient-to-t from-[hsl(43,96%,56%,0.4)] to-transparent" />
  </>
);

const Hero = () => {
  const isMobile = useIsMobile();
  const [tickerReady, setTickerReady] = useState(false);
  const [quickStartOpen, setQuickStartOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setTickerReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const shouldLoadLiveTicker = !isMobile && tickerReady;
  const { tickers, totalCoins } = useKrakenTickers(undefined, shouldLoadLiveTicker ? 45_000 : 0);
  const activeTickers = Object.keys(tickers).length;
  const assetCount = Math.max(activeTickers, totalCoins);

  const miniCharts: Array<{ symbol: string; pair: string; timeframe: "1h" | "4h" | "1d"; venue: string }> = [
    { symbol: 'BTC', pair: 'BTC/USDT', timeframe: '1h', venue: 'BINANCE' },
    { symbol: 'ETH', pair: 'ETH/USDT', timeframe: '1h', venue: 'BINANCE' },
    { symbol: 'SOL', pair: 'SOL/USDT', timeframe: '1h', venue: 'BINANCE' },
    { symbol: 'BNB', pair: 'BNB/USDT', timeframe: '1h', venue: 'BINANCE' },
    { symbol: 'XRP', pair: 'XRP/USDT', timeframe: '4h', venue: 'BINANCE' },
    { symbol: 'DOGE', pair: 'DOGE/USDT', timeframe: '4h', venue: 'BINANCE' },
  ];

  const visibleMiniCharts = isMobile ? miniCharts.slice(0, 2) : miniCharts;

  return (
    <section className="relative flex min-h-[70svh] items-center justify-center overflow-hidden bg-[hsl(225,20%,6%)] md:min-h-screen">
      <TerminalGridBackground />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 0%, hsl(225,20%,4%) 100%)' }}
      />

      {!isMobile && <LiveTicker tickers={tickers} />}
      {!isMobile && <LeftToolbar />}
      {!isMobile && <BottomToolbar assetCount={assetCount} />}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-3 pb-4 pt-10 sm:px-6 md:px-8 md:pb-12 md:pt-16 md:ml-11">
        <div className="mb-3 text-center animate-fade-in md:mb-10">
          <h1 className="mb-0.5 text-2xl font-bold tracking-tight animate-slide-up sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-[hsl(270,91%,75%)] to-[hsl(355,88%,65%)] bg-clip-text text-transparent drop-shadow-lg">
              AIQTP™
            </span>
            <span className="sr-only"> — AI Quantum Trading Portal</span>
          </h1>
          <h2 className="mb-1.5 text-lg font-bold tracking-tight animate-slide-up stagger-1 sm:text-3xl md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-[hsl(270,91%,70%)] via-[hsl(320,85%,60%)] to-[hsl(355,88%,58%)] bg-clip-text text-transparent">
              Terminal
            </span>
          </h2>

          <div className="mb-3 flex justify-center animate-slide-up stagger-2 md:mb-6">
            <p className="max-w-xl rounded-xl px-2.5 py-1.5 text-[11px] leading-snug text-muted-foreground glass-morphism-subtle sm:px-6 sm:py-3 sm:text-sm md:text-base">
              Quantum-powered trading, AI pattern recognition and institutional analytics —
              built from the ground up for serious traders.
            </p>
          </div>

          {/* Primary CTA — always above fold */}
          <div className="mb-3 flex flex-col items-stretch justify-center gap-1.5 animate-slide-up stagger-3 sm:flex-row sm:flex-wrap sm:gap-3 md:mb-8">
            <Button
              size="lg"
              onClick={() => setQuickStartOpen(true)}
              className="w-full gap-2 bg-gradient-to-r from-[hsl(162,91%,32%)] to-[hsl(162,80%,40%)] text-white font-semibold shadow-lg shadow-[hsl(162,91%,32%,0.3)] hover:shadow-[hsl(162,91%,32%,0.5)] hover:scale-[1.02] transition-all sm:w-auto"
            >
              <Rocket className="w-4 h-4" />
              Start Earning Now
            </Button>
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 border-[hsl(222,14%,25%)] text-foreground glass-morphism micro-hover hover:border-[hsl(224,100%,58%,0.5)] sm:w-auto">
                <Terminal className="w-4 h-4" />
                Launch Terminal
              </Button>
            </Link>
          </div>

          {/* Secondary CTAs — still prominent but below primary pair */}
          <div className="mb-3 flex items-stretch justify-center gap-1.5 animate-slide-up stagger-3 sm:mb-6 md:mb-8">
            <Link to="/qaqi" className="flex-1 sm:flex-initial sm:w-auto">
              <Button size="sm" className="w-full gap-1.5 border-[hsl(270,91%,65%,0.3)] text-foreground glass-morphism micro-hover hover:border-[hsl(270,91%,65%,0.5)] text-xs sm:size-lg sm:text-sm">
                <Cpu className="w-3.5 h-3.5 text-[hsl(270,91%,65%)]" />
                QAQI™
              </Button>
            </Link>
            <Link to="/vault" className="flex-1 sm:flex-initial sm:w-auto">
              <Button size="sm" className="w-full gap-1.5 border-[hsl(43,96%,56%,0.3)] text-foreground glass-morphism micro-hover hover:border-[hsl(43,96%,56%,0.5)] text-xs sm:size-lg sm:text-sm">
                <Zap className="w-3.5 h-3.5 text-[hsl(43,96%,56%)]" />
                Vault
              </Button>
            </Link>
          </div>

          {/* Social proof strip */}
          <div className="mb-3 flex items-center justify-center gap-3 animate-slide-up stagger-3 md:mb-6">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" />
              <span className="font-mono text-[10px] text-[hsl(162,91%,32%)]">2,847 traders online</span>
            </div>
            <span className="text-[hsl(222,14%,25%)]">|</span>
            <span className="font-mono text-[10px] text-muted-foreground">$14.2M+ volume today</span>
          </div>
        </div>

        {/* Mini-chart strip removed — customers use Watchlist / Markets pages. Keeps hero LCP fast. */}

        <div className="mb-3 flex flex-wrap justify-center gap-1 animate-slide-up stagger-5 md:mb-8 md:gap-2">
          <Badge variant="outline" className="px-2.5 py-1 font-mono text-[9px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(270,91%,65%,0.2)] md:px-4 md:py-1.5 md:text-[10px]">
            <Shield className="w-3 h-3 mr-1 text-[hsl(270,91%,65%)]" />
            Quantum Security
          </Badge>
          <Badge variant="outline" className="px-2.5 py-1 font-mono text-[9px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(224,100%,58%,0.2)] md:px-4 md:py-1.5 md:text-[10px]">
            <Globe className="w-3 h-3 mr-1 text-[hsl(224,100%,58%)]" />
            Global Access
          </Badge>
          <Badge variant="outline" className="px-2.5 py-1 font-mono text-[9px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(43,96%,56%,0.2)] md:px-4 md:py-1.5 md:text-[10px]">
            <Zap className="w-3 h-3 mr-1 text-[hsl(43,96%,56%)]" />
            Lightning
          </Badge>
          <Badge variant="outline" className="px-2.5 py-1 font-mono text-[9px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(162,91%,32%,0.2)] md:px-4 md:py-1.5 md:text-[10px]">
            <Bot className="w-3 h-3 mr-1 text-[hsl(162,91%,32%)]" />
            AI Bots™
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-1.5 text-center animate-slide-up stagger-6 lg:grid-cols-4 lg:gap-4">
          <div className="rounded-xl px-2 py-1.5 glass-morphism-subtle micro-hover md:px-6 md:py-3">
            <div className="font-mono text-sm font-bold text-[hsl(43,96%,56%)] md:text-xl">Multi-Asset</div>
            <div className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground md:text-[9px]">Crypto · Stocks · More</div>
          </div>
          <div className="rounded-xl px-2 py-1.5 glass-morphism-subtle micro-hover md:px-6 md:py-3">
            <div className="font-mono text-sm font-bold text-[hsl(162,91%,32%)] md:text-xl">Zero Fees</div>
            <div className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground md:text-[9px]">No Subscriptions</div>
          </div>
          <div className="rounded-xl px-2 py-1.5 glass-morphism-subtle micro-hover md:px-6 md:py-3">
            <div className="font-mono text-sm font-bold text-[hsl(270,91%,65%)] md:text-xl">AI-Powered</div>
            <div className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground md:text-[9px]">ML Signals & Bots</div>
          </div>
          <div className="rounded-xl px-2 py-1.5 glass-morphism-subtle micro-hover md:px-6 md:py-3">
            <div className="font-mono text-sm font-bold text-[hsl(224,100%,58%)] md:text-xl">Quantum-Safe</div>
            <div className="font-mono text-[7px] uppercase tracking-wider text-muted-foreground md:text-[9px]">Post-Quantum Crypto</div>
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <QuickStartStrategy open={quickStartOpen} onOpenChange={setQuickStartOpen} />
      </Suspense>
    </section>
  );
};

export default Hero;