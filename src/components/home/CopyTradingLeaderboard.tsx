import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";

// eToro + Wundertrading-inspired Copy Trading Leaderboard
// With blockchain-verified performance metrics

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

  const traders: Trader[] = [
    {
      id: '1',
      name: 'QuantumWhale',
      avatar: '🐋',
      tier: 'elite',
      verified: true,
      pnl30d: 47.8,
      pnlAllTime: 312.5,
      winRate: 78,
      maxDrawdown: -8.2,
      sharpeRatio: 2.45,
      copiers: 12453,
      aum: 45600000,
      riskScore: 3,
      strategy: 'AI Momentum + DeFi Yield',
      isHot: true
    },
    {
      id: '2',
      name: 'CryptoSensei',
      avatar: '🥷',
      tier: 'elite',
      verified: true,
      pnl30d: 38.2,
      pnlAllTime: 245.8,
      winRate: 72,
      maxDrawdown: -12.5,
      sharpeRatio: 1.98,
      copiers: 8934,
      aum: 28400000,
      riskScore: 4,
      strategy: 'Swing Trading + Altcoin Alpha'
    },
    {
      id: '3',
      name: 'AlgoTrader_X',
      avatar: '🤖',
      tier: 'pro',
      verified: true,
      pnl30d: 28.5,
      pnlAllTime: 178.3,
      winRate: 81,
      maxDrawdown: -6.8,
      sharpeRatio: 2.12,
      copiers: 5621,
      aum: 12800000,
      riskScore: 2,
      strategy: 'Market Neutral + Arb'
    },
    {
      id: '4',
      name: 'BTCMaxi2024',
      avatar: '₿',
      tier: 'pro',
      verified: true,
      pnl30d: 22.1,
      pnlAllTime: 156.7,
      winRate: 68,
      maxDrawdown: -15.3,
      sharpeRatio: 1.67,
      copiers: 3892,
      aum: 8500000,
      riskScore: 4,
      strategy: 'BTC-Only Accumulation',
      isHot: true
    },
    {
      id: '5',
      name: 'DeFiDegen',
      avatar: '🦄',
      tier: 'rising',
      verified: false,
      pnl30d: 89.3,
      pnlAllTime: 89.3,
      winRate: 65,
      maxDrawdown: -28.4,
      sharpeRatio: 1.23,
      copiers: 1245,
      aum: 980000,
      riskScore: 5,
      strategy: 'High-Risk DeFi Farming'
    },
  ];

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
              <Badge className="bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)] text-[9px] animate-pulse">
                <Flame className="w-3 h-3 mr-1" />
                HOT
              </Badge>
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

      {/* Trader Cards */}
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
                      <div className="font-mono text-sm font-bold text-[hsl(162,91%,32%)]">+{trader.pnl30d}%</div>
                      <div className="text-[8px] text-muted-foreground">30D PnL</div>
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold text-foreground">{trader.winRate}%</div>
                      <div className="text-[8px] text-muted-foreground">Win Rate</div>
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold text-[hsl(355,88%,58%)]">{trader.maxDrawdown}%</div>
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
                  <span className="text-[hsl(162,91%,32%)] font-mono font-bold">+{trader.pnlAllTime}%</span>
                </div>
                <Progress 
                  value={Math.min(trader.pnlAllTime / 4, 100)} 
                  className="h-1.5 [&>div]:bg-gradient-to-r [&>div]:from-[hsl(162,91%,32%)] [&>div]:to-[hsl(43,96%,56%)]" 
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-[hsl(222,14%,15%)]">
        <div className="text-center">
          <div className="font-mono text-xl font-bold text-[hsl(43,96%,56%)]">$892M</div>
          <div className="text-[9px] text-muted-foreground uppercase">Total AUM Copied</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl font-bold text-[hsl(162,91%,32%)]">45.2K</div>
          <div className="text-[9px] text-muted-foreground uppercase">Active Copiers</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-xl font-bold text-[hsl(270,91%,65%)]">+28.4%</div>
          <div className="text-[9px] text-muted-foreground uppercase">Avg. 30D Return</div>
        </div>
      </div>
    </Card>
  );
};

export default CopyTradingLeaderboard;
