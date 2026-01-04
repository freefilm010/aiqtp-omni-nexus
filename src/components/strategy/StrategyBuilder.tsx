import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Play,
  Save,
  Code,
  Wand2,
  ArrowRight,
  ArrowDown,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Shield,
  Zap
} from "lucide-react";

interface Rule {
  id: string;
  type: 'entry' | 'exit';
  indicator: string;
  condition: string;
  value: string;
  timeframe: string;
  enabled: boolean;
}

interface StrategyConfig {
  name: string;
  description: string;
  pairs: string[];
  timeframe: string;
  entryRules: Rule[];
  exitRules: Rule[];
  riskParams: {
    positionSize: number;
    stopLoss: number;
    takeProfit: number;
    maxOpenTrades: number;
    trailingStop: boolean;
    trailingStopOffset: number;
  };
}

const indicators = [
  { id: 'rsi', name: 'RSI', category: 'Momentum' },
  { id: 'macd', name: 'MACD', category: 'Trend' },
  { id: 'ema', name: 'EMA', category: 'Trend' },
  { id: 'sma', name: 'SMA', category: 'Trend' },
  { id: 'bb', name: 'Bollinger Bands', category: 'Volatility' },
  { id: 'stoch', name: 'Stochastic', category: 'Momentum' },
  { id: 'atr', name: 'ATR', category: 'Volatility' },
  { id: 'volume', name: 'Volume', category: 'Volume' },
  { id: 'obv', name: 'OBV', category: 'Volume' },
  { id: 'adx', name: 'ADX', category: 'Trend' },
];

const conditions = [
  'crosses_above',
  'crosses_below',
  'greater_than',
  'less_than',
  'equals',
  'between'
];

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d'];

const StrategyBuilder = () => {
  const [strategy, setStrategy] = useState<StrategyConfig>({
    name: 'My RSI Strategy',
    description: 'A simple RSI-based mean reversion strategy',
    pairs: ['BTC/USDT', 'ETH/USDT'],
    timeframe: '1h',
    entryRules: [
      { id: '1', type: 'entry', indicator: 'rsi', condition: 'less_than', value: '30', timeframe: '1h', enabled: true },
      { id: '2', type: 'entry', indicator: 'volume', condition: 'greater_than', value: '1000000', timeframe: '1h', enabled: true },
    ],
    exitRules: [
      { id: '3', type: 'exit', indicator: 'rsi', condition: 'greater_than', value: '70', timeframe: '1h', enabled: true },
    ],
    riskParams: {
      positionSize: 10,
      stopLoss: 3,
      takeProfit: 9,
      maxOpenTrades: 3,
      trailingStop: false,
      trailingStopOffset: 1,
    },
  });

  const [showCode, setShowCode] = useState(false);

  const addRule = (type: 'entry' | 'exit') => {
    const newRule: Rule = {
      id: Date.now().toString(),
      type,
      indicator: 'rsi',
      condition: 'crosses_above',
      value: '50',
      timeframe: '1h',
      enabled: true,
    };
    
    if (type === 'entry') {
      setStrategy(s => ({ ...s, entryRules: [...s.entryRules, newRule] }));
    } else {
      setStrategy(s => ({ ...s, exitRules: [...s.exitRules, newRule] }));
    }
  };

  const removeRule = (id: string, type: 'entry' | 'exit') => {
    if (type === 'entry') {
      setStrategy(s => ({ ...s, entryRules: s.entryRules.filter(r => r.id !== id) }));
    } else {
      setStrategy(s => ({ ...s, exitRules: s.exitRules.filter(r => r.id !== id) }));
    }
  };

  const updateRule = (id: string, type: 'entry' | 'exit', field: keyof Rule, value: string | boolean) => {
    const updateFn = (rules: Rule[]) => 
      rules.map(r => r.id === id ? { ...r, [field]: value } : r);
    
    if (type === 'entry') {
      setStrategy(s => ({ ...s, entryRules: updateFn(s.entryRules) }));
    } else {
      setStrategy(s => ({ ...s, exitRules: updateFn(s.exitRules) }));
    }
  };

  const generateCode = () => {
    return `// ${strategy.name}
// ${strategy.description}

class ${strategy.name.replace(/\s+/g, '')}Strategy {
  // Pairs: ${strategy.pairs.join(', ')}
  // Timeframe: ${strategy.timeframe}
  
  populate_indicators(dataframe) {
${strategy.entryRules.map(r => `    dataframe['${r.indicator}'] = ta.${r.indicator.toUpperCase()}(dataframe);`).join('\n')}
    return dataframe;
  }
  
  populate_entry_trend(dataframe) {
    dataframe.loc[
${strategy.entryRules.map(r => `      (dataframe['${r.indicator}'] ${r.condition === 'less_than' ? '<' : r.condition === 'greater_than' ? '>' : '=='} ${r.value})`).join(' &\n')}
    , 'enter_long'] = 1;
    return dataframe;
  }
  
  populate_exit_trend(dataframe) {
    dataframe.loc[
${strategy.exitRules.map(r => `      (dataframe['${r.indicator}'] ${r.condition === 'less_than' ? '<' : r.condition === 'greater_than' ? '>' : '=='} ${r.value})`).join(' &\n')}
    , 'exit_long'] = 1;
    return dataframe;
  }
  
  // Risk Management
  stoploss = -${strategy.riskParams.stopLoss / 100};
  minimal_roi = { "0": ${strategy.riskParams.takeProfit / 100} };
  max_open_trades = ${strategy.riskParams.maxOpenTrades};
  trailing_stop = ${strategy.riskParams.trailingStop};
  trailing_stop_positive = ${strategy.riskParams.trailingStopOffset / 100};
}`;
  };

  const RuleBuilder = ({ rule, type }: { rule: Rule; type: 'entry' | 'exit' }) => (
    <div className={`p-4 rounded-lg border ${rule.enabled ? '' : 'opacity-50'} bg-card`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {type === 'entry' ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className="font-medium">Rule #{rule.id.slice(-4)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Switch 
            checked={rule.enabled} 
            onCheckedChange={(v) => updateRule(rule.id, type, 'enabled', v)}
          />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => removeRule(rule.id, type)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-4 gap-3">
        <div>
          <Label className="text-xs">Indicator</Label>
          <Select value={rule.indicator} onValueChange={(v) => updateRule(rule.id, type, 'indicator', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {indicators.map(ind => (
                <SelectItem key={ind.id} value={ind.id}>
                  {ind.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Condition</Label>
          <Select value={rule.condition} onValueChange={(v) => updateRule(rule.id, type, 'condition', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {conditions.map(c => (
                <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Value</Label>
          <Input 
            value={rule.value} 
            onChange={(e) => updateRule(rule.id, type, 'value', e.target.value)}
          />
        </div>
        <div>
          <Label className="text-xs">Timeframe</Label>
          <Select value={rule.timeframe} onValueChange={(v) => updateRule(rule.id, type, 'timeframe', v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeframes.map(tf => (
                <SelectItem key={tf} value={tf}>{tf}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* Main Builder */}
      <div className="col-span-2 space-y-6">
        {/* Strategy Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Strategy Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Strategy Name</Label>
                <Input 
                  value={strategy.name}
                  onChange={(e) => setStrategy(s => ({ ...s, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Base Timeframe</Label>
                <Select value={strategy.timeframe} onValueChange={(v) => setStrategy(s => ({ ...s, timeframe: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeframes.map(tf => (
                      <SelectItem key={tf} value={tf}>{tf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea 
                value={strategy.description}
                onChange={(e) => setStrategy(s => ({ ...s, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Trading Pairs</Label>
              <div className="flex gap-2 flex-wrap">
                {strategy.pairs.map(pair => (
                  <Badge key={pair} variant="secondary" className="gap-1">
                    {pair}
                    <button 
                      onClick={() => setStrategy(s => ({ ...s, pairs: s.pairs.filter(p => p !== pair) }))}
                      className="ml-1 hover:text-destructive"
                    >×</button>
                  </Badge>
                ))}
                <Button variant="outline" size="sm" className="h-6">
                  <Plus className="h-3 w-3 mr-1" /> Add Pair
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Entry Rules */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-green-500">
                <TrendingUp className="h-5 w-5" />
                Entry Rules
              </CardTitle>
              <Button size="sm" onClick={() => addRule('entry')}>
                <Plus className="h-4 w-4 mr-1" /> Add Rule
              </Button>
            </div>
            <CardDescription>Conditions that must be met to enter a trade</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {strategy.entryRules.map((rule, i) => (
              <div key={rule.id}>
                <RuleBuilder rule={rule} type="entry" />
                {i < strategy.entryRules.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <Badge variant="outline">AND</Badge>
                  </div>
                )}
              </div>
            ))}
            {strategy.entryRules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No entry rules defined. Click "Add Rule" to create one.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exit Rules */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-500">
                <TrendingDown className="h-5 w-5" />
                Exit Rules
              </CardTitle>
              <Button size="sm" onClick={() => addRule('exit')}>
                <Plus className="h-4 w-4 mr-1" /> Add Rule
              </Button>
            </div>
            <CardDescription>Conditions that trigger position exit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {strategy.exitRules.map((rule, i) => (
              <div key={rule.id}>
                <RuleBuilder rule={rule} type="exit" />
                {i < strategy.exitRules.length - 1 && (
                  <div className="flex items-center justify-center py-2">
                    <Badge variant="outline">OR</Badge>
                  </div>
                )}
              </div>
            ))}
            {strategy.exitRules.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No exit rules defined. Click "Add Rule" to create one.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Risk Parameters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Risk Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Position Size</Label>
                <span className="font-mono">{strategy.riskParams.positionSize}%</span>
              </div>
              <Slider 
                value={[strategy.riskParams.positionSize]}
                onValueChange={([v]) => setStrategy(s => ({ ...s, riskParams: { ...s.riskParams, positionSize: v } }))}
                max={100}
                step={1}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Stop Loss</Label>
                <span className="font-mono text-red-500">-{strategy.riskParams.stopLoss}%</span>
              </div>
              <Slider 
                value={[strategy.riskParams.stopLoss]}
                onValueChange={([v]) => setStrategy(s => ({ ...s, riskParams: { ...s.riskParams, stopLoss: v } }))}
                max={50}
                step={0.5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Take Profit</Label>
                <span className="font-mono text-green-500">+{strategy.riskParams.takeProfit}%</span>
              </div>
              <Slider 
                value={[strategy.riskParams.takeProfit]}
                onValueChange={([v]) => setStrategy(s => ({ ...s, riskParams: { ...s.riskParams, takeProfit: v } }))}
                max={100}
                step={0.5}
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <Label>Max Open Trades</Label>
                <span className="font-mono">{strategy.riskParams.maxOpenTrades}</span>
              </div>
              <Slider 
                value={[strategy.riskParams.maxOpenTrades]}
                onValueChange={([v]) => setStrategy(s => ({ ...s, riskParams: { ...s.riskParams, maxOpenTrades: v } }))}
                max={10}
                step={1}
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border">
              <Label>Trailing Stop</Label>
              <Switch 
                checked={strategy.riskParams.trailingStop}
                onCheckedChange={(v) => setStrategy(s => ({ ...s, riskParams: { ...s.riskParams, trailingStop: v } }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="pt-6 space-y-3">
            <Button className="w-full" onClick={() => setShowCode(!showCode)}>
              <Code className="h-4 w-4 mr-2" />
              {showCode ? 'Hide Code' : 'View Generated Code'}
            </Button>
            <Button className="w-full" variant="outline" onClick={() => toast.success("Strategy saved!")}>
              <Save className="h-4 w-4 mr-2" />
              Save Strategy
            </Button>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => toast.success("Backtest started!")}>
              <Play className="h-4 w-4 mr-2" />
              Run Backtest
            </Button>
          </CardContent>
        </Card>

        {/* Generated Code */}
        {showCode && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Code className="h-4 w-4" />
                Generated Strategy Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto">
                  {generateCode()}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default StrategyBuilder;
