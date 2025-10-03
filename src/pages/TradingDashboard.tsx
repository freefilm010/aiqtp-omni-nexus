import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  Star,
  Clock,
  BarChart3,
  Zap,
  Shield,
  Globe
} from "lucide-react";

const TradingDashboard = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const markets = [
    { symbol: "BTC/USD", name: "Bitcoin", price: "67,234.89", change: "+5.23%", volume: "$2.4B", trend: "up" },
    { symbol: "ETH/USD", name: "Ethereum", price: "3,456.12", change: "+3.45%", volume: "$1.2B", trend: "up" },
    { symbol: "GOLD/USD", name: "Gold", price: "2,123.45", change: "-0.23%", volume: "$890M", trend: "down" },
    { symbol: "AAPL", name: "Apple Inc", price: "178.34", change: "+1.23%", volume: "$3.2B", trend: "up" },
    { symbol: "RE-NYC-01", name: "NYC Property Token", price: "245.67", change: "+2.34%", volume: "$45M", trend: "up" },
    { symbol: "ART-MON-01", name: "Monet NFT", price: "1,234,567", change: "-1.23%", volume: "$12M", trend: "down" },
  ];

  const portfolio = [
    { asset: "Bitcoin", amount: "2.4567", value: "$165,234", change: "+$12,345", percent: "+8.1%" },
    { asset: "Ethereum", amount: "34.567", value: "$119,456", change: "+$4,567", percent: "+4.0%" },
    { asset: "Gold Tokens", amount: "45.00", value: "$95,456", change: "-$234", percent: "-0.2%" },
  ];

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
                <div className="text-3xl font-bold text-foreground">$384,146</div>
                <div className="flex items-center text-success text-sm mt-2">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  <span>+$16,678 (4.5%)</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">24h Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">$8.9B</div>
                <div className="flex items-center text-accent text-sm mt-2">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  <span>Across all markets</span>
                </div>
              </CardContent>
            </Card>

            <Card className="card-premium border-none">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Active Trades</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">12</div>
                <div className="flex items-center text-primary text-sm mt-2">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>3 pending orders</span>
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
                  <span>2FA Enabled</span>
                </div>
              </CardContent>
            </Card>
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
                  <div className="space-y-4">
                    {portfolio.map((item) => (
                      <div key={item.asset} className="p-4 rounded-lg bg-secondary">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-semibold text-foreground">{item.asset}</div>
                            <div className="text-sm text-muted-foreground">{item.amount} units</div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-foreground">{item.value}</div>
                            <div className={`text-sm ${item.change.startsWith('+') ? 'text-success' : 'text-destructive'}`}>
                              {item.change} ({item.percent})
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-2">
                          Manage
                        </Button>
                      </div>
                    ))}
                  </div>
                  
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
