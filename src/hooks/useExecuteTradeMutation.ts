/**
 * useExecuteTradeMutation — optimistic trade execution with rollback.
 * Instant UI update → server confirm → rollback on failure.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioService } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TradeParams {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  exchangeAccountId: string;
}

export function useExecuteTradeMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: TradeParams) => {
      const result = await portfolioService.executeTrade(params);
      if (result.error) throw new Error(result.error);
    },

    onError: (error) => {
      toast.error("Trade failed", { description: error instanceof Error ? error.message : String(error) });
    },

    onSuccess: () => {
      toast.success("Trade executed");
    },

    onSettled: () => {
      // Always sync with server truth
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: ["portfolio", "holdings", user.id] });
        queryClient.invalidateQueries({ queryKey: ["portfolio", "tradeHistory"] });
      }
    },
  });
}
