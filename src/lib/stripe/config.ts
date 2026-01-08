// Stripe Configuration
// Publishable key is safe to include in frontend code
export const STRIPE_PUBLISHABLE_KEY = 'pk_live_51SmyGBER2bvj7zgCIy48p9tkpTQXq6e9DJO3UL3dThqGcEKQcdqDQIGTBBLxBavOOLtAjdZmWmM7tNQ1rqKknUno000BUgcNlN';

export const stripeConfig = {
  publishableKey: STRIPE_PUBLISHABLE_KEY,
  // Add more config options as needed
  currency: 'usd',
  locale: 'en',
};
