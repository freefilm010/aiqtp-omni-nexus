import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code,
  Play,
  Square,
  Save,
  FolderOpen,
  Plus,
  Terminal,
  BookOpen,
  Zap,
  AlertCircle,
  CheckCircle,
  Copy,
  Download,
  Upload,
  Settings,
  Lightbulb,
  TrendingUp,
  BarChart3,
  Activity
} from "lucide-react";
import { toast } from "sonner";

// Script templates
const SCRIPT_TEMPLATES = [
  {
    id: 'sma_cross',
    name: 'SMA Crossover',
    category: 'Trend',
    description: 'Simple Moving Average crossover strategy',
    code: `// SMA Crossover Strategy
// Buy when fast SMA crosses above slow SMA

//@version=1
strategy("SMA Crossover", overlay=true)

// Inputs
fastLength = input(9, "Fast SMA")
slowLength = input(21, "Slow SMA")

// Calculate SMAs
fastSMA = sma(close, fastLength)
slowSMA = sma(close, slowLength)

// Plot
plot(fastSMA, "Fast SMA", color=color.blue)
plot(slowSMA, "Slow SMA", color=color.red)

// Signals
longCondition = crossover(fastSMA, slowSMA)
shortCondition = crossunder(fastSMA, slowSMA)

// Execute
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")

// Alerts
alertcondition(longCondition, "Buy Signal", "SMA Golden Cross")
alertcondition(shortCondition, "Sell Signal", "SMA Death Cross")`,
  },
  {
    id: 'rsi_oversold',
    name: 'RSI Bounce',
    category: 'Momentum',
    description: 'Buy RSI oversold, sell overbought',
    code: `// RSI Bounce Strategy
// Buy when RSI < 30, Sell when RSI > 70

//@version=1
strategy("RSI Bounce", overlay=false)

// Inputs
rsiLength = input(14, "RSI Length")
oversold = input(30, "Oversold Level")
overbought = input(70, "Overbought Level")

// Calculate
rsiValue = rsi(close, rsiLength)

// Plot
plot(rsiValue, "RSI", color=color.purple)
hline(oversold, "Oversold", color=color.green)
hline(overbought, "Overbought", color=color.red)
hline(50, "Midline", color=color.gray)

// Signals
longCondition = crossover(rsiValue, oversold)
shortCondition = crossunder(rsiValue, overbought)

// Execute
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")`,
  },
  {
    id: 'bb_squeeze',
    name: 'Bollinger Squeeze',
    category: 'Volatility',
    description: 'Trade Bollinger Band breakouts',
    code: `// Bollinger Band Squeeze Strategy
// Enter on volatility expansion

//@version=1
strategy("BB Squeeze", overlay=true)

// Inputs
length = input(20, "BB Length")
mult = input(2.0, "BB StdDev")
squeezePeriod = input(10, "Squeeze Period")

// Calculate BB
basis = sma(close, length)
dev = mult * stdev(close, length)
upper = basis + dev
lower = basis - dev

// Calculate squeeze (band width)
bbWidth = (upper - lower) / basis
isSqueezing = bbWidth < lowest(bbWidth, squeezePeriod) * 1.1

// Plot
plot(basis, "Basis", color=color.orange)
fill(plot(upper), plot(lower), color=isSqueezing ? color.red : color.green, transp=90)

// Signals
breakoutUp = close > upper and not isSqueezing
breakoutDown = close < lower and not isSqueezing

// Execute
if (breakoutUp)
    strategy.entry("Long", strategy.long)
if (breakoutDown)
    strategy.close("Long")`,
  },
  {
    id: 'volume_profile',
    name: 'Volume Spike',
    category: 'Volume',
    description: 'Trade on unusual volume',
    code: `// Volume Spike Strategy
// Enter on high volume moves

//@version=1
strategy("Volume Spike", overlay=true)

// Inputs
volLength = input(20, "Volume MA Length")
volMult = input(2.0, "Volume Spike Multiplier")

// Calculate
volMA = sma(volume, volLength)
isVolumeSpike = volume > volMA * volMult
priceUp = close > open

// Plot volume
plotshape(isVolumeSpike and priceUp, "Vol Spike Up", shape.triangleup, location.belowbar, color.green)
plotshape(isVolumeSpike and not priceUp, "Vol Spike Down", shape.triangledown, location.abovebar, color.red)

// Signals
longCondition = isVolumeSpike and priceUp
shortCondition = isVolumeSpike and not priceUp

// Execute
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")`,
  },
  {
    id: 'macd_divergence',
    name: 'MACD Divergence',
    category: 'Momentum',
    description: 'Detect MACD divergences',
    code: `// MACD Divergence Strategy
// Detect bullish/bearish divergences

//@version=1
strategy("MACD Divergence", overlay=false)

// Inputs
fastLength = input(12, "Fast Length")
slowLength = input(26, "Slow Length")
signalLength = input(9, "Signal Length")

// Calculate MACD
[macdLine, signalLine, histogram] = macd(close, fastLength, slowLength, signalLength)

// Plot
plot(macdLine, "MACD", color=color.blue)
plot(signalLine, "Signal", color=color.orange)
plot(histogram, "Histogram", color=histogram >= 0 ? color.green : color.red, style=plot.style_histogram)

// Simple crossover signals
longCondition = crossover(macdLine, signalLine) and macdLine < 0
shortCondition = crossunder(macdLine, signalLine) and macdLine > 0

// Execute
if (longCondition)
    strategy.entry("Long", strategy.long)
if (shortCondition)
    strategy.close("Long")`,
  },
];

// Built-in functions documentation
const BUILTIN_FUNCTIONS = [
  { name: 'sma', syntax: 'sma(source, length)', desc: 'Simple Moving Average' },
  { name: 'ema', syntax: 'ema(source, length)', desc: 'Exponential Moving Average' },
  { name: 'rsi', syntax: 'rsi(source, length)', desc: 'Relative Strength Index' },
  { name: 'macd', syntax: 'macd(source, fast, slow, signal)', desc: 'MACD indicator' },
  { name: 'stoch', syntax: 'stoch(close, high, low, length)', desc: 'Stochastic oscillator' },
  { name: 'atr', syntax: 'atr(length)', desc: 'Average True Range' },
  { name: 'bb', syntax: 'bb(source, length, mult)', desc: 'Bollinger Bands' },
  { name: 'crossover', syntax: 'crossover(a, b)', desc: 'True when a crosses above b' },
  { name: 'crossunder', syntax: 'crossunder(a, b)', desc: 'True when a crosses below b' },
  { name: 'highest', syntax: 'highest(source, length)', desc: 'Highest value over N bars' },
  { name: 'lowest', syntax: 'lowest(source, length)', desc: 'Lowest value over N bars' },
  { name: 'stdev', syntax: 'stdev(source, length)', desc: 'Standard deviation' },
  { name: 'plot', syntax: 'plot(series, title, color)', desc: 'Plot a data series' },
  { name: 'hline', syntax: 'hline(price, title, color)', desc: 'Horizontal line' },
  { name: 'fill', syntax: 'fill(plot1, plot2, color)', desc: 'Fill between plots' },
  { name: 'alertcondition', syntax: 'alertcondition(cond, title, msg)', desc: 'Create alert' },
];

interface SavedScript {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  lastRun?: Date;
}

interface ConsoleMessage {
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  timestamp: Date;
}

const ScriptEditor = () => {
  const [code, setCode] = useState(SCRIPT_TEMPLATES[0].code);
  const [scriptName, setScriptName] = useState('My Strategy');
  const [isRunning, setIsRunning] = useState(false);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([
    { type: 'info', message: 'Editor ready. Write your strategy script.', timestamp: new Date() },
  ]);
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [activeTab, setActiveTab] = useState('editor');

  const addConsoleMessage = (type: ConsoleMessage['type'], message: string) => {
    setConsoleMessages((prev) => [...prev, { type, message, timestamp: new Date() }]);
  };

  const handleRun = useCallback(() => {
    setIsRunning(true);
    addConsoleMessage('info', 'Compiling strategy...');

    // Simulate compilation and execution
    setTimeout(() => {
      addConsoleMessage('success', 'Strategy compiled successfully');
      addConsoleMessage('info', 'Running backtest on BTC/USD 1H (last 1000 bars)...');

      setTimeout(() => {
        // Mock results
        addConsoleMessage('success', '✓ Backtest complete: 127 trades, Win Rate: 58.3%, Sharpe: 1.42');
        addConsoleMessage('info', 'Strategy applied to chart');
        setIsRunning(false);
        toast.success('Strategy executed successfully!');
      }, 1500);
    }, 800);
  }, []);

  const handleStop = () => {
    setIsRunning(false);
    addConsoleMessage('warning', 'Strategy execution stopped');
  };

  const handleSave = () => {
    const newScript: SavedScript = {
      id: Date.now().toString(),
      name: scriptName,
      code,
      createdAt: new Date(),
    };
    setSavedScripts([...savedScripts, newScript]);
    toast.success(`Script "${scriptName}" saved!`);
  };

  const handleLoadTemplate = (template: typeof SCRIPT_TEMPLATES[0]) => {
    setCode(template.code);
    setScriptName(template.name);
    addConsoleMessage('info', `Loaded template: ${template.name}`);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard');
  };

  const handleExport = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scriptName.replace(/\s+/g, '_')}.qscript`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Script exported!');
  };

  return (
    <div className="grid grid-cols-4 gap-4 h-[calc(100vh-200px)]">
      {/* Left Sidebar - Templates & Docs */}
      <div className="space-y-4">
        <Card className="h-1/2">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Templates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100%-50px)]">
              <div className="p-2 space-y-1">
                {SCRIPT_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className="p-2 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleLoadTemplate(template)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{template.name}</span>
                      <Badge variant="outline" className="text-xs">{template.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{template.description}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="h-1/2">
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Functions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100%-50px)]">
              <div className="p-2 space-y-1">
                {BUILTIN_FUNCTIONS.map((fn) => (
                  <div
                    key={fn.name}
                    className="p-2 rounded-lg hover:bg-muted/30 cursor-pointer"
                    onClick={() => {
                      setCode((prev) => prev + '\n' + fn.syntax);
                      toast.info(`Added ${fn.name}()`);
                    }}
                  >
                    <code className="text-xs text-primary font-mono">{fn.syntax}</code>
                    <p className="text-xs text-muted-foreground mt-0.5">{fn.desc}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Main Editor Area */}
      <div className="col-span-2 flex flex-col gap-4">
        <Card className="flex-1 flex flex-col">
          <CardHeader className="py-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="h-5 w-5 text-primary" />
                <Input
                  value={scriptName}
                  onChange={(e) => setScriptName(e.target.value)}
                  className="w-48 h-8 font-semibold"
                />
                <Badge variant="outline">QuantScript v1</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                {isRunning ? (
                  <Button variant="destructive" size="sm" onClick={handleStop}>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                ) : (
                  <Button size="sm" onClick={handleRun}>
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <Textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="h-full w-full resize-none border-0 rounded-none font-mono text-sm focus-visible:ring-0 bg-muted/30"
              placeholder="// Write your QuantScript strategy here..."
              style={{ minHeight: '400px' }}
            />
          </CardContent>
        </Card>

        {/* Console */}
        <Card className="h-40">
          <CardHeader className="py-2 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                Console
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConsoleMessages([])}
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-24">
              <div className="p-2 font-mono text-xs space-y-1">
                {consoleMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    {msg.type === 'error' && <AlertCircle className="h-3 w-3 text-red-500 mt-0.5" />}
                    {msg.type === 'success' && <CheckCircle className="h-3 w-3 text-green-500 mt-0.5" />}
                    {msg.type === 'warning' && <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5" />}
                    {msg.type === 'info' && <Zap className="h-3 w-3 text-blue-500 mt-0.5" />}
                    <span className="text-muted-foreground">
                      [{msg.timestamp.toLocaleTimeString()}]
                    </span>
                    <span className={
                      msg.type === 'error' ? 'text-red-500' :
                      msg.type === 'success' ? 'text-green-500' :
                      msg.type === 'warning' ? 'text-amber-500' :
                      'text-foreground'
                    }>
                      {msg.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Right Sidebar - Saved Scripts & Settings */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FolderOpen className="h-4 w-4" />
              My Scripts
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2">
            <ScrollArea className="h-40">
              {savedScripts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No saved scripts yet
                </p>
              ) : (
                <div className="space-y-1">
                  {savedScripts.map((script) => (
                    <div
                      key={script.id}
                      className="p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setCode(script.code);
                        setScriptName(script.name);
                      }}
                    >
                      <span className="text-sm font-medium">{script.name}</span>
                      <p className="text-xs text-muted-foreground">
                        {script.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Execution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground">Symbol</label>
              <Select defaultValue="BTC">
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC">BTC/USD</SelectItem>
                  <SelectItem value="ETH">ETH/USD</SelectItem>
                  <SelectItem value="SPY">SPY</SelectItem>
                  <SelectItem value="QQQ">QQQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Timeframe</label>
              <Select defaultValue="1H">
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1m">1 Minute</SelectItem>
                  <SelectItem value="5m">5 Minutes</SelectItem>
                  <SelectItem value="15m">15 Minutes</SelectItem>
                  <SelectItem value="1H">1 Hour</SelectItem>
                  <SelectItem value="4H">4 Hours</SelectItem>
                  <SelectItem value="1D">1 Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Backtest Range</label>
              <Select defaultValue="1000">
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="100">100 bars</SelectItem>
                  <SelectItem value="500">500 bars</SelectItem>
                  <SelectItem value="1000">1000 bars</SelectItem>
                  <SelectItem value="5000">5000 bars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lines of code</span>
              <span className="font-mono">{code.split('\n').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Indicators used</span>
              <span className="font-mono">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Alerts defined</span>
              <span className="font-mono">2</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScriptEditor;
