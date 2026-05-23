// Stripe Configuration — publishable key from VITE_PAYMENTS_CLIENT_TOKEN env var
// Set in Vercel dashboard: pk_live_51SGwQbCS...
export const STRIPE_PUBLISHABLE_KEY =
  (import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined) || "";

export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  currency: 'usd',
  locale: 'en',
};
