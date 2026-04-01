import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PricePoint {
  price_usd: number;
  created_at: string;
}

export function usePriceHistory(symbol: string) {
  return useQuery({
    queryKey: ["market", "history", symbol],
    queryFn: async (): Promise<PricePoint[]> => {
      const { data, error } = await supabase
        .from("price_history")
        .select("price_usd, created_at")
        .eq("symbol", symbol.toUpperCase())
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) throw error;
      return (data ?? []).map((r) => ({
        price_usd: Number(r.price_usd),
        created_at: r.created_at,
      }));
    },
    enabled: !!symbol,
    staleTime: 120_000,
  });
}
