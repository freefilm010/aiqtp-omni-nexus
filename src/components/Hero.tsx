import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Bot, Atom, TrendingUp, Crown, Sparkles, BarChart3, Activity, ChevronDown, Radio, Wifi } from "lucide-react";
import { useState, useEffect } from "react";

// Live Price Ticker Component (TradingView-style)
const LiveTicker = () => {
  const [prices, setPrices] = useState([
    { symbol: 'BTC', price: 96847.32, change: 2.34, positive: true },
    { symbol: 'ETH', price: 3421.56, change: -0.87, positive: false },
    { symbol: 'SOL', price: 187.43, change: 5.21, positive: true },
    { symbol: 'XRP', price: 2.31, change: 1.45, positive: true },
    { symbol: 'DOGE', price: 0.3847, change: -2.12, positive: false },
    { symbol: 'ADA', price: 1.02, change: 3.67, positive: true },
    { symbol: 'AVAX', price: 38.92, change: 4.28, positive: true },
    { symbol: 'LINK', price: 23.41, change: -0.34, positive: false },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        price: p.price * (1 + (Math.random() - 0.5) * 0.002),
        change: p.change + (Math.random() - 0.5) * 0.2,
        positive: p.change + (Math.random() - 0.5) * 0.2 > 0
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-8 bg-panel border-b border-panel-border overflow-hidden z-20">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...prices, ...prices].map((ticker, i) => (
          <div key={i} className="flex items-center px-4 h-8 border-r border-panel-border">
            <span className="font-mono text-xs font-semibold text-foreground mr-2">{ticker.symbol}</span>
            <span className={`font-mono text-xs font-medium ${ticker.positive ? 'text-accent' : 'text-royal-red'}`}>
              ${ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`font-mono text-[10px] ml-1.5 ${ticker.positive ? 'text-accent' : 'text-royal-red'}`}>
              {ticker.positive ? '▲' : '▼'}{Math.abs(ticker.change).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Terminal-style Candlestick Chart (Bloomberg/TradingView inspired)
const TerminalChart = () => {
  const candles = [
    { o: 45, c: 52, h: 55, l: 42 }, { o: 52, c: 48, h: 54, l: 46 },
    { o: 48, c: 55, h: 58, l: 47 }, { o: 55, c: 51, h: 57, l: 49 },
    { o: 51, c: 58, h: 62, l: 50 }, { o: 58, c: 54, h: 60, l: 52 },
    { o: 54, c: 62, h: 65, l: 53 }, { o: 62, c: 59, h: 64, l: 57 },
    { o: 59, c: 68, h: 72, l: 58 }, { o: 68, c: 65, h: 70, l: 63 },
    { o: 65, c: 74, h: 78, l: 64 }, { o: 74, c: 71, h: 76, l: 69 },
    { o: 71, c: 80, h: 84, l: 70 }, { o: 80, c: 78, h: 82, l: 75 },
    { o: 78, c: 88, h: 92, l: 77 }, { o: 88, c: 85, h: 90, l: 83 },
    { o: 85, c: 92, h: 96, l: 84 }, { o: 92, c: 89, h: 94, l: 87 },
    { o: 89, c: 95, h: 98, l: 88 }, { o: 95, c: 100, h: 105, l: 93 },
  ];

  const volumes = candles.map((c, i) => ({ vol: 20 + Math.random() * 40, bull: c.c > c.o }));

  return (
    <div className="absolute inset-0 flex flex-col justify-end pointer-events-none opacity-30">
      {/* Grid Lines */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <pattern id="terminalGrid" width="60" height="40" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 40" fill="none" stroke="hsl(220 15% 12%)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#terminalGrid)" />
      </svg>
      
      {/* Volume Bars */}
      <div className="flex items-end justify-center gap-[6px] h-16 px-8 mb-2">
        {volumes.map((v, i) => (
          <div
            key={`vol-${i}`}
            className={`w-3 rounded-t-sm ${v.bull ? 'bg-accent/40' : 'bg-royal-red/40'}`}
            style={{ height: `${v.vol}%` }}
          />
        ))}
      </div>

      {/* Candlesticks */}
      <div className="flex items-end justify-center gap-[6px] h-64 px-8 mb-8">
        {candles.map((candle, i) => {
          const isBull = candle.c > candle.o;
          const bodyHeight = Math.abs(candle.c - candle.o) * 2.5;
          const wickTop = (candle.h - Math.max(candle.o, candle.c)) * 2.5;
          const wickBottom = (Math.min(candle.o, candle.c) - candle.l) * 2.5;
          const bodyBottom = (Math.min(candle.o, candle.c) - 30) * 2.5;
          
          return (
            <div key={i} className="relative flex flex-col items-center" style={{ height: '100%' }}>
              {/* Upper wick */}
              <div 
                className={`w-[1px] ${isBull ? 'bg-accent' : 'bg-royal-red'}`}
                style={{ height: `${wickTop}px`, position: 'absolute', bottom: `${bodyBottom + bodyHeight}px` }}
              />
              {/* Body */}
              <div 
                className={`w-3 ${isBull ? 'bg-accent' : 'bg-royal-red'}`}
                style={{ 
                  height: `${Math.max(bodyHeight, 2)}px`,
                  position: 'absolute',
                  bottom: `${bodyBottom}px`,
                  boxShadow: isBull ? '0 0 8px hsl(142 76% 45% / 0.4)' : '0 0 8px hsl(0 85% 58% / 0.3)'
                }}
              />
              {/* Lower wick */}
              <div 
                className={`w-[1px] ${isBull ? 'bg-accent' : 'bg-royal-red'}`}
                style={{ height: `${wickBottom}px`, position: 'absolute', bottom: `${bodyBottom - wickBottom}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* Trend Line */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="trendLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(142, 76%, 45%)" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(45, 95%, 55%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(142, 76%, 45%)" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="hsl(142, 76%, 45%)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="hsl(142, 76%, 45%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path 
          d="M 0 400 Q 200 380 400 340 T 800 280 T 1200 200 T 1600 140 T 2000 80" 
          stroke="url(#trendLineGradient)" 
          strokeWidth="2" 
          fill="none"
        />
        <path 
          d="M 0 400 Q 200 380 400 340 T 800 280 T 1200 200 T 1600 140 T 2000 80 L 2000 500 L 0 500 Z" 
          fill="url(#areaGradient)"
        />
      </svg>
    </div>
  );
};

// AI Bot Minion Component
const AIBotMinion = ({ className, delay = 0, color = 'purple' }: { className?: string; delay?: number; color?: 'purple' | 'gold' | 'green' | 'cyan' }) => {
  const colorClasses = {
    purple: 'from-royal-purple to-royal-blue',
    gold: 'from-gold to-warning',
    green: 'from-accent to-neon-cyan',
    cyan: 'from-neon-cyan to-royal-blue'
  };
  
  const glowColors = {
    purple: '270, 91%, 65%',
    gold: '45, 95%, 55%',
    green: '142, 76%, 45%',
    cyan: '188, 94%, 45%'
  };

  return (
    <div 
      className={`absolute opacity-40 hover:opacity-70 transition-opacity ${className}`}
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="relative animate-float">
        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center`}
          style={{ boxShadow: `0 0 15px hsl(${glowColors[color]}, 0.5)` }}>
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-accent animate-pulse"></div>
      </div>
    </div>
  );
};

// Terminal Status Bar
const StatusBar = () => (
  <div className="absolute bottom-0 left-0 right-0 h-6 bg-panel border-t border-panel-border flex items-center justify-between px-4 z-20">
    <div className="flex items-center gap-4">
      <div className="status-live">
        <span className="font-mono text-[10px]">LIVE</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">AIQTP™ TERMINAL v3.0.0</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Wifi className="w-3 h-3 text-accent" />
        <span className="font-mono text-[10px]">Connected</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">UTC {new Date().toISOString().slice(11, 19)}</span>
    </div>
  </div>
);

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Live Ticker Bar */}
      <LiveTicker />
      
      {/* Terminal Chart Background */}
      <TerminalChart />
      
      {/* Ambient Glow Orbs - Subtle */}
      <div className="absolute top-[20%] right-[15%] w-[400px] h-[400px] bg-royal-purple/5 rounded-full blur-[150px]"></div>
      <div className="absolute bottom-[25%] left-[10%] w-[350px] h-[350px] bg-accent/4 rounded-full blur-[130px]"></div>
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[450px] h-[450px] bg-gold/3 rounded-full blur-[160px]"></div>
      
      {/* AI Bot Minions */}
      <AIBotMinion className="top-[15%] left-[8%]" delay={0} color="purple" />
      <AIBotMinion className="top-[20%] right-[10%]" delay={0.5} color="gold" />
      <AIBotMinion className="bottom-[30%] left-[5%]" delay={1} color="green" />
      <AIBotMinion className="bottom-[25%] right-[8%]" delay={1.5} color="cyan" />
      <AIBotMinion className="top-[50%] left-[3%]" delay={2} color="purple" />
      <AIBotMinion className="top-[45%] right-[4%]" delay={2.5} color="gold" />

      {/* Main Content */}
      <div className="relative z-10 text-center px-4 max-w-6xl mx-auto pt-12">
        {/* Feature Badges */}
        <div className="flex justify-center gap-2 mb-8 flex-wrap">
          <Badge variant="outline" className="bg-panel/80 backdrop-blur border-gold/40 text-gold px-3 py-1 font-mono text-[10px] uppercase tracking-wider">
            <Crown className="w-3 h-3 mr-1.5" />
            Institutional Grade
          </Badge>
          <Badge variant="outline" className="bg-panel/80 backdrop-blur border-royal-purple/40 text-royal-purple px-3 py-1 font-mono text-[10px] uppercase tracking-wider">
            <Atom className="w-3 h-3 mr-1.5" />
            QAQI™ Quantum AI
          </Badge>
          <Badge variant="outline" className="bg-panel/80 backdrop-blur border-accent/40 text-accent px-3 py-1 font-mono text-[10px] uppercase tracking-wider">
            <Activity className="w-3 h-3 mr-1.5" />
            Real-Time Analytics
          </Badge>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight tracking-tight">
          <span className="text-gradient-gold drop-shadow-[0_0_30px_hsl(45,95%,55%,0.4)]">AIQTP™</span>
          <span className="block mt-2 text-foreground/95 font-semibold">
            Professional Trading Terminal
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
          Bloomberg-grade analytics meets <span className="text-royal-purple font-medium">quantum AI</span>. 
          Real-time market data, <span className="text-gold font-medium">institutional execution</span>, 
          and <span className="text-accent font-medium">advanced trading algorithms</span> — unified.
        </p>

        {/* Action Buttons - Terminal Style */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link to="/auth">
            <Button variant="default" size="lg" className="group bg-accent hover:bg-accent-hover text-accent-foreground font-semibold shadow-[0_0_25px_hsl(142,76%,45%,0.35)] hover:shadow-[0_0_40px_hsl(142,76%,45%,0.5)] transition-all">
              <TrendingUp className="w-4 h-4 mr-2" />
              Start Trading
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link to="/qaqi">
            <Button variant="outline" size="lg" className="group border-royal-purple/50 bg-panel/60 hover:border-royal-purple hover:bg-royal-purple/10 transition-all">
              <Atom className="w-4 h-4 mr-2 text-royal-purple group-hover:animate-spin" />
              <span className="text-royal-purple font-medium">QAQI™ Agent</span>
            </Button>
          </Link>
          <Link to="/vault">
            <Button variant="outline" size="lg" className="border-gold/50 bg-panel/60 hover:border-gold hover:bg-gold/10 transition-all">
              <Zap className="w-4 h-4 mr-2 text-gold" />
              <span className="text-gold font-medium">Lightning Vault®</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid - Terminal Panel Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto mb-12">
          <div className="terminal-panel p-4 hover:border-gold/40 transition-colors group">
            <div className="quote-display text-gold mb-1 group-hover:text-shadow-[0_0_15px_hsl(45,95%,55%,0.6)]">$2.4B+</div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">24h Volume</div>
          </div>
          <div className="terminal-panel p-4 hover:border-accent/40 transition-colors group">
            <div className="quote-display text-accent mb-1">50K+</div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Active Traders</div>
          </div>
          <div className="terminal-panel p-4 hover:border-royal-blue/40 transition-colors group">
            <div className="quote-display text-royal-blue mb-1">200+</div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">Trading Pairs</div>
          </div>
          <div className="terminal-panel p-4 hover:border-royal-purple/40 transition-colors group">
            <div className="quote-display text-royal-purple mb-1">&lt;10ms</div>
            <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">AI Execution</div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2 hover:text-gold transition-colors group">
            <Shield className="w-4 h-4 text-gold" />
            <span className="font-mono text-xs">Post-Quantum Encryption</span>
          </div>
          <div className="flex items-center gap-2 hover:text-royal-blue transition-colors group">
            <Globe className="w-4 h-4 text-royal-blue" />
            <span className="font-mono text-xs">200+ Countries</span>
          </div>
          <div className="flex items-center gap-2 hover:text-gold transition-colors group">
            <Zap className="w-4 h-4 text-gold" />
            <span className="font-mono text-xs">Lightning Network</span>
          </div>
          <div className="flex items-center gap-2 hover:text-royal-purple transition-colors group">
            <Bot className="w-4 h-4 text-royal-purple" />
            <span className="font-mono text-xs">AI Trading Bots™</span>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />

      {/* Scroll Indicator */}
      <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Hero;