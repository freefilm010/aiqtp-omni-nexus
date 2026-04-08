import { useEffect, useState } from "react";

const readStoredValue = <T,>(key: string | null, fallback: T): T => {
  if (!key || typeof window === "undefined") return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const usePersistentState = <T,>(key: string | null, fallback: T) => {
  const [value, setValue] = useState<T>(() => readStoredValue(key, fallback));

  useEffect(() => {
    setValue(readStoredValue(key, fallback));
  }, [key, fallback]);

  useEffect(() => {
    if (!key || typeof window === "undefined") return;

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write failures and keep in-memory state.
    }
  }, [key, value]);

  return [value, setValue] as const;
};