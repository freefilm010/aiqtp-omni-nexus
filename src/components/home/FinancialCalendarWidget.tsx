import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { 
  Calendar,
  Clock,
  Bell,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Star,
  Megaphone,
  DollarSign,
  BarChart2,
  AlertCircle
} from "lucide-react";

interface CalendarEvent {
  id: string;
  type: 'earnings' | 'economic' | 'fed' | 'crypto';
  title: string;
  asset?: string;
  time: string;
  date: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string;
  isLive?: boolean;
}

const FinancialCalendarWidget = () => {
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filters = [
    { id: 'all', label: 'All Events' },
    { id: 'fed', label: 'Fed/Central Banks' },
    { id: 'earnings', label: 'Earnings' },
    { id: 'economic', label: 'Economic' },
    { id: 'crypto', label: 'Crypto' },
  ];

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('economic_calendar_events')
        .select('*')
        .eq('is_active', true)
        .gte('event_time', new Date().toISOString())
        .order('event_time', { ascending: true })
        .limit(20);

      if (fetchError) throw fetchError;

      const mapped: CalendarEvent[] = (data || []).map(e => {
        const eventDate = new Date(e.event_time);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let dateStr: string;
        if (eventDate.toDateString() === today.toDateString()) {
          dateStr = 'Today';
        } else if (eventDate.toDateString() === tomorrow.toDateString()) {
          dateStr = 'Tomorrow';
        } else {
          dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        return {
          id: e.id,
          type: e.event_type as CalendarEvent['type'],
          title: e.title,
          asset: e.asset || undefined,
          time: eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }),
          date: dateStr,
          impact: e.impact as 'high' | 'medium' | 'low',
          forecast: e.forecast || undefined,
          previous: e.previous || undefined,
          actual: e.actual || undefined,
          isLive: e.is_live
        };
      });

      setEvents(mapped);
    } catch (err: any) {
      console.error('Error fetching calendar events:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = activeFilter === 'all' 
    ? events 
    : events.filter(e => e.type === activeFilter);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'fed': return <DollarSign className="w-3.5 h-3.5" />;
      case 'earnings': return <BarChart2 className="w-3.5 h-3.5" />;
      case 'economic': return <TrendingUp className="w-3.5 h-3.5" />;
      case 'crypto': return <Star className="w-3.5 h-3.5" />;
      default: return <Calendar className="w-3.5 h-3.5" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'fed': return 'hsl(224,100%,58%)';
      case 'earnings': return 'hsl(270,91%,65%)';
      case 'economic': return 'hsl(43,96%,56%)';
      case 'crypto': return 'hsl(162,91%,32%)';
      default: return 'hsl(222,14%,50%)';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-[hsl(355,88%,58%)]';
      case 'medium': return 'text-[hsl(43,96%,56%)]';
      case 'low': return 'text-muted-foreground';
      default: return 'text-muted-foreground';
    }
  };

  const liveCount = events.filter(e => e.isLive).length;
  const highImpactToday = events.filter(e => e.date === 'Today' && e.impact === 'high').length;
  const earningsThisWeek = events.filter(e => e.type === 'earnings').length;
  const fedEvents = events.filter(e => e.type === 'fed').length;

  return (
    <Card className="p-5 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[hsl(224,100%,58%,0.15)]">
            <Calendar className="w-4 h-4 text-[hsl(224,100%,58%)]" />
          </div>
          <h3 className="font-bold text-foreground">Financial Calendar</h3>
          {liveCount > 0 && (
            <Badge className="bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)] text-[9px] animate-pulse">
              {liveCount} LIVE
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
          Full Calendar <ChevronRight className="w-3 h-3 ml-1" />
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
              activeFilter === filter.id
                ? 'bg-[hsl(224,100%,58%,0.15)] text-[hsl(224,100%,58%)] border border-[hsl(224,100%,58%,0.3)]'
                : 'bg-[hsl(223,18%,12%)] text-muted-foreground hover:text-foreground border border-transparent'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {error ? (
        <div className="flex items-center gap-2 text-destructive py-8 justify-center">
          <AlertCircle className="h-5 w-5" />
          <span>Error loading events</span>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">No Upcoming Events</p>
          <p className="text-sm">Calendar events will appear here when scheduled.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredEvents.map((event) => (
            <div 
              key={event.id}
              className={`p-3 rounded-lg bg-[hsl(223,18%,7%)] border transition-all hover:border-[hsl(222,14%,25%)] ${
                event.isLive 
                  ? 'border-[hsl(355,88%,58%,0.3)] ring-1 ring-[hsl(355,88%,58%,0.1)]' 
                  : 'border-[hsl(222,14%,12%)]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg"
                    style={{ backgroundColor: `${getEventColor(event.type)}15` }}
                  >
                    <div style={{ color: getEventColor(event.type) }}>
                      {getEventIcon(event.type)}
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-foreground">{event.title}</span>
                      {event.isLive && (
                        <Badge className="bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)] text-[8px] animate-pulse">
                          LIVE
                        </Badge>
                      )}
                      {event.asset && (
                        <Badge className="bg-[hsl(222,14%,20%)] text-foreground text-[8px]">
                          {event.asset}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[10px]">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{event.time}</span>
                      </div>
                      <span className="text-muted-foreground">•</span>
                      <span className={event.date === 'Today' ? 'text-[hsl(43,96%,56%)]' : 'text-muted-foreground'}>
                        {event.date}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className={getImpactColor(event.impact)}>
                        {event.impact.toUpperCase()} IMPACT
                      </span>
                    </div>

                    {(event.forecast || event.previous) && (
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
                        {event.forecast && (
                          <div>
                            <span className="text-muted-foreground">Forecast: </span>
                            <span className="text-[hsl(224,100%,58%)] font-medium">{event.forecast}</span>
                          </div>
                        )}
                        {event.previous && (
                          <div>
                            <span className="text-muted-foreground">Previous: </span>
                            <span className="text-foreground/70">{event.previous}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-[hsl(43,96%,56%)] hover:bg-[hsl(43,96%,56%,0.1)]"
                >
                  <Bell className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[hsl(222,14%,15%)]">
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-[hsl(355,88%,58%)]">{highImpactToday}</div>
          <div className="text-[9px] text-muted-foreground uppercase">High Impact Today</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-[hsl(270,91%,65%)]">{earningsThisWeek}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Earnings This Week</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-[hsl(224,100%,58%)]">{fedEvents}</div>
          <div className="text-[9px] text-muted-foreground uppercase">Fed Events</div>
        </div>
      </div>
    </Card>
  );
};

export default FinancialCalendarWidget;