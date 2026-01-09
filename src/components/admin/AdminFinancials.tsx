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

// Financial metrics data
const revenueBySource = [
  { name: "Strategy Rentals", value: 45200, color: "#8b5cf6" },
  { name: "Trading Fees", value: 28500, color: "#22c55e" },
  { name: "Subscriptions", value: 18900, color: "#3b82f6" },
  { name: "IP Licensing", value: 12400, color: "#f59e0b" },
  { name: "Quantum API", value: 8200, color: "#ec4899" },
];

const monthlyFinancials = [
  { month: "Jan", revenue: 42500, expenses: 18200, profit: 24300 },
  { month: "Feb", revenue: 48200, expenses: 19500, profit: 28700 },
  { month: "Mar", revenue: 55800, expenses: 21000, profit: 34800 },
  { month: "Apr", revenue: 62100, expenses: 22800, profit: 39300 },
  { month: "May", revenue: 71500, expenses: 25200, profit: 46300 },
  { month: "Jun", revenue: 85200, expenses: 28500, profit: 56700 },
];

const taxRates = [
  { jurisdiction: "Federal", corporateRate: "21.0%", personalRate: "37.0%", salesTax: "N/A" },
  { jurisdiction: "Virginia", corporateRate: "6.0%", personalRate: "5.75%", salesTax: "6.0%" },
  { jurisdiction: "Fairfax County", corporateRate: "6.0%", personalRate: "5.75%", salesTax: "6.0%" },
];

const capitalInvestments = [
  { company: "AIQTP Platform", stage: "Growth", amount: "$2.5M", status: "Active" },
  { company: "Quantum Research Lab", stage: "Seed", amount: "$500K", status: "Active" },
  { company: "DeFi Protocol", stage: "Early", amount: "$1.2M", status: "Pending" },
  { company: "AI Trading Bot", stage: "Accelerator", amount: "$150K", status: "Completed" },
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
  const [financialStats, setFinancialStats] = useState({
    totalRevenue: 365300,
    totalExpenses: 135200,
    netProfit: 230100,
    profitMargin: 63.0,
    monthlyGrowth: 19.3,
    yoyGrowth: 142.5,
    totalAssets: 2850000,
    totalLiabilities: 420000,
  });

  const refreshData = async () => {
    setIsLoading(true);
    try {
      // Fetch real data from Supabase
      const { data: revenueData, error } = await supabase
        .from('platform_revenue')
        .select('amount, source_type, created_at')
        .order('created_at', { ascending: false });

      if (!error && revenueData) {
        const totalRev = revenueData.reduce((sum, r) => sum + Number(r.amount), 0);
        if (totalRev > 0) {
          setFinancialStats(prev => ({
            ...prev,
            totalRevenue: totalRev,
            netProfit: totalRev * 0.63,
          }));
        }
      }
      toast.success("Financial data refreshed");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="flex items-center text-xs text-green-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{financialStats.monthlyGrowth}% this month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-red-500" />
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              ${financialStats.totalExpenses.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-red-400 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -5.2% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Net Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-500">
              ${financialStats.netProfit.toLocaleString()}
            </div>
            <div className="flex items-center text-xs text-purple-400 mt-1">
              {financialStats.profitMargin}% margin
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-blue-500" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              ${(financialStats.totalAssets / 1000000).toFixed(2)}M
            </div>
            <div className="flex items-center text-xs text-blue-400 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +{financialStats.yoyGrowth}% YoY
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
                  Profit & Loss (6 Months)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyFinancials}>
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
                    <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Net Profit" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                    />
                  </RePieChart>
                </ResponsiveContainer>
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
                  <p className="text-sm text-muted-foreground">Gross Margin</p>
                  <p className="text-2xl font-bold">72.4%</p>
                  <Progress value={72.4} className="h-2 mt-2" />
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Operating Margin</p>
                  <p className="text-2xl font-bold">63.0%</p>
                  <Progress value={63} className="h-2 mt-2" />
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">EBITDA</p>
                  <p className="text-2xl font-bold">$248K</p>
                  <Badge variant="outline" className="mt-2 text-green-500">+24% QoQ</Badge>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Cash Flow</p>
                  <p className="text-2xl font-bold">$185K</p>
                  <Badge variant="outline" className="mt-2 text-green-500">Positive</Badge>
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
                <AreaChart data={monthlyFinancials}>
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
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#8b5cf6" 
                    fill="#8b5cf6" 
                    fillOpacity={0.2}
                    name="Profit"
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
                        {((source.value / revenueBySource.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-green-500">
                          <ArrowUpRight className="h-3 w-3 mr-1" />
                          +{(10 + Math.random() * 20).toFixed(1)}%
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
                Capital Investments
              </CardTitle>
              <CardDescription>
                Based on Fairfax County Q1 2025 capital investment data model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company/Project</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Investment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {capitalInvestments.map((inv, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{inv.company}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{inv.stage}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{inv.amount}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={inv.status === 'Active' ? 'default' : inv.status === 'Completed' ? 'outline' : 'secondary'}
                          className={inv.status === 'Active' ? 'bg-green-500' : ''}
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Funding by Stage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { stage: "Seed", amount: "$92.9M", percent: 11 },
                  { stage: "Early", amount: "$221.2M", percent: 25 },
                  { stage: "Later", amount: "$331.8M", percent: 38 },
                  { stage: "Growth", amount: "$226M", percent: 26 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.stage}</span>
                      <span className="font-medium">{item.amount}</span>
                    </div>
                    <Progress value={item.percent} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Investment Highlights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-primary">$872M</p>
                  <p className="text-muted-foreground text-sm">Total (4 Quarters)</p>
                </div>
                <div className="text-center pb-2">
                  <p className="text-2xl font-bold">89</p>
                  <p className="text-muted-foreground text-sm">Deals Closed</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Q1 2025 Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-4xl font-bold text-green-500">$113M</p>
                  <p className="text-muted-foreground text-sm">Capital Investment</p>
                </div>
                <div className="text-center pb-2">
                  <p className="text-2xl font-bold">22</p>
                  <p className="text-muted-foreground text-sm">Companies Funded</p>
                </div>
              </CardContent>
            </Card>
          </div>
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
