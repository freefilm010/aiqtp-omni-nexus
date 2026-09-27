import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface StripeSubscriptionCheckoutProps {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeSubscriptionCheckout({
  priceId,
  customerEmail,
  userId,
  returnUrl,
}: StripeSubscriptionCheckoutProps) {
  const fetchClientSecret = async (): Promise<string> => {
    const body = { priceId, customerEmail, userId, returnUrl, environment: getStripeEnvironment() };
    const { data, error } = await supabase.functions.invoke("create-subscription-checkout", { body });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || data?.error || "Failed to create checkout session");
    }
    return data.clientSecret;
  };

  const isStripeConfigured = Boolean(import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN);
  if (!isStripeConfigured) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
        <p className="font-medium">Payments not configured</p>
        <p className="text-sm mt-1">Complete live payment-provider activation to enable checkout.</p>
      </div>
    );
  }

  const checkoutOptions = { fetchClientSecret };

  return (
    <div id="subscription-checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={checkoutOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}
