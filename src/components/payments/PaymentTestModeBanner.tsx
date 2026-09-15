const clientToken = import.meta.env.VITE_PAYMENTS_CLIENT_TOKEN as string | undefined;

export function PaymentTestModeBanner() {
  if (!clientToken) {
    return (
      <div className="w-full border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-center text-sm text-destructive">
        Production card checkout is unavailable until payment-provider activation is complete.
      </div>
    );
  }
  if (!clientToken.startsWith("pk_test_")) return null;

  return (
    <div className="w-full border-b border-warning/30 bg-warning/10 px-4 py-2 text-center text-sm text-warning">
      All payments made in the preview are in test mode.{" "}
      <a
        href="https://docs.lovable.dev/features/payments#test-and-live-environments"
        target="_blank"
        rel="noopener noreferrer"
        className="underline font-medium"
      >
        Read more
      </a>
    </div>
  );
}