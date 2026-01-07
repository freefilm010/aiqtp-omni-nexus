import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  MessageCircle,
  TrendingUp,
  TrendingDown,
  Hash,
  Users,
  Flame,
  Eye,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
  Share2,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Rocket
} from "lucide-react";

interface SocialMention {
  id: string;
  platform: 'reddit' | 'twitter' | 'discord' | 'telegram';
  symbol: string;
  content: string;
  author: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  engagement: number;
  timestamp: Date;
  isInfluencer: boolean;
  followers?: number;
}

interface TrendingTicker {
  symbol: string;
  name: string;
  mentions24h: number;
  mentionChange: number;
  sentiment: number; // -100 to 100
  topPlatform: string;
  momentum: 'rising' | 'falling' | 'stable';
}

interface InfluencerCall {
  id: string;
  influencer: string;
  platform: string;
  followers: number;
  symbol: string;
  callType: 'buy' | 'sell' | 'watch';
  targetPrice?: number;
  confidence: string;
  timestamp: Date;
  performance?: number;
}

const PLATFORMS = {
  reddit: { icon: '🔴', color: 'text-orange-500' },
  twitter: { icon: '𝕏', color: 'text-blue-400' },
  discord: { icon: '💬', color: 'text-indigo-500' },
  telegram: { icon: '✈️', color: 'text-cyan-500' }
};

const INFLUENCERS = [
  { name: '@CryptoKaleo', followers: 650000, platform: 'twitter' },
  { name: '@CryptoCred', followers: 420000, platform: 'twitter' },
  { name: '@Pentosh1', followers: 380000, platform: 'twitter' },
  { name: '@HsakaTrades', followers: 520000, platform: 'twitter' },
  { name: 'u/DeepFuckingValue', followers: 200000, platform: 'reddit' },
  { name: '@blknoiz06', followers: 180000, platform: 'twitter' },
];

const generateMentions = (): SocialMention[] => {
  const symbols = ['BTC', 'ETH', 'SOL', 'DOGE', 'PEPE', 'WIF', 'BONK', 'ARB', 'OP', 'LINK'];
  const platforms: ('reddit' | 'twitter' | 'discord' | 'telegram')[] = ['reddit', 'twitter', 'discord', 'telegram'];
  const bullishPhrases = [
    'This is about to send 🚀',
    'Accumulating heavily here',
    'Chart looking beautiful, breakout imminent',
    'Whales are loading up',
    'This dip is a gift',
    'Next leg up coming soon',
  ];
  const bearishPhrases = [
    'Looking weak, staying out',
    'Distribution pattern forming',
    'Losing key support',
    'Volume declining, bearish',
    'Taking profits here',
  ];
  
  const mentions: SocialMention[] = [];
  
  for (let i = 0; i < 25; i++) {
    const sentiment = Math.random() > 0.4 ? 'bullish' : Math.random() > 0.5 ? 'bearish' : 'neutral';
    const isInfluencer = Math.random() > 0.8;
    const influencer = isInfluencer ? INFLUENCERS[Math.floor(Math.random() * INFLUENCERS.length)] : null;
    
    mentions.push({
      id: `mention-${i}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      symbol: symbols[Math.floor(Math.random() * symbols.length)],
      content: sentiment === 'bullish' 
        ? bullishPhrases[Math.floor(Math.random() * bullishPhrases.length)]
        : sentiment === 'bearish'
        ? bearishPhrases[Math.floor(Math.random() * bearishPhrases.length)]
        : 'Watching this closely...',
      author: isInfluencer ? influencer!.name : `@user${Math.floor(Math.random() * 10000)}`,
      sentiment,
      engagement: isInfluencer ? 500 + Math.random() * 5000 : 10 + Math.random() * 500,
      timestamp: new Date(Date.now() - Math.random() * 7200000),
      isInfluencer,
      followers: isInfluencer ? influencer!.followers : undefined
    });
  }
  
  return mentions.sort((a, b) => b.engagement - a.engagement);
};

const generateTrendingTickers = (): TrendingTicker[] => {
  const tickers = [
    { symbol: 'PEPE', name: 'Pepe' },
    { symbol: 'WIF', name: 'dogwifhat' },
    { symbol: 'BONK', name: 'Bonk' },
    { symbol: 'SOL', name: 'Solana' },
    { symbol: 'BTC', name: 'Bitcoin' },
    { symbol: 'ETH', name: 'Ethereum' },
    { symbol: 'DOGE', name: 'Dogecoin' },
    { symbol: 'SHIB', name: 'Shiba Inu' },
    { symbol: 'ARB', name: 'Arbitrum' },
    { symbol: 'SUI', name: 'Sui' },
  ];
  
  return tickers.map(t => ({
    ...t,
    mentions24h: 1000 + Math.floor(Math.random() * 50000),
    mentionChange: (Math.random() - 0.3) * 200,
    sentiment: (Math.random() - 0.3) * 100,
    topPlatform: ['Twitter', 'Reddit', 'Discord'][Math.floor(Math.random() * 3)],
    momentum: (Math.random() > 0.6 ? 'rising' : Math.random() > 0.3 ? 'stable' : 'falling') as 'rising' | 'falling' | 'stable'
  })).sort((a, b) => b.mentionChange - a.mentionChange);
};

const generateInfluencerCalls = (): InfluencerCall[] => {
  const symbols = ['BTC', 'ETH', 'SOL', 'LINK', 'ARB', 'OP', 'AVAX', 'DOT'];
  
  return INFLUENCERS.map((inf, i) => ({
    id: `call-${i}`,
    influencer: inf.name,
    platform: inf.platform,
    followers: inf.followers,
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    callType: (['buy', 'sell', 'watch'] as const)[Math.floor(Math.random() * 3)],
    targetPrice: Math.random() > 0.5 ? 100 + Math.random() * 1000 : undefined,
    confidence: ['High', 'Medium', 'Low'][Math.floor(Math.random() * 3)],
    timestamp: new Date(Date.now() - Math.random() * 86400000 * 3),
    performance: Math.random() > 0.3 ? (Math.random() - 0.3) * 50 : undefined
  }));
};

const SocialAlphaFeed = () => {
  const [mentions, setMentions] = useState<SocialMention[]>([]);
  const [trending, setTrending] = useState<TrendingTicker[]>([]);
  const [influencerCalls, setInfluencerCalls] = useState<InfluencerCall[]>([]);
  const [filter, setFilter] = useState<'all' | 'reddit' | 'twitter' | 'discord' | 'telegram'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMentions(generateMentions());
    setTrending(generateTrendingTickers());
    setInfluencerCalls(generateInfluencerCalls());
  }, []);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setMentions(generateMentions());
      setTrending(generateTrendingTickers());
      setIsLoading(false);
    }, 500);
  };

  const filteredMentions = mentions.filter(m => filter === 'all' || m.platform === filter);
  
  const totalMentions = trending.reduce((s, t) => s + t.mentions24h, 0);
  const avgSentiment = trending.reduce((s, t) => s + t.sentiment, 0) / trending.length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Mentions (24h)</p>
                <p className="text-xl font-bold">{(totalMentions / 1000).toFixed(0)}K</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              {avgSentiment > 0 ? <TrendingUp className="h-5 w-5 text-green-500" /> : <TrendingDown className="h-5 w-5 text-red-500" />}
              <div>
                <p className="text-xs text-muted-foreground">Avg Sentiment</p>
                <p className={`text-xl font-bold ${avgSentiment > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {avgSentiment > 0 ? '+' : ''}{avgSentiment.toFixed(0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Influencer Calls</p>
                <p className="text-xl font-bold">{influencerCalls.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Rising Tickers</p>
                <p className="text-xl font-bold">{trending.filter(t => t.momentum === 'rising').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Tickers */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              Trending Tickers
            </CardTitle>
            <CardDescription>Most discussed assets across social</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {trending.map((ticker, i) => (
                  <div key={ticker.symbol} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold">#{i + 1}</span>
                        <span className="font-bold">{ticker.symbol}</span>
                        {ticker.momentum === 'rising' && <Rocket className="h-4 w-4 text-green-500" />}
                      </div>
                      <Badge className={ticker.mentionChange > 0 ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}>
                        {ticker.mentionChange > 0 ? '+' : ''}{ticker.mentionChange.toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{ticker.mentions24h.toLocaleString()} mentions</span>
                      <span>{ticker.topPlatform}</span>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Sentiment</span>
                        <span className={ticker.sentiment > 0 ? 'text-green-500' : 'text-red-500'}>
                          {ticker.sentiment > 0 ? 'Bullish' : 'Bearish'}
                        </span>
                      </div>
                      <Progress value={50 + ticker.sentiment / 2} className="h-1" />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Social Feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Social Alpha Feed</CardTitle>
                <CardDescription>Real-time mentions from Reddit, Twitter, Discord, Telegram</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              {(['all', 'twitter', 'reddit', 'discord', 'telegram'] as const).map(p => (
                <Button key={p} variant={filter === p ? 'default' : 'outline'} size="sm" onClick={() => setFilter(p)}>
                  {p === 'all' ? 'All' : PLATFORMS[p as keyof typeof PLATFORMS]?.icon} {p !== 'all' && p.charAt(0).toUpperCase() + p.slice(1)}
                </Button>
              ))}
            </div>
            
            <ScrollArea className="h-[380px]">
              <div className="space-y-2">
                {filteredMentions.map(mention => (
                  <div key={mention.id} className={`p-3 border rounded-lg ${mention.isInfluencer ? 'border-purple-500/50 bg-purple-500/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={PLATFORMS[mention.platform].color}>{PLATFORMS[mention.platform].icon}</span>
                          <span className="font-medium">{mention.author}</span>
                          {mention.isInfluencer && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              {(mention.followers! / 1000).toFixed(0)}K
                            </Badge>
                          )}
                          <Badge className="font-mono">{mention.symbol}</Badge>
                        </div>
                        <p className="text-sm">{mention.content}</p>
                      </div>
                      <Badge className={
                        mention.sentiment === 'bullish' ? 'bg-green-500/20 text-green-500' :
                        mention.sentiment === 'bearish' ? 'bg-red-500/20 text-red-500' :
                        'bg-gray-500/20'
                      }>
                        {mention.sentiment}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3" /> {Math.floor(mention.engagement)}</span>
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {Math.floor(mention.engagement * 0.3)}</span>
                      </div>
                      <span>{mention.timestamp.toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Influencer Calls */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Influencer Trade Calls
          </CardTitle>
          <CardDescription>Track what top crypto influencers are calling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {influencerCalls.map(call => (
              <div key={call.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{call.influencer}</span>
                    <Badge variant="outline" className="text-xs">{(call.followers / 1000).toFixed(0)}K</Badge>
                  </div>
                  <Badge className={
                    call.callType === 'buy' ? 'bg-green-500/20 text-green-500' :
                    call.callType === 'sell' ? 'bg-red-500/20 text-red-500' :
                    'bg-blue-500/20 text-blue-500'
                  }>
                    {call.callType.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-bold text-lg">{call.symbol}</span>
                  {call.targetPrice && <span className="text-muted-foreground">TP: ${call.targetPrice.toFixed(0)}</span>}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Confidence: {call.confidence}</span>
                  {call.performance !== undefined && (
                    <span className={call.performance > 0 ? 'text-green-500' : 'text-red-500'}>
                      {call.performance > 0 ? '+' : ''}{call.performance.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SocialAlphaFeed;
