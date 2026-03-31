import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TradeRequest {
  action: 'place_order' | 'cancel_order' | 'get_orders' | 'get_positions';
  params: {
    symbol?: string;
    side?: 'buy' | 'sell';
    type?: 'market' | 'limit' | 'stop' | 'stop_limit';
    quantity?: number;
    price?: number;
    stopPrice?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    mode?: 'paper' | 'live';
    exchangeAccountId?: string;
    orderId?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate user
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

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { action, params }: TradeRequest = await req.json();

    console.log(`Trade execute action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'place_order': {
        const { symbol, side, type, quantity, price, stopPrice, timeInForce, mode, exchangeAccountId } = params;

        if (!symbol || !side || !type || !quantity) {
          return new Response(
            JSON.stringify({ success: false, error: 'Missing required fields: symbol, side, type, quantity' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const orderMode = mode || 'live';
        const orderId = `ord_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

        if (orderMode !== 'live') {
          // Reject non-live modes — platform is production-only
          return new Response(
            JSON.stringify({ success: false, error: 'Only live trading is supported. Connect an exchange account to execute trades.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!exchangeAccountId) {
          // No exchange connected — cannot execute
          return new Response(
            JSON.stringify({ success: false, error: 'Exchange connection required. Connect an exchange account in Settings → Connections.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }


        // Live trading - fetch exchange account and execute

          // Fetch exchange account metadata
          const { data: account, error: accountError } = await supabase
            .from('connected_accounts')
            .select('id, account_name, account_type, status')
            .eq('id', exchangeAccountId)
            .eq('user_id', user.id)
            .single();

          if (accountError || !account) {
            return new Response(
              JSON.stringify({ success: false, error: 'Exchange account not found or not authorized' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Fetch API key from secure vault
          const { data: vault } = await supabase
            .from('account_key_vault')
            .select('api_key_encrypted')
            .eq('account_id', exchangeAccountId)
            .single();

          const apiKey = vault?.api_key_encrypted || '';
          const exchangeType = account.account_type;

          // Route to appropriate exchange
          let exchangeResult;
          try {
            switch (exchangeType.toLowerCase()) {
              case 'binance':
                exchangeResult = await executeBinanceOrder({
                  symbol,
                  side,
                  type,
                  quantity,
                  price,
                  apiKey,
                  apiSecret: Deno.env.get(`${account.account_name}_API_SECRET`) || ''
                });
                break;
              case 'coinbase':
                exchangeResult = await executeCoinbaseOrder({
                  symbol,
                  side,
                  type,
                  quantity,
                  price,
                  apiKey,
                  apiSecret: Deno.env.get(`${account.account_name}_API_SECRET`) || ''
                });
                break;
              default:
                return new Response(
                  JSON.stringify({ success: false, error: `Exchange ${exchangeType} not yet supported for live trading` }),
                  { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
          } catch (exchangeError: any) {
            console.error('Exchange execution error:', exchangeError);
            
            // Log failed trade attempt
            await supabase.from('trade_logs').insert({
              user_id: user.id,
              exchange_account_id: exchangeAccountId,
              action: 'place_order',
              symbol,
              side,
              quantity,
              status: 'failed',
              error_message: exchangeError.message,
              created_at: new Date().toISOString()
            });

            return new Response(
              JSON.stringify({ success: false, error: `Exchange error: ${exchangeError.message}` }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Log successful trade
          await supabase.from('trade_logs').insert({
            user_id: user.id,
            exchange_account_id: exchangeAccountId,
            action: 'place_order',
            symbol,
            side,
            quantity,
            price: exchangeResult.filledPrice,
            status: 'success',
            exchange_order_id: exchangeResult.orderId,
            created_at: new Date().toISOString()
          });

          return new Response(
            JSON.stringify({ 
              success: true, 
              order: {
                orderId: exchangeResult.orderId,
                symbol,
                side,
                type,
                quantity,
                filledPrice: exchangeResult.filledPrice,
                status: exchangeResult.status,
                mode: 'live',
                exchange: exchangeType,
                message: 'Live trade executed successfully'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }

      case 'cancel_order': {
        const { orderId, exchangeAccountId, mode } = params;

        if (!orderId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Order ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!exchangeAccountId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Exchange connection required to cancel orders.' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Live order cancellation would go to exchange API
        return new Response(
          JSON.stringify({ success: false, error: 'Live order cancellation not yet implemented' }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_orders': {
        // Fetch from portfolio_holdings (real positions only)
        const { data: holdings, error } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch orders' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, orders: holdings || [], mode: 'live' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_positions': {
        // Fetch from portfolio_holdings (real positions only)
        const { data: positions, error } = await supabase
          .from('portfolio_holdings')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch positions' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, positions: positions || [], mode: 'live' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error: any) {
    console.error('Trade execution error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Exchange-specific order execution functions
async function executeBinanceOrder(params: {
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price?: number;
  apiKey: string;
  apiSecret: string;
}): Promise<{ orderId: string; filledPrice: number; status: string }> {
  // Binance API integration
  // This is a placeholder - real implementation would use Binance API
  const timestamp = Date.now();
  const baseUrl = 'https://api.binance.com';
  
  // For now, return a mock response indicating exchange integration needed
  throw new Error('Binance API integration requires API keys. Please configure in account settings.');
}

async function executeCoinbaseOrder(params: {
  symbol: string;
  side: string;
  type: string;
  quantity: number;
  price?: number;
  apiKey: string;
  apiSecret: string;
}): Promise<{ orderId: string; filledPrice: number; status: string }> {
  // Coinbase API integration
  // This is a placeholder - real implementation would use Coinbase API
  throw new Error('Coinbase API integration requires API keys. Please configure in account settings.');
}