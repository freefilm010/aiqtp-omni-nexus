import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  CheckCircle,
  Wallet,
  Loader2
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const RevenueManager = () => {
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState({
    reinvest: 60,
    reserve: 25,
    withdraw: 15
  });

  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingRevenue: 0,
    distributedRevenue: 0,
    revenueCount: 0,
  });

  const [transactions, setTransactions] = useState<any[]>([]);
  const [distributionLogs, setDistributionLogs] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch platform_revenue
      const { data: revenueData } = await supabase
        .from("platform_revenue")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      // Fetch profit distribution logs
      const { data: distLogs } = await supabase
        .from("profit_distribution_log")
        .select("*")
        .order("executed_at", { ascending: false })
        .limit(50);

      // Fetch distribution rules for current split (table may not exist yet)
      let rules: { distribution_type: string; percentage: number }[] | null = null;
      try {
        const { data: rulesData, error: rulesError } = await supabase
          .from("profit_distribution_rules")
          .select("*")
          .eq("is_active", true);
        if (rulesError) console.warn("profit_distribution_rules unavailable:", rulesError.message);
        else rules = rulesData;
      } catch (e) {
        console.warn("profit_distribution_rules query failed:", e);
      }

      // Populate distribution state from DB rules
      if (rules && rules.length > 0) {
        const find = (type: string) =>
          rules!.find((r) => r.distribution_type === type)?.percentage ?? 0;
        setDistribution({
          reinvest: Number(find("reinvest")),
          reserve: Number(find("reserve")),
          withdraw: Number(find("withdraw")),
        });
      }

      const rows = revenueData ?? [];
      const totalRevenue = rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const pendingRevenue = rows
        .filter((r) => r.status === "pending")
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const distributedRevenue = (distLogs ?? [])
        .filter((d) => d.status === "completed")
        .reduce((sum, d) => sum + Number(d.amount || 0), 0);

      setStats({
        totalRevenue,
        pendingRevenue,
        distributedRevenue,
        revenueCount: rows.length,
      });

      setTransactions(rows);
      setDistributionLogs(distLogs ?? []);
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      toast.error("Failed to load revenue data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveDistribution = async () => {
    const total = distribution.reinvest + distribution.reserve + distribution.withdraw;
    if (total !== 100) {
      toast.error(`Percentages must sum to 100 (currently ${total})`);
      return;
    }
    const rules = (["reinvest", "reserve", "withdraw"] as const).map((type) => ({
      rule_name: `default_${type}`,
      source_type: "all",
      distribution_type: type,
      percentage: distribution[type],
      is_active: true,
      execution_frequency: "immediate",
    }));
    try {
      const upserts = await Promise.all(
        rules.map((rule) =>
          supabase
            .from("profit_distribution_rules")
            .upsert(rule, { onConflict: "rule_name" })
        )
      );
      const failed = upserts.filter((r) => r.error);
      if (failed.length > 0) {
        toast.error("Failed to save some rules", { description: failed[0].error?.message });
      } else {
        toast.success("Distribution settings saved");
      }
    } catch (e) {
      console.warn("handleSaveDistribution failed:", e);
      toast.error("Failed to save distribution settings");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Management</h1>
          <p className="text-muted-foreground">
            Configure and monitor all revenue streams
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.revenueCount} payments recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Distributed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${stats.distributedRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Via profit distribution rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${stats.pendingRevenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting distribution
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No revenue recorded yet</p>
                  <p className="text-sm">Revenue will appear here when payments are processed</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">
                          {tx.source_category || tx.source_type || "—"}
                        </TableCell>
                        <TableCell>${Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                        <TableCell>{tx.currency || "USD"}</TableCell>
                        <TableCell>
                          <Badge variant={tx.status === "distributed" ? "default" : "secondary"}>
                            {tx.status === "distributed" ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            ) : (
                              <RefreshCw className="h-3 w-3 mr-1" />
                            )}
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Distribution Log</CardTitle>
            </CardHeader>
            <CardContent>
              {distributionLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No distributions yet</p>
                  <p className="text-sm">Distributions will appear when revenue is processed through rules</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Amount</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributionLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-medium">
                          ${Number(log.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>{log.currency || "USD"}</TableCell>
                        <TableCell>
                          <Badge variant={log.status === "completed" ? "default" : "secondary"}>
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {log.executed_at ? new Date(log.executed_at).toLocaleDateString() : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Distribution Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reinvest %</label>
                  <Input
                    type="number"
                    value={distribution.reinvest}
                    onChange={(e) => setDistribution(prev => ({ ...prev, reinvest: Number(e.target.value) }))}
                    max={100}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Auto-invested into portfolio</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reserve %</label>
                  <Input
                    type="number"
                    value={distribution.reserve}
                    onChange={(e) => setDistribution(prev => ({ ...prev, reserve: Number(e.target.value) }))}
                    max={100}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Emergency & operations fund</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Withdraw %</label>
                  <Input
                    type="number"
                    value={distribution.withdraw}
                    onChange={(e) => setDistribution(prev => ({ ...prev, withdraw: Number(e.target.value) }))}
                    max={100}
                    min={0}
                  />
                  <p className="text-xs text-muted-foreground">Available for admin withdrawal</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total: {distribution.reinvest + distribution.reserve + distribution.withdraw}% (must equal 100)
              </p>
              <Button onClick={handleSaveDistribution}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Distribution
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManager;
