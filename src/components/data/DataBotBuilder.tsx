import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot,
  Database,
  Zap,
  Play,
  Pause,
  Settings,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  Code,
  Layers,
  Globe,
  Search,
  Filter,
  BarChart3,
  Sparkles,
  Rocket,
  Shield,
  Award
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import * as renderApi from "@/integrations/renderApi";
import { getCachedUser } from "@/lib/auth/getCachedUser";

interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  bot_type: string;
  data_category: string;
  collection_frequency: string;
  is_active: boolean;
  is_graduated: boolean;
  total_records_collected: number;
  total_earnings: number;
  quality_score: number;
  reliability_score: number;
  created_at: string;
}

const BOT_TYPES = [
  { value: 'scraper', label: 'Web Scraper', description: 'Collects data from web sources' },
  { value: 'api_aggregator', label: 'API Aggregator', description: 'Aggregates data from multiple APIs' },
  { value: 'blockchain_indexer', label: 'Blockchain Indexer', description: 'Indexes on-chain data' },
  { value: 'social_listener', label: 'Social Listener', description: 'Monitors social media signals' },
  { value: 'price_tracker', label: 'Price Tracker', description: 'Tracks asset prices across venues' },
  { value: 'sentiment_analyzer', label: 'Sentiment Analyzer', description: 'Analyzes market sentiment' },
];

const DATA_CATEGORIES = [
  { value: 'market', label: 'Market Data', icon: TrendingUp },
  { value: 'social', label: 'Social Signals', icon: Globe },
  { value: 'blockchain', label: 'Blockchain/DeFi', icon: Database },
  { value: 'news', label: 'News & Events', icon: Zap },
  { value: 'sentiment', label: 'Sentiment', icon: BarChart3 },
  { value: 'alternative', label: 'Alternative Data', icon: Layers },
];

const COLLECTION_FREQUENCIES = [
  { value: 'realtime', label: 'Real-time', cost: 'High' },
  { value: 'minute', label: 'Every Minute', cost: 'High' },
  { value: 'hourly', label: 'Hourly', cost: 'Medium' },
  { value: 'daily', label: 'Daily', cost: 'Low' },
  { value: 'weekly', label: 'Weekly', cost: 'Very Low' },
];

const DataBotBuilder = () => {
  const [configs, setConfigs] = useState<StrategyConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Builder state
  const [botName, setBotName] = useState('');
  const [botDescription, setBotDescription] = useState('');
  const [botType, setBotType] = useState('api_aggregator');
  const [dataCategory, setDataCategory] = useState('market');
  const [frequency, setFrequency] = useState('hourly');
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState('');
  const [profitShare, setProfitShare] = useState([30]);

  useEffect(() => {
    loadConfigs();
  }, []);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadConfigs();
      }
    };

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, []);

  const loadConfigs = async () => {
    const userData = { user: await getCachedUser() };
    const currentUser = userData.user;

    if (!currentUser) {
      setUserId(null);
      setConfigs([]);
      setLoading(false);
      return;
    }

    setUserId(currentUser.id);

    try {
      const data = await renderApi.getStrategies(currentUser.id);
      setConfigs(data as unknown as StrategyConfig[]);
    } catch {
      setConfigs([]);
    }
    setLoading(false);
  };

  const addSource = () => {
    if (newSource && !sources.includes(newSource)) {
      setSources([...sources, newSource]);
      setNewSource('');
    }
  };

  const createConfig = async () => {
    if (!botName) {
      toast.error('Please enter a strategy name');
      return;
    }

    const userData = { user: await getCachedUser() };
    if (!userData.user) {
      toast.error('Please sign in to register a strategy');
      return;
    }

    setUserId(userData.user.id);

    try {
      await renderApi.createStrategy(userData.user.id, {
        name: botName,
        description: botDescription,
        bot_type: botType,
        data_category: dataCategory,
        collection_frequency: frequency,
        sources,
        creator_profit_share: profitShare[0],
        is_active: false,
      });
    } catch (err) {
      toast.error('Failed to register strategy: ' + String(err));
      return;
    }

    toast.success('Strategy registered!', {
      description: 'The Python worker will pick up this configuration automatically.',
    });
    resetBuilder();
    loadConfigs();
  };

  const resetBuilder = () => {
    setBotName('');
    setBotDescription('');
    setBotType('api_aggregator');
    setDataCategory('market');
    setFrequency('hourly');
    setSources([]);
    setProfitShare([30]);
  };

  const toggleConfig = async (configId: string, isActive: boolean) => {
    const user = await getCachedUser();
    if (!user) return;
    try {
      await renderApi.updateStrategy(user.id, configId, { is_active: isActive });
    } catch { /* non-fatal */ }
    toast.success(`Strategy ${isActive ? 'enabled' : 'paused'} — the worker will ${isActive ? 'activate' : 'deactivate'} within its next cycle.`);
    loadConfigs();
  };

  const requestGraduation = async (config: StrategyConfig) => {
    if ((config.quality_score || 0) < 70 || (config.reliability_score || 0) < 60) {
      toast.error('Strategy needs higher quality and reliability scores to graduate');
      return;
    }
    const user = await getCachedUser();
    if (!user) return;
    try {
      await renderApi.updateStrategy(user.id, config.id, { pending_graduation: true });
    } catch { /* non-fatal */ }

    toast.success('Graduation requested!', {
      description: 'The worker will review and promote this strategy to the marketplace.',
    });
    loadConfigs();
  };

  // Stats
  const totalConfigs = configs.length;
  const activeConfigs = configs.filter(c => c.is_active).length;
  const graduatedConfigs = configs.filter(c => c.is_graduated).length;
  const totalRecords = configs.reduce((sum, c) => sum + (c.total_records_collected || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Strategies</p>
                <p className="text-2xl font-bold">{totalConfigs}</p>
              </div>
              <Bot className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-500">{activeConfigs}</p>
              </div>
              <Play className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Graduated</p>
                <p className="text-2xl font-bold text-purple-500">{graduatedConfigs}</p>
              </div>
              <Award className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Records Collected</p>
                <p className="text-2xl font-bold">{totalRecords.toLocaleString()}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="configs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configs">My Strategies</TabsTrigger>
          <TabsTrigger value="builder">Register New Strategy</TabsTrigger>
          <TabsTrigger value="marketplace">Bot Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="configs">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Strategy Registry
              </CardTitle>
              <CardDescription>
                Configure strategies here. The Python worker on Render reads these configurations and executes them.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {configs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No strategies registered</p>
                      <p className="text-sm">Register your first strategy configuration to get started</p>
                    </div>
                  ) : (
                    configs.map(config => (
                      <div key={config.id} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{config.name}</h4>
                              {config.is_graduated && (
                                <Badge className="bg-purple-500">Graduated</Badge>
                              )}
                              <Badge variant="outline">{config.bot_type}</Badge>
                              <Badge variant="outline">{config.data_category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{config.description}</p>
                          </div>
                          <Switch
                            checked={config.is_active}
                            onCheckedChange={(checked) => toggleConfig(config.id, checked)}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Records</p>
                            <p className="font-medium">{(config.total_records_collected || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Quality Score</p>
                            <div className="flex items-center gap-2">
                              <Progress value={config.quality_score || 0} className="h-2 flex-1" />
                              <span className="text-sm">{(config.quality_score || 0).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Reliability</p>
                            <div className="flex items-center gap-2">
                              <Progress value={config.reliability_score || 0} className="h-2 flex-1" />
                              <span className="text-sm">{(config.reliability_score || 0).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Earnings</p>
                            <p className="font-medium text-green-500">${(config.total_earnings || 0).toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {!config.is_graduated && (config.quality_score || 0) >= 70 && (config.reliability_score || 0) >= 60 && (
                            <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => requestGraduation(config)}>
                              <Rocket className="h-4 w-4 mr-1" />
                              Request Graduation
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Register Strategy Configuration
              </CardTitle>
              <CardDescription>
                Define a strategy configuration. The Python worker will read this from <code className="text-xs bg-muted px-1 rounded">strategy_registry</code> and execute it on Render.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Strategy Name</Label>
                    <Input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="My Crypto Sentiment Strategy"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={botDescription}
                      onChange={(e) => setBotDescription(e.target.value)}
                      placeholder="Describe what data this strategy collects and how it trades..."
                    />
                  </div>

                  <div>
                    <Label>Strategy Type</Label>
                    <Select value={botType} onValueChange={setBotType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BOT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div>
                              <span className="font-medium">{type.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">{type.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Data Category</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {DATA_CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          onClick={() => setDataCategory(cat.value)}
                          className={`p-3 rounded-lg border text-center transition-colors ${
                            dataCategory === cat.value
                              ? 'border-primary bg-primary/10'
                              : 'hover:border-primary/50'
                          }`}
                        >
                          <cat.icon className={`h-5 w-5 mx-auto mb-1 ${dataCategory === cat.value ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="text-xs">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Collection Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COLLECTION_FREQUENCIES.map(freq => (
                          <SelectItem key={freq.value} value={freq.value}>
                            {freq.label} (Cost: {freq.cost})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Data Sources</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        value={newSource}
                        onChange={(e) => setNewSource(e.target.value)}
                        placeholder="Add API endpoint or source URL"
                        onKeyDown={(e) => e.key === 'Enter' && addSource()}
                      />
                      <Button variant="outline" onClick={addSource}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {sources.map((source, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {source.length > 30 ? source.substring(0, 30) + '...' : source}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label>Creator Profit Share</Label>
                      <span className="text-sm font-medium text-green-500">{profitShare[0]}%</span>
                    </div>
                    <Slider
                      value={profitShare}
                      onValueChange={setProfitShare}
                      min={10}
                      max={50}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      You earn {profitShare[0]}% of all data sales from this strategy
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <h4 className="font-medium">Graduation Requirements</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Quality Score ≥ 70%
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Reliability Score ≥ 60%
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Worker Approval
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={createConfig}>
                <Bot className="h-4 w-4 mr-2" />
                Register Strategy
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Strategy Marketplace
              </CardTitle>
              <CardDescription>
                Rent graduated strategies to access their data feeds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Marketplace Coming Soon</p>
                <p className="text-sm">Graduate your strategies to list them here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataBotBuilder;
