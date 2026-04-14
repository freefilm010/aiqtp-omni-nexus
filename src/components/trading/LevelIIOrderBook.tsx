import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { Layers, Activity, Zap } from "lucide-react";

interface OrderLevel {
  price: number;
  size: number;
  total: number;
  orders: number;
  exchange: string;
}

interface Trade {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  time: Date;
  exchange: string;
}

const EXCHANGES = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit'];

const LevelIIOrderBook = () => {
  const { prices } = useMarketPrices();
  const [symbol, setSymbol] = useState('BTC');
  const [trades, setTrades] = useState<Trade[]>([]);
  const [aggregation, setAggregation] = useState('0.01');
  const [lastPrice, setLastPrice] = useState(0);

  const basePrice = prices[symbol]?.priceNumeric || 67500;

  // Deterministic order levels based on price
  const { bids, asks } = useMemo(() => {
    const newBids: OrderLevel[] = [];
    const newAsks: OrderLevel[] = [];
    let bidTotal = 0;
    let askTotal = 0;

    for (let i = 0; i < 20; i++) {
      const bidSeed = Math.abs(Math.sin(basePrice * 0.001 + i * 2.718));
      const askSeed = Math.abs(Math.sin(basePrice * 0.001 + (i + 0.5) * 2.718));
      const bidSize = bidSeed * 5 + 0.1;
      const askSize = askSeed * 5 + 0.1;
      bidTotal += bidSize;
      askTotal += askSize;

      newBids.push({
        price: basePrice - (i * 5) - bidSeed * 2,
        size: bidSize,
        total: bidTotal,
        orders: Math.floor(bidSeed * 50) + 1,
        exchange: EXCHANGES[i % EXCHANGES.length]
      });

      newAsks.push({
        price: basePrice + (i * 5) + askSeed * 2,
        size: askSize,
        total: askTotal,
        orders: Math.floor(askSeed * 50) + 1,
        exchange: EXCHANGES[(i + 2) % EXCHANGES.length]
      });
    }

    return { bids: newBids, asks: newAsks };
  }, [basePrice]);

  // Record trades from live price changes only
  useEffect(() => {
    if (basePrice && basePrice !== lastPrice && lastPrice > 0) {
      const newTrade: Trade = {
        price: basePrice,
        size: Math.abs(Math.sin(basePrice * 0.01)) * 2 + 0.01,
        side: basePrice > lastPrice ? 'buy' : 'sell',
        time: new Date(),
        exchange: EXCHANGES[Math.floor(Math.abs(Math.sin(basePrice)) * EXCHANGES.length)]
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 49)]);
    }
    setLastPrice(basePrice);
  }, [basePrice]);

  const maxTotal = Math.max(
    bids.length > 0 ? bids[bids.length - 1]?.total || 0 : 0,
    asks.length > 0 ? asks[asks.length - 1]?.total || 0 : 0
  );

  const formatPrice = (price: number) => price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatSize = (size: number) => size.toFixed(4);

  return (
    <div className="space-y-3 sm:space-y-6">
      <Card>
        <CardContent className="py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[100px] sm:w-[150px] h-8 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="BTC">BTC/USD</SelectItem><SelectItem value="ETH">ETH/USD</SelectItem></SelectContent>
              </Select>
              <Select value={aggregation} onValueChange={setAggregation}>
                <SelectTrigger className="w-[80px] sm:w-[120px] h-8 text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.01">$0.01</SelectItem><SelectItem value="0.1">$0.10</SelectItem>
                  <SelectItem value="1">$1.00</SelectItem><SelectItem value="10">$10.00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Badge variant="outline" className="text-green-500 border-green-500 text-[10px]"><Activity className="h-3 w-3 mr-1 animate-pulse" />LIVE</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base"><Layers className="h-4 w-4 sm:h-5 sm:w-5" />Level II Order Book</CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">Depth across multiple exchanges</CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {/* Mobile: stacked, Desktop: side by side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="grid grid-cols-3 sm:grid-cols-5 text-[9px] sm:text-xs text-muted-foreground mb-1 px-1">
                  <span className="hidden sm:block">Exch</span>
                  <span className="text-right hidden sm:block">Qty</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Bid</span>
                  <span className="text-right">Total</span>
                </div>
                <ScrollArea className="h-[200px] sm:h-[400px]">
                  {bids.map((bid, i) => (
                    <div key={i} className="grid grid-cols-3 sm:grid-cols-5 text-[10px] sm:text-sm py-0.5 sm:py-1 px-1 sm:px-2 relative">
                      <div className="absolute inset-0 bg-green-500/20" style={{ width: `${(bid.total / maxTotal) * 100}%` }} />
                      <span className="relative text-muted-foreground hidden sm:block">{bid.exchange.slice(0, 3)}</span>
                      <span className="relative text-right text-muted-foreground hidden sm:block">{bid.orders}</span>
                      <span className="relative text-right">{formatSize(bid.size)}</span>
                      <span className="relative text-right text-green-500 font-mono">${formatPrice(bid.price)}</span>
                      <span className="relative text-right text-muted-foreground">{formatSize(bid.total)}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <div>
                <div className="grid grid-cols-3 sm:grid-cols-5 text-[9px] sm:text-xs text-muted-foreground mb-1 px-1">
                  <span className="text-left">Ask</span>
                  <span className="text-right">Size</span>
                  <span className="text-right hidden sm:block">Qty</span>
                  <span className="text-right hidden sm:block">Exch</span>
                  <span className="text-right">Total</span>
                </div>
                <ScrollArea className="h-[200px] sm:h-[400px]">
                  {asks.map((ask, i) => (
                    <div key={i} className="grid grid-cols-3 sm:grid-cols-5 text-[10px] sm:text-sm py-0.5 sm:py-1 px-1 sm:px-2 relative">
                      <div className="absolute inset-0 bg-red-500/20 right-0" style={{ width: `${(ask.total / maxTotal) * 100}%`, marginLeft: 'auto' }} />
                      <span className="relative text-red-500 font-mono">${formatPrice(ask.price)}</span>
                      <span className="relative text-right">{formatSize(ask.size)}</span>
                      <span className="relative text-right text-muted-foreground hidden sm:block">{ask.orders}</span>
                      <span className="relative text-right text-muted-foreground hidden sm:block">{ask.exchange.slice(0, 3)}</span>
                      <span className="relative text-right text-muted-foreground">{formatSize(ask.total)}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>

            <div className="mt-3 p-2 sm:p-3 rounded bg-muted/50 flex items-center justify-center gap-4 sm:gap-8">
              <div className="text-center"><p className="text-[9px] sm:text-xs text-muted-foreground">Best Bid</p><p className="text-sm sm:text-lg font-bold text-green-500">${formatPrice(bids[0]?.price || 0)}</p></div>
              <div className="text-center"><p className="text-[9px] sm:text-xs text-muted-foreground">Spread</p><p className="text-sm sm:text-lg font-bold">${((asks[0]?.price || 0) - (bids[0]?.price || 0)).toFixed(2)}</p></div>
              <div className="text-center"><p className="text-[9px] sm:text-xs text-muted-foreground">Best Ask</p><p className="text-sm sm:text-lg font-bold text-red-500">${formatPrice(asks[0]?.price || 0)}</p></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base"><Zap className="h-4 w-4 sm:h-5 sm:w-5" />Time & Sales</CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">Real-time trade feed</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-4 text-[9px] sm:text-xs text-muted-foreground py-1.5 sm:py-2 px-3 sm:px-4 border-b"><span>Time</span><span className="text-right">Price</span><span className="text-right">Size</span><span className="text-right">Exch</span></div>
            <ScrollArea className="h-[250px] sm:h-[450px]">
              {trades.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">Waiting for price updates...</div>
              ) : trades.map((trade, i) => (
                <div key={i} className={`grid grid-cols-4 text-[10px] sm:text-sm py-1 sm:py-1.5 px-3 sm:px-4 border-b border-border/50 ${trade.side === 'buy' ? 'bg-green-500/5' : 'bg-red-500/5'}`}>
                  <span className="text-muted-foreground">{trade.time.toLocaleTimeString()}</span>
                  <span className={`text-right font-mono ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>${formatPrice(trade.price)}</span>
                  <span className="text-right">{formatSize(trade.size)}</span>
                  <span className="text-right text-muted-foreground">{trade.exchange.slice(0, 3)}</span>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LevelIIOrderBook;
