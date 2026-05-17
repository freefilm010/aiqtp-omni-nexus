/**
 * renderApi.ts — HTTP client for the AIQTP Trading Service on Render.
 *
 * Routes agent_directives and strategy_registry writes/reads through
 * the trading-service FastAPI layer so they land in Render PostgreSQL
 * instead of Supabase cloud (bypassing the 90-day inactivity pause).
 *
 * Set VITE_RENDER_WORKER_URL in your env to the trading-service base URL.
 * Falls back to /api (Vite proxy) for local development.
 */

const BASE = ((import.meta.env.VITE_RENDER_WORKER_URL as string | undefined) ?? "https://aiqtp-trading-service.onrender.com").replace(/\/$/, "");

async function _authHeader(): Promise<string> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Not authenticated");
  }
  return `Bearer ${session.access_token}`;
}

async function _post(path: string, body: unknown, _userId?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: await _authHeader(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Render trading-service ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

async function _patch(path: string, body: unknown, _userId?: string) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: await _authHeader(),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Render trading-service ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

async function _get(path: string, _userId?: string) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: await _authHeader() },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Render trading-service ${path}: ${res.status} ${text}`);
  }
  return res.json();
}

// ── Agent Directives ──────────────────────────────────────────────────────────

export interface DirectiveRow {
  id: string;
  tool: string;
  status: "pending" | "running" | "done" | "error";
  result: Record<string, unknown> | null;
  error_msg: string | null;
  created_at: string;
}

export async function getAgentDirectives(userId: string): Promise<DirectiveRow[]> {
  const data = await _get(`/agent-directives?limit=10`, userId);
  return Array.isArray(data) ? data : [];
}

export async function createDirective(
  userId: string,
  tool: string,
  agentType: string,
  params: Record<string, unknown>,
): Promise<void> {
  await _post("/agent-directives", { tool, agent_type: agentType, params, status: "pending" }, userId);
}

/**
 * Poll agent-directives every intervalMs and call onUpdate with latest rows.
 * Returns a cleanup function — call it from useEffect return.
 */
export function pollDirectives(
  userId: string,
  onUpdate: (rows: DirectiveRow[]) => void,
  intervalMs = 5000,
): () => void {
  let cancelled = false;

  const poll = async () => {
    if (cancelled) return;
    try {
      const rows = await getAgentDirectives(userId);
      if (!cancelled) onUpdate(rows);
    } catch {
      // Non-fatal: worker may be starting up
    }
    if (!cancelled) setTimeout(poll, intervalMs);
  };

  poll();
  return () => { cancelled = true; };
}

// ── Strategy Registry ─────────────────────────────────────────────────────────

export interface StrategyRow {
  id: string;
  name: string;
  description: string | null;
  bot_type: string;
  data_category: string;
  collection_frequency: string;
  sources: string[];
  creator_profit_share: number;
  is_active: boolean;
  pending_graduation: boolean;
  is_graduated: boolean;
  quality_score: number;
  reliability_score: number;
  total_records_collected: number;
  total_earnings: number;
  created_at: string;
}

export async function getStrategies(userId: string): Promise<StrategyRow[]> {
  const data = await _get("/strategy-registry", userId);
  return Array.isArray(data) ? data : [];
}

export async function createStrategy(
  userId: string,
  payload: Omit<StrategyRow, "id" | "created_at" | "quality_score" | "reliability_score" | "total_records_collected" | "total_earnings" | "pending_graduation" | "is_graduated">,
): Promise<void> {
  await _post("/strategy-registry", payload, userId);
}

export async function updateStrategy(
  userId: string,
  id: string,
  patch: Partial<Pick<StrategyRow, "is_active" | "pending_graduation">>,
): Promise<void> {
  await _patch(`/strategy-registry/${id}`, patch, userId);
}
