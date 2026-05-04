import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { renderApi } from "@/lib/render-api";
import { getBotAvatar } from "@/lib/bots/botAvatars";
import { toast } from "sonner";
import {
  Bot,
  Trophy,
  TrendingUp,
  RefreshCw,
  Filter,
  Search,
  Zap,
  Award,
  BarChart3,
  Users,
} from "lucide-react";

interface Strategy {
  id: string;
  bot_type: string;
  name?: string;
  creator_user_id?: string;
  quality_score: number;
  reliability_score: number;
  win_rate: number;
  total_trades: number;
  total_return: number;
  max_drawdown: number;
  sharpe_ratio: number;
  backtest_cycles: number;
  graduated: boolean;
  active: boolean;
  total_earnings?: number;
  created_at?: string;
}

interface Stats {
  total_bots: number;
  active_bots: number;
  graduated_bots: number;
  pending_graduation: number;
  bot_types: number;
  avg_quality: number;
  avg_reliability: number;
  total_records: number;
  total_earnings: number;
}

const BotRegistry = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "leaderboard">("all");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterGraduated, setFilterGraduated] = useState("all");

  const load = async () => {
    setLoading(true);
    try {
      const [statsRes, allRes, lbRes] = await Promise.all([
        renderApi.admin.stats(),
        renderApi.admin.allStrategies({ limit: 200 }),
        renderApi.admin.leaderboard(50),
      ]);
      setStats(statsRes);
      setStrategies(allRes.strategies ?? []);
      setLeaderboard(lbRes.leaderboard ?? []);
    } catch (e: any) {
      toast.error(`Failed to load bot registry: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = strategies.filter(s => {
    const matchSearch = !search || (s.name ?? s.bot_type).toLowerCase().includes(search.toLowerCase()) || s.bot_type.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" || s.bot_type === filterType;
    const matchGrad = filterGraduated === "all" || (filterGraduated === "yes" ? s.graduated : !s.graduated);
    return matchSearch && matchType && matchGrad;
  });

  const botTypes = [...new Set(strategies.map(s => s.bot_type))].sort();

  const fmt = (n: number, dec = 1) => Number(n ?? 0).toFixed(dec);
  const fmtUsd = (n: number) => `$${Number(n ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Bot Strategy Registry</h2>
          <p className="text-muted-foreground text-sm">All strategies across all users — admin view</p>
        </div>
        <Button onClick={load} variant="outline" size="sm" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[
            { label: "Total Bots", value: stats.total_bots, icon: Bot, color: "text-blue-400" },
            { label: "Active", value: stats.active_bots, icon: Zap, color: "text-green-400" },
            { label: "Graduated", value: stats.graduated_bots, icon: Award, color: "text-yellow-400" },
            { label: "Pending Grad", value: stats.pending_graduation, icon: TrendingUp, color: "text-orange-400" },
            { label: "Total Earnings", value: fmtUsd(stats.total_earnings), icon: BarChart3, color: "text-purple-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
                <div className="text-xl font-bold">{value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Avg Quality / Reliability */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Avg Quality Score</span>
                <span className="text-sm font-bold">{fmt(stats.avg_quality)}%</span>
              </div>
              <Progress value={stats.avg_quality} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Avg Reliability Score</span>
                <span className="text-sm font-bold">{fmt(stats.avg_reliability)}%</span>
              </div>
              <Progress value={stats.avg_reliability} className="h-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {(["all", "leaderboard"] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-t text-sm font-medium transition-colors ${tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t === "all" ? `All Bots (${strategies.length})` : `Leaderboard (${leaderboard.length})`}
          </button>
        ))}
      </div>

      {tab === "all" && (
        <>
          {/* Filters */}
          <div className="flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-40">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search bots..." className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-44">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Bot type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {botTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterGraduated} onValueChange={setFilterGraduated}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Graduated" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="yes">Graduated</SelectItem>
                <SelectItem value="no">Not Graduated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Strategy Cards */}
          <div className="space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading bots...
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">No bots match filters</div>
            ) : filtered.map(s => (
              <Card key={s.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getBotAvatar(s.bot_type)}
                      alt={s.bot_type}
                      className="w-10 h-10 rounded-full object-cover bg-muted"
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold truncate">{s.name ?? s.bot_type}</span>
                        <Badge variant="outline" className="text-xs shrink-0">{s.bot_type}</Badge>
                        {s.graduated && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs shrink-0">Graduated</Badge>}
                        {s.active && <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs shrink-0">Active</Badge>}
                      </div>
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                        <span>Q: <strong className="text-foreground">{fmt(s.quality_score)}%</strong></span>
                        <span>R: <strong className="text-foreground">{fmt(s.reliability_score)}%</strong></span>
                        <span>Win: <strong className="text-foreground">{fmt(s.win_rate)}%</strong></span>
                        <span>Sharpe: <strong className="text-foreground">{fmt(s.sharpe_ratio, 2)}</strong></span>
                        <span>DD: <strong className="text-foreground">{fmt(s.max_drawdown)}%</strong></span>
                        <span>Cycles: <strong className="text-foreground">{(s.backtest_cycles ?? 0).toLocaleString()}</strong></span>
                        {s.total_earnings != null && s.total_earnings > 0 && (
                          <span>Earned: <strong className="text-green-400">{fmtUsd(s.total_earnings)}</strong></span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-right">Showing {filtered.length} of {strategies.length} bots</p>
        </>
      )}

      {tab === "leaderboard" && (
        <div className="space-y-2">
          {leaderboard.map((s, i) => (
            <Card key={s.id} className={i < 3 ? "border-yellow-500/40" : ""}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`text-xl font-black w-8 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-gray-300" : i === 2 ? "text-orange-400" : "text-muted-foreground"}`}>
                    {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i+1}`}
                  </div>
                  <img
                    src={getBotAvatar(s.bot_type)}
                    alt={s.bot_type}
                    className="w-10 h-10 rounded-full object-cover bg-muted"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{s.name ?? s.bot_type}</span>
                      <Badge variant="outline" className="text-xs">{s.bot_type}</Badge>
                    </div>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span>Score: <strong className="text-foreground">{fmt(s.composite_score, 2)}</strong></span>
                      <span>Q: <strong className="text-foreground">{fmt(s.quality_score)}%</strong></span>
                      <span>R: <strong className="text-foreground">{fmt(s.reliability_score)}%</strong></span>
                      <span>Win: <strong className="text-foreground">{fmt(s.win_rate)}%</strong></span>
                    </div>
                  </div>
                  {s.total_earnings > 0 && (
                    <div className="text-right shrink-0">
                      <div className="text-green-400 font-bold text-sm">{fmtUsd(s.total_earnings)}</div>
                      <div className="text-xs text-muted-foreground">earned</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BotRegistry;
