import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TradingViewChart from "@/components/trading/TradingViewChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Search,
  Filter,
  Star,
  Clock,
  BarChart3,
  Zap,
  Shield,
  Globe,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

const TradingDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { getAllPrices, getPrice, isLive, lastSyncError } = useMarketPrices(15000);
  const [searchQuery, setSearchQuery] = useState("");
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const markets = getAllPrices();

  const total24hVolumeUsd = markets.reduce(
    (sum, m) => sum + (typeof m.volumeNumeric === "number" ? m.volumeNumeric : 0),
    0
  );

  const formatCompactUsd = (value: number) => {
    const abs = Math.abs(value);
    if (!Number.isFinite(abs) || abs <= 0) return null;
    if (abs >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchUserData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch portfolio
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolio')
        .select('*')
        .eq('user_id', user!.id);

      if (portfolioError) throw portfolioError;

      // Fetch trades
      const { data: tradesData, error: tradesError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (tradesError) throw tradesError;

      setPortfolio(portfolioData || []);
      setTrades(tradesData || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const getLiveUsdPrice = (symbol: string): number | undefined => {
    const direct = getPrice(symbol)?.priceNumeric;
    if (typeof direct === "number") return direct;

    const pair = getPrice(`${symbol}/USD`)?.priceNumeric;
    if (typeof pair === "number") return pair;

    return undefined;
  };

  const calculateTotalBalance = () => {
    if (portfolio.length === 0) return 0;
    return portfolio.reduce((total, item) => {
      const livePrice = getLiveUsdPrice(item.asset_symbol);
      const usdPrice = livePrice ?? item.current_price ?? item.average_price;
      const value = item.quantity * usdPrice;
      return total + value;
    }, 0);
  };

  const calculateTotalChange = () => {
    if (portfolio.length === 0) return { amount: 0, percent: 0 };

    let totalCost = 0;
    let totalValue = 0;

    portfolio.forEach((item) => {
      const livePrice = getLiveUsdPrice(item.asset_symbol);
      const usdPrice = livePrice ?? item.current_price ?? item.average_price;

      const cost = item.quantity * item.average_price;
      const value = item.quantity * usdPrice;
      totalCost += cost;
      totalValue += value;
    });

    const changeAmount = totalValue - totalCost;
    const changePercent = totalCost > 0 ? (changeAmount / totalCost) * 100 : 0;

    return { amount: changeAmount, percent: changePercent };
  };

  const totalBalance = calculateTotalBalance();
  const { amount: changeAmount, percent: changePercent } = calculateTotalChange();
  const activeTrades = trades.filter(t => t.status === 'pending').length;

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          {/* Dashboard Header */}
          <div className="mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">
                    Trading <span className="text-gradient-gold">Dashboard</span>
                  </h1>
                  <p className="text-muted-foreground">Monitor and trade all your assets in one place</p>
                  {lastSyncError && (
                    <p className="mt-2 text-xs text-warning font-mono">{lastSyncError}</p>
                  )}
              </div>
              
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="text-sm">
                  <Globe className="w-3 h-3 mr-1" />
                  24/7 Markets
                </Badge>
                <Button variant="premium">
                  <Zap className="w-4 h-4 mr-2" />
                  Quick Trade
                </Button>
              </div>
            </div>
          </div>

          {/* Portfolio Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Total Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className={`flex items-center text-sm mt-2 ${changeAmount >= 0 ? 'text-success' : 'text-destructive'}`}>
                  <ArrowUpRight className={`w-4 h-4 mr-1 ${changeAmount < 0 ? 'rotate-90' : ''}`} />
                  <span>${Math.abs(changeAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({changePercent.toFixed(2)}%)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">24h Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">
                  {formatCompactUsd(total24hVolumeUsd) ?? "--"}
                </div>
                <div className="flex items-center text-accent text-sm mt-2">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  <span>Across tracked markets</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Active Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{activeTrades}</div>
                <div className="flex items-center text-primary text-sm mt-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{activeTrades} pending orders</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Security Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-success">Secure</div>
                <div className="flex items-center text-muted-foreground text-sm mt-2">
                  <Shield className="w-4 h-4 mr-1" />
                  <span>Protected</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <div className="mb-8">
            <TradingViewChart height={450} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Markets Section */}
            <div className="lg:col-span-2">
              <Card className="card-premium border-none">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl">Markets</CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search markets..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="all" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="crypto">Crypto</TabsTrigger>
                      <TabsTrigger value="stocks">Stocks</TabsTrigger>
                      <TabsTrigger value="commodities">Commodities</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all" className="mt-6">
                      <div className="space-y-4">
                        {markets.map((market) => (
                          <div
                            key={market.symbol}
                            className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary transition-smooth cursor-pointer"
                          >
                            <div className="flex items-center gap-4">
                              <Button variant="ghost" size="icon">
                                <Star className="w-4 h-4" />
                              </Button>
                              <div>
                                <div className="font-semibold text-foreground">{market.symbol}</div>
                                <div className="text-sm text-muted-foreground">{market.name}</div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-semibold text-foreground">${market.price}</div>
                              <div className="text-sm text-muted-foreground">Vol: {market.volume}</div>
                            </div>
                            
                            <div className={`flex items-center gap-1 ${market.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                              {market.trend === 'up' ? (
                                <TrendingUp className="w-4 h-4" />
                              ) : (
                                <TrendingDown className="w-4 h-4" />
                              )}
                              <span className="font-semibold">{market.change}</span>
                            </div>
                            
                            <Button variant="premium" size="sm">
                              Trade
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            {/* Portfolio Section */}
            <div>
              <Card className="card-premium border-none mb-6">
                <CardHeader>
                  <CardTitle className="text-2xl">Your Portfolio</CardTitle>
                </CardHeader>
                <CardContent>
                  {portfolio.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p className="mb-4">No assets in portfolio yet</p>
                      <Button variant="outline">Start Trading</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {portfolio.map((item) => {
                        const livePrice = getLiveUsdPrice(item.asset_symbol);
                        const currentPrice = livePrice ?? item.current_price ?? item.average_price;
                        const value = item.quantity * currentPrice;
                        const cost = item.quantity * item.average_price;
                        const change = value - cost;
                        const changePercent = cost > 0 ? (change / cost) * 100 : 0;
                        
                        return (
                          <div key={item.id} className="p-4 rounded-lg bg-secondary">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="font-semibold text-foreground">{item.asset_name}</div>
                                <div className="text-sm text-muted-foreground">{item.quantity} {item.asset_symbol}</div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-foreground">${value.toFixed(2)}</div>
                                <div className={`text-sm ${change >= 0 ? 'text-success' : 'text-destructive'}`}>
                                  {change >= 0 ? '+' : ''}${change.toFixed(2)} ({changePercent.toFixed(2)}%)
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" className="w-full mt-2">
                              Manage
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  <Link to="/vault">
                    <Button variant="gold" className="w-full mt-6">
                      <Zap className="w-4 h-4 mr-2" />
                      Lightning Vault
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="card-premium border-none">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    Deposit Funds
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Withdraw Assets
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Trading History
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    Account Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default TradingDashboard;