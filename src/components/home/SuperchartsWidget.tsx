import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useMarketPrices } from "@/hooks/useMarketPrices";
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
  Grid3X3,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isBull: boolean;
}

const SuperchartsWidget = () => {
  const [activeSymbol, setActiveSymbol] = useState('BTC');
  const [activeTimeframe, setActiveTimeframe] = useState('1H');
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const { getPrice, isLive } = useMarketPrices(5000);

  const symbols = ['BTC', 'ETH', 'SOL'];
  const timeframes = ['1M', '5M', '15M', '1H', '4H', '1D', '1W'];

  const currentPrice = getPrice(activeSymbol);
  const price = currentPrice?.priceNumeric || 0;
  const change = currentPrice?.changePercent || 0;

  useEffect(() => {
    fetchOHLCVData();
  }, [activeSymbol, activeTimeframe]);

  const fetchOHLCVData = async () => {
    setLoading(true);
    try {
      // Map symbol to CoinGecko ID
      const coinIdMap: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana'
      };
      const coinId = coinIdMap[activeSymbol] || 'bitcoin';

      // First try cached data
      const { data, error } = await supabase
        .from('market_ohlcv_cache')
        .select('*')
        .eq('symbol', activeSymbol)
        .eq('timeframe', activeTimeframe)
        .order('open_time', { ascending: true })
        .limit(40);

      if (!error && data && data.length > 0) {
        const mapped: Candle[] = data.map(c => ({
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
          volume: Number(c.volume) || 50,
          isBull: Number(c.close) > Number(c.open)
        }));
        setCandles(mapped);
        setLoading(false);
        return;
      }

      // Try to fetch from market_ohlcv table
      const { data: ohlcvData, error: ohlcvError } = await supabase
        .from('market_ohlcv')
        .select('*')
        .eq('coin_id', coinId)
        .order('open_time', { ascending: true })
        .limit(40);

      if (!ohlcvError && ohlcvData && ohlcvData.length > 0) {
        const mapped: Candle[] = ohlcvData.map(c => ({
          open: Number(c.open),
          high: Number(c.high),
          low: Number(c.low),
          close: Number(c.close),
          volume: Number(c.volume) || 50,
          isBull: Number(c.close) > Number(c.open)
        }));
        setCandles(mapped);
        setLoading(false);
        return;
      }

      // No cached OHLCV data - show empty state (no simulation)
      setCandles([]);
    } catch (err) {
      console.error('Error fetching OHLCV data:', err);
      setCandles([]);
    } finally {
      setLoading(false);
    }
  };

  const chartHeight = 200;
  const minPrice = candles.length > 0 ? Math.min(...candles.map(c => c.low)) : 0;
  const maxPrice = candles.length > 0 ? Math.max(...candles.map(c => c.high)) : 100;
  const priceRange = maxPrice - minPrice || 1;

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
            {symbols.map((sym) => (
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
              {price > 0 ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
            </span>
            {price > 0 && (
              <Badge className={`text-[9px] ${change >= 0 ? 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)]'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(2)}%
              </Badge>
            )}
            {isLive && (
              <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[8px]">
                LIVE
              </Badge>
            )}
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
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : candles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <BarChart2 className="h-12 w-12 mb-4 opacity-50" />
            <p className="font-medium">No Chart Data</p>
            <p className="text-sm">OHLCV data will appear when synced from market feeds.</p>
          </div>
        ) : (
          <>
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
                    <line x1={wickX} y1={highY} x2={wickX} y2={lowY} stroke={color} strokeWidth="1" />
                    <rect 
                      x={bodyX} 
                      y={bodyTop} 
                      width={bodyWidth} 
                      height={bodyHeight} 
                      fill={color}
                      rx="0.5"
                    />
                  </g>
                );
              })}

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
                  style={{ height: `${(candle.volume / Math.max(...candles.map(c => c.volume), 1)) * 100}%` }}
                />
              ))}
            </div>

            {/* Price Scale */}
            <div className="absolute right-0 top-4 bottom-16 w-16 flex flex-col justify-between text-right pr-1">
              {[maxPrice, (maxPrice + minPrice) / 2, minPrice].map((p, i) => (
                <span key={i} className="font-mono text-[9px] text-muted-foreground">{p.toFixed(2)}</span>
              ))}
            </div>
          </>
        )}
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
            RSI: --
          </Badge>
          <Badge className="bg-[hsl(43,96%,56%,0.15)] text-[hsl(43,96%,56%)] text-[9px]">
            <BarChart2 className="w-3 h-3 mr-1" />
            MACD: --
          </Badge>
        </div>
      </div>
    </Card>
  );
};

export default SuperchartsWidget;