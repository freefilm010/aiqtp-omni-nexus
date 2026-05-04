import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { supabase } from "@/integrations/supabase/client";

interface StripeEmbeddedCheckoutProps {
  mode: "deposit";
  amountInCents?: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function StripeEmbeddedCheckout({
  amountInCents,
  customerEmail,
  userId,
  returnUrl,
}: StripeEmbeddedCheckoutProps) {
  // Check if Stripe is configured before rendering
  const stripePromise = getStripe();

  const fetchClientSecret = async (): Promise<string> => {
    const body = { amountInCents, customerEmail, userId, returnUrl, environment: getStripeEnvironment() };

    const { data, error } = await supabase.functions.invoke("create-deposit-checkout", { body });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || data?.error || "Failed to create checkout session");
    }
    return data.clientSecret;
  };

  // If Stripe is not configured, show a friendly error instead of crashing
  const isStripeConfigured = Boolean(import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN);
  if (!isStripeConfigured) {
    return (
      <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
        <p className="font-medium">Payments not configured</p>
        <p className="text-sm mt-1">VITE_PAYMENTS_CLIENT_TOKEN is not set. Add it in Vercel environment variables.</p>
      </div>
    );
  }

  const checkoutOptions = { fetchClientSecret };

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={stripePromise} options={checkoutOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}