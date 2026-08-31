// ollama-swarm — free, self-hosted AI swarm (no per-token billing).
//
// Routes prompts to a user-owned Ollama server (OLLAMA_BASE_URL, optional
// OLLAMA_API_KEY for a reverse-proxy bearer). Models used by default:
//   • hermes3          — strategist / planner
//   • openclaw         — executor / tool-caller
//   • qwen2.5-coder    — code + quant reviewer
//
// Honest failure: if no server is configured or reachable, the function
// returns 200 with { ok: false, reason } so the UI can state the truth
// instead of fabricating an answer.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const BASE = (Deno.env.get("OLLAMA_BASE_URL") ?? "").replace(/\/+$/, "");
const KEY = Deno.env.get("OLLAMA_API_KEY") ?? "";

const authHeaders = (): Record<string, string> => ({
  "Content-Type": "application/json",
  ...(KEY ? { Authorization: `Bearer ${KEY}` } : {}),
});

async function withTimeout<T>(p: (signal: AbortSignal) => Promise<T>, ms: number): Promise<T> {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  try {
    return await p(c.signal);
  } finally {
    clearTimeout(t);
  }
}

async function listModels() {
  const res = await withTimeout(
    (signal) => fetch(`${BASE}/api/tags`, { headers: authHeaders(), signal }),
    8000,
  );
  if (!res.ok) throw new Error(`Ollama /api/tags ${res.status}`);
  const data = await res.json();
  return (data?.models ?? []).map((m: Record<string, unknown>) => ({
    name: String(m.name ?? ""),
    size: Number(m.size ?? 0),
    family: String((m.details as Record<string, unknown> | undefined)?.family ?? ""),
    modified_at: String(m.modified_at ?? ""),
  }));
}

async function chat(model: string, system: string, prompt: string, timeoutMs = 120_000) {
  const started = Date.now();
  const res = await withTimeout(
    (signal) =>
      fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: authHeaders(),
        signal,
        body: JSON.stringify({
          model,
          stream: false,
          options: { temperature: 0.4, num_ctx: 8192 },
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt },
          ],
        }),
      }),
    timeoutMs,
  );
  if (!res.ok) throw new Error(`Ollama /api/chat ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  return {
    model,
    content: String(data?.message?.content ?? ""),
    eval_count: Number(data?.eval_count ?? 0),
    latency_ms: Date.now() - started,
  };
}

const AGENTS: Record<string, { model: string; system: string }> = {
  hermes: {
    model: Deno.env.get("OLLAMA_MODEL_HERMES") ?? "hermes3",
    system:
      "You are HERMES, the strategist of the AIQTP swarm. Produce a precise, numbered execution plan. " +
      "Never invent market data, balances or performance figures — if a number is unknown, say UNKNOWN.",
  },
  openclaw: {
    model: Deno.env.get("OLLAMA_MODEL_OPENCLAW") ?? "openclaw",
    system:
      "You are OPENCLAW, the executor of the AIQTP swarm. Turn the plan into concrete, runnable steps " +
      "(API calls, SQL, shell, code). Flag any step that requires a credential the platform does not hold.",
  },
  reviewer: {
    model: Deno.env.get("OLLAMA_MODEL_REVIEWER") ?? "qwen2.5-coder",
    system:
      "You are the AIQTP reviewer. Audit the plan and execution for security holes, incorrect math, " +
      "unrealistic assumptions and fabricated data. Output findings by severity.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!BASE) {
    return json({
      ok: false,
      configured: false,
      reason:
        "No Ollama server configured. Set OLLAMA_BASE_URL (e.g. https://ollama.your-host.com) in backend secrets. " +
        "Self-hosted Ollama is free — no per-token billing.",
    });
  }

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = String(body.action ?? "status");

    if (action === "status") {
      const models = await listModels();
      return json({
        ok: true,
        configured: true,
        host: BASE.replace(/^https?:\/\//, ""),
        models,
        agents: Object.fromEntries(
          Object.entries(AGENTS).map(([k, v]) => [
            k,
            { model: v.model, installed: models.some((m: { name: string }) => m.name.split(":")[0] === v.model.split(":")[0]) },
          ]),
        ),
      });
    }

    if (action === "swarm") {
      const prompt = String(body.prompt ?? "").trim();
      if (!prompt) return json({ ok: false, reason: "prompt is required" });

      const plan = await chat(AGENTS.hermes.model, AGENTS.hermes.system, prompt);
      const exec = await chat(
        AGENTS.openclaw.model,
        AGENTS.openclaw.system,
        `TASK:\n${prompt}\n\nSTRATEGIST PLAN:\n${plan.content}`,
      );
      const review = await chat(
        AGENTS.reviewer.model,
        AGENTS.reviewer.system,
        `TASK:\n${prompt}\n\nPLAN:\n${plan.content}\n\nEXECUTION:\n${exec.content}`,
      );

      return json({
        ok: true,
        prompt,
        stages: [
          { agent: "hermes", ...plan },
          { agent: "openclaw", ...exec },
          { agent: "reviewer", ...review },
        ],
        total_latency_ms: plan.latency_ms + exec.latency_ms + review.latency_ms,
        cost_usd: 0,
      });
    }

    if (action === "single") {
      const agent = String(body.agent ?? "hermes");
      const def = AGENTS[agent];
      if (!def) return json({ ok: false, reason: `unknown agent ${agent}` });
      const out = await chat(def.model, def.system, String(body.prompt ?? ""));
      return json({ ok: true, stages: [{ agent, ...out }], cost_usd: 0 });
    }

    return json({ ok: false, reason: `unknown action ${action}` });
  } catch (e) {
    return json({ ok: false, configured: true, reason: e instanceof Error ? e.message : String(e) });
  }
});
