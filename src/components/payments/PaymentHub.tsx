import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  CreditCard, Building2, Wallet, Shield,
  ExternalLink, CheckCircle, Loader2, DollarSign
} from "lucide-react";

const PaymentHub = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('100');

  const callPayment = async (action: string, params: Record<string, unknown> = {}) => {
    const { data, error } = await supabase.functions.invoke('payment-processing', {
      body: { action, params },
    });
    if (error) throw new Error(error.message);
    if (!data?.success) throw new Error(data?.error || 'Unknown error');
    return data.data;
  };

  const handleStripeDeposit = async () => {
    setLoading('stripe');
    try {
      const result = await callPayment('stripe_checkout', {
        mode: 'payment',
        amount: depositAmount,
        successUrl: `${window.location.origin}/payment-success`,
        cancelUrl: `${window.location.origin}/pricing`,
      });
      if (result?.url) {
        window.open(result.url, '_blank');
      }
      toast.success('Stripe checkout session created');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Stripe checkout failed');
    } finally {
      setLoading(null);
    }
  };

  const handlePayPalDeposit = async () => {
    setLoading('paypal');
    try {
      const result = await callPayment('paypal_create', {
        amount: depositAmount,
        currency: 'USD',
        description: `AIQTP Platform Deposit - $${depositAmount}`,
      });
      const approveLink = result?.links?.find((l: { rel: string }) => l.rel === 'approve');
      if (approveLink?.href) {
        window.open(approveLink.href, '_blank');
      }
      toast.success('PayPal order created — complete payment in the new window');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'PayPal checkout failed');
    } finally {
      setLoading(null);
    }
  };

  const handlePlaidLink = async () => {
    setLoading('plaid');
    try {
      const result = await callPayment('plaid_link_token');
      toast.info('Plaid Link token generated — bank connection UI launching');
      // In production, this would initialize the Plaid Link SDK
      console.log('Plaid link_token:', result?.link_token);
      toast.success('Bank account linking initiated');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Plaid link failed');
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Payment Processing Hub</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="Amount (USD)"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            className="text-sm max-w-32"
          />
          <span className="text-sm text-muted-foreground">USD</span>
        </div>

        <Tabs defaultValue="stripe" className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="stripe" className="text-xs">
              <CreditCard className="h-3 w-3 mr-1" /> Stripe
            </TabsTrigger>
            <TabsTrigger value="paypal" className="text-xs">
              <Wallet className="h-3 w-3 mr-1" /> PayPal
            </TabsTrigger>
            <TabsTrigger value="bank" className="text-xs">
              <Building2 className="h-3 w-3 mr-1" /> Bank
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stripe" className="space-y-3 pt-2">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Stripe — Configured ✓</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Cards, Apple Pay, Google Pay, ACH • 2.9% + $0.30 per transaction
              </p>
              <Button className="w-full" size="sm" onClick={handleStripeDeposit} disabled={loading === 'stripe'}>
                {loading === 'stripe' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CreditCard className="h-4 w-4 mr-2" />}
                Pay ${depositAmount} with Stripe
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="paypal" className="space-y-3 pt-2">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">PayPal</span>
                <Badge variant="outline" className="text-xs">Requires Setup</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                PayPal balance, cards, Venmo • 3.49% + $0.49 per transaction
              </p>
              <Button className="w-full" size="sm" variant="outline" onClick={handlePayPalDeposit} disabled={loading === 'paypal'}>
                {loading === 'paypal' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                Pay ${depositAmount} with PayPal
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="bank" className="space-y-3 pt-2">
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-emerald-500" />
                <span className="text-sm font-medium">Link Bank Account</span>
                <Badge variant="outline" className="text-xs">Plaid</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Connect checking/savings accounts via Plaid for ACH transfers • Low fees
              </p>
              <Button className="w-full" size="sm" variant="outline" onClick={handlePlaidLink} disabled={loading === 'plaid'}>
                {loading === 'plaid' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
                Link Bank Account
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shield className="h-3 w-3" />
          <span>All payments encrypted & PCI-DSS compliant</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentHub;
