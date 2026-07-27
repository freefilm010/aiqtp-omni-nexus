import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase as _supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Shield } from "lucide-react";

const supabase = _supabase as any;

interface AuthorizationDetails {
  client?: { name?: string; redirect_uri?: string };
  scope?: string;
  redirect_url?: string;
  redirect_to?: string;
}

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [account, setAccount] = useState<string>("");

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in URL.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess?.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      setAccount(sess.session.user?.email ?? sess.session.user?.id ?? "");
      const { data, error } = await supabase.auth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) {
        setError(error.message);
        return;
      }
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error } = approve
      ? await supabase.auth.oauth.approveAuthorization(authorizationId)
      : await supabase.auth.oauth.denyAuthorization(authorizationId);
    if (error) {
      setBusy(false);
      setError(error.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <section className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>
              {details?.client?.name
                ? `Connect ${details.client.name} to AIQTP`
                : "Authorize access to AIQTP"}
            </CardTitle>
            <CardDescription>
              {account ? `Signed in as ${account}` : "Reviewing authorization…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? (
              <div className="text-sm text-destructive">Could not load this authorization request: {error}</div>
            ) : !details ? (
              <div className="text-sm text-muted-foreground">Loading…</div>
            ) : (
              <>
                <p className="text-sm">
                  This lets <span className="font-medium">{details.client?.name ?? "the client"}</span> use
                  AIQTP as you. It can call the platform's enabled MCP tools while you are signed in.
                </p>
                {details.scope ? (
                  <p className="text-xs text-muted-foreground">Requested scopes: {details.scope}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  This does not bypass AIQTP's permissions or backend policies. Row-level security still applies.
                </p>
                <div className="flex gap-2 pt-2">
                  <Button className="flex-1" disabled={busy} onClick={() => decide(true)}>
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => decide(false)}
                  >
                    Cancel connection
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}