import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callAI } from "../_shared/anthropic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Multi-Agent Orchestrator
 *
 * Fans out a prompt to multiple AI models in parallel, collects all responses,
 * then uses a judge model (Claude) to synthesize the best unified answer.
 *
 * Flow:
 *   1. Receive task + messages
 *   2. Fan out to N specialist agents concurrently (Claude, GPT, Gemini, etc.)
 *   3. Skip any agent whose API key env var is missing/empty
 *   4. Collect all responses via Promise.allSettled
 *   5. Judge model (Claude) synthesizes the best unified response
 *   6. Return final answer + individual agent contributions
 */

interface AgentConfig {
  id: string;
  name: string;
  /** Native model identifier (no provider prefix) */
  model: string;
  provider: "google" | "openai" | "anthropic";
  specialty: string;
  systemPrompt: string;
}

const AGENTS: AgentConfig[] = [
  {
    id: "gemini-25-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    model: "gemini-2.5-flash-lite-preview-06-17",
    provider: "google",
    specialty: "Ultra-fast classification, summarization, simple workloads",
    systemPrompt: "You are the fastest analyst. Give the sharpest, most direct answer possible. No fluff.",
  },
  {
    id: "gemini-25-flash",
    name: "Gemini 2.5 Flash",
    model: "gemini-2.5-flash",
    provider: "google",
    specialty: "Fast reasoning, efficient drafting, quick synthesis",
    systemPrompt: "You are a high-speed analyst. Prioritize the strongest answer quickly without losing key details.",
  },
  {
    id: "gemini-25-pro",
    name: "Gemini 2.5 Pro",
    model: "gemini-2.5-pro",
    provider: "google",
    specialty: "Complex reasoning, multimodal analysis, large context",
    systemPrompt: "You are an expert analyst. Provide thorough, well-structured analysis. Be specific with data and reasoning.",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    model: "gpt-4o",
    provider: "openai",
    specialty: "Nuanced reasoning, accuracy, broad knowledge",
    systemPrompt: "You are a precision analyst. Provide accurate, nuanced analysis. Identify edge cases and risks others might miss.",
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    model: "gpt-4o-mini",
    provider: "openai",
    specialty: "Balanced speed and quality, efficient second-pass analysis",
    systemPrompt: "You are a balanced analyst. Deliver a sharp, reliable answer with strong practical judgment and minimal waste.",
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4.5",
    model: "claude-sonnet-4-5",
    provider: "anthropic",
    specialty: "Deep analysis, code generation, careful reasoning",
    systemPrompt: "You are a meticulous analyst. Provide careful, thorough reasoning. Consider multiple perspectives and potential pitfalls.",
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku 4",
    model: "claude-haiku-4",
    provider: "anthropic",
    specialty: "Fast analysis, summarization, quick decisions",
    systemPrompt: "You are a rapid-response analyst. Provide quick, sharp insights. Cut to what matters most.",
  },
];

interface AgentResult {
  agentId: string;
  agentName: string;
  response: string;
  model: string;
  latencyMs: number;
  error?: string;
  skipped?: boolean;
}

// ---------------------------------------------------------------------------
// Provider-specific call helpers
// ---------------------------------------------------------------------------

async function callAnthropicAgent(
  agent: AgentConfig,
  agentMessages: Array<{ role: string; content: string }>,
  anthropicKey: string,
): Promise<string> {
  const anthropicMessages = agentMessages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const systemContent = agentMessages.find((m) => m.role === "system")?.content || "";

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model,
      max_tokens: 2048,
      system: systemContent,
      messages: anthropicMessages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  return data.content?.find((c: { type: string }) => c.type === "text")?.text || "";
}

async function callGoogleAgent(
  agent: AgentConfig,
  agentMessages: Array<{ role: string; content: string }>,
  googleKey: string,
): Promise<string> {
  // Build system instruction and conversation turns
  const systemMsg = agentMessages.find((m) => m.role === "system");
  const conversationMsgs = agentMessages.filter((m) => m.role !== "system");

  // Map roles: "user" → "user", "assistant" → "model"
  const contents = conversationMsgs.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const requestBody: Record<string, unknown> = { contents };
  if (systemMsg) {
    requestBody.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }
  requestBody.generationConfig = { maxOutputTokens: 2048 };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${agent.model}:generateContent?key=${googleKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google AI ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text ||
    data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ||
    ""
  );
}

async function callOpenAIAgent(
  agent: AgentConfig,
  agentMessages: Array<{ role: string; content: string }>,
  openaiKey: string,
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${openaiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: agent.model,
      max_tokens: 2048,
      messages: agentMessages,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI ${res.status}: ${errText.substring(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || "";
}

// ---------------------------------------------------------------------------
// Main agent dispatch
// ---------------------------------------------------------------------------

async function callAgent(
  agent: AgentConfig,
  messages: Array<{ role: string; content: string }>,
  taskContext: string,
  anthropicKey: string,
  googleKey: string,
  openaiKey: string,
): Promise<AgentResult> {
  const start = Date.now();

  // Skip agents whose API key is not configured
  if (agent.provider === "google" && !googleKey) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      response: "",
      model: agent.model,
      latencyMs: 0,
      skipped: true,
      error: "GOOGLE_AI_KEY not configured — skipping",
    };
  }
  if (agent.provider === "openai" && !openaiKey) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      response: "",
      model: agent.model,
      latencyMs: 0,
      skipped: true,
      error: "OPENAI_API_KEY not configured — skipping",
    };
  }

  const agentMessages = [
    {
      role: "system" as const,
      content: `${agent.systemPrompt}\n\nYour specialty: ${agent.specialty}\n\nTask context: ${taskContext}\n\nProvide your best analysis. Another AI will synthesize all agent responses into a unified answer, so focus on your unique perspective and strengths.`,
    },
    ...messages,
  ];

  try {
    let responseText: string;

    if (agent.provider === "anthropic") {
      responseText = await callAnthropicAgent(agent, agentMessages, anthropicKey);
    } else if (agent.provider === "google") {
      responseText = await callGoogleAgent(agent, agentMessages, googleKey);
    } else {
      responseText = await callOpenAIAgent(agent, agentMessages, openaiKey);
    }

    return {
      agentId: agent.id,
      agentName: agent.name,
      response: responseText,
      model: agent.model,
      latencyMs: Date.now() - start,
    };
  } catch (error) {
    return {
      agentId: agent.id,
      agentName: agent.name,
      response: "",
      model: agent.model,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ---------------------------------------------------------------------------
// Judge / synthesizer — always Claude (Anthropic)
// ---------------------------------------------------------------------------

async function synthesize(
  agentResults: AgentResult[],
  originalMessages: Array<{ role: string; content: string }>,
  taskContext: string,
): Promise<string> {
  const successfulResults = agentResults.filter((r) => r.response && !r.error && !r.skipped);

  if (successfulResults.length === 0) {
    return "All agents failed to respond. Please try again.";
  }

  if (successfulResults.length === 1) {
    return successfulResults[0].response;
  }

  const agentContributions = successfulResults
    .map((r) => `### ${r.agentName} (${r.model})\n${r.response}`)
    .join("\n\n---\n\n");

  const lastUserMessage =
    [...originalMessages].reverse().find((m) => m.role === "user")?.content || "";

  const judgePrompt = `You are a Meta-Judge AI. Multiple specialist AI agents have analyzed the same request in parallel. Your job is to synthesize the BEST possible unified response.

## Original User Request
${lastUserMessage}

## Task Context
${taskContext}

## Agent Responses
${agentContributions}

## Your Instructions
1. Analyze ALL agent responses for accuracy, depth, and unique insights
2. Identify where agents AGREE (high-confidence conclusions)
3. Identify where agents DISAGREE (flag these with reasoning)
4. Synthesize a single response that is BETTER than any individual agent
5. Include the best insights from each agent
6. Resolve contradictions with the most logical reasoning
7. Be comprehensive but concise — no fluff

Produce the final, definitive answer. Do NOT mention the agents or the synthesis process — just deliver the best possible response as if you are the ultimate expert.`;

  try {
    const data = await callAI({
      messages: [
        {
          role: "system",
          content:
            "You are the Meta-Judge: you synthesize multiple AI perspectives into one superior answer.",
        },
        { role: "user", content: judgePrompt },
      ],
    });
    return data.choices?.[0]?.message?.content || successfulResults[0].response;
  } catch {
    // Fallback: return the longest successful response
    return successfulResults.sort((a, b) => b.response.length - a.response.length)[0].response;
  }
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { messages, taskContext = "general", agents: requestedAgents } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Validate messages
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return new Response(
          JSON.stringify({ error: "Each message must have role and content." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Message too long (max 10000 chars)." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Rate limiting: 10/hour for orchestrator (expensive — multiple models per call)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count } = await supabaseClient
      .from("ai_generation_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("function_name", "multi-agent-orchestrator")
      .gte("created_at", oneHourAgo);

    const used = count || 0;
    const limit = 10;

    if (used >= limit) {
      return new Response(
        JSON.stringify({
          error: `Orchestrator rate limit exceeded: ${used}/${limit} calls this hour.`,
          rate_limit: { used, limit, remaining: 0 },
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // API keys — Anthropic is required; Google and OpenAI are optional (agents skipped if absent)
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const GOOGLE_AI_KEY = Deno.env.get("GOOGLE_AI_KEY") || "";
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";

    // Log the call
    await supabaseClient.from("ai_generation_logs").insert({
      user_id: user.id,
      function_name: "multi-agent-orchestrator",
    });

    // Select which agents to use
    let activeAgents = AGENTS;
    if (requestedAgents && Array.isArray(requestedAgents) && requestedAgents.length > 0) {
      activeAgents = AGENTS.filter((a) => requestedAgents.includes(a.id));
      if (activeAgents.length === 0) activeAgents = AGENTS;
    }

    console.log(
      `Orchestrator: fanning out to ${activeAgents.length} agents for user ${user.id}` +
        ` (google_key=${GOOGLE_AI_KEY ? "set" : "missing"}, openai_key=${OPENAI_API_KEY ? "set" : "missing"})`,
    );
    const orchestratorStart = Date.now();

    // Fan out to ALL agents in parallel using Promise.allSettled
    const agentSettled = await Promise.allSettled(
      activeAgents.map((agent) =>
        callAgent(agent, messages, taskContext, ANTHROPIC_API_KEY, GOOGLE_AI_KEY, OPENAI_API_KEY)
      ),
    );

    // Flatten settled results — callAgent never throws (errors are captured inside), so all
    // promises should fulfil. We still handle rejections defensively.
    const agentResults: AgentResult[] = agentSettled.map((settled, i) => {
      if (settled.status === "fulfilled") return settled.value;
      return {
        agentId: activeAgents[i].id,
        agentName: activeAgents[i].name,
        response: "",
        model: activeAgents[i].model,
        latencyMs: 0,
        error: `Unexpected rejection: ${String(settled.reason)}`,
      };
    });

    const fanOutMs = Date.now() - orchestratorStart;

    const skippedCount = agentResults.filter((r) => r.skipped).length;
    const successCount = agentResults.filter((r) => !r.error && !r.skipped).length;
    const failCount = agentResults.filter((r) => r.error && !r.skipped).length;

    console.log(
      `Orchestrator: ${successCount} succeeded, ${failCount} failed, ${skippedCount} skipped in ${fanOutMs}ms. Synthesizing...`,
    );

    // Synthesize the best response using Claude as the judge
    const synthStart = Date.now();
    const synthesizedResponse = await synthesize(agentResults, messages, taskContext);
    const synthMs = Date.now() - synthStart;

    const totalMs = Date.now() - orchestratorStart;

    return new Response(
      JSON.stringify({
        response: synthesizedResponse,
        orchestrator: {
          agents_queried: activeAgents.length,
          agents_succeeded: successCount,
          agents_failed: failCount,
          agents_skipped: skippedCount,
          fan_out_ms: fanOutMs,
          synthesis_ms: synthMs,
          total_ms: totalMs,
        },
        agent_contributions: agentResults.map((r) => ({
          agent: r.agentName,
          model: r.model,
          latency_ms: r.latencyMs,
          status: r.skipped ? "skipped" : r.error ? "failed" : "success",
          error: r.error || undefined,
          response_preview: r.response ? r.response.substring(0, 200) + "..." : null,
        })),
        rate_limit: { used: used + 1, limit, remaining: limit - used - 1 },
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(
      JSON.stringify({
        error: "Multi-agent orchestrator encountered an error. Please try again.",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
