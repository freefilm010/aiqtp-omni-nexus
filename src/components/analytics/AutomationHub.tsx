import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Workflow, 
  Play, 
  Pause, 
  Plus,
  Settings,
  Clock,
  Zap,
  Bell,
  GitBranch,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Copy,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  status: "active" | "paused" | "error";
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  successRate: number;
}

interface ScheduledTask {
  id: string;
  name: string;
  schedule: string;
  nextRun: Date;
  status: "pending" | "running" | "completed" | "failed";
}

interface ExecutionLog {
  id: string;
  automationName: string;
  timestamp: Date;
  status: "success" | "error" | "warning";
  message: string;
  duration: number;
}

const AutomationHub = () => {
  const { toast } = useToast();

  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: "1",
      name: "Daily Portfolio Rebalance",
      description: "Automatically rebalances portfolio to target weights at market close",
      trigger: "Schedule: Daily 16:00 UTC",
      actions: ["Calculate drift", "Generate orders", "Execute trades", "Send report"],
      status: "active",
      lastRun: new Date(Date.now() - 86400000),
      nextRun: new Date(Date.now() + 28800000),
      runCount: 142,
      successRate: 98.5,
    },
    {
      id: "2",
      name: "Stop Loss Monitor",
      description: "Monitors positions and executes stop losses when triggered",
      trigger: "Real-time: Price Alert",
      actions: ["Check positions", "Evaluate stop levels", "Execute sell order"],
      status: "active",
      lastRun: new Date(Date.now() - 3600000),
      runCount: 892,
      successRate: 99.8,
    },
    {
      id: "3",
      name: "Signal-Based Entry",
      description: "Enters positions when ML model generates strong buy signals",
      trigger: "Signal: ML Confidence > 80%",
      actions: ["Validate signal", "Calculate position size", "Place order", "Set stops"],
      status: "paused",
      lastRun: new Date(Date.now() - 172800000),
      runCount: 56,
      successRate: 75.0,
    },
    {
      id: "4",
      name: "Weekly Performance Report",
      description: "Generates and emails weekly trading performance summary",
      trigger: "Schedule: Sunday 20:00 UTC",
      actions: ["Aggregate trades", "Calculate metrics", "Generate PDF", "Send email"],
      status: "active",
      lastRun: new Date(Date.now() - 604800000),
      nextRun: new Date(Date.now() + 432000000),
      runCount: 24,
      successRate: 100,
    },
  ]);

  const [scheduledTasks, setScheduledTasks] = useState<ScheduledTask[]>([
    { id: "1", name: "Model Retrain", schedule: "Weekly", nextRun: new Date(Date.now() + 259200000), status: "pending" },
    { id: "2", name: "Data Sync", schedule: "Hourly", nextRun: new Date(Date.now() + 1800000), status: "pending" },
    { id: "3", name: "Backup Strategy", schedule: "Daily", nextRun: new Date(Date.now() + 43200000), status: "pending" },
    { id: "4", name: "Clear Cache", schedule: "Every 4h", nextRun: new Date(Date.now() + 7200000), status: "running" },
  ]);

  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    { id: "1", automationName: "Stop Loss Monitor", timestamp: new Date(Date.now() - 60000), status: "success", message: "All positions checked - no stops triggered", duration: 0.8 },
    { id: "2", automationName: "Daily Portfolio Rebalance", timestamp: new Date(Date.now() - 3600000), status: "success", message: "Rebalanced 3 positions, total cost: $12.50", duration: 4.2 },
    { id: "3", automationName: "Signal-Based Entry", timestamp: new Date(Date.now() - 7200000), status: "warning", message: "Signal received but liquidity too low - skipped", duration: 1.5 },
    { id: "4", automationName: "Stop Loss Monitor", timestamp: new Date(Date.now() - 10800000), status: "success", message: "Executed stop loss for ETH position at $2,280", duration: 2.1 },
    { id: "5", automationName: "Data Sync", timestamp: new Date(Date.now() - 14400000), status: "error", message: "API timeout - retrying in 5 minutes", duration: 30.0 },
  ]);

  const toggleAutomation = (id: string) => {
    setAutomations(automations.map(a => 
      a.id === id ? { ...a, status: a.status === "active" ? "paused" : "active" } : a
    ));
    toast({
      title: "Automation Updated",
      description: `Automation ${automations.find(a => a.id === id)?.status === "active" ? "paused" : "activated"}`,
    });
  };

  const runAutomation = (id: string) => {
    const automation = automations.find(a => a.id === id);
    toast({
      title: "Running Automation",
      description: `Executing "${automation?.name}"...`,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
      case "success":
      case "completed": return "text-success";
      case "paused":
      case "pending": return "text-warning";
      case "error":
      case "failed": return "text-destructive";
      case "running": return "text-primary";
      default: return "text-muted-foreground";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
      case "success":
      case "completed": return "default";
      case "paused":
      case "pending":
      case "warning": return "secondary";
      case "error":
      case "failed": return "destructive";
      case "running": return "outline";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-success" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Active</p>
                <p className="text-lg sm:text-2xl font-bold">{automations.filter(a => a.status === "active").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
                <Zap className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Executions</p>
                <p className="text-lg sm:text-2xl font-bold">47</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-accent/10 rounded-lg">
                <Clock className="h-4 w-4 sm:h-6 sm:w-6 text-accent" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Scheduled</p>
                <p className="text-lg sm:text-2xl font-bold">{scheduledTasks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gold/10 rounded-lg">
                <AlertTriangle className="h-4 w-4 sm:h-6 sm:w-6 text-gold" />
              </div>
              <div>
                <p className="text-[10px] sm:text-sm text-muted-foreground">Errors</p>
                <p className="text-lg sm:text-2xl font-bold">2</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="automations" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full h-auto p-1">
          <TabsTrigger value="automations" className="text-[9px] sm:text-sm py-1.5">Auto</TabsTrigger>
          <TabsTrigger value="scheduler" className="text-[9px] sm:text-sm py-1.5">Schedule</TabsTrigger>
          <TabsTrigger value="logs" className="text-[9px] sm:text-sm py-1.5">Logs</TabsTrigger>
          <TabsTrigger value="builder" className="text-[9px] sm:text-sm py-1.5">Builder</TabsTrigger>
        </TabsList>

        {/* Automations Tab */}
        <TabsContent value="automations" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Trading Automations</h3>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Automation
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {automations.map((automation) => (
              <Card key={automation.id} className="hover:shadow-md transition-all">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold flex items-center gap-2">
                        <Workflow className="h-4 w-4" />
                        {automation.name}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{automation.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={automation.status === "active"}
                        onCheckedChange={() => toggleAutomation(automation.id)}
                      />
                      <Badge variant={getStatusBadge(automation.status)}>
                        {automation.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Trigger:</span>
                      <span>{automation.trigger}</span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {automation.actions.map((action, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm pt-2 border-t">
                      <div>
                        <p className="text-muted-foreground">Runs</p>
                        <p className="font-mono font-bold">{automation.runCount}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className={`font-mono font-bold ${automation.successRate > 95 ? 'text-success' : automation.successRate > 80 ? 'text-warning' : 'text-destructive'}`}>
                          {automation.successRate}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Run</p>
                        <p className="font-mono text-xs">
                          {automation.lastRun ? automation.lastRun.toLocaleString() : "Never"}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => runAutomation(automation.id)}>
                        <Play className="h-3 w-3 mr-1" />
                        Run Now
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Scheduler Tab */}
        <TabsContent value="scheduler">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Tasks
              </CardTitle>
              <CardDescription>Upcoming automated tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {scheduledTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${task.status === "running" ? 'bg-primary/10' : 'bg-secondary'}`}>
                        {task.status === "running" ? (
                          <RefreshCw className="h-5 w-5 text-primary animate-spin" />
                        ) : (
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold">{task.name}</h4>
                        <p className="text-sm text-muted-foreground">{task.schedule}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Next Run</p>
                        <p className="font-mono text-sm">{task.nextRun.toLocaleString()}</p>
                      </div>
                      <Badge variant={getStatusBadge(task.status)}>{task.status}</Badge>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>Recent automation runs and their outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {executionLogs.map((log) => (
                    <div key={log.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-secondary/30">
                      <div className={`p-1.5 rounded-full ${
                        log.status === "success" ? 'bg-success/10' : 
                        log.status === "error" ? 'bg-destructive/10' : 'bg-warning/10'
                      }`}>
                        {log.status === "success" ? (
                          <CheckCircle className="h-4 w-4 text-success" />
                        ) : log.status === "error" ? (
                          <XCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-warning" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{log.automationName}</span>
                          <Badge variant={getStatusBadge(log.status)} className="text-xs">
                            {log.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{log.message}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono">{log.duration}s</p>
                        <p className="text-xs text-muted-foreground">{log.timestamp.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflow Builder Tab */}
        <TabsContent value="builder">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Visual Workflow Builder
              </CardTitle>
              <CardDescription>Create automations with drag-and-drop</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
                {/* Trigger Blocks */}
                <div>
                  <h4 className="font-semibold mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">TRIGGERS</h4>
                  <div className="space-y-2">
                    {["Price Alert", "Schedule", "Signal", "API Webhook", "Manual"].map((trigger) => (
                      <div key={trigger} className="p-3 border rounded-lg cursor-move hover:border-primary transition-colors">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="text-sm">{trigger}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Condition Blocks */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground">CONDITIONS</h4>
                  <div className="space-y-2">
                    {["If/Else", "Price Check", "Position Check", "Time Window", "Signal Strength"].map((condition) => (
                      <div key={condition} className="p-3 border rounded-lg cursor-move hover:border-accent transition-colors">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-4 w-4 text-accent" />
                          <span className="text-sm">{condition}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Blocks */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground">ACTIONS</h4>
                  <div className="space-y-2">
                    {["Place Order", "Cancel Order", "Send Alert", "Update Position", "Log Event", "Call API"].map((action) => (
                      <div key={action} className="p-3 border rounded-lg cursor-move hover:border-success transition-colors">
                        <div className="flex items-center gap-2">
                          <Play className="h-4 w-4 text-success" />
                          <span className="text-sm">{action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Canvas */}
                <div className="col-span-1 lg:col-span-1">
                  <h4 className="font-semibold mb-3 text-sm text-muted-foreground">WORKFLOW</h4>
                  <div className="border-2 border-dashed rounded-lg h-[400px] flex items-center justify-center bg-secondary/10">
                    <div className="text-center text-muted-foreground">
                      <GitBranch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Drag blocks here to build</p>
                      <p className="text-xs">your automation workflow</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomationHub;
