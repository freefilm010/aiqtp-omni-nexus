import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, CreditCard, Wallet, Settings2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { useSubscription } from "@/hooks/useSubscription";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

const PLATFORM_ACCESS_FEATURES = [
  "Full AIQTP platform access",
  "AI strategy generation & backtesting",
  "Real-time market signals & price feeds",
  "Strategy marketplace (rent graduated bots free)",
  "Auto-Invest engine + 37 income streams",
  "Quantum-enhanced predictions",
  "Profit fees on bot rentals (9%/6%/3%/1%) deducted from realized profits only",
];

export default function Billing() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();
  const { subscription, isActive, loading } = useSubscription(user?.id);
  const [depositAmount, setDepositAmount] = useState("25");
  const [depositOpen, setDepositOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
    });
  }, []);

  const handleSubscribe = () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    openCheckout({
      mode: "subscription",
      priceId: "platform_access_monthly",
      customerEmail: user.email,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  const handleDeposit = () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 5 || amt > 10000) {
      toast.error("Enter an amount between $5 and $10,000");
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

  const handleManage = async () => {
    setPortalLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-portal-session", {
        body: {
          returnUrl: `${window.location.origin}/billing`,
          environment: getStripeEnvironment(),
        },
      });
      if (error || !data?.url) throw new Error(error?.message || "Failed");
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error((e as Error).message || "Could not open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container max-w-5xl py-12 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">Billing & Platform Access</h1>
          <p className="text-muted-foreground">
            Activate your AIQTP membership and fund your platform balance.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Platform Access */}
          <Card className="border-primary/40">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CreditCard className="h-8 w-8 text-primary" />
                {isActive && <Badge variant="default" className="bg-green-500">Active</Badge>}
              </div>
              <CardTitle className="text-2xl">Platform Access</CardTitle>
              <CardDescription>
                <span className="text-3xl font-bold text-foreground">$1</span>
                <span className="text-muted-foreground">/month</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {PLATFORM_ACCESS_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              {loading ? (
                <Button disabled className="w-full">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Loading…
                </Button>
              ) : isActive ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {subscription?.cancel_at_period_end
                      ? `Access until ${subscription.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : "period end"}`
                      : `Renews ${subscription?.current_period_end ? new Date(subscription.current_period_end).toLocaleDateString() : ""}`}
                  </p>
                  <Button onClick={handleManage} variant="outline" className="w-full" disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Settings2 className="h-4 w-4 mr-2" />}
                    Manage subscription
                  </Button>
                </div>
              ) : (
                <Button onClick={handleSubscribe} className="w-full" size="lg">
                  Subscribe — $1/month
                </Button>
              )}
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
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Choose any amount from $5 to $10,000</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Auto-credited to your USD wallet on payment</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <span>Use for bot deployment, strategy rentals, and trading</span>
                </li>
              </ul>
              <div className="grid grid-cols-4 gap-2">
                {["10", "25", "100", "500"].map((amt) => (
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
            <CardTitle className="text-base">How fees work</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• <strong>Platform Access:</strong> $1/month grants full app access.</p>
            <p>• <strong>Strategy rentals:</strong> Free to start — no charge if a bot generates $0 or losses.</p>
            <p>• <strong>Profit fees:</strong> Tiered on realized profits only (9% under $10k, 6% under $100k, 3% under $1M, 1% above), deducted in-platform.</p>
            <p>• <strong>Tax:</strong> Stripe handles end-to-end tax compliance for buyers in ~80 countries.</p>
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
                min={5}
                max={10000}
                step="0.01"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="25.00"
              />
              <p className="text-xs text-muted-foreground">Min $5, max $10,000.</p>
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