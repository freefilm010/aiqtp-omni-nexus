import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MoonshotRequest {
  action: "get_token_info" | "get_trending" | "track_referral" | "get_referral_stats" | "get_launch_data";
  tokenAddress?: string;
  referralCode?: string;
  chain?: "solana";
}

// Moonshot/DEXScreener API integration for token launches
const MOONSHOT_API = "https://api.moonshot.cc/api/v1";
const DEXSCREENER_API = "https://api.dexscreener.com/latest";

// Platform referral code for commission tracking
const PLATFORM_REFERRAL_CODE = "gDNoh6";
const PLATFORM_REFERRAL_URL = `https://moonshot.com/8PqsearWtYHMuf1e8ytFPtHdqZGtz4tqKETEYYwAmoon?ref=${PLATFORM_REFERRAL_CODE}`;

async function getTokenInfo(tokenAddress: string) {
  // Try Moonshot API first
  try {
    const moonshotResponse = await fetch(`${MOONSHOT_API}/tokens/${tokenAddress}`);
    if (moonshotResponse.ok) {
      const data = await moonshotResponse.json();
      return {
        ...data,
        source: "moonshot",
        referralUrl: `${PLATFORM_REFERRAL_URL}&token=${tokenAddress}`,
      };
    }
  } catch (e) {
    console.log("Moonshot API not available, falling back to DEXScreener");
  }
  
  // Fallback to DEXScreener
  const dexResponse = await fetch(`${DEXSCREENER_API}/dex/tokens/${tokenAddress}`);
  const dexText = await dexResponse.text();
  if (dexText.trim().startsWith('<')) {
    throw new Error(`DEXScreener returned HTML instead of JSON for token: ${tokenAddress}`);
  }
  const dexData = JSON.parse(dexText);
  
  if (!dexResponse.ok || !dexData.pairs?.length) {
    throw new Error(`Token not found: ${tokenAddress}`);
  }
  
  const pair = dexData.pairs[0];
  
  return {
    address: tokenAddress,
    symbol: pair.baseToken?.symbol || "UNKNOWN",
    name: pair.baseToken?.name || "Unknown Token",
    price: parseFloat(pair.priceUsd || "0"),
    priceChange24h: parseFloat(pair.priceChange?.h24 || "0"),
    volume24h: parseFloat(pair.volume?.h24 || "0"),
    liquidity: parseFloat(pair.liquidity?.usd || "0"),
    marketCap: parseFloat(pair.fdv || "0"),
    pairAddress: pair.pairAddress,
    dexId: pair.dexId,
    chain: pair.chainId,
    url: pair.url,
    source: "dexscreener",
    referralUrl: `${PLATFORM_REFERRAL_URL}&token=${tokenAddress}`,
    platformReferralCode: PLATFORM_REFERRAL_CODE,
  };
}

async function getTrendingTokens() {
  // Get trending from DEXScreener
  const response = await fetch(`${DEXSCREENER_API}/dex/search/?q=solana`);
  const text = await response.text();
  if (!response.ok || text.trim().startsWith('<')) {
    throw new Error("Failed to fetch trending tokens (non-JSON response)");
  }
  const data = JSON.parse(text);
  
  // Filter for Solana tokens and sort by volume
  const solanaPairs = (data.pairs || [])
    .filter((p: any) => p.chainId === "solana")
    .sort((a: any, b: any) => parseFloat(b.volume?.h24 || "0") - parseFloat(a.volume?.h24 || "0"))
    .slice(0, 50);
  
  return solanaPairs.map((pair: any) => ({
    address: pair.baseToken?.address,
    symbol: pair.baseToken?.symbol,
    name: pair.baseToken?.name,
    price: parseFloat(pair.priceUsd || "0"),
    priceChange24h: parseFloat(pair.priceChange?.h24 || "0"),
    volume24h: parseFloat(pair.volume?.h24 || "0"),
    liquidity: parseFloat(pair.liquidity?.usd || "0"),
    marketCap: parseFloat(pair.fdv || "0"),
    pairAddress: pair.pairAddress,
    dexId: pair.dexId,
    url: pair.url,
    referralUrl: `${PLATFORM_REFERRAL_URL}&token=${pair.baseToken?.address}`,
    isHot: parseFloat(pair.priceChange?.h24 || "0") > 50,
    isNew: Date.now() - (pair.pairCreatedAt || 0) < 24 * 60 * 60 * 1000,
  }));
}

async function trackReferral(supabase: any, userId: string, tokenAddress: string, action: string) {
  // Log referral activity for commission tracking
  const { error } = await supabase
    .from("admin_revenue")
    .insert({
      source: "moonshot_referral",
      type: "referral_commission",
      amount: 0, // Will be updated when actual commission is received
      status: "pending",
      metadata: {
        userId,
        tokenAddress,
        action,
        referralCode: PLATFORM_REFERRAL_CODE,
        timestamp: new Date().toISOString(),
      },
    });
  
  if (error) {
    console.error("Failed to track referral:", error);
  }
  
  return { success: true, referralCode: PLATFORM_REFERRAL_CODE };
}

async function getReferralStats(supabase: any) {
  const { data, error } = await supabase
    .from("admin_revenue")
    .select("*")
    .eq("source", "moonshot_referral")
    .order("created_at", { ascending: false })
    .limit(100);
  
  if (error) {
    throw new Error(`Failed to fetch referral stats: ${(error instanceof Error ? error.message : String(error))}`);
  }
  
  const totalReferrals = data?.length || 0;
  const pendingCommissions = data?.filter((r: any) => r.status === "pending").length || 0;
  const paidCommissions = data?.filter((r: any) => r.status === "processed")
    .reduce((sum: number, r: any) => sum + (r.amount || 0), 0) || 0;
  
  return {
    totalReferrals,
    pendingCommissions,
    paidCommissions,
    referralCode: PLATFORM_REFERRAL_CODE,
    referralUrl: PLATFORM_REFERRAL_URL,
    recentActivity: data?.slice(0, 10) || [],
  };
}

async function getLaunchData() {
  // Use DEXScreener search endpoint filtered to Solana (the /dex/pairs/solana endpoint doesn't exist)
  const response = await fetch(`${DEXSCREENER_API}/dex/search/?q=solana`);
  const text = await response.text();
  if (!response.ok || text.trim().startsWith('<')) {
    // Return empty data instead of throwing
    return { launches: [], stats: { totalLaunches: 0, avgLiquidity: 0, avgVolume: 0 } };
  }
  
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    return { launches: [], stats: { totalLaunches: 0, avgLiquidity: 0, avgVolume: 0 } };
  }
  
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  
  const newLaunches = (data.pairs || [])
    .filter((p: any) => p.chainId === "solana" && (p.pairCreatedAt || 0) > oneDayAgo)
    .sort((a: any, b: any) => (b.pairCreatedAt || 0) - (a.pairCreatedAt || 0))
    .slice(0, 100);
  
  return {
    launches: newLaunches.map((pair: any) => ({
      address: pair.baseToken?.address,
      symbol: pair.baseToken?.symbol,
      name: pair.baseToken?.name,
      price: parseFloat(pair.priceUsd || "0"),
      priceChange: parseFloat(pair.priceChange?.h24 || "0"),
      volume: parseFloat(pair.volume?.h24 || "0"),
      liquidity: parseFloat(pair.liquidity?.usd || "0"),
      marketCap: parseFloat(pair.fdv || "0"),
      launchedAt: pair.pairCreatedAt,
      ageMinutes: Math.floor((now - (pair.pairCreatedAt || 0)) / (60 * 1000)),
      dex: pair.dexId,
      referralUrl: `${PLATFORM_REFERRAL_URL}&token=${pair.baseToken?.address}`,
      riskScore: calculateRiskScore(pair),
    })),
    stats: {
      totalLaunches: newLaunches.length,
      avgLiquidity: newLaunches.reduce((sum: number, p: any) => sum + parseFloat(p.liquidity?.usd || "0"), 0) / (newLaunches.length || 1),
      avgVolume: newLaunches.reduce((sum: number, p: any) => sum + parseFloat(p.volume?.h24 || "0"), 0) / (newLaunches.length || 1),
    },
  };
}

function calculateRiskScore(pair: any): string {
  const liquidity = parseFloat(pair.liquidity?.usd || "0");
  const volume = parseFloat(pair.volume?.h24 || "0");
  const age = Date.now() - (pair.pairCreatedAt || 0);
  
  // Risk scoring based on liquidity, volume, and age
  if (liquidity < 1000) return "extreme";
  if (liquidity < 10000 || age < 60 * 60 * 1000) return "high";
  if (liquidity < 50000 || volume < 10000) return "medium";
  return "low";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const body: MoonshotRequest = await req.json();
    const { action, tokenAddress, referralCode } = body;
    
    // Get user ID from auth header if available
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    console.log(`Moonshot Integration: ${action}${tokenAddress ? ` for ${tokenAddress}` : ""}`);
    
    let result: any;
    
    switch (action) {
      case "get_token_info":
        if (!tokenAddress) throw new Error("Token address required");
        result = await getTokenInfo(tokenAddress);
        // Track referral if user is logged in
        if (userId) {
          await trackReferral(supabase, userId, tokenAddress, "view");
        }
        break;
        
      case "get_trending":
        result = await getTrendingTokens();
        break;
        
      case "track_referral":
        if (!userId) throw new Error("Authentication required for referral tracking");
        if (!tokenAddress) throw new Error("Token address required");
        result = await trackReferral(supabase, userId, tokenAddress, "click");
        break;
        
      case "get_referral_stats":
        result = await getReferralStats(supabase);
        break;
        
      case "get_launch_data":
        result = await getLaunchData();
        break;
        
      default:
        throw new Error(`Unknown action: ${action}`);
    }
    
    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Moonshot Integration error:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error instanceof Error ? error.message : String(error)) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
