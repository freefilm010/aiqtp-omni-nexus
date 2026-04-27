import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Loader2,
  RefreshCw,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFeatureFlags, useToggleFeatureFlag } from "@/hooks/useFeatureFlags";

interface DashboardMetrics {
  activeSubs: number;
  monthlyRevenueCents: number;
  failedPaymentsLast24h: number;
  openSecurityFindings: number;
  lastReconciliationStatus: "clean" | "discrepancy" | "pending" | "none";
  lastReconciliationAt: string | null;
  lastAdminEvent: { event_type: string; created_at: string; severity: string } | null;
  totalUsers: number;
}

const fmtMoney = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100
  );

const fmtRelative = (iso: string | null) => {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export default function CEOMissionControl() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconRunning, setReconRunning] = useState(false);
  const { data: flags } = useFeatureFlags();
  const toggleFlag = useToggleFeatureFlag();

  const loadMetrics = async () => {
    setLoading(true);
    try {
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [subs, deposits, audit, recon, users] = await Promise.all([
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .in("status", ["active", "trialing"]),
        supabase
          .from("deposit_transactions")
          .select("amount_cents,status,created_at")
          .gte("created_at", since30d),
        supabase
          .from("security_audit_log")
          .select("event_type,created_at,severity")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("reconciliation_reports")
          .select("status,run_at")
          .order("run_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("profiles")
          .select("id", { count: "exact", head: true }),
      ]);

      const succeededRecent =
        deposits.data?.filter((d: any) => d.status === "succeeded") ?? [];
      const failedRecent =
        deposits.data?.filter(
          (d: any) => d.status === "failed" && d.created_at >= since24h
        ) ?? [];

      setMetrics({
        activeSubs: subs.count ?? 0,
        monthlyRevenueCents: succeededRecent.reduce(
          (s: number, d: any) => s + (d.amount_cents ?? 0),
          0
        ),
        failedPaymentsLast24h: failedRecent.length,
        openSecurityFindings: 0, // surfaced in Security Center
        lastReconciliationStatus:
          (recon.data?.status as DashboardMetrics["lastReconciliationStatus"]) ??
          "none",
        lastReconciliationAt: recon.data?.run_at ?? null,
        lastAdminEvent: (audit.data as DashboardMetrics["lastAdminEvent"]) ?? null,
        totalUsers: users.count ?? 0,
      });
    } catch (e) {
      console.error("Mission Control metrics error:", e);
      toast.error("Failed to load metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  const runReconciliation = async () => {
    setReconRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("reconciliation-report", {
        body: { environment: "live", hoursBack: 24 },
      });
      if (error) throw error;
      const status = data?.report?.status;
      if (status === "clean") {
        toast.success("Reconciliation clean — no discrepancies");
      } else {
        toast.warning(
          `Reconciliation found ${data?.report?.discrepancies?.length ?? 0} discrepancies`
        );
      }
      await loadMetrics();
    } catch (e: any) {
      toast.error(`Reconciliation failed: ${e.message ?? e}`);
    } finally {
      setReconRunning(false);
    }
  };

  const reconBadge = () => {
    if (!metrics) return null;
    if (metrics.lastReconciliationStatus === "clean")
      return <Badge variant="outline" className="border-green-500/40 text-green-600">Clean</Badge>;
    if (metrics.lastReconciliationStatus === "discrepancy")
      return <Badge variant="destructive">Discrepancy</Badge>;
    if (metrics.lastReconciliationStatus === "none")
      return <Badge variant="outline">Never run</Badge>;
    return <Badge variant="secondary">{metrics.lastReconciliationStatus}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">CEO Mission Control</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Everything that matters in 30 seconds — revenue, integrity, governance.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={loadMetrics} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          icon={DollarSign}
          label="Revenue (30d)"
          value={loading || !metrics ? null : fmtMoney(metrics.monthlyRevenueCents)}
          tone="default"
        />
        <KpiCard
          icon={Users}
          label="Active Subs"
          value={loading || !metrics ? null : String(metrics.activeSubs)}
          tone="default"
        />
        <KpiCard
          icon={CreditCard}
          label="Failed Pay (24h)"
          value={loading || !metrics ? null : String(metrics.failedPaymentsLast24h)}
          tone={metrics && metrics.failedPaymentsLast24h > 0 ? "warn" : "default"}
        />
        <KpiCard
          icon={Activity}
          label="Total Users"
          value={loading || !metrics ? null : String(metrics.totalUsers)}
          tone="default"
        />
      </div>

      {/* Reconciliation */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" /> Daily Reconciliation
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Stripe ↔ Database ↔ Wallets — the audit trail for charter review.
            </p>
          </div>
          {reconBadge()}
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm">
            <div>
              Last run:{" "}
              <span className="text-muted-foreground">
                {fmtRelative(metrics?.lastReconciliationAt ?? null)}
              </span>
            </div>
          </div>
          <Button onClick={runReconciliation} disabled={reconRunning} size="sm">
            {reconRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running…
              </>
            ) : (
              "Run reconciliation now"
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Last admin event */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last Admin / Security Event</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-16 w-full" />
          ) : metrics?.lastAdminEvent ? (
            <div className="flex items-center justify-between text-sm">
              <div>
                <div className="font-mono">{metrics.lastAdminEvent.event_type}</div>
                <div className="text-xs text-muted-foreground">
                  {fmtRelative(metrics.lastAdminEvent.created_at)}
                </div>
              </div>
              <Badge
                variant={
                  metrics.lastAdminEvent.severity === "error"
                    ? "destructive"
                    : metrics.lastAdminEvent.severity === "warn"
                    ? "outline"
                    : "secondary"
                }
              >
                {metrics.lastAdminEvent.severity}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No events yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Feature flags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" /> Feature Flags
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Gate experimental routes during charter review without deleting code.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {!flags && <Skeleton className="h-32 w-full" />}
          {flags?.map((f) => (
            <div
              key={f.id}
              className="flex items-start justify-between gap-3 border border-border rounded-md px-3 py-2"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{f.display_name}</span>
                  {f.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {f.category}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {f.audience}
                  </Badge>
                </div>
                {f.description && (
                  <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                )}
                <code className="text-[10px] text-muted-foreground">{f.flag_key}</code>
              </div>
              <Switch
                checked={f.is_enabled}
                onCheckedChange={(v) =>
                  toggleFlag.mutate(
                    { id: f.id, is_enabled: v },
                    {
                      onSuccess: () =>
                        toast.success(`${f.display_name}: ${v ? "ON" : "OFF"}`),
                      onError: (e: any) =>
                        toast.error(`Toggle failed: ${e.message ?? e}`),
                    }
                  )
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

const KpiCard = ({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: string | null;
  tone: "default" | "warn" | "error";
}) => (
  <Card>
    <CardContent className="p-3 sm:p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span className="truncate">{label}</span>
      </div>
      {value === null ? (
        <Skeleton className="h-7 w-24 mt-2" />
      ) : (
        <div
          className={`text-xl sm:text-2xl font-bold mt-2 ${
            tone === "warn"
              ? "text-amber-500"
              : tone === "error"
              ? "text-destructive"
              : ""
          }`}
        >
          {value}
        </div>
      )}
    </CardContent>
  </Card>
);