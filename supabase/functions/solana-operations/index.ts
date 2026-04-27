import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Solana RPC endpoints - use mainnet
const SOLANA_RPC_MAINNET = 'https://api.mainnet-beta.solana.com';
const SOLANA_RPC_DEVNET = 'https://api.devnet.solana.com';
const HELIUS_RPC = Deno.env.get('HELIUS_API_KEY') 
  ? `https://mainnet.helius-rpc.com/?api-key=${Deno.env.get('HELIUS_API_KEY')}`
  : null;

// Jupiter API for swaps and prices
const JUPITER_API = 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6';

// Token list APIs
const JUPITER_TOKEN_LIST = 'https://token.jup.ag/all';
const RAYDIUM_API = 'https://api-v3.raydium.io';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role for database operations after auth verified
    const supabase = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, params } = await req.json();
    const rpcUrl = HELIUS_RPC || SOLANA_RPC_MAINNET;

    // Helper for Solana RPC calls
    const rpcCall = async (method: string, rpcParams: any[] = [], useDevnet = false) => {
      const endpoint = useDevnet ? SOLANA_RPC_DEVNET : rpcUrl;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method,
          params: rpcParams
        })
      });
      const data = await response.json();
      if (data.error) {
        const msg = typeof data.error === 'string'
          ? data.error
          : (data.error?.message ?? JSON.stringify(data.error));
        throw new Error(msg);
      }
      return data.result;
    };

    switch (action) {
      case 'sync_token_list': {
        // Fetch verified token list from Jupiter
        const response = await fetch(JUPITER_TOKEN_LIST);
        if (!response.ok) throw new Error('Failed to fetch token list');
        
        const tokens = await response.json();
        let synced = 0;

        // Process in batches
        for (let i = 0; i < tokens.length && i < 10000; i += 500) {
          const batch = tokens.slice(i, i + 500).map((token: any) => ({
            mint_address: token.address,
            symbol: token.symbol || 'UNKNOWN',
            name: token.name || token.symbol,
            decimals: token.decimals || 9,
            logo_uri: token.logoURI,
            is_verified: token.tags?.includes('verified') || false,
            is_platform_token: false,
            updated_at: new Date().toISOString()
          }));

          const { error } = await supabase.from('solana_tokens').upsert(batch, {
            onConflict: 'mint_address'
          });
          if (!error) synced += batch.length;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          synced,
          message: `Synced ${synced} Solana tokens`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_token_prices': {
        // Get real prices from Jupiter Price API
        const { mints } = params;
        const mintList = Array.isArray(mints) ? mints.join(',') : mints;
        
        const response = await fetch(`${JUPITER_PRICE_API}/price?ids=${mintList}`);
        if (!response.ok) throw new Error('Failed to fetch prices');
        
        const priceData = await response.json();

        // Update token prices in database
        for (const [mint, data] of Object.entries(priceData.data || {}) as [string, any][]) {
          await supabase.from('solana_tokens').update({
            price_usd: data.price,
            updated_at: new Date().toISOString()
          }).eq('mint_address', mint);
        }

        return new Response(JSON.stringify({ 
          success: true, 
          prices: priceData.data 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_wallet_balance': {
        // Get SOL balance and token balances for a wallet
        const { walletAddress } = params;
        
        // Get SOL balance
        const solBalance = await rpcCall('getBalance', [walletAddress]);
        const balanceSol = solBalance.value / 1e9;

        // Get SPL token accounts
        const tokenAccounts = await rpcCall('getTokenAccountsByOwner', [
          walletAddress,
          { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
          { encoding: 'jsonParsed' }
        ]);

        const tokens = tokenAccounts.value.map((account: any) => ({
          mint: account.account.data.parsed.info.mint,
          balance: account.account.data.parsed.info.tokenAmount.uiAmount,
          decimals: account.account.data.parsed.info.tokenAmount.decimals
        })).filter((t: any) => t.balance > 0);

        // Update wallet balance in database
        await supabase.from('solana_wallets').update({
          balance_sol: balanceSol,
          last_activity: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }).eq('wallet_address', walletAddress);

        return new Response(JSON.stringify({ 
          success: true,
          solBalance: balanceSol,
          tokens,
          totalTokens: tokens.length
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_swap_quote': {
        // Get swap quote from Jupiter
        const { inputMint, outputMint, amount, slippageBps = 50 } = params;
        
        const url = `${JUPITER_API}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error('Failed to get swap quote');
        const quote = await response.json();

        return new Response(JSON.stringify({ 
          success: true, 
          quote 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'sync_dex_pairs': {
        // Fetch trading pairs from Raydium
        const response = await fetch(`${RAYDIUM_API}/pools/info/list?poolType=all&poolSortField=default&sortType=desc&pageSize=1000&page=1`);
        
        if (!response.ok) throw new Error('Failed to fetch Raydium pairs');
        const poolData = await response.json();
        const pools = poolData.data?.data || [];

        let synced = 0;
        const pairs = pools.map((pool: any) => ({
          chain: 'solana',
          dex_name: 'raydium',
          pair_address: pool.id,
          base_token_address: pool.mintA?.address || '',
          quote_token_address: pool.mintB?.address || '',
          base_symbol: pool.mintA?.symbol || 'UNKNOWN',
          quote_symbol: pool.mintB?.symbol || 'UNKNOWN',
          price: pool.price || 0,
          price_usd: pool.price || 0,
          liquidity_usd: pool.tvl || 0,
          volume_24h: pool.day?.volume || 0,
          price_change_24h: pool.day?.priceChange || 0,
          fee_percent: pool.feeRate ? pool.feeRate / 10000 : 0.003,
          is_verified: pool.mintA?.programId === 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          updated_at: new Date().toISOString()
        }));

        // Batch insert
        for (let i = 0; i < pairs.length; i += 200) {
          const batch = pairs.slice(i, i + 200);
          const { error } = await supabase.from('dex_pairs').upsert(batch, {
            onConflict: 'pair_address'
          });
          if (!error) synced += batch.length;
        }

        return new Response(JSON.stringify({ 
          success: true, 
          synced,
          message: `Synced ${synced} Raydium trading pairs`
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_transaction': {
        // Get transaction details
        const { signature } = params;
        const tx = await rpcCall('getTransaction', [signature, { encoding: 'jsonParsed', maxSupportedTransactionVersion: 0 }]);
        
        return new Response(JSON.stringify({ success: true, transaction: tx }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      case 'get_recent_transactions': {
        // Get recent transactions for wallet
        const { walletAddress, limit = 50 } = params;
        const signatures = await rpcCall('getSignaturesForAddress', [
          walletAddress,
          { limit }
        ]);

        return new Response(JSON.stringify({ 
          success: true, 
          transactions: signatures 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_network_stats': {
        // Get Solana network statistics
        const [epochInfo, supply, health] = await Promise.all([
          rpcCall('getEpochInfo'),
          rpcCall('getSupply'),
          rpcCall('getHealth').catch(() => 'ok')
        ]);

        const slotInfo = await rpcCall('getSlot');
        const blockTime = await rpcCall('getBlockTime', [slotInfo]);

        return new Response(JSON.stringify({ 
          success: true,
          network: {
            epoch: epochInfo.epoch,
            slot: slotInfo,
            blockHeight: epochInfo.blockHeight,
            absoluteSlot: epochInfo.absoluteSlot,
            transactionCount: epochInfo.transactionCount,
            circulatingSupply: supply.value.circulating / 1e9,
            totalSupply: supply.value.total / 1e9,
            health,
            blockTime: new Date(blockTime * 1000).toISOString()
          }
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'create_platform_wallet': {
        // Create new platform-controlled wallet entry
        const { walletType, label, operatorId, address } = params;
        
        const { data, error } = await supabase.from('solana_wallets').insert({
          wallet_address: address,
          wallet_type: walletType,
          label,
          operator_id: operatorId,
          is_active: true
        }).select().single();

        if (error) throw error;

        return new Response(JSON.stringify({ 
          success: true, 
          wallet: data 
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      case 'get_top_gainers_losers': {
        // Get top gaining/losing tokens from our tracked tokens
        const { data: gainers } = await supabase
          .from('solana_tokens')
          .select('*')
          .not('price_change_24h', 'is', null)
          .order('price_change_24h', { ascending: false })
          .limit(20);

        const { data: losers } = await supabase
          .from('solana_tokens')
          .select('*')
          .not('price_change_24h', 'is', null)
          .order('price_change_24h', { ascending: true })
          .limit(20);

        return new Response(JSON.stringify({ 
          success: true, 
          gainers: gainers || [],
          losers: losers || []
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error: any) {
    console.error('Solana operations error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: (error instanceof Error ? error.message : String(error)) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});