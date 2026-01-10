import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,
  FileText,
  Download,
  Filter,
  RefreshCw,
  Wallet,
  CreditCard,
  Coins,
  Building2,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  ExternalLink
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// NOTE: No placeholder/demo financial numbers.
// These datasets are computed from the backend (platform_revenue) at runtime.

type RevenueBySourceItem = { name: string; value: number; color: string };
type MonthlyRevenueRow = { month: string; revenue: number };

const REVENUE_SOURCE_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

const taxRates = [
  { jurisdiction: "Federal", corporateRate: "21.0%", personalRate: "37.0%", salesTax: "N/A" },
  { jurisdiction: "Virginia", corporateRate: "6.0%", personalRate: "5.75%", salesTax: "6.0%" },
  { jurisdiction: "Fairfax County", corporateRate: "6.0%", personalRate: "5.75%", salesTax: "6.0%" },
];

const financialDocuments = [
  { name: "Capital Investment Q1 2025", file: "/documents/CapInvestment2025Q1.pdf", type: "Report" },
  { name: "Economics Cheat Sheet", file: "/documents/Economics_Cheat_Sheet.pdf", type: "Reference" },
  { name: "EQPM & Analyst Guide", file: "/documents/EQPM_and_Analyst_Cheat_Sheet.pdf", type: "Reference" },
  { name: "IRS & Structured Notes", file: "/documents/IRS_and_Structured_Notes_Cheat_Sheet.pdf", type: "Reference" },
  { name: "FX Market Tools", file: "/documents/Tools_for_FX_Market_Cheat_Sheet.pdf", type: "Reference" },
  { name: "Future of Digital Money", file: "/documents/future-of-digital-money.pdf", type: "Research" },
];


const AdminFinancials = () => {
  const [isLoading, setIsLoading] = useState(false);

  const [financialStats, setFinancialStats] = useState<{
    totalRevenue: number;
    revenueCount: number;
    pendingRevenue: number;
    lastRevenueAt: string | null;
  }>({
    totalRevenue: 0,
    revenueCount: 0,
    pendingRevenue: 0,
    lastRevenueAt: null,
  });

  const [revenueBySource, setRevenueBySource] = useState<RevenueBySourceItem[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenueRow[]>([]);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      const { data: revenueData, error } = await supabase
        .from("platform_revenue")
        .select("amount, source_type, status, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const rows = revenueData ?? [];
      const totalRevenue = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const pendingRevenue = rows
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);

      const bySource = new Map<string, number>();
      for (const r of rows) {
        const key = (r.source_type || "unknown").toString();
        bySource.set(key, (bySource.get(key) || 0) + Number(r.amount || 0));
      }

      const sourceItems: RevenueBySourceItem[] = Array.from(bySource.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([name, value], i) => ({
          name,
          value,
          color: REVENUE_SOURCE_COLORS[i % REVENUE_SOURCE_COLORS.length],
        }));

      // Build last 6 months revenue series
      const now = new Date();
      const monthKeys = Array.from({ length: 6 }).map((_, idx) => {
        const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleString(undefined, { month: "short" });
        return { key, label };
      });

      const byMonth = new Map<string, number>(monthKeys.map((m) => [m.key, 0]));
      for (const r of rows) {
        const dt = new Date(r.created_at);
        const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
        if (byMonth.has(key)) {
          byMonth.set(key, (byMonth.get(key) || 0) + Number(r.amount || 0));
        }
      }

      const monthSeries: MonthlyRevenueRow[] = monthKeys.map((m) => ({
        month: m.label,
        revenue: byMonth.get(m.key) || 0,
      }));

      setRevenueBySource(sourceItems);
      setMonthlyRevenue(monthSeries);
      setFinancialStats({
        totalRevenue,
        revenueCount: rows.length,
        pendingRevenue,
        lastRevenueAt: rows[0]?.created_at ?? null,
      });

      toast.success("Financial data refreshed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to refresh financial data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Financial Dashboard</h1>
          <p className="text-muted-foreground">
            Complete financial overview, metrics, tax rates, and documentation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              ${financialStats.totalRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{financialStats.revenueCount} payments recorded</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              Pending Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              ${financialStats.pendingRevenue.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Awaiting settlement</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-500" />
              Last Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">{
              financialStats.lastRevenueAt
                ? new Date(financialStats.lastRevenueAt).toLocaleDateString()
                : "—"
            }</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>{financialStats.lastRevenueAt ? "Latest recorded" : "No payments yet"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-500" />
              Expense Ledger
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">—</div>
            <div className="flex items-center text-xs text-muted-foreground mt-1">
              <span>Not configured</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="investments">Investments</TabsTrigger>
          <TabsTrigger value="taxes">Taxes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Revenue (Last 6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Revenue" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {monthlyRevenue.every((r) => r.revenue === 0) && (
                  <p className="text-sm text-muted-foreground mt-3">No revenue recorded yet.</p>
                )}
              </CardContent>
            </Card>

            {/* Revenue Distribution Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Revenue by Source
                </CardTitle>
              </CardHeader>
              <CardContent>
                {revenueBySource.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No revenue recorded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RePieChart>
                      <Pie
                        data={revenueBySource}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {revenueBySource.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    </RePieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Payments</p>
                  <p className="text-2xl font-bold">{financialStats.revenueCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">${financialStats.pendingRevenue.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Average</p>
                  <p className="text-2xl font-bold">
                    ${
                      (financialStats.revenueCount ? (financialStats.totalRevenue / financialStats.revenueCount) : 0).toLocaleString(
                        undefined,
                        { maximumFractionDigits: 2 }
                      )
                    }
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Last Payment</p>
                  <p className="text-2xl font-bold">
                    {financialStats.lastRevenueAt ? new Date(financialStats.lastRevenueAt).toLocaleDateString() : "—"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.2}
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown by Source</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>% of Total</TableHead>
                    <TableHead>Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueBySource.map((source, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }} />
                          {source.name}
                        </div>
                      </TableCell>
                      <TableCell>${source.value.toLocaleString()}</TableCell>
                      <TableCell>
                        {(
                          (source.value / (revenueBySource.reduce((a, b) => a + b.value, 0) || 1)) *
                          100
                        ).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-muted-foreground">
                          —
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Investments
              </CardTitle>
              <CardDescription>
                No placeholder investment figures are shown. Connect an investment ledger to display real allocations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  No investment data is configured yet.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="taxes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Tax Rate Comparison (Regional)
              </CardTitle>
              <CardDescription>
                Based on Virginia/Fairfax County Business Taxes 2025-2026
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jurisdiction</TableHead>
                    <TableHead>Corporate Income</TableHead>
                    <TableHead>Personal Income</TableHead>
                    <TableHead>Sales Tax</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {taxRates.map((rate, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{rate.jurisdiction}</TableCell>
                      <TableCell>{rate.corporateRate}</TableCell>
                      <TableCell>{rate.personalRate}</TableCell>
                      <TableCell>{rate.salesTax}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Property Tax Rates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Residential Real Property</span>
                  <Badge>$1.125 per $100</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Commercial Real Property</span>
                  <Badge>$1.250 per $100</Badge>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span>Business Personal Property</span>
                  <Badge>$4.57 per $100</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Available Tax Credits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  "Major Business Facility Job Tax Credit",
                  "R&D Expenses Tax Credit",
                  "Data Center Sales Tax Exemption",
                  "Green Job Creation Tax Credit",
                  "Worker Training Tax Credit",
                ].map((credit, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 rounded bg-green-500/10 text-green-500 text-sm">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {credit}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Financial Documents Library
              </CardTitle>
              <CardDescription>
                Reference materials, reports, and cheat sheets for financial analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {financialDocuments.map((doc, i) => (
                  <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{doc.name}</p>
                          <Badge variant="secondary" className="mt-1 text-xs">{doc.type}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(doc.file, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = doc.file;
                            link.download = doc.name + '.pdf';
                            link.click();
                          }}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminFinancials;
