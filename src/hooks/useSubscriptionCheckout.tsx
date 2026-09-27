import { useState, useCallback } from "react";
import { StripeSubscriptionCheckout } from "@/components/payments/StripeSubscriptionCheckout";

interface SubscriptionCheckoutOptions {
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

export function useSubscriptionCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<SubscriptionCheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: SubscriptionCheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = isOpen && options
    ? <StripeSubscriptionCheckout {...options} />
    : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}
