import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Shield, Zap, Globe, Bot, Atom, TrendingUp, Crown, Activity, ChevronDown, Wifi, BarChart2, Crosshair, Minus, TrendingDown, Square, Circle, PenTool } from "lucide-react";
import { useState, useEffect } from "react";

// TradingView-style Live Price Ticker
const LiveTicker = () => {
  const [prices, setPrices] = useState([
    { symbol: 'BTCUSD', price: 96847.32, change: 2.34, positive: true },
    { symbol: 'ETHUSD', price: 3421.56, change: -0.87, positive: false },
    { symbol: 'SOLUSD', price: 187.43, change: 5.21, positive: true },
    { symbol: 'XRPUSD', price: 2.31, change: 1.45, positive: true },
    { symbol: 'ADAUSD', price: 1.02, change: -2.12, positive: false },
    { symbol: 'AVAXUSD', price: 38.92, change: 4.28, positive: true },
    { symbol: 'LINKUSD', price: 23.41, change: -0.34, positive: false },
    { symbol: 'DOGEUSD', price: 0.3847, change: 3.67, positive: true },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(p => ({
        ...p,
        price: p.price * (1 + (Math.random() - 0.5) * 0.001),
        change: p.change + (Math.random() - 0.5) * 0.1,
        positive: p.change + (Math.random() - 0.5) * 0.1 > 0
      })));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 h-7 bg-[hsl(223,18%,12%)] border-b border-[hsl(222,14%,19%)] overflow-hidden z-20">
      <div className="flex animate-ticker whitespace-nowrap h-full">
        {[...prices, ...prices].map((ticker, i) => (
          <div key={i} className="flex items-center px-3 h-full border-r border-[hsl(222,14%,19%)] gap-2">
            <span className="font-mono text-[11px] font-medium text-foreground/90">{ticker.symbol}</span>
            <span className={`font-mono text-[11px] font-semibold ${ticker.positive ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
              {ticker.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`font-mono text-[10px] ${ticker.positive ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
              {ticker.positive ? '+' : ''}{ticker.change.toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// TradingView-style Left Toolbar
const LeftToolbar = () => (
  <div className="absolute left-0 top-7 bottom-6 w-11 bg-[hsl(223,18%,12%)] border-r border-[hsl(222,14%,19%)] flex flex-col items-center py-2 gap-1 z-20">
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,22%)] text-muted-foreground hover:text-foreground transition-colors">
      <Crosshair className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)]">
      <Minus className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,22%)] text-muted-foreground hover:text-foreground transition-colors">
      <TrendingUp className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,22%)] text-muted-foreground hover:text-foreground transition-colors">
      <Square className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,22%)] text-muted-foreground hover:text-foreground transition-colors">
      <Circle className="w-4 h-4" />
    </button>
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,22%)] text-muted-foreground hover:text-foreground transition-colors">
      <PenTool className="w-4 h-4" />
    </button>
    <div className="flex-1" />
    <button className="w-8 h-8 flex items-center justify-center rounded hover:bg-[hsl(222,14%,22%)] text-muted-foreground hover:text-foreground transition-colors">
      <BarChart2 className="w-4 h-4" />
    </button>
  </div>
);

// TradingView-style Top Toolbar
const TopToolbar = () => (
  <div className="absolute left-11 top-7 right-0 h-9 bg-[hsl(223,18%,12%)] border-b border-[hsl(222,14%,19%)] flex items-center px-3 gap-1 z-20">
    <div className="flex items-center gap-1 border-r border-[hsl(222,14%,22%)] pr-3 mr-2">
      <span className="font-mono text-sm font-semibold text-foreground">BTCUSD</span>
      <ChevronDown className="w-3 h-3 text-muted-foreground" />
    </div>
    <div className="flex items-center gap-0.5">
      {['1m', '5m', '15m', '1H', '4H', 'D', 'W'].map((tf, i) => (
        <button 
          key={tf}
          className={`px-2 py-1 text-[11px] font-medium rounded ${tf === 'D' ? 'bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)]' : 'text-muted-foreground hover:text-foreground hover:bg-[hsl(222,14%,22%)]'} transition-colors`}
        >
          {tf}
        </button>
      ))}
    </div>
    <div className="flex-1" />
    <div className="flex items-center gap-2">
      <button className="px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
        <BarChart2 className="w-3 h-3" />
        Indicators
      </button>
      <button className="px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
        Templates
      </button>
    </div>
  </div>
);

// TradingView Candlestick Chart
const TradingViewChart = () => {
  const candles = [
    { o: 42, c: 48, h: 52, l: 40 }, { o: 48, c: 45, h: 50, l: 43 },
    { o: 45, c: 52, h: 55, l: 44 }, { o: 52, c: 49, h: 54, l: 47 },
    { o: 49, c: 56, h: 59, l: 48 }, { o: 56, c: 52, h: 58, l: 50 },
    { o: 52, c: 58, h: 61, l: 51 }, { o: 58, c: 55, h: 60, l: 53 },
    { o: 55, c: 62, h: 66, l: 54 }, { o: 62, c: 59, h: 64, l: 57 },
    { o: 59, c: 66, h: 70, l: 58 }, { o: 66, c: 63, h: 68, l: 61 },
    { o: 63, c: 70, h: 74, l: 62 }, { o: 70, c: 67, h: 72, l: 65 },
    { o: 67, c: 74, h: 78, l: 66 }, { o: 74, c: 71, h: 76, l: 69 },
    { o: 71, c: 78, h: 82, l: 70 }, { o: 78, c: 75, h: 80, l: 73 },
    { o: 75, c: 82, h: 86, l: 74 }, { o: 82, c: 79, h: 84, l: 77 },
    { o: 79, c: 86, h: 90, l: 78 }, { o: 86, c: 84, h: 88, l: 82 },
    { o: 84, c: 90, h: 94, l: 83 }, { o: 90, c: 88, h: 92, l: 86 },
  ];

  const priceScale = [100, 90, 80, 70, 60, 50, 40];

  return (
    <div className="absolute left-11 top-16 right-0 bottom-6 overflow-hidden pointer-events-none">
      {/* Grid */}
      <svg className="absolute inset-0 w-full h-full opacity-40">
        <defs>
          <pattern id="tvGrid" width="80" height="50" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 50" fill="none" stroke="hsl(222,14%,18%)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#tvGrid)" />
      </svg>

      {/* Price Scale on Right */}
      <div className="absolute right-0 top-0 bottom-20 w-14 flex flex-col justify-between py-4 opacity-50">
        {priceScale.map(price => (
          <span key={price} className="font-mono text-[10px] text-muted-foreground text-right pr-2">{price.toLocaleString()}</span>
        ))}
      </div>

      {/* Volume Bars */}
      <div className="absolute left-4 right-16 bottom-4 h-16 flex items-end justify-center gap-[5px] opacity-60">
        {candles.map((c, i) => (
          <div
            key={`vol-${i}`}
            className={`w-[10px] rounded-t-[1px] ${c.c > c.o ? 'bg-[hsl(162,91%,32%,0.4)]' : 'bg-[hsl(355,88%,58%,0.4)]'}`}
            style={{ height: `${15 + Math.random() * 70}%` }}
          />
        ))}
      </div>

      {/* Candlesticks */}
      <div className="absolute left-4 right-16 top-8 bottom-24 flex items-end justify-center gap-[5px]">
        {candles.map((candle, i) => {
          const isBull = candle.c > candle.o;
          const scale = 3;
          const bodyHeight = Math.abs(candle.c - candle.o) * scale;
          const wickTop = (candle.h - Math.max(candle.o, candle.c)) * scale;
          const wickBottom = (Math.min(candle.o, candle.c) - candle.l) * scale;
          const bodyBottom = (Math.min(candle.o, candle.c) - 35) * scale;
          
          return (
            <div key={i} className="relative flex flex-col items-center" style={{ height: '100%' }}>
              <div 
                className={`w-[1px] ${isBull ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`}
                style={{ height: `${wickTop}px`, position: 'absolute', bottom: `${bodyBottom + bodyHeight}px` }}
              />
              <div 
                className={`w-[10px] ${isBull ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`}
                style={{ 
                  height: `${Math.max(bodyHeight, 2)}px`,
                  position: 'absolute',
                  bottom: `${bodyBottom}px`,
                }}
              />
              <div 
                className={`w-[1px] ${isBull ? 'bg-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%)]'}`}
                style={{ height: `${wickBottom}px`, position: 'absolute', bottom: `${bodyBottom - wickBottom}px` }}
              />
            </div>
          );
        })}
      </div>

      {/* Moving Average Lines */}
      <svg className="absolute left-4 right-16 top-8 bottom-24 opacity-60" preserveAspectRatio="none" viewBox="0 0 100 100">
        <path d="M 0 70 Q 15 65 30 55 T 60 40 T 90 25 T 100 20" stroke="hsl(43,96%,56%)" strokeWidth="0.5" fill="none" />
        <path d="M 0 75 Q 20 72 35 62 T 65 48 T 95 32 T 100 28" stroke="hsl(270,91%,65%)" strokeWidth="0.5" fill="none" />
      </svg>

      {/* Crosshair */}
      <div className="absolute left-[60%] top-0 bottom-20 w-[1px] bg-[hsl(220,10%,50%,0.3)]" />
      <div className="absolute left-4 right-16 top-[40%] h-[1px] bg-[hsl(220,10%,50%,0.3)]" />
    </div>
  );
};

// AI Bot Minion
const AIBotMinion = ({ className, delay = 0, color = 'purple' }: { className?: string; delay?: number; color?: 'purple' | 'gold' | 'green' | 'blue' }) => {
  const colorMap = {
    purple: { bg: 'from-[hsl(270,91%,65%)] to-[hsl(224,100%,58%)]', glow: '270,91%,65%' },
    gold: { bg: 'from-[hsl(43,96%,56%)] to-[hsl(38,92%,50%)]', glow: '43,96%,56%' },
    green: { bg: 'from-[hsl(162,91%,32%)] to-[hsl(188,94%,45%)]', glow: '162,91%,32%' },
    blue: { bg: 'from-[hsl(224,100%,58%)] to-[hsl(270,91%,65%)]', glow: '224,100%,58%' }
  };

  return (
    <div className={`absolute opacity-35 hover:opacity-60 transition-opacity ${className}`} style={{ animationDelay: `${delay}s` }}>
      <div className="relative animate-float">
        <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${colorMap[color].bg} flex items-center justify-center`}
          style={{ boxShadow: `0 0 12px hsl(${colorMap[color].glow}, 0.4)` }}>
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" />
      </div>
    </div>
  );
};

// TradingView Status Bar
const StatusBar = () => (
  <div className="absolute bottom-0 left-0 right-0 h-6 bg-[hsl(223,18%,12%)] border-t border-[hsl(222,14%,19%)] flex items-center justify-between px-3 z-20">
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="w-1.5 h-1.5 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" style={{ boxShadow: '0 0 6px hsl(162,91%,32%)' }} />
        <span className="font-mono text-[10px] text-[hsl(162,91%,32%)] font-medium">LIVE</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">AIQTP™ Terminal v3.0</span>
    </div>
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1.5">
        <Wifi className="w-3 h-3 text-[hsl(162,91%,32%)]" />
        <span className="font-mono text-[10px] text-muted-foreground">Connected</span>
      </div>
      <span className="font-mono text-[10px] text-muted-foreground">UTC {new Date().toISOString().slice(11, 19)}</span>
    </div>
  </div>
);

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[hsl(225,20%,10%)]">
      {/* TradingView-style Interface */}
      <LiveTicker />
      <LeftToolbar />
      <TopToolbar />
      <TradingViewChart />
      <StatusBar />
      
      {/* Subtle Ambient Glow */}
      <div className="absolute top-[30%] right-[20%] w-[350px] h-[350px] bg-[hsl(270,91%,65%,0.03)] rounded-full blur-[120px]" />
      <div className="absolute bottom-[30%] left-[15%] w-[300px] h-[300px] bg-[hsl(162,91%,32%,0.025)] rounded-full blur-[100px]" />
      
      {/* AI Bot Minions */}
      <AIBotMinion className="top-[18%] left-[15%]" delay={0} color="purple" />
      <AIBotMinion className="top-[25%] right-[18%]" delay={0.5} color="gold" />
      <AIBotMinion className="bottom-[35%] left-[18%]" delay={1} color="green" />
      <AIBotMinion className="bottom-[30%] right-[15%]" delay={1.5} color="blue" />

      {/* Main Content - Overlay */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto ml-16">
        {/* Feature Badges - TradingView Style */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          <Badge variant="outline" className="bg-[hsl(223,18%,14%,0.9)] backdrop-blur border-[hsl(43,96%,56%,0.3)] text-[hsl(43,96%,56%)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            <Crown className="w-3 h-3 mr-1" />
            Institutional Grade
          </Badge>
          <Badge variant="outline" className="bg-[hsl(223,18%,14%,0.9)] backdrop-blur border-[hsl(270,91%,65%,0.3)] text-[hsl(270,91%,65%)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            <Atom className="w-3 h-3 mr-1" />
            QAQI™ Quantum AI
          </Badge>
          <Badge variant="outline" className="bg-[hsl(223,18%,14%,0.9)] backdrop-blur border-[hsl(162,91%,32%,0.3)] text-[hsl(162,91%,32%)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider">
            <Activity className="w-3 h-3 mr-1" />
            Real-Time Data
          </Badge>
        </div>
        
        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-foreground leading-tight tracking-tight">
          <span className="text-gradient-gold">AIQTP™</span>
          <span className="block mt-1.5 text-foreground/95 text-3xl md:text-4xl lg:text-5xl font-semibold">
            Professional Trading Terminal
          </span>
        </h1>
        
        {/* Subtitle */}
        <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          <span className="text-[hsl(270,91%,65%)]">Quantum AI</span> meets institutional-grade analytics. 
          Real-time charting, <span className="text-[hsl(43,96%,56%)]">advanced execution</span>, 
          and <span className="text-[hsl(162,91%,32%)]">ML-powered signals</span>.
        </p>

        {/* Action Buttons - TradingView Style */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center mb-10">
          <Link to="/auth">
            <Button size="lg" className="bg-[hsl(162,91%,32%)] hover:bg-[hsl(162,91%,38%)] text-white font-semibold shadow-[0_0_20px_hsl(162,91%,32%,0.3)] hover:shadow-[0_0_30px_hsl(162,91%,32%,0.4)] transition-all">
              <TrendingUp className="w-4 h-4 mr-2" />
              Start Trading
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link to="/qaqi">
            <Button variant="outline" size="lg" className="border-[hsl(270,91%,65%,0.4)] bg-[hsl(223,18%,14%,0.8)] hover:border-[hsl(270,91%,65%)] hover:bg-[hsl(270,91%,65%,0.1)] transition-all">
              <Atom className="w-4 h-4 mr-2 text-[hsl(270,91%,65%)]" />
              <span className="text-[hsl(270,91%,65%)]">QAQI™ Agent</span>
            </Button>
          </Link>
          <Link to="/vault">
            <Button variant="outline" size="lg" className="border-[hsl(43,96%,56%,0.4)] bg-[hsl(223,18%,14%,0.8)] hover:border-[hsl(43,96%,56%)] hover:bg-[hsl(43,96%,56%,0.1)] transition-all">
              <Zap className="w-4 h-4 mr-2 text-[hsl(43,96%,56%)]" />
              <span className="text-[hsl(43,96%,56%)]">Lightning Vault®</span>
            </Button>
          </Link>
        </div>

        {/* Stats Grid - TradingView Panel Style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-w-3xl mx-auto mb-8">
          <div className="bg-[hsl(223,18%,14%)] border border-[hsl(222,14%,19%)] p-3 hover:border-[hsl(43,96%,56%,0.3)] transition-colors">
            <div className="font-mono text-xl md:text-2xl font-bold text-[hsl(43,96%,56%)] mb-0.5">$2.4B+</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">24h Volume</div>
          </div>
          <div className="bg-[hsl(223,18%,14%)] border border-[hsl(222,14%,19%)] p-3 hover:border-[hsl(162,91%,32%,0.3)] transition-colors">
            <div className="font-mono text-xl md:text-2xl font-bold text-[hsl(162,91%,32%)] mb-0.5">50K+</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Active Traders</div>
          </div>
          <div className="bg-[hsl(223,18%,14%)] border border-[hsl(222,14%,19%)] p-3 hover:border-[hsl(224,100%,58%,0.3)] transition-colors">
            <div className="font-mono text-xl md:text-2xl font-bold text-[hsl(224,100%,58%)] mb-0.5">200+</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">Trading Pairs</div>
          </div>
          <div className="bg-[hsl(223,18%,14%)] border border-[hsl(222,14%,19%)] p-3 hover:border-[hsl(270,91%,65%,0.3)] transition-colors">
            <div className="font-mono text-xl md:text-2xl font-bold text-[hsl(270,91%,65%)] mb-0.5">&lt;10ms</div>
            <div className="font-mono text-[9px] text-muted-foreground uppercase tracking-wider">AI Execution</div>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap justify-center items-center gap-5 text-muted-foreground">
          <div className="flex items-center gap-1.5 hover:text-[hsl(43,96%,56%)] transition-colors">
            <Shield className="w-3.5 h-3.5 text-[hsl(43,96%,56%)]" />
            <span className="font-mono text-[10px]">Post-Quantum Security</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-[hsl(224,100%,58%)] transition-colors">
            <Globe className="w-3.5 h-3.5 text-[hsl(224,100%,58%)]" />
            <span className="font-mono text-[10px]">200+ Countries</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-[hsl(43,96%,56%)] transition-colors">
            <Zap className="w-3.5 h-3.5 text-[hsl(43,96%,56%)]" />
            <span className="font-mono text-[10px]">Lightning Network</span>
          </div>
          <div className="flex items-center gap-1.5 hover:text-[hsl(270,91%,65%)] transition-colors">
            <Bot className="w-3.5 h-3.5 text-[hsl(270,91%,65%)]" />
            <span className="font-mono text-[10px]">AI Trading Bots™</span>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce z-10">
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </div>
    </section>
  );
};

export default Hero;