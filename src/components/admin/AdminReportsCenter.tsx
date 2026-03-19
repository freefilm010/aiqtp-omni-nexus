import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart3, Download, RefreshCw, Shield, Activity, Users,
  MessageSquare, DollarSign, AlertTriangle, CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminReportsCenter = () => {
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    totalRevenue: 0,
    totalStrategies: 0,
    totalSignals: 0,
    securityEvents: 0,
  });

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: convs },
        { data: revenue },
        { data: strategies },
        { data: signals },
        { data: secLogs },
        { data: autoLogs },
      ] = await Promise.all([
        supabase.from("chat_conversations").select("id, message_count"),
        supabase.from("platform_revenue").select("amount"),
        supabase.from("ai_strategies").select("id"),
        supabase.from("ai_signals").select("id").eq("is_active", true),
        supabase.from("security_audit_log").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("admin_automation_logs").select("*").order("created_at", { ascending: false }).limit(50),
      ]);

      setAuditLogs(secLogs || []);
      setAutomationLogs(autoLogs || []);
      setStats({
        totalUsers: 0,
        totalConversations: convs?.length || 0,
        totalMessages: (convs || []).reduce((s, c) => s + (c.message_count || 0), 0),
        totalRevenue: (revenue || []).reduce((s, r) => s + Number(r.amount), 0),
        totalStrategies: strategies?.length || 0,
        totalSignals: signals?.length || 0,
        securityEvents: secLogs?.length || 0,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (type: string) => {
    const data = type === "security" ? auditLogs : automationLogs;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${type} report exported`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Reports & Metrics
          </h1>
          <p className="text-muted-foreground">Platform-wide analytics, audit logs, and operational metrics</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Conversations", value: stats.totalConversations, icon: MessageSquare, color: "text-blue-500" },
          { label: "Messages", value: stats.totalMessages, icon: MessageSquare, color: "text-purple-500" },
          { label: "Revenue", value: `$${stats.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-500" },
          { label: "Strategies", value: stats.totalStrategies, icon: Activity, color: "text-amber-500" },
          { label: "Active Signals", value: stats.totalSignals, icon: Activity, color: "text-cyan-500" },
          { label: "Security Events", value: stats.securityEvents, icon: Shield, color: "text-red-500" },
          { label: "Automation Runs", value: automationLogs.length, icon: RefreshCw, color: "text-primary" },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-3 px-3">
              <kpi.icon className={`h-4 w-4 ${kpi.color} mb-1`} />
              <p className="text-lg font-bold">{kpi.value}</p>
              <p className="text-[10px] text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="security" className="space-y-4">
        <TabsList>
          <TabsTrigger value="security">Security Audit Log</TabsTrigger>
          <TabsTrigger value="automation">Automation Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="security">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Security Audit Log</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportReport("security")}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No security events recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium text-sm">{log.event_type}</TableCell>
                          <TableCell>
                            <Badge variant={
                              log.severity === "critical" ? "destructive" :
                              log.severity === "high" ? "destructive" :
                              log.severity === "warning" ? "default" : "secondary"
                            }>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {log.user_id?.slice(0, 8) || "system"}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate">
                            {typeof log.details === "object" ? JSON.stringify(log.details) : log.details}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm">Automation Logs</CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportReport("automation")}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Error</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {automationLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No automation logs recorded
                        </TableCell>
                      </TableRow>
                    ) : (
                      automationLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="font-medium text-sm">{log.automation_type}</TableCell>
                          <TableCell className="text-sm">{log.action}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === "success" ? "default" : "destructive"}>
                              {log.status === "success" ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              )}
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-destructive max-w-[200px] truncate">
                            {log.error_message || "—"}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {new Date(log.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminReportsCenter;
