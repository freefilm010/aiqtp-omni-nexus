import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Returns the current user WITHOUT acquiring the navigator-lock that
 * `supabase.auth.getUser()` uses. Reads from the cached session instead.
 *
 * Use this in components/services where many callers may resolve a user in
 * parallel — `getUser()` serializes through a navigator LockManager and
 * causes "Lock was released because another request stole it" errors when
 * called from multiple components on mount.
 *
 * Inside React components, prefer `useAuth().user` from `@/hooks/useAuth`.
 */
export async function getCachedUser(): Promise<User | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}