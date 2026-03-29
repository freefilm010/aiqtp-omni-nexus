import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import {
  Bot,
  Trophy,
  Users,
  Activity,
  BarChart3,
  Sparkles,
  DollarSign,
  Clock,
  Shield,
  Award,
  ShoppingCart,
  Eye,
  CheckCircle2
} from "lucide-react";

interface StrategyAgent {
  id: string;
  name: string;
  description: string | null;
  status: string;
  profitability_score: number | null;
  consistency_score: number | null;
  backtest_count: number | null;
  total_rentals: number | null;
  rental_price_monthly: number | null;
  is_graduated: boolean | null;
  is_available_for_rent: boolean | null;
  admin_approved: boolean | null;
  created_at: string;
}

const AIAgentLeaderboard = () => {
  const { isAdmin } = useAdminAuth();
  const [sortBy, setSortBy] = useState<'score' | 'rentals' | 'newest'>('score');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [agents, setAgents] = useState<StrategyAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('ai_strategies')
        .select('id, name, description, status, profitability_score, consistency_score, backtest_count, total_rentals, rental_price_monthly, is_graduated, is_available_for_rent, admin_approved, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading AI agents:', error);
        setAgents([]);
      } else {
        setAgents((data as StrategyAgent[]) || []);
      }

      setLoading(false);
    };

    fetchAgents();
  }, [isAdmin]);

  const getLifecycle = (agent: StrategyAgent) => {
    if (agent.is_available_for_rent && agent.admin_approved) {
      return { label: 'Client Visible', variant: 'success' as const };
    }

    if (agent.is_available_for_rent) {
      return { label: 'Listed', variant: 'secondary' as const };
    }

    if (agent.is_graduated) {
      return { label: 'Qualified', variant: 'accent' as const };
    }

    if ((agent.backtest_count || 0) > 0) {
      return { label: 'Testing', variant: 'outline' as const };
    }

    return { label: 'Generated', variant: 'outline' as const };
  };

  const leaderboard = useMemo(() => {
    return [...agents].sort((a, b) => {
      if (sortBy === 'rentals') {
        return (b.total_rentals || 0) - (a.total_rentals || 0);
      }

      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      return ((b.profitability_score || 0) + (b.consistency_score || 0)) - ((a.profitability_score || 0) + (a.consistency_score || 0));
    });
  }, [agents, sortBy]);

  const topPerformers = leaderboard.slice(0, 3);
  const clientVisibleCount = agents.filter(agent => agent.is_available_for_rent && agent.is_graduated && agent.admin_approved).length;
  const qualifiedCount = agents.filter(agent => agent.is_graduated).length;
  const listedCount = agents.filter(agent => agent.is_available_for_rent).length;
  const generatedCount = agents.length;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-primary" />;
    if (rank === 2) return <Award className="w-5 h-5 text-foreground" />;
    if (rank === 3) return <Award className="w-5 h-5 text-muted-foreground" />;
    return <span className="font-mono text-sm text-muted-foreground">#{rank}</span>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Activity className="mx-auto mb-3 h-8 w-8 animate-pulse text-primary" />
          <p className="text-muted-foreground">Loading real AI agent inventory…</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <Bot className="h-6 w-6 text-primary" />
            AI Trading Agent Inventory
          </h2>
          <p className="text-muted-foreground text-sm">Real database inventory — generated, qualified, listed, and client-visible agents</p>
        </div>
        <Badge variant={clientVisibleCount > 0 ? 'success' : 'outline'}>
          <Activity className="w-3 h-3 mr-1" />
          {generatedCount} real agents
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Sparkles className="h-7 w-7 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Generated Agents</p>
                <p className="text-3xl font-bold">{generatedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Award className="h-7 w-7 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Qualified</p>
                <p className="text-3xl font-bold">{qualifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-7 w-7 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Listed for Rent</p>
                <p className="text-3xl font-bold">{listedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-7 w-7 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Client Visible</p>
                <p className="text-3xl font-bold">{clientVisibleCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {clientVisibleCount === 0 && (
        <Card className="border-border bg-muted/20">
          <CardContent className="py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">Why no rentable agents are showing</p>
                <p className="text-sm text-muted-foreground">
                  Client listings require all three states: qualified, listed for rent, and approved for client visibility.
                </p>
              </div>
              <Badge variant="outline">Current state: {generatedCount} generated / {qualifiedCount} qualified / {clientVisibleCount} live</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Top Real Agents
            </CardTitle>
            <CardDescription>Ranked from the actual strategy inventory, not a mock list.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            {topPerformers.length === 0 ? (
              <div className="col-span-full rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
                No strategies created yet.
              </div>
            ) : (
              topPerformers.map((agent, idx) => {
                const lifecycle = getLifecycle(agent);

                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgent(agent.id)}
                    className="rounded-lg border border-border bg-card p-4 text-left transition-smooth hover:border-primary/40 hover:bg-accent/30"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      {getRankBadge(idx + 1)}
                      <Badge variant={lifecycle.variant}>{lifecycle.label}</Badge>
                    </div>
                    <p className="font-semibold">{agent.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{agent.description || 'AI-generated trading agent'}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Profitability</p>
                        <p className="font-bold">{agent.profitability_score?.toFixed(1) || '—'}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Backtests</p>
                        <p className="font-bold">{agent.backtest_count || 0}</p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Agent Status Detail
            </CardTitle>
            <CardDescription>
              {selectedAgent ? 'Selected agent lifecycle and client visibility state' : 'Select an agent to inspect its actual marketplace readiness'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              const agent = leaderboard.find(entry => entry.id === selectedAgent) || leaderboard[0];

              if (!agent) {
                return <p className="text-sm text-muted-foreground">No agent data available yet.</p>;
              }

              const lifecycle = getLifecycle(agent);

              return (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold">{agent.name}</p>
                      <p className="text-sm text-muted-foreground">{agent.description || 'AI-generated trading agent'}</p>
                    </div>
                    <Badge variant={lifecycle.variant}>{lifecycle.label}</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-muted-foreground">Profitability</p>
                      <p className="text-xl font-bold">{agent.profitability_score?.toFixed(1) || '—'}%</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-muted-foreground">Consistency</p>
                      <p className="text-xl font-bold">{agent.consistency_score?.toFixed(1) || '—'}%</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-muted-foreground">Renters</p>
                      <p className="text-xl font-bold">{agent.total_rentals || 0}</p>
                    </div>
                    <div className="rounded-lg border border-border p-3">
                      <p className="text-muted-foreground">Rental Price</p>
                      <p className="text-xl font-bold">{agent.rental_price_monthly ? `$${agent.rental_price_monthly}` : '—'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Generated</span>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Qualified for marketplace</span>
                      <span className="font-medium">{agent.is_graduated ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Listed for rent</span>
                      <span className="font-medium">{agent.is_available_for_rent ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Client visible</span>
                      <span className="font-medium">{agent.admin_approved ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                Full Inventory
              </CardTitle>
              <CardDescription>Every accessible strategy row sorted from the real backend inventory.</CardDescription>
            </div>
            <div className="flex gap-1">
              {(['score', 'rentals', 'newest'] as const).map((key) => (
                <Button
                  key={key}
                  variant={sortBy === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy(key)}
                  className="text-xs h-7"
                >
                  {key === 'score' ? 'Readiness' : key === 'rentals' ? 'Rentals' : 'Newest'}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 border-b border-border px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <div className="col-span-1">#</div>
                <div className="col-span-3">Agent</div>
                <div className="col-span-2 text-center">Profit</div>
                <div className="col-span-2 text-center">Consistency</div>
                <div className="col-span-1 text-center">Tests</div>
                <div className="col-span-1 text-center">Rentals</div>
                <div className="col-span-2 text-center">Lifecycle</div>
              </div>

              {leaderboard.map((agent, idx) => (
                (() => {
                  const lifecycle = getLifecycle(agent);

                  return (
                <div 
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id === selectedAgent ? null : agent.id)}
                  className={`grid grid-cols-12 gap-2 px-3 py-3 rounded-lg cursor-pointer transition-all ${
                    selectedAgent === agent.id 
                      ? 'border border-primary/30 bg-primary/5' 
                      : 'border border-transparent hover:bg-accent/30'
                  }`}
                >
                  <div className="col-span-1 flex items-center">
                    {getRankBadge(idx + 1)}
                  </div>
                  <div className="col-span-3 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{agent.name}</p>
                      <p className="text-[10px] text-muted-foreground">{agent.status}</p>
                    </div>
                  </div>
                  <div className="col-span-2 text-center font-mono font-bold">
                    {agent.profitability_score?.toFixed(1) || '—'}%
                  </div>
                  <div className="col-span-2 text-center font-mono">
                    {agent.consistency_score?.toFixed(1) || '—'}%
                  </div>
                  <div className="col-span-1 text-center font-mono text-foreground">
                    {agent.backtest_count || 0}
                  </div>
                  <div className="col-span-1 text-center font-mono text-foreground">
                    {agent.total_rentals || 0}
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <Badge variant={lifecycle.variant}>{lifecycle.label}</Badge>
                  </div>
                </div>
                  );
                })()
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAgentLeaderboard;