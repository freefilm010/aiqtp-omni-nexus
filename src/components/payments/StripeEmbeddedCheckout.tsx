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
  const fetchClientSecret = async (): Promise<string> => {
    const body = { amountInCents, customerEmail, userId, returnUrl, environment: getStripeEnvironment() };

    const { data, error } = await supabase.functions.invoke("create-deposit-checkout", { body });
    if (error || !data?.clientSecret) {
      throw new Error(error?.message || data?.error || "Failed to create checkout session");
    }
    return data.clientSecret;
  };

  const checkoutOptions = { fetchClientSecret };

  return (
    <div id="checkout" className="w-full">
      <EmbeddedCheckoutProvider stripe={getStripe()} options={checkoutOptions}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  );
}