import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  RefreshCw, CheckCircle2, AlertTriangle, XCircle, Wifi, WifiOff,
  Database, Shield, Zap, HelpCircle, ChevronDown, ChevronUp,
  Wrench, RotateCcw, Activity
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface DiagnosticResult {
  name: string;
  status: "ok" | "warning" | "error";
  message: string;
  fix?: () => Promise<void>;
  fixLabel?: string;
}

const PlatformHealthMonitor = () => {
  const { user } = useAuth();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [running, setRunning] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runDiagnostics = useCallback(async () => {
    setRunning(true);
    const results: DiagnosticResult[] = [];

    // 1. Auth check
    if (user) {
      results.push({ name: "Authentication", status: "ok", message: "Signed in as " + (user.email || user.id.slice(0, 8)) });
    } else {
      results.push({
        name: "Authentication",
        status: "error",
        message: "Not signed in — most features require login",
        fixLabel: "Sign In",
        fix: async () => { window.location.href = "/auth"; },
      });
    }

    // 2. Backend connectivity
    try {
      const start = Date.now();
      const { error } = await supabase.from("admin_settings").select("id").limit(1);
      const latency = Date.now() - start;
      if (error) {
        results.push({ name: "Backend Connection", status: "warning", message: `Connected but query error: ${error.message}` });
      } else {
        results.push({
          name: "Backend Connection",
          status: latency > 3000 ? "warning" : "ok",
          message: `Connected (${latency}ms latency)${latency > 3000 ? " — slow response" : ""}`,
        });
      }
    } catch {
      results.push({ name: "Backend Connection", status: "error", message: "Cannot reach backend — check your internet connection" });
    }

    // 3. Edge functions
    try {
      const { error } = await supabase.functions.invoke("market-data-sync", { body: { action: "get_global" } });
      results.push({
        name: "Edge Functions",
        status: error ? "warning" : "ok",
        message: error ? `Edge function responded with error: ${error.message}` : "Edge functions operational",
      });
    } catch {
      results.push({ name: "Edge Functions", status: "warning", message: "Edge function test unavailable" });
    }

    // 4. Market data freshness
    if (user) {
      try {
        const { data } = await supabase.from("market_prices").select("last_updated").order("last_updated", { ascending: false }).limit(1);
        if (data && data[0]) {
          const age = Date.now() - new Date(data[0].last_updated).getTime();
          const mins = Math.round(age / 60000);
          results.push({
            name: "Market Data",
            status: mins > 30 ? "warning" : mins > 5 ? "warning" : "ok",
            message: mins > 30 ? `Data is ${mins} min old — may be stale` : `Fresh (${mins} min old)`,
            ...(mins > 30 ? {
              fixLabel: "Refresh Data",
              fix: async () => {
                await supabase.functions.invoke("market-data-sync");
                toast.success("Market data refresh triggered");
              },
            } : {}),
          });
        } else {
          results.push({ name: "Market Data", status: "warning", message: "No market data found" });
        }
      } catch {
        results.push({ name: "Market Data", status: "warning", message: "Could not check market data" });
      }
    }

    // 5. Strategy count
    if (user) {
      const { count } = await supabase.from("ai_strategies").select("*", { count: "exact", head: true }).eq("user_id", user.id);
      results.push({
        name: "Your Strategies",
        status: (count || 0) > 0 ? "ok" : "warning",
        message: (count || 0) > 0 ? `${count} strategies found` : "No strategies yet — create one in Strategy Studio",
        ...((count || 0) === 0 ? {
          fixLabel: "Go to Studio",
          fix: async () => { window.location.href = "/strategy-studio"; },
        } : {}),
      });
    }

    // 6. Browser check
    const isOnline = navigator.onLine;
    results.push({
      name: "Network",
      status: isOnline ? "ok" : "error",
      message: isOnline ? "Online" : "Offline — reconnect to use the platform",
    });

    // 7. Local storage
    try {
      localStorage.setItem("_health_check", "1");
      localStorage.removeItem("_health_check");
      results.push({ name: "Local Storage", status: "ok", message: "Available" });
    } catch {
      results.push({
        name: "Local Storage",
        status: "warning",
        message: "Blocked — some features may not persist settings",
        fixLabel: "Learn More",
        fix: async () => { window.open("https://docs.lovable.dev/tips-tricks/troubleshooting", "_blank"); },
      });
    }

    setDiagnostics(results);
    setLastRun(new Date());
    setRunning(false);
  }, [user]);

  // Auto-run on mount
  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const okCount = diagnostics.filter(d => d.status === "ok").length;
  const warnCount = diagnostics.filter(d => d.status === "warning").length;
  const errCount = diagnostics.filter(d => d.status === "error").length;
  const healthPct = diagnostics.length > 0 ? (okCount / diagnostics.length) * 100 : 0;

  const statusIcon = (s: string) => {
    if (s === "ok") return <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />;
    if (s === "warning") return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
    return <XCircle className="h-3.5 w-3.5 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Platform Health
          <div className="ml-auto flex items-center gap-2">
            {errCount > 0 && <Badge variant="destructive" className="text-[10px]">{errCount} issues</Badge>}
            {warnCount > 0 && <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-500">{warnCount} warnings</Badge>}
            {errCount === 0 && warnCount === 0 && diagnostics.length > 0 && (
              <Badge variant="outline" className="text-[10px] border-green-500 text-green-500">All clear</Badge>
            )}
            <Button variant="ghost" size="sm" onClick={runDiagnostics} disabled={running} className="h-6 w-6 p-0">
              <RefreshCw className={`h-3 w-3 ${running ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-6 w-6 p-0">
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Progress value={healthPct} className="h-1.5" />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>{okCount}/{diagnostics.length} checks passed</span>
          {lastRun && <span>Last checked: {lastRun.toLocaleTimeString()}</span>}
        </div>

        {expanded && (
          <div className="space-y-1.5 mt-2">
            {diagnostics.map((d, i) => (
              <div key={i} className="flex items-center gap-2 p-1.5 rounded bg-muted/30">
                {statusIcon(d.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{d.message}</p>
                </div>
                {d.fix && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => d.fix!()}
                  >
                    <Wrench className="h-2.5 w-2.5 mr-1" />
                    {d.fixLabel || "Fix"}
                  </Button>
                )}
              </div>
            ))}

            {/* Common Self-Help Tips */}
            <div className="mt-3 p-2 rounded bg-primary/5 border border-primary/10">
              <p className="text-[10px] font-medium text-foreground flex items-center gap-1 mb-1">
                <HelpCircle className="h-3 w-3" /> Quick Self-Help
              </p>
              <ul className="text-[10px] text-muted-foreground space-y-0.5">
                <li>• <strong>Page not loading?</strong> Pull down to refresh or press the ↻ button</li>
                <li>• <strong>Data looks stale?</strong> Tap "Refresh Data" above to sync market prices</li>
                <li>• <strong>Strategy not training?</strong> Ensure you're signed in & have created a strategy first</li>
                <li>• <strong>Payment failed?</strong> Check your card details or try a different payment method</li>
                <li>• <strong>Charts blank?</strong> Disable ad-blocker — it may block TradingView widgets</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformHealthMonitor;
