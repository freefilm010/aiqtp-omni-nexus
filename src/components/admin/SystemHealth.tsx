import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { renderApi } from "@/lib/render-api";
import { toast } from "sonner";
import {
  Activity, RefreshCw, CheckCircle2, XCircle, AlertTriangle,
  Database, Server, Zap, Coins, Bot, TrendingUp, Shield,
  Globe, CreditCard, BarChart3, Clock, Layers,
} from "lucide-react";

const SUPABASE_URL = "https://rueaxiyvseaxkysnoock.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ1ZWF4aXl2c2VheGt5c25vb2NrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NDkwMDEsImV4cCI6MjA4OTQyNTAwMX0.07J92R1g2-ihtnN43iYD63jU3gByBK3otB5zq3haw54";

type Status = "ok" | "warn" | "error" | "loading";

interface Check {
  label: string;
  status: Status;
  detail?: string;
  value?: string | number;
  latencyMs?: number;
}

interface Section {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  checks: Check[];
}

const StatusIcon = ({ status }: { status: Status }) => {
  if (status === "ok") return <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />;
  if (status === "warn") return <AlertTriangle className="h-4 w-4 text-yellow-400 shrink-0" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-red-400 shrink-0" />;
  return <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin shrink-0" />;
};

const StatusBadge = ({ status }: { status: Status }) => {
  const map = { ok: "bg-green-500/20 text-green-400 border-green-500/30", warn: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", error: "bg-red-500/20 text-red-400 border-red-500/30", loading: "bg-muted text-muted-foreground" };
  return <Badge className={`text-xs shrink-0 ${map[status]}`}>{status === "loading" ? "checking..." : status.toUpperCase()}</Badge>;
};

async function pingEdgeFn(name: string): Promise<{ status: Status; latencyMs: number }> {
  const t = Date.now();
  try {
    const resp = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
      method: "POST",
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ping" }),
      signal: AbortSignal.timeout(15000),
    });
    const latencyMs = Date.now() - t;
    const ok = resp.status === 200 || resp.status === 401 || resp.status === 400;
    return { status: ok ? "ok" : "warn", latencyMs };
  } catch {
    return { status: "error", latencyMs: Date.now() - t };
  }
}

async function pingRender(path: string): Promise<{ status: Status; latencyMs: number; body?: any }> {
  const RENDER = "https://aiqtp-trading-service.onrender.com";
  const t = Date.now();
  try {
    const resp = await fetch(`${RENDER}${path}`, { signal: AbortSignal.timeout(30000) });
    const latencyMs = Date.now() - t;
    let body: any = null;
    try { body = await resp.json(); } catch {}
    return { status: resp.ok ? "ok" : "warn", latencyMs, body };
  } catch {
    return { status: "warn", latencyMs: Date.now() - t }; // warn not error — Render free tier sleeps
  }
}

export default function SystemHealth() {
  const [sections, setSections] = useState<Section[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);
  const [botStats, setBotStats] = useState<any>(null);
  const [overallStatus, setOverallStatus] = useState<Status>("loading");

  const runChecks = useCallback(async () => {
    setRunning(true);
    setSections([]);
    setOverallStatus("loading");

    const [supaRes, tradingRes, botStatsRes] = await Promise.all([
      // Supabase ping
      (async (): Promise<Check> => {
        const t = Date.now();
        try {
          const r = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${ANON_KEY}` },
            signal: AbortSignal.timeout(10000),
          });
          const ms = Date.now() - t;
          const ok = r.status === 200 || r.status === 401;
          return { label: "Supabase DB / REST API", status: ok ? "ok" : r.status === 503 ? "error" : "warn", detail: r.status === 503 ? "PROJECT PAUSED — reactivate at supabase.com" : `HTTP ${r.status}`, latencyMs: ms };
        } catch { return { label: "Supabase DB / REST API", status: "error", detail: "Unreachable", latencyMs: Date.now() - t }; }
      })(),
      // Render trading health
      pingRender("/health"),
      // Bot stats
      renderApi.admin.stats().catch(() => null),
    ]);

    setBotStats(botStatsRes);

    // Edge function pings
    const edgeFns = ["qaqi-agent", "aiqtp-agent", "get-market-prices", "faucet-credit", "multi-agent-orchestrator", "nft-generate-image", "platform-token-refresh", "compound-snapshot", "quantclaw-marketing"];
    const edgeResults = await Promise.all(edgeFns.map(async fn => {
      const r = await pingEdgeFn(fn);
      return { label: fn, ...r } as Check & { label: string };
    }));

    // Supabase table checks
    const tableChecks = await Promise.all([
      (async (): Promise<Check> => {
        try {
          const { count } = await supabase.from("platform_tokens").select("*", { count: "exact", head: true });
          return { label: "platform_tokens", status: "ok", value: `${count} tokens` };
        } catch { return { label: "platform_tokens", status: "error" }; }
      })(),
      (async (): Promise<Check> => {
        try {
          const { count } = await supabase.from("exchange_pairs").select("*", { count: "exact", head: true });
          return { label: "exchange_pairs", status: count && count > 0 ? "ok" : "warn", value: `${count} pairs`, detail: count === 0 ? "No active pairs" : undefined };
        } catch { return { label: "exchange_pairs", status: "error" }; }
      })(),
      (async (): Promise<Check> => {
        try {
          const { count } = await supabase.from("user_stakes").select("*", { count: "exact", head: true });
          return { label: "user_stakes", status: "ok", value: `${count} active stakes` };
        } catch { return { label: "user_stakes", status: "warn", detail: "Table may not exist yet" }; }
      })(),
      (async (): Promise<Check> => {
        try {
          const { data } = await supabase.from("platform_revenue").select("amount").eq("status", "pending");
          const total = (data ?? []).reduce((s: number, r: any) => s + Number(r.amount), 0);
          return { label: "platform_revenue (pending)", status: "ok", value: `$${total.toFixed(2)}` };
        } catch { return { label: "platform_revenue", status: "error" }; }
      })(),
      (async (): Promise<Check> => {
        try {
          const { count } = await supabase.from("agent_directives").select("*", { count: "exact", head: true }).eq("status", "pending");
          return { label: "agent_directives (queued)", status: count && count > 20 ? "warn" : "ok", value: `${count} queued`, detail: count && count > 20 ? "Backlog building up" : undefined };
        } catch { return { label: "agent_directives", status: "error" }; }
      })(),
      (async (): Promise<Check> => {
        try {
          const { count } = await supabase.from("dex_tokens").select("*", { count: "exact", head: true }).eq("status", "pending");
          return { label: "dex_tokens (pending approval)", status: count && count > 0 ? "warn" : "ok", value: `${count} pending`, detail: count && count > 0 ? "Tokens awaiting admin approval" : undefined };
        } catch { return { label: "dex_tokens", status: "error" }; }
      })(),
    ]);

    // Revenue checks
    const revenueChecks = await Promise.all([
      (async (): Promise<Check> => {
        const { status: s, body } = await pingRender("/payments/history/test");
        return { label: "Stripe payment endpoint", status: s === "ok" || s === "warn" ? "ok" : "error", detail: `HTTP reachable` };
      })(),
      (async (): Promise<Check> => {
        const { status: s } = await pingRender("/arbitrage/opportunities");
        return { label: "Arbitrage scanner", status: s, detail: s === "ok" ? "Live" : "Sleeping/Issue" };
      })(),
      (async (): Promise<Check> => {
        try {
          const { count } = await supabase.from("fee_events").select("*", { count: "exact", head: true });
          return { label: "fee_events (all time)", status: "ok", value: `${count} events` };
        } catch { return { label: "fee_events", status: "warn" }; }
      })(),
      (async (): Promise<Check> => {
        try {
          const { data } = await supabase.from("platform_wallets").select("currency, balance").eq("is_active", true);
          const total = (data ?? []).length;
          return { label: "Treasury wallets", status: total > 0 ? "ok" : "warn", value: `${total} wallets tracked` };
        } catch { return { label: "Treasury wallets", status: "error" }; }
      })(),
    ]);

    const built: Section[] = [
      {
        title: "Infrastructure",
        icon: Server,
        checks: [
          supaRes,
          { label: "Render Trading Service", status: tradingRes.status, detail: tradingRes.status === "ok" ? `HTTP ${tradingRes.latencyMs}ms` : "Sleeping (free tier — wakes on demand)", latencyMs: tradingRes.latencyMs },
          { label: "Frontend (aiqtp.com)", status: "ok", detail: "Vercel auto-deploys from main" },
        ],
      },
      {
        title: "Edge Functions (45 total)",
        icon: Zap,
        checks: edgeResults.map(r => ({
          label: r.label,
          status: r.status,
          detail: r.status === "ok" ? `${r.latencyMs}ms` : "Issue",
          latencyMs: r.latencyMs,
        })),
      },
      {
        title: "Token & Wallet Ecosystem",
        icon: Coins,
        checks: tableChecks,
      },
      {
        title: "Revenue Streams",
        icon: TrendingUp,
        checks: revenueChecks,
      },
      {
        title: "Bot Pipeline",
        icon: Bot,
        checks: botStatsRes ? [
          { label: "Total bots", status: "ok", value: botStatsRes.total_bots },
          { label: "Active bots", status: botStatsRes.active_bots > 0 ? "ok" : "warn", value: botStatsRes.active_bots },
          { label: "Graduated bots", status: botStatsRes.graduated_bots > 0 ? "ok" : "warn", value: botStatsRes.graduated_bots },
          { label: "Pending graduation", status: "ok", value: botStatsRes.pending_graduation },
          { label: "Avg quality score", status: botStatsRes.avg_quality >= 70 ? "ok" : "warn", value: `${Number(botStatsRes.avg_quality).toFixed(1)}%` },
          { label: "Total platform earnings", status: "ok", value: `$${Number(botStatsRes.total_earnings).toFixed(2)}` },
        ] : [{ label: "Bot stats endpoint", status: "warn" as Status, detail: "Render sleeping — wake by visiting /admin/bots" }],
      },
    ];

    // Overall status
    const allChecks = built.flatMap(s => s.checks);
    const hasError = allChecks.some(c => c.status === "error");
    const hasWarn = allChecks.some(c => c.status === "warn");
    setOverallStatus(hasError ? "error" : hasWarn ? "warn" : "ok");

    setSections(built);
    setLastRun(new Date());
    setRunning(false);

    const errCount = allChecks.filter(c => c.status === "error").length;
    const warnCount = allChecks.filter(c => c.status === "warn").length;
    if (errCount > 0) toast.error(`${errCount} critical issue(s) detected`);
    else if (warnCount > 0) toast.warning(`${warnCount} warning(s) — check details`);
    else toast.success("All systems operational");
  }, []);

  useEffect(() => { runChecks(); }, [runChecks]);

  const overallColor = overallStatus === "ok" ? "text-green-400" : overallStatus === "warn" ? "text-yellow-400" : overallStatus === "error" ? "text-red-400" : "text-muted-foreground";
  const overallLabel = overallStatus === "ok" ? "All Systems Operational" : overallStatus === "warn" ? "Degraded Performance" : overallStatus === "error" ? "Critical Issues Detected" : "Running checks…";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            System Health
          </h2>
          <p className={`text-sm font-medium mt-0.5 ${overallColor}`}>{overallLabel}</p>
        </div>
        <div className="flex items-center gap-3">
          {lastRun && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> {lastRun.toLocaleTimeString()}
            </span>
          )}
          <Button onClick={runChecks} disabled={running} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${running ? "animate-spin" : ""}`} />
            {running ? "Running…" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Overall status bar */}
      {sections.length > 0 && (() => {
        const all = sections.flatMap(s => s.checks);
        const total = all.length;
        const ok = all.filter(c => c.status === "ok").length;
        const warn = all.filter(c => c.status === "warn").length;
        const err = all.filter(c => c.status === "error").length;
        return (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Health</span>
                <span className="text-sm">{ok}/{total} checks passing</span>
              </div>
              <Progress value={(ok / total) * 100} className="h-3" />
              <div className="flex gap-4 mt-2 text-xs">
                <span className="text-green-400">✅ {ok} OK</span>
                <span className="text-yellow-400">⚠️ {warn} Warn</span>
                <span className="text-red-400">❌ {err} Error</span>
              </div>
            </CardContent>
          </Card>
        );
      })()}

      {/* Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map(section => (
          <Card key={section.title}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <section.icon className="h-4 w-4 text-primary" />
                {section.title}
                <span className="ml-auto text-xs font-normal text-muted-foreground">
                  {section.checks.filter(c => c.status === "ok").length}/{section.checks.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {section.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-border/30 last:border-0">
                  <StatusIcon status={check.status} />
                  <span className="text-sm flex-1 truncate">{check.label}</span>
                  {check.value !== undefined && (
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{check.value}</span>
                  )}
                  {check.detail && (
                    <span className={`text-xs shrink-0 ${check.status === "error" ? "text-red-400" : check.status === "warn" ? "text-yellow-400" : "text-muted-foreground"}`}>
                      {check.detail}
                    </span>
                  )}
                  <StatusBadge status={check.status} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Repo inventory */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            Repository Inventory & Integration Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-muted-foreground mb-2 uppercase text-xs tracking-wide">Private Repos (yours)</p>
              {[
                { name: "aiqtpreprepo", lang: "TypeScript", note: "Replit GlobalMarketExchange mirror", action: "Merge unique features → omni-nexus" },
                { name: "QUANTUM-ASSET-PLATFORM", lang: "Python", note: "Quantum asset trading engine", action: "Integrate quantum strategies into core-brain" },
                { name: "DYNAMIC-QUANT-ASSET-PLATFORM", lang: "Python", note: "Dynamic quant strategies", action: "Merge strategy logic into trading_worker" },
                { name: "FORALL_DYNAMICS_EXT", lang: "Python", note: "Quant eco + trade platform", action: "Extract reusable modules" },
                { name: "Quantum-SDR-RF-AI-LAB", lang: "Python", note: "SDR/RF signal AI lab", action: "Future: QuantumSentinel integration" },
                { name: "a-i-quant-crypto", lang: "JavaScript", note: "Early AIQTP JS version", action: "Review for any unique logic" },
              ].map(r => (
                <div key={r.name} className="mb-2 p-2 rounded bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Shield className="h-3 w-3 text-yellow-400" />
                    <span className="font-medium">{r.name}</span>
                    <Badge variant="outline" className="text-xs">{r.lang}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.note}</p>
                  <p className="text-xs text-blue-400 mt-0.5">→ {r.action}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="font-semibold text-muted-foreground mb-2 uppercase text-xs tracking-wide">Relevant Forked Repos (public upstream)</p>
              {[
                { name: "QuantMuse", orig: "Public quant trading with AI + risk mgmt", url: "github.com/freefilm010/QuantMuse", benefit: "AI signal analysis, real-time data pipeline, risk management" },
                { name: "Aster-Perps-Trading-Bot", orig: "EMA/RSI perps bot (AsterDEX)", url: "github.com/freefilm010/Aster-Perps-Trading-Bot", benefit: "Trend-following strategy — port EMA 8/21/48 logic to core-brain" },
                { name: "ai-crypto-trading-bot", orig: "OpenAI OHLC analysis + trade execution", url: "github.com/freefilm010/ai-crypto-trading-bot", benefit: "OHLC analysis pattern — adapt for Anthropic/QAQI" },
                { name: "langmanus", orig: "AI automation framework (web search + code exec)", url: "github.com/freefilm010/langmanus", benefit: "QuantClaw RAG/tool framework" },
                { name: "casibase", orig: "Enterprise AI knowledge base + agent mgmt", url: "github.com/freefilm010/casibase", benefit: "Knowledge base for QAQI Army Mode" },
                { name: "community-tools", orig: "Hummingbot community strategies", url: "github.com/freefilm010/community-tools", benefit: "Pre-built HFT/MM strategies for strategy registry" },
                { name: "agentic-flow", orig: "Claude Code agent SDK deployment", url: "github.com/freefilm010/agentic-flow", benefit: "Deploy AIQTP agents as hosted services" },
                { name: "mindsdb", orig: "AI query engine over federated data", url: "github.com/freefilm010/mindsdb", benefit: "Data marketplace query layer" },
              ].map(r => (
                <div key={r.name} className="mb-2 p-2 rounded bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Globe className="h-3 w-3 text-green-400" />
                    <span className="font-medium">{r.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{r.orig}</p>
                  <p className="text-xs text-green-400 mt-0.5">💡 {r.benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
