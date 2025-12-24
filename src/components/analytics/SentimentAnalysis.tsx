import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  // Sentiment History
  const sentimentHistory = Array.from({ length: 48 }, (_, i) => ({
    hour: i,
    bullish: 40 + Math.random() * 30,
    bearish: 20 + Math.random() * 25,
    neutral: 10 + Math.random() * 20,
    composite: 50 + (Math.random() - 0.5) * 40,
  }));

  // Social Volume Data
  const socialVolume = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    twitter: 5000 + Math.random() * 15000,
    reddit: 2000 + Math.random() * 8000,
    telegram: 1000 + Math.random() * 5000,
    discord: 500 + Math.random() * 2000,
  }));

  // News Sentiment
  const newsSentiment = [
    { 
      title: "Bitcoin ETF sees record inflows amid institutional demand",
      source: "Bloomberg",
      sentiment: "positive",
      score: 0.85,
      time: "2h ago",
      impact: "high"
    },
    {
      title: "Fed signals potential rate cut in upcoming meeting",
      source: "Reuters",
      sentiment: "positive",
      score: 0.72,
      time: "4h ago",
      impact: "high"
    },
    {
      title: "Ethereum upgrade encounters minor delay",
      source: "CoinDesk",
      sentiment: "neutral",
      score: 0.48,
      time: "5h ago",
      impact: "medium"
    },
    {
      title: "Regulatory concerns grow in Asian markets",
      source: "Financial Times",
      sentiment: "negative",
      score: 0.28,
      time: "6h ago",
      impact: "medium"
    },
    {
      title: "Major exchange reports security vulnerability patched",
      source: "The Block",
      sentiment: "neutral",
      score: 0.52,
      time: "8h ago",
      impact: "low"
    },
  ];

  // Fear & Greed Components
  const fearGreedComponents = [
    { metric: "Volatility", value: 65, weight: 25 },
    { metric: "Market Volume", value: 72, weight: 25 },
    { metric: "Social Media", value: 58, weight: 15 },
    { metric: "Surveys", value: 48, weight: 15 },
    { metric: "Dominance", value: 55, weight: 10 },
    { metric: "Trends", value: 62, weight: 10 },
  ];

  const fearGreedIndex = 62; // Greed

  // Influencer Sentiment
  const influencerSentiment = [
    { name: "CryptoWhale", followers: "1.2M", sentiment: "bullish", confidence: 85 },
    { name: "BitcoinMagazine", followers: "850K", sentiment: "bullish", confidence: 78 },
    { name: "WuBlockchain", followers: "620K", sentiment: "neutral", confidence: 65 },
    { name: "CoinGecko", followers: "550K", sentiment: "bullish", confidence: 72 },
    { name: "Messari", followers: "480K", sentiment: "neutral", confidence: 68 },
  ];

  // On-Chain Sentiment Indicators
  const onChainMetrics = [
    { metric: "Exchange Inflow", value: -15, signal: "Accumulation", status: "bullish" },
    { metric: "Active Addresses", value: 12, signal: "Increasing", status: "bullish" },
    { metric: "NUPL", value: 0.45, signal: "Belief", status: "neutral" },
    { metric: "MVRV Ratio", value: 1.8, signal: "Moderate", status: "neutral" },
    { metric: "Whale Activity", value: 25, signal: "Accumulating", status: "bullish" },
    { metric: "Exchange Reserves", value: -8, signal: "Decreasing", status: "bullish" },
  ];

  // Radar Chart Data
  const radarData = [
    { subject: "Twitter", A: 75, fullMark: 100 },
    { subject: "Reddit", A: 65, fullMark: 100 },
    { subject: "News", A: 82, fullMark: 100 },
    { subject: "On-Chain", A: 70, fullMark: 100 },
    { subject: "Futures", A: 58, fullMark: 100 },
    { subject: "Options", A: 45, fullMark: 100 },
  ];

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
