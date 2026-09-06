// Shared Anthropic AI client. Accepts OpenAI-compatible request bodies so
// existing edge functions need minimal changes (just swap URL + auth header).

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 4096;

interface OAIMessage { role: string; content: string; }
interface OAITool { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown>; }; }
type OAIToolChoice = "auto" | "none" | "required" | { type: "function"; function: { name: string } };

interface OAIRequest {
  model?: string;
  messages: OAIMessage[];
  tools?: OAITool[];
  tool_choice?: OAIToolChoice;
  temperature?: number;
  max_tokens?: number;
}

type AIResponse = { choices: Array<{ message: { role: string; content: string | null; tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> } }> };

// OpenAI-compatible passthrough used for the free paths (self-hosted Ollama first,
// then the included AI gateway). Anthropic is only a last resort.
async function callOpenAICompatible(url: string, model: string, apiKey: string | null, body: OAIRequest): Promise<AIResponse> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: body.messages,
      ...(body.tools?.length ? { tools: body.tools } : {}),
      ...(body.tool_choice ? { tool_choice: body.tool_choice } : {}),
      ...(body.temperature !== undefined ? { temperature: body.temperature } : {}),
    }),
  });

  if (!res.ok) {
    throw new Error(`AI error ${res.status}: ${await res.text()}`);
  }
  return await res.json() as AIResponse;
}

// Converts OpenAI-format request to Anthropic format, calls Anthropic, returns OpenAI-format response.
export async function callAI(body: OAIRequest): Promise<AIResponse> {
  // 1) Free, self-hosted, uncapped: Ollama (Hermes / OpenClaw) when it is reachable.
  const ollamaBase = (Deno.env.get("OLLAMA_BASE_URL") ?? "").replace(/\/+$/, "");
  if (ollamaBase) {
    try {
      return await callOpenAICompatible(
        `${ollamaBase}/v1/chat/completions`,
        Deno.env.get("OLLAMA_MODEL") ?? "hermes3",
        Deno.env.get("OLLAMA_API_KEY") ?? null,
        body,
      );
    } catch (e) {
      console.error("Ollama call failed, falling back:", e instanceof Error ? e.message : e);
    }
  }

  // 2) Included AI gateway — no separate provider billing.
  const gatewayKey = Deno.env.get("LOVABLE_API_KEY");
  if (gatewayKey) {
    try {
      return await callOpenAICompatible(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        Deno.env.get("GATEWAY_MODEL") ?? "google/gemini-2.5-flash",
        gatewayKey,
        body,
      );
    } catch (e) {
      console.error("Gateway call failed, falling back:", e instanceof Error ? e.message : e);
    }
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("No AI backend available (set OLLAMA_BASE_URL, LOVABLE_API_KEY, or ANTHROPIC_API_KEY)");


  // Extract system message from messages array
  const systemMsg = body.messages.find(m => m.role === "system");
  const userMessages = body.messages.filter(m => m.role !== "system");

  // Convert OpenAI tools → Anthropic tools
  const anthropicTools = body.tools?.map(t => ({
    name: t.function.name,
    description: t.function.description,
    input_schema: t.function.parameters,
  }));

  // Convert tool_choice
  let anthropicToolChoice: Record<string, unknown> | undefined;
  if (body.tool_choice) {
    if (body.tool_choice === "auto") anthropicToolChoice = { type: "auto" };
    else if (body.tool_choice === "required") anthropicToolChoice = { type: "any" };
    else if (typeof body.tool_choice === "object" && body.tool_choice.type === "function") {
      anthropicToolChoice = { type: "tool", name: body.tool_choice.function.name };
    }
  }

  const anthropicBody: Record<string, unknown> = {
    model: DEFAULT_MODEL,
    max_tokens: body.max_tokens ?? MAX_TOKENS,
    messages: userMessages,
  };
  if (systemMsg) anthropicBody.system = systemMsg.content;
  if (anthropicTools?.length) anthropicBody.tools = anthropicTools;
  if (anthropicToolChoice) anthropicBody.tool_choice = anthropicToolChoice;
  if (body.temperature !== undefined) anthropicBody.temperature = body.temperature;

  const res = await fetch(ANTHROPIC_API, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(anthropicBody),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }

  const data = await res.json();

  // Convert Anthropic response → OpenAI-compatible format
  const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
  const textContent = data.content?.find((c: { type: string }) => c.type === "text");

  if (toolUse) {
    return {
      choices: [{
        message: {
          role: "assistant",
          content: null,
          tool_calls: [{
            id: toolUse.id,
            type: "function",
            function: {
              name: toolUse.name,
              arguments: JSON.stringify(toolUse.input),
            },
          }],
        },
      }],
    };
  }

  return {
    choices: [{
      message: {
        role: "assistant",
        content: textContent?.text ?? "",
      },
    }],
  };
}
