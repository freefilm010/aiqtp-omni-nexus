import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  History, TrendingUp, TrendingDown, AlertTriangle, Zap,
  Search, ChevronLeft, ChevronRight, BookOpen, Filter
} from "lucide-react";
import { HISTORICAL_EVENTS, type HistoricalEvent } from "@/lib/ml/selfTrainingEngine";

const CATEGORY_COLORS: Record<string, string> = {
  crash: 'bg-red-500/20 text-red-400 border-red-500/30',
  contagion: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  euphoria: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  rally: 'bg-green-500/20 text-green-400 border-green-500/30',
  macro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  regulatory: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  geopolitical: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  halving: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  milestone: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  fraud: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};

const CATEGORY_LABELS: Record<string, string> = {
  crash: '💥 Crash',
  contagion: '🔥 Contagion',
  euphoria: '🎉 Euphoria',
  rally: '📈 Rally',
  macro: '🏛️ Macro',
  regulatory: '⚖️ Regulatory',
  geopolitical: '🌍 Geopolitical',
  halving: '⛏️ Halving',
  milestone: '🏁 Milestone',
  fraud: '🚨 Fraud',
};

const HistoricalEventsChart = () => {
  const [selectedEvent, setSelectedEvent] = useState<HistoricalEvent | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDecade, setFilterDecade] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 15;

  const categories = useMemo(() => {
    const cats = new Set(HISTORICAL_EVENTS.map(e => e.category));
    return Array.from(cats).sort();
  }, []);

  const decades = useMemo(() => {
    const ds = new Set(HISTORICAL_EVENTS.map(e => e.date.substring(0, 3) + '0s'));
    return Array.from(ds).sort();
  }, []);

  const filtered = useMemo(() => {
    return HISTORICAL_EVENTS.filter(e => {
      if (filterCategory !== 'all' && e.category !== filterCategory) return false;
      if (filterDecade !== 'all' && !e.date.startsWith(filterDecade.substring(0, 3))) return false;
      if (searchQuery && !e.event.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [filterCategory, filterDecade, searchQuery]);

  const paged = filtered.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

  // Stats
  const statsByCategory = useMemo(() => {
    const stats: Record<string, { count: number; avgImpact: number }> = {};
    HISTORICAL_EVENTS.forEach(e => {
      if (!stats[e.category]) stats[e.category] = { count: 0, avgImpact: 0 };
      stats[e.category].count++;
      stats[e.category].avgImpact += e.impact;
    });
    for (const k of Object.keys(stats)) {
      stats[k].avgImpact /= stats[k].count;
    }
    return stats;
  }, []);

  const maxAbsImpact = Math.max(...HISTORICAL_EVENTS.map(e => Math.abs(e.impact)));

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <BookOpen className="h-4 w-4 text-primary" />
            Interactive Market History (1980–2025)
            <Badge variant="outline" className="ml-auto">{HISTORICAL_EVENTS.length} events</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Category Overview */}
          <div className="flex flex-wrap gap-1">
            {Object.entries(statsByCategory).map(([cat, s]) => (
              <button
                key={cat}
                onClick={() => { setFilterCategory(cat === filterCategory ? 'all' : cat); setPage(0); }}
                className={`text-[10px] px-2 py-0.5 rounded-full border transition-all ${
                  filterCategory === cat ? 'ring-1 ring-primary' : ''
                } ${CATEGORY_COLORS[cat] || 'bg-muted text-muted-foreground'}`}
              >
                {CATEGORY_LABELS[cat] || cat} ({s.count})
              </button>
            ))}
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setPage(0); }}
                className="pl-7 h-8 text-xs"
              />
            </div>
            <Select value={filterDecade} onValueChange={v => { setFilterDecade(v); setPage(0); }}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {decades.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Impact Bar Chart */}
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="h-3 w-3" />
            Impact Timeline ({filtered.length} events)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-[400px] overflow-y-auto">
          {paged.map((e, i) => {
            const barWidth = Math.abs(e.impact) / maxAbsImpact * 100;
            const isPositive = e.impact > 0;
            const isSelected = selectedEvent?.date === e.date;

            return (
              <button
                key={`${e.date}-${i}`}
                onClick={() => setSelectedEvent(isSelected ? null : e)}
                className={`w-full text-left p-2 rounded transition-all hover:bg-muted/50 ${
                  isSelected ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-20 shrink-0">
                    {e.date}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{e.event}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isPositive ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {isPositive ? '+' : ''}{e.impact}%
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[8px] shrink-0 ${CATEGORY_COLORS[e.category] || ''}`}
                  >
                    {e.category}
                  </Badge>
                </div>

                {/* Expanded Detail */}
                {isSelected && (
                  <div className="mt-2 p-2 rounded bg-muted/50 space-y-1">
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground">Category:</span>{' '}
                        <span className="text-foreground">{CATEGORY_LABELS[e.category] || e.category}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Market Impact:</span>{' '}
                        <span className={isPositive ? 'text-green-500' : 'text-red-500'}>
                          {isPositive ? '+' : ''}{e.impact}%
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                      {getEducationalNote(e)}
                    </p>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className="text-[8px]">
                        {isPositive ? <TrendingUp className="h-2.5 w-2.5 mr-0.5" /> : <TrendingDown className="h-2.5 w-2.5 mr-0.5" />}
                        {Math.abs(e.impact) > 30 ? 'Extreme' : Math.abs(e.impact) > 15 ? 'Major' : 'Moderate'}
                      </Badge>
                      <Badge variant="outline" className="text-[8px]">
                        {e.impact < -20 ? '🛡️ Risk mgmt critical' : e.impact > 15 ? '🚀 Momentum opportunity' : '📊 Standard conditions'}
                      </Badge>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

function getEducationalNote(event: HistoricalEvent): string {
  const notes: Record<string, string> = {
    'crash': `Crashes test drawdown limits and stop-loss effectiveness. Strategies that survive ${Math.abs(event.impact)}%+ drops demonstrate robust risk management.`,
    'contagion': `Contagion events cause correlation spikes across assets. Diversification fails — survival depends on position sizing and cash reserves.`,
    'euphoria': `Euphoria peaks often precede sharp reversals. Momentum strategies profit on the way up but must exit before the top.`,
    'rally': `Rally phases reward trend-following and momentum. Key lesson: don't fight the trend, but watch for exhaustion signals.`,
    'macro': `Macro events (rates, policy, currency) create regime shifts. Strategies must adapt to new volatility and correlation structures.`,
    'regulatory': `Regulatory events create binary outcomes. Position sizing should account for gap risk around policy announcements.`,
    'geopolitical': `Geopolitical shocks cause immediate risk-off moves. Recovery patterns vary — some recover in days, others create lasting regime changes.`,
    'halving': `Supply shocks (halvings) historically precede multi-month rallies. Patience and accumulation strategies outperform.`,
    'milestone': `Market milestones mark psychological levels. They can act as resistance (profit-taking) or support (buy-the-dip).`,
    'fraud': `Fraud/trust events destroy confidence rapidly. The lesson: counterparty risk management and on-chain verification matter.`,
  };
  return notes[event.category] || 'This event provides training data for strategy resilience testing.';
}

export default HistoricalEventsChart;
