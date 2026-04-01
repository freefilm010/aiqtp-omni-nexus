/**
 * useExecuteTradeMutation — optimistic trade execution with rollback.
 * Instant UI update → server confirm → rollback on failure.
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { portfolioService } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { Holding } from "@/lib/data/types";

interface TradeParams {
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
}

export function useExecuteTradeMutation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: TradeParams) => {
      const result = await portfolioService.executeTrade(params);
      if (result.error) throw new Error(result.error);
    },

    onMutate: async (params) => {
      if (!user?.id) return;

      const queryKey = ["portfolio", "holdings", user.id];

      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous state for rollback
      const prev = queryClient.getQueryData<Holding[]>(queryKey);

      // Optimistic update
      queryClient.setQueryData<Holding[]>(queryKey, (old = []) => {
        const copy = old.map((h) => ({ ...h }));
        const diff = params.side === "buy" ? params.quantity : -params.quantity;
        const idx = copy.findIndex((h) => h.symbol === params.symbol);

        if (idx >= 0) {
          copy[idx].quantity += diff;
          if (copy[idx].quantity <= 0) {
            copy.splice(idx, 1);
          }
        } else if (params.side === "buy") {
          copy.push({
            id: crypto.randomUUID(),
            userId: user.id,
            symbol: params.symbol,
            name: params.symbol,
            quantity: params.quantity,
            valueUsd: params.quantity * params.price,
            change24h: 0,
            allocationPercent: 0,
            updatedAt: new Date().toISOString(),
          });
        }

        return copy;
      });

      return { prev };
    },

    onError: (_err, _params, context) => {
      // Rollback to snapshot
      if (context?.prev && user?.id) {
        queryClient.setQueryData(["portfolio", "holdings", user.id], context.prev);
      }
      toast.error("Trade failed — rolled back");
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
