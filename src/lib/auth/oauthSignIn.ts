import { supabase as _supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const supabase = _supabase as any;

type OAuthProvider = "google" | "apple";

const LOCAL_HOSTS = ["localhost", "127.0.0.1"];

const isLocalDev = () => {
  if (typeof window === "undefined") return false;
  return LOCAL_HOSTS.includes(window.location.hostname);
};

/**
 * Social sign-in.
 *
 * The Lovable-managed OAuth broker (/~oauth/initiate) is available on all
 * Lovable-hosted surfaces AND on connected custom domains (aiqtp.com), which
 * are proxied through the same worker. Managed credentials only work through
 * that broker — calling supabase.auth.signInWithOAuth directly fails with
 * "Unsupported provider: missing OAuth secret". So: managed everywhere except
 * pure localhost development.
 */
export const signInWithOAuth = async (
  provider: OAuthProvider,
  opts?: { redirectTo?: string }
): Promise<{ error?: Error }> => {
  const redirectTo = opts?.redirectTo ?? `${window.location.origin}/`;

  if (!isLocalDev()) {
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: redirectTo,
    });
    if (result?.error) return { error: result.error as Error };
    return {};
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  return error ? { error } : {};
};

