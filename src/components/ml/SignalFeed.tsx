import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Bell,
  Filter,
  Clock,
  Target,
  AlertCircle
} from "lucide-react";

interface Signal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  strength: 'strong' | 'moderate' | 'weak';
  price: number;
  targetPrice: number;
  stopLoss: number;
  confidence: number;
  source: string;
  timestamp: Date;
  reason: string;
}

const SignalFeed = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBuy, setShowBuy] = useState(true);
  const [showSell, setShowSell] = useState(true);
  const [strongOnly, setStrongOnly] = useState(false);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('ai_signals')
        .select('*')
        .eq('is_active', true)
        .in('signal_type', ['buy', 'sell'])
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      const mapped: Signal[] = (data || []).map(s => ({
        id: s.id,
        symbol: s.symbol,
        type: s.signal_type as 'buy' | 'sell',
        strength: s.strength as 'strong' | 'moderate' | 'weak',
        price: Number(s.price_at_signal) || 0,
        targetPrice: Number(s.target_price) || 0,
        stopLoss: Number(s.stop_loss) || 0,
        confidence: s.confidence,
        source: s.source,
        timestamp: new Date(s.triggered_at),
        reason: s.reason
      }));

      setSignals(mapped);
    } catch (err: any) {
      console.error('Error fetching signals:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredSignals = signals.filter(s => {
    if (!showBuy && s.type === 'buy') return false;
    if (!showSell && s.type === 'sell') return false;
    if (strongOnly && s.strength !== 'strong') return false;
    return true;
  });

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'bg-green-500';
      case 'moderate': return 'bg-amber-500';
      case 'weak': return 'bg-gray-500';
      default: return '';
    }
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const buySignals = signals.filter(s => s.type === 'buy').length;
  const sellSignals = signals.filter(s => s.type === 'sell').length;
  const strongSignals = signals.filter(s => s.strength === 'strong').length;

  return (
    <div className="grid grid-cols-3 gap-6">
      <Card className="col-span-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Live Signal Feed
              <Badge variant="outline" className="animate-pulse">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-1" />
                Live
              </Badge>
            </CardTitle>
            <Button variant="outline" size="sm">
              <Bell className="h-4 w-4 mr-1" />
              Alerts
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-destructive py-8 justify-center">
              <AlertCircle className="h-5 w-5" />
              <span>Error loading signals</span>
            </div>
          ) : filteredSignals.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No Signals Available</p>
              <p className="text-sm">AI trading signals will appear here when generated.</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              {filteredSignals.map((signal) => (
                <div key={signal.id} className="p-4 border-b hover:bg-muted/50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${signal.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {signal.type === 'buy' ? (
                          <TrendingUp className="h-5 w-5 text-green-500" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{signal.symbol}</span>
                          <Badge variant={signal.type === 'buy' ? 'default' : 'destructive'} className="uppercase">
                            {signal.type}
                          </Badge>
                          <span className={`h-2 w-2 rounded-full ${getStrengthColor(signal.strength)}`} />
                          <span className="text-xs text-muted-foreground capitalize">{signal.strength}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{signal.reason}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{formatTime(signal.timestamp)}</span>
                      </div>
                      <Badge variant="outline" className="mt-1">{signal.source}</Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 mt-3 p-3 rounded-lg bg-muted/30">
                    <div>
                      <p className="text-xs text-muted-foreground">Entry Price</p>
                      <p className="font-mono font-medium">${signal.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Target</p>
                      <p className="font-mono font-medium text-green-500">
                        ${signal.targetPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Stop Loss</p>
                      <p className="font-mono font-medium text-red-500">
                        ${signal.stopLoss.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Confidence</p>
                      <p className={`font-bold ${signal.confidence >= 70 ? 'text-green-500' : signal.confidence >= 50 ? 'text-amber-500' : 'text-red-500'}`}>
                        {signal.confidence.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                Buy Signals
              </Label>
              <Switch checked={showBuy} onCheckedChange={setShowBuy} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Sell Signals
              </Label>
              <Switch checked={showSell} onCheckedChange={setShowSell} />
            </div>
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Strong Only
              </Label>
              <Switch checked={strongOnly} onCheckedChange={setStrongOnly} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signal Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-500/10 text-center">
                <p className="text-2xl font-bold text-green-500">{buySignals}</p>
                <p className="text-xs text-muted-foreground">Buy Signals</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <p className="text-2xl font-bold text-red-500">{sellSignals}</p>
                <p className="text-xs text-muted-foreground">Sell Signals</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">{strongSignals}</p>
              <p className="text-xs text-muted-foreground">Strong Signals</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignalFeed;