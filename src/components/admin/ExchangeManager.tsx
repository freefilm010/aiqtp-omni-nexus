import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  ArrowUpDown, Plus, TrendingUp, TrendingDown, DollarSign, 
  Activity, Droplets, Settings, RefreshCw, Zap
} from "lucide-react";

interface TradingPair {
  id: string;
  base_token_id: string;
  quote_currency: string;
  pair_symbol: string;
  is_active: boolean;
  last_price: number;
  bid_price: number;
  ask_price: number;
  maker_fee_percent: number;
  taker_fee_percent: number;
  volume_24h: number;
  trades_24h: number;
}

interface PriceFeed {
  id: string;
  token_id: string;
  base_currency: string;
  price: number;
  change_24h_percent: number;
  volume_24h: number;
  market_cap: number;
  last_updated: string;
}

interface LiquidityPool {
  id: string;
  pair_id: string;
  base_token_reserve: number;
  quote_reserve: number;
  total_liquidity: number;
  fee_percent: number;
  is_active: boolean;
  auto_market_make: boolean;
  spread_percent: number;
}

interface Token {
  id: string;
  symbol: string;
  name: string;
}

export default function ExchangeManager() {
  const [pairs, setPairs] = useState<TradingPair[]>([]);
  const [priceFeeds, setPriceFeeds] = useState<PriceFeed[]>([]);
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPairDialog, setShowPairDialog] = useState(false);
  const [showPriceDialog, setShowPriceDialog] = useState(false);
  const [selectedPair, setSelectedPair] = useState<TradingPair | null>(null);

  const [newPair, setNewPair] = useState({
    base_token_id: '',
    quote_currency: 'USD',
    initial_price: 0.001,
    maker_fee: 0.1,
    taker_fee: 0.15,
  });

  const [priceUpdate, setPriceUpdate] = useState({
    token_id: '',
    base_currency: 'USD',
    new_price: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [pairsRes, feedsRes, poolsRes, tokensRes] = await Promise.all([
      supabase.from('exchange_pairs').select('*').order('pair_symbol'),
      supabase.from('token_price_feeds').select('*'),
      supabase.from('exchange_liquidity_pools').select('*'),
      supabase.from('platform_tokens').select('id, symbol, name').eq('is_active', true),
    ]);

    if (pairsRes.data) setPairs(pairsRes.data);
    if (feedsRes.data) setPriceFeeds(feedsRes.data);
    if (poolsRes.data) setPools(poolsRes.data);
    if (tokensRes.data) setTokens(tokensRes.data);
    setLoading(false);
  };

  const createTradingPair = async () => {
    const token = tokens.find(t => t.id === newPair.base_token_id);
    if (!token) return;

    const pairSymbol = `${token.symbol}/${newPair.quote_currency}`;
    const spread = 0.001; // 0.1% spread

    const { error } = await supabase.from('exchange_pairs').insert({
      base_token_id: newPair.base_token_id,
      quote_currency: newPair.quote_currency,
      pair_symbol: pairSymbol,
      last_price: newPair.initial_price,
      bid_price: newPair.initial_price * (1 - spread),
      ask_price: newPair.initial_price * (1 + spread),
      maker_fee_percent: newPair.maker_fee,
      taker_fee_percent: newPair.taker_fee,
      is_active: true,
    });

    if (error) {
      toast.error('Failed to create trading pair');
      console.error(error);
    } else {
      toast.success(`${pairSymbol} pair created!`);
      setShowPairDialog(false);
      fetchData();
    }
  };

  const updateTokenPrice = async () => {
    const { error } = await supabase.rpc('update_token_price', {
      p_token_id: priceUpdate.token_id,
      p_base_currency: priceUpdate.base_currency,
      p_new_price: priceUpdate.new_price,
    });

    if (error) {
      toast.error('Failed to update price');
      console.error(error);
    } else {
      toast.success('Price updated successfully!');
      setShowPriceDialog(false);
      fetchData();
    }
  };

  const togglePairActive = async (pair: TradingPair) => {
    const { error } = await supabase
      .from('exchange_pairs')
      .update({ is_active: !pair.is_active })
      .eq('id', pair.id);

    if (error) {
      toast.error('Failed to update pair');
    } else {
      toast.success(`${pair.pair_symbol} ${!pair.is_active ? 'activated' : 'deactivated'}`);
      fetchData();
    }
  };

  const addLiquidity = async (pairId: string, baseAmount: number, quoteAmount: number) => {
    // Check if pool exists
    const existingPool = pools.find(p => p.pair_id === pairId);
    
    if (existingPool) {
      const { error } = await supabase
        .from('exchange_liquidity_pools')
        .update({
          base_token_reserve: Number(existingPool.base_token_reserve) + baseAmount,
          quote_reserve: Number(existingPool.quote_reserve) + quoteAmount,
          total_liquidity: Number(existingPool.total_liquidity) + (baseAmount + quoteAmount),
        })
        .eq('id', existingPool.id);

      if (error) {
        toast.error('Failed to add liquidity');
      } else {
        toast.success('Liquidity added!');
        fetchData();
      }
    } else {
      const { error } = await supabase.from('exchange_liquidity_pools').insert({
        pair_id: pairId,
        base_token_reserve: baseAmount,
        quote_reserve: quoteAmount,
        total_liquidity: baseAmount + quoteAmount,
        is_active: true,
        auto_market_make: true,
      });

      if (error) {
        toast.error('Failed to create liquidity pool');
      } else {
        toast.success('Liquidity pool created!');
        fetchData();
      }
    }
  };

  const getTokenSymbol = (tokenId: string) => {
    return tokens.find(t => t.id === tokenId)?.symbol || 'Unknown';
  };

  const getPairPool = (pairId: string) => {
    return pools.find(p => p.pair_id === pairId);
  };

  const formatPrice = (price: number) => {
    if (price < 0.00001) return price.toExponential(4);
    if (price < 0.01) return price.toFixed(8);
    if (price < 1) return price.toFixed(6);
    return price.toFixed(4);
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const totalVolume = pairs.reduce((acc, p) => acc + Number(p.volume_24h), 0);
  const totalTrades = pairs.reduce((acc, p) => acc + Number(p.trades_24h), 0);
  const activePairs = pairs.filter(p => p.is_active).length;
  const totalLiquidity = pools.reduce((acc, p) => acc + Number(p.total_liquidity), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trading Pairs</p>
                <p className="text-3xl font-bold">{activePairs}</p>
                <p className="text-xs text-muted-foreground">{pairs.length} total</p>
              </div>
              <ArrowUpDown className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-3xl font-bold">${formatNumber(totalVolume)}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">24h Trades</p>
                <p className="text-3xl font-bold">{formatNumber(totalTrades)}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/20 to-purple-500/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Liquidity</p>
                <p className="text-3xl font-bold">${formatNumber(totalLiquidity)}</p>
              </div>
              <Droplets className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pairs" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pairs" className="gap-2">
              <ArrowUpDown className="h-4 w-4" /> Trading Pairs
            </TabsTrigger>
            <TabsTrigger value="prices" className="gap-2">
              <DollarSign className="h-4 w-4" /> Price Feeds
            </TabsTrigger>
            <TabsTrigger value="liquidity" className="gap-2">
              <Droplets className="h-4 w-4" /> Liquidity Pools
            </TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Dialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Update Price
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Update Token Price</DialogTitle>
                  <DialogDescription>
                    Set a new price for a token (affects all trading pairs)
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>Token</Label>
                    <Select
                      value={priceUpdate.token_id}
                      onValueChange={(v) => setPriceUpdate({ ...priceUpdate, token_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select token" />
                      </SelectTrigger>
                      <SelectContent>
                        {tokens.map(token => (
                          <SelectItem key={token.id} value={token.id}>
                            ${token.symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quote Currency</Label>
                      <Select
                        value={priceUpdate.base_currency}
                        onValueChange={(v) => setPriceUpdate({ ...priceUpdate, base_currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>New Price</Label>
                      <Input
                        type="number"
                        step="0.00000001"
                        value={priceUpdate.new_price}
                        onChange={(e) => setPriceUpdate({ ...priceUpdate, new_price: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPriceDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateTokenPrice} disabled={!priceUpdate.token_id || !priceUpdate.new_price}>
                    Update Price
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showPairDialog} onOpenChange={setShowPairDialog}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" /> New Pair
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Trading Pair</DialogTitle>
                  <DialogDescription>
                    Add a new trading pair to the exchange
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Base Token</Label>
                      <Select
                        value={newPair.base_token_id}
                        onValueChange={(v) => setNewPair({ ...newPair, base_token_id: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select token" />
                        </SelectTrigger>
                        <SelectContent>
                          {tokens.map(token => (
                            <SelectItem key={token.id} value={token.id}>
                              ${token.symbol}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quote Currency</Label>
                      <Select
                        value={newPair.quote_currency}
                        onValueChange={(v) => setNewPair({ ...newPair, quote_currency: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="BTC">BTC</SelectItem>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="USDT">USDT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Initial Price ({newPair.quote_currency})</Label>
                    <Input
                      type="number"
                      step="0.00000001"
                      value={newPair.initial_price}
                      onChange={(e) => setNewPair({ ...newPair, initial_price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maker Fee (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newPair.maker_fee}
                        onChange={(e) => setNewPair({ ...newPair, maker_fee: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taker Fee (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newPair.taker_fee}
                        onChange={(e) => setNewPair({ ...newPair, taker_fee: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowPairDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTradingPair} disabled={!newPair.base_token_id}>
                    Create Pair
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value="pairs">
          <Card>
            <CardHeader>
              <CardTitle>Trading Pairs</CardTitle>
              <CardDescription>
                Configure trading pairs with real-time prices tied to market values
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead className="text-right">Last Price</TableHead>
                    <TableHead className="text-right">Bid</TableHead>
                    <TableHead className="text-right">Ask</TableHead>
                    <TableHead className="text-right">Spread</TableHead>
                    <TableHead className="text-right">24h Volume</TableHead>
                    <TableHead className="text-right">Fees (M/T)</TableHead>
                    <TableHead>Liquidity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pairs.map(pair => {
                    const pool = getPairPool(pair.id);
                    const spread = pair.ask_price && pair.bid_price 
                      ? ((pair.ask_price - pair.bid_price) / pair.bid_price * 100).toFixed(2)
                      : '0.00';
                    
                    return (
                      <TableRow key={pair.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-xs font-bold">
                                {pair.pair_symbol.split('/')[0].slice(0, 2)}
                              </span>
                            </div>
                            <span className="font-medium">{pair.pair_symbol}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatPrice(Number(pair.last_price))}
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-500">
                          {formatPrice(Number(pair.bid_price))}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-500">
                          {formatPrice(Number(pair.ask_price))}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {spread}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          ${formatNumber(Number(pair.volume_24h))}
                        </TableCell>
                        <TableCell className="text-right font-mono text-muted-foreground">
                          {pair.maker_fee_percent}% / {pair.taker_fee_percent}%
                        </TableCell>
                        <TableCell>
                          {pool ? (
                            <Badge variant="outline" className="text-green-500">
                              ${formatNumber(Number(pool.total_liquidity))}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">No Pool</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pair.is_active ? 'default' : 'secondary'}>
                            {pair.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addLiquidity(pair.id, 100000, 100)}
                              title="Add liquidity"
                            >
                              <Droplets className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => togglePairActive(pair)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prices">
          <Card>
            <CardHeader>
              <CardTitle>Price Feeds</CardTitle>
              <CardDescription>
                Token prices tied to real market values (can be updated to track BTC, ETH, or set manually)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token</TableHead>
                    <TableHead>Quote</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">24h Change</TableHead>
                    <TableHead className="text-right">24h Volume</TableHead>
                    <TableHead className="text-right">Market Cap</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Last Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceFeeds.map(feed => (
                    <TableRow key={feed.id}>
                      <TableCell className="font-medium">
                        ${getTokenSymbol(feed.token_id)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{feed.base_currency}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatPrice(Number(feed.price))}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={Number(feed.change_24h_percent) >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {Number(feed.change_24h_percent) >= 0 ? '+' : ''}
                          {Number(feed.change_24h_percent).toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatNumber(Number(feed.volume_24h))}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        ${formatNumber(Number(feed.market_cap))}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{(feed as any).source || 'internal'}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(feed.last_updated).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity">
          <Card>
            <CardHeader>
              <CardTitle>Liquidity Pools</CardTitle>
              <CardDescription>
                Admin-provided liquidity for market making
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead className="text-right">Base Reserve</TableHead>
                    <TableHead className="text-right">Quote Reserve</TableHead>
                    <TableHead className="text-right">Total Liquidity</TableHead>
                    <TableHead className="text-right">Swap Fee</TableHead>
                    <TableHead className="text-right">Spread</TableHead>
                    <TableHead>AMM</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No liquidity pools yet. Add liquidity to trading pairs to enable trading.
                      </TableCell>
                    </TableRow>
                  ) : (
                    pools.map(pool => {
                      const pair = pairs.find(p => p.id === pool.pair_id);
                      return (
                        <TableRow key={pool.id}>
                          <TableCell className="font-medium">
                            {pair?.pair_symbol || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(Number(pool.base_token_reserve))}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatNumber(Number(pool.quote_reserve))}
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-500">
                            ${formatNumber(Number(pool.total_liquidity))}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {pool.fee_percent}%
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {pool.spread_percent}%
                          </TableCell>
                          <TableCell>
                            <Switch checked={pool.auto_market_make} disabled />
                          </TableCell>
                          <TableCell>
                            <Badge variant={pool.is_active ? 'default' : 'secondary'}>
                              {pool.is_active ? 'Active' : 'Paused'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
