import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Newspaper, TrendingUp, TrendingDown, ExternalLink, Clock,
  Search, Bookmark, Share2, MessageSquare
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
}

const CryptoNewsFeed = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'bullish' | 'bearish'>('all');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNews = useCallback(async () => {
    // Load from broadcast_content table which stores real news/content
    const { data } = await supabase
      .from("broadcast_content")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(50) as any;

    if (data && data.length > 0) {
      setNews(data.map((item: any) => ({
        id: item.id,
        title: item.title,
        summary: item.body?.substring(0, 200) || '',
        source: item.source || 'Platform',
        url: '#',
        publishedAt: new Date(item.published_at || item.created_at),
        sentiment: (item.category === 'bullish' ? 'bullish' : item.category === 'bearish' ? 'bearish' : 'neutral') as NewsItem['sentiment'],
        category: item.content_type || 'Market',
        tickers: [],
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadNews(); }, [loadNews]);

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.summary.toLowerCase().includes(searchTerm.toLowerCase());
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
    setBookmarks(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
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
        <div className="flex gap-2 mt-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search news..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
          <div className="flex gap-1">
            {(['all', 'bullish', 'bearish'] as const).map((f) => (
              <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)}>
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
            {loading ? (
              <p className="text-center text-muted-foreground py-8">Loading news...</p>
            ) : filteredNews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No news articles yet</p>
            ) : filteredNews.map((item) => (
              <div key={item.id} className="p-4 border-b hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className={getSentimentColor(item.sentiment)}>
                        {getSentimentIcon(item.sentiment)}
                        <span className="ml-1">{item.sentiment}</span>
                      </Badge>
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                        <Clock className="h-3 w-3" />{formatTime(item.publishedAt)}
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{item.summary}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{item.source}</span>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleBookmark(item.id)}>
                          <Bookmark className={`h-3 w-3 ${bookmarks.includes(item.id) ? 'fill-current' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <Share2 className="h-3 w-3" />
                        </Button>
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
