import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Crown,
  TrendingUp,
  TrendingDown,
  Star,
  Trophy,
  Users,
  Activity,
  Target,
  Zap,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Sparkles,
  DollarSign,
  Percent,
  Clock,
  Shield,
  Award,
  Flame
} from "lucide-react";
import { 
  BOT_PERSONAS, 
  BOT_PERFORMANCE,
  getAgentLeaderboard,
  getTopPerformers
} from "@/lib/nft/botPersonaNFT";

const AIAgentLeaderboard = () => {
  const [sortBy, setSortBy] = useState<'profitFactor' | 'winRate' | 'profit' | 'subscribers'>('profitFactor');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const leaderboard = useMemo(() => getAgentLeaderboard(sortBy), [sortBy]);
  const topPerformers = useMemo(() => getTopPerformers(3), []);

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-[hsl(43,96%,56%)]" />;
    if (rank === 2) return <Award className="w-5 h-5 text-[hsl(220,10%,75%)]" />;
    if (rank === 3) return <Award className="w-5 h-5 text-[hsl(25,75%,55%)]" />;
    return <span className="font-mono text-sm text-muted-foreground">#{rank}</span>;
  };

  const getStatusColor = (status: string) => {
    if (status === 'running') return 'bg-[hsl(162,91%,32%)]';
    if (status === 'paused') return 'bg-[hsl(43,96%,56%)]';
    return 'bg-[hsl(355,88%,58%)]';
  };

  const getProfitFactorColor = (pf: number) => {
    if (pf >= 3) return 'text-[hsl(162,91%,32%)]';
    if (pf >= 2) return 'text-[hsl(43,96%,56%)]';
    if (pf >= 1) return 'text-foreground';
    return 'text-[hsl(355,88%,58%)]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Trophy className="h-6 w-6 text-[hsl(43,96%,56%)]" />
            AI Trading Agents Leaderboard
          </h2>
          <p className="text-muted-foreground text-sm">Real-time performance rankings • Tickeron-style metrics</p>
        </div>
        <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] border-[hsl(162,91%,32%,0.3)]">
          <Activity className="w-3 h-3 mr-1 animate-pulse" />
          LIVE
        </Badge>
      </div>

      {/* Top 3 Performers - Podium Style */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topPerformers.map((agent, idx) => (
          <Card 
            key={agent.id}
            className={`relative overflow-hidden ${
              idx === 0 
                ? 'bg-gradient-to-br from-[hsl(43,96%,56%,0.1)] to-[hsl(223,18%,9%)] border-[hsl(43,96%,56%,0.3)]' 
                : 'bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]'
            }`}
          >
            {idx === 0 && (
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[hsl(43,96%,56%,0.2)] to-transparent rounded-bl-full" />
            )}
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getRankBadge(idx + 1)}
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                </div>
                <Badge className={`text-[9px] ${idx === 0 ? 'bg-[hsl(43,96%,56%,0.2)] text-[hsl(43,96%,56%)]' : 'bg-[hsl(222,14%,15%)] text-muted-foreground'}`}>
                  {agent.persona?.strategyType}
                </Badge>
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[hsl(270,91%,65%,0.3)] to-[hsl(224,100%,58%,0.2)] flex items-center justify-center border border-[hsl(222,14%,25%)]">
                  <Bot className="w-6 h-6 text-[hsl(270,91%,65%)]" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground">{agent.persona?.name}</h3>
                  <p className="text-xs text-muted-foreground">{agent.persona?.codeName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                  <p className="text-muted-foreground">Profit Factor</p>
                  <p className={`font-bold text-lg ${getProfitFactorColor(agent.profitFactor)}`}>
                    {agent.profitFactor.toFixed(2)}
                  </p>
                </div>
                <div className="p-2 rounded bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                  <p className="text-muted-foreground">Win Rate</p>
                  <p className="font-bold text-lg text-[hsl(162,91%,32%)]">{agent.winRate}%</p>
                </div>
                <div className="p-2 rounded bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                  <p className="text-muted-foreground">Monthly</p>
                  <p className={`font-bold ${agent.monthlyReturn >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                    {agent.monthlyReturn >= 0 ? '+' : ''}{agent.monthlyReturn}%
                  </p>
                </div>
                <div className="p-2 rounded bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                  <p className="text-muted-foreground">Subscribers</p>
                  <p className="font-bold text-foreground">{agent.subscribers.toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-3 h-3 ${i < Math.floor(agent.rating) ? 'text-[hsl(43,96%,56%)] fill-[hsl(43,96%,56%)]' : 'text-muted-foreground'}`} 
                    />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">{agent.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">${agent.totalAssets.toLocaleString()} AUM</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card className="bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[hsl(224,100%,58%)]" />
              Full Rankings
            </CardTitle>
            <div className="flex gap-1">
              {(['profitFactor', 'winRate', 'profit', 'subscribers'] as const).map((key) => (
                <Button
                  key={key}
                  variant={sortBy === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(key)}
                  className={`text-xs h-7 ${sortBy === key ? 'bg-[hsl(224,100%,58%)]' : 'border-[hsl(222,14%,22%)] hover:bg-[hsl(223,18%,15%)]'}`}
                >
                  {key === 'profitFactor' ? 'P.Factor' : key === 'winRate' ? 'Win%' : key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {/* Header Row */}
              <div className="grid grid-cols-12 gap-2 px-3 py-2 text-[10px] font-medium text-muted-foreground uppercase tracking-wider border-b border-[hsl(222,14%,17%)]">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Agent</div>
                <div className="col-span-1 text-center">P.F</div>
                <div className="col-span-1 text-center">Win%</div>
                <div className="col-span-1 text-center">Sharpe</div>
                <div className="col-span-1 text-center">Month</div>
                <div className="col-span-1 text-center">Trades</div>
                <div className="col-span-2 text-center">Total P/L</div>
                <div className="col-span-1 text-center">Status</div>
              </div>

              {leaderboard.map((agent, idx) => (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                  className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                    selectedAgent === agent.id 
                      ? 'bg-[hsl(224,100%,58%,0.1)] border border-[hsl(224,100%,58%,0.3)]' 
                      : 'hover:bg-[hsl(223,18%,12%)] border border-transparent'
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankBadge(idx + 1)}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[hsl(270,91%,65%,0.2)] to-[hsl(224,100%,58%,0.1)] flex items-center justify-center">
                      <Bot className="w-4 h-4 text-[hsl(270,91%,65%)]" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{agent.persona?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.persona?.strategyType}</p>
                    </div>
                  </div>
                  <div className={`col-span-1 text-center font-mono font-bold ${getProfitFactorColor(agent.profitFactor)}`}>
                    {agent.profitFactor.toFixed(2)}
                  </div>
                  <div className="col-span-1 text-center font-mono text-[hsl(162,91%,32%)]">
                    {agent.winRate}%
                  </div>
                  <div className="col-span-1 text-center font-mono text-foreground">
                    {agent.sharpeRatio.toFixed(2)}
                  </div>
                  <div className={`col-span-1 text-center font-mono ${agent.monthlyReturn >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                    {agent.monthlyReturn >= 0 ? '+' : ''}{agent.monthlyReturn}%
                  </div>
                  <div className="col-span-1 text-center font-mono text-muted-foreground">
                    {agent.totalTrades.toLocaleString()}
                  </div>
                  <div className={`col-span-2 text-center font-mono font-bold ${agent.profit >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                    {agent.profit >= 0 ? '+' : ''}${agent.profit.toLocaleString()}
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`} />
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <Card className="bg-[hsl(223,18%,9%)] border-[hsl(224,100%,58%,0.3)]">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[hsl(270,91%,65%)]" />
              Agent Deep Dive
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const agent = leaderboard.find(a => a.id === selectedAgent);
              if (!agent) return null;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Profit Factor</p>
                    <p className={`text-xl font-bold ${getProfitFactorColor(agent.profitFactor)}`}>{agent.profitFactor.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Sortino Ratio</p>
                    <p className="text-xl font-bold text-foreground">{agent.sortinoRatio.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Calmar Ratio</p>
                    <p className={`text-xl font-bold ${agent.calmarRatio >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>{agent.calmarRatio.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Max Drawdown</p>
                    <p className="text-xl font-bold text-[hsl(355,88%,58%)]">-{agent.maxDrawdown}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Alpha</p>
                    <p className={`text-xl font-bold ${agent.alpha >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>{agent.alpha.toFixed(1)}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Beta</p>
                    <p className="text-xl font-bold text-foreground">{agent.beta.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Avg Win</p>
                    <p className="text-xl font-bold text-[hsl(162,91%,32%)]">${agent.avgWin.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Avg Loss</p>
                    <p className="text-xl font-bold text-[hsl(355,88%,58%)]">-${agent.avgLoss.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">R:R Ratio</p>
                    <p className="text-xl font-bold text-foreground">{agent.riskRewardRatio.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Volatility</p>
                    <p className="text-xl font-bold text-[hsl(43,96%,56%)]">{agent.volatility}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">Daily Return</p>
                    <p className={`text-xl font-bold ${agent.dailyReturn >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>{agent.dailyReturn >= 0 ? '+' : ''}{agent.dailyReturn}%</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,12%)]">
                    <p className="text-[10px] text-muted-foreground uppercase">AUM</p>
                    <p className="text-xl font-bold text-foreground">${(agent.totalAssets / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AIAgentLeaderboard;