import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface TradeRequest {
  action: 'place_order' | 'cancel_order' | 'get_orders' | 'get_positions' | 'settle_trade';
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
    realizedPnlUsd?: number;
    rentalId?: string;
    tradeRef?: string;
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

        const { data: systemStatus, error: statusError } = await supabase
          .from('system_status')
          .select('active')
          .eq('key', 'main')
          .maybeSingle();
        if (statusError || systemStatus?.active !== true) {
          return new Response(
            JSON.stringify({ success: false, error: 'Trading is halted or system status is unavailable' }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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

          const exchangeType = account.account_name.toLowerCase().replace(/[^a-z0-9]/g, '');

          // Route all live orders through the Python trading service (CCXT).
          // CCXT supports 100+ exchanges — no per-exchange stub needed here.
          const workerUrl = Deno.env.get('RENDER_WORKER_URL') ?? 'https://aiqtp-trading-service.onrender.com';
          let exchangeResult;
          try {
            const ccxtRes = await fetch(`${workerUrl}/ccxt/live_order`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
              },
              body: JSON.stringify({
                exchange: exchangeType,
                symbol,
                side,
                order_type: type,
                amount: quantity,
                price: type === 'limit' ? price : undefined,
              }),
            });
            if (!ccxtRes.ok) {
              const errText = await ccxtRes.text();
              throw new Error(`Trading service error (${ccxtRes.status}): ${errText}`);
            }
            const ccxtData = await ccxtRes.json();
            exchangeResult = {
              orderId: ccxtData.id,
              filledPrice: ccxtData.average ?? ccxtData.price ?? null,
              status: ccxtData.status,
            };
            if (!exchangeResult.orderId || !exchangeResult.status) {
              throw new Error('Exchange response did not contain a verifiable order id and status');
            }
            const normalizedStatus = String(exchangeResult.status).toLowerCase();
            if (normalizedStatus === 'closed' && (!exchangeResult.filledPrice || exchangeResult.filledPrice <= 0)) {
              throw new Error('Exchange reported a closed order without a verifiable fill price');
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
            status: exchangeResult.status,
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
        const { orderId } = params;

        if (!orderId) {
          return new Response(
            JSON.stringify({ success: false, error: 'Order ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Look up the trade in trade_logs by exchange_order_id or by row id
        const { data: tradeRow, error: lookupError } = await supabase
          .from('trade_logs')
          .select('id, status, symbol, side, quantity, exchange_order_id, exchange_account_id')
          .eq('user_id', user.id)
          .or(`exchange_order_id.eq.${orderId},id.eq.${orderId}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (lookupError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to look up order' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!tradeRow) {
          return new Response(
            JSON.stringify({ success: false, error: `Order ${orderId} not found` }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const cancellableStatuses = ['pending', 'open'];
        if (!cancellableStatuses.includes(tradeRow.status)) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Cannot cancel order with status '${tradeRow.status}'. Only pending or open orders can be cancelled.`,
            }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        if (!tradeRow.exchange_order_id || !tradeRow.exchange_account_id) {
          return new Response(
            JSON.stringify({ success: false, error: 'Order lacks verified exchange identifiers' }),
            { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        const { data: cancelAccount, error: cancelAccountError } = await supabase
          .from('connected_accounts')
          .select('account_name')
          .eq('id', tradeRow.exchange_account_id)
          .eq('user_id', user.id)
          .single();
        if (cancelAccountError || !cancelAccount) {
          return new Response(
            JSON.stringify({ success: false, error: 'Exchange account not found or not authorized' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        const cancelWorkerUrl = Deno.env.get('RENDER_WORKER_URL') ?? 'https://aiqtp-trading-service.onrender.com';
        const cancelResponse = await fetch(`${cancelWorkerUrl}/ccxt/cancel_order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': authHeader },
          body: JSON.stringify({
            exchange: cancelAccount.account_name.toLowerCase().replace(/[^a-z0-9]/g, ''),
            order_id: tradeRow.exchange_order_id,
            symbol: tradeRow.symbol,
          }),
        });
        if (!cancelResponse.ok) {
          const details = await cancelResponse.text();
          return new Response(
            JSON.stringify({ success: false, error: `Exchange cancellation failed (${cancelResponse.status}): ${details}` }),
            { status: cancelResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        const { error: updateError } = await supabase
          .from('trade_logs')
          .update({ status: 'cancelled' })
          .eq('id', tradeRow.id)
          .eq('user_id', user.id);

        if (updateError) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to cancel order' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Order ${orderId} cancelled by user ${user.id}`);
        return new Response(
          JSON.stringify({
            success: true,
            message: `Order ${orderId} cancelled successfully`,
            order: {
              orderId: tradeRow.exchange_order_id ?? tradeRow.id,
              symbol: tradeRow.symbol,
              side: tradeRow.side,
              quantity: tradeRow.quantity,
              status: 'cancelled',
            },
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_orders': {
        const { data: orders, error } = await supabase
          .from('trade_logs')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['pending', 'open'])
          .order('created_at', { ascending: false });

        if (error) {
          return new Response(
            JSON.stringify({ success: false, error: 'Failed to fetch orders' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, orders: orders || [], mode: 'live' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_positions': {
        return new Response(
          JSON.stringify({ success: true, positions: [], mode: 'live', source: 'exchange_position_adapter_required' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'settle_trade': {
        // Record a realized close. If profit > 0, invoke record_profit_fee
        // which debits the user's USD balance for the tiered platform fee
        // (9/6/3/1%) and credits 25% to the strategy creator (when rented).
        const { symbol, realizedPnlUsd, rentalId, tradeRef } = params;

        if (typeof realizedPnlUsd !== 'number') {
          return new Response(
            JSON.stringify({ success: false, error: 'realizedPnlUsd is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Always log the close
        await supabase.from('trade_logs').insert({
          user_id: user.id,
          action: 'settle_trade',
          symbol: symbol ?? null,
          status: 'success',
          realized_pnl_usd: realizedPnlUsd,
          exchange_order_id: tradeRef ?? null,
          created_at: new Date().toISOString(),
        });

        if (realizedPnlUsd <= 0) {
          return new Response(
            JSON.stringify({ success: true, fee_charged: 0, message: 'No profit — no fee' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: feeId, error: feeErr } = await supabase.rpc('record_profit_fee', {
          p_user_id: user.id,
          p_rental_id: rentalId ?? null,
          p_gross_profit_usd: realizedPnlUsd,
          p_trade_ref: tradeRef ?? null,
          p_symbol: symbol ?? null,
        });

        if (feeErr) {
          console.error('record_profit_fee failed:', feeErr);
          return new Response(
            JSON.stringify({ success: false, error: feeErr.message }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ success: true, fee_event_id: feeId, realized_pnl_usd: realizedPnlUsd }),
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
      JSON.stringify({ success: false, error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

