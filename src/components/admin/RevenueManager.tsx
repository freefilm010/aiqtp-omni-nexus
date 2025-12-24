import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Download,
  RefreshCw,
  Settings,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { revenueStreams, RevenueStream } from "@/lib/payments/mockProcessors";
import { toast } from "sonner";

const RevenueManager = () => {
  const [streams, setStreams] = useState<RevenueStream[]>(revenueStreams);
  const [distribution, setDistribution] = useState({
    reinvest: 60,
    reserve: 25,
    withdraw: 15
  });

  const toggleStream = (id: string) => {
    setStreams(prev =>
      prev.map(s =>
        s.id === id ? { ...s, isEnabled: !s.isEnabled } : s
      )
    );
    toast.success("Revenue stream updated");
  };

  const totalMonthlyRevenue = streams
    .filter(s => s.isEnabled)
    .reduce((acc, s) => acc + (s.type === 'subscription' || s.type === 'api' || s.type === 'premium' ? s.rate * 100 : s.rate * 50000), 0);

  const recentTransactions = [
    { id: 1, source: "Premium Subscription", amount: 29.99, status: "completed", date: "2024-01-15" },
    { id: 2, source: "Trading Commission", amount: 145.50, status: "completed", date: "2024-01-15" },
    { id: 3, source: "API Access", amount: 99.99, status: "completed", date: "2024-01-14" },
    { id: 4, source: "Spread Fees", amount: 234.80, status: "completed", date: "2024-01-14" },
    { id: 5, source: "Premium Signals", amount: 49.99, status: "pending", date: "2024-01-14" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenue Management</h1>
          <p className="text-muted-foreground">
            Configure and monitor all revenue streams
          </p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalMonthlyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {streams.filter(s => s.isEnabled).length} active streams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Auto-Reinvested
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              ${(totalMonthlyRevenue * distribution.reinvest / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {distribution.reinvest}% of revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available to Withdraw
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${(totalMonthlyRevenue * distribution.withdraw / 100).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {distribution.withdraw}% of revenue
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="streams" className="space-y-4">
        <TabsList>
          <TabsTrigger value="streams">Revenue Streams</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="streams">
          <Card>
            <CardHeader>
              <CardTitle>Configure Revenue Streams</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {streams.map((stream) => (
                <div
                  key={stream.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={stream.isEnabled}
                      onCheckedChange={() => toggleStream(stream.id)}
                    />
                    <div>
                      <h4 className="font-medium">{stream.name}</h4>
                      <p className="text-sm text-muted-foreground">{stream.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={stream.isEnabled ? "default" : "secondary"}>
                      {stream.type}
                    </Badge>
                    <p className="text-sm font-medium mt-1">
                      {stream.type === 'commission' || stream.type === 'spread'
                        ? `${stream.rate}%`
                        : `$${stream.rate}/mo`}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
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
              <Button onClick={() => toast.success("Distribution settings saved")}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Distribution
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Source</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentTransactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.source}</TableCell>
                      <TableCell>${tx.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={tx.status === 'completed' ? 'default' : 'secondary'}>
                          {tx.status === 'completed' ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                          )}
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default RevenueManager;
