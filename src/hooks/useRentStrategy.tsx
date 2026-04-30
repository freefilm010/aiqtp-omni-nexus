import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useRentStrategy() {
  const [loading, setLoading] = useState(false);

  const rentStrategy = async (strategyId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("rent-strategy", {
        body: { strategyId },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Rental failed");
      toast.success("Strategy rented — $0 upfront, fees only on profits");
      return data.rentalId as string;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Rental failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { rentStrategy, loading };
}
