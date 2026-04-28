import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, Search, TrendingUp, TrendingDown, AlertTriangle, Zap, Shield
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
  honeypot: boolean;
  verified: boolean;
}

const DEXScreener = () => {
  const [pairs, setPairs] = useState<DEXPair[]>([]);
  const [search, setSearch] = useState("");
  const [chainFilter, setChainFilter] = useState("all");
  const [dexFilter, setDexFilter] = useState("all");
  const [selectedPair, setSelectedPair] = useState<DEXPair | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPairs();
    const channel = supabase
      .channel(`dex-pairs-rt-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dex_pairs' }, () => fetchPairs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchPairs = async () => {
    const { data } = await supabase.from('dex_pairs').select('*').order('volume_24h', { ascending: false }).limit(50);
    if (data) {
      setPairs(data.map((d: any) => ({
        id: d.id,
        baseToken: d.base_token,
        quoteToken: d.quote_token,
        dex: d.dex,
        chain: d.chain,
        price: Number(d.price),
        priceChange5m: Number(d.price_change_5m),
        priceChange1h: Number(d.price_change_1h),
        priceChange24h: Number(d.price_change_24h),
        volume24h: Number(d.volume_24h),
        liquidity: Number(d.liquidity),
        txns24h: d.txns_24h,
        buys24h: d.buys_24h,
        sells24h: d.sells_24h,
        fdv: Number(d.fdv),
        honeypot: d.is_honeypot,
        verified: d.is_verified,
      })));
    }
    setLoading(false);
  };

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
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search pairs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Chain" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="base">Base</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dexFilter} onValueChange={setDexFilter}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="DEX" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All DEXs</SelectItem>
                <SelectItem value="raydium">Raydium</SelectItem>
                <SelectItem value="uniswap">Uniswap</SelectItem>
                <SelectItem value="jupiter">Jupiter</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-green-500">
              <Zap className="h-3 w-3 mr-1 animate-pulse" />Live
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="py-3">
            <CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" />DEX Pairs</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-8 text-xs text-muted-foreground px-4 py-2 border-b bg-muted/30">
              <span>Pair</span><span className="text-right">Price</span><span className="text-right">5m</span>
              <span className="text-right">1h</span><span className="text-right">24h</span>
              <span className="text-right">Volume</span><span className="text-right">Liq</span><span className="text-right">Txns</span>
            </div>
            <ScrollArea className="h-[500px]">
              {loading ? (
                <div className="flex items-center justify-center py-20 text-muted-foreground">Loading DEX pairs...</div>
              ) : filteredPairs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mb-4 opacity-50" />
                  <p>No DEX pairs tracked yet</p>
                </div>
              ) : filteredPairs.map((pair) => (
                <div key={pair.id} className={`grid grid-cols-8 items-center px-4 py-3 border-b hover:bg-muted/50 cursor-pointer ${selectedPair?.id === pair.id ? 'bg-primary/5' : ''}`} onClick={() => setSelectedPair(pair)}>
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
                  <div className="text-right font-mono text-sm">${formatPrice(pair.price)}</div>
                  <div className={`text-right text-sm ${pair.priceChange5m >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pair.priceChange5m >= 0 ? '+' : ''}{pair.priceChange5m.toFixed(1)}%</div>
                  <div className={`text-right text-sm ${pair.priceChange1h >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pair.priceChange1h >= 0 ? '+' : ''}{pair.priceChange1h.toFixed(1)}%</div>
                  <div className={`text-right text-sm font-bold ${pair.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>{pair.priceChange24h >= 0 ? '+' : ''}{pair.priceChange24h.toFixed(0)}%</div>
                  <div className="text-right text-sm">{formatNumber(pair.volume24h)}</div>
                  <div className="text-right text-sm">{formatNumber(pair.liquidity)}</div>
                  <div className="text-right text-sm">{pair.txns24h.toLocaleString()}</div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {selectedPair ? (
            <>
              <Card>
                <CardContent className="py-4 space-y-3">
                  <h3 className="font-bold text-lg">{selectedPair.baseToken}/{selectedPair.quoteToken}</h3>
                  <div className="flex gap-2"><Badge>{selectedPair.chain}</Badge><Badge variant="outline">{selectedPair.dex}</Badge></div>
                  <p className="text-3xl font-bold">${formatPrice(selectedPair.price)}</p>
                  <div className={`flex items-center gap-1 ${selectedPair.priceChange24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {selectedPair.priceChange24h >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {selectedPair.priceChange24h >= 0 ? '+' : ''}{selectedPair.priceChange24h.toFixed(1)}% (24h)
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between"><span className="text-muted-foreground">FDV</span><span className="font-bold">{formatNumber(selectedPair.fdv)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Liquidity</span><span className="font-bold">{formatNumber(selectedPair.liquidity)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">24h Volume</span><span className="font-bold">{formatNumber(selectedPair.volume24h)}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Buys / Sells</span><span><span className="text-green-500">{selectedPair.buys24h}</span> / <span className="text-red-500">{selectedPair.sells24h}</span></span></div>
                  </div>
                </CardContent>
              </Card>
              {selectedPair.honeypot && (
                <Card className="border-red-500/50 bg-red-500/5">
                  <CardContent className="py-4">
                    <div className="flex items-center gap-2 text-red-500"><AlertTriangle className="h-5 w-5" /><span className="font-bold">Honeypot Detected!</span></div>
                    <p className="text-sm text-muted-foreground mt-1">This token may have sell restrictions</p>
                  </CardContent>
                </Card>
              )}
              <Button className="w-full bg-green-500 hover:bg-green-600">Trade on {selectedPair.dex}</Button>
            </>
          ) : (
            <Card><CardContent className="py-12 text-center"><BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Select a pair to view details</p></CardContent></Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default DEXScreener;
