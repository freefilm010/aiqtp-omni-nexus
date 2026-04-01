/**
 * React Query wrapper for faucet data.
 * Namespaced keys, retry strategy.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { faucetService } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import type { FaucetClaim } from "@/lib/data/types";
import { toast } from "sonner";

export function useFaucetClaimsQuery(limit = 50) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["faucet", "claims", user?.id, limit],
    queryFn: async (): Promise<FaucetClaim[]> => {
      const result = await faucetService.getUserFaucetClaims(limit);
      if (result.error) throw new Error(result.error);
      return result.data ?? [];
    },
    enabled: !!user,
    staleTime: 30_000,
    retry: 2,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
    refetchOnWindowFocus: false,
  });
}

export function useClaimFaucetMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { symbol: string; amount: number; chain: string }) => {
      const result = await faucetService.claimFaucetToken(params.symbol, params.amount, params.chain);
      if (result.error) throw new Error(result.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faucet"] });
      queryClient.invalidateQueries({ queryKey: ["portfolio", "holdings"] });
      toast.success("Faucet claim successful!");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Faucet claim failed");
    },
  });
}
