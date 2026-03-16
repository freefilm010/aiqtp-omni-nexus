import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const ALPACA_PAPER_URL = 'https://paper-api.alpaca.markets';
const ALPACA_LIVE_URL = 'https://api.alpaca.markets';
const ALPACA_DATA_URL = 'https://data.alpaca.markets';

interface AlpacaRequest {
  action: 'get_account' | 'place_order' | 'cancel_order' | 'get_orders' | 'get_positions' | 'get_bars' | 'get_quote' | 'get_assets' | 'close_position';
  mode: 'paper' | 'live';
  params?: Record<string, unknown>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY');
    const ALPACA_API_SECRET = Deno.env.get('ALPACA_API_SECRET');

    if (!ALPACA_API_KEY || !ALPACA_API_SECRET) {
      return new Response(
        JSON.stringify({ success: false, error: 'Alpaca API keys not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, mode = 'paper', params = {} }: AlpacaRequest = await req.json();
    const baseUrl = mode === 'live' ? ALPACA_LIVE_URL : ALPACA_PAPER_URL;

    const headers: Record<string, string> = {
      'APCA-API-KEY-ID': ALPACA_API_KEY.replace(/[^\x20-\x7E]/g, ''),
      'APCA-API-SECRET-KEY': ALPACA_API_SECRET.replace(/[^\x20-\x7E]/g, ''),
      'Content-Type': 'application/json',
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let result: unknown;

    try {
      switch (action) {
        case 'get_account': {
          const resp = await fetch(`${baseUrl}/v2/account`, { headers, signal: controller.signal });
          if (!resp.ok) throw new Error(`Alpaca account error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'place_order': {
          const orderBody = {
            symbol: params.symbol,
            qty: params.quantity,
            side: params.side,
            type: params.type || 'market',
            time_in_force: params.timeInForce || 'day',
            ...(params.limitPrice && { limit_price: params.limitPrice }),
            ...(params.stopPrice && { stop_price: params.stopPrice }),
          };
          const resp = await fetch(`${baseUrl}/v2/orders`, {
            method: 'POST',
            headers,
            body: JSON.stringify(orderBody),
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`Alpaca order error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'cancel_order': {
          const resp = await fetch(`${baseUrl}/v2/orders/${params.orderId}`, {
            method: 'DELETE',
            headers,
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`Alpaca cancel error [${resp.status}]: ${await resp.text()}`);
          result = { cancelled: true, orderId: params.orderId };
          break;
        }

        case 'get_orders': {
          const status = params.status || 'open';
          const resp = await fetch(`${baseUrl}/v2/orders?status=${status}&limit=50`, { headers, signal: controller.signal });
          if (!resp.ok) throw new Error(`Alpaca orders error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'get_positions': {
          const resp = await fetch(`${baseUrl}/v2/positions`, { headers, signal: controller.signal });
          if (!resp.ok) throw new Error(`Alpaca positions error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'close_position': {
          const resp = await fetch(`${baseUrl}/v2/positions/${params.symbol}`, {
            method: 'DELETE',
            headers,
            signal: controller.signal,
          });
          if (!resp.ok) throw new Error(`Alpaca close error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'get_bars': {
          const symbol = params.symbol || 'AAPL';
          const timeframe = params.timeframe || '1Day';
          const limit = params.limit || 100;
          const resp = await fetch(
            `${ALPACA_DATA_URL}/v2/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}`,
            { headers, signal: controller.signal }
          );
          if (!resp.ok) throw new Error(`Alpaca bars error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'get_quote': {
          const symbol = params.symbol || 'AAPL';
          const resp = await fetch(
            `${ALPACA_DATA_URL}/v2/stocks/${symbol}/quotes/latest`,
            { headers, signal: controller.signal }
          );
          if (!resp.ok) throw new Error(`Alpaca quote error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        case 'get_assets': {
          const assetClass = params.assetClass || 'us_equity';
          const resp = await fetch(
            `${baseUrl}/v2/assets?asset_class=${assetClass}&status=active`,
            { headers, signal: controller.signal }
          );
          if (!resp.ok) throw new Error(`Alpaca assets error [${resp.status}]: ${await resp.text()}`);
          result = await resp.json();
          break;
        }

        default:
          return new Response(
            JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }
    } finally {
      clearTimeout(timeout);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Alpaca trading error:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
