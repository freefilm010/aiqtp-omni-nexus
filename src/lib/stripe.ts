import { loadStripe, Stripe } from "@stripe/stripe-js";

type StripeEnv = 'sandbox' | 'live';

const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;
const environment: StripeEnv = clientToken?.startsWith('pk_test_') ? 'sandbox' : 'live';

let stripePromise: Promise<Stripe | null> | null = null;

/**
 * Returns a promise that resolves to the Stripe.js instance.
 * Returns a promise resolving to null (instead of throwing) when the
 * publishable key env var is absent — callers should check for null and
 * show a friendly "payments unavailable" message rather than crashing.
 */
export function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    if (!clientToken) {
      console.warn("VITE_PAYMENTS_CLIENT_TOKEN is not set — Stripe payments are disabled");
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(clientToken);
  }
  return stripePromise;
}

export function getStripeEnvironment(): StripeEnv {
  return environment;
}