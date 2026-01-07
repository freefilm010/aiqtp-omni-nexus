import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Newspaper,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Clock,
  Search,
  Filter,
  Bookmark,
  Share2,
  MessageSquare
} from "lucide-react";

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: Date;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  category: string;
  tickers: string[];
  imageUrl?: string;
  reactions: number;
}

const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin Surges Past $100K as Institutional Adoption Accelerates',
    summary: 'Major financial institutions continue to add Bitcoin to their balance sheets, driving unprecedented demand and pushing prices to new all-time highs.',
    source: 'CoinDesk',
    url: '#',
    publishedAt: new Date(Date.now() - 3600000),
    sentiment: 'bullish',
    category: 'Market',
    tickers: ['BTC', 'ETH'],
    reactions: 1420
  },
  {
    id: '2',
    title: 'SEC Approves New Ethereum ETF Applications',
    summary: 'In a landmark decision, the Securities and Exchange Commission has approved multiple Ethereum spot ETF applications, opening the door for mainstream investment.',
    source: 'Bloomberg Crypto',
    url: '#',
    publishedAt: new Date(Date.now() - 7200000),
    sentiment: 'bullish',
    category: 'Regulation',
    tickers: ['ETH'],
    reactions: 2350
  },
  {
    id: '3',
    title: 'DeFi Protocol Experiences Flash Loan Attack, $50M Drained',
    summary: 'A popular decentralized finance protocol suffered a sophisticated flash loan attack, resulting in significant losses for liquidity providers.',
    source: 'The Block',
    url: '#',
    publishedAt: new Date(Date.now() - 14400000),
    sentiment: 'bearish',
    category: 'Security',
    tickers: ['AAVE', 'UNI'],
    reactions: 890
  },
  {
    id: '4',
    title: 'Federal Reserve Maintains Rates, Crypto Markets React Positively',
    summary: 'The Federal Reserve decided to keep interest rates unchanged, leading to a rally across cryptocurrency markets as investors seek risk assets.',
    source: 'Reuters',
    url: '#',
    publishedAt: new Date(Date.now() - 21600000),
    sentiment: 'bullish',
    category: 'Macro',
    tickers: ['BTC', 'ETH', 'SOL'],
    reactions: 3100
  },
  {
    id: '5',
    title: 'Solana Network Experiences Brief Outage',
    summary: 'The Solana blockchain experienced a temporary outage lasting approximately 4 hours, raising concerns about network reliability.',
    source: 'Decrypt',
    url: '#',
    publishedAt: new Date(Date.now() - 43200000),
    sentiment: 'bearish',
    category: 'Technology',
    tickers: ['SOL'],
    reactions: 2100
  },
  {
    id: '6',
    title: 'Major Bank Launches Crypto Custody Services for Institutional Clients',
    summary: 'One of the world\'s largest banks has announced the launch of cryptocurrency custody services, signaling growing institutional acceptance.',
    source: 'Financial Times',
    url: '#',
    publishedAt: new Date(Date.now() - 86400000),
    sentiment: 'bullish',
    category: 'Institutional',
    tickers: ['BTC', 'ETH'],
    reactions: 1850
  }
];

const CryptoNewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>(mockNews);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.tickers.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filter === 'all' || item.sentiment === filter;
    return matchesSearch && matchesFilter;
  });

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'bearish': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'bearish': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-muted';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Crypto News Feed
          </CardTitle>
          <Badge variant="outline">Live</Badge>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(['all', 'bullish', 'bearish'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f === 'bullish' && <TrendingUp className="h-3 w-3 mr-1" />}
                {f === 'bearish' && <TrendingDown className="h-3 w-3 mr-1" />}
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[600px]">
          <div className="space-y-1">
            {filteredNews.map((item) => (
              <div
                key={item.id}
                className="p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                        {getSentimentIcon(item.sentiment)}
                        <span className="ml-1">{item.sentiment}</span>
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {item.category}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Clock className="h-3 w-3" />
                        {formatTime(item.publishedAt)}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                      {item.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                      {item.summary}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{item.source}</span>
                        <div className="flex gap-1">
                          {item.tickers.map(ticker => (
                            <Badge key={ticker} variant="outline" className="text-xs px-1.5 py-0">
                              ${ticker}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => toggleBookmark(item.id)}
                        >
                          <Bookmark className={`h-3 w-3 ${bookmarks.includes(item.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Share2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                          <MessageSquare className="h-3 w-3" />
                          {item.reactions}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default CryptoNewsFeed;
