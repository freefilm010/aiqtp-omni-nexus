import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { 
  Trophy,
  Users,
  TrendingUp,
  Star,
  Crown,
  Shield,
  Copy,
  ChevronRight,
  Flame,
  Target,
  Award,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { Link } from "react-router-dom";

interface Trader {
  id: string;
  name: string;
  avatar: string;
  tier: 'elite' | 'pro' | 'rising';
  verified: boolean;
  pnl30d: number;
  pnlAllTime: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  copiers: number;
  aum: number;
  riskScore: 1 | 2 | 3 | 4 | 5;
  strategy: string;
  isHot?: boolean;
}

const CopyTradingLeaderboard = () => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'elite' | 'pro' | 'rising'>('all');
  const [sortBy, setSortBy] = useState<'pnl' | 'winRate' | 'copiers'>('pnl');
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTraders();
  }, []);

  const fetchTraders = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('copy_trading_leaders')
        .select('*')
        .eq('is_active', true)
        .order('pnl_30d', { ascending: false })
        .limit(20);

      if (fetchError) throw fetchError;

      const mapped: Trader[] = (data || []).map(t => ({
        id: t.id,
        name: t.display_name,
        avatar: t.avatar || '👤',
        tier: t.tier as 'elite' | 'pro' | 'rising',
        verified: t.is_verified || false,
        pnl30d: Number(t.pnl_30d) || 0,
        pnlAllTime: Number(t.pnl_all_time) || 0,
        winRate: Number(t.win_rate) || 0,
        maxDrawdown: Number(t.max_drawdown) || 0,
        sharpeRatio: Number(t.sharpe_ratio) || 0,
        copiers: t.copiers_count || 0,
        aum: Number(t.aum) || 0,
        riskScore: (t.risk_score || 3) as 1 | 2 | 3 | 4 | 5,
        strategy: t.strategy_description || '',
        isHot: t.is_hot
      }));

      setTraders(mapped);
    } catch (err: any) {
      console.error('Error fetching traders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredTraders = activeFilter === 'all' 
    ? traders 
    : traders.filter(t => t.tier === activeFilter);

  const sortedTraders = [...filteredTraders].sort((a, b) => {
    switch (sortBy) {
      case 'pnl': return b.pnl30d - a.pnl30d;
      case 'winRate': return b.winRate - a.winRate;
      case 'copiers': return b.copiers - a.copiers;
      default: return 0;
    }
  });

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return { bg: 'bg-[hsl(43,96%,56%,0.15)]', text: 'text-[hsl(43,96%,56%)]', border: 'border-[hsl(43,96%,56%,0.3)]' };
      case 'pro': return { bg: 'bg-[hsl(270,91%,65%,0.15)]', text: 'text-[hsl(270,91%,65%)]', border: 'border-[hsl(270,91%,65%,0.3)]' };
      case 'rising': return { bg: 'bg-[hsl(162,91%,32%,0.15)]', text: 'text-[hsl(162,91%,32%)]', border: 'border-[hsl(162,91%,32%,0.3)]' };
      default: return { bg: 'bg-[hsl(222,14%,20%)]', text: 'text-muted-foreground', border: 'border-[hsl(222,14%,20%)]' };
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 2) return 'text-[hsl(162,91%,32%)]';
    if (score <= 3) return 'text-[hsl(43,96%,56%)]';
    return 'text-[hsl(355,88%,58%)]';
  };

  const totalAum = traders.reduce((sum, t) => sum + t.aum, 0);
  const totalCopiers = traders.reduce((sum, t) => sum + t.copiers, 0);
  const avgReturn = traders.length > 0 
    ? traders.reduce((sum, t) => sum + t.pnl30d, 0) / traders.length 
    : 0;

  return (
    <Card className="p-5 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(43,96%,56%,0.2)] to-[hsl(43,96%,56%,0.05)]">
            <Trophy className="w-5 h-5 text-[hsl(43,96%,56%)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">Copy Trading Leaderboard</h3>
            </div>
            <p className="text-[10px] text-muted-foreground">Blockchain-verified performance • One-click copy</p>
          </div>
        </div>
        <Link to="/social-trading">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            All Traders <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Traders', icon: Users },
            { id: 'elite', label: 'Elite', icon: Crown },
            { id: 'pro', label: 'Pro', icon: Award },
            { id: 'rising', label: 'Rising Stars', icon: Star },
          ].map((filter) => {
            const Icon = filter.icon;
            return (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all ${
                  activeFilter === filter.id
                    ? 'bg-[hsl(43,96%,56%,0.15)] text-[hsl(43,96%,56%)] border border-[hsl(43,96%,56%,0.3)]'
                    : 'bg-[hsl(223,18%,12%)] text-muted-foreground hover:text-foreground border border-transparent'
                }`}
              >
                <Icon className="w-3 h-3" />
                {filter.label}
              </button>
            );
          })}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[hsl(223,18%,12%)] border border-[hsl(222,14%,20%)] rounded-lg px-2 py-1 text-[10px] text-foreground"
          >
            <option value="pnl">30D PnL</option>
            <option value="winRate">Win Rate</option>
            <option value="copiers">Copiers</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="flex items-center gap-2 text-destructive py-8 justify-center">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading traders</span>
        </div>
      ) : sortedTraders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No Traders Available</p>
          <p className="text-sm">Copy trading leaders will appear here when registered.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTraders.map((trader, index) => {
            const tierColors = getTierColor(trader.tier);
            
            return (
              <div 
                key={trader.id}
                className={`relative p-4 rounded-xl bg-[hsl(223,18%,7%)] border ${tierColors.border} hover:bg-[hsl(223,18%,9%)] transition-all group`}
              >
                {/* Rank Badge */}
                <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-[hsl(223,18%,12%)] border border-[hsl(222,14%,20%)] flex items-center justify-center">
                  <span className="font-mono text-[10px] font-bold text-foreground">#{index + 1}</span>
                </div>

                {/* Hot Badge */}
                {trader.isHot && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)] text-[8px]">
                      <Flame className="w-2.5 h-2.5 mr-0.5" />
                      HOT
                    </Badge>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl ${tierColors.bg} flex items-center justify-center text-2xl`}>
                      {trader.avatar}
                    </div>
                    {trader.verified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[hsl(224,100%,58%)] flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-foreground">{trader.name}</span>
                      <Badge className={`text-[8px] ${tierColors.bg} ${tierColors.text}`}>
                        {trader.tier.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2 truncate">{trader.strategy}</p>
                    
                    {/* Stats Row */}
                    <div className="grid grid-cols-4 gap-3 text-center">
                      <div>
                        <div className={`font-mono text-sm font-bold ${trader.pnl30d >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                          {trader.pnl30d >= 0 ? '+' : ''}{trader.pnl30d.toFixed(1)}%
                        </div>
                        <div className="text-[8px] text-muted-foreground">30D PnL</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-foreground">{trader.winRate.toFixed(0)}%</div>
                        <div className="text-[8px] text-muted-foreground">Win Rate</div>
                      </div>
                      <div>
                        <div className="font-mono text-sm font-bold text-[hsl(355,88%,58%)]">{trader.maxDrawdown.toFixed(1)}%</div>
                        <div className="text-[8px] text-muted-foreground">Max DD</div>
                      </div>
                      <div>
                        <div className={`font-mono text-sm font-bold ${getRiskColor(trader.riskScore)}`}>
                          {'●'.repeat(trader.riskScore)}{'○'.repeat(5-trader.riskScore)}
                        </div>
                        <div className="text-[8px] text-muted-foreground">Risk</div>
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right mb-1">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-3 h-3" />
                        <span className="font-mono text-[10px]">{trader.copiers.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-mono text-[10px]">${(trader.aum / 1000000).toFixed(1)}M</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="h-8 px-4 bg-gradient-to-r from-[hsl(162,91%,32%)] to-[hsl(162,91%,40%)] hover:opacity-90 text-white text-[10px] font-bold"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="mt-3 pt-3 border-t border-[hsl(222,14%,15%)]">
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-1">
                    <span>All-Time Performance</span>
                    <span className={`font-mono font-bold ${trader.pnlAllTime >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                      {trader.pnlAllTime >= 0 ? '+' : ''}{trader.pnlAllTime.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(Math.abs(trader.pnlAllTime) / 4, 100)} 
                    className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(162,91%,32%)] [&>div]:to-[hsl(43,96%,56%)]" 
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[hsl(222,14%,15%)]">
        <div className="text-center">
          <div className="font-mono text-xl font-bold text-[hsl(43,96%,56%)]">
            ${(totalAum / 1000000).toFixed(0)}M
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Total AUM Copied</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl font-bold text-[hsl(162,91%,32%)]">
            {(totalCopiers / 1000).toFixed(1)}K
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Active Copiers</div>
        </div>
        <div className="text-center">
          <div className={`font-mono text-xl font-bold ${avgReturn >= 0 ? 'text-[hsl(270,91%,65%)]' : 'text-[hsl(355,88%,58%)]'}`}>
            {avgReturn >= 0 ? '+' : ''}{avgReturn.toFixed(1)}%
          </div>
          <div className="text-[9px] text-muted-foreground uppercase">Avg. 30D Return</div>
        </div>
      </div>
    </Card>
  );
};

export default CopyTradingLeaderboard;