import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, Globe, Bot, TrendingUp, ChevronDown, Wifi, BarChart2, Crosshair, Minus, Square, Circle, PenTool, Search, FileCode, FlaskConical, Terminal, Cpu, LineChart, Rocket } from "lucide-react";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";

const QuickStartStrategy = lazy(() => import("@/components/strategy/QuickStartStrategy"));
import { useKrakenTickers } from "@/hooks/useKrakenTickers";
import { useIsMobile } from "@/hooks/use-mobile";

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
    <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <Crosshair className="w-4 h-4" />
    </button>
    <button className="flex h-8 w-8 items-center justify-center rounded bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)]">
      <Minus className="w-4 h-4" />
    </button>
    <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <TrendingUp className="w-4 h-4" />
    </button>
    <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <Square className="w-4 h-4" />
    </button>
    <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <Circle className="w-4 h-4" />
    </button>
    <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <PenTool className="w-4 h-4" />
    </button>
    <div className="flex-1" />
    <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-[hsl(222,14%,20%)] hover:text-foreground">
      <BarChart2 className="w-4 h-4" />
    </button>
  </div>
);

const MiniChartPanel = ({ symbol, price, change, timeframe, positive, featured = false }: { symbol: string; price: string; change: string; timeframe: string; positive: boolean; featured?: boolean }) => {
  const chartVisuals = useMemo(() => {
    const candles = Array.from({ length: 12 }, () => ({
      o: 40 + Math.random() * 30,
      c: 40 + Math.random() * 30,
      h: 60 + Math.random() * 20,
      l: 30 + Math.random() * 15,
    }));

    return {
      candles,
      open: (Math.random() * 100 + 50).toFixed(2),
      high: (Math.random() * 100 + 60).toFixed(2),
      low: (Math.random() * 50 + 40).toFixed(2),
      path: `M 0 ${30 + Math.random() * 10} Q ${25 + Math.random() * 10} ${25 + Math.random() * 15} 50 ${20 + Math.random() * 10} T 100 ${15 + Math.random() * 10}`,
      volumeHeights: Array.from({ length: 12 }, () => `${20 + Math.random() * 80}%`),
    };
  }, []);

  return (
    <div className={`relative overflow-hidden group transition-all duration-500 ease-out ${featured ? 'bento-item-featured' : 'bento-item'}`}>
      <div className="absolute inset-0 bg-mesh-card opacity-50 pointer-events-none" />

      <div className="relative flex items-center justify-between border-b border-[hsl(222,14%,15%,0.5)] px-3 py-2 backdrop-blur-sm">
        <div className="min-w-0 flex items-center gap-2">
          <span className="truncate font-mono text-xs font-semibold text-foreground">{symbol}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{timeframe}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${positive ? 'text-[hsl(162,91%,32%)] bg-[hsl(162,91%,32%,0.1)]' : 'text-[hsl(355,88%,58%)] bg-[hsl(355,88%,58%,0.1)]'}`}>
            {change}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-hidden border-b border-[hsl(222,14%,12%,0.5)] bg-[hsl(223,18%,6%,0.4)] px-3 py-1.5">
        <span className="font-mono text-[9px] text-muted-foreground">O <span className="text-foreground/80">{chartVisuals.open}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">H <span className="text-[hsl(162,91%,32%)]">{chartVisuals.high}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">L <span className="text-[hsl(355,88%,58%)]">{chartVisuals.low}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">C <span className="text-foreground/80">{price}</span></span>
      </div>

      <div className="relative h-32 p-2">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id={`miniGrid-${symbol}`} width="30" height="20" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 20" fill="none" stroke="hsl(222,14%,18%)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#miniGrid-${symbol})`} />
        </svg>

        <div className="absolute inset-3 flex items-end justify-around gap-0.5">
          {chartVisuals.candles.map((candle, i) => {
            const isBull = candle.c > candle.o;
            const bodyHeight = Math.abs(candle.c - candle.o) * 1.2;
            return (
              <div key={i} className="group/candle relative flex h-full flex-col items-center justify-end">
                <div
                  className={`w-2 rounded-sm transition-all duration-200 group-hover/candle:scale-110 ${isBull ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`}
                  style={{
                    height: `${Math.max(bodyHeight, 4)}px`,
                    boxShadow: isBull ? '0 0 8px hsl(162,91%,32%,0.3)' : '0 0 8px hsl(355,88%,58%,0.3)',
                  }}
                />
              </div>
            );
          })}
        </div>

        <svg className="absolute inset-3 opacity-60" preserveAspectRatio="none" viewBox="0 0 100 50">
          <defs>
            <filter id={`glow-${symbol}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <path
            d={chartVisuals.path}
            stroke="hsl(43,96%,56%)"
            strokeWidth="1.5"
            fill="none"
            filter={`url(#glow-${symbol})`}
          />
        </svg>

        <div className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-[hsl(224,100%,58%,0.9)] px-2 py-1 shadow-lg backdrop-blur-sm">
          <span className="font-mono text-[10px] font-bold text-white">{price}</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 flex h-7 items-end gap-0.5 px-2 opacity-40">
        {chartVisuals.volumeHeights.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t-sm transition-all duration-300 ${i % 2 === 0 ? 'bg-gradient-to-t from-[hsl(162,91%,32%,0.6)] to-[hsl(162,91%,32%,0.2)]' : 'bg-gradient-to-t from-[hsl(355,88%,58%,0.6)] to-[hsl(355,88%,58%,0.2)]'}`}
            style={{ height }}
          />
        ))}
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

  const miniCharts = [
    { symbol: 'Tesla, Inc.', price: '668.05', change: '-5.57 (-0.82%)', timeframe: '1D · NASDAQ', positive: false },
    { symbol: 'Apple Inc', price: '144.82', change: '+0.53 (+0.36%)', timeframe: '1h · NASDAQ', positive: true },
    { symbol: 'Netflix, Inc.', price: '531.05', change: '+0.29 (+0.05%)', timeframe: '1D · NASDAQ', positive: true },
    { symbol: 'Bitcoin / USD', price: '33553.76', change: '+109.29 (+0.33%)', timeframe: '1h · BITSTAMP', positive: true },
    { symbol: 'Ethereum/USD', price: '2341.82', change: '-12.45 (-0.53%)', timeframe: '4h · COINBASE', positive: false },
    { symbol: 'SPY ETF', price: '478.23', change: '+3.21 (+0.67%)', timeframe: '1D · NYSE', positive: true },
  ];

  const visibleMiniCharts = isMobile ? miniCharts.slice(0, 2) : miniCharts;

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-[hsl(225,20%,6%)] md:min-h-screen">
      <TerminalGridBackground />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 0%, hsl(225,20%,4%) 100%)' }}
      />

      {!isMobile && <LiveTicker tickers={tickers} />}
      {!isMobile && <LeftToolbar />}
      {!isMobile && <BottomToolbar assetCount={assetCount} />}

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 md:px-8 md:pb-12 md:pt-16 md:ml-11">
        <div className="mb-8 text-center animate-fade-in md:mb-10">
          <h1 className="mb-2 text-4xl font-bold tracking-tight animate-slide-up sm:text-5xl md:text-6xl lg:text-7xl">
            <span className="bg-gradient-to-r from-white via-[hsl(270,91%,75%)] to-[hsl(355,88%,65%)] bg-clip-text text-transparent drop-shadow-lg">
              AIQTP™
            </span>
          </h1>
          <h2 className="mb-4 text-2xl font-bold tracking-tight animate-slide-up stagger-1 sm:text-3xl md:text-4xl lg:text-5xl">
            <span className="bg-gradient-to-r from-[hsl(270,91%,70%)] via-[hsl(320,85%,60%)] to-[hsl(355,88%,58%)] bg-clip-text text-transparent">
              Terminal
            </span>
          </h2>

          <div className="mb-6 flex justify-center animate-slide-up stagger-2">
            <p className="max-w-xl rounded-xl px-4 py-3 text-sm text-muted-foreground glass-morphism-subtle sm:px-6 md:text-base">
              Quantum-powered trading, AI pattern recognition and institutional analytics —
              built from the ground up for serious traders.
            </p>
          </div>

          <div className="mb-8 flex flex-col items-stretch justify-center gap-3 animate-slide-up stagger-3 sm:flex-row sm:flex-wrap">
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
            <Link to="/qaqi" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 border-[hsl(270,91%,65%,0.3)] text-foreground glass-morphism micro-hover hover:border-[hsl(270,91%,65%,0.5)] sm:w-auto">
                <Cpu className="w-4 h-4 text-[hsl(270,91%,65%)]" />
                QAQI™ Agent
              </Button>
            </Link>
            <Link to="/vault" className="w-full sm:w-auto">
              <Button size="lg" className="w-full gap-2 border-[hsl(43,96%,56%,0.3)] text-foreground glass-morphism micro-hover hover:border-[hsl(43,96%,56%,0.5)] sm:w-auto">
                <Zap className="w-4 h-4 text-[hsl(43,96%,56%)]" />
                Lightning Vault
              </Button>
            </Link>
          </div>
        </div>

        <div className="bento-grid mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-scale-in stagger-4">
          {visibleMiniCharts.map((chart, i) => (
            <MiniChartPanel key={i} {...chart} featured={i === 0 || i === 3} />
          ))}
        </div>

        <div className="mb-8 flex flex-wrap justify-center gap-2 animate-slide-up stagger-5">
          <Badge variant="outline" className="px-4 py-1.5 font-mono text-[10px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(270,91%,65%,0.2)]">
            <Shield className="w-3 h-3 mr-1.5 text-[hsl(270,91%,65%)]" />
            Post-Quantum Security
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 font-mono text-[10px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(224,100%,58%,0.2)]">
            <Globe className="w-3 h-3 mr-1.5 text-[hsl(224,100%,58%)]" />
            Global Access
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 font-mono text-[10px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(43,96%,56%,0.2)]">
            <Zap className="w-3 h-3 mr-1.5 text-[hsl(43,96%,56%)]" />
            Lightning Network
          </Badge>
          <Badge variant="outline" className="px-4 py-1.5 font-mono text-[10px] text-muted-foreground glass-morphism-subtle micro-hover border-[hsl(162,91%,32%,0.2)]">
            <Bot className="w-3 h-3 mr-1.5 text-[hsl(162,91%,32%)]" />
            AI Trading Bots™
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center animate-slide-up stagger-6 lg:grid-cols-4 lg:gap-4">
          <div className="rounded-xl px-4 py-3 glass-morphism-subtle micro-hover md:px-6">
            <div className="font-mono text-lg font-bold text-[hsl(43,96%,56%)] md:text-xl">Multi-Asset</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Crypto · Stocks · More</div>
          </div>
          <div className="rounded-xl px-4 py-3 glass-morphism-subtle micro-hover md:px-6">
            <div className="font-mono text-lg font-bold text-[hsl(162,91%,32%)] md:text-xl">Zero Fees</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">No Subscriptions</div>
          </div>
          <div className="rounded-xl px-4 py-3 glass-morphism-subtle micro-hover md:px-6">
            <div className="font-mono text-lg font-bold text-[hsl(270,91%,65%)] md:text-xl">AI-Powered</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">ML Signals & Bots</div>
          </div>
          <div className="rounded-xl px-4 py-3 glass-morphism-subtle micro-hover md:px-6">
            <div className="font-mono text-lg font-bold text-[hsl(224,100%,58%)] md:text-xl">Quantum-Safe</div>
            <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">Post-Quantum Crypto</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;