import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Explain, ExplainerTooltip } from "@/components/ui/explainer-tooltip";
import { PROFIT_TIERS, MIN_INVESTMENT, calculatePlatformFee } from "@/lib/fees/platformFees";
import {
  Search,
  Star,
  TrendingUp,
  Award,
  Users,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle,
  Shield,
  Zap,
  BarChart3,
  Target,
  Filter,
  Gift
} from "lucide-react";

interface GraduatedStrategy {
  id: string;
  name: string;
  description: string | null;
  user_id: string;
  profitability_score: number;
  consistency_score: number;
  rental_price_monthly: number;
  total_rentals: number;
  creator_earnings: number;
  graduation_date: string;
  status: string;
  entry_rules: any;
  exit_rules: any;
  risk_parameters: any;
  backtest_count: number;
  created_at: string;
  is_available_for_rent?: boolean;
}

interface StrategyRental {
  id: string;
  strategy_id: string;
  status: string;
  monthly_price: number;
  start_date: string;
  end_date: string | null;
  strategy?: GraduatedStrategy;
}

const PROFITABILITY_THRESHOLD = 92;
const CONSISTENCY_THRESHOLD = 85;
const MIN_BACKTEST_COUNT = 5;

const StrategyMarketplace = () => {
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<GraduatedStrategy[]>([]);
  const [myRentals, setMyRentals] = useState<StrategyRental[]>([]);
  const [myStrategies, setMyStrategies] = useState<GraduatedStrategy[]>([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'profitability' | 'rentals' | 'price'>('profitability');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketplaceData();
  }, [user]);

  const fetchMarketplaceData = async () => {
    try {
      // Fetch graduated strategies available for rent
      const { data: graduated, error: gradError } = await supabase
        .from('ai_strategies')
        .select('*')
        .eq('is_graduated', true)
        .eq('is_available_for_rent', true);

      if (gradError) throw gradError;
      setStrategies((graduated as GraduatedStrategy[]) || []);

      if (user) {
        // Fetch user's own strategies
        const { data: mine, error: mineError } = await supabase
          .from('ai_strategies')
          .select('*')
          .eq('user_id', user.id);

        if (!mineError) setMyStrategies((mine as GraduatedStrategy[]) || []);

        // Fetch user's rentals
        const { data: rentals, error: rentError } = await supabase
          .from('strategy_rentals')
          .select('*')
          .eq('renter_user_id', user.id);

        if (!rentError) setMyRentals((rentals as StrategyRental[]) || []);
      }
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  const rentStrategy = async (strategy: GraduatedStrategy) => {
    if (!user) {
      toast.error("Please log in to rent strategies");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('strategy_rentals')
        .insert({
          strategy_id: strategy.id,
          renter_user_id: user.id,
          creator_user_id: strategy.user_id,
          monthly_price: strategy.rental_price_monthly,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      // Update rental count
      await supabase
        .from('ai_strategies')
        .update({ total_rentals: (strategy.total_rentals || 0) + 1 })
        .eq('id', strategy.id);

      toast.success(`Successfully rented "${strategy.name}"!`);
      fetchMarketplaceData();
    } catch (err) {
      toast.error("Failed to rent strategy");
      console.error(err);
    }
  };

  const listForRent = async (strategyId: string, monthlyPrice: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('ai_strategies')
        .update({
          is_available_for_rent: true,
          rental_price_monthly: monthlyPrice
        })
        .eq('id', strategyId)
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success("Strategy listed on marketplace!");
      fetchMarketplaceData();
    } catch (err) {
      toast.error("Failed to list strategy");
    }
  };

  const filteredStrategies = strategies
    .filter(s => 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'profitability': return (b.profitability_score || 0) - (a.profitability_score || 0);
        case 'rentals': return (b.total_rentals || 0) - (a.total_rentals || 0);
        case 'price': return (a.rental_price_monthly || 0) - (b.rental_price_monthly || 0);
        default: return 0;
      }
    });

  const graduatedOwnStrategies = myStrategies.filter(s => s.profitability_score && s.profitability_score >= PROFITABILITY_THRESHOLD);
  const pendingGraduation = myStrategies.filter(s => !s.profitability_score || s.profitability_score < PROFITABILITY_THRESHOLD);

  const totalEarnings = myStrategies.reduce((sum, s) => sum + (s.creator_earnings || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Available <Explain term="aiTradingBots">AI Trading Bots</Explain>
                </p>
                <p className="text-3xl font-bold">{strategies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">My Graduated</p>
                <p className="text-3xl font-bold text-green-500">{graduatedOwnStrategies.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Active Rentals</p>
                <p className="text-3xl font-bold text-amber-500">{myRentals.filter(r => r.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-emerald-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-3xl font-bold text-emerald-500">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fee Structure Info */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-5 w-5 text-success" />
              <span className="font-medium">$0 to Start • ${MIN_INVESTMENT} Minimum Investment</span>
            </div>
            <div className="flex gap-4 text-sm">
              {PROFIT_TIERS.map((tier, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="font-bold text-primary">{tier.label}</span>
                  <span className="text-muted-foreground">
                    {tier.max === Infinity ? `$${(tier.min / 1000000).toFixed(0)}M+` : 
                     tier.min >= 100000 ? `$${(tier.min / 1000).toFixed(0)}K-${(tier.max / 1000).toFixed(0)}K` :
                     tier.min >= 10000 ? `$${(tier.min / 1000).toFixed(0)}K-${(tier.max / 1000).toFixed(0)}K` :
                     `$0-$${(tier.max / 1000).toFixed(0)}K`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            No profits = No fees. Platform fee only applies to realized gains. Gas & transfer fees at cost.
          </p>
        </CardContent>
      </Card>

      {/* Profit Split Info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-medium">Profit Sharing Model</span>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span>Creator: <strong>40%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-blue-500" />
                <span>Renter: <strong>40%</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span>Platform: <strong>20%</strong> (tiered fee applies)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="marketplace" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marketplace">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Marketplace
          </TabsTrigger>
          <TabsTrigger value="my-strategies">
            <Target className="h-4 w-4 mr-2" />
            My Strategies
          </TabsTrigger>
          <TabsTrigger value="rentals">
            <Zap className="h-4 w-4 mr-2" />
            My Rentals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search strategies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['profitability', 'rentals', 'price'] as const).map(sort => (
                <Button
                  key={sort}
                  variant={sortBy === sort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(sort)}
                >
                  {sort === 'profitability' && <TrendingUp className="h-4 w-4 mr-1" />}
                  {sort === 'rentals' && <Users className="h-4 w-4 mr-1" />}
                  {sort === 'price' && <DollarSign className="h-4 w-4 mr-1" />}
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-2 gap-4">
              {filteredStrategies.length === 0 ? (
                <Card className="col-span-2">
                  <CardContent className="py-12 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No graduated strategies available yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Strategies must pass {PROFITABILITY_THRESHOLD}% profitability threshold
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredStrategies.map(strategy => (
                  <Card key={strategy.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {strategy.name}
                            <Badge variant="secondary" className="text-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                          </CardTitle>
                          <CardDescription className="line-clamp-2 mt-1">
                            {strategy.description || "AI-generated trading strategy"}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">${strategy.rental_price_monthly}/mo</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Profitability</p>
                          <div className="flex items-center gap-2">
                            <Progress value={strategy.profitability_score || 0} className="h-2" />
                            <span className="font-bold text-green-500">{strategy.profitability_score?.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Consistency</p>
                          <div className="flex items-center gap-2">
                            <Progress value={strategy.consistency_score || 0} className="h-2" />
                            <span className="font-bold">{strategy.consistency_score?.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Active Renters</p>
                          <p className="font-bold flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {strategy.total_rentals || 0}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {strategy.backtest_count || 0} backtests
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Graduated {new Date(strategy.graduation_date).toLocaleDateString()}
                        </span>
                      </div>

                      <Button 
                        className="w-full" 
                        onClick={() => rentStrategy(strategy)}
                        disabled={strategy.user_id === user?.id}
                      >
                        {strategy.user_id === user?.id ? (
                          "This is your strategy"
                        ) : (
                          <>
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Rent Strategy
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="my-strategies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <Explain term="strategyGraduation">Graduation</Explain> Requirements
              </CardTitle>
              <CardDescription>
                Strategies must meet these criteria to be listed on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center p-4 rounded-lg border">
                  <TrendingUp className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="font-bold text-lg">{PROFITABILITY_THRESHOLD}%+</p>
                  <p className="text-sm text-muted-foreground">
                    <ExplainerTooltip
                      term="Profitability Score"
                      explanation="Measures the strategy's ability to generate positive returns over the testing period. Calculated from net profit, risk-adjusted returns, and consistency of gains across different market conditions."
                      category="Performance Metrics"
                    >
                      Profitability Score
                    </ExplainerTooltip>
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <Target className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="font-bold text-lg">{CONSISTENCY_THRESHOLD}%+</p>
                  <p className="text-sm text-muted-foreground">
                    <ExplainerTooltip
                      term="Consistency Score"
                      explanation="Measures how reliably the strategy performs across different time periods. A high score means the strategy doesn't rely on lucky streaks but produces steady, predictable results."
                      category="Performance Metrics"
                    >
                      Consistency Score
                    </ExplainerTooltip>
                  </p>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <BarChart3 className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <p className="font-bold text-lg">{MIN_BACKTEST_COUNT}+</p>
                  <p className="text-sm text-muted-foreground">
                    <Explain term="backtesting">Backtests</Explain> Completed
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {myStrategies.map(strategy => {
              const isGraduated = (strategy.profitability_score || 0) >= PROFITABILITY_THRESHOLD &&
                                 (strategy.consistency_score || 0) >= CONSISTENCY_THRESHOLD &&
                                 (strategy.backtest_count || 0) >= MIN_BACKTEST_COUNT;
              
              return (
                <Card key={strategy.id} className={isGraduated ? 'border-green-500/50' : ''}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      {isGraduated ? (
                        <Badge className="bg-green-500">
                          <Award className="h-3 w-3 mr-1" />
                          Graduated
                        </Badge>
                      ) : (
                        <Badge variant="outline">In Progress</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Profitability</span>
                        <span className={(strategy.profitability_score || 0) >= PROFITABILITY_THRESHOLD ? 'text-green-500' : ''}>
                          {strategy.profitability_score?.toFixed(1) || '0'}%
                        </span>
                      </div>
                      <Progress value={strategy.profitability_score || 0} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Consistency</span>
                        <span className={(strategy.consistency_score || 0) >= CONSISTENCY_THRESHOLD ? 'text-green-500' : ''}>
                          {strategy.consistency_score?.toFixed(1) || '0'}%
                        </span>
                      </div>
                      <Progress value={strategy.consistency_score || 0} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Backtests</span>
                      <span className={(strategy.backtest_count || 0) >= MIN_BACKTEST_COUNT ? 'text-green-500' : ''}>
                        {strategy.backtest_count || 0} / {MIN_BACKTEST_COUNT}
                      </span>
                    </div>

                    {isGraduated && !strategy.is_available_for_rent && (
                      <Button 
                        className="w-full"
                        onClick={() => listForRent(strategy.id, 99)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        List on Marketplace
                      </Button>
                    )}

                    {strategy.is_available_for_rent && (
                      <div className="flex items-center justify-between p-2 rounded bg-green-500/10 text-green-500 text-sm">
                        <span>Listed at ${strategy.rental_price_monthly}/mo</span>
                        <span>{strategy.total_rentals || 0} renters</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="rentals" className="space-y-4">
          {myRentals.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">You haven't rented any strategies yet</p>
                <Button className="mt-4" onClick={() => {}}>
                  Browse Marketplace
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {myRentals.map(rental => (
                <Card key={rental.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Strategy Rental</CardTitle>
                      <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                        {rental.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Monthly Price</span>
                      <span className="font-bold">${rental.monthly_price}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Started</span>
                      <span>{new Date(rental.start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="p-3 rounded bg-muted/50 text-sm">
                      <p className="text-muted-foreground mb-1">Your Profit Share</p>
                      <p className="font-bold text-green-500">40% of all profits</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StrategyMarketplace;
