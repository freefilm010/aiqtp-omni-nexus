import { createContext, useContext, useState, type ReactNode } from "react";
import type { BaseCurrency } from "@/hooks/useFxRates";

interface BaseCurrencyContextType {
  currency: BaseCurrency;
  setCurrency: (c: BaseCurrency) => void;
}

const BaseCurrencyContext = createContext<BaseCurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
});

export function BaseCurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<BaseCurrency>("USD");

  return (
    <BaseCurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </BaseCurrencyContext.Provider>
  );
}

export function useBaseCurrency() {
  return useContext(BaseCurrencyContext);
}
