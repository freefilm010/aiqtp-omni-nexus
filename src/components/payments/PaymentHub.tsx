import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { toast } from "sonner";
import { CreditCard, Wallet, Shield, DollarSign } from "lucide-react";

const PaymentHub = () => {
  const { user } = useAuth();
  const [depositAmount, setDepositAmount] = useState("100");
  const [usdBalance, setUsdBalance] = useState<number | null>(null);
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("portfolio_holdings")
      .select("quantity")
      .eq("user_id", user.id)
      .eq("symbol", "USD")
      .maybeSingle()
      .then(({ data }) => setUsdBalance(Number(data?.quantity ?? 0)));
  }, [user?.id]);

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
    openCheckout({
      mode: "deposit",
      amountInCents: Math.round(amt * 100),
      customerEmail: user.email ?? undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Fund Trading Balance</CardTitle>
          </div>
          {usdBalance !== null && (
            <Badge variant="secondary">
              Balance: ${usdBalance.toFixed(2)}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              min={20}
              max={10000}
              step="0.01"
              placeholder="Amount (USD)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="text-sm max-w-32"
            />
            <span className="text-sm text-muted-foreground">USD</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Min $20 / Max $10,000 per deposit. Funds credit instantly to your USD balance.
          </p>
          <Button className="w-full" size="sm" onClick={handleDeposit}>
            <CreditCard className="h-4 w-4 mr-2" />
            Deposit ${depositAmount}
          </Button>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>Powered by Stripe — encrypted &amp; PCI-DSS compliant</span>
        </div>
      </CardContent>

      <Dialog open={isOpen} onOpenChange={(o) => !o && closeCheckout()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complete your deposit</DialogTitle>
          </DialogHeader>
          {checkoutElement}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PaymentHub;
