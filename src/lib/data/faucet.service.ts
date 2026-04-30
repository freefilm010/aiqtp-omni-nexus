/**
 * Faucet Data Access Layer
 * Handles faucet_claims and credit_faucet_claim RPC.
 */
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import type { ServiceResult, FaucetClaim, FaucetClaimRow } from "./types";

function toFaucetClaim(row: FaucetClaimRow): FaucetClaim {
  return {
    id: row.id,
    userId: row.user_id,
    tokenId: row.token_id,
    amount: Number(row.amount) || 0,
    chain: row.chain ?? "testnet",
    claimedAt: row.created_at,
  };
}

/** Get faucet claim history for the current user. */
export async function getUserFaucetClaims(limit = 50): Promise<ServiceResult<FaucetClaim[]>> {
  const user = await getCachedUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("faucet_claims")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { data: null, error: error.message };
  return { data: (data ?? []).map(toFaucetClaim), error: null };
}

/** Execute a faucet claim via the privileged edge function (service role). */
export async function claimFaucetToken(
  symbol: string,
  amount: number,
  chain: string
): Promise<ServiceResult<null>> {
  const user = await getCachedUser();
  if (!user) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase.functions.invoke("faucet-credit", {
    body: { symbol, amount, chain },
  });
  if (error) return { data: null, error: error.message };
  if (data?.error) return { data: null, error: data.error };
  return { data: null, error: null };
}
