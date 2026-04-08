import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Multi-Agent Orchestrator
 * 
 * Fans out a prompt to multiple AI models in parallel, collects all responses,
 * then uses a judge model to synthesize the best unified answer.
 * 
 * Flow:
 *   1. Receive task + messages
 *   2. Fan out to N specialist agents concurrently (Claude, GPT-5, Gemini Pro, etc.)
 *   3. Collect all responses
 *   4. Judge model synthesizes the best unified response
 *   5. Return final answer + individual agent contributions
 */

interface AgentConfig {
  id: string;
  name: string;
  model: string;
  provider: "lovable" | "anthropic";
  specialty: string;
  systemPrompt: string;
}

const AGENTS: AgentConfig[] = [
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    model: "google/gemini-2.5-pro",
    provider: "lovable",
    specialty: "Complex reasoning, multimodal analysis, large context",
    systemPrompt: "You are an expert analyst. Provide thorough, well-structured analysis. Be specific with data and reasoning."
  },
  {
    id: "gemini-flash",
    name: "Gemini Flash",
    model: "google/gemini-3-flash-preview",
    provider: "lovable",
    specialty: "Speed, efficiency, quick pattern recognition",
    systemPrompt: "You are a fast-thinking analyst. Provide concise, actionable insights. Focus on the most important points."
  },
  {
    id: "gpt5",
    name: "GPT-5",
    model: "openai/gpt-5",
    provider: "lovable",
    specialty: "Nuanced reasoning, accuracy, broad knowledge",
    systemPrompt: "You are a precision analyst. Provide accurate, nuanced analysis. Identify edge cases and risks others might miss."
  },
  {
    id: "gpt52",
    name: "GPT-5.2",
    model: "openai/gpt-5.2",
    provider: "lovable",
    specialty: "Enhanced reasoning, complex problem-solving",
    systemPrompt: "You are an advanced reasoning engine. Break down complex problems step by step. Provide the deepest level of analysis."
  },
  {
    id: "claude-sonnet",
    name: "Claude Sonnet 4.5",
    model: "claude-sonnet-4-5",
    provider: "anthropic",
    specialty: "Deep analysis, code generation, careful reasoning",
    systemPrompt: "You are a meticulous analyst. Provide careful, thorough reasoning. Consider multiple perspectives and potential pitfalls."
  },
  {
    id: "claude-haiku",
    name: "Claude Haiku 4",
    model: "claude-haiku-4",
    provider: "anthropic",
    specialty: "Fast analysis, summarization, quick decisions",
    systemPrompt: "You are a rapid-response analyst. Provide quick, sharp insights. Cut to what matters most."
  },
];

// Call a single agent
async function callAgent(
  agent: AgentConfig,
  messages: Array<{ role: string; content: string }>,
  taskContext: string,
  lovableKey: string,
  anthropicKey: string
): Promise<{ agentId: string; agentName: string; response: string; model: string; latencyMs: number; error?: string }> {
  const start = Date.now();

  const agentMessages = [
    {
      role: "system" as const,
      content: `${agent.systemPrompt}\n\nYour specialty: ${agent.specialty}\n\nTask context: ${taskContext}\n\nProvide your best analysis. Another AI will synthesize all agent responses into a unified answer, so focus on your unique perspective and strengths.`
    },
    ...messages
  ];

  try {
    let responseText: string;

    if (agent.provider === "anthropic") {
      const anthropicMessages = agentMessages
        .filter(m => m.role !== "system")
        .map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

      const systemContent = agentMessages.find(m => m.role === "system")?.content || "";

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
      responseText = data.content?.find((c: any) => c.type === "text")?.text || "";
    } else {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: agent.model,
          messages: agentMessages,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gateway ${res.status}: ${errText.substring(0, 200)}`);
      }

      const data = await res.json();
      responseText = data.choices?.[0]?.message?.content || "";
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
      error: error.message,
    };
  }
}

// Judge model synthesizes all responses
async function synthesize(
  agentResults: Array<{ agentId: string; agentName: string; response: string; model: string; error?: string }>,
  originalMessages: Array<{ role: string; content: string }>,
  taskContext: string,
  lovableKey: string
): Promise<string> {
  const successfulResults = agentResults.filter(r => r.response && !r.error);

  if (successfulResults.length === 0) {
    return "All agents failed to respond. Please try again.";
  }

  if (successfulResults.length === 1) {
    return successfulResults[0].response;
  }

  const agentContributions = successfulResults
    .map(r => `### ${r.agentName} (${r.model})\n${r.response}`)
    .join("\n\n---\n\n");

  const lastUserMessage = [...originalMessages].reverse().find(m => m.role === "user")?.content || "";

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

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: "You are the Meta-Judge: you synthesize multiple AI perspectives into one superior answer." },
        { role: "user", content: judgePrompt }
      ],
    }),
  });

  if (!res.ok) {
    // Fallback: return the longest successful response
    return successfulResults.sort((a, b) => b.response.length - a.response.length)[0].response;
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || successfulResults[0].response;
}

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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { messages, taskContext = "general", agents: requestedAgents } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate messages
    for (const msg of messages) {
      if (!msg.role || !msg.content || typeof msg.content !== "string") {
        return new Response(
          JSON.stringify({ error: "Each message must have role and content." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Message too long (max 10000 chars)." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Rate limiting: 10/hour for orchestrator (it's expensive — multiple models per call)
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
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    // Log the call
    await supabaseClient.from("ai_generation_logs").insert({
      user_id: user.id,
      function_name: "multi-agent-orchestrator",
    });

    // Select which agents to use
    let activeAgents = AGENTS;
    if (requestedAgents && Array.isArray(requestedAgents) && requestedAgents.length > 0) {
      activeAgents = AGENTS.filter(a => requestedAgents.includes(a.id));
      if (activeAgents.length === 0) activeAgents = AGENTS;
    }

    console.log(`Orchestrator: fanning out to ${activeAgents.length} agents for user ${user.id}`);
    const orchestratorStart = Date.now();

    // Fan out to ALL agents in parallel
    const agentPromises = activeAgents.map(agent =>
      callAgent(agent, messages, taskContext, LOVABLE_API_KEY, ANTHROPIC_API_KEY)
    );

    const agentResults = await Promise.all(agentPromises);
    const fanOutMs = Date.now() - orchestratorStart;

    const successCount = agentResults.filter(r => !r.error).length;
    const failCount = agentResults.filter(r => r.error).length;

    console.log(`Orchestrator: ${successCount} succeeded, ${failCount} failed in ${fanOutMs}ms. Synthesizing...`);

    // Synthesize the best response
    const synthStart = Date.now();
    const synthesizedResponse = await synthesize(agentResults, messages, taskContext, LOVABLE_API_KEY);
    const synthMs = Date.now() - synthStart;

    const totalMs = Date.now() - orchestratorStart;

    return new Response(JSON.stringify({
      response: synthesizedResponse,
      orchestrator: {
        agents_queried: activeAgents.length,
        agents_succeeded: successCount,
        agents_failed: failCount,
        fan_out_ms: fanOutMs,
        synthesis_ms: synthMs,
        total_ms: totalMs,
      },
      agent_contributions: agentResults.map(r => ({
        agent: r.agentName,
        model: r.model,
        latency_ms: r.latencyMs,
        status: r.error ? "failed" : "success",
        error: r.error || undefined,
        response_preview: r.response ? r.response.substring(0, 200) + "..." : null,
      })),
      rate_limit: { used: used + 1, limit, remaining: limit - used - 1 },
      timestamp: new Date().toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Orchestrator error:", error);
    return new Response(JSON.stringify({
      error: "Multi-agent orchestrator encountered an error. Please try again.",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
