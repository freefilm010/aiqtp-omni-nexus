import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

        const orderMode = mode || 'paper';
        const orderId = `ord_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;

        if (orderMode === 'paper') {
          // Paper trading - record in database without real execution
          const { data: order, error: insertError } = await supabase
            .from('paper_trades')
            .insert({
              id: orderId,
              user_id: user.id,
              symbol,
              side,
              order_type: type,
              quantity,
              price: price || null,
              stop_price: stopPrice || null,
              time_in_force: timeInForce || 'GTC',
              status: 'filled', // Paper trades fill immediately
              filled_quantity: quantity,
              filled_price: price || 0, // Will need to fetch current price
              created_at: new Date().toISOString(),
              executed_at: new Date().toISOString()
            })
            .select()
            .single();

          if (insertError) {
            console.error('Paper trade insert error:', insertError);
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to record paper trade' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Update paper portfolio
          const portfolioUpdate = side === 'buy'
            ? { amount: quantity, avg_price: price || 0 }
            : { amount: -quantity };

          const { error: portfolioError } = await supabase.rpc('update_paper_portfolio', {
            p_user_id: user.id,
            p_symbol: symbol,
            p_amount_change: portfolioUpdate.amount,
            p_price: portfolioUpdate.avg_price || 0
          });

          if (portfolioError) {
            console.error('Portfolio update error:', portfolioError);
          }

          return new Response(
            JSON.stringify({ 
              success: true, 
              order: {
                orderId,
                symbol,
                side,
                type,
                quantity,
                status: 'filled',
                mode: 'paper',
                message: 'Paper trade executed successfully'
              }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          // Live trading - requires connected exchange account
          if (!exchangeAccountId) {
            return new Response(
              JSON.stringify({ success: false, error: 'Exchange account ID required for live trading' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Fetch exchange credentials
          const { data: account, error: accountError } = await supabase
            .from('connected_accounts')
            .select('*')
            .eq('id', exchangeAccountId)
            .eq('user_id', user.id)
            .single();

          if (accountError || !account) {
            return new Response(
              JSON.stringify({ success: false, error: 'Exchange account not found or not authorized' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Decrypt API key (in production, use proper encryption)
          const apiKey = account.api_key_encrypted; // This should be properly decrypted
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
      }

      case 'cancel_order': {
        const { orderId, exchangeAccountId, mode } = params;

        if (!orderId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Order ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (mode === 'paper' || !exchangeAccountId) {
          // Cancel paper order
          const { error } = await supabase
            .from('paper_trades')
            .update({ status: 'cancelled' })
            .eq('id', orderId)
            .eq('user_id', user.id);

          if (error) {
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to cancel order' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Paper order cancelled' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Live order cancellation would go to exchange API
        return new Response(
          JSON.stringify({ success: false, error: 'Live order cancellation not yet implemented' }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_orders': {
        const { mode } = params;

        if (mode === 'paper' || !params.exchangeAccountId) {
          const { data: orders, error } = await supabase
            .from('paper_trades')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(100);

          if (error) {
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to fetch orders' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, orders: orders || [], mode: 'paper' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Live orders would fetch from exchange API
        return new Response(
          JSON.stringify({ success: false, error: 'Live order fetching not yet implemented' }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_positions': {
        const { mode } = params;

        if (mode === 'paper' || !params.exchangeAccountId) {
          const { data: positions, error } = await supabase
            .from('paper_portfolio')
            .select('*')
            .eq('user_id', user.id);

          if (error) {
            return new Response(
              JSON.stringify({ success: false, error: 'Failed to fetch positions' }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, positions: positions || [], mode: 'paper' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Live positions would fetch from exchange API
        return new Response(
          JSON.stringify({ success: false, error: 'Live position fetching not yet implemented' }),
          { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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