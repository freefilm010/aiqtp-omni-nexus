import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

declare const process: { env: Record<string, string | undefined> };

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_strategies",
  title: "List my strategies",
  description: "List the signed-in user's AI trading strategies (id, name, is_active, is_graduated, quality_score).",
  inputSchema: {
    limit: z.number().int().min(1).max(100).optional().describe("Max rows to return (default 25)."),
    only_graduated: z.boolean().optional().describe("If true, return only graduated strategies."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ limit, only_graduated }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    let q = supabaseForUser(ctx)
      .from("ai_strategies")
      .select("id,name,is_active,is_graduated,quality_score,created_at")
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (only_graduated) q = q.eq("is_graduated", true);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { rows: data ?? [] },
    };
  },
});