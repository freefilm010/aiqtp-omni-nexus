import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Bot, Atom, TrendingUp, Crown, Activity, ChevronDown, Wifi, BarChart2, Crosshair, Minus, TrendingDown, Square, Circle, PenTool, Search, FileCode, FlaskConical, SlidersHorizontal, Eye, Maximize2, Layout, Terminal, Cpu, LineChart, CandlestickChart } from "lucide-react";
import { useEffect, useState } from "react";
import { useKrakenTickers } from "@/hooks/useKrakenTickers";

// TradingView-style Live Price Ticker — ALL symbols from database
const LiveTicker = () => {
  // Pull ALL available tickers from the database (no hardcoded limit)
  const { tickers, totalCoins } = useKrakenTickers(undefined, 45_000);

  // Sort by market cap, show all
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
    <div className="absolute top-0 left-0 right-0 h-7 bg-[hsl(223,18%,9%)] border-b border-[hsl(222,14%,17%)] overflow-hidden z-20">
      <div className="flex animate-ticker whitespace-nowrap h-full">
        {[...prices, ...prices].map((ticker, i) => (
          <div key={i} className="flex items-center px-3 h-full border-r border-[hsl(222,14%,17%)] gap-2">
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

// TradingView-style Left Toolbar
const LeftToolbar = () => (
  <div className="absolute left-0 top-7 bottom-9 w-11 bg-[hsl(223,18%,9%)] border-r border-[hsl(222,14%,17%)] flex flex-col items-center py-2 gap-1 z-20">
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,20%)] text-muted-foreground hover:text-foreground transition-colors">
      <Crosshair className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)]">
      <Minus className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,20%)] text-muted-foreground hover:text-foreground transition-colors">
      <TrendingUp className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,20%)] text-muted-foreground hover:text-foreground transition-colors">
      <Square className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,20%)] text-muted-foreground hover:text-foreground transition-colors">
      <Circle className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,20%)] text-muted-foreground hover:text-foreground transition-colors">
      <PenTool className="w-4 h-4" />
    </button>
    <div className="flex-1" />
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,20%)] text-muted-foreground hover:text-foreground transition-colors">
      <BarChart2 className="w-4 h-4" />
    </button>
  </div>
);

// Award-Winning Bento Mini Chart Panel with Glassmorphism 2.0
const MiniChartPanel = ({ symbol, price, change, timeframe, positive, featured = false }: { symbol: string; price: string; change: string; timeframe: string; positive: boolean; featured?: boolean }) => {
  // Generate random candles for each mini chart
  const candles = Array.from({ length: 12 }, () => ({
    o: 40 + Math.random() * 30,
    c: 40 + Math.random() * 30,
    h: 60 + Math.random() * 20,
    l: 30 + Math.random() * 15
  }));

  return (
    <div className={`relative overflow-hidden group transition-all duration-500 ease-out ${featured ? 'bento-item-featured' : 'bento-item'}`}>
      {/* Mesh Gradient Overlay */}
      <div className="absolute inset-0 bg-mesh-card opacity-50 pointer-events-none" />
      
      {/* Glassmorphism Header */}
      <div className="relative flex items-center justify-between px-3 py-2 border-b border-[hsl(222,14%,15%,0.5)] backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-semibold text-foreground">{symbol}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{timeframe}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-mono text-[10px] font-medium px-1.5 py-0.5 rounded ${positive ? 'text-[hsl(162,91%,32%)] bg-[hsl(162,91%,32%,0.1)]' : 'text-[hsl(355,88%,58%)] bg-[hsl(355,88%,58%,0.1)]'}`}>
            {change}
          </span>
        </div>
      </div>
      
      {/* OHLC Data - Glassmorphism Bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 bg-[hsl(223,18%,6%,0.4)] border-b border-[hsl(222,14%,12%,0.5)]">
        <span className="font-mono text-[9px] text-muted-foreground">O <span className="text-foreground/80">{(Math.random() * 100 + 50).toFixed(2)}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">H <span className="text-[hsl(162,91%,32%)]">{(Math.random() * 100 + 60).toFixed(2)}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">L <span className="text-[hsl(355,88%,58%)]">{(Math.random() * 50 + 40).toFixed(2)}</span></span>
        <span className="font-mono text-[9px] text-muted-foreground">C <span className="text-foreground/80">{price}</span></span>
      </div>

      {/* Chart Area with Depth */}
      <div className="relative h-32 p-2">
        {/* Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id={`miniGrid-${symbol}`} width="30" height="20" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 20" fill="none" stroke="hsl(222,14%,18%)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#miniGrid-${symbol})`} />
        </svg>

        {/* Candles with Micro-Interaction Hover */}
        <div className="absolute inset-3 flex items-end justify-around gap-0.5">
          {candles.map((candle, i) => {
            const isBull = candle.c > candle.o;
            const bodyHeight = Math.abs(candle.c - candle.o) * 1.2;
            return (
              <div key={i} className="relative flex flex-col items-center h-full justify-end group/candle">
                <div 
                  className={`w-2 rounded-sm transition-all duration-200 group-hover/candle:scale-110 ${isBull ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`}
                  style={{ 
                    height: `${Math.max(bodyHeight, 4)}px`,
                    boxShadow: isBull ? '0 0 8px hsl(162,91%,32%,0.3)' : '0 0 8px hsl(355,88%,58%,0.3)'
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Moving Average with Glow */}
        <svg className="absolute inset-3 opacity-60" preserveAspectRatio="none" viewBox="0 0 100 50">
          <defs>
            <filter id={`glow-${symbol}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path 
            d={`M 0 ${30 + Math.random() * 10} Q ${25 + Math.random() * 10} ${25 + Math.random() * 15} 50 ${20 + Math.random() * 10} T 100 ${15 + Math.random() * 10}`} 
            stroke="hsl(43,96%,56%)" 
            strokeWidth="1.5" 
            fill="none" 
            filter={`url(#glow-${symbol})`}
          />
        </svg>

        {/* Floating Price Label with Glassmorphism */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-[hsl(224,100%,58%,0.9)] backdrop-blur-sm rounded-md shadow-lg">
          <span className="font-mono text-[10px] font-bold text-white">{price}</span>
        </div>
      </div>

      {/* Volume Bars with Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-7 px-2 flex items-end gap-0.5 opacity-40">
        {Array.from({ length: 12 }, (_, i) => (
          <div 
            key={i} 
            className={`flex-1 rounded-t-sm transition-all duration-300 ${i % 2 === 0 ? 'bg-gradient-to-t from-[hsl(162,91%,32%,0.6)] to-[hsl(162,91%,32%,0.2)]' : 'bg-gradient-to-t from-[hsl(355,88%,58%,0.6)] to-[hsl(355,88%,58%,0.2)]'}`}
            style={{ height: `${20 + Math.random() * 80}%` }}
          />
        ))}
      </div>

      {/* Hover Glow Effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-[hsl(224,100%,58%,0.05)] to-transparent" />
    </div>
  );
};

// TradingView Bottom Toolbar
const BottomToolbar = () => (
  <div className="absolute bottom-0 left-0 right-0 h-9 bg-[hsl(223,18%,9%)] border-t border-[hsl(222,14%,17%)] flex items-center px-3 z-20">
    <div className="flex items-center gap-1">
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(222,14%,15%)] rounded transition-colors">
        <Search className="w-3.5 h-3.5" />
        Stock Screener
        <ChevronDown className="w-3 h-3 opacity-50" />
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(222,14%,15%)] rounded transition-colors">
        <Terminal className="w-3.5 h-3.5" />
        Text Notes
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium bg-[hsl(270,91%,65%,0.1)] text-[hsl(270,91%,65%)] rounded transition-colors">
        <FileCode className="w-3.5 h-3.5" />
        Pine Editor
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-[hsl(222,14%,15%)] rounded transition-colors">
        <FlaskConical className="w-3.5 h-3.5" />
        Strategy Tester
      </button>
      <button className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[hsl(162,91%,32%)] bg-[hsl(162,91%,32%,0.1)] rounded transition-colors">
        <LineChart className="w-3.5 h-3.5" />
        Paper Trading ▲
      </button>
    </div>
    <div className="flex-1" />
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" />
        <span className="font-mono text-[10px] text-[hsl(162,91%,32%)] font-medium">LIVE</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">AIQTP™ Terminal v3.0</span>
      <div className="flex items-center gap-1.5">
        <Wifi className="w-3 h-3 text-[hsl(162,91%,32%)]" />
        <span className="font-mono text-[10px] text-muted-foreground">Connected</span>
      </div>
      <span className="font-mono text-[10px] text-[hsl(43,96%,56%)] font-medium">{Object.keys(tickers).length || '—'} Assets</span>
      <span className="font-mono text-[10px] text-muted-foreground">UTC {new Date().toISOString().slice(11, 19)}</span>
    </div>
  </div>
);

// Terminal Grid Background - Professional Next-Gen Aesthetic
const TerminalGridBackground = () => (
  <>
    {/* Subtle grid pattern */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="terminalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="hsl(220,15%,60%)" strokeWidth="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#terminalGrid)" />
    </svg>
    
    {/* Horizontal scan lines */}
    <div className="absolute inset-0 pointer-events-none opacity-[0.015]" style={{
      backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(220,15%,50%) 2px, hsl(220,15%,50%) 3px)',
      backgroundSize: '100% 4px'
    }} />
    
    {/* Corner accent lines - top left */}
    <div className="absolute top-0 left-0 w-32 h-px bg-gradient-to-r from-[hsl(224,100%,58%,0.5)] to-transparent" />
    <div className="absolute top-0 left-0 w-px h-32 bg-gradient-to-b from-[hsl(224,100%,58%,0.5)] to-transparent" />
    
    {/* Corner accent lines - top right */}
    <div className="absolute top-0 right-0 w-32 h-px bg-gradient-to-l from-[hsl(270,91%,65%,0.5)] to-transparent" />
    <div className="absolute top-0 right-0 w-px h-32 bg-gradient-to-b from-[hsl(270,91%,65%,0.5)] to-transparent" />
    
    {/* Corner accent lines - bottom left */}
    <div className="absolute bottom-0 left-0 w-32 h-px bg-gradient-to-r from-[hsl(162,91%,32%,0.5)] to-transparent" />
    <div className="absolute bottom-0 left-0 w-px h-32 bg-gradient-to-t from-[hsl(162,91%,32%,0.5)] to-transparent" />
    
    {/* Corner accent lines - bottom right */}
    <div className="absolute bottom-0 right-0 w-32 h-px bg-gradient-to-l from-[hsl(43,96%,56%,0.4)] to-transparent" />
    <div className="absolute bottom-0 right-0 w-px h-32 bg-gradient-to-t from-[hsl(43,96%,56%,0.4)] to-transparent" />
  </>
);

const Hero = () => {
  const miniCharts = [
    { symbol: 'Tesla, Inc.', price: '668.05', change: '-5.57 (-0.82%)', timeframe: '1D · NASDAQ', positive: false },
    { symbol: 'Apple Inc', price: '144.82', change: '+0.53 (+0.36%)', timeframe: '1h · NASDAQ', positive: true },
    { symbol: 'Netflix, Inc.', price: '531.05', change: '+0.29 (+0.05%)', timeframe: '1D · NASDAQ', positive: true },
    { symbol: 'Bitcoin / USD', price: '33553.76', change: '+109.29 (+0.33%)', timeframe: '1h · BITSTAMP', positive: true },
    { symbol: 'Ethereum/USD', price: '2341.82', change: '-12.45 (-0.53%)', timeframe: '4h · COINBASE', positive: false },
    { symbol: 'SPY ETF', price: '478.23', change: '+3.21 (+0.67%)', timeframe: '1D · NYSE', positive: true },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[hsl(225,20%,6%)]">
      {/* Professional Terminal Grid Background */}
      <TerminalGridBackground />
      
      {/* Subtle vignette effect */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, hsl(225,20%,4%) 100%)'
      }} />
      
      {/* TradingView-style Interface */}
      <LiveTicker />
      <LeftToolbar />
      <BottomToolbar />

      {/* Main Content - Centered */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 pt-16 pb-12 ml-11">
        
        {/* Award-Winning Hero Header with Glassmorphism */}
        <div className="text-center mb-10 animate-fade-in">
          {/* Gradient Title with Mesh Effect */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-2 tracking-tight animate-slide-up">
            <span className="bg-gradient-to-r from-white via-[hsl(270,91%,75%)] to-[hsl(355,88%,65%)] bg-clip-text text-transparent drop-shadow-lg">
              AIQTP™
            </span>
          </h1>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight animate-slide-up stagger-1">
            <span className="bg-gradient-to-r from-[hsl(270,91%,70%)] via-[hsl(320,85%,60%)] to-[hsl(355,88%,58%)] bg-clip-text text-transparent">
              Terminal
            </span>
          </h2>
          
          {/* Subtitle with Glassmorphism Badge */}
          <div className="flex justify-center mb-6 animate-slide-up stagger-2">
            <p className="text-sm md:text-base text-muted-foreground max-w-xl glass-morphism-subtle px-6 py-3 rounded-xl">
              Experience quantum-powered trading, AI pattern recognition and institutional analytics,
              all with the professional UX you know and love.
            </p>
          </div>

          {/* Action Buttons - Award-Winning Micro-Interactions */}
          <div className="flex flex-wrap justify-center gap-3 mb-8 animate-slide-up stagger-3">
            <Link to="/auth">
              <Button size="lg" className="glass-morphism micro-hover border-[hsl(222,14%,25%)] text-foreground font-medium gap-2 hover:border-[hsl(224,100%,58%,0.5)]">
                <Terminal className="w-4 h-4" />
                Launch Terminal
              </Button>
            </Link>
            <Link to="/qaqi">
              <Button size="lg" className="glass-morphism micro-hover border-[hsl(270,91%,65%,0.3)] text-foreground font-medium gap-2 hover:border-[hsl(270,91%,65%,0.5)]">
                <Cpu className="w-4 h-4 text-[hsl(270,91%,65%)]" />
                QAQI™ Agent
              </Button>
            </Link>
            <Link to="/vault">
              <Button size="lg" className="glass-morphism micro-hover border-[hsl(43,96%,56%,0.3)] text-foreground font-medium gap-2 hover:border-[hsl(43,96%,56%,0.5)]">
                <Zap className="w-4 h-4 text-[hsl(43,96%,56%)]" />
                Lightning Vault
              </Button>
            </Link>
          </div>
        </div>

        {/* Award-Winning Bento Grid Layout */}
        <div className="bento-grid grid-cols-2 lg:grid-cols-3 mb-8 animate-scale-in stagger-4">
          {miniCharts.map((chart, i) => (
            <MiniChartPanel key={i} {...chart} featured={i === 0 || i === 3} />
          ))}
        </div>

        {/* Feature Badges with Glassmorphism */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-slide-up stagger-5">
          <Badge variant="outline" className="glass-morphism-subtle border-[hsl(270,91%,65%,0.2)] text-muted-foreground px-4 py-1.5 font-mono text-[10px] micro-hover">
            <Shield className="w-3 h-3 mr-1.5 text-[hsl(270,91%,65%)]" />
            Post-Quantum Security
          </Badge>
          <Badge variant="outline" className="glass-morphism-subtle border-[hsl(224,100%,58%,0.2)] text-muted-foreground px-4 py-1.5 font-mono text-[10px] micro-hover">
            <Globe className="w-3 h-3 mr-1.5 text-[hsl(224,100%,58%)]" />
            200+ Countries
          </Badge>
          <Badge variant="outline" className="glass-morphism-subtle border-[hsl(43,96%,56%,0.2)] text-muted-foreground px-4 py-1.5 font-mono text-[10px] micro-hover">
            <Zap className="w-3 h-3 mr-1.5 text-[hsl(43,96%,56%)]" />
            Lightning Network
          </Badge>
          <Badge variant="outline" className="glass-morphism-subtle border-[hsl(162,91%,32%,0.2)] text-muted-foreground px-4 py-1.5 font-mono text-[10px] micro-hover">
            <Bot className="w-3 h-3 mr-1.5 text-[hsl(162,91%,32%)]" />
            AI Trading Bots™
          </Badge>
        </div>

        {/* Stats Row with Glassmorphism Cards */}
        <div className="flex justify-center gap-4 text-center animate-slide-up stagger-6">
          <div className="glass-morphism-subtle px-6 py-3 rounded-xl micro-hover">
            <div className="font-mono text-xl font-bold text-[hsl(43,96%,56%)]">$2.4B+</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">24h Volume</div>
          </div>
          <div className="glass-morphism-subtle px-6 py-3 rounded-xl micro-hover">
            <div className="font-mono text-xl font-bold text-[hsl(162,91%,32%)]">50K+</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Traders</div>
          </div>
          <div className="glass-morphism-subtle px-6 py-3 rounded-xl micro-hover">
            <div className="font-mono text-xl font-bold text-[hsl(270,91%,65%)]">99.9%</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Uptime</div>
          </div>
          <div className="glass-morphism-subtle px-6 py-3 rounded-xl micro-hover">
            <div className="font-mono text-xl font-bold text-[hsl(224,100%,58%)]">85%+</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">AI Win Rate</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;