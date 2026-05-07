import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import {
  BookOpen,
  Layers,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  BarChart3
} from "lucide-react";

interface OrderLevel {
  price: number;
  amount: number;
  total: number;
  exchanges: { name: string; amount: number }[];
  cumulative: number;
}

interface UnifiedBook {
  bids: OrderLevel[];
  asks: OrderLevel[];
  spread: number;
  spreadPercent: number;
  midPrice: number;
}

const exchanges = ['Binance', 'Coinbase', 'Kraken', 'KuCoin', 'OKX', 'Bybit'];
const pairs = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'XRP/USDT', 'BNB/USDT'];

// Deterministic pseudo-random generator for stable order book
const seededRandom = (seed: number) => {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
};

const generateUnifiedBook = (basePrice: number, seed: number): UnifiedBook => {
  const generateLevels = (side: 'bid' | 'ask', count: number): OrderLevel[] => {
    let cumulative = 0;
    const localSeed = seed + (side === 'bid' ? 0 : 1000);
    
    return Array.from({ length: count }, (_, i) => {
      const offset = side === 'bid' ? -(i + 1) * (basePrice * 0.0001) : (i + 1) * (basePrice * 0.0001);
      const price = basePrice + offset;
      
      // Deterministic exchange selection based on seed
      const numExchanges = Math.floor(seededRandom(localSeed + i) * 4) + 1;
      const exchangeOrder = exchanges.map((e, idx) => ({ name: e, sortVal: seededRandom(localSeed + i + idx) }))
        .sort((a, b) => a.sortVal - b.sortVal);
      
      const selectedExchanges = exchangeOrder
        .slice(0, numExchanges)
        .map((ex, idx) => ({
          name: ex.name,
          amount: seededRandom(localSeed + i * 10 + idx) * 5 + 0.1
        }));
      
      const amount = selectedExchanges.reduce((sum, e) => sum + e.amount, 0);
      const total = price * amount;
      cumulative += amount;
      
      return {
        price,
        amount,
        total,
        exchanges: selectedExchanges,
        cumulative
      };
    });
  };
  
  const bids = generateLevels('bid', 15);
  const asks = generateLevels('ask', 15);
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  
  return {
    bids,
    asks,
    spread: bestAsk - bestBid,
    spreadPercent: bestBid > 0 ? ((bestAsk - bestBid) / bestBid) * 100 : 0,
    midPrice: (bestBid + bestAsk) / 2
  };
};

const UnifiedOrderBook = () => {
  const { prices } = useMarketPrices(5000);
  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [grouping, setGrouping] = useState("0.5");
  const [showExchangeBreakdown, setShowExchangeBreakdown] = useState(true);
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(exchanges);
  const [updateSeed, setUpdateSeed] = useState(Date.now());
  
  // Get base price from real market data
  const baseSymbol = selectedPair.split('/')[0];
  const basePrice = prices[baseSymbol]?.priceNumeric || 
    (baseSymbol === 'BTC' ? 67500 : baseSymbol === 'ETH' ? 3500 : 100);
  
  const book = useMemo(() => generateUnifiedBook(basePrice, updateSeed), [basePrice, updateSeed]);
  
  // Update order book every 2 seconds with new seed
  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateSeed(Date.now());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const maxCumulative = Math.max(
    ...book.bids.map(b => b.cumulative),
    ...book.asks.map(a => a.cumulative)
  );

  const getDepthWidth = (cumulative: number) => {
    return (cumulative / maxCumulative) * 100;
  };

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Order Book */}
      <Card className="col-span-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Unified Order Book
              </CardTitle>
              <Select value={selectedPair} onValueChange={setSelectedPair}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {pairs.map(pair => (
                    <SelectItem key={pair} value={pair}>{pair}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs">Show Sources</Label>
                <Switch checked={showExchangeBreakdown} onCheckedChange={setShowExchangeBreakdown} />
              </div>
              <Select value={grouping} onValueChange={setGrouping}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Grouping" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">0.1</SelectItem>
                  <SelectItem value="0.5">0.5</SelectItem>
                  <SelectItem value="1">1.0</SelectItem>
                  <SelectItem value="5">5.0</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Spread indicator */}
          <div className="flex items-center justify-center py-2 bg-muted/30 border-y">
            <span className="text-sm text-muted-foreground mr-2">Spread:</span>
            <span className="font-mono font-medium">${book.spread.toFixed(2)}</span>
            <Badge variant="outline" className="ml-2">{book.spreadPercent.toFixed(4)}%</Badge>
          </div>

          <div className="grid grid-cols-2 divide-x">
            {/* Bids */}
            <div>
              <div className="grid grid-cols-4 text-xs text-muted-foreground px-4 py-2 bg-green-500/5">
                <span>Price (USDT)</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
                <span className="text-right">Depth</span>
              </div>
              <ScrollArea className="h-[400px]">
                {book.bids.map((level, i) => (
                  <div key={i} className="relative">
                    {/* Depth visualization */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-green-500/10"
                      style={{ width: `${getDepthWidth(level.cumulative)}%` }}
                    />
                    <div className="relative grid grid-cols-4 px-4 py-2 hover:bg-green-500/5">
                      <span className="font-mono text-green-500">
                        ${level.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-right font-mono">
                        {level.amount.toFixed(4)}
                      </span>
                      <span className="text-right font-mono text-muted-foreground">
                        ${level.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <div className="text-right">
                        {showExchangeBreakdown && (
                          <div className="flex justify-end gap-0.5">
                            {level.exchanges.map((ex, j) => (
                              <span 
                                key={j}
                                className="text-[10px] px-1 rounded bg-green-500/20 text-green-500"
                                title={`${ex.name}: ${ex.amount.toFixed(4)}`}
                              >
                                {ex.name.slice(0, 2)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>

            {/* Asks */}
            <div>
              <div className="grid grid-cols-4 text-xs text-muted-foreground px-4 py-2 bg-red-500/5">
                <span>Price (USDT)</span>
                <span className="text-right">Amount</span>
                <span className="text-right">Total</span>
                <span className="text-right">Depth</span>
              </div>
              <ScrollArea className="h-[400px]">
                {book.asks.map((level, i) => (
                  <div key={i} className="relative">
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-red-500/10"
                      style={{ width: `${getDepthWidth(level.cumulative)}%` }}
                    />
                    <div className="relative grid grid-cols-4 px-4 py-2 hover:bg-red-500/5">
                      <span className="font-mono text-red-500">
                        ${level.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-right font-mono">
                        {level.amount.toFixed(4)}
                      </span>
                      <span className="text-right font-mono text-muted-foreground">
                        ${level.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                      <div className="text-right">
                        {showExchangeBreakdown && (
                          <div className="flex justify-end gap-0.5">
                            {level.exchanges.map((ex, j) => (
                              <span 
                                key={j}
                                className="text-[10px] px-1 rounded bg-red-500/20 text-red-500"
                                title={`${ex.name}: ${ex.amount.toFixed(4)}`}
                              >
                                {ex.name.slice(0, 2)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Filter + Stats */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4" />
              Exchange Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {exchanges.map(exchange => (
                <div 
                  key={exchange}
                  className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                    selectedExchanges.includes(exchange) ? 'border-primary bg-primary/5' : 'opacity-50'
                  }`}
                  onClick={() => {
                    setSelectedExchanges(prev =>
                      prev.includes(exchange)
                        ? prev.filter(e => e !== exchange)
                        : [...prev, exchange]
                    );
                  }}
                >
                  <span className="font-medium">{exchange}</span>
                  <Switch checked={selectedExchanges.includes(exchange)} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              Book Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <p className="text-xs text-muted-foreground">Total Bid Depth</p>
                <p className="text-lg font-bold text-green-500">
                  {book.bids[book.bids.length - 1]?.cumulative.toFixed(2)} BTC
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10">
                <p className="text-xs text-muted-foreground">Total Ask Depth</p>
                <p className="text-lg font-bold text-red-500">
                  {book.asks[book.asks.length - 1]?.cumulative.toFixed(2)} BTC
                </p>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Mid Price</p>
              <p className="text-xl font-bold">${book.midPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>

            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">Buy/Sell Imbalance</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div 
                    className="h-full bg-green-500" 
                    style={{ 
                      width: `${(book.bids[book.bids.length - 1]?.cumulative / (book.bids[book.bids.length - 1]?.cumulative + book.asks[book.asks.length - 1]?.cumulative)) * 100}%` 
                    }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {((book.bids[book.bids.length - 1]?.cumulative / book.asks[book.asks.length - 1]?.cumulative) * 100 - 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UnifiedOrderBook;
