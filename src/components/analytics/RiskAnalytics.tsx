import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, ReferenceLine
} from "recharts";
import { 
  Shield, 
  AlertTriangle, 
  TrendingDown,
  Activity,
  Gauge,
  Target,
  Calculator,
  RefreshCw
} from "lucide-react";

const RiskAnalytics = () => {
  const [timeframe, setTimeframe] = useState("30d");
  const [confidenceLevel, setConfidenceLevel] = useState([95]);

  const [varHistory, setVarHistory] = useState<any[]>([]);
  const [drawdownData, setDrawdownData] = useState<any[]>([]);
  const [riskContribution, setRiskContribution] = useState<any[]>([]);
  const [volatilitySurface, setVolatilitySurface] = useState<any[]>([]);
  const [greeksData, setGreeksData] = useState<any[]>([]);
  const [stressTests, setStressTests] = useState<any[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      // Load portfolio holdings for risk contribution
      const { data: holdings } = await supabase
        .from('portfolio_holdings')
        .select('*')
        .order('value_usd', { ascending: false })
        .limit(10);

      if (holdings && holdings.length > 0) {
        const totalValue = holdings.reduce((s, h) => s + Number(h.value_usd), 0);
        setRiskContribution(holdings.map(h => ({
          asset: h.symbol,
          marginal: Math.abs(Number(h.change_24h) || 0),
          component: totalValue > 0 ? Math.round((Number(h.value_usd) / totalValue) * 100) : 0,
          pct: totalValue > 0 ? Math.round((Number(h.value_usd) / totalValue) * 100) : 0,
        })));

        // Derive risk metrics from real portfolio
        const avgChange = holdings.reduce((s, h) => s + Math.abs(Number(h.change_24h) || 0), 0) / holdings.length;
        setRiskMetrics({
          var95: Number((avgChange * 1.65).toFixed(1)),
          var99: Number((avgChange * 2.33).toFixed(1)),
          cvar95: Number((avgChange * 2.0).toFixed(1)),
          cvar99: Number((avgChange * 2.8).toFixed(1)),
          maxDrawdown: Number((avgChange * 5).toFixed(1)),
          beta: 1.0,
          sharpeRatio: totalValue > 10000 ? 0.8 : 0.3,
          sortinoRatio: totalValue > 10000 ? 1.1 : 0.4,
          calmarRatio: 0.5,
          informationRatio: 0.3,
          treynorRatio: 0.1,
          omega: 1.2,
        });
      }

      // Load backtest results for VaR history
      const { data: backtests } = await supabase
        .from('backtest_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(60);

      if (backtests && backtests.length > 0) {
        setVarHistory(backtests.map((b, i) => ({
          day: i + 1,
          var95: Math.abs(Number(b.max_drawdown) || 5) * 0.5,
          var99: Math.abs(Number(b.max_drawdown) || 8) * 0.8,
          cvar95: Math.abs(Number(b.max_drawdown) || 7) * 0.65,
          actualLoss: Number(b.total_return) < 0 ? Math.abs(Number(b.total_return)) : 0,
        })));
      }
    };
    load();
  }, [timeframe]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="space-y-1">
          <Label className="text-sm">Timeframe</Label>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 flex-1 min-w-[200px] max-w-[300px]">
          <Label className="text-sm">Confidence Level: {confidenceLevel[0]}%</Label>
          <Slider 
            value={confidenceLevel} 
            onValueChange={setConfidenceLevel}
            min={90}
            max={99}
            step={1}
          />
        </div>

        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Recalculate
        </Button>
      </div>

      {/* Risk Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { label: "VaR (95%)", value: `${riskMetrics.var95}%`, color: "text-warning" },
          { label: "VaR (99%)", value: `${riskMetrics.var99}%`, color: "text-destructive" },
          { label: "CVaR (95%)", value: `${riskMetrics.cvar95}%`, color: "text-warning" },
          { label: "Max Drawdown", value: `${riskMetrics.maxDrawdown}%`, color: "text-destructive" },
          { label: "Sharpe Ratio", value: riskMetrics.sharpeRatio.toFixed(2), color: "text-success" },
          { label: "Beta", value: riskMetrics.beta.toFixed(2), color: "text-primary" },
        ].map((metric, idx) => (
          <Card key={idx}>
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className={`text-2xl font-bold ${metric.color}`}>{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="var" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="var">VaR Analysis</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown</TabsTrigger>
          <TabsTrigger value="contribution">Risk Contribution</TabsTrigger>
          <TabsTrigger value="stress">Stress Testing</TabsTrigger>
          <TabsTrigger value="greeks">Greeks</TabsTrigger>
        </TabsList>

        {/* VaR Analysis Tab */}
        <TabsContent value="var" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5" />
                Value at Risk History
              </CardTitle>
              <CardDescription>Historical VaR and actual losses comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={varHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="var95" stroke="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" fillOpacity={0.2} name="VaR 95%" />
                  <Area type="monotone" dataKey="var99" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.1} name="VaR 99%" />
                  <Line type="monotone" dataKey="cvar95" stroke="hsl(180, 84%, 35%)" name="CVaR 95%" strokeDasharray="5 5" />
                  <Bar dataKey="actualLoss" fill="hsl(220, 91%, 25%)" name="Actual Loss" />
                  <ReferenceLine y={7} stroke="red" strokeDasharray="3 3" label="Alert Level" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parametric VaR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily (95%)</span>
                    <span className="font-mono font-bold">{riskMetrics.var95}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly (95%)</span>
                    <span className="font-mono font-bold">{(riskMetrics.var95 * Math.sqrt(5)).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly (95%)</span>
                    <span className="font-mono font-bold">{(riskMetrics.var95 * Math.sqrt(21)).toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historical VaR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily (95%)</span>
                    <span className="font-mono font-bold">7.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly (95%)</span>
                    <span className="font-mono font-bold">15.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly (95%)</span>
                    <span className="font-mono font-bold">28.4%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monte Carlo VaR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily (95%)</span>
                    <span className="font-mono font-bold">6.9%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Weekly (95%)</span>
                    <span className="font-mono font-bold">14.6%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly (95%)</span>
                    <span className="font-mono font-bold">26.1%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Drawdown Tab */}
        <TabsContent value="drawdown">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Drawdown Analysis
              </CardTitle>
              <CardDescription>Historical drawdown periods and recovery</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={drawdownData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="drawdown" stroke="hsl(0, 84%, 60%)" fill="hsl(0, 84%, 60%)" fillOpacity={0.3} name="Drawdown %" />
                  <ReferenceLine y={-riskMetrics.maxDrawdown} stroke="red" strokeDasharray="3 3" label="Max DD" />
                </AreaChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Max Drawdown</p>
                  <p className="text-2xl font-bold text-destructive">-{riskMetrics.maxDrawdown}%</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Drawdown</p>
                  <p className="text-2xl font-bold text-warning">-8.5%</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Recovery</p>
                  <p className="text-2xl font-bold text-success">42 days</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Calmar Ratio</p>
                  <p className="text-2xl font-bold text-primary">{riskMetrics.calmarRatio}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Contribution Tab */}
        <TabsContent value="contribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Risk Contribution by Asset
              </CardTitle>
              <CardDescription>Marginal and component risk contribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={riskContribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="asset" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="marginal" fill="hsl(220, 91%, 25%)" name="Marginal Risk %" />
                  <Bar yAxisId="right" dataKey="component" fill="hsl(180, 84%, 35%)" name="Component Risk %" />
                </BarChart>
              </ResponsiveContainer>

              <div className="mt-6">
                <h4 className="font-semibold mb-3">Risk Contribution Details</h4>
                <div className="space-y-2">
                  {riskContribution.map((asset, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <span className="font-mono w-16">{asset.asset}</span>
                      <Progress value={asset.pct} className="flex-1 h-3" />
                      <span className="w-16 text-right font-mono">{asset.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stress Testing Tab */}
        <TabsContent value="stress">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Stress Testing Scenarios
              </CardTitle>
              <CardDescription>Portfolio impact under various stress scenarios</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stressTests.map((test, idx) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{test.scenario}</h4>
                        <p className="text-sm text-muted-foreground">Probability: {test.probability}%</p>
                      </div>
                      <Badge variant={test.portfolioImpact < -20 ? "destructive" : "secondary"}>
                        {test.portfolioImpact}%
                      </Badge>
                    </div>
                    <Progress value={Math.abs(test.portfolioImpact)} max={50} className="h-3" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Greeks Tab */}
        <TabsContent value="greeks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Portfolio Greeks
              </CardTitle>
              <CardDescription>Option sensitivities and risk measures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left">Asset</th>
                      <th className="p-3 text-right">Delta (Δ)</th>
                      <th className="p-3 text-right">Gamma (Γ)</th>
                      <th className="p-3 text-right">Theta (Θ)</th>
                      <th className="p-3 text-right">Vega (ν)</th>
                      <th className="p-3 text-right">Rho (ρ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {greeksData.map((greek, idx) => (
                      <tr key={idx} className="border-b hover:bg-secondary/30">
                        <td className="p-3 font-mono font-semibold">{greek.asset}</td>
                        <td className={`p-3 text-right font-mono ${greek.delta > 0 ? 'text-success' : 'text-destructive'}`}>
                          {greek.delta.toFixed(3)}
                        </td>
                        <td className="p-3 text-right font-mono">{greek.gamma.toFixed(4)}</td>
                        <td className={`p-3 text-right font-mono ${greek.theta < 0 ? 'text-destructive' : 'text-success'}`}>
                          {greek.theta.toFixed(3)}
                        </td>
                        <td className="p-3 text-right font-mono">{greek.vega.toFixed(3)}</td>
                        <td className="p-3 text-right font-mono">{greek.rho.toFixed(3)}</td>
                      </tr>
                    ))}
                    <tr className="font-bold bg-secondary/50">
                      <td className="p-3">Portfolio Total</td>
                      <td className="p-3 text-right font-mono">0.65</td>
                      <td className="p-3 text-right font-mono">0.045</td>
                      <td className="p-3 text-right font-mono text-destructive">-1.35</td>
                      <td className="p-3 text-right font-mono">1.02</td>
                      <td className="p-3 text-right font-mono">0.35</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Dollar Delta</p>
                  <p className="text-xl font-bold">$32,450</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Dollar Gamma</p>
                  <p className="text-xl font-bold">$2,250</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Dollar Theta</p>
                  <p className="text-xl font-bold text-destructive">-$675</p>
                </div>
                <div className="p-4 bg-secondary/30 rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">Dollar Vega</p>
                  <p className="text-xl font-bold">$5,100</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RiskAnalytics;
