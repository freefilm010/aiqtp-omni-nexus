import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Trophy, TrendingUp, Users, Flame, Crown, Medal,
  Zap, Target, BarChart3, Clock, Calendar, Star,
  Pickaxe, Brain, ArrowRight, Swords
} from "lucide-react";

interface UserStat {
  period_type: string;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  total_pnl: number;
  best_trade_pnl: number;
  strategies_created: number;
  strategies_graduated: number;
  backtests_run: number;
  avg_sharpe: number;
  referrals_made: number;
  referrals_verified: number;
  predictions_made: number;
  prediction_accuracy: number;
  login_streak: number;
  longest_streak: number;
  achievements_earned: number;
  total_points: number;
  qtc_mined: number;
  overall_rank: number | null;
  trading_rank: number | null;
  social_rank: number | null;
}

interface LeaderboardEntry {
  id: string;
  rank: number;
  score: number;
  display_name: string | null;
  highlight_stat: string | null;
  badge: string | null;
  category: string;
}

interface Contest {
  id: string;
  name: string;
  description: string | null;
  category: string;
  metric: string;
  status: string;
  starts_at: string;
  ends_at: string;
  prize_description: string | null;
  prize_value_usd: number;
  participant_count: number;
}

const periodTabs = [
  { value: "daily", label: "Today", icon: <Clock className="h-4 w-4" /> },
  { value: "weekly", label: "This Week", icon: <Calendar className="h-4 w-4" /> },
  { value: "monthly", label: "Monthly", icon: <BarChart3 className="h-4 w-4" /> },
  { value: "quarterly", label: "Quarterly", icon: <TrendingUp className="h-4 w-4" /> },
  { value: "yearly", label: "Yearly", icon: <Star className="h-4 w-4" /> },
  { value: "all_time", label: "All-Time", icon: <Crown className="h-4 w-4" /> },
];

const categoryIcons: Record<string, React.ReactNode> = {
  overall: <Trophy className="h-4 w-4" />,
  trading: <TrendingUp className="h-4 w-4" />,
  social: <Users className="h-4 w-4" />,
  referrals: <Users className="h-4 w-4" />,
  mining: <Pickaxe className="h-4 w-4" />,
  predictions: <Brain className="h-4 w-4" />,
  strategies: <Target className="h-4 w-4" />,
};

const rankBadge = (rank: number) => {
  if (rank === 1) return "👑";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  if (rank <= 10) return "🔥";
  return "";
};

const StatsArenaPage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("weekly");
  const [myStats, setMyStats] = useState<UserStat | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderCategory, setLeaderCategory] = useState("overall");
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, []);

  useEffect(() => {
    if (user) fetchMyStats();
    fetchLeaderboard();
  }, [user, period, leaderCategory]);

  const fetchMyStats = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("period_type", period)
      .order("period_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    setMyStats(data as unknown as UserStat | null);
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("leaderboard_entries")
      .select("id, period_type, category, rank, score, display_name, avatar_url, highlight_stat, badge, period_start, updated_at")
      .eq("period_type", period)
      .eq("category", leaderCategory)
      .order("rank")
      .limit(50);
    setLeaderboard((data as unknown as LeaderboardEntry[]) || []);
    setLoading(false);
  };

  const fetchContests = async () => {
    const { data } = await supabase
      .from("stat_contests")
      .select("*")
      .in("status", ["active", "upcoming"])
      .order("ends_at");
    setContests((data as unknown as Contest[]) || []);
  };

  const joinContest = async (contestId: string) => {
    if (!user) { toast.error("Sign in to join contests"); return; }
    const { error } = await supabase
      .from("contest_entries")
      .insert({ contest_id: contestId, user_id: user.id });
    if (error?.code === "23505") toast.info("You're already in this contest!");
    else if (error) toast.error("Failed to join");
    else { toast.success("Joined the contest! 🏆"); fetchContests(); }
  };

  const timeLeft = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return "Ended";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const statCards = myStats ? [
    { label: "Win Rate", value: `${myStats.win_rate}%`, icon: <Target className="h-4 w-4" />, color: myStats.win_rate >= 60 ? "text-emerald-400" : "text-muted-foreground" },
    { label: "Total P&L", value: `$${myStats.total_pnl.toLocaleString()}`, icon: <TrendingUp className="h-4 w-4" />, color: myStats.total_pnl >= 0 ? "text-emerald-400" : "text-destructive" },
    { label: "Trades", value: myStats.total_trades.toString(), icon: <BarChart3 className="h-4 w-4" />, color: "text-primary" },
    { label: "Best Trade", value: `$${myStats.best_trade_pnl.toLocaleString()}`, icon: <Flame className="h-4 w-4" />, color: "text-amber-400" },
    { label: "Strategies", value: myStats.strategies_created.toString(), icon: <Target className="h-4 w-4" />, color: "text-primary" },
    { label: "Graduated", value: myStats.strategies_graduated.toString(), icon: <Medal className="h-4 w-4" />, color: "text-yellow-400" },
    { label: "Referrals", value: myStats.referrals_verified.toString(), icon: <Users className="h-4 w-4" />, color: "text-sky-400" },
    { label: "Predictions", value: `${myStats.prediction_accuracy}%`, icon: <Brain className="h-4 w-4" />, color: "text-purple-400" },
    { label: "Login Streak", value: `${myStats.login_streak}🔥`, icon: <Flame className="h-4 w-4" />, color: "text-orange-400" },
    { label: "$QTC Mined", value: myStats.qtc_mined.toLocaleString(), icon: <Pickaxe className="h-4 w-4" />, color: "text-emerald-400" },
    { label: "Points", value: myStats.total_points.toLocaleString(), icon: <Star className="h-4 w-4" />, color: "text-yellow-400" },
    { label: "Achievements", value: myStats.achievements_earned.toString(), icon: <Trophy className="h-4 w-4" />, color: "text-amber-400" },
  ] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight flex items-center justify-center gap-3">
            <Swords className="h-8 w-8 text-primary" />
            Stats Arena
          </h1>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Every trade, every referral, every prediction — tracked like a pro sport. Compete daily, weekly, monthly, quarterly, and yearly.
          </p>
        </div>

        {/* Period Selector */}
        <Tabs value={period} onValueChange={setPeriod} className="mb-8">
          <TabsList className="flex flex-wrap h-auto gap-1 justify-center">
            {periodTabs.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm">
                {t.icon} {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: My Stats Card */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Trophy className="h-5 w-5 text-primary" />
                  My Stats — {periodTabs.find(p => p.value === period)?.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!user ? (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-sm text-muted-foreground">Sign in to track your stats</p>
                    <Button size="sm" onClick={() => window.location.href = "/auth"}>
                      Sign In <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ) : !myStats ? (
                  <div className="text-center py-6 space-y-2">
                    <Zap className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">No stats yet for this period</p>
                    <p className="text-xs text-muted-foreground">Start trading, referring, and predicting to build your stats!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {statCards.map(s => (
                      <div key={s.label} className="bg-muted/30 rounded-lg p-2.5 text-center">
                        <div className={`flex items-center justify-center gap-1 mb-0.5 ${s.color}`}>
                          {s.icon}
                        </div>
                        <p className="text-lg font-black font-mono">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rankings */}
                {myStats && (myStats.overall_rank || myStats.trading_rank || myStats.social_rank) && (
                  <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Your Rankings</p>
                    <div className="flex gap-2 flex-wrap">
                      {myStats.overall_rank && (
                        <Badge variant="outline" className="text-xs">
                          {rankBadge(myStats.overall_rank)} Overall #{myStats.overall_rank}
                        </Badge>
                      )}
                      {myStats.trading_rank && (
                        <Badge variant="outline" className="text-xs">
                          {rankBadge(myStats.trading_rank)} Trading #{myStats.trading_rank}
                        </Badge>
                      )}
                      {myStats.social_rank && (
                        <Badge variant="outline" className="text-xs">
                          {rankBadge(myStats.social_rank)} Social #{myStats.social_rank}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Active Contests */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Swords className="h-5 w-5 text-primary" />
                  Live Contests
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contests.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No active contests</p>
                ) : (
                  contests.map(contest => (
                    <div key={contest.id} className="border border-border/50 rounded-lg p-3 space-y-2 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold truncate">{contest.name}</h4>
                          <p className="text-[10px] text-muted-foreground line-clamp-1">{contest.description}</p>
                        </div>
                        <Badge variant={contest.status === "active" ? "default" : "secondary"} className="text-[10px] shrink-0">
                          {contest.status === "active" ? "LIVE" : "SOON"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          {categoryIcons[contest.category]} {contest.category}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {timeLeft(contest.ends_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-primary">{contest.prize_description}</span>
                        <Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => joinContest(contest.id)}>
                          Join
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Leaderboards */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Crown className="h-5 w-5 text-yellow-400" />
                    Leaderboard
                  </CardTitle>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(categoryIcons).map(([cat, icon]) => (
                      <Button
                        key={cat}
                        variant={leaderCategory === cat ? "default" : "ghost"}
                        size="sm"
                        className="text-xs h-7 gap-1"
                        onClick={() => setLeaderCategory(cat)}
                      >
                        {icon} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Trophy className="h-12 w-12 text-muted-foreground mx-auto" />
                    <h3 className="text-lg font-bold">Leaderboard Awaits</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Stats are computed automatically as you trade, refer, predict, and mine. 
                      The leaderboard populates as activity flows in — be the first to claim the top spot!
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                      {["🏆 Trade to rank", "👥 Refer friends", "🧠 Make predictions", "⛏️ Mine $QTC"].map(tip => (
                        <Badge key={tip} variant="outline" className="text-xs">{tip}</Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">Player</div>
                      <div className="col-span-3 text-right">Score</div>
                      <div className="col-span-3 text-right">Highlight</div>
                    </div>
                    {leaderboard.map((entry, idx) => {
                      return (
                        <div
                          key={entry.id}
                          className={`grid grid-cols-12 gap-2 px-3 py-2.5 rounded-lg transition-colors ${
                            idx < 3 ? "bg-muted/30" : "hover:bg-muted/20"
                          }`}
                        >
                          <div className="col-span-1 font-mono font-bold text-sm flex items-center">
                            {entry.badge || rankBadge(entry.rank) || entry.rank}
                          </div>
                          <div className="col-span-5 flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium truncate">
                              {entry.display_name || `Player #${entry.rank}`}
                            </span>
                          </div>
                          <div className="col-span-3 text-right font-mono font-bold text-sm">
                            {entry.score.toLocaleString()}
                          </div>
                          <div className="col-span-3 text-right text-xs text-muted-foreground truncate">
                            {entry.highlight_stat || "—"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default StatsArenaPage;
