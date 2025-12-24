import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  DollarSign,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Shield
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";

// Mock data for demonstration
const revenueData = [
  { date: "Jan", revenue: 12500, investments: 8500 },
  { date: "Feb", revenue: 15200, investments: 12000 },
  { date: "Mar", revenue: 18900, investments: 15500 },
  { date: "Apr", revenue: 22100, investments: 19200 },
  { date: "May", revenue: 28500, investments: 24800 },
  { date: "Jun", revenue: 35200, investments: 31500 },
];

const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalRevenue: 132400,
    monthlyGrowth: 23.5,
    totalInvestments: 111500,
    investmentReturn: 18.2,
    activeUsers: 2847,
    userGrowth: 12.8,
    automationsRunning: 24,
    securityScore: 94
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, Founder. Here's your platform overview.
          </p>
        </div>
        <Badge variant="outline" className="text-green-500 border-green-500">
          <Zap className="h-3 w-3 mr-1" /> All Systems Operational
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{stats.monthlyGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Investment Portfolio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalInvestments.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{stats.investmentReturn}% ROI
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{stats.userGrowth}% this week
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Security Score
            </CardTitle>
            <Shield className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securityScore}/100</div>
            <Progress value={stats.securityScore} className="h-2 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue & Investment Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.3}
                  name="Revenue"
                />
                <Area
                  type="monotone"
                  dataKey="investments"
                  stackId="2"
                  stroke="hsl(142, 76%, 36%)"
                  fill="hsl(142, 76%, 36%)"
                  fillOpacity={0.3}
                  name="Investments"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Investment Allocation (Aggressive 30/70)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Stable Assets (30%)</span>
                <span className="text-sm font-medium">$33,450</span>
              </div>
              <Progress value={30} className="h-3" />
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                <Badge variant="secondary">USDC 15%</Badge>
                <Badge variant="secondary">TLT 10%</Badge>
                <Badge variant="secondary">DAI 5%</Badge>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Growth Assets (70%)</span>
                <span className="text-sm font-medium">$78,050</span>
              </div>
              <Progress value={70} className="h-3 [&>div]:bg-green-500" />
              <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                <Badge variant="secondary">BTC 25%</Badge>
                <Badge variant="secondary">ETH 20%</Badge>
                <Badge variant="secondary">SPY 15%</Badge>
                <Badge variant="secondary">QQQ 10%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Active Automations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: "Revenue Collection", status: "active", lastRun: "2m ago" },
              { name: "Auto-Reinvestment", status: "active", lastRun: "15m ago" },
              { name: "Portfolio Rebalance", status: "scheduled", lastRun: "2h ago" },
              { name: "Security Scan", status: "active", lastRun: "5m ago" }
            ].map((automation, i) => (
              <div key={i} className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`h-2 w-2 rounded-full ${
                    automation.status === 'active' ? 'bg-green-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-sm font-medium">{automation.name}</span>
                </div>
                <p className="text-xs text-muted-foreground">Last run: {automation.lastRun}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;
