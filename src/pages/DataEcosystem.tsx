import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Coins,
  TrendingUp,
  Users,
  Bot,
  Zap,
  Shield,
  Globe,
  Award,
  DollarSign,
  BarChart3,
  Layers,
  Rocket,
  Lock,
  Network
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DataBotBuilder from "@/components/data/DataBotBuilder";
import { TokenEcosystem } from "@/components/data/TokenEcosystem";
import { BlockchainEcosystemLab } from "@/components/research/BlockchainEcosystemLab";

interface DataToken {
  id: string;
  name: string;
  symbol: string;
  total_supply: number;
  circulating_supply: number;
  price_usd: number;
  market_cap: number;
  description: string;
  use_cases: string[];
}

const DataEcosystem = () => {
  const [token, setToken] = useState<DataToken | null>(null);
  const [stats, setStats] = useState({
    totalBots: 0,
    activeBots: 0,
    totalDataProducts: 0,
    totalDataSold: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadToken();
    loadStats();
  }, []);

  const loadToken = async () => {
    const { data } = await supabase.from('data_tokens').select('*').single();
    if (data) {
      setToken({
        ...data,
        use_cases: typeof data.use_cases === 'string' ? JSON.parse(data.use_cases) : data.use_cases
      } as DataToken);
    }
  };

  const loadStats = async () => {
    const { data: bots } = await supabase.from('data_aggregator_bots').select('is_active');
    const { data: products } = await supabase.from('data_products').select('total_sales, total_revenue');
    
    if (bots) {
      setStats(prev => ({
        ...prev,
        totalBots: bots.length,
        activeBots: bots.filter((b: any) => b.is_active).length
      }));
    }
    
    if (products) {
      setStats(prev => ({
        ...prev,
        totalDataProducts: products.length,
        totalDataSold: products.reduce((sum: number, p: any) => sum + (p.total_sales || 0), 0),
        totalRevenue: products.reduce((sum: number, p: any) => sum + (p.total_revenue || 0), 0)
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">AIQTP Data Ecosystem</span>
          </div>
          <h1 className="text-xl sm:text-4xl font-bold mb-4">
            The Future of <span className="text-primary">Decentralized Data</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Create data aggregator bots, collect valuable data, graduate to marketplace, 
            and earn from the world's first data-centric blockchain ecosystem
          </p>
        </div>

        {/* Token Info Banner */}
        {token && (
          <Card className="mb-8 border-primary/30 bg-gradient-to-r from-primary/5 to-purple-500/5">
            <CardContent className="py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-full bg-primary/20">
                    <Coins className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl font-bold">{token.name}</h2>
                      <Badge className="bg-primary">${token.symbol}</Badge>
                    </div>
                    <p className="text-muted-foreground">{token.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl sm:text-3xl font-bold">${token.price_usd.toFixed(4)}</p>
                  <p className="text-sm text-muted-foreground">
                    Market Cap: ${(token.total_supply * token.price_usd).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-6 gap-4 mt-6">
                {(token.use_cases || []).map((useCase, i) => (
                  <div key={i} className="text-center p-3 rounded-lg bg-background/50">
                    <p className="text-xs font-medium capitalize">{useCase.replace(/_/g, ' ')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ecosystem Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Bots</p>
                  <p className="text-2xl font-bold">{stats.totalBots}</p>
                </div>
                <Bot className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Bots</p>
                  <p className="text-2xl font-bold text-green-500">{stats.activeBots}</p>
                </div>
                <Zap className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Products</p>
                  <p className="text-2xl font-bold">{stats.totalDataProducts}</p>
                </div>
                <Database className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Data Sold</p>
                  <p className="text-2xl font-bold">{stats.totalDataSold}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">${stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="tokens" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Token Hierarchy
            </TabsTrigger>
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Research
            </TabsTrigger>
            <TabsTrigger value="bots" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              Data Bots
            </TabsTrigger>
            <TabsTrigger value="ecosystem" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Ecosystem
            </TabsTrigger>
            <TabsTrigger value="tokenomics" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Tokenomics
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              Roadmap
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tokens">
            <TokenEcosystem />
          </TabsContent>

          <TabsContent value="research">
            <BlockchainEcosystemLab />
          </TabsContent>

          <TabsContent value="bots">
            <DataBotBuilder />
          </TabsContent>

          <TabsContent value="ecosystem">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="h-5 w-5" />
                    How It Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-blue-500/20 h-fit">
                      <span className="text-blue-500 font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Create Data Bot</h4>
                      <p className="text-sm text-muted-foreground">Build a bot that collects specific data types</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-green-500/20 h-fit">
                      <span className="text-green-500 font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Collect & Aggregate</h4>
                      <p className="text-sm text-muted-foreground">Your bot automatically collects and normalizes data</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-purple-500/20 h-fit">
                      <span className="text-purple-500 font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Graduate to Marketplace</h4>
                      <p className="text-sm text-muted-foreground">Meet quality thresholds to list on marketplace</p>
                    </div>
                  </div>
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-full bg-yellow-500/20 h-fit">
                      <span className="text-yellow-500 font-bold">4</span>
                    </div>
                    <div>
                      <h4 className="font-medium">Earn DATA Tokens</h4>
                      <p className="text-sm text-muted-foreground">Get paid when others rent your bot or buy your data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Ecosystem Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <h4 className="font-medium">Data Creators</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Build bots, share in marketplace revenue (terms TBD; subject to
                      securities-law review before any revenue-share program launches)
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      <h4 className="font-medium">Data Consumers</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Access high-quality aggregated data at fraction of traditional costs
                    </p>
                  </div>
                  <div className="p-4 rounded-lg border">
                    <div className="flex items-center gap-3 mb-2">
                      <Lock className="h-5 w-5 text-purple-500" />
                      <h4 className="font-medium">Token Holders</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Stake DATA tokens to earn validator rewards and governance rights
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tokenomics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  DATA Token Economics
                </CardTitle>
                <CardDescription>
                  Native utility token powering the AIQTP Data Ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Token Distribution</h4>
                    <div className="space-y-2">
                      {[
                        { label: 'Ecosystem Rewards', percent: 40, color: 'bg-green-500' },
                        { label: 'Team & Development', percent: 20, color: 'bg-blue-500' },
                        { label: 'Treasury', percent: 15, color: 'bg-purple-500' },
                        { label: 'Public Sale', percent: 15, color: 'bg-orange-500' },
                        { label: 'Advisors', percent: 10, color: 'bg-pink-500' },
                      ].map((item, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{item.label}</span>
                            <span>{item.percent}%</span>
                          </div>
                          <Progress value={item.percent} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Utility</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-sm">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Pay for data purchases
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Bot className="h-4 w-4 text-blue-500" />
                        Rent data bots
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Lock className="h-4 w-4 text-purple-500" />
                        Stake for rewards
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Shield className="h-4 w-4 text-green-500" />
                        Governance voting
                      </li>
                      <li className="flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4 text-orange-500" />
                        Creator rewards
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">Token Metrics</h4>
                    <div className="space-y-3">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Total Supply</p>
                        <p className="font-bold">1,000,000,000 DATA</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">Initial Price</p>
                        <p className="font-bold">$0.01 USD</p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground">FDV</p>
                        <p className="font-bold">$10,000,000</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roadmap">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Development Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
                  
                  {[
                    { phase: 'Phase 1', title: 'Foundation', status: 'completed', items: ['Core platform', 'Data bot builder', 'Marketplace MVP'] },
                    { phase: 'Phase 2', title: 'Token Launch', status: 'in-progress', items: ['DATA token TGE', 'Staking contracts', 'Governance DAO'] },
                    { phase: 'Phase 3', title: 'Expansion', status: 'upcoming', items: ['Multi-chain support', 'API marketplace', 'Enterprise tier'] },
                    { phase: 'Phase 4', title: 'Ecosystem', status: 'upcoming', items: ['Data derivatives', 'Cross-chain bridges', 'Institutional partnerships'] },
                  ].map((phase, i) => (
                    <div key={i} className="relative pl-20 pb-8">
                      <div className={`absolute left-6 w-5 h-5 rounded-full border-2 ${
                        phase.status === 'completed' ? 'bg-green-500 border-green-500' :
                        phase.status === 'in-progress' ? 'bg-primary border-primary animate-pulse' :
                        'bg-muted border-muted-foreground'
                      }`} />
                      <div className="p-4 rounded-lg border">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant={phase.status === 'completed' ? 'default' : 'outline'}>
                            {phase.phase}
                          </Badge>
                          <h4 className="font-medium">{phase.title}</h4>
                        </div>
                        <ul className="space-y-1">
                          {phase.items.map((item, j) => (
                            <li key={j} className="text-sm text-muted-foreground flex items-center gap-2">
                              {phase.status === 'completed' ? (
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                              ) : (
                                <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                              )}
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default DataEcosystem;