import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  FlaskConical, 
  Play, 
  Code, 
  FileCode,
  Download,
  Save,
  TrendingUp,
  Calculator,
  GitBranch,
  Beaker
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QuantResearch = () => {
  const { toast } = useToast();
  const [code, setCode] = useState(`# Alpha Factor Research
import numpy as np
import pandas as pd

def calculate_alpha(prices, volume, window=20):
    """
    Custom momentum-volume alpha factor
    """
    # Price momentum
    returns = prices.pct_change()
    momentum = returns.rolling(window).mean()
    
    # Volume normalized
    vol_ma = volume.rolling(window).mean()
    vol_ratio = volume / vol_ma
    
    # Combined alpha signal
    alpha = momentum * np.log(vol_ratio)
    
    # Rank normalize
    alpha_ranked = alpha.rank(pct=True) - 0.5
    
    return alpha_ranked

# Backtest parameters
lookback_period = 252
rebalance_frequency = 'weekly'
transaction_cost = 0.001
`);

  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNotebook, setSelectedNotebook] = useState("alpha-research");

  // Factor Decay Analysis — deterministic noise via sine
  const factorDecay = Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    ic: 0.12 * Math.exp(-i / 15) + Math.abs(Math.sin(i * 3.14159)) * 0.02,
    icSmooth: 0.12 * Math.exp(-i / 15),
    cumReturn: (1 + 0.003) ** i - 1,
  }));

  // Factor Correlation Matrix (simplified)
  const factorCorrelation = [
    { factor: "Momentum", mom: 1.0, vol: 0.3, size: -0.2, value: -0.15, quality: 0.1 },
    { factor: "Volatility", mom: 0.3, vol: 1.0, size: 0.4, value: 0.2, quality: -0.3 },
    { factor: "Size", mom: -0.2, vol: 0.4, size: 1.0, value: 0.5, quality: 0.15 },
    { factor: "Value", mom: -0.15, vol: 0.2, size: 0.5, value: 1.0, quality: 0.4 },
    { factor: "Quality", mom: 0.1, vol: -0.3, size: 0.15, value: 0.4, quality: 1.0 },
  ];

  // Research Notebooks
  const notebooks = [
    { id: "alpha-research", name: "Alpha Factor Research", status: "active" },
    { id: "ml-signals", name: "ML Signal Generation", status: "completed" },
    { id: "regime-analysis", name: "Market Regime Analysis", status: "draft" },
    { id: "portfolio-construction", name: "Portfolio Construction", status: "active" },
    { id: "risk-models", name: "Risk Model Development", status: "draft" },
  ];

  // Backtest Results
  const backtestResults = {
    totalReturn: 45.8,
    sharpeRatio: 1.42,
    maxDrawdown: -18.5,
    winRate: 58.3,
    avgTrade: 0.42,
    calmarRatio: 2.48,
    informationCoeff: 0.085,
    turnover: 0.35,
  };

  // Factor Performance
  const factorPerformance = Array.from({ length: 252 }, (_, i) => ({
    day: i + 1,
    momentum: 100 * (1 + 0.0003 * i + 0.02 * Math.sin(i / 30)),
    value: 100 * (1 + 0.0002 * i + 0.015 * Math.sin(i / 25)),
    size: 100 * (1 + 0.00015 * i + 0.01 * Math.sin(i / 35)),
    quality: 100 * (1 + 0.00025 * i + 0.018 * Math.sin(i / 20)),
    combined: 100 * (1 + 0.0004 * i + 0.01 * Math.sin(i / 40)),
  }));

  const handleExecute = async () => {
    setIsExecuting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsExecuting(false);
    toast({
      title: "Execution Complete",
      description: "Research code executed successfully. Results updated.",
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="notebook" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1">
          <TabsTrigger value="notebook" className="text-[9px] sm:text-sm py-1.5">Notebook</TabsTrigger>
          <TabsTrigger value="factors" className="text-[9px] sm:text-sm py-1.5">Factors</TabsTrigger>
          <TabsTrigger value="backtest" className="text-[9px] sm:text-sm py-1.5">Backtest</TabsTrigger>
          <TabsTrigger value="library" className="text-[9px] sm:text-sm py-1.5">Library</TabsTrigger>
        </TabsList>

        {/* Research Notebook Tab */}
        <TabsContent value="notebook" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Notebook List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Notebooks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notebooks.map((nb) => (
                    <div 
                      key={nb.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedNotebook === nb.id ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                      }`}
                      onClick={() => setSelectedNotebook(nb.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm">{nb.name}</span>
                        <Badge variant={nb.status === "completed" ? "default" : nb.status === "active" ? "secondary" : "outline"} className="text-xs">
                          {nb.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full mt-4">
                    <GitBranch className="h-4 w-4 mr-2" />
                    New Notebook
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Code Editor */}
            <Card className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    {notebooks.find(n => n.id === selectedNotebook)?.name}
                  </CardTitle>
                  <CardDescription>Python research environment</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button size="sm" onClick={handleExecute} disabled={isExecuting}>
                    <Play className="h-4 w-4 mr-2" />
                    {isExecuting ? "Executing..." : "Run"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="font-mono text-[10px] sm:text-sm min-h-[200px] sm:min-h-[400px] bg-secondary/30"
                  placeholder="Enter your research code..."
                />
              </CardContent>
            </Card>
          </div>

          {/* Output */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Output</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-secondary/30 rounded-lg p-4 font-mono text-sm">
                <p className="text-success">✓ Alpha factor calculated successfully</p>
                <p className="text-muted-foreground mt-2">Information Coefficient: 0.085</p>
                <p className="text-muted-foreground">Factor Turnover: 0.35</p>
                <p className="text-muted-foreground">Avg Daily Return: 0.042%</p>
                <p className="text-muted-foreground mt-2">Backtest Period: 252 trading days</p>
                <p className="text-success mt-2">✓ Results saved to factor_results.csv</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Factor Analysis Tab */}
        <TabsContent value="factors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Factor Performance</CardTitle>
                <CardDescription>Cumulative returns by factor</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={factorPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="momentum" stroke="hsl(220, 91%, 25%)" name="Momentum" />
                    <Line type="monotone" dataKey="value" stroke="hsl(45, 96%, 53%)" name="Value" />
                    <Line type="monotone" dataKey="quality" stroke="hsl(180, 84%, 35%)" name="Quality" />
                    <Line type="monotone" dataKey="combined" stroke="hsl(142, 71%, 45%)" name="Combined" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Factor IC Decay</CardTitle>
                <CardDescription>Information coefficient over holding period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={factorDecay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="ic" stroke="hsl(220, 91%, 25%)" fill="hsl(220, 91%, 25%)" fillOpacity={0.2} name="Daily IC" />
                    <Line type="monotone" dataKey="icSmooth" stroke="hsl(45, 96%, 53%)" name="Smoothed IC" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Factor Correlation */}
          <Card>
            <CardHeader>
              <CardTitle>Factor Correlation Matrix</CardTitle>
              <CardDescription>Cross-factor correlations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left"></th>
                      <th className="p-3 text-center">Momentum</th>
                      <th className="p-3 text-center">Volatility</th>
                      <th className="p-3 text-center">Size</th>
                      <th className="p-3 text-center">Value</th>
                      <th className="p-3 text-center">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {factorCorrelation.map((row, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-3 font-medium">{row.factor}</td>
                        <td className={`p-3 text-center font-mono ${row.mom === 1 ? 'bg-primary/20' : row.mom > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.mom.toFixed(2)}
                        </td>
                        <td className={`p-3 text-center font-mono ${row.vol === 1 ? 'bg-primary/20' : row.vol > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.vol.toFixed(2)}
                        </td>
                        <td className={`p-3 text-center font-mono ${row.size === 1 ? 'bg-primary/20' : row.size > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.size.toFixed(2)}
                        </td>
                        <td className={`p-3 text-center font-mono ${row.value === 1 ? 'bg-primary/20' : row.value > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.value.toFixed(2)}
                        </td>
                        <td className={`p-3 text-center font-mono ${row.quality === 1 ? 'bg-primary/20' : row.quality > 0 ? 'text-success' : 'text-destructive'}`}>
                          {row.quality.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backtest Engine Tab */}
        <TabsContent value="backtest" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Backtest Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Backtest Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" defaultValue="2023-01-01" />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" defaultValue="2024-01-01" />
                </div>
                <div className="space-y-2">
                  <Label>Initial Capital</Label>
                  <Input type="number" defaultValue="100000" />
                </div>
                <div className="space-y-2">
                  <Label>Rebalance Frequency</Label>
                  <Select defaultValue="weekly">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Transaction Cost (bps)</Label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div className="space-y-2">
                  <Label>Slippage (bps)</Label>
                  <Input type="number" defaultValue="5" />
                </div>
                <Button className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Run Backtest
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Backtest Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Total Return</p>
                    <p className="text-2xl font-bold text-success">{backtestResults.totalReturn}%</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Sharpe Ratio</p>
                    <p className="text-2xl font-bold text-primary">{backtestResults.sharpeRatio}</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Max Drawdown</p>
                    <p className="text-2xl font-bold text-destructive">{backtestResults.maxDrawdown}%</p>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">Win Rate</p>
                    <p className="text-2xl font-bold text-accent">{backtestResults.winRate}%</p>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={factorPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="combined" stroke="hsl(142, 71%, 45%)" fill="hsl(142, 71%, 45%)" fillOpacity={0.3} name="Portfolio Value" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Strategy Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Beaker className="h-5 w-5" />
                Pre-built Strategy Templates
              </CardTitle>
              <CardDescription>Ready-to-use quantitative strategies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: "Momentum Crossover", type: "Trend Following", sharpe: 1.2, complexity: "Low" },
                  { name: "Mean Reversion", type: "Statistical Arb", sharpe: 0.9, complexity: "Medium" },
                  { name: "Pairs Trading", type: "Market Neutral", sharpe: 1.4, complexity: "Medium" },
                  { name: "Factor Rotation", type: "Multi-Factor", sharpe: 1.6, complexity: "High" },
                  { name: "Risk Parity", type: "Asset Allocation", sharpe: 0.8, complexity: "Medium" },
                  { name: "Trend + Value", type: "Hybrid", sharpe: 1.3, complexity: "High" },
                ].map((strategy, idx) => (
                  <div key={idx} className="p-4 border rounded-lg hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{strategy.name}</h4>
                      <Badge variant="outline">{strategy.complexity}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{strategy.type}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        Sharpe: <span className="font-bold text-success">{strategy.sharpe}</span>
                      </span>
                      <Button variant="outline" size="sm">
                        <Download className="h-3 w-3 mr-1" />
                        Use
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuantResearch;
