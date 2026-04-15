import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Radio,
  Tv,
  Newspaper,
  TrendingUp,
  TrendingDown,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  Zap,
  Globe,
  BarChart3,
  AlertTriangle,
  DollarSign,
  Megaphone,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface BroadcastItem {
  id: string;
  content_type: string;
  title: string;
  body: string;
  audio_url: string | null;
  visual_data: any;
  source: string;
  category: string;
  priority: number;
  published_at: string | null;
  created_at: string;
}

interface AdPlacement {
  id: string;
  slot_name: string;
  advertiser_name: string | null;
  ad_content: any;
  is_active: boolean;
}

const categoryIcons: Record<string, React.ElementType> = {
  market_update: TrendingUp,
  breaking_news: AlertTriangle,
  economic_calendar: Globe,
  ipo_ico: Zap,
  pattern_alert: BarChart3,
  earnings: DollarSign,
  sponsored: Megaphone,
};

const categoryColors: Record<string, string> = {
  market_update: "text-emerald-400",
  breaking_news: "text-red-400",
  economic_calendar: "text-blue-400",
  ipo_ico: "text-amber-400",
  pattern_alert: "text-purple-400",
  earnings: "text-cyan-400",
  sponsored: "text-pink-400",
};

const BroadcastStation = () => {
  const [broadcasts, setBroadcasts] = useState<BroadcastItem[]>([]);
  const [ads, setAds] = useState<AdPlacement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchBroadcasts = useCallback(async () => {
    const { data } = await supabase
      .from("broadcast_content")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(50);
    setBroadcasts((data as BroadcastItem[]) || []);
    setLoading(false);
  }, []);

  const fetchAds = useCallback(async () => {
    const { data } = await supabase
      .from("ad_placements")
      .select("*")
      .eq("is_active", true)
      .limit(5);
    setAds((data as AdPlacement[]) || []);
  }, []);

  useEffect(() => {
    fetchBroadcasts();
    fetchAds();

    const channel = supabase
      .channel("broadcast-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "broadcast_content" }, () => fetchBroadcasts())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchBroadcasts, fetchAds]);

  // Auto-scroll ticker
  useEffect(() => {
    if (!isLive || broadcasts.length === 0) return;
    tickerRef.current = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % broadcasts.length);
    }, 5000);
    return () => { if (tickerRef.current) clearInterval(tickerRef.current); };
  }, [isLive, broadcasts.length]);

  const generateContent = async () => {
    toast.info("Generating broadcast content...");
    try {
      const { data, error } = await supabase.functions.invoke("broadcast-generate", {
        body: { type: "market_update" },
      });
      if (error) throw error;
      toast.success("New content generated!");
      fetchBroadcasts();
    } catch {
      toast.error("Generation failed — edge function may not be deployed yet");
    }
  };

  const currentBroadcast = broadcasts[tickerIndex];

  return (
    <div className="space-y-3 sm:space-y-6">
      {/* Live Ticker Bar */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/20 via-background to-primary/20 border border-primary/30">
        <div className="flex items-center px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 mr-2 sm:mr-4">
            <div className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full ${isLive ? "bg-red-500 animate-pulse" : "bg-muted-foreground"}`} />
            <span className="text-[9px] sm:text-xs font-bold text-foreground uppercase tracking-wider">
              {isLive ? "LIVE" : "PAUSED"}
            </span>
            <Radio className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary hidden sm:block" />
          </div>
          <div className="flex-1 overflow-hidden">
            {currentBroadcast ? (
              <div className="flex items-center gap-3 animate-in slide-in-from-right-5 duration-500">
                <Badge variant="outline" className={`text-[9px] shrink-0 ${categoryColors[currentBroadcast.category] || ""}`}>
                  {currentBroadcast.category.replace("_", " ").toUpperCase()}
                </Badge>
                <span className="text-sm font-medium text-foreground truncate">{currentBroadcast.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {currentBroadcast.published_at && formatDistanceToNow(new Date(currentBroadcast.published_at), { addSuffix: true })}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">Waiting for broadcast content...</span>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsLive(!isLive)}>
              {isLive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="mb-3 sm:mb-4 grid grid-cols-3 w-full h-auto">
          <TabsTrigger value="feed" className="gap-1 sm:gap-1.5 text-[9px] sm:text-sm py-1.5"><Newspaper className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Feed</TabsTrigger>
          <TabsTrigger value="radio" className="gap-1 sm:gap-1.5 text-[9px] sm:text-sm py-1.5"><Radio className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Radio</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1 sm:gap-1.5 text-[9px] sm:text-sm py-1.5"><Tv className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> Live</TabsTrigger>
        </TabsList>

        <TabsContent value="feed">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="lg:col-span-2">
              <Card className="border-border/50">
                <CardHeader className="pb-2 sm:pb-3 flex flex-row items-center justify-between p-3 sm:p-6">
                  <CardTitle className="text-sm sm:text-lg flex items-center gap-2">
                    <Newspaper className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" /> Feed
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={generateContent} className="h-7 sm:h-8 text-[10px] sm:text-sm px-2 sm:px-3">
                    <Zap className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" /> Generate
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px] sm:h-[500px]">
                    <div className="divide-y divide-border/40">
                      {broadcasts.map(item => {
                        const Icon = categoryIcons[item.category] || Newspaper;
                        const color = categoryColors[item.category] || "text-muted-foreground";
                        return (
                          <div key={item.id} className="px-4 py-3 hover:bg-accent/30 transition-colors">
                            <div className="flex items-start gap-3">
                              <div className={`mt-0.5 p-1.5 rounded-md bg-accent/50 ${color}`}>
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className={`text-[9px] ${color}`}>
                                    {item.category.replace("_", " ")}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">
                                    {item.published_at && formatDistanceToNow(new Date(item.published_at), { addSuffix: true })}
                                  </span>
                                  {item.priority > 5 && <Badge variant="destructive" className="text-[9px]">URGENT</Badge>}
                                </div>
                                <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{item.body}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {broadcasts.length === 0 && !loading && (
                        <div className="text-center py-12">
                          <Radio className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">No broadcasts yet. Generate content to start.</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Ad Sidebar */}
            <div className="space-y-3 sm:space-y-4 hidden sm:block">
              <Card className="border-border/50 bg-gradient-to-b from-accent/20 to-background">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-pink-400" /> Sponsored
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ads.length > 0 ? ads.map(ad => (
                    <div key={ad.id} className="p-3 rounded-lg border border-border/50 bg-card hover:border-primary/30 transition-colors cursor-pointer">
                      <p className="text-xs font-medium text-foreground">{ad.advertiser_name || "Featured Partner"}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{(ad.ad_content as any)?.text || "Premium trading tools & signals"}</p>
                      <Badge variant="outline" className="text-[8px] mt-2">AD</Badge>
                    </div>
                  )) : (
                    <div className="p-4 rounded-lg border border-dashed border-border/50 text-center">
                      <Megaphone className="h-6 w-6 mx-auto text-muted-foreground mb-1" />
                      <p className="text-[10px] text-muted-foreground">Ad space available</p>
                      <p className="text-[9px] text-primary mt-1">Contact us to advertise</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="border-border/50">
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Total Broadcasts</span>
                    <span className="text-sm font-bold text-foreground">{broadcasts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Categories</span>
                    <span className="text-sm font-bold text-foreground">
                      {new Set(broadcasts.map(b => b.category)).size}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Active Sponsors</span>
                    <span className="text-sm font-bold text-primary">{ads.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="radio">
          <Card className="border-border/50">
            <CardContent className="pt-6 text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center">
                <Radio className={`h-10 w-10 text-primary ${isLive ? "animate-pulse" : ""}`} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">AIQTP Radio</h3>
                <p className="text-sm text-muted-foreground">AI-powered market updates, analysis & trading signals</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button variant={isLive ? "default" : "outline"} onClick={() => setIsLive(!isLive)}>
                  {isLive ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                  {isLive ? "Pause" : "Play"}
                </Button>
                <Button variant="outline" onClick={() => setIsMuted(!isMuted)}>
                  {isMuted ? <VolumeX className="h-4 w-4 mr-2" /> : <Volume2 className="h-4 w-4 mr-2" />}
                  {isMuted ? "Unmute" : "Mute"}
                </Button>
              </div>
              <div className="bg-accent/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-xs text-muted-foreground mb-1">Now Playing</p>
                <p className="text-sm font-medium text-foreground">
                  {currentBroadcast ? currentBroadcast.title : "Waiting for content..."}
                </p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Connect ElevenLabs for AI voice synthesis • Auto-broadcasts economic events & market alerts
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
                {["market_update", "breaking_news", "economic_calendar", "ipo_ico", "pattern_alert", "earnings"].map(cat => {
                  const Icon = categoryIcons[cat] || Newspaper;
                  const color = categoryColors[cat] || "text-muted-foreground";
                  const catItems = broadcasts.filter(b => b.category === cat);
                  return (
                    <Card key={cat} className="border-border/50">
                      <CardHeader className="pb-2">
                        <CardTitle className={`text-sm flex items-center gap-2 ${color}`}>
                          <Icon className="h-4 w-4" />
                          {cat.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {catItems.length > 0 ? (
                          <div className="space-y-2">
                            {catItems.slice(0, 3).map(item => (
                              <div key={item.id} className="text-xs">
                                <p className="font-medium text-foreground truncate">{item.title}</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{item.body}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-muted-foreground">No updates</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BroadcastStation;
