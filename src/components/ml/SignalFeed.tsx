import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Bell,
  Filter,
  Clock,
  Target
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

const generateSignals = (): Signal[] => {
  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'AAPL', 'TSLA', 'NVDA'];
  const sources = ['LSTM Model', 'XGBoost', 'Sentiment AI', 'Pattern Recognition', 'Ensemble'];
  const reasons = [
    'RSI oversold + bullish divergence detected',
    'MACD bullish crossover confirmed',
    'Breaking key resistance level',
    'Volume surge with price momentum',
    'Sentiment shift to positive',
    'Mean reversion opportunity',
    'Trend reversal pattern detected',
    'Support level bounce',
  ];

  return Array.from({ length: 12 }, (_, i) => {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    const type: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
    const strength: 'strong' | 'moderate' | 'weak' = Math.random() > 0.7 ? 'strong' : Math.random() > 0.4 ? 'moderate' : 'weak';
    const basePrice = symbol === 'BTC' ? 67500 : symbol === 'ETH' ? 3400 : symbol === 'SOL' ? 145 : 100;
    const price = basePrice * (1 + (Math.random() - 0.5) * 0.02);
    
    return {
      id: `sig-${i}`,
      symbol,
      type,
      strength,
      price,
      targetPrice: price * (type === 'buy' ? 1 + Math.random() * 0.1 : 1 - Math.random() * 0.1),
      stopLoss: price * (type === 'buy' ? 1 - Math.random() * 0.05 : 1 + Math.random() * 0.05),
      confidence: 50 + Math.random() * 45,
      source: sources[Math.floor(Math.random() * sources.length)],
      timestamp: new Date(Date.now() - Math.random() * 3600000),
      reason: reasons[Math.floor(Math.random() * reasons.length)],
    };
  }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};

const SignalFeed = () => {
  const [signals, setSignals] = useState<Signal[]>(() => generateSignals());
  const [showBuy, setShowBuy] = useState(true);
  const [showSell, setShowSell] = useState(true);
  const [strongOnly, setStrongOnly] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const newSignal = generateSignals()[0];
      newSignal.id = `sig-${Date.now()}`;
      newSignal.timestamp = new Date();
      setSignals(prev => [newSignal, ...prev.slice(0, 19)]);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

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
                <p className="text-2xl font-bold text-green-500">
                  {signals.filter(s => s.type === 'buy').length}
                </p>
                <p className="text-xs text-muted-foreground">Buy Signals</p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 text-center">
                <p className="text-2xl font-bold text-red-500">
                  {signals.filter(s => s.type === 'sell').length}
                </p>
                <p className="text-xs text-muted-foreground">Sell Signals</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold">
                {signals.filter(s => s.strength === 'strong').length}
              </p>
              <p className="text-xs text-muted-foreground">Strong Signals</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SignalFeed;
