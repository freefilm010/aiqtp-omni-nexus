import { supabase as _supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const supabase = _supabase as any;

type OAuthProvider = "google" | "apple";

const LOVABLE_HOST_SUFFIXES = [
  "lovable.app",
  "lovableproject.com",
  "lovableproject-dev.com",
  "gpt-eng.com",
  "gptengineer.run",
];

const MANAGED_HOSTS = ["aiqtp.com", "aiqtp.lovable.app"];

const canUseManagedBroker = () => {
  if (typeof window === "undefined") return true;
  const host = window.location.hostname;
  // Managed broker serves all Lovable-hosted surfaces AND custom domains that
  // resolve to Lovable (aiqtp.com is allow-listed on the OAuth server).
  if (MANAGED_HOSTS.some((h) => host === h || host.endsWith("." + h))) return true;
  return LOVABLE_HOST_SUFFIXES.some((s) => host === s || host.endsWith("." + s));
};

/**
 * Social sign-in that works on every deployment surface.
 *
 * The Lovable-managed OAuth broker redirects through `/~oauth/initiate`,
 * which only exists on Lovable-hosted domains (including the aiqtp.com
 * custom domains). On other surfaces (localhost dev, Vercel preview
 * deployments) that route 404s and the user lands on "Page not found".
 * So: managed broker where it exists, native provider OAuth elsewhere.
 */
export const signInWithOAuth = async (
  provider: OAuthProvider,
  opts?: { redirectTo?: string }
): Promise<{ error?: Error }> => {
  const redirectTo = opts?.redirectTo ?? `${window.location.origin}/`;

  if (canUseManagedBroker()) {
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
