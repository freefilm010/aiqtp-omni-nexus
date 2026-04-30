import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Wallet, Percent, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getCachedUser } from "@/lib/auth/getCachedUser";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { toast } from "sonner";
import { AccountBalance } from "@/components/billing/AccountBalance";

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

export default function Billing() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const [depositAmount, setDepositAmount] = useState("20");
  const [depositOpen, setDepositOpen] = useState(false);

  useEffect(() => {
    getCachedUser().then((u) => {
      if (u) setUser({ id: u.id, email: u.email ?? undefined });
    });
  }, []);

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

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4 text-primary" />
              Realized-profit fee tiers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 sm:grid-cols-4">
              {PROFIT_FEE_TIERS.map((tier) => (
                <div key={tier.range} className="rounded-md border bg-muted/30 p-3 text-center">
                  <div className="text-2xl font-bold text-primary">{tier.fee}</div>
                  <div className="text-xs text-muted-foreground">{tier.range}</div>
                </div>
              ))}
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>• <strong>Strategy bots:</strong> $0 to initiate; fees apply only to realized profits.</p>
              <p>• <strong>Deposits:</strong> Stripe is used only to fund the user's USD balance. Deposits are not subscription products.</p>
              <p>• <strong>Minimum:</strong> $20 investment minimum; network, gas, and transfer fees apply at actual cost.</p>
            </div>
          </CardContent>
        </Card>
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
              <Input
                id="deposit-amount"
                type="number"
                min={20}
                max={10000}
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="20.00"
              />
              <p className="text-xs text-muted-foreground">Min $20, max $10,000.</p>
            </div>
            <Button onClick={handleDeposit} className="w-full">
              Continue to checkout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}