import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

type Allocation = {
  id: string;
  engine_id: string;
  asset_symbol: string;
  quantity: number | string | null;
  value_usd: number | string | null;
  pnl_usd: number | string | null;
  updated_at: string | null;
  created_at: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const toNumber = (value: number | string | null) => {
  if (value === null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const byNewestFirst = (a: Allocation, b: Allocation) => {
  const aUpdated = Date.parse(a.updated_at ?? a.created_at ?? "1970-01-01T00:00:00.000Z");
  const bUpdated = Date.parse(b.updated_at ?? b.created_at ?? "1970-01-01T00:00:00.000Z");
  if (bUpdated !== aUpdated) return bUpdated - aUpdated;
  return a.id.localeCompare(b.id);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const repairToken = Deno.env.get("AUTO_INVEST_REPAIR_TOKEN");

    if (!supabaseUrl || !serviceRoleKey || !repairToken) {
      throw new Error("Missing backend environment configuration");
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;

    let isAuthorized = req.headers.get("x-repair-token") === repairToken;

    if (!isAuthorized && bearerToken) {
      const { data: userData } = await adminClient.auth.getUser(bearerToken);
      const userId = userData.user?.id;

      if (userId) {
        const { data: roleRows, error: roleError } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .eq("role", "admin")
          .limit(1);

        if (roleError) throw roleError;
        isAuthorized = Boolean(roleRows?.length);
      }
    }

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: allocations, error: allocationError } = await adminClient
      .from("auto_invest_allocations")
      .select("id,engine_id,asset_symbol,quantity,value_usd,pnl_usd,updated_at,created_at")
      .eq("is_active", true)
      .limit(100000);

    if (allocationError) throw allocationError;

    const groups = new Map<string, Allocation[]>();
    for (const allocation of (allocations ?? []) as Allocation[]) {
      const key = `${allocation.engine_id}:${allocation.asset_symbol}`;
      const group = groups.get(key) ?? [];
      group.push(allocation);
      groups.set(key, group);
    }

    let groupsRepaired = 0;
    let rowsDeactivated = 0;
    let keepersUpdated = 0;

    for (const group of groups.values()) {
      if (group.length <= 1) continue;

      group.sort(byNewestFirst);
      const keeper = group[0];
      if (!keeper) continue;

      const duplicateIds = group.slice(1).map((allocation) => allocation.id);
      const totals = group.reduce(
        (acc, allocation) => ({
          quantity: acc.quantity + toNumber(allocation.quantity),
          value_usd: acc.value_usd + toNumber(allocation.value_usd),
          pnl_usd: acc.pnl_usd + toNumber(allocation.pnl_usd),
        }),
        { quantity: 0, value_usd: 0, pnl_usd: 0 },
      );

      const { error: keeperError } = await adminClient
        .from("auto_invest_allocations")
        .update({
          quantity: totals.quantity,
          value_usd: totals.value_usd,
          pnl_usd: totals.pnl_usd,
          updated_at: new Date().toISOString(),
        })
        .eq("id", keeper.id);
      if (keeperError) throw keeperError;
      keepersUpdated += 1;

      for (let i = 0; i < duplicateIds.length; i += 500) {
        const chunk = duplicateIds.slice(i, i + 500);
        const { error: duplicateError } = await adminClient
          .from("auto_invest_allocations")
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .in("id", chunk);
        if (duplicateError) throw duplicateError;
        rowsDeactivated += chunk.length;
      }

      groupsRepaired += 1;
    }

    return new Response(JSON.stringify({ ok: true, groupsRepaired, keepersUpdated, rowsDeactivated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown repair failure";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
