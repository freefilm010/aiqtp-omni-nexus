import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { Layers, TrendingUp, TrendingDown, Activity, Zap } from "lucide-react";

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

const LevelIIOrderBook = () => {
  const { prices } = useMarketPrices();
  const [symbol, setSymbol] = useState('BTC');
  const [bids, setBids] = useState<OrderLevel[]>([]);
  const [asks, setAsks] = useState<OrderLevel[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [aggregation, setAggregation] = useState('0.01');

  const basePrice = prices[symbol]?.priceNumeric || 67500;

  useEffect(() => {
    // Generate Level II data
    const generateOrders = () => {
      const newBids: OrderLevel[] = [];
      const newAsks: OrderLevel[] = [];
      const exchanges = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit'];

      let bidTotal = 0;
      let askTotal = 0;

      for (let i = 0; i < 20; i++) {
        const bidPrice = basePrice - (i * 5) - Math.random() * 2;
        const bidSize = Math.random() * 5 + 0.1;
        bidTotal += bidSize;
        newBids.push({
          price: bidPrice,
          size: bidSize,
          total: bidTotal,
          orders: Math.floor(Math.random() * 50) + 1,
          exchange: exchanges[Math.floor(Math.random() * exchanges.length)]
        });

        const askPrice = basePrice + (i * 5) + Math.random() * 2;
        const askSize = Math.random() * 5 + 0.1;
        askTotal += askSize;
        newAsks.push({
          price: askPrice,
          size: askSize,
          total: askTotal,
          orders: Math.floor(Math.random() * 50) + 1,
          exchange: exchanges[Math.floor(Math.random() * exchanges.length)]
        });
      }

      setBids(newBids);
      setAsks(newAsks);
    };

    generateOrders();
    const interval = setInterval(generateOrders, 500);
    return () => clearInterval(interval);
  }, [basePrice, symbol]);

  useEffect(() => {
    // Generate trades
    const generateTrade = () => {
      const exchanges = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit'];
      const side: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
      const newTrade: Trade = {
        price: basePrice + (Math.random() - 0.5) * 10,
        size: Math.random() * 2 + 0.01,
        side,
        time: new Date(),
        exchange: exchanges[Math.floor(Math.random() * exchanges.length)]
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 49)]);
    };

    const interval = setInterval(generateTrade, 200);
    return () => clearInterval(interval);
  }, [basePrice]);

  const maxTotal = Math.max(
    bids.length > 0 ? bids[bids.length - 1]?.total || 0 : 0,
    asks.length > 0 ? asks[asks.length - 1]?.total || 0 : 0
  );

  const formatPrice = (price: number) => price.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });

  const formatSize = (size: number) => size.toFixed(4);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">BTC/USD</SelectItem>
                  <SelectItem value="ETH">ETH/USD</SelectItem>
                </SelectContent>
              </Select>
              <Select value={aggregation} onValueChange={setAggregation}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.01">$0.01</SelectItem>
                  <SelectItem value="0.1">$0.10</SelectItem>
                  <SelectItem value="1">$1.00</SelectItem>
                  <SelectItem value="10">$10.00</SelectItem>
                  <SelectItem value="100">$100.00</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-green-500 border-green-500">
                <Activity className="h-3 w-3 mr-1 animate-pulse" />
                LIVE FEED
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4">
        {/* Order Book */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Level II Order Book
            </CardTitle>
            <CardDescription>Real-time depth across multiple exchanges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Bids */}
              <div>
                <div className="grid grid-cols-5 text-xs text-muted-foreground mb-2 px-2">
                  <span>Exchange</span>
                  <span className="text-right">Orders</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Total</span>
                </div>
                <ScrollArea className="h-[400px]">
                  {bids.map((bid, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-5 text-sm py-1 px-2 relative"
                    >
                      <div
                        className="absolute inset-0 bg-green-500/20"
                        style={{ width: `${(bid.total / maxTotal) * 100}%` }}
                      />
                      <span className="relative text-xs text-muted-foreground">{bid.exchange}</span>
                      <span className="relative text-right text-muted-foreground">{bid.orders}</span>
                      <span className="relative text-right">{formatSize(bid.size)}</span>
                      <span className="relative text-right text-green-500 font-mono">
                        ${formatPrice(bid.price)}
                      </span>
                      <span className="relative text-right text-muted-foreground">
                        {formatSize(bid.total)}
                      </span>
                    </div>
                  ))}
                </ScrollArea>
              </div>

              {/* Asks */}
              <div>
                <div className="grid grid-cols-5 text-xs text-muted-foreground mb-2 px-2">
                  <span>Price</span>
                  <span className="text-right">Size</span>
                  <span className="text-right">Orders</span>
                  <span className="text-right">Exchange</span>
                  <span className="text-right">Total</span>
                </div>
                <ScrollArea className="h-[400px]">
                  {asks.map((ask, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-5 text-sm py-1 px-2 relative"
                    >
                      <div
                        className="absolute inset-0 bg-red-500/20 right-0"
                        style={{ width: `${(ask.total / maxTotal) * 100}%`, marginLeft: 'auto' }}
                      />
                      <span className="relative text-red-500 font-mono">
                        ${formatPrice(ask.price)}
                      </span>
                      <span className="relative text-right">{formatSize(ask.size)}</span>
                      <span className="relative text-right text-muted-foreground">{ask.orders}</span>
                      <span className="relative text-right text-xs text-muted-foreground">{ask.exchange}</span>
                      <span className="relative text-right text-muted-foreground">
                        {formatSize(ask.total)}
                      </span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>

            {/* Spread */}
            <div className="mt-4 p-3 rounded bg-muted/50 flex items-center justify-center gap-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Best Bid</p>
                <p className="text-lg font-bold text-green-500">
                  ${formatPrice(bids[0]?.price || 0)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Spread</p>
                <p className="text-lg font-bold">
                  ${((asks[0]?.price || 0) - (bids[0]?.price || 0)).toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Best Ask</p>
                <p className="text-lg font-bold text-red-500">
                  ${formatPrice(asks[0]?.price || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time & Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Time & Sales
            </CardTitle>
            <CardDescription>Real-time trade execution feed</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-4 text-xs text-muted-foreground py-2 px-4 border-b">
              <span>Time</span>
              <span className="text-right">Price</span>
              <span className="text-right">Size</span>
              <span className="text-right">Exch</span>
            </div>
            <ScrollArea className="h-[450px]">
              {trades.map((trade, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-4 text-sm py-1.5 px-4 border-b border-border/50 ${
                    trade.side === 'buy' ? 'bg-green-500/5' : 'bg-red-500/5'
                  }`}
                >
                  <span className="text-muted-foreground text-xs">
                    {trade.time.toLocaleTimeString()}
                  </span>
                  <span className={`text-right font-mono ${
                    trade.side === 'buy' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    ${formatPrice(trade.price)}
                  </span>
                  <span className="text-right">{formatSize(trade.size)}</span>
                  <span className="text-right text-xs text-muted-foreground">
                    {trade.exchange.slice(0, 3)}
                  </span>
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
