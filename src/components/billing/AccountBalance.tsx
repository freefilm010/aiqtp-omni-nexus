import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Wallet, ArrowDownToLine, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props { userId: string }

export function AccountBalance({ userId }: Props) {
  const [balance, setBalance] = useState<number>(0);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("20");
  const [withdrawDest, setWithdrawDest] = useState("bank_ach");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    const [bal, dep, fee, wd] = await Promise.all([
      supabase.from("portfolio_holdings").select("quantity").eq("user_id", userId).eq("symbol", "USD").maybeSingle(),
      supabase.from("deposit_transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("platform_fee_events").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("withdrawal_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);
    setBalance(Number((bal.data as any)?.quantity ?? 0));
    setDeposits((dep.data as any[]) ?? []);
    setFees((fee.data as any[]) ?? []);
    setWithdrawals((wd.data as any[]) ?? []);
  };

  useEffect(() => { refresh(); }, [userId]);

  const submitWithdrawal = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 20) { toast.error("Minimum withdrawal is $20"); return; }
    if (amt > balance) { toast.error("Amount exceeds your USD balance"); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("request-withdrawal", {
        body: { amountUsd: amt, destinationType: withdrawDest, destinationDetails: { note: withdrawNote } },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message || "Withdrawal failed");
      toast.success("Withdrawal queued for review");
      setWithdrawOpen(false);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Withdrawal failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" /> USD Balance</CardTitle>
            <CardDescription>Available trading funds</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" onClick={() => setWithdrawOpen(true)} disabled={balance < 20}>
              <ArrowDownToLine className="h-4 w-4 mr-2" /> Withdraw
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-4xl font-bold">${balance.toFixed(2)}</div>
        <Tabs defaultValue="deposits">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="fees">Profit Fees</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
          </TabsList>
          <TabsContent value="deposits" className="space-y-1 max-h-60 overflow-y-auto">
            {deposits.length === 0 ? <p className="text-sm text-muted-foreground">No deposits yet.</p> :
              deposits.map((d) => (
                <div key={d.id} className="flex justify-between text-sm py-2 border-b">
                  <span>{new Date(d.created_at).toLocaleString()}</span>
                  <span className="font-medium text-green-500">+${Number(d.amount_usd).toFixed(2)}</span>
                </div>
              ))}
          </TabsContent>
          <TabsContent value="fees" className="space-y-1 max-h-60 overflow-y-auto">
            {fees.length === 0 ? <p className="text-sm text-muted-foreground">No profit fees yet.</p> :
              fees.map((f) => (
                <div key={f.id} className="flex justify-between text-sm py-2 border-b">
                  <span>{new Date(f.created_at).toLocaleString()} — {f.symbol ?? "—"} ({(Number(f.fee_rate) * 100).toFixed(0)}%)</span>
                  <span className="font-medium text-red-500">-${Number(f.platform_fee_usd).toFixed(2)}</span>
                </div>
              ))}
          </TabsContent>
          <TabsContent value="withdrawals" className="space-y-1 max-h-60 overflow-y-auto">
            {withdrawals.length === 0 ? <p className="text-sm text-muted-foreground">No withdrawal requests.</p> :
              withdrawals.map((w) => (
                <div key={w.id} className="flex justify-between text-sm py-2 border-b">
                  <span>{new Date(w.created_at).toLocaleString()} — {w.destination_type} <span className="text-xs text-muted-foreground">({w.status})</span></span>
                  <span className="font-medium">-${Number(w.amount_usd).toFixed(2)}</span>
                </div>
              ))}
          </TabsContent>
        </Tabs>
      </CardContent>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Request Withdrawal</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input type="number" min={20} max={balance} step="0.01" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} />
              <p className="text-xs text-muted-foreground">Available: ${balance.toFixed(2)} • Min $20</p>
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={withdrawDest} onValueChange={setWithdrawDest}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_ach">Bank (ACH)</SelectItem>
                  <SelectItem value="crypto">Crypto wallet</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="stripe_payout">Stripe payout</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes for review (account #, address, etc.)</Label>
              <Input value={withdrawNote} onChange={(e) => setWithdrawNote(e.target.value)} placeholder="Optional" />
            </div>
            <Button onClick={submitWithdrawal} disabled={loading} className="w-full">
              {loading ? "Submitting…" : "Submit for review"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Withdrawals are reviewed manually until automated payouts are KYC-cleared. Funds are held in escrow once submitted.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
