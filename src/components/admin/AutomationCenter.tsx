import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Zap,
  Play,
  Pause,
  Settings,
  Clock,
  TrendingUp,
  DollarSign,
  Shield,
  RefreshCw,
  Plus,
  Activity
} from "lucide-react";
import { toast } from "sonner";

interface Automation {
  id: string;
  name: string;
  type: string;
  trigger: string;
  action: string;
  isActive: boolean;
  lastRun: Date | null;
  nextRun: Date | null;
  runCount: number;
}

const AutomationCenter = () => {
  const [automations, setAutomations] = useState<Automation[]>([
    {
      id: "1",
      name: "Revenue Collection",
      type: "scheduled",
      trigger: "Every 1 hour",
      action: "Collect and distribute revenue",
      isActive: true,
      lastRun: new Date(Date.now() - 120000),
      nextRun: new Date(Date.now() + 3480000),
      runCount: 1245
    },
    {
      id: "2",
      name: "Auto-Reinvestment",
      type: "trigger",
      trigger: "Revenue > $100",
      action: "Reinvest 60% per strategy",
      isActive: true,
      lastRun: new Date(Date.now() - 900000),
      nextRun: null,
      runCount: 892
    },
    {
      id: "3",
      name: "Portfolio Rebalance",
      type: "scheduled",
      trigger: "Daily at 00:00 UTC",
      action: "Rebalance to 30/70 allocation",
      isActive: true,
      lastRun: new Date(Date.now() - 7200000),
      nextRun: new Date(Date.now() + 79200000),
      runCount: 45
    },
    {
      id: "4",
      name: "Security Scan",
      type: "scheduled",
      trigger: "Every 1 hour",
      action: "Run security audit",
      isActive: true,
      lastRun: new Date(Date.now() - 300000),
      nextRun: new Date(Date.now() + 3300000),
      runCount: 1240
    },
    {
      id: "5",
      name: "Price Alerts",
      type: "trigger",
      trigger: "BTC change > 5%",
      action: "Send notification",
      isActive: true,
      lastRun: new Date(Date.now() - 86400000),
      nextRun: null,
      runCount: 23
    },
    {
      id: "6",
      name: "DCA Execution",
      type: "scheduled",
      trigger: "Weekly on Monday",
      action: "Execute DCA purchases",
      isActive: true,
      lastRun: new Date(Date.now() - 172800000),
      nextRun: new Date(Date.now() + 432000000),
      runCount: 12
    }
  ]);

  const toggleAutomation = (id: string) => {
    setAutomations(prev =>
      prev.map(a =>
        a.id === id ? { ...a, isActive: !a.isActive } : a
      )
    );
    toast.success("Automation updated");
  };

  const runNow = (id: string) => {
    setAutomations(prev =>
      prev.map(a =>
        a.id === id ? { ...a, lastRun: new Date(), runCount: a.runCount + 1 } : a
      )
    );
    toast.success("Automation executed");
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "scheduled": return Clock;
      case "trigger": return Zap;
      default: return Activity;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Automation Center</h1>
          <p className="text-muted-foreground">
            Configure automated workflows and schedules
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Automations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {automations.filter(a => a.isActive).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Executions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.reduce((acc, a) => acc + a.runCount, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Scheduled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.filter(a => a.type === 'scheduled').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trigger-Based
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {automations.filter(a => a.type === 'trigger').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Automation List */}
      <div className="space-y-4">
        {automations.map((automation) => {
          const Icon = getIcon(automation.type);
          return (
            <Card key={automation.id} className={automation.isActive ? "border-primary/50" : ""}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${automation.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Icon className={`h-6 w-6 ${automation.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{automation.name}</h3>
                        <Badge variant={automation.isActive ? "default" : "secondary"}>
                          {automation.isActive ? "Active" : "Paused"}
                        </Badge>
                        <Badge variant="outline">{automation.type}</Badge>
                      </div>
                      <p className="text-muted-foreground mt-1">{automation.action}</p>
                      <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Trigger: {automation.trigger}
                        </span>
                        <span>|</span>
                        <span>Runs: {automation.runCount.toLocaleString()}</span>
                        {automation.lastRun && (
                          <>
                            <span>|</span>
                            <span>Last: {automation.lastRun.toLocaleTimeString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => runNow(automation.id)}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                    <Switch
                      checked={automation.isActive}
                      onCheckedChange={() => toggleAutomation(automation.id)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Create New Automation */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Create Automation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input placeholder="Automation name" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select defaultValue="scheduled">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="trigger">Trigger-based</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select defaultValue="reinvest">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reinvest">Reinvest Revenue</SelectItem>
                  <SelectItem value="rebalance">Rebalance Portfolio</SelectItem>
                  <SelectItem value="notify">Send Notification</SelectItem>
                  <SelectItem value="security">Security Scan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => toast.success("Automation created")}>
                <Plus className="h-4 w-4 mr-2" />
                Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AutomationCenter;
