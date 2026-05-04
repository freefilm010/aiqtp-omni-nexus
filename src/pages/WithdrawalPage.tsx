import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpRight, Loader2, Clock, CheckCircle2, XCircle, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { AccountBalance } from "@/components/billing/AccountBalance";
import { toast } from "sonner";

type Withdrawal = {
  id: string;
  amount_usd: number;
  destination_type: string;
  status: string;
  created_at: string;
  processed_at: string | null;
};

const STATUS_ICON = {
  pending: <Clock className="h-3 w-3 text-yellow-400" />,
  approved: <CheckCircle2 className="h-3 w-3 text-blue-400" />,
  processed: <CheckCircle2 className="h-3 w-3 text-green-400" />,
  rejected: <XCircle className="h-3 w-3 text-destructive" />,
};

export default function WithdrawalPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [amount, setAmount] = useState("20");
  const [destType, setDestType] = useState("bank_ach");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    getCachedUser().then(u => {
      if (u) setUser({ id: u.id, email: u.email ?? undefined });
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setHistoryLoading(true);
    supabase
      .from("withdrawal_requests")
      .select("id, amount_usd, destination_type, status, created_at, processed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setHistory(data as Withdrawal[]);
        setHistoryLoading(false);
      });
  }, [user]);

  const handleWithdraw = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 20) { toast.error("Minimum withdrawal is $20"); return; }
    if (!user) { toast.error("Sign in first"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-withdrawal", {
        body: { amountUsd: amt, destinationType: destType, destinationDetails: {} },
      });
      if (error) throw error;
      toast.success(`Withdrawal of $${amt.toFixed(2)} submitted`, {
        description: `ID: ${(data as { withdrawalId?: string })?.withdrawalId ?? "pending"} — processed within 1–3 business days.`,
      });
      setAmount("20");
      // Refresh history
      const { data: newHistory } = await supabase
        .from("withdrawal_requests")
        .select("id, amount_usd, destination_type, status, created_at, processed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (newHistory) setHistory(newHistory as Withdrawal[]);
    } catch (e: unknown) {
      toast.error("Withdrawal failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-3xl py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Withdraw Funds</h1>
          <p className="text-muted-foreground">
            Request a withdrawal of your USD balance. Admin reviews within 1–3 business days.
          </p>
        </div>

        {user && <AccountBalance userId={user.id} />}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-green-400" />
              New Withdrawal Request
            </CardTitle>
            <CardDescription>
              Minimum $20. Funds are debited immediately; transfer processed within 1–3 business days.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (USD)</Label>
                <Input
                  type="number" min={20} step="0.01"
                  value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="20.00"
                />
                <div className="flex gap-2">
                  {["20","100","500","1000"].map(v => (
                    <Button key={v} variant="outline" size="sm" onClick={() => setAmount(v)}>
                      ${v}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Destination</Label>
                <Select value={destType} onValueChange={setDestType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_ach">Bank ACH Transfer (1-3 days, free)</SelectItem>
                    <SelectItem value="paypal">PayPal (instant, 3.49% fee)</SelectItem>
                    <SelectItem value="crypto">Crypto Wallet (blockchain fee)</SelectItem>
                    <SelectItem value="stripe_payout">Stripe Payout (2-7 days)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleWithdraw} disabled={loading} className="w-full gap-2" size="lg">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
              Submit Withdrawal Request
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="h-4 w-4 text-primary" />
              Withdrawal History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No withdrawal requests yet.</p>
            ) : (
              <div className="space-y-2">
                {history.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20 text-sm">
                    <div className="flex items-center gap-3">
                      {STATUS_ICON[w.status as keyof typeof STATUS_ICON] ?? <Clock className="h-3 w-3" />}
                      <div>
                        <p className="font-medium">${Number(w.amount_usd).toFixed(2)} → {w.destination_type.replace("_"," ")}</p>
                        <p className="text-muted-foreground text-xs">{new Date(w.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">{w.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
