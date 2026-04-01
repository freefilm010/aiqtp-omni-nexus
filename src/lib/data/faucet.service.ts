/**
 * Faucet Data Access Layer
 * Handles faucet_claims and credit_faucet_claim RPC.
 */
import { supabase } from "@/integrations/supabase/client";
import type { ServiceResult, FaucetClaim } from "./types";

/** Get faucet claim history for the current user. */
export async function getUserFaucetClaims(limit = 50): Promise<ServiceResult<FaucetClaim[]>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("faucet_claims")
    .select("*")
    .eq("user_id", user.id)
    .order("claimed_at", { ascending: false })
    .limit(limit) as any;

  if (error) return { data: null, error: error.message };

  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      tokenSymbol: row.token_symbol,
      amount: Number(row.amount) || 0,
      chain: row.chain ?? "testnet",
      claimedAt: row.claimed_at,
    })),
    error: null,
  };
}

/** Execute a faucet claim via the database RPC. */
export async function claimFaucetToken(
  symbol: string,
  amount: number,
  chain: string
): Promise<ServiceResult<null>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { error } = await supabase.rpc("credit_faucet_claim", {
    p_user_id: user.id,
    p_symbol: symbol,
    p_amount: amount,
    p_chain: chain,
  });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}
