import { loadStripe, Stripe } from "@stripe/stripe-js";

type StripeEnv = 'sandbox' | 'live';

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

function paymentsEnvironment(): StripeEnv {
  if (clientToken?.startsWith('pk_test_')) return 'sandbox';
  if (clientToken?.startsWith('pk_live_')) return 'live';
  throw new Error("Card payments are not configured for this build. Complete payment-provider activation to enable checkout.");
}

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a promise that resolves to the Stripe.js instance.
 * Returns a promise resolving to null (instead of throwing) when the
 * publishable key env var is absent — callers should check for null and
 * show a friendly "payments unavailable" message rather than crashing.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    paymentsEnvironment();
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return paymentsEnvironment();
}