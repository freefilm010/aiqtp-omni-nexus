import { useQuery } from "@tanstack/react-query";

export type BaseCurrency = "USD" | "EUR" | "GBP" | "BTC";

export interface FxRates {
  USD: number;
  EUR: number;
  GBP: number;
  BTC: number;
}

const FALLBACK_RATES: FxRates = { USD: 1, EUR: 0.92, GBP: 0.79, BTC: 0.000014 };

export function useFxRates() {
  return useQuery({
    queryKey: ["fx", "rates"],
    queryFn: async (): Promise<FxRates> => {
      try {
        const res = await fetch(
          "https://api.exchangerate.host/latest?base=USD&symbols=EUR,GBP"
        );
        if (!res.ok) return FALLBACK_RATES;
        const data = await res.json();
        return {
          USD: 1,
          EUR: data.rates?.EUR ?? FALLBACK_RATES.EUR,
          GBP: data.rates?.GBP ?? FALLBACK_RATES.GBP,
          BTC: FALLBACK_RATES.BTC, // BTC rate from market prices instead
        };
      } catch {
        return FALLBACK_RATES;
      }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

/** Convert a USD amount to the target currency */
export function convertCurrency(
  amountUsd: number,
  currency: BaseCurrency,
  rates: FxRates | undefined
): number {
  if (!rates || currency === "USD") return amountUsd;
  return amountUsd * (rates[currency] ?? 1);
}

/** Format symbol for display */
export function currencySymbol(currency: BaseCurrency): string {
  switch (currency) {
    case "EUR": return "€";
    case "GBP": return "£";
    case "BTC": return "₿";
    default: return "$";
  }
}
