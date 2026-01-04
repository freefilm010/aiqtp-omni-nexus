import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import {
  BarChart3,
  Search,
  TrendingUp,
  TrendingDown,
  Flame,
  AlertTriangle,
  ExternalLink,
  Filter,
  Zap,
  Shield
} from "lucide-react";

interface DEXPair {
  id: string;
  baseToken: string;
  quoteToken: string;
  dex: string;
  chain: string;
  price: number;
  priceChange5m: number;
  priceChange1h: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  txns24h: number;
  buys24h: number;
  sells24h: number;
  fdv: number;
  poolCreated: Date;
  priceData: { time: number; price: number }[];
  honeypot: boolean;
  verified: boolean;
}

const generatePairs = (): DEXPair[] => {
  const tokens = ['PEPE', 'WIF', 'BONK', 'DOGE', 'SHIB', 'FLOKI', 'MEME', 'TURBO', 'WOJAK', 'CHAD'];
  const dexes = ['Raydium', 'Uniswap', 'Jupiter', 'PancakeSwap', 'Orca'];
  const chains = ['Solana', 'Ethereum', 'Base', 'BSC'];

  return tokens.map((token, i) => {
    const priceData = Array.from({ length: 50 }, (_, j) => ({
      time: j,
      price: Math.random() * 0.001 * (1 + (Math.random() - 0.5) * j * 0.02)
    }));

    return {
      id: `pair-${i}`,
      baseToken: token,
      quoteToken: chains[i % 4] === 'Solana' ? 'SOL' : 'WETH',
      dex: dexes[i % 5],
      chain: chains[i % 4],
      price: priceData[priceData.length - 1].price,
      priceChange5m: (Math.random() - 0.45) * 20,
      priceChange1h: (Math.random() - 0.45) * 50,
      priceChange24h: (Math.random() - 0.4) * 200,
      volume24h: Math.random() * 5000000,
      liquidity: Math.random() * 2000000,
      txns24h: Math.floor(Math.random() * 10000),
      buys24h: Math.floor(Math.random() * 5000),
      sells24h: Math.floor(Math.random() * 5000),
      fdv: Math.random() * 50000000,
      poolCreated: new Date(Date.now() - Math.random() * 86400000 * 30),
      priceData,
      honeypot: Math.random() < 0.1,
      verified: Math.random() > 0.3
    };
  });
};

const DEXScreener = () => {
  const [pairs, setPairs] = useState<DEXPair[]>(() => generatePairs());
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState("all");
  const [dexFilter, setDexFilter] = useState("all");
  const [selectedPair, setSelectedPair] = useState<DEXPair | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setPairs(prev => prev.map(p => ({
        ...p,
        price: p.price * (1 + (Math.random() - 0.48) * 0.05),
        priceChange5m: (Math.random() - 0.45) * 20,
        volume24h: p.volume24h * (1 + (Math.random() - 0.5) * 0.1),
        priceData: [...p.priceData.slice(1), { time: 50, price: p.price }]
      })));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const filteredPairs = pairs.filter(p => {
    const matchesSearch = p.baseToken.toLowerCase().includes(search.toLowerCase());
    const matchesChain = chainFilter === 'all' || p.chain.toLowerCase() === chainFilter;
    const matchesDex = dexFilter === 'all' || p.dex.toLowerCase() === dexFilter.toLowerCase();
    return matchesSearch && matchesChain && matchesDex;
  });

  const formatNumber = (num: number) => {
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  const formatPrice = (price: number) => {
    if (price < 0.000001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(8);
    return price.toFixed(6);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pairs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dexFilter} onValueChange={setDexFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="DEX" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All DEXs</SelectItem>
                <SelectItem value="raydium">Raydium</SelectItem>
                <SelectItem value="uniswap">Uniswap</SelectItem>
                <SelectItem value="jupiter">Jupiter</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-green-500">
              <Zap className="h-3 w-3 mr-1 animate-pulse" />
              Live
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-6">
        {/* Pairs Table */}
        <Card className="col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              DEX Pairs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-9 text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
              <span>Pair</span>
              <span className="text-right">Price</span>
              <span className="text-right">5m</span>
              <span className="text-right">1h</span>
              <span className="text-right">24h</span>
              <span className="text-right">Volume</span>
              <span className="text-right">Liq</span>
              <span className="text-right">Txns</span>
              <span className="text-center">Chart</span>
            </div>
            <ScrollArea className="h-[500px]">
              {filteredPairs.map((pair) => (
                <div
                  key={pair.id}
                  className={`grid grid-cols-9 items-center px-4 py-3 border-b hover:bg-muted/50 cursor-pointer ${
                    selectedPair?.id === pair.id ? 'bg-primary/5' : ''
                  }`}
                  onClick={() => setSelectedPair(pair)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{pair.baseToken}</span>
                      <span className="text-muted-foreground">/{pair.quoteToken}</span>
                      {pair.verified && <Shield className="h-3 w-3 text-green-500" />}
                      {pair.honeypot && <AlertTriangle className="h-3 w-3 text-red-500" />}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs h-4">{pair.chain}</Badge>
                      <span>{pair.dex}</span>
                    </div>
                  </div>
                  <div className="text-right font-mono text-sm">
                    ${formatPrice(pair.price)}
                  </div>
                  <div className={`text-right text-sm ${pair.priceChange5m >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pair.priceChange5m >= 0 ? '+' : ''}{pair.priceChange5m.toFixed(1)}%
                  </div>
                  <div className={`text-right text-sm ${pair.priceChange1h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pair.priceChange1h >= 0 ? '+' : ''}{pair.priceChange1h.toFixed(1)}%
                  </div>
                  <div className={`text-right text-sm font-bold ${pair.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(0)}%
                  </div>
                  <div className="text-right text-sm">
                    {formatNumber(pair.volume24h)}
                  </div>
                  <div className="text-right text-sm">
                    {formatNumber(pair.liquidity)}
                  </div>
                  <div className="text-right text-sm">
                    {pair.txns24h.toLocaleString()}
                  </div>
                  <div className="h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={pair.priceData}>
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke={pair.priceChange24h >= 0 ? '#22c55e' : '#ef4444'}
                          fill={pair.priceChange24h >= 0 ? '#22c55e20' : '#ef444420'}
                          strokeWidth={1}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Pair Details */}
        <div className="space-y-4">
          {selectedPair ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {selectedPair.baseToken}/{selectedPair.quoteToken}
                      {selectedPair.verified && <Shield className="h-4 w-4 text-green-500" />}
                    </CardTitle>
                    <Button variant="ghost" size="icon">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Badge>{selectedPair.chain}</Badge>
                    <Badge variant="outline">{selectedPair.dex}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[150px] mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedPair.priceData}>
                        <XAxis dataKey="time" hide />
                        <YAxis hide domain={['dataMin', 'dataMax']} />
                        <Tooltip 
                          formatter={(value: number) => [`$${formatPrice(value)}`, 'Price']}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary) / 0.2)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold">${formatPrice(selectedPair.price)}</p>
                    <div className={`flex items-center justify-center gap-1 ${
                      selectedPair.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {selectedPair.priceChange24h >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {selectedPair.priceChange24h >= 0 ? '+' : ''}{selectedPair.priceChange24h.toFixed(1)}% (24h)
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="py-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">FDV</span>
                    <span className="font-bold">{formatNumber(selectedPair.fdv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Liquidity</span>
                    <span className="font-bold">{formatNumber(selectedPair.liquidity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Volume</span>
                    <span className="font-bold">{formatNumber(selectedPair.volume24h)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">24h Txns</span>
                    <span className="font-bold">{selectedPair.txns24h.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Buys / Sells</span>
                    <span>
                      <span className="text-green-500">{selectedPair.buys24h}</span>
                      {' / '}
                      <span className="text-red-500">{selectedPair.sells24h}</span>
                    </span>
                  </div>
                </CardContent>
              </Card>

              {selectedPair.honeypot && (
                <Card className="border-red-500/50 bg-red-500/5">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-red-500">
                      <AlertTriangle className="h-5 w-5" />
                      <span className="font-bold">Honeypot Detected!</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      This token may have sell restrictions
                    </p>
                  </CardContent>
                </Card>
              )}

              <Button className="w-full bg-green-500 hover:bg-green-600">
                Trade on {selectedPair.dex}
              </Button>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Select a pair to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DEXScreener;
