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

const canUseManagedBroker = () => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  // The managed broker route (/~oauth/initiate) only exists on Lovable-hosted
  // surfaces. aiqtp.com is served from Vercel, so that route 404s there and
  // the user lands on an error page after choosing their Google account.
  // Everywhere else we use native provider OAuth.
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
