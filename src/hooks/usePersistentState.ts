import { useEffect, useRef, useState } from "react";

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
  const skipNextWriteRef = useRef(true);

  useEffect(() => {
    skipNextWriteRef.current = true;
    setValue(readStoredValue(key, fallback));
  }, [key]);

  useEffect(() => {
    if (!key || typeof window === "undefined") return;

    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false;
      return;
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage write failures and keep in-memory state.
    }
  }, [key, value]);

  return [value, setValue] as const;
};