import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Star,
  Bell,
  Globe,
  Filter
} from "lucide-react";

interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  countryCode: string;
  date: Date;
  time: string;
  impact: 'high' | 'medium' | 'low';
  forecast?: string;
  previous?: string;
  actual?: string;
  currency: string;
  category: string;
}

const mockEvents: EconomicEvent[] = [
  { id: '1', title: 'Federal Reserve Interest Rate Decision', country: 'United States', countryCode: 'US', date: new Date(), time: '14:00', impact: 'high', forecast: '5.50%', previous: '5.50%', currency: 'USD', category: 'Interest Rates' },
  { id: '2', title: 'Non-Farm Payrolls', country: 'United States', countryCode: 'US', date: new Date(), time: '08:30', impact: 'high', forecast: '180K', previous: '216K', actual: '195K', currency: 'USD', category: 'Employment' },
  { id: '3', title: 'ECB Monetary Policy Statement', country: 'European Union', countryCode: 'EU', date: new Date(Date.now() + 86400000), time: '13:45', impact: 'high', forecast: '4.50%', previous: '4.50%', currency: 'EUR', category: 'Interest Rates' },
  { id: '4', title: 'UK GDP (QoQ)', country: 'United Kingdom', countryCode: 'GB', date: new Date(Date.now() + 86400000), time: '07:00', impact: 'high', forecast: '0.2%', previous: '-0.1%', currency: 'GBP', category: 'GDP' },
  { id: '5', title: 'China Manufacturing PMI', country: 'China', countryCode: 'CN', date: new Date(Date.now() + 172800000), time: '01:00', impact: 'medium', forecast: '50.2', previous: '49.8', currency: 'CNY', category: 'Manufacturing' },
  { id: '6', title: 'Japan Core CPI (YoY)', country: 'Japan', countryCode: 'JP', date: new Date(Date.now() + 172800000), time: '23:30', impact: 'medium', forecast: '2.8%', previous: '2.7%', currency: 'JPY', category: 'Inflation' },
  { id: '7', title: 'Australian Employment Change', country: 'Australia', countryCode: 'AU', date: new Date(Date.now() + 259200000), time: '00:30', impact: 'medium', forecast: '25.0K', previous: '38.3K', currency: 'AUD', category: 'Employment' },
  { id: '8', title: 'German ZEW Economic Sentiment', country: 'Germany', countryCode: 'DE', date: new Date(Date.now() + 259200000), time: '10:00', impact: 'medium', forecast: '12.5', previous: '9.8', currency: 'EUR', category: 'Sentiment' },
  { id: '9', title: 'Canada Retail Sales (MoM)', country: 'Canada', countryCode: 'CA', date: new Date(Date.now() + 345600000), time: '13:30', impact: 'low', forecast: '0.5%', previous: '0.3%', currency: 'CAD', category: 'Retail' },
  { id: '10', title: 'US Initial Jobless Claims', country: 'United States', countryCode: 'US', date: new Date(Date.now() + 345600000), time: '13:30', impact: 'medium', forecast: '210K', previous: '203K', currency: 'USD', category: 'Employment' },
];

const countryFlags: Record<string, string> = {
  US: '🇺🇸', EU: '🇪🇺', GB: '🇬🇧', CN: '🇨🇳', JP: '🇯🇵', AU: '🇦🇺', DE: '🇩🇪', CA: '🇨🇦', CH: '🇨🇭', NZ: '🇳🇿'
};

const EconomicCalendar = () => {
  const [events, setEvents] = useState(mockEvents);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [countryFilter, setCountryFilter] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['1', '2']);
  const [notifications, setNotifications] = useState<string[]>(['1']);

  const filteredEvents = events.filter(e => {
    const matchesImpact = filter === 'all' || e.impact === filter;
    const matchesCountry = countryFilter.length === 0 || countryFilter.includes(e.countryCode);
    return matchesImpact && matchesCountry;
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const dateKey = event.date.toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, EconomicEvent[]>);

  const toggleFavorite = (id: string) => {
    setFavorites(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.includes(id) ? prev.filter(n => n !== id) : [...prev, id]);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-amber-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const isUpcoming = (event: EconomicEvent) => {
    const eventTime = new Date(event.date);
    const [hours, minutes] = event.time.split(':');
    eventTime.setHours(parseInt(hours), parseInt(minutes));
    return eventTime > new Date();
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Global Economic Calendar
          </CardTitle>
          <Badge variant="outline">
            <Globe className="h-3 w-3 mr-1" />
            {events.length} Events
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-2">
          <div className="flex gap-1">
            {(['all', 'high', 'medium', 'low'] as const).map((impact) => (
              <Button
                key={impact}
                variant={filter === impact ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(impact)}
              >
                {impact === 'all' ? 'All' : (
                  <div className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${getImpactColor(impact)}`} />
                    {impact.charAt(0).toUpperCase() + impact.slice(1)}
                  </div>
                )}
              </Button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {['US', 'EU', 'GB', 'JP', 'CN'].map((country) => (
              <Button
                key={country}
                variant={countryFilter.includes(country) ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setCountryFilter(prev =>
                  prev.includes(country) ? prev.filter(c => c !== country) : [...prev, country]
                )}
              >
                {countryFlags[country]}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          {Object.entries(groupedEvents).map(([date, dayEvents]) => (
            <div key={date}>
              <div className="sticky top-0 bg-muted/80 backdrop-blur px-4 py-2 border-b">
                <span className="font-medium text-sm">
                  {new Date(date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
              
              {dayEvents.sort((a, b) => a.time.localeCompare(b.time)).map((event) => (
                <div
                  key={event.id}
                  className={`px-4 py-3 border-b hover:bg-muted/50 transition-colors ${
                    !isUpcoming(event) ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Impact indicator */}
                    <div className="flex flex-col items-center gap-1">
                      <span className={`h-3 w-3 rounded-full ${getImpactColor(event.impact)}`} />
                      <span className="text-xs text-muted-foreground">{event.time}</span>
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{countryFlags[event.countryCode]}</span>
                        <span className="font-medium text-sm truncate">{event.title}</span>
                        <Badge variant="outline" className="text-xs ml-auto shrink-0">
                          {event.currency}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span>{event.country}</span>
                        <span>•</span>
                        <span>{event.category}</span>
                      </div>

                      {/* Forecast/Actual/Previous */}
                      <div className="flex items-center gap-4 mt-2">
                        {event.actual && (
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className={`font-bold ${
                              parseFloat(event.actual) > parseFloat(event.forecast || '0') 
                                ? 'text-green-500' 
                                : 'text-red-500'
                            }`}>
                              {event.actual}
                            </p>
                          </div>
                        )}
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Forecast</p>
                          <p className="font-medium">{event.forecast || '-'}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Previous</p>
                          <p className="text-muted-foreground">{event.previous || '-'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleFavorite(event.id)}
                      >
                        <Star className={`h-4 w-4 ${favorites.includes(event.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => toggleNotification(event.id)}
                      >
                        <Bell className={`h-4 w-4 ${notifications.includes(event.id) ? 'fill-primary text-primary' : ''}`} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EconomicCalendar;
