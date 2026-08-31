import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Cpu, ShieldAlert, Zap } from "lucide-react";

type Stage = { agent: string; model: string; content: string; latency_ms: number; eval_count: number };
type StatusRes = {
  ok: boolean;
  configured?: boolean;
  reason?: string;
  host?: string;
  models?: { name: string; family: string; size: number }[];
  agents?: Record<string, { model: string; installed: boolean }>;
};

const AGENT_LABEL: Record<string, string> = {
  hermes: "HERMES · Strategist",
  openclaw: "OPENCLAW · Executor",
  reviewer: "REVIEWER · Auditor",
};

const OllamaSwarmPage = () => {
  const [status, setStatus] = useState<StatusRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [stages, setStages] = useState<Stage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    supabase.functions
      .invoke("ollama-swarm", { body: { action: "status" } })
      .then(({ data, error: e }) => {
        if (!alive) return;
        if (e) setStatus({ ok: false, reason: e.message });
        else setStatus(data as StatusRes);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const run = async () => {
    if (!prompt.trim()) return;
    setRunning(true);
    setError(null);
    setStages([]);
    const { data, error: e } = await supabase.functions.invoke("ollama-swarm", {
      body: { action: "swarm", prompt },
    });
    setRunning(false);
    if (e) return setError(e.message);
    if (!data?.ok) return setError(data?.reason ?? "Swarm run failed");
    setStages(data.stages as Stage[]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold font-mono">Ollama Swarm</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Self-hosted Hermes + OpenClaw agents. Zero per-token cost — the models run on hardware you own.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Probing swarm host…
          </div>
        ) : !status?.configured ? (
          <Alert variant="destructive">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Swarm host not connected</AlertTitle>
            <AlertDescription className="text-xs">
              {status?.reason ??
                "Set OLLAMA_BASE_URL in backend secrets to point at your Ollama server."}{" "}
              Once set, Hermes, OpenClaw and the reviewer run free of charge.
            </AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Cpu className="h-4 w-4" /> Host {status.host}
              </CardTitle>
              <CardDescription className="text-xs">
                {status.models?.length ?? 0} model(s) installed · billing $0.00
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(status.agents ?? {}).map(([k, v]) => (
                <Badge key={k} variant={v.installed ? "default" : "outline"} className="text-[10px]">
                  {AGENT_LABEL[k] ?? k} · {v.model} {v.installed ? "" : "(not pulled)"}
                </Badge>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Dispatch swarm task</CardTitle>
            <CardDescription className="text-xs">
              Hermes plans → OpenClaw executes → Reviewer audits. Each stage is a separate local model call.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. Design a 20x BTC futures compounding ladder with a hard 8% drawdown kill-switch."
              className="font-mono text-xs"
            />
            <Button onClick={run} disabled={running || !status?.configured || !prompt.trim()}>
              {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Run swarm
            </Button>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </CardContent>
        </Card>

        {stages.map((s) => (
          <Card key={s.agent}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-mono">{AGENT_LABEL[s.agent] ?? s.agent}</CardTitle>
              <CardDescription className="text-[10px]">
                {s.model} · {(s.latency_ms / 1000).toFixed(1)}s · {s.eval_count} tokens · $0.00
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">{s.content}</pre>
            </CardContent>
          </Card>
        ))}
      </main>
      <Footer />
    </div>
  );
};

export default OllamaSwarmPage;
