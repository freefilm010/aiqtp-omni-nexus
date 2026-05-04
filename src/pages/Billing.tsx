import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Wallet, Percent, ShieldCheck, ArrowUpRight, Loader2, TrendingUp, DollarSign, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { toast } from "sonner";
import { AccountBalance } from "@/components/billing/AccountBalance";
import { renderApi } from "@/lib/render-api";

const PLATFORM_ACCESS_FEATURES = [
  "Full platform access is free",
  "AI agents and strategy tools are free",
  "Rentable strategy bots cost $0 to start",
  "No profit from a bot means no platform fee",
  "Profit fees are deducted in-platform only after realized gains",
];

const PROFIT_FEE_TIERS = [
  { range: "$0.01 – $9,999.99", fee: "9%" },
  { range: "$10,000 – $99,999.99", fee: "6%" },
  { range: "$100,000 – $999,999.99", fee: "3%" },
  { range: "$1,000,000+", fee: "1%" },
];

type FeeEvent = {
  id: string;
  gross_profit_usd: number;
  fee_rate: number;
  platform_fee_usd: number;
  symbol: string | null;
  status: string;
  created_at: string;
};

export default function Billing() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [depositAmount, setDepositAmount] = useState("20");
  const [depositOpen, setDepositOpen] = useState(false);

  // Withdrawal state
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("20");
  const [withdrawType, setWithdrawType] = useState("bank_ach");
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Fee history state
  const [feeEvents, setFeeEvents] = useState<FeeEvent[]>([]);
  const [feeLoading, setFeeLoading] = useState(false);

  useEffect(() => {
    getCachedUser().then((u) => {
      if (u) setUser({ id: u.id, email: u.email ?? undefined });
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    setFeeLoading(true);
    supabase
      .from("platform_fee_events")
      .select("id, gross_profit_usd, fee_rate, platform_fee_usd, symbol, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setFeeEvents(data as FeeEvent[]);
        setFeeLoading(false);
      });
  }, [user]);

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 20) { toast.error("Minimum withdrawal is $20"); return; }
    if (!user) { toast.error("Please sign in first"); return; }
    setWithdrawLoading(true);
    try {
      const data = await renderApi.withdrawals.request(amt, user.id, withdrawType);
      toast.success(`Withdrawal of $${amt.toFixed(2)} submitted`, {
        description: `Withdrawal ID: ${data?.withdrawal_id ?? "pending"}. Processing within 1–3 business days.`,
      });
      setWithdrawOpen(false);
    } catch (e: unknown) {
      toast.error("Withdrawal failed", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const [paypalLoading, setPaypalLoading] = useState(false);

  const handleDeposit = () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 20 || amt > 10000) {
      toast.error("Enter an amount between $20 and $10,000");
      return;
    }
    setDepositOpen(false);
    openCheckout({
      mode: "deposit",
      amountInCents: Math.round(amt * 100),
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const handlePayPalDeposit = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 20 || amt > 10000) {
      toast.error("Enter an amount between $20 and $10,000");
      return;
    }
    setPaypalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-paypal-checkout", {
        body: {
          action: "create",
          amountUsd: amt,
          returnUrl: `${window.location.origin}/checkout/return?paypal_order_id=PAYPAL_ORDER_ID`,
          cancelUrl: `${window.location.origin}/billing`,
        },
      });
      if (error || !data?.approveUrl) throw new Error(error?.message ?? "PayPal checkout failed");
      setDepositOpen(false);
      window.location.href = data.approveUrl;
    } catch (e: unknown) {
      toast.error("PayPal error", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setPaypalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-5xl py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Fund Trading Balance</h1>
          <p className="text-muted-foreground">
            Access and agents are free. Card checkout only adds USD funds to your account.
          </p>
        </div>

        {user && <AccountBalance userId={user.id} />}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Access */}
          <Card className="border-primary/40">
            <CardHeader>
              <ShieldCheck className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Free Access</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">$0</span>
                <span className="text-muted-foreground"> platform • $0 agents</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {PLATFORM_ACCESS_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={() => { setDepositAmount("20"); setDepositOpen(true); }} className="w-full" size="lg">
                Add minimum funds — $20
              </Button>
            </CardContent>
          </Card>

          {/* Custom Deposit */}
          <Card>
            <CardHeader>
              <Wallet className="h-8 w-8 text-primary" />
              <CardTitle className="text-2xl">Fund Your Account</CardTitle>
              <CardDescription>
                One-time deposit credited instantly to your platform balance.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Choose any amount from $20 to $10,000</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Auto-credited to your USD wallet on payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 shrink-0" />
                  <span>Use for bot deployment, strategy rentals, and trading</span>
                </li>
              </ul>
              <div className="grid grid-cols-4 gap-2">
                {["20", "50", "100", "500"].map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => { setDepositAmount(amt); setDepositOpen(true); }}
                  >
                    ${amt}
                  </Button>
                ))}
              </div>
              <Button onClick={() => setDepositOpen(true)} className="w-full" variant="default">
                Custom amount
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Withdraw + Fee tiers row */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Withdrawal */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4 text-green-400" />
                Withdraw Funds
              </CardTitle>
              <CardDescription className="text-xs">
                Request a withdrawal of your USD balance. Minimum $20. Processed within 1–3 business days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {["20", "100", "500"].map((amt) => (
                  <Button key={amt} variant="outline" size="sm"
                    onClick={() => { setWithdrawAmount(amt); setWithdrawOpen(true); }}>
                    ${amt}
                  </Button>
                ))}
              </div>
              <Button variant="outline" className="w-full gap-2" onClick={() => setWithdrawOpen(true)}>
                <ArrowUpRight className="h-4 w-4" />
                Custom withdrawal
              </Button>
            </CardContent>
          </Card>

          {/* Fee tiers */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Percent className="h-4 w-4 text-primary" />
                Realized-profit fee tiers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                {PROFIT_FEE_TIERS.map((tier) => (
                  <div key={tier.range} className="rounded-md border bg-muted/30 p-2 text-center">
                    <div className="text-xl font-bold text-primary">{tier.fee}</div>
                    <div className="text-[11px] text-muted-foreground">{tier.range}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                No profit from a bot = no fee. Deducted automatically from your USD balance.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Profit fee history */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Profit Fee History
              </CardTitle>
              <CardDescription className="text-xs">
                Platform fees collected from your winning trades (most recent 20)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feeLoading ? (
                <div className="flex items-center gap-2 py-4 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </div>
              ) : feeEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No fee events yet — fees are collected after your first profitable trade.
                </p>
              ) : (
                <div className="space-y-2">
                  {feeEvents.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between p-2 rounded bg-muted/20 text-xs">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-3 w-3 text-green-400 shrink-0" />
                        <div>
                          <p className="font-medium">
                            Profit: <span className="text-green-400">${ev.gross_profit_usd.toFixed(2)}</span>
                            {ev.symbol && <span className="text-muted-foreground ml-1">({ev.symbol})</span>}
                          </p>
                          <p className="text-muted-foreground">{new Date(ev.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-destructive">-${ev.platform_fee_usd.toFixed(2)}</p>
                        <Badge variant="outline" className={`text-[10px] ${
                          ev.status === "collected" ? "border-green-500/30 text-green-400" :
                          ev.status === "admin_exempt" ? "border-blue-500/30 text-blue-400" :
                          "border-destructive/30 text-destructive"
                        }`}>
                          {(ev.fee_rate * 100).toFixed(0)}% · {ev.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />

      {/* Embedded checkout dialog */}
      <Dialog open={isOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete your purchase</DialogTitle>
          </DialogHeader>
          {checkoutElement}
        </DialogContent>
      </Dialog>

      {/* Deposit amount picker */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Deposit amount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount in USD</Label>
              <Input id="deposit-amount" type="number" min={20} max={10000} step="0.01"
                value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="20.00" />
              <p className="text-xs text-muted-foreground">Min $20, max $10,000.</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Button onClick={handleDeposit} className="w-full gap-2">
                <CreditCard className="h-4 w-4" />
                Pay with Card (Stripe)
              </Button>
              <Button onClick={handlePayPalDeposit} disabled={paypalLoading} variant="outline" className="w-full gap-2 border-blue-500/40 text-blue-400 hover:bg-blue-500/10">
                {paypalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span className="font-bold text-blue-500">P</span>}
                Pay with PayPal
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Funds credited instantly after payment confirmation.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Withdrawal dialog */}
      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (USD)</Label>
              <Input type="number" min={20} step="0.01"
                value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} placeholder="20.00" />
            </div>
            <div className="space-y-2">
              <Label>Destination</Label>
              <Select value={withdrawType} onValueChange={setWithdrawType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_ach">Bank ACH Transfer</SelectItem>
                  <SelectItem value="stripe_payout">Stripe Payout</SelectItem>
                  <SelectItem value="crypto">Crypto Wallet</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">
              Minimum $20. Admin reviews and processes withdrawals within 1–3 business days.
            </p>
            <Button onClick={handleWithdraw} disabled={withdrawLoading} className="w-full gap-2">
              {withdrawLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
              Submit Withdrawal Request
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}