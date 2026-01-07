import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  Newspaper,
  Users,
  AlertTriangle,
  Volume2,
  Gauge,
  Building2,
  Landmark,
  Target,
  Zap,
  Eye,
  EyeOff,
  Filter,
  RefreshCw,
  ChevronRight,
  ExternalLink,
  BookmarkPlus,
  Share2,
  CheckCircle,
  Clock,
  DollarSign,
  PieChart,
  Flame
} from "lucide-react";

// Alert Types
type AlertCategory = 
  | 'pattern'      // Head & Shoulders, Double Top, etc.
  | 'technical'    // RSI, MACD, Bollinger
  | 'volume'       // Volume anomalies
  | 'news'         // Breaking news
  | 'politician'   // Politician/insider trades
  | 'economic'     // CPI, GDP, Fed decisions
  | 'whale'        // Large wallet movements
  | 'sentiment'    // Social sentiment shifts
  | 'price'        // Price alerts
  | 'anomaly';     // General anomalies

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

// Mock data generators
const SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'MATIC', 'LINK', 'DOT'];
const POLITICIANS = ['Nancy Pelosi', 'Dan Crenshaw', 'Marjorie Taylor Greene', 'Josh Gottheimer', 'Michael McCaul'];
const PATTERN_TYPES = ['Head & Shoulders', 'Double Top', 'Double Bottom', 'Bull Flag', 'Bear Flag', 'Cup & Handle', 'Ascending Triangle', 'Descending Triangle', 'Rising Wedge', 'Falling Wedge'];

const generateMockAlerts = (): MarketAlert[] => {
  const alerts: MarketAlert[] = [];
  const now = Date.now();

  // Pattern Recognition Alerts
  PATTERN_TYPES.slice(0, 3).forEach((pattern, i) => {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const isBullish = pattern.includes('Bull') || pattern.includes('Bottom') || pattern.includes('Handle') || pattern.includes('Ascending');
    alerts.push({
      id: `pattern-${i}`,
      category: 'pattern',
      severity: Math.random() > 0.7 ? 'critical' : 'high',
      symbol,
      title: `${pattern} Pattern Detected`,
      description: `${symbol} forming ${pattern.toLowerCase()} on 4H timeframe. ${isBullish ? 'Bullish' : 'Bearish'} breakout potential ${(70 + Math.random() * 25).toFixed(0)}%.`,
      timestamp: new Date(now - Math.random() * 3600000),
      read: false,
      bookmarked: false,
      source: 'Pattern AI',
      actionable: true,
      metrics: { confidence: `${(75 + Math.random() * 20).toFixed(0)}%`, timeframe: '4H', target: `${isBullish ? '+' : '-'}${(5 + Math.random() * 10).toFixed(1)}%` }
    });
  });

  // RSI Alerts
  ['oversold', 'overbought'].forEach((condition, i) => {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const rsiValue = condition === 'oversold' ? 20 + Math.random() * 10 : 70 + Math.random() * 15;
    alerts.push({
      id: `rsi-${i}`,
      category: 'technical',
      severity: rsiValue < 25 || rsiValue > 80 ? 'high' : 'medium',
      symbol,
      title: `RSI ${condition.toUpperCase()} Alert`,
      description: `${symbol} RSI at ${rsiValue.toFixed(1)} - ${condition === 'oversold' ? 'potential bounce incoming' : 'potential pullback expected'}.`,
      timestamp: new Date(now - Math.random() * 7200000),
      read: false,
      bookmarked: false,
      source: 'Technical Scanner',
      actionable: true,
      metrics: { RSI: rsiValue.toFixed(1), signal: condition === 'oversold' ? 'BUY' : 'SELL' }
    });
  });

  // Volume Anomaly Alerts
  [1, 2].forEach((_, i) => {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const volumeMultiple = 2 + Math.random() * 8;
    const isHigh = volumeMultiple > 5;
    alerts.push({
      id: `volume-${i}`,
      category: 'volume',
      severity: isHigh ? 'critical' : 'medium',
      symbol,
      title: `${isHigh ? 'Extreme' : 'Unusual'} Volume Spike`,
      description: `${symbol} trading at ${volumeMultiple.toFixed(1)}x average daily volume. ${isHigh ? 'Major institutional activity suspected.' : 'Watch for breakout.'}`,
      timestamp: new Date(now - Math.random() * 1800000),
      read: false,
      bookmarked: false,
      source: 'Volume Monitor',
      actionable: true,
      metrics: { volume: `${volumeMultiple.toFixed(1)}x`, avgVolume: '$1.2B', currentVolume: `$${(volumeMultiple * 1.2).toFixed(1)}B` }
    });
  });

  // Politician/Insider Trading Alerts
  POLITICIANS.slice(0, 2).forEach((politician, i) => {
    const isBuy = Math.random() > 0.5;
    const stock = ['NVDA', 'AAPL', 'MSFT', 'GOOGL', 'META'][Math.floor(Math.random() * 5)];
    const amount = (100000 + Math.random() * 900000).toFixed(0);
    alerts.push({
      id: `politician-${i}`,
      category: 'politician',
      severity: 'high',
      symbol: stock,
      title: `Congressional Trade: ${politician}`,
      description: `${politician} ${isBuy ? 'purchased' : 'sold'} $${Number(amount).toLocaleString()} of ${stock}. Filed ${Math.floor(Math.random() * 30) + 1} days after transaction.`,
      timestamp: new Date(now - Math.random() * 86400000),
      read: false,
      bookmarked: false,
      source: 'Capitol Trades',
      actionable: true,
      metrics: { action: isBuy ? 'BUY' : 'SELL', amount: `$${Number(amount).toLocaleString()}`, disclosure: `${Math.floor(Math.random() * 30) + 1} days` },
      link: 'https://capitoltrades.com'
    });
  });

  // Economic Data Alerts
  const economicEvents = [
    { name: 'CPI Data', value: '3.4%', expected: '3.2%', impact: 'Higher than expected - hawkish signal' },
    { name: 'Fed Rate Decision', value: '5.50%', expected: '5.50%', impact: 'Held steady as expected' },
    { name: 'Jobs Report', value: '272K', expected: '180K', impact: 'Much stronger than expected' },
    { name: 'GDP Growth', value: '2.8%', expected: '2.4%', impact: 'Economy showing resilience' }
  ];
  economicEvents.slice(0, 2).forEach((event, i) => {
    const isAbove = parseFloat(event.value) > parseFloat(event.expected);
    alerts.push({
      id: `economic-${i}`,
      category: 'economic',
      severity: isAbove ? 'critical' : 'medium',
      title: `${event.name} Released`,
      description: `${event.name}: ${event.value} (Expected: ${event.expected}). ${event.impact}`,
      timestamp: new Date(now - Math.random() * 14400000),
      read: false,
      bookmarked: false,
      source: 'Economic Calendar',
      actionable: true,
      metrics: { actual: event.value, expected: event.expected, deviation: isAbove ? 'Above' : 'Below' }
    });
  });

  // Whale Movement Alerts
  [1, 2].forEach((_, i) => {
    const symbol = SYMBOLS[Math.floor(Math.random() * 4)];
    const amount = (1000 + Math.random() * 50000).toFixed(0);
    const destination = Math.random() > 0.5 ? 'Exchange' : 'Cold Wallet';
    alerts.push({
      id: `whale-${i}`,
      category: 'whale',
      severity: parseFloat(amount) > 10000 ? 'critical' : 'high',
      symbol,
      title: `Whale Movement Detected`,
      description: `${Number(amount).toLocaleString()} ${symbol} ($${(parseFloat(amount) * (symbol === 'BTC' ? 67000 : symbol === 'ETH' ? 3400 : 100) / 1000000).toFixed(1)}M) moved to ${destination}.`,
      timestamp: new Date(now - Math.random() * 900000),
      read: false,
      bookmarked: false,
      source: 'Whale Alert',
      actionable: destination === 'Exchange',
      metrics: { amount: `${Number(amount).toLocaleString()} ${symbol}`, destination, implication: destination === 'Exchange' ? 'Potential Sell' : 'Holding' }
    });
  });

  // Sentiment Alerts
  [1].forEach((_, i) => {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const sentiment = Math.random() > 0.5 ? 'bullish' : 'bearish';
    const change = (20 + Math.random() * 60).toFixed(0);
    alerts.push({
      id: `sentiment-${i}`,
      category: 'sentiment',
      severity: 'medium',
      symbol,
      title: `Sentiment Shift: ${symbol}`,
      description: `Social sentiment for ${symbol} turned ${sentiment}. ${change}% increase in ${sentiment} mentions in last 4 hours.`,
      timestamp: new Date(now - Math.random() * 7200000),
      read: false,
      bookmarked: false,
      source: 'Sentiment AI',
      actionable: false,
      metrics: { sentiment: sentiment.toUpperCase(), change: `+${change}%`, sources: 'Twitter, Reddit, Discord' }
    });
  });

  // News Alerts
  const newsItems = [
    { title: 'SEC Approves New Bitcoin ETF', symbol: 'BTC', impact: 'Major institutional inflows expected' },
    { title: 'Ethereum Foundation Announces Major Upgrade', symbol: 'ETH', impact: 'Network efficiency improvements' },
    { title: 'Major Exchange Lists New Token', symbol: 'SOL', impact: 'Increased liquidity expected' },
    { title: 'Regulatory Clarity in Major Market', symbol: undefined, impact: 'Positive for overall crypto adoption' }
  ];
  newsItems.slice(0, 2).forEach((news, i) => {
    alerts.push({
      id: `news-${i}`,
      category: 'news',
      severity: i === 0 ? 'critical' : 'high',
      symbol: news.symbol,
      title: news.title,
      description: news.impact,
      timestamp: new Date(now - Math.random() * 3600000),
      read: false,
      bookmarked: false,
      source: 'News AI',
      actionable: true
    });
  });

  // Price Alerts
  [1, 2].forEach((_, i) => {
    const symbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    const change = (3 + Math.random() * 12).toFixed(1);
    const isUp = Math.random() > 0.5;
    alerts.push({
      id: `price-${i}`,
      category: 'price',
      severity: parseFloat(change) > 8 ? 'critical' : 'high',
      symbol,
      title: `${symbol} ${isUp ? '🚀' : '📉'} ${change}% in 1H`,
      description: `${symbol} moved ${isUp ? 'up' : 'down'} ${change}% in the last hour. ${parseFloat(change) > 8 ? 'Major volatility event!' : 'Significant movement detected.'}`,
      timestamp: new Date(now - Math.random() * 1800000),
      read: false,
      bookmarked: false,
      source: 'Price Monitor',
      actionable: true,
      metrics: { change: `${isUp ? '+' : '-'}${change}%`, timeframe: '1H', volume: 'Above average' }
    });
  });

  return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const CATEGORY_CONFIG: Record<AlertCategory, { icon: typeof Bell; label: string; color: string }> = {
  pattern: { icon: Target, label: 'Pattern', color: 'text-purple-500' },
  technical: { icon: Activity, label: 'Technical', color: 'text-blue-500' },
  volume: { icon: BarChart3, label: 'Volume', color: 'text-amber-500' },
  news: { icon: Newspaper, label: 'News', color: 'text-cyan-500' },
  politician: { icon: Landmark, label: 'Congress', color: 'text-red-500' },
  economic: { icon: Building2, label: 'Economic', color: 'text-green-500' },
  whale: { icon: Flame, label: 'Whale', color: 'text-orange-500' },
  sentiment: { icon: Users, label: 'Sentiment', color: 'text-pink-500' },
  price: { icon: DollarSign, label: 'Price', color: 'text-emerald-500' },
  anomaly: { icon: AlertTriangle, label: 'Anomaly', color: 'text-yellow-500' }
};

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: 'bg-red-500/20 text-red-500 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-500 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30',
  low: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
  info: 'bg-gray-500/20 text-gray-500 border-gray-500/30'
};

const MarketAlertsFeed = () => {
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [activeFilters, setActiveFilters] = useState<AlertCategory[]>([]);
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showRead, setShowRead] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize alerts
  useEffect(() => {
    setAlerts(generateMockAlerts());
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      const newAlert = generateMockAlerts()[0];
      newAlert.id = `new-${Date.now()}`;
      newAlert.timestamp = new Date();
      setAlerts(prev => [newAlert, ...prev.slice(0, 49)]);
      
      if (soundEnabled && newAlert.severity === 'critical') {
        toast.info(`🔔 ${newAlert.title}`, { description: newAlert.symbol || newAlert.source });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, soundEnabled]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setTimeout(() => {
      setAlerts(generateMockAlerts());
      setIsLoading(false);
      toast.success('Alerts refreshed');
    }, 500);
  }, []);

  const toggleBookmark = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !a.bookmarked } : a));
  };

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    toast.success('All alerts marked as read');
  };

  const toggleCategoryFilter = (category: AlertCategory) => {
    setActiveFilters(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category) 
        : [...prev, category]
    );
  };

  const filteredAlerts = alerts.filter(alert => {
    if (activeFilters.length > 0 && !activeFilters.includes(alert.category)) return false;
    if (severityFilter !== 'all' && alert.severity !== severityFilter) return false;
    if (!showRead && alert.read) return false;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.read).length;
  const criticalCount = alerts.filter(a => a.severity === 'critical' && !a.read).length;

  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <BellRing className="h-6 w-6 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold">{criticalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Eye className="h-6 w-6 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Target className="h-6 w-6 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Actionable</p>
                <p className="text-2xl font-bold">{alerts.filter(a => a.actionable).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = activeFilters.includes(key as AlertCategory);
                return (
                  <Button
                    key={key}
                    variant={isActive ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => toggleCategoryFilter(key as AlertCategory)}
                    className="gap-1"
                  >
                    <Icon className={`h-3 w-3 ${isActive ? '' : config.color}`} />
                    {config.label}
                  </Button>
                );
              })}
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} id="sound" />
                <label htmlFor="sound" className="text-sm flex items-center gap-1">
                  <Volume2 className="h-4 w-4" /> Sound
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} id="auto" />
                <label htmlFor="auto" className="text-sm flex items-center gap-1">
                  <RefreshCw className="h-4 w-4" /> Auto
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={showRead} onCheckedChange={setShowRead} id="read" />
                <label htmlFor="read" className="text-sm flex items-center gap-1">
                  {showRead ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />} Read
                </label>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts Feed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Live Market Alerts
          </CardTitle>
          <CardDescription>
            Pattern recognition • Technical signals • News • Politician trades • Economic data • Whale movements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <TabsList className="mb-4">
              <TabsTrigger value="all">All ({filteredAlerts.length})</TabsTrigger>
              <TabsTrigger value="critical">Critical ({filteredAlerts.filter(a => a.severity === 'critical').length})</TabsTrigger>
              <TabsTrigger value="actionable">Actionable ({filteredAlerts.filter(a => a.actionable).length})</TabsTrigger>
              <TabsTrigger value="bookmarked">Bookmarked ({filteredAlerts.filter(a => a.bookmarked).length})</TabsTrigger>
            </TabsList>

            {['all', 'critical', 'actionable', 'bookmarked'].map(tab => (
              <TabsContent key={tab} value={tab}>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {filteredAlerts
                      .filter(a => {
                        if (tab === 'critical') return a.severity === 'critical';
                        if (tab === 'actionable') return a.actionable;
                        if (tab === 'bookmarked') return a.bookmarked;
                        return true;
                      })
                      .map(alert => {
                        const CategoryIcon = CATEGORY_CONFIG[alert.category].icon;
                        return (
                          <div
                            key={alert.id}
                            onClick={() => markAsRead(alert.id)}
                            className={`p-4 rounded-lg border cursor-pointer transition-all hover:bg-secondary/30 ${!alert.read ? 'bg-secondary/10 border-primary/30' : ''}`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1">
                                <div className={`p-2 rounded-lg bg-secondary/50 ${CATEGORY_CONFIG[alert.category].color}`}>
                                  <CategoryIcon className="h-4 w-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <Badge className={SEVERITY_STYLES[alert.severity]} variant="outline">
                                      {alert.severity}
                                    </Badge>
                                    {alert.symbol && (
                                      <Badge variant="secondary" className="font-mono font-bold">
                                        {alert.symbol}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">{alert.source}</span>
                                  </div>
                                  <h4 className={`font-medium ${!alert.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {alert.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">{alert.description}</p>
                                  
                                  {alert.metrics && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {Object.entries(alert.metrics).map(([key, value]) => (
                                        <Badge key={key} variant="outline" className="text-xs">
                                          {key}: <span className="font-mono ml-1">{value}</span>
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end gap-2">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {formatTime(alert.timestamp)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); toggleBookmark(alert.id); }}
                                  >
                                    <BookmarkPlus className={`h-4 w-4 ${alert.bookmarked ? 'fill-primary text-primary' : ''}`} />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7">
                                    <Share2 className="h-4 w-4" />
                                  </Button>
                                  {alert.link && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={(e) => { e.stopPropagation(); window.open(alert.link, '_blank'); }}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                                {alert.actionable && (
                                  <Button size="sm" className="gap-1">
                                    Trade <ChevronRight className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    
                    {filteredAlerts.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p>No alerts match your filters</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketAlertsFeed;
