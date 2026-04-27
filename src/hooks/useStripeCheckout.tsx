import { useState, useCallback } from "react";
import { StripeEmbeddedCheckout } from "@/components/payments/StripeEmbeddedCheckout";

interface SubscriptionOptions {
  mode: "subscription";
  priceId: string;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

interface DepositOptions {
  mode: "deposit";
  amountInCents: number;
  customerEmail?: string;
  userId?: string;
  returnUrl?: string;
}

type CheckoutOptions = SubscriptionOptions | DepositOptions;

export function useStripeCheckout() {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<CheckoutOptions | null>(null);

  const openCheckout = useCallback((opts: CheckoutOptions) => {
    setOptions(opts);
    setIsOpen(true);
  }, []);

  const closeCheckout = useCallback(() => {
    setIsOpen(false);
    setOptions(null);
  }, []);

  const checkoutElement = isOpen && options
    ? <StripeEmbeddedCheckout {...options} />
    : null;

  return { openCheckout, closeCheckout, isOpen, checkoutElement };
}