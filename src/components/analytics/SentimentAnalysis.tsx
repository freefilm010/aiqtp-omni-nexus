import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from "recharts";
import { 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Twitter,
  Newspaper,
  Users,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Meh,
  RefreshCw,
  Volume2,
  Activity
} from "lucide-react";

const COLORS = ['hsl(142, 71%, 45%)', 'hsl(0, 84%, 60%)', 'hsl(45, 96%, 53%)'];

const SentimentAnalysis = () => {
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [timeframe, setTimeframe] = useState("24h");

  const [sentimentHistory, setSentimentHistory] = useState<any[]>([]);
  const [socialVolume, setSocialVolume] = useState<any[]>([]);
  const [newsSentiment, setNewsSentiment] = useState<any[]>([]);
  const [fearGreedIndex, setFearGreedIndex] = useState(0);
  const [fearGreedComponents, setFearGreedComponents] = useState<any[]>([]);
  const [influencerSentiment, setInfluencerSentiment] = useState<any[]>([]);
  const [onChainMetrics, setOnChainMetrics] = useState<any[]>([]);
  const [radarData, setRadarData] = useState<any[]>([]);

  useEffect(() => {
    const loadSentiment = async () => {
      // Load news from broadcast_content for sentiment
      const { data: news } = await supabase
        .from('broadcast_content')
        .select('*')
        .eq('content_type', 'news')
        .order('created_at', { ascending: false })
        .limit(10);

      if (news && news.length > 0) {
        setNewsSentiment(news.map(n => ({
          title: n.title,
          source: n.source || 'Platform',
          sentiment: n.category === 'positive' ? 'positive' : n.category === 'negative' ? 'negative' : 'neutral',
          score: n.priority ? n.priority / 10 : 0.5,
          time: new Date(n.created_at || '').toLocaleString(),
          impact: (n.priority || 0) > 7 ? 'high' : (n.priority || 0) > 4 ? 'medium' : 'low',
        })));
      }

      // Load AI signals for sentiment proxy
      const { data: signals } = await supabase
        .from('ai_signals')
        .select('*')
        .eq('is_active', true)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (signals && signals.length > 0) {
        const bullish = signals.filter(s => s.signal_type === 'buy').length;
        const bearish = signals.filter(s => s.signal_type === 'sell').length;
        const total = signals.length;
        const fgi = total > 0 ? Math.round((bullish / total) * 100) : 50;
        setFearGreedIndex(fgi);

        // Build sentiment history from signal timestamps
        const hourBuckets: Record<number, { bullish: number; bearish: number; neutral: number }> = {};
        signals.forEach(s => {
          const h = new Date(s.triggered_at).getHours();
          if (!hourBuckets[h]) hourBuckets[h] = { bullish: 0, bearish: 0, neutral: 0 };
          if (s.signal_type === 'buy') hourBuckets[h].bullish++;
          else if (s.signal_type === 'sell') hourBuckets[h].bearish++;
          else hourBuckets[h].neutral++;
        });
        setSentimentHistory(Object.entries(hourBuckets).map(([h, v]) => ({
          hour: Number(h), ...v, composite: v.bullish - v.bearish,
        })));

        setFearGreedComponents([
          { metric: "Buy Signals", value: Math.round((bullish / total) * 100), weight: 30 },
          { metric: "Sell Signals", value: Math.round((bearish / total) * 100), weight: 30 },
          { metric: "Avg Confidence", value: Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / total), weight: 20 },
          { metric: "Active Signals", value: Math.min(100, total * 2), weight: 20 },
        ]);

        setRadarData([
          { subject: "Buy Signals", A: Math.round((bullish / total) * 100), fullMark: 100 },
          { subject: "Sell Signals", A: Math.round((bearish / total) * 100), fullMark: 100 },
          { subject: "Confidence", A: Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / total), fullMark: 100 },
          { subject: "Strength", A: Math.round(signals.filter(s => s.strength === 'strong').length / total * 100), fullMark: 100 },
        ]);
      }

      // Load smart money flows for on-chain metrics
      const { data: flows } = await supabase
        .from('smart_money_flows')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(6);

      if (flows && flows.length > 0) {
        setOnChainMetrics(flows.map(f => ({
          metric: f.asset,
          value: Number(f.net_flow_millions) || 0,
          signal: f.whale_activity || 'neutral',
          status: f.institutional_bias || 'neutral',
        })));
      }
    };

    loadSentiment();
  }, [selectedAsset, timeframe]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
      case "bullish": return "text-success";
      case "negative":
      case "bearish": return "text-destructive";
      default: return "text-gold";
    }
  };

  const getSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case "positive":
      case "bullish": return "default";
      case "negative":
      case "bearish": return "destructive";
      default: return "secondary";
    }
  };

  const getFearGreedLabel = (value: number) => {
    if (value <= 20) return { label: "Extreme Fear", color: "text-destructive" };
    if (value <= 40) return { label: "Fear", color: "text-warning" };
    if (value <= 60) return { label: "Neutral", color: "text-gold" };
    if (value <= 80) return { label: "Greed", color: "text-success" };
    return { label: "Extreme Greed", color: "text-success" };
  };

  const fearGreed = getFearGreedLabel(fearGreedIndex);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <Select value={selectedAsset} onValueChange={setSelectedAsset}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="BTC">Bitcoin</SelectItem>
            <SelectItem value="ETH">Ethereum</SelectItem>
            <SelectItem value="SOL">Solana</SelectItem>
            <SelectItem value="MARKET">Market</SelectItem>
          </SelectContent>
        </Select>

        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">1 Hour</SelectItem>
            <SelectItem value="24h">24 Hours</SelectItem>
            <SelectItem value="7d">7 Days</SelectItem>
            <SelectItem value="30d">30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fear & Greed Index</p>
                <p className={`text-3xl font-bold ${fearGreed.color}`}>{fearGreedIndex}</p>
                <p className={`text-sm ${fearGreed.color}`}>{fearGreed.label}</p>
              </div>
              <div className="relative h-16 w-16">
                <svg className="transform -rotate-90 h-16 w-16">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="8" className="text-secondary" />
                  <circle 
                    cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="8" 
                    className={fearGreed.color} 
                    strokeDasharray={`${fearGreedIndex * 1.76} 176`}
                  />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ThumbsUp className="h-8 w-8 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Bullish Sentiment</p>
                <p className="text-2xl font-bold text-success">65%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Volume2 className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Social Volume</p>
                <p className="text-2xl font-bold">+24%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Sentiment Change</p>
                <p className="text-2xl font-bold text-success">+8.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment History Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sentiment Trend</CardTitle>
            <CardDescription>Historical sentiment analysis over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={sentimentHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="bullish" stackId="1" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" name="Bullish" />
                <Area type="monotone" dataKey="neutral" stackId="1" stroke="hsl(45, 96%, 53%)" fill="hsl(45, 96%, 53%)" name="Neutral" />
                <Area type="monotone" dataKey="bearish" stackId="1" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" name="Bearish" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Sentiment Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Multi-Source Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar name="Sentiment" dataKey="A" stroke="hsl(220, 91%, 25%)" fill="hsl(220, 91%, 25%)" fillOpacity={0.5} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="news" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="onchain">On-Chain</TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
        </TabsList>

        {/* News Tab */}
        <TabsContent value="news">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                News Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {newsSentiment.map((news, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{news.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{news.source}</span>
                          <span>•</span>
                          <span>{news.time}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getSentimentBadge(news.sentiment)}>
                          {news.sentiment === "positive" ? <ThumbsUp className="h-3 w-3 mr-1" /> : 
                           news.sentiment === "negative" ? <ThumbsDown className="h-3 w-3 mr-1" /> :
                           <Meh className="h-3 w-3 mr-1" />}
                          {(news.score * 100).toFixed(0)}%
                        </Badge>
                        <Badge variant="outline">{news.impact} impact</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Social Media Tab */}
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Twitter className="h-5 w-5" />
                Social Media Volume
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={socialVolume}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="twitter" stackId="1" stroke="hsl(203, 89%, 53%)" fill="hsl(203, 89%, 53%)" name="Twitter" />
                  <Area type="monotone" dataKey="reddit" stackId="1" stroke="hsl(16, 100%, 50%)" fill="hsl(16, 100%, 50%)" name="Reddit" />
                  <Area type="monotone" dataKey="telegram" stackId="1" stroke="hsl(200, 100%, 50%)" fill="hsl(200, 100%, 50%)" name="Telegram" />
                  <Area type="monotone" dataKey="discord" stackId="1" stroke="hsl(235, 86%, 65%)" fill="hsl(235, 86%, 65%)" name="Discord" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* On-Chain Tab */}
        <TabsContent value="onchain">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                On-Chain Sentiment Indicators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {onChainMetrics.map((metric, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{metric.metric}</span>
                      <Badge variant={metric.status === "bullish" ? "default" : "secondary"}>
                        {metric.status}
                      </Badge>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className={`text-2xl font-bold ${getSentimentColor(metric.status)}`}>
                        {typeof metric.value === "number" && metric.value > 0 ? "+" : ""}{metric.value}
                        {typeof metric.value === "number" && Math.abs(metric.value) > 1 ? "%" : ""}
                      </span>
                      <span className="text-sm text-muted-foreground">{metric.signal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Influencers Tab */}
        <TabsContent value="influencers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Key Influencer Sentiment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {influencerSentiment.map((influencer, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary">{influencer.name[0]}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold">{influencer.name}</h4>
                        <p className="text-sm text-muted-foreground">{influencer.followers} followers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={getSentimentBadge(influencer.sentiment)} className="capitalize">
                        {influencer.sentiment === "bullish" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {influencer.sentiment === "bearish" && <TrendingDown className="h-3 w-3 mr-1" />}
                        {influencer.sentiment}
                      </Badge>
                      <div className="w-20">
                        <Progress value={influencer.confidence} className="h-2" />
                        <p className="text-xs text-center mt-1">{influencer.confidence}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fear & Greed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Fear & Greed Index Components</CardTitle>
          <CardDescription>Weighted breakdown of sentiment indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fearGreedComponents.map((component, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>{component.metric}</span>
                  <span className="text-muted-foreground">Weight: {component.weight}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={component.value} className="flex-1 h-3" />
                  <span className="font-mono w-12 text-right">{component.value}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SentimentAnalysis;
