// Central API client for Render backend calls
// Replaces Supabase edge function calls with direct Render FastAPI calls

const RENDER_URL = import.meta.env.VITE_RENDER_WORKER_URL || 'https://aiqtp-trading-service.onrender.com';

async function getAuthHeader(): Promise<string> {
  // Get Supabase JWT for auth header
  const { supabase } = await import('@/integrations/supabase/client');
  const { data: { session } } = await supabase.auth.getSession();
  return session ? `Bearer ${session.access_token}` : '';
}

async function renderPost<T>(path: string, body: unknown, requireAuth = true): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (requireAuth) headers['Authorization'] = await getAuthHeader();
  const res = await fetch(`${RENDER_URL}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

async function renderGet<T>(path: string, requireAuth = true): Promise<T> {
  const headers: Record<string, string> = {};
  if (requireAuth) headers['Authorization'] = await getAuthHeader();
  const res = await fetch(`${RENDER_URL}${path}`, { headers });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

export const renderApi = {
  payments: {
    createCheckout: (amountUsd: number, userId: string) =>
      renderPost<{ checkout_url: string; session_id: string }>('/payments/create-checkout', { amount_usd: amountUsd, user_id: userId }),
    history: (userId: string) =>
      renderGet<any[]>(`/payments/history/${userId}`),
  },
  withdrawals: {
    request: (amountUsd: number, userId: string, destinationType: string) =>
      renderPost<{ withdrawal_id: string; status: string }>('/withdrawals/request', { amount_usd: amountUsd, user_id: userId, destination_type: destinationType }),
    history: (userId: string) =>
      renderGet<any[]>(`/withdrawals/history/${userId}`),
  },
  ai: {
    chat: (messages: any[], tools?: any[]) =>
      renderPost<any>('/ai/chat', { messages, tools }),
  },
  health: () => renderGet<{ status: string }>('/health', false),
  arbitrage: {
    scan: (minProfitUsdt = 2) =>
      renderPost<any[]>('/arbitrage/scan', { min_profit_usdt: minProfitUsdt }),
    opportunities: () =>
      renderGet<any[]>('/arbitrage/opportunities', false),
    execute: (pair: string, buyExchange: string, sellExchange: string, amountUsdt: number) =>
      renderPost<any>('/arbitrage/execute', { pair, buy_exchange: buyExchange, sell_exchange: sellExchange, amount_usdt: amountUsdt }),
  },
  admin: {
    allStrategies: (filters?: { bot_type?: string; graduated?: boolean; active?: boolean; limit?: number }) => {
      const params = new URLSearchParams();
      if (filters?.bot_type) params.set('bot_type', filters.bot_type);
      if (filters?.graduated !== undefined) params.set('graduated', String(filters.graduated));
      if (filters?.active !== undefined) params.set('active', String(filters.active));
      if (filters?.limit) params.set('limit', String(filters.limit));
      const qs = params.toString();
      return renderGet<{ total: number; strategies: any[] }>(`/admin/strategy-registry${qs ? '?' + qs : ''}`);
    },
    leaderboard: (limit = 50) =>
      renderGet<{ total: number; leaderboard: any[] }>(`/admin/bots/leaderboard?limit=${limit}`),
    stats: () =>
      renderGet<{ total_bots: number; active_bots: number; graduated_bots: number; pending_graduation: number; bot_types: number; avg_quality: number; avg_reliability: number; total_records: number; total_earnings: number }>('/admin/bots/stats'),
  },
};
