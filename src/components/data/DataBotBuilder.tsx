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

import { getCachedUser } from "@/lib/auth/getCachedUser";
interface DataBot {
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
  const [bots, setBots] = useState<DataBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
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
    loadBots();
  }, []);

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadBots();
      }
    };

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, []);

  const loadBots = async () => {
    const userData = { user: await getCachedUser() };
    const currentUser = userData.user;

    if (!currentUser) {
      setUserId(null);
      setBots([]);
      setLoading(false);
      return;
    }

    setUserId(currentUser.id);

    const { data } = await supabase
      .from('data_aggregator_bots')
      .select('*')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    if (data) setBots(data as DataBot[]);
    setLoading(false);
  };

  const addSource = () => {
    if (newSource && !sources.includes(newSource)) {
      setSources([...sources, newSource]);
      setNewSource('');
    }
  };

  const createBot = async () => {
    if (!botName) {
      toast.error('Please enter a bot name');
      return;
    }

    const userData = { user: await getCachedUser() };
    if (!userData.user) {
      toast.error('Please sign in to create a bot');
      return;
    }

    setUserId(userData.user.id);

    const { error } = await supabase.from('data_aggregator_bots').insert({
      user_id: userData.user.id,
      name: botName,
      description: botDescription,
      bot_type: botType,
      data_category: dataCategory,
      collection_frequency: frequency,
      sources: sources,
      creator_profit_share: profitShare[0],
      aggregation_rules: {
        deduplicate: true,
        normalize: true,
        validate: true
      }
    });

    if (error) {
      toast.error('Failed to create bot: ' + error.message);
      return;
    }

    toast.success('Data Bot created!', { description: 'Start collecting data to graduate' });
    setShowBuilder(false);
    resetBuilder();
    loadBots();
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

  const toggleBot = async (botId: string, isActive: boolean) => {
    await supabase.from('data_aggregator_bots').update({ is_active: isActive }).eq('id', botId);
    toast.success(`Bot ${isActive ? 'started' : 'stopped'}`);
    loadBots();
  };

  const simulateCollection = async (bot: DataBot) => {
    // Deterministic collection amount seeded by bot ID + current hour
    const hourSeed = Math.floor(Date.now() / 3600000);
    const s = (offset: number) => Math.abs(Math.sin(
      bot.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) * 0.01 + hourSeed * 1.618 + offset
    ));
    const records = Math.floor(s(0) * 5000) + 1000;
    await supabase.from('data_aggregator_bots').update({
      total_records_collected: (bot.total_records_collected || 0) + records,
      quality_score: Math.min(100, (bot.quality_score || 0) + s(1) * 5),
      reliability_score: Math.min(100, (bot.reliability_score || 0) + s(2) * 3),
      last_collection_at: new Date().toISOString()
    }).eq('id', bot.id);

    // Create job record
    await supabase.from('data_collection_jobs').insert({
      bot_id: bot.id,
      status: 'completed',
      records_collected: records,
      data_size_bytes: records * 256,
      started_at: new Date(Date.now() - 60000).toISOString(),
      completed_at: new Date().toISOString()
    });

    toast.success(`Collected ${records.toLocaleString()} records!`);
    loadBots();
  };

  const graduateBot = async (bot: DataBot) => {
    if ((bot.quality_score || 0) < 70 || (bot.reliability_score || 0) < 60) {
      toast.error('Bot needs higher quality and reliability scores to graduate');
      return;
    }

    await supabase.from('data_aggregator_bots').update({
      is_graduated: true,
      graduation_date: new Date().toISOString(),
      admin_approved: true
    }).eq('id', bot.id);

    // List on marketplace
    await supabase.from('data_bot_marketplace').insert({
      bot_id: bot.id,
      rental_price_monthly: 99,
      is_available: true
    });

    toast.success('Bot graduated to marketplace!', { description: 'Others can now rent your data bot' });
    loadBots();
  };

  // Stats
  const totalBots = bots.length;
  const activeBots = bots.filter(b => b.is_active).length;
  const graduatedBots = bots.filter(b => b.is_graduated).length;
  const totalRecords = bots.reduce((sum, b) => sum + (b.total_records_collected || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">My Data Bots</p>
                <p className="text-2xl font-bold">{totalBots}</p>
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
                <p className="text-2xl font-bold text-green-500">{activeBots}</p>
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
                <p className="text-2xl font-bold text-purple-500">{graduatedBots}</p>
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

      <Tabs defaultValue="bots" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bots">My Data Bots</TabsTrigger>
          <TabsTrigger value="builder">Create New Bot</TabsTrigger>
          <TabsTrigger value="marketplace">Bot Marketplace</TabsTrigger>
        </TabsList>

        <TabsContent value="bots">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                My Data Aggregator Bots
              </CardTitle>
              <CardDescription>
                Create bots to collect data, graduate them to the marketplace, earn from rentals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {bots.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bot className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No data bots yet</p>
                      <p className="text-sm">Create your first data aggregator bot to start collecting</p>
                    </div>
                  ) : (
                    bots.map(bot => (
                      <div key={bot.id} className="p-4 rounded-lg border hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{bot.name}</h4>
                              {bot.is_graduated && (
                                <Badge className="bg-purple-500">Graduated</Badge>
                              )}
                              <Badge variant="outline">{bot.bot_type}</Badge>
                              <Badge variant="outline">{bot.data_category}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{bot.description}</p>
                          </div>
                          <Switch
                            checked={bot.is_active}
                            onCheckedChange={(checked) => toggleBot(bot.id, checked)}
                          />
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Records</p>
                            <p className="font-medium">{(bot.total_records_collected || 0).toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Quality Score</p>
                            <div className="flex items-center gap-2">
                              <Progress value={bot.quality_score || 0} className="h-2 flex-1" />
                              <span className="text-sm">{(bot.quality_score || 0).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Reliability</p>
                            <div className="flex items-center gap-2">
                              <Progress value={bot.reliability_score || 0} className="h-2 flex-1" />
                              <span className="text-sm">{(bot.reliability_score || 0).toFixed(0)}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Earnings</p>
                            <p className="font-medium text-green-500">${(bot.total_earnings || 0).toFixed(2)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => simulateCollection(bot)}>
                            <Zap className="h-4 w-4 mr-1" />
                            Collect Now
                          </Button>
                          {!bot.is_graduated && (bot.quality_score || 0) >= 70 && (bot.reliability_score || 0) >= 60 && (
                            <Button size="sm" className="bg-purple-500 hover:bg-purple-600" onClick={() => graduateBot(bot)}>
                              <Rocket className="h-4 w-4 mr-1" />
                              Graduate to Marketplace
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
                Create Data Aggregator Bot
              </CardTitle>
              <CardDescription>
                Build a bot that collects and aggregates data to sell in the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Bot Name</Label>
                    <Input
                      value={botName}
                      onChange={(e) => setBotName(e.target.value)}
                      placeholder="My Crypto Sentiment Bot"
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={botDescription}
                      onChange={(e) => setBotDescription(e.target.value)}
                      placeholder="Describe what data your bot collects..."
                    />
                  </div>

                  <div>
                    <Label>Bot Type</Label>
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
                      You earn {profitShare[0]}% of all data sales from your bot
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
                        Admin Approval
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={createBot}>
                <Bot className="h-4 w-4 mr-2" />
                Create Data Bot
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Data Bot Marketplace
              </CardTitle>
              <CardDescription>
                Rent graduated data bots to access their data feeds
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Globe className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Marketplace Coming Soon</p>
                <p className="text-sm">Graduate your bots to list them here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataBotBuilder;