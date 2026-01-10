import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Settings,
  Zap,
  PieChart,
  ArrowUpRight,
  AlertCircle
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from "recharts";
import { toast } from "sonner";

interface InvestmentAllocation {
  id: string;
  asset: string;
  symbol: string;
  type: 'stable' | 'growth';
  targetPercent: number;
  currentPercent: number;
  value: number;
  pnlPercent: number;
}

interface PerformanceMetric {
  label: string;
  value: string;
  positive: boolean | null;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

const InvestmentManager = () => {
  const [allocations, setAllocations] = useState<InvestmentAllocation[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRebalance, setAutoRebalance] = useState(true);
  const [rebalanceThreshold, setRebalanceThreshold] = useState([5]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch portfolio allocations
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('investment_portfolio')
        .select('*')
        .order('target_percent', { ascending: false });

      if (portfolioError) throw portfolioError;

      const mappedAllocations: InvestmentAllocation[] = (portfolioData || []).map(p => ({
        id: p.id,
        asset: p.asset_name,
        symbol: p.symbol,
        type: p.asset_type as 'stable' | 'growth',
        targetPercent: Number(p.target_percent) || 0,
        currentPercent: Number(p.current_percent) || 0,
        value: Number(p.value_usd) || 0,
        pnlPercent: Number(p.pnl_percent) || 0
      }));

      setAllocations(mappedAllocations);

      // Fetch performance metrics
      const { data: metricsData, error: metricsError } = await supabase
        .from('portfolio_performance')
        .select('*');

      if (metricsError) throw metricsError;

      const mappedMetrics: PerformanceMetric[] = (metricsData || []).map(m => ({
        label: m.metric_name,
        value: String(m.metric_value),
        positive: m.is_positive
      }));

      setPerformanceMetrics(mappedMetrics);
    } catch (err: any) {
      console.error('Error fetching investment data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalValue = allocations.reduce((acc, a) => acc + a.value, 0);
  const stableValue = allocations.filter(a => a.type === 'stable').reduce((acc, a) => acc + a.value, 0);
  const growthValue = allocations.filter(a => a.type === 'growth').reduce((acc, a) => acc + a.value, 0);
  const totalPnl = allocations.reduce((acc, a) => acc + (a.value * a.pnlPercent / 100), 0);
  const totalPnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

  const pieData = allocations.map(a => ({
    name: a.symbol,
    value: a.value
  }));

  const handleRebalance = async () => {
    // In real implementation, this would call an API to rebalance
    toast.success("Rebalance request submitted");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 gap-2 text-destructive">
        <AlertCircle className="h-5 w-5" />
        <span>Error loading investment data</span>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Investment Portfolio</h1>
            <p className="text-muted-foreground">
              Aggressive Strategy: 30% Stable / 70% Growth
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No Portfolio Configured</p>
            <p className="text-sm">Investment allocations will appear here when configured by administrators.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Investment Portfolio</h1>
          <p className="text-muted-foreground">
            Aggressive Strategy: 30% Stable / 70% Growth
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRebalance}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Rebalance Now
          </Button>
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Add Funds
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Portfolio Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <div className={`flex items-center text-xs mt-1 ${totalPnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              <ArrowUpRight className="h-3 w-3 mr-1" />
              {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(1)}% All Time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Stable Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stableValue.toLocaleString()}</div>
            <Progress value={totalValue > 0 ? (stableValue / totalValue) * 100 : 0} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalValue > 0 ? ((stableValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Growth Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">${growthValue.toLocaleString()}</div>
            <Progress value={totalValue > 0 ? (growthValue / totalValue) * 100 : 0} className="h-2 mt-2 [&>div]:bg-green-500" />
            <p className="text-xs text-muted-foreground mt-1">
              {totalValue > 0 ? ((growthValue / totalValue) * 100).toFixed(1) : 0}% of portfolio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              24h Change
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
            <div className={`flex items-center text-xs mt-1 ${totalPnlPercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {totalPnlPercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {totalPnlPercent >= 0 ? '+' : ''}{totalPnlPercent.toFixed(1)}% Today
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocation">Allocation</TabsTrigger>
          <TabsTrigger value="automation">Automation</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="allocation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => `$${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Asset Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {allocations.map((allocation, i) => (
                  <div key={allocation.id} className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{allocation.asset}</span>
                        <span className="font-medium">${allocation.value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Target: {allocation.targetPercent}%</span>
                        <Badge variant={allocation.type === 'stable' ? 'secondary' : 'default'}>
                          {allocation.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader>
              <CardTitle>Investment Automation Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Auto-Rebalancing</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically rebalance when allocation drifts from target
                  </p>
                </div>
                <Switch checked={autoRebalance} onCheckedChange={setAutoRebalance} />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-medium">Rebalance Threshold</label>
                  <span className="text-muted-foreground">{rebalanceThreshold[0]}% deviation</span>
                </div>
                <Slider
                  value={rebalanceThreshold}
                  onValueChange={setRebalanceThreshold}
                  min={1}
                  max={20}
                  step={1}
                  disabled={!autoRebalance}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Auto-Compound</h4>
                  <p className="text-sm text-muted-foreground">
                    Automatically reinvest dividends and yields
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <h4 className="font-medium">Dollar-Cost Averaging</h4>
                  <p className="text-sm text-muted-foreground">
                    Spread new investments over time
                  </p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button onClick={() => toast.success("Automation settings saved")}>
                <Zap className="h-4 w-4 mr-2" />
                Save Automation Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {performanceMetrics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No performance metrics available yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {performanceMetrics.map((metric, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">{metric.label}</p>
                      <p className={`text-xl font-bold ${
                        metric.positive === true ? 'text-green-500' :
                        metric.positive === false ? 'text-red-500' : ''
                      }`}>
                        {metric.value}
                      </p>
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

export default InvestmentManager;