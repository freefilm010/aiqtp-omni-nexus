import { useCallback, useEffect, useState } from "react";
import { usePlaidLink } from "react-plaid-link";
import { Landmark, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type LinkedAccount = {
  account_id: string;
  name: string;
  mask?: string;
  subtype?: string;
};

export function PlaidBankLink() {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<LinkedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);

  const invoke = useCallback(async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("plaid-link", { body });
    if (error || data?.error) throw new Error(data?.error || error?.message || "Bank connection failed");
    return data;
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      const data = await invoke({ action: "get_accounts" });
      setAccounts((data.accounts || []) as LinkedAccount[]);
      setConfigured(true);
    } catch {
      setAccounts([]);
    }
  }, [invoke]);

  const prepareLink = useCallback(async () => {
    setLoading(true);
    try {
      const data = await invoke({ action: "create_link_token" });
      setLinkToken(data.linkToken);
      setConfigured(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bank connection unavailable";
      setConfigured(false);
      toast.error("Plaid is not configured", { description: message });
    } finally {
      setLoading(false);
    }
  }, [invoke]);

  const onSuccess = useCallback(async (publicToken: string) => {
    setLoading(true);
    try {
      await invoke({ action: "exchange_public_token", publicToken });
      await loadAccounts();
      setLinkToken(null);
      toast.success("Bank account linked securely");
    } catch (error) {
      toast.error("Bank link failed", { description: error instanceof Error ? error.message : "Try again" });
    } finally {
      setLoading(false);
    }
  }, [invoke, loadAccounts]);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
    onExit: () => setLinkToken(null),
  });

  useEffect(() => { void loadAccounts(); }, [loadAccounts]);
  useEffect(() => { if (linkToken && ready) open(); }, [linkToken, ready, open]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 rounded-md border border-border p-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
          <Landmark className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">Secure bank connection</p>
          <p className="text-xs text-muted-foreground">Credentials are entered only in Plaid Link.</p>
        </div>
        <Badge variant={accounts.length ? "default" : "outline"}>
          {accounts.length ? `${accounts.length} linked` : configured === false ? "Unavailable" : "Not linked"}
        </Badge>
      </div>
      {accounts.map((account) => (
        <div key={account.account_id} className="flex items-center justify-between rounded-md bg-muted/30 p-3 text-sm">
          <span>{account.name}</span>
          <span className="text-muted-foreground">{account.subtype || "bank"}{account.mask ? ` ••••${account.mask}` : ""}</span>
        </div>
      ))}
      <Button className="w-full" onClick={prepareLink} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : accounts.length ? <RefreshCw className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
        {accounts.length ? "Link another bank" : "Connect with Plaid"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">Bank linking is available when Plaid production credentials are configured. ACH funding remains disabled until settlement is verified.</p>
    </div>
  );
}