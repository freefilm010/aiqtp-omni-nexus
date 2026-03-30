import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { ArrowUp, ArrowDown, TrendingUp, Activity } from "lucide-react";

interface OrderBookEntry {
  price: number;
  size: number;
  total: number;
  percentage: number;
}

interface Trade {
  id: string;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: Date;
}

// Deterministic order book generation based on price — no Math.random()
const generateOrderBook = (basePrice: number, levels: number = 15): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } => {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0;
  let askTotal = 0;

  for (let i = 0; i < levels; i++) {
    // Use a seeded pattern based on price and level
    const seed = Math.abs(Math.sin(basePrice * 0.001 + i * 1.618)) * 5 + 0.1;
    const bidSize = seed;
    const askSize = Math.abs(Math.sin(basePrice * 0.001 + (i + 0.5) * 1.618)) * 5 + 0.1;
    bidTotal += bidSize;
    askTotal += askSize;

    bids.push({
      price: basePrice - (i + 1) * (basePrice * 0.0001),
      size: bidSize,
      total: bidTotal,
      percentage: 0
    });

    asks.push({
      price: basePrice + (i + 1) * (basePrice * 0.0001),
      size: askSize,
      total: askTotal,
      percentage: 0
    });
  }

  const maxTotal = Math.max(bidTotal, askTotal);
  bids.forEach(b => b.percentage = (b.total / maxTotal) * 100);
  asks.forEach(a => a.percentage = (a.total / maxTotal) * 100);

  return { bids, asks };
};

interface OrderBookProps {
  symbol?: string;
  basePrice?: number;
}

const OrderBook = ({ symbol = "BTC/USDT", basePrice = 67500 }: OrderBookProps) => {
  const { prices } = useMarketPrices(5000);
  const livePrice = prices['BTC']?.priceNumeric || basePrice;
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastPrice, setLastPrice] = useState(livePrice);
  const [priceChange, setPriceChange] = useState<'up' | 'down' | null>(null);

  const orderBook = useMemo(() => generateOrderBook(livePrice), [livePrice]);

  useEffect(() => {
    if (livePrice && livePrice !== lastPrice) {
      setPriceChange(livePrice > lastPrice ? 'up' : 'down');
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        price: livePrice,
        size: Math.abs(Math.sin(livePrice * 0.01)) * 2 + 0.01,
        side: livePrice > lastPrice ? 'buy' : 'sell',
        timestamp: new Date()
      };
      setTrades(prev => [newTrade, ...prev.slice(0, 49)]);
      setLastPrice(livePrice);
    }
  }, [livePrice]);

  const spread = orderBook.asks[0]?.price - orderBook.bids[0]?.price;
  const spreadPercent = (spread / lastPrice) * 100;

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">{symbol}</CardTitle>
            <Badge variant="outline"><Activity className="h-3 w-3 mr-1" />Live</Badge>
          </div>
          <span className={`text-xl font-bold flex items-center gap-1 ${priceChange === 'up' ? 'text-green-500' : 'text-red-500'}`}>
            {priceChange === 'up' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
            ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(4)}%)</span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="book" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="book" className="flex-1">Order Book</TabsTrigger>
            <TabsTrigger value="trades" className="flex-1">Recent Trades</TabsTrigger>
          </TabsList>

          <TabsContent value="book" className="m-0">
            <div className="grid grid-cols-2 divide-x">
              <div>
                <div className="grid grid-cols-3 text-xs text-muted-foreground px-2 py-1 border-b bg-muted/30"><span>Price</span><span className="text-right">Size</span><span className="text-right">Total</span></div>
                <ScrollArea className="h-[300px]">
                  {orderBook.bids.map((bid, i) => (
                    <div key={i} className="grid grid-cols-3 text-xs px-2 py-1 relative hover:bg-muted/50">
                      <div className="absolute inset-0 bg-green-500/10" style={{ width: `${bid.percentage}%` }} />
                      <span className="text-green-500 relative z-10">{bid.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-right relative z-10">{bid.size.toFixed(4)}</span>
                      <span className="text-right text-muted-foreground relative z-10">{bid.total.toFixed(4)}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
              <div>
                <div className="grid grid-cols-3 text-xs text-muted-foreground px-2 py-1 border-b bg-muted/30"><span>Price</span><span className="text-right">Size</span><span className="text-right">Total</span></div>
                <ScrollArea className="h-[300px]">
                  {orderBook.asks.map((ask, i) => (
                    <div key={i} className="grid grid-cols-3 text-xs px-2 py-1 relative hover:bg-muted/50">
                      <div className="absolute inset-0 right-0 bg-red-500/10" style={{ width: `${ask.percentage}%` }} />
                      <span className="text-red-500 relative z-10">{ask.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      <span className="text-right relative z-10">{ask.size.toFixed(4)}</span>
                      <span className="text-right text-muted-foreground relative z-10">{ask.total.toFixed(4)}</span>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="trades" className="m-0">
            <div className="grid grid-cols-4 text-xs text-muted-foreground px-2 py-1 border-b bg-muted/30"><span>Price</span><span className="text-right">Size</span><span className="text-right">Side</span><span className="text-right">Time</span></div>
            <ScrollArea className="h-[300px]">
              {trades.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">Waiting for trades...</div>
              ) : trades.map((trade) => (
                <div key={trade.id} className="grid grid-cols-4 text-xs px-2 py-1 hover:bg-muted/50">
                  <span className={trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}>{trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  <span className="text-right">{trade.size.toFixed(4)}</span>
                  <span className={`text-right ${trade.side === 'buy' ? 'text-green-500' : 'text-red-500'}`}>{trade.side.toUpperCase()}</span>
                  <span className="text-right text-muted-foreground">{trade.timestamp.toLocaleTimeString()}</span>
                </div>
              ))}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default OrderBook;
