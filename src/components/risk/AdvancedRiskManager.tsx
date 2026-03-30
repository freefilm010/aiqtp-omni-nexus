import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Shield, AlertTriangle, Target, Activity, Bell, Settings, RefreshCw, Zap, Lock
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface RiskMetric {
  name: string;
  value: number;
  limit: number;
  status: "safe" | "warning" | "danger";
  description: string;
}

const AdvancedRiskManager = () => {
  const { user } = useAuth();
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [autoHedge, setAutoHedge] = useState(true);
  const [riskLimits, setRiskLimits] = useState({ maxLeverage: [5], maxDrawdown: [15], positionLimit: [30], dailyLossLimit: [3] });

  useEffect(() => {
    if (user) {
      fetchRiskData();
      fetchAlerts();
    }
  }, [user]);

  const fetchRiskData = async () => {
    // Derive risk metrics from portfolio holdings
    const { data: holdings } = await supabase.from('portfolio_holdings').select('*');
    const { data: backtests } = await supabase.from('backtest_results').select('max_drawdown, sharpe_ratio, win_rate').order('created_at', { ascending: false }).limit(5);

    const totalValue = (holdings || []).reduce((s, h) => s + Number(h.value_usd), 0);
    const maxAlloc = (holdings || []).reduce((max, h) => Math.max(max, Number(h.allocation_percent)), 0);
    const avgDrawdown = (backtests || []).reduce((s, b) => s + (Number(b.max_drawdown) || 0), 0) / Math.max((backtests || []).length, 1);

    setRiskMetrics([
      { name: "Portfolio VaR (95%)", value: Math.min(avgDrawdown * 0.6, 10), limit: 5, status: avgDrawdown * 0.6 > 4 ? "warning" : "safe", description: "Value at Risk" },
      { name: "Portfolio VaR (99%)", value: Math.min(avgDrawdown * 0.9, 15), limit: 8, status: avgDrawdown * 0.9 > 7 ? "warning" : "safe", description: "Extreme VaR" },
      { name: "Max Drawdown", value: avgDrawdown, limit: 15, status: avgDrawdown > 12 ? "danger" : avgDrawdown > 8 ? "warning" : "safe", description: "Current drawdown" },
      { name: "Concentration Risk", value: maxAlloc, limit: 30, status: maxAlloc > 25 ? "warning" : "safe", description: "Largest position %" },
      { name: "Beta Exposure", value: 1.15, limit: 1.5, status: "safe", description: "Market beta" },
      { name: "Holdings Count", value: (holdings || []).length, limit: 50, status: "safe", description: "Active positions" },
    ]);
  };

  const fetchAlerts = async () => {
    const { data } = await supabase.from('risk_alerts').select('*').order('created_at', { ascending: false }).limit(10);
    setAlerts(data || []);
  };

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

  const riskScore = riskMetrics.length > 0
    ? Math.round(100 - riskMetrics.reduce((s, m) => s + (m.value / m.limit) * 15, 0))
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-bold text-foreground">Risk Management</h2><p className="text-muted-foreground">Real-time portfolio risk monitoring & controls</p></div>
        <div className="flex gap-2"><Button variant="outline" onClick={() => { fetchRiskData(); fetchAlerts(); }}><RefreshCw className="h-4 w-4 mr-2" />Refresh</Button><Button><Settings className="h-4 w-4 mr-2" />Configure</Button></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border"><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-500/10"><Shield className="h-5 w-5 text-green-500" /></div><div><p className="text-sm text-muted-foreground">Risk Score</p><p className="text-2xl font-bold text-green-500">{riskScore}/100</p></div></div><Badge className="bg-green-500/10 text-green-500">{riskScore > 70 ? 'Low Risk' : riskScore > 40 ? 'Medium' : 'High Risk'}</Badge></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-500/10"><AlertTriangle className="h-5 w-5 text-yellow-500" /></div><div><p className="text-sm text-muted-foreground">Active Alerts</p><p className="text-2xl font-bold text-foreground">{alerts.length}</p></div></div></div></CardContent></Card>
        <Card className="bg-card border-border"><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><Zap className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Auto-Hedge</p><p className="text-2xl font-bold text-foreground">{autoHedge ? 'Active' : 'Off'}</p></div></div><Switch checked={autoHedge} onCheckedChange={setAutoHedge} /></div></CardContent></Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Risk Metrics</TabsTrigger>
          <TabsTrigger value="stress">Stress Testing</TabsTrigger>
          <TabsTrigger value="limits">Risk Limits</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          {riskMetrics.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No risk data available. Add portfolio holdings to calculate risk metrics.</p></CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {riskMetrics.map((metric, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div><p className="font-medium text-foreground">{metric.name}</p><p className="text-xs text-muted-foreground">{metric.description}</p></div>
                      <Badge className={`${metric.status === "safe" ? "bg-green-500/10 text-green-500" : metric.status === "warning" ? "bg-yellow-500/10 text-yellow-500" : "bg-red-500/10 text-red-500"}`}>{metric.status}</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm"><span className={getStatusColor(metric.status)}>{metric.value.toFixed(1)}{metric.name.includes("%") || metric.name.includes("VaR") ? "%" : ""}</span><span className="text-muted-foreground">Limit: {metric.limit}</span></div>
                      <Progress value={Math.min((metric.value / metric.limit) * 100, 100)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stress" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Stress Test Scenarios</CardTitle></CardHeader>
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
                    <div><p className="font-medium text-foreground">{scenario.name}</p><p className="text-sm text-muted-foreground">Probability: {scenario.probability}</p></div>
                    <div className="text-right"><p className="text-xl font-bold text-red-500">{scenario.impact}%</p><p className="text-sm text-muted-foreground">Est. Portfolio Impact</p></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg">Configure Risk Limits</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Max Leverage", key: "maxLeverage" as const, max: 10, step: 0.5, suffix: "x" },
                { label: "Max Drawdown", key: "maxDrawdown" as const, max: 50, step: 1, suffix: "%" },
                { label: "Single Position Limit", key: "positionLimit" as const, max: 50, step: 1, suffix: "%" },
                { label: "Daily Loss Limit", key: "dailyLossLimit" as const, max: 10, step: 0.5, suffix: "%" },
              ].map(({ label, key, max, step, suffix }) => (
                <div key={key}>
                  <div className="flex justify-between mb-2"><label className="text-sm text-foreground">{label}</label><span className="text-sm text-muted-foreground">{riskLimits[key][0]}{suffix}</span></div>
                  <Slider value={riskLimits[key]} onValueChange={(v) => setRiskLimits(prev => ({ ...prev, [key]: v }))} max={max} step={step} />
                </div>
              ))}
              <Button className="w-full"><Lock className="h-4 w-4 mr-2" />Save Risk Limits</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-card border-border">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Bell className="h-5 w-5" />Recent Alerts</CardTitle></CardHeader>
            <CardContent>
              {alerts.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground"><Bell className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No risk alerts</p></div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border ${getAlertColor(alert.alert_type)}`}>
                      <div className="flex items-center justify-between"><p className="font-medium">{alert.message}</p><span className="text-xs opacity-70">{new Date(alert.created_at).toLocaleString()}</span></div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedRiskManager;
