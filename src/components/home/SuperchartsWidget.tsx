import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  CandlestickChart,
  TrendingUp,
  TrendingDown,
  Maximize2,
  Settings2,
  Layers,
  Activity,
  BarChart2,
  Crosshair,
  Minus,
  Target,
  PenTool,
  Grid3X3
} from "lucide-react";
import { Link } from "react-router-dom";

// TradingView Supercharts-inspired multi-pane chart widget
// Volume Footprint + TPO + Auto Trendlines

const SuperchartsWidget = () => {
  const [activeSymbol, setActiveSymbol] = useState('BTCUSD');
  const [activeTimeframe, setActiveTimeframe] = useState('1H');
  const [price, setPrice] = useState(97234.56);
  const [change, setChange] = useState(2.34);

  const symbols = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'NVDA', 'AAPL'];
  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D', '1W'];

  // Generate candle data
  const generateCandles = () => {
    const candles = [];
    let lastClose = 100;
    for (let i = 0; i < 40; i++) {
      const open = lastClose;
      const change = (Math.random() - 0.48) * 3;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 1.5;
      const low = Math.min(open, close) - Math.random() * 1.5;
      const volume = 50 + Math.random() * 100;
      candles.push({ open, high, low, close, volume, isBull: close > open });
      lastClose = close;
    }
    return candles;
  };

  const [candles, setCandles] = useState(generateCandles());

  // Volume Footprint data (simplified)
  const volumeFootprint = candles.slice(-10).map((c, i) => ({
    price: c.close,
    buyVolume: c.volume * (c.isBull ? 0.6 : 0.4),
    sellVolume: c.volume * (c.isBull ? 0.4 : 0.6),
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setPrice(p => p * (1 + (Math.random() - 0.5) * 0.001));
      setChange(c => c + (Math.random() - 0.5) * 0.05);
      setCandles(generateCandles());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const chartHeight = 200;
  const minPrice = Math.min(...candles.map(c => c.low));
  const maxPrice = Math.max(...candles.map(c => c.high));
  const priceRange = maxPrice - minPrice;

  const getY = (price: number) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  return (
    <Card className="overflow-hidden bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      {/* Chart Header - TradingView style */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[hsl(222,14%,17%)] bg-[hsl(223,18%,8%)]">
        <div className="flex items-center gap-3">
          {/* Symbol Selector */}
          <div className="flex items-center gap-1 bg-[hsl(223,18%,12%)] rounded-lg p-1">
            {symbols.slice(0, 3).map((sym) => (
              <button
                key={sym}
                onClick={() => setActiveSymbol(sym)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-medium transition-all ${
                  activeSymbol === sym
                    ? 'bg-[hsl(224,100%,58%)] text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {sym}
              </button>
            ))}
          </div>

          {/* Price Display */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-lg font-bold text-foreground">
              ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <Badge className={`text-[9px] ${change >= 0 ? 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)]'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </Badge>
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 bg-[hsl(223,18%,12%)] rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-2 py-1 rounded text-[9px] font-mono font-medium transition-all ${
                activeTimeframe === tf
                  ? 'bg-[hsl(222,14%,22%)] text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* Chart Tools */}
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-[hsl(222,14%,15%)] text-muted-foreground hover:text-foreground">
            <Crosshair className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[hsl(222,14%,15%)] text-muted-foreground hover:text-foreground">
            <Minus className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[hsl(222,14%,15%)] text-muted-foreground hover:text-foreground">
            <PenTool className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-[hsl(222,14%,15%)] text-muted-foreground hover:text-foreground">
            <Grid3X3 className="w-4 h-4" />
          </button>
          <Link to="/advanced-trading">
            <button className="p-1.5 rounded hover:bg-[hsl(222,14%,15%)] text-muted-foreground hover:text-foreground">
              <Maximize2 className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative p-4" style={{ height: chartHeight + 80 }}>
        {/* Grid */}
        <svg className="absolute inset-4 w-[calc(100%-32px)] opacity-30" style={{ height: chartHeight }}>
          <defs>
            <pattern id="superchartGrid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="hsl(222,14%,15%)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#superchartGrid)" />
        </svg>

        {/* Candlestick Chart */}
        <svg className="absolute inset-4 w-[calc(100%-32px)]" style={{ height: chartHeight }} viewBox={`0 0 ${candles.length * 10} ${chartHeight}`} preserveAspectRatio="none">
          {candles.map((candle, i) => {
            const x = i * 10 + 2;
            const wickX = x + 3;
            const bodyWidth = 6;
            const bodyX = x;
            
            const highY = getY(candle.high);
            const lowY = getY(candle.low);
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            
            const bodyTop = Math.min(openY, closeY);
            const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
            
            const color = candle.isBull ? 'hsl(162,91%,32%)' : 'hsl(355,88%,58%)';
            
            return (
              <g key={i}>
                {/* Wick */}
                <line x1={wickX} y1={highY} x2={wickX} y2={lowY} stroke={color} strokeWidth="1" />
                {/* Body */}
                <rect 
                  x={bodyX} 
                  y={bodyTop} 
                  width={bodyWidth} 
                  height={bodyHeight} 
                  fill={candle.isBull ? color : color}
                  rx="0.5"
                />
              </g>
            );
          })}

          {/* Auto Trendline - TrendSpider style */}
          <line 
            x1="50" y1={getY(minPrice + priceRange * 0.3)} 
            x2={candles.length * 10 - 20} y2={getY(minPrice + priceRange * 0.6)} 
            stroke="hsl(270,91%,65%)" 
            strokeWidth="1.5" 
            strokeDasharray="5,3"
            opacity="0.7"
          />
          <line 
            x1="80" y1={getY(minPrice + priceRange * 0.7)} 
            x2={candles.length * 10 - 40} y2={getY(minPrice + priceRange * 0.5)} 
            stroke="hsl(43,96%,56%)" 
            strokeWidth="1.5" 
            strokeDasharray="5,3"
            opacity="0.7"
          />

          {/* Moving Average */}
          <path
            d={`M ${candles.map((_, i) => `${i * 10 + 5},${getY(candles.slice(Math.max(0, i - 5), i + 1).reduce((sum, c) => sum + c.close, 0) / Math.min(i + 1, 6))}`).join(' L ')}`}
            stroke="hsl(224,100%,58%)"
            strokeWidth="1.5"
            fill="none"
            opacity="0.8"
          />
        </svg>

        {/* Volume Bars */}
        <div className="absolute bottom-2 left-4 right-4 h-12 flex items-end gap-[2px] opacity-50">
          {candles.map((candle, i) => (
            <div
              key={i}
              className={`flex-1 rounded-t-sm transition-all ${candle.isBull ? 'bg-[hsl(162,91%,32%,0.5)]' : 'bg-[hsl(355,88%,58%,0.5)]'}`}
              style={{ height: `${(candle.volume / 150) * 100}%` }}
            />
          ))}
        </div>

        {/* Price Scale */}
        <div className="absolute right-0 top-4 bottom-16 w-16 flex flex-col justify-between text-right pr-1">
          {[maxPrice, (maxPrice + minPrice) / 2, minPrice].map((p, i) => (
            <span key={i} className="font-mono text-[9px] text-muted-foreground">{p.toFixed(2)}</span>
          ))}
        </div>

        {/* Current Price Line */}
        <div 
          className="absolute left-4 right-16 h-px bg-[hsl(224,100%,58%)]"
          style={{ top: 16 + getY((maxPrice + minPrice) / 2) }}
        >
          <div className="absolute right-0 -translate-y-1/2 px-2 py-0.5 bg-[hsl(224,100%,58%)] rounded-sm">
            <span className="font-mono text-[9px] text-white font-bold">
              {price.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Indicators Bar */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-[hsl(222,14%,17%)] bg-[hsl(223,18%,8%)]">
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[hsl(224,100%,58%)]" />
            <span className="text-muted-foreground">SMA(20)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[hsl(270,91%,65%)]" />
            <span className="text-muted-foreground">Support</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[hsl(43,96%,56%)]" />
            <span className="text-muted-foreground">Resistance</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[9px]">
            <Activity className="w-3 h-3 mr-1" />
            RSI: 58.3
          </Badge>
          <Badge className="bg-[hsl(43,96%,56%,0.15)] text-[hsl(43,96%,56%)] text-[9px]">
            <BarChart2 className="w-3 h-3 mr-1" />
            MACD: Bullish
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default SuperchartsWidget;
