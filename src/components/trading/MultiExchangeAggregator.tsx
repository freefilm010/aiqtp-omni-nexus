import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRightLeft,
  Search,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  RefreshCw,
  Shield,
  DollarSign
} from "lucide-react";

interface Exchange {
  id: string;
  name: string;
  type: 'cex' | 'dex';
  chain?: string;
  logo: string;
  volume24h: number;
  pairs: number;
  fee: number;
  status: 'online' | 'degraded' | 'offline';
}

interface AggregatedPrice {
  exchange: string;
  price: number;
  volume: number;
  spread: number;
  lastUpdate: Date;
}

const exchanges: Exchange[] = [
  { id: 'binance', name: 'Binance', type: 'cex', logo: '🟡', volume24h: 28500000000, pairs: 1456, fee: 0.1, status: 'online' },
  { id: 'coinbase', name: 'Coinbase', type: 'cex', logo: '🔵', volume24h: 8200000000, pairs: 584, fee: 0.5, status: 'online' },
  { id: 'kraken', name: 'Kraken', type: 'cex', logo: '🟣', volume24h: 3500000000, pairs: 642, fee: 0.26, status: 'online' },
  { id: 'kucoin', name: 'KuCoin', type: 'cex', logo: '🟢', volume24h: 2800000000, pairs: 892, fee: 0.1, status: 'online' },
  { id: 'okx', name: 'OKX', type: 'cex', logo: '⚫', volume24h: 4200000000, pairs: 756, fee: 0.08, status: 'online' },
  { id: 'bybit', name: 'Bybit', type: 'cex', logo: '🟠', volume24h: 5600000000, pairs: 512, fee: 0.1, status: 'online' },
  { id: 'uniswap', name: 'Uniswap V3', type: 'dex', chain: 'Ethereum', logo: '🦄', volume24h: 1850000000, pairs: 3200, fee: 0.3, status: 'online' },
  { id: 'raydium', name: 'Raydium', type: 'dex', chain: 'Solana', logo: '☀️', volume24h: 890000000, pairs: 1456, fee: 0.25, status: 'online' },
  { id: 'pancakeswap', name: 'PancakeSwap', type: 'dex', chain: 'BSC', logo: '🥞', volume24h: 650000000, pairs: 2100, fee: 0.25, status: 'online' },
  { id: 'jupiter', name: 'Jupiter', type: 'dex', chain: 'Solana', logo: '🪐', volume24h: 1200000000, pairs: 890, fee: 0.2, status: 'online' },
  { id: 'orca', name: 'Orca', type: 'dex', chain: 'Solana', logo: '🐋', volume24h: 420000000, pairs: 456, fee: 0.3, status: 'online' },
  { id: 'curve', name: 'Curve Finance', type: 'dex', chain: 'Ethereum', logo: '🌀', volume24h: 380000000, pairs: 128, fee: 0.04, status: 'online' },
];

const generatePrices = (basePrice: number): AggregatedPrice[] => {
  return exchanges.map(ex => ({
    exchange: ex.name,
    price: basePrice * (1 + (Math.random() - 0.5) * 0.002),
    volume: Math.random() * 1000000,
    spread: Math.random() * 0.1,
    lastUpdate: new Date()
  }));
};

const MultiExchangeAggregator = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("BTC/USDT");
  const [basePrice] = useState(67500);
  const [prices, setPrices] = useState<AggregatedPrice[]>(() => generatePrices(basePrice));
  const [filter, setFilter] = useState<'all' | 'cex' | 'dex'>('all');
  const [search, setSearch] = useState("");
  const [selectedExchanges, setSelectedExchanges] = useState<string[]>(exchanges.map(e => e.id));

  // Update prices
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(generatePrices(basePrice));
    }, 2000);
    return () => clearInterval(interval);
  }, [basePrice]);

  const filteredExchanges = exchanges.filter(ex => {
    const matchesType = filter === 'all' || ex.type === filter;
    const matchesSearch = ex.name.toLowerCase().includes(search.toLowerCase());
    const isSelected = selectedExchanges.includes(ex.id);
    return matchesType && matchesSearch && isSelected;
  });

  const bestBid = Math.max(...prices.map(p => p.price));
  const bestAsk = Math.min(...prices.map(p => p.price));
  const arbitrageOpportunity = ((bestBid - bestAsk) / bestAsk * 100);

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    return `$${vol.toLocaleString()}`;
  };

  const toggleExchange = (id: string) => {
    setSelectedExchanges(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Multi-Exchange Aggregator
          </CardTitle>
          <div className="flex items-center gap-2">
            {arbitrageOpportunity > 0.1 && (
              <Badge variant="default" className="bg-green-500">
                <Zap className="h-3 w-3 mr-1" />
                Arb: {arbitrageOpportunity.toFixed(3)}%
              </Badge>
            )}
          </div>
        </div>

        {/* Best prices summary */}
        <div className="grid grid-cols-3 gap-4 mt-4 p-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Best Bid</p>
            <p className="text-lg font-bold text-green-500">${bestBid.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Spread</p>
            <p className="text-lg font-bold">${(bestBid - bestAsk).toFixed(2)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Best Ask</p>
            <p className="text-lg font-bold text-red-500">${bestAsk.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search exchanges..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'cex', 'dex'] as const).map((type) => (
              <Button
                key={type}
                variant={filter === type ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(type)}
              >
                {type.toUpperCase()}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="prices">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="prices" className="flex-1">Live Prices</TabsTrigger>
            <TabsTrigger value="exchanges" className="flex-1">Exchanges</TabsTrigger>
            <TabsTrigger value="routing" className="flex-1">Smart Routing</TabsTrigger>
          </TabsList>

          <TabsContent value="prices" className="m-0">
            <div className="grid grid-cols-5 text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
              <span>Exchange</span>
              <span className="text-right">Price</span>
              <span className="text-right">Spread</span>
              <span className="text-right">Volume</span>
              <span className="text-right">Status</span>
            </div>
            <ScrollArea className="h-[350px]">
              {prices
                .filter(p => filteredExchanges.some(e => e.name === p.exchange))
                .sort((a, b) => b.price - a.price)
                .map((price, i) => {
                  const exchange = exchanges.find(e => e.name === price.exchange);
                  const isBest = price.price === bestBid;
                  return (
                    <div
                      key={price.exchange}
                      className={`grid grid-cols-5 items-center px-4 py-3 border-b hover:bg-muted/50 ${isBest ? 'bg-green-500/10' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{exchange?.logo}</span>
                        <div>
                          <span className="font-medium">{price.exchange}</span>
                          {exchange?.chain && (
                            <p className="text-xs text-muted-foreground">{exchange.chain}</p>
                          )}
                        </div>
                        {isBest && <Badge className="bg-green-500 ml-2">Best</Badge>}
                      </div>
                      <div className="text-right font-mono">
                        ${price.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-right text-muted-foreground">
                        {price.spread.toFixed(4)}%
                      </div>
                      <div className="text-right text-muted-foreground">
                        {formatVolume(price.volume)}
                      </div>
                      <div className="text-right">
                        <span className="flex items-center justify-end gap-1">
                          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs text-muted-foreground">
                            {Math.floor((Date.now() - price.lastUpdate.getTime()) / 1000)}s
                          </span>
                        </span>
                      </div>
                    </div>
                  );
                })}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="exchanges" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="grid grid-cols-2 gap-3 p-4">
                {exchanges.map((exchange) => (
                  <div
                    key={exchange.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedExchanges.includes(exchange.id) 
                        ? 'border-primary bg-primary/5' 
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => toggleExchange(exchange.id)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{exchange.logo}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{exchange.name}</span>
                          <Badge variant={exchange.type === 'cex' ? 'default' : 'secondary'}>
                            {exchange.type.toUpperCase()}
                          </Badge>
                        </div>
                        {exchange.chain && (
                          <p className="text-xs text-muted-foreground">{exchange.chain}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                      <div>
                        <p className="text-muted-foreground">24h Volume</p>
                        <p className="font-medium">{formatVolume(exchange.volume24h)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Pairs</p>
                        <p className="font-medium">{exchange.pairs}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fee</p>
                        <p className="font-medium">{exchange.fee}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <span className="flex items-center gap-1">
                          <span className={`h-2 w-2 rounded-full ${
                            exchange.status === 'online' ? 'bg-green-500' : 'bg-amber-500'
                          }`} />
                          {exchange.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="routing" className="m-0 p-4">
            <div className="space-y-4">
              <div className="p-4 rounded-lg border">
                <h4 className="font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  Smart Order Routing
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Automatically routes orders across multiple exchanges for best execution
                </p>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Avg. Improvement</p>
                    <p className="text-lg font-bold text-green-500">0.15%</p>
                  </div>
                  <div className="p-3 rounded bg-muted/50">
                    <p className="text-xs text-muted-foreground">Orders Routed</p>
                    <p className="text-lg font-bold">12,458</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg border">
                <h4 className="font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  MEV Protection
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Protects DEX trades from front-running and sandwich attacks
                </p>
                <Badge variant="outline" className="mt-2">Active</Badge>
              </div>

              <div className="p-4 rounded-lg border">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-amber-500" />
                  Gas Optimization
                </h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Batches and optimizes transactions for lower gas costs
                </p>
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Avg. Gas Saved</p>
                  <p className="font-bold">32%</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MultiExchangeAggregator;
