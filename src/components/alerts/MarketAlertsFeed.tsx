import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Bell, BellRing, TrendingUp, TrendingDown, Activity, BarChart3,
  Newspaper, Users, AlertTriangle, Volume2, Gauge, Building2,
  Landmark, Target, Zap, Eye, EyeOff, Filter, RefreshCw,
  ChevronRight, ExternalLink, BookmarkPlus, Share2, CheckCircle,
  Clock, DollarSign, PieChart, Flame
} from "lucide-react";

type AlertCategory = 'pattern' | 'technical' | 'volume' | 'news' | 'politician' | 'economic' | 'whale' | 'sentiment' | 'price' | 'anomaly';
type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface MarketAlert {
  id: string;
  category: AlertCategory;
  severity: AlertSeverity;
  symbol?: string;
  title: string;
  description: string;
  timestamp: Date;
  read: boolean;
  bookmarked: boolean;
  source: string;
  actionable: boolean;
  metrics?: Record<string, string | number>;
  link?: string;
}

const CATEGORY_ICONS: Record<string, typeof Bell> = {
  pattern: BarChart3, technical: Activity, volume: Volume2, news: Newspaper,
  politician: Landmark, economic: Building2, whale: DollarSign,
  sentiment: Gauge, price: TrendingUp, anomaly: AlertTriangle,
};

const SEVERITY_STYLES: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/20",
  high: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  low: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  info: "bg-muted text-muted-foreground border-border",
};

const MarketAlertsFeed = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [filter, setFilter] = useState<AlertCategory | 'all'>('all');
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const loadAlerts = useCallback(async () => {
    setIsLoading(true);
    const query = supabase
      .from("market_alerts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data, error } = await query;
    if (!error && data) {
      setAlerts(data.map((a: any) => ({
        id: a.id,
        category: a.category as AlertCategory,
        severity: a.severity as AlertSeverity,
        symbol: a.symbol,
        title: a.title,
        description: a.description,
        timestamp: new Date(a.created_at),
        read: a.read,
        bookmarked: a.bookmarked,
        source: a.source,
        actionable: a.actionable,
        metrics: a.metrics as Record<string, string | number> || undefined,
        link: a.link,
      })));
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { loadAlerts(); }, [loadAlerts]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel(`market-alerts-rt-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'market_alerts' }, (payload) => {
        const a = payload.new as any;
        setAlerts(prev => [{
          id: a.id, category: a.category, severity: a.severity, symbol: a.symbol,
          title: a.title, description: a.description, timestamp: new Date(a.created_at),
          read: a.read, bookmarked: a.bookmarked, source: a.source, actionable: a.actionable,
          metrics: a.metrics, link: a.link,
        }, ...prev]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadAlerts]);

  const toggleRead = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;
    await supabase.from("market_alerts").update({ read: !alert.read }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: !a.read } : a));
  };

  const toggleBookmark = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;
    await supabase.from("market_alerts").update({ bookmarked: !alert.bookmarked }).eq("id", id);
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a));
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter !== 'all' && a.category !== filter) return false;
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.read).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card><CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 text-center">
          <BellRing className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-primary" />
          <p className="text-lg sm:text-2xl font-bold">{alerts.length}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 text-center">
          <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-red-400" />
          <p className="text-lg sm:text-2xl font-bold text-red-400">{criticalCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Critical</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 text-center">
          <Eye className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-yellow-400" />
          <p className="text-lg sm:text-2xl font-bold">{unreadCount}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Unread</p>
        </CardContent></Card>
        <Card><CardContent className="pt-3 sm:pt-6 px-3 sm:px-6 text-center">
          <Activity className="h-4 w-4 sm:h-6 sm:w-6 mx-auto mb-1 sm:mb-2 text-green-400" />
          <p className="text-lg sm:text-2xl font-bold">{alerts.filter(a => a.actionable).length}</p>
          <p className="text-[10px] sm:text-xs text-muted-foreground">Action</p>
        </CardContent></Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {(['all', 'pattern', 'technical', 'whale', 'news', 'economic', 'sentiment'] as const).map(cat => (
            <Button key={cat} variant={filter === cat ? "default" : "outline"} size="sm" onClick={() => setFilter(cat)} className="text-[10px] sm:text-xs capitalize h-6 sm:h-8 px-2 sm:px-3">
              {cat === 'technical' ? 'Tech' : cat === 'economic' ? 'Econ' : cat === 'sentiment' ? 'Sent' : cat}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 sm:gap-2">
            <span className="text-[10px] sm:text-xs text-muted-foreground">Auto</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>
          <Button variant="outline" size="sm" onClick={loadAlerts} disabled={isLoading} className="h-6 sm:h-8 text-[10px] sm:text-xs">
            <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-3">
          {filteredAlerts.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No alerts yet</p>
              <p className="text-sm">Market alerts will appear here as they are generated by AI agents and signal monitors.</p>
            </CardContent></Card>
          ) : filteredAlerts.map(alert => {
            const Icon = CATEGORY_ICONS[alert.category] || Bell;
            return (
              <Card key={alert.id} className={`transition-colors ${!alert.read ? 'border-l-2 border-l-primary' : 'opacity-75'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${SEVERITY_STYLES[alert.severity]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm text-foreground">{alert.title}</h4>
                        {alert.symbol && <Badge variant="secondary" className="text-xs">{alert.symbol}</Badge>}
                        <Badge variant="outline" className={`text-[10px] ${SEVERITY_STYLES[alert.severity]}`}>{alert.severity}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{alert.description}</p>
                      {alert.metrics && (
                        <div className="flex gap-3 text-xs">
                          {Object.entries(alert.metrics).map(([k, v]) => (
                            <span key={k} className="text-muted-foreground"><span className="font-medium text-foreground">{v}</span> {k}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground">{alert.timestamp.toLocaleTimeString()}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleRead(alert.id)}>
                          {alert.read ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleBookmark(alert.id)}>
                          <BookmarkPlus className={`h-3 w-3 ${alert.bookmarked ? 'text-yellow-400' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MarketAlertsFeed;
