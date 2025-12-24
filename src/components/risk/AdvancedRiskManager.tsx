import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Shield,
  AlertTriangle,
  TrendingDown,
  Target,
  Activity,
  Gauge,
  BarChart3,
  Bell,
  Settings,
  RefreshCw,
  Zap,
  Lock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface RiskMetric {
  name: string;
  value: number;
  limit: number;
  status: "safe" | "warning" | "danger";
  description: string;
}

const generateDrawdownData = () => {
  const data = [];
  let value = 0;
  for (let i = 0; i < 30; i++) {
    value = Math.min(0, value + (Math.random() - 0.6) * 3);
    data.push({
      day: i + 1,
      drawdown: value,
      limit: -15
    });
  }
  return data;
};

const generateVaRData = () => {
  return Array.from({ length: 100 }, (_, i) => ({
    return: (i - 50) * 0.5,
    frequency: Math.exp(-Math.pow((i - 50) * 0.1, 2) / 2) * 100 + Math.random() * 10
  }));
};

const AdvancedRiskManager = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([
    { name: "Portfolio VaR (95%)", value: 4.2, limit: 5, status: "warning", description: "Value at Risk" },
    { name: "Portfolio VaR (99%)", value: 6.8, limit: 8, status: "warning", description: "Extreme VaR" },
    { name: "Max Drawdown", value: 8.5, limit: 15, status: "safe", description: "Current drawdown" },
    { name: "Leverage Ratio", value: 2.4, limit: 5, status: "safe", description: "Total leverage" },
    { name: "Concentration Risk", value: 28, limit: 30, status: "warning", description: "Largest position" },
    { name: "Beta Exposure", value: 1.15, limit: 1.5, status: "safe", description: "Market beta" }
  ]);

  const [drawdownData] = useState(generateDrawdownData());
  const [varData] = useState(generateVaRData());
  const [autoHedge, setAutoHedge] = useState(true);
  const [riskLimits, setRiskLimits] = useState({
    maxLeverage: [5],
    maxDrawdown: [15],
    positionLimit: [30],
    dailyLossLimit: [3]
  });

  const [alerts, setAlerts] = useState([
    { id: 1, type: "warning", message: "BTC position approaching concentration limit", time: "2 min ago" },
    { id: 2, type: "info", message: "Correlation spike detected: BTC-ETH at 0.95", time: "15 min ago" },
    { id: 3, type: "success", message: "Portfolio rebalanced to reduce risk", time: "1 hour ago" }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe": return "text-green-500";
      case "warning": return "text-yellow-500";
      case "danger": return "text-red-500";
      default: return "text-muted-foreground";
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case "warning": return "bg-yellow-500/10 border-yellow-500/20 text-yellow-500";
      case "danger": return "bg-red-500/10 border-red-500/20 text-red-500";
      case "success": return "bg-green-500/10 border-green-500/20 text-green-500";
      default: return "bg-blue-500/10 border-blue-500/20 text-blue-500";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Risk Management</h2>
          <p className="text-muted-foreground">Real-time portfolio risk monitoring & controls</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Shield className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Risk Score</p>
                  <p className="text-2xl font-bold text-green-500">72/100</p>
                </div>
              </div>
              <Badge className="bg-green-500/10 text-green-500">Low Risk</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-500/10">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Alerts</p>
                  <p className="text-2xl font-bold text-foreground">3</p>
                </div>
              </div>
              <Badge className="bg-yellow-500/10 text-yellow-500">2 Warnings</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Auto-Hedge</p>
                  <p className="text-2xl font-bold text-foreground">Active</p>
                </div>
              </div>
              <Switch checked={autoHedge} onCheckedChange={setAutoHedge} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
          <TabsTrigger value="var">VaR Analysis</TabsTrigger>
          <TabsTrigger value="stress">Stress Testing</TabsTrigger>
          <TabsTrigger value="limits">Risk Limits</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {riskMetrics.map((metric, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{metric.name}</p>
                      <p className="text-xs text-muted-foreground">{metric.description}</p>
                    </div>
                    <Badge className={`${
                      metric.status === "safe" ? "bg-green-500/10 text-green-500" :
                      metric.status === "warning" ? "bg-yellow-500/10 text-yellow-500" :
                      "bg-red-500/10 text-red-500"
                    }`}>
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className={getStatusColor(metric.status)}>
                        {metric.value}{metric.name.includes("%") || metric.name.includes("VaR") ? "%" : "x"}
                      </span>
                      <span className="text-muted-foreground">
                        Limit: {metric.limit}{metric.name.includes("%") || metric.name.includes("VaR") ? "%" : "x"}
                      </span>
                    </div>
                    <Progress 
                      value={(metric.value / metric.limit) * 100} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Drawdown History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={drawdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="drawdown" 
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive) / 0.2)" 
                    />
                    <Line 
                      type="monotone" 
                      dataKey="limit" 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="var" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Return Distribution & VaR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={varData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="return" stroke="hsl(var(--muted-foreground))" label={{ value: 'Return %', position: 'bottom' }} />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }} 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="frequency" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary) / 0.3)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">VaR 95%</p>
                  <p className="text-xl font-bold text-red-500">-4.2%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">VaR 99%</p>
                  <p className="text-xl font-bold text-red-500">-6.8%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">CVaR 95%</p>
                  <p className="text-xl font-bold text-red-500">-5.4%</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Expected Shortfall</p>
                  <p className="text-xl font-bold text-red-500">-7.2%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stress" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Stress Test Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: "2008 Financial Crisis", impact: -32.5, probability: "Low" },
                  { name: "COVID-19 March 2020", impact: -28.4, probability: "Low" },
                  { name: "Crypto Winter 2022", impact: -45.2, probability: "Medium" },
                  { name: "Flash Crash Scenario", impact: -18.6, probability: "Medium" },
                  { name: "Black Swan Event", impact: -52.8, probability: "Very Low" },
                  { name: "Gradual Bear Market", impact: -22.3, probability: "High" }
                ].map((scenario, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium text-foreground">{scenario.name}</p>
                      <p className="text-sm text-muted-foreground">Probability: {scenario.probability}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-red-500">{scenario.impact}%</p>
                      <p className="text-sm text-muted-foreground">Est. Portfolio Impact</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">Configure Risk Limits</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-foreground">Max Leverage</label>
                  <span className="text-sm text-muted-foreground">{riskLimits.maxLeverage[0]}x</span>
                </div>
                <Slider
                  value={riskLimits.maxLeverage}
                  onValueChange={(v) => setRiskLimits(prev => ({ ...prev, maxLeverage: v }))}
                  max={10}
                  step={0.5}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-foreground">Max Drawdown</label>
                  <span className="text-sm text-muted-foreground">{riskLimits.maxDrawdown[0]}%</span>
                </div>
                <Slider
                  value={riskLimits.maxDrawdown}
                  onValueChange={(v) => setRiskLimits(prev => ({ ...prev, maxDrawdown: v }))}
                  max={50}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-foreground">Single Position Limit</label>
                  <span className="text-sm text-muted-foreground">{riskLimits.positionLimit[0]}%</span>
                </div>
                <Slider
                  value={riskLimits.positionLimit}
                  onValueChange={(v) => setRiskLimits(prev => ({ ...prev, positionLimit: v }))}
                  max={50}
                  step={1}
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-foreground">Daily Loss Limit</label>
                  <span className="text-sm text-muted-foreground">{riskLimits.dailyLossLimit[0]}%</span>
                </div>
                <Slider
                  value={riskLimits.dailyLossLimit}
                  onValueChange={(v) => setRiskLimits(prev => ({ ...prev, dailyLossLimit: v }))}
                  max={10}
                  step={0.5}
                />
              </div>

              <Button className="w-full">
                <Lock className="h-4 w-4 mr-2" />
                Save Risk Limits
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{alert.message}</p>
                      <span className="text-xs opacity-70">{alert.time}</span>
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

export default AdvancedRiskManager;
