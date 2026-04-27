import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeatureFlag {
  id: string;
  flag_key: string;
  display_name: string;
  description: string | null;
  is_enabled: boolean;
  audience: "public" | "authenticated" | "admin" | "beta";
  category: string | null;
  updated_at: string;
}

export const useFeatureFlags = () => {
  return useQuery({
    queryKey: ["feature_flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("category", { ascending: true })
        .order("display_name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as FeatureFlag[];
    },
    staleTime: 60_000,
  });
};

export const useFeatureFlag = (flagKey: string): boolean => {
  const { data } = useFeatureFlags();
  const flag = data?.find((f) => f.flag_key === flagKey);
  // Default ON if flag is not yet seeded — fail open for production stability.
  return flag?.is_enabled ?? true;
};

export const useToggleFeatureFlag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_enabled }: { id: string; is_enabled: boolean }) => {
      const { error } = await supabase
        .from("feature_flags")
        .update({ is_enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["feature_flags"] }),
  });
};