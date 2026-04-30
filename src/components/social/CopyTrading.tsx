import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  TrendingUp, 
  Star, 
  Copy, 
  Shield, 
  Trophy,
  BarChart3,
  Clock,
  DollarSign,
  Target,
  Eye,
  UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { toSafePublicName } from "@/lib/users/publicName";

interface TopTrader {
  id: string;
  name: string;
  avatar: string;
  followers: number;
  pnl30d: number;
  winRate: number;
  totalTrades: number;
  maxDrawdown: number;
  sharpeRatio: number;
  aum: number;
  copiers: number;
  verified: boolean;
  strategy: string;
  riskLevel: "low" | "medium" | "high";
  isFollowing: boolean;
}

const CopyTrading = () => {
  const [traders, setTraders] = useState<TopTrader[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copyAmount, setCopyAmount] = useState(1000);
  const [maxSlippage, setMaxSlippage] = useState([1]);
  const [selectedTrader, setSelectedTrader] = useState<TopTrader | null>(null);

  // Fetch real copy trading leaders from database
  useEffect(() => {
    const fetchLeaders = async () => {
      const { data, error } = await supabase
        .from("copy_trading_leaders")
        .select("*")
        .eq("is_active", true)
        .order("pnl_all_time", { ascending: false });

      if (!error && data && data.length > 0) {
        setTraders(data.map(d => ({
          id: d.id,
          name: toSafePublicName({ username: d.user_id, fallbackId: d.id }),
          avatar: d.avatar || "",
          followers: d.copiers_count || 0,
          pnl30d: d.pnl_30d || 0,
          winRate: d.win_rate || 0,
          totalTrades: 0,
          maxDrawdown: d.max_drawdown || 0,
          sharpeRatio: d.sharpe_ratio || 0,
          aum: d.aum || 0,
          copiers: d.copiers_count || 0,
          verified: d.is_verified || false,
          strategy: d.strategy_description || d.tier,
          riskLevel: (d.risk_score || 0) > 7 ? "high" : (d.risk_score || 0) > 4 ? "medium" : "low",
          isFollowing: false,
        })));
      }
    };
    fetchLeaders();
  }, []);

  const handleFollow = (traderId: string) => {
    setTraders(prev => 
      prev.map(t => 
        t.id === traderId ? { ...t, isFollowing: !t.isFollowing } : t
      )
    );
    toast.success("Trader followed successfully");
  };

  const handleStartCopying = (trader: TopTrader) => {
    setSelectedTrader(trader);
  };

  const confirmCopyTrading = () => {
    if (selectedTrader) {
      toast.success(`Started copying ${selectedTrader.name} with $${copyAmount}`);
      setSelectedTrader(null);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "low": return "text-green-500 bg-green-500/10";
      case "medium": return "text-yellow-500 bg-yellow-500/10";
      case "high": return "text-red-500 bg-red-500/10";
      default: return "text-muted-foreground";
    }
  };

  const filteredTraders = traders.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.strategy.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCopiers = traders.reduce((sum, t) => sum + t.copiers, 0);
  const totalAum = traders.reduce((sum, t) => sum + t.aum, 0);
  const avgReturn = traders.length > 0 ? traders.reduce((sum, t) => sum + t.pnl30d, 0) / traders.length : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Copy Trading</h2>
          <p className="text-muted-foreground">Follow and copy top performing traders</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search traders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10">
                <Users className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Traders</p>
                <p className="text-base sm:text-xl font-bold text-foreground">{traders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">30D Avg</p>
                <p className={`text-base sm:text-xl font-bold ${avgReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-500/10">
                <Copy className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Copiers</p>
                <p className="text-base sm:text-xl font-bold text-foreground">{totalCopiers.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-yellow-500/10">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">AUM</p>
                <p className="text-base sm:text-xl font-bold text-foreground">${(totalAum / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="leaderboard" className="space-y-4">
        <TabsList>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="following">Following</TabsTrigger>
          <TabsTrigger value="copying">My Copy Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="leaderboard" className="space-y-4">
          {filteredTraders.map((trader, index) => (
            <Card key={trader.id} className="bg-card border-border hover:border-primary/50 transition-colors">
              <CardContent className="p-3 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative">
                      <Avatar className="h-10 w-10 sm:h-14 sm:w-14">
                        <AvatarImage src={trader.avatar} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {trader.name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {index < 3 && (
                        <div className="absolute -top-1 -right-1 p-1 rounded-full bg-yellow-500">
                          <Trophy className="h-3 w-3 text-black" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{trader.name}</h3>
                        {trader.verified && (
                          <Shield className="h-4 w-4 text-blue-500" />
                        )}
                        <Badge className={getRiskColor(trader.riskLevel)}>
                          {trader.riskLevel} risk
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{trader.strategy}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          <Users className="h-3 w-3 inline mr-1" />
                          {trader.followers.toLocaleString()} followers
                        </span>
                        <span className="text-muted-foreground">
                          <Copy className="h-3 w-3 inline mr-1" />
                          {trader.copiers} copying
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 text-center">
                      <div>
                        <p className="text-xs text-muted-foreground">30D PnL</p>
                        <p className={`font-bold ${trader.pnl30d >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {trader.pnl30d >= 0 ? '+' : ''}{trader.pnl30d}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Win Rate</p>
                        <p className="font-bold text-foreground">{trader.winRate}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Sharpe</p>
                        <p className="font-bold text-foreground">{trader.sharpeRatio}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Max DD</p>
                        <p className="font-bold text-red-400">{trader.maxDrawdown}%</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant={trader.isFollowing ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => handleFollow(trader.id)}
                      >
                        {trader.isFollowing ? (
                          <>
                            <Eye className="h-4 w-4 mr-1" />
                            Following
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Follow
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleStartCopying(trader)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Trade
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="following">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                You're following {traders.filter(t => t.isFollowing).length} traders
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="copying">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <p className="text-muted-foreground text-center py-8">
                No active copy trades. Start by copying a trader from the leaderboard.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Copy Trading Modal */}
      {selectedTrader && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Copy className="h-5 w-5" />
                Copy {selectedTrader.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Investment Amount (USD)</label>
                <Input
                  type="number"
                  value={copyAmount}
                  onChange={(e) => setCopyAmount(Number(e.target.value))}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Max Slippage: {maxSlippage[0]}%
                </label>
                <Slider
                  value={maxSlippage}
                  onValueChange={setMaxSlippage}
                  max={5}
                  step={0.1}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Max Profit Limit (USD) — auto-close when reached
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 5000 (leave blank for unlimited)"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground">
                  Max Loss Limit (USD) — stop copying when hit
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 500 (leave blank for unlimited)"
                  className="mt-1"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Copy stop-loss settings</span>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Copy take-profit settings</span>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Auto-pause on max loss</span>
                <Switch defaultChecked />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setSelectedTrader(null)}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={confirmCopyTrading}>
                  Start Copying
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CopyTrading;
