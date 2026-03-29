import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  BellOff,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Settings,
  Trash2,
  Plus,
  Volume2,
} from "lucide-react";

interface NotificationRule {
  id: string;
  type: "trade_executed" | "target_hit" | "stop_loss" | "drawdown_alert" | "profit_milestone";
  label: string;
  enabled: boolean;
  sound: boolean;
  threshold?: number;
}

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

const TradePushNotifications = () => {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>("default");
  const [rules, setRules] = useState<NotificationRule[]>([
    { id: "1", type: "trade_executed", label: "Bot Trade Executed", enabled: true, sound: true },
    { id: "2", type: "target_hit", label: "Take Profit Hit", enabled: true, sound: true },
    { id: "3", type: "stop_loss", label: "Stop Loss Triggered", enabled: true, sound: true },
    { id: "4", type: "drawdown_alert", label: "Drawdown Alert", enabled: true, sound: false, threshold: 5 },
    { id: "5", type: "profit_milestone", label: "Profit Milestone", enabled: false, sound: false, threshold: 1000 },
  ]);
  const [logs, setLogs] = useState<NotificationLog[]>([
    {
      id: "n1",
      type: "trade_executed",
      title: "Trade Executed",
      message: "Bot AlphaScalper bought 2 ES @ 5,842.50",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      read: false,
    },
    {
      id: "n2",
      type: "target_hit",
      title: "Target Hit! 🎯",
      message: "NQ long position hit TP1 at 21,450. P&L: +$425.00",
      timestamp: new Date(Date.now() - 900000).toISOString(),
      read: false,
    },
    {
      id: "n3",
      type: "stop_loss",
      title: "Stop Loss Triggered ⚠️",
      message: "MNQ short stopped out @ 21,380. Loss: -$85.00",
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      read: true,
    },
    {
      id: "n4",
      type: "drawdown_alert",
      title: "Drawdown Warning",
      message: "Account drawdown reached 3.2% today. DLL limit: $1,000",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      read: true,
    },
  ]);

  useEffect(() => {
    if ("Notification" in window) {
      setPermissionState(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      toast.error("Push notifications not supported in this browser");
      return;
    }
    const perm = await Notification.requestPermission();
    setPermissionState(perm);
    if (perm === "granted") {
      setPushEnabled(true);
      toast.success("Push notifications enabled!");
      // Send test notification
      new Notification("AIQTP Notifications Active", {
        body: "You'll receive trade alerts here",
        icon: "/placeholder.svg",
      });
    } else {
      toast.error("Notification permission denied");
    }
  };

  const toggleRule = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    );
  };

  const toggleSound = (id: string) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, sound: !r.sound } : r))
    );
  };

  const markAllRead = () => {
    setLogs((prev) => prev.map((l) => ({ ...l, read: true })));
    toast.success("All notifications marked as read");
  };

  const clearAll = () => {
    setLogs([]);
    toast.success("Notification history cleared");
  };

  const sendTestNotification = () => {
    const newLog: NotificationLog = {
      id: `n-${Date.now()}`,
      type: "trade_executed",
      title: "Test: Trade Executed",
      message: "Bot TestBot bought 1 MES @ 5,840.25 (test notification)",
      timestamp: new Date().toISOString(),
      read: false,
    };
    setLogs((prev) => [newLog, ...prev]);

    if (pushEnabled && permissionState === "granted") {
      new Notification(newLog.title, { body: newLog.message });
    }
    toast.success("Test notification sent!");
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "trade_executed": return <TrendingUp className="h-4 w-4 text-blue-400" />;
      case "target_hit": return <Target className="h-4 w-4 text-green-400" />;
      case "stop_loss": return <TrendingDown className="h-4 w-4 text-red-400" />;
      case "drawdown_alert": return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case "profit_milestone": return <CheckCircle className="h-4 w-4 text-purple-400" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const unreadCount = logs.filter((l) => !l.read).length;

  return (
    <div className="space-y-6">
      {/* Enable Push */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Trade Push Notifications
          </CardTitle>
          <CardDescription>
            Get instant alerts when bots execute trades, hit targets, or trigger risk events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {permissionState === "granted"
                    ? "Browser notifications enabled"
                    : permissionState === "denied"
                    ? "Notifications blocked — update browser settings"
                    : "Click to enable browser notifications"}
                </p>
              </div>
            </div>
            {permissionState === "granted" ? (
              <Switch checked={pushEnabled} onCheckedChange={setPushEnabled} />
            ) : (
              <Button size="sm" onClick={requestPermission} disabled={permissionState === "denied"}>
                Enable
              </Button>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={sendTestNotification}>
            <Bell className="h-4 w-4 mr-2" /> Send Test Notification
          </Button>
        </CardContent>
      </Card>

      {/* Notification Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Alert Rules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  {typeIcon(rule.type)}
                  <div>
                    <p className="font-medium text-sm">{rule.label}</p>
                    {rule.threshold !== undefined && (
                      <p className="text-xs text-muted-foreground">
                        Threshold: {rule.type === "drawdown_alert" ? `${rule.threshold}%` : `$${rule.threshold.toLocaleString()}`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleSound(rule.id)}
                    className={`p-1 rounded ${rule.sound ? "text-primary" : "text-muted-foreground"}`}
                    title="Toggle sound"
                  >
                    <Volume2 className="h-4 w-4" />
                  </button>
                  <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="h-5 w-5" />
              Recent Alerts
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-xs">{unreadCount}</Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={markAllRead}>
                Mark all read
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No notifications yet</p>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    log.read ? "border-border bg-transparent" : "border-primary/30 bg-primary/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {typeIcon(log.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{log.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{log.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(log.timestamp).toLocaleString()}
                      </p>
                    </div>
                    {!log.read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TradePushNotifications;
