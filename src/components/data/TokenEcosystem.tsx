import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Coins, 
  TrendingUp, 
  Pickaxe, 
  Zap, 
  Network,
  Database,
  Brain,
  Wifi,
  BarChart3,
  Link2,
  ArrowUpRight,
  Sparkles,
  Users,
  Activity
} from 'lucide-react';

interface DataToken {
  id: string;
  symbol: string;
  name: string;
  description: string;
  total_supply: number;
  circulating_supply: number;
  price_usd: number;
  market_cap: number;
  token_type: string;
  parent_token_id: string | null;
  data_category: string;
  mining_power: number;
  boost_multiplier: number;
  total_mined: number;
  miners_count: number;
  emission_rate: number;
  is_active: boolean;
  use_cases: string[];
}

const CATEGORY_ICONS: Record<string, any> = {
  governance: Coins,
  aggregation: Database,
  mining: Pickaxe,
  staking: Zap,
  social: Users,
  financial: BarChart3,
  onchain: Link2,
  ai_training: Brain,
  iot: Wifi,
};

const CATEGORY_COLORS: Record<string, string> = {
  governance: 'from-yellow-500 to-amber-600',
  aggregation: 'from-blue-500 to-cyan-600',
  mining: 'from-orange-500 to-red-600',
  staking: 'from-purple-500 to-pink-600',
  social: 'from-green-500 to-emerald-600',
  financial: 'from-indigo-500 to-blue-600',
  onchain: 'from-violet-500 to-purple-600',
  ai_training: 'from-pink-500 to-rose-600',
  iot: 'from-teal-500 to-cyan-600',
};

export const TokenEcosystem = () => {
  const [tokens, setTokens] = useState<DataToken[]>([]);
  const [parentToken, setParentToken] = useState<DataToken | null>(null);
  const [childTokens, setChildTokens] = useState<DataToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalMiningPower, setTotalMiningPower] = useState(0);

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    try {
      const { data, error } = await supabase
        .from('data_tokens')
        .select('*')
        .order('mining_power', { ascending: false });

      if (error) throw error;

      const allTokens = (data || []) as DataToken[];
      setTokens(allTokens);
      
      const parent = allTokens.find(t => t.token_type === 'parent');
      const children = allTokens.filter(t => t.token_type === 'child');
      
      setParentToken(parent || null);
      setChildTokens(children);
      setTotalMiningPower(children.reduce((sum, t) => sum + (t.mining_power || 0), 0));
    } catch (error) {
      console.error('Error loading tokens:', error);
      toast.error('Failed to load token ecosystem');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const calculateBoostContribution = (token: DataToken) => {
    if (!totalMiningPower) return 0;
    return ((token.mining_power || 0) / totalMiningPower) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Network className="h-6 w-6 text-primary" />
            $DATA Token Ecosystem
          </h2>
          <p className="text-muted-foreground">
            Hierarchical token system where child tokens mine and boost parent value
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {tokens.length} Tokens Active
        </Badge>
      </div>

      {/* Parent Token Hero */}
      {parentToken && (
        <Card className="bg-gradient-to-br from-yellow-500/20 via-amber-500/10 to-orange-500/20 border-yellow-500/30">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
                  <Coins className="h-10 w-10 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-bold">${parentToken.symbol}</h3>
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                      PARENT
                    </Badge>
                  </div>
                  <p className="text-lg text-muted-foreground">{parentToken.name}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                    {parentToken.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-yellow-400">
                  ${parentToken.price_usd?.toFixed(4)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Supply: {formatNumber(parentToken.total_supply || 0)}
                </p>
                <div className="flex items-center gap-1 text-green-400 mt-1">
                  <TrendingUp className="h-4 w-4" />
                  <span>+{childTokens.length} Miners Active</span>
                </div>
              </div>
            </div>

            {/* Mining Stats */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <Pickaxe className="h-6 w-6 mx-auto text-orange-400 mb-2" />
                <p className="text-2xl font-bold">{childTokens.length}</p>
                <p className="text-xs text-muted-foreground">Child Miners</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <Zap className="h-6 w-6 mx-auto text-yellow-400 mb-2" />
                <p className="text-2xl font-bold">{formatNumber(totalMiningPower)}</p>
                <p className="text-xs text-muted-foreground">Total Mining Power</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <Activity className="h-6 w-6 mx-auto text-green-400 mb-2" />
                <p className="text-2xl font-bold">{parentToken.boost_multiplier}x</p>
                <p className="text-xs text-muted-foreground">Boost Multiplier</p>
              </div>
              <div className="bg-background/50 rounded-lg p-4 text-center">
                <Sparkles className="h-6 w-6 mx-auto text-purple-400 mb-2" />
                <p className="text-2xl font-bold">{formatNumber(parentToken.circulating_supply || 0)}</p>
                <p className="text-xs text-muted-foreground">Circulating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="children" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="children">Child Tokens ({childTokens.length})</TabsTrigger>
          <TabsTrigger value="hierarchy">Hierarchy View</TabsTrigger>
          <TabsTrigger value="mining">Mining Simulation</TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {childTokens.map((token) => {
              const Icon = CATEGORY_ICONS[token.data_category] || Database;
              const gradientColor = CATEGORY_COLORS[token.data_category] || 'from-gray-500 to-gray-600';
              const boostContribution = calculateBoostContribution(token);

              return (
                <Card key={token.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold">${token.symbol}</h4>
                            <Badge variant="outline" className="text-xs">
                              {token.data_category}
                            </Badge>
                          </div>
                          <p className="font-mono text-sm">
                            ${token.price_usd?.toFixed(4)}
                          </p>
                        </div>
                        <p className="text-sm text-muted-foreground">{token.name}</p>
                        
                        {/* Mining Power Bar */}
                        <div className="mt-3 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Mining Power</span>
                            <span className="font-mono">{token.mining_power}</span>
                          </div>
                          <Progress value={boostContribution} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {boostContribution.toFixed(1)}% boost to $DATA
                          </p>
                        </div>

                        {/* Token Stats */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span>Supply: {formatNumber(token.total_supply || 0)}</span>
                          <span>•</span>
                          <span>Rate: {((token.emission_rate || 0) * 100).toFixed(1)}%</span>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-green-400">
                            <ArrowUpRight className="h-3 w-3" />
                            Mines $DATA
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="hierarchy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Hierarchy</CardTitle>
              <CardDescription>
                Visual representation of how child tokens mine and boost $DATA value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                {/* Parent at top */}
                {parentToken && (
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/30 z-10">
                      <div className="text-center text-white">
                        <Coins className="h-8 w-8 mx-auto" />
                        <p className="text-xs font-bold mt-1">${parentToken.symbol}</p>
                      </div>
                    </div>
                    
                    {/* Connection lines */}
                    <div className="absolute top-full left-1/2 w-px h-8 bg-gradient-to-b from-yellow-500 to-transparent"></div>
                  </div>
                )}

                {/* Horizontal line */}
                <div className="w-full max-w-4xl h-px bg-border mt-8 mb-4 relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
                </div>

                {/* Children in grid */}
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4 w-full max-w-4xl">
                  {childTokens.map((token) => {
                    const Icon = CATEGORY_ICONS[token.data_category] || Database;
                    const gradientColor = CATEGORY_COLORS[token.data_category] || 'from-gray-500 to-gray-600';
                    
                    return (
                      <div key={token.id} className="flex flex-col items-center">
                        <div className="w-px h-4 bg-border mb-2"></div>
                        <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${gradientColor} flex items-center justify-center shadow-md`}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-xs font-bold mt-2">${token.symbol}</p>
                        <p className="text-[10px] text-muted-foreground">{token.mining_power} MP</p>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs">
                  {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                    <div key={category} className="flex items-center gap-1">
                      <div className={`h-3 w-3 rounded-full bg-gradient-to-br ${color}`}></div>
                      <span className="capitalize">{category.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mining" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pickaxe className="h-5 w-5" />
                Mining Activity
              </CardTitle>
              <CardDescription>
                Live child token $DATA mining rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {childTokens.map((token) => {
                  const Icon = CATEGORY_ICONS[token.data_category] || Database;
                  const gradientColor = CATEGORY_COLORS[token.data_category] || 'from-gray-500 to-gray-600';
                  const miningRate = (token.mining_power || 0) * (token.emission_rate || 0.001);

                  return (
                    <div key={token.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${gradientColor} flex items-center justify-center`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">${token.symbol}</span>
                          <span className="text-xs text-muted-foreground">
                            Mining Rate: {miningRate.toFixed(4)} DATA/block
                          </span>
                        </div>
                        <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${gradientColor} animate-pulse`}
                            style={{ width: `${(token.mining_power / 25) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono text-green-400">
                          +{miningRate.toFixed(4)}
                        </p>
                        <p className="text-xs text-muted-foreground">$DATA/block</p>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Total Mining Output</span>
                    <span className="text-lg font-bold text-green-400">
                      +{childTokens.reduce((sum, t) => sum + ((t.mining_power || 0) * (t.emission_rate || 0.001)), 0).toFixed(4)} $DATA/block
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    All child token mining contributes to $DATA circulating supply and value
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
