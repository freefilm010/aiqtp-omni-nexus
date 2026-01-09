import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type FloatingWindowKey =
  | "economic_calendar"
  | "heat_map"
  | "watchlist"
  | "token_creator"
  | "nft_creator";

export type FloatingWindowInstance = {
  id: string;
  key: FloatingWindowKey;
  title: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minimized: boolean;
  zIndex: number;
};

type WindowConfig = {
  title: string;
  defaultSize: { width: number; height: number };
  defaultPosition: { x: number; y: number };
};

const WINDOW_CONFIG: Record<FloatingWindowKey, WindowConfig> = {
  economic_calendar: {
    title: "Economic Calendar",
    defaultSize: { width: 520, height: 640 },
    defaultPosition: { x: 80, y: 90 },
  },
  heat_map: {
    title: "Heat Map",
    defaultSize: { width: 960, height: 620 },
    defaultPosition: { x: 100, y: 80 },
  },
  watchlist: {
    title: "Watchlist",
    defaultSize: { width: 520, height: 560 },
    defaultPosition: { x: 120, y: 110 },
  },
  token_creator: {
    title: "Token Creator",
    defaultSize: { width: 980, height: 680 },
    defaultPosition: { x: 90, y: 70 },
  },
  nft_creator: {
    title: "NFT Creator",
    defaultSize: { width: 980, height: 680 },
    defaultPosition: { x: 90, y: 70 },
  },
};

type FloatingWindowsContextValue = {
  windows: FloatingWindowInstance[];
  openWindow: (key: FloatingWindowKey) => void;
  closeWindow: (id: string) => void;
  bringToFront: (id: string) => void;
  updateWindow: (id: string, patch: Partial<Omit<FloatingWindowInstance, "id" | "key">>) => void;
  isOpen: (key: FloatingWindowKey) => boolean;
};

const FloatingWindowsContext = createContext<FloatingWindowsContextValue | null>(null);

const createId = () => `win_${Math.random().toString(36).slice(2)}_${Date.now()}`;

export const FloatingWindowsProvider = ({ children }: { children: React.ReactNode }) => {
  const [windows, setWindows] = useState<FloatingWindowInstance[]>([]);

  const bringToFront = useCallback((id: string) => {
    setWindows((prev) => {
      const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 60);
      return prev.map((w) => (w.id === id ? { ...w, zIndex: maxZ + 1 } : w));
    });
  }, []);

  const updateWindow = useCallback(
    (id: string, patch: Partial<Omit<FloatingWindowInstance, "id" | "key">>) => {
      setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
    },
    []
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const isOpen = useCallback(
    (key: FloatingWindowKey) => windows.some((w) => w.key === key),
    [windows]
  );

  const openWindow = useCallback(
    (key: FloatingWindowKey) => {
      setWindows((prev) => {
        const existing = prev.find((w) => w.key === key);
        const maxZ = prev.reduce((m, w) => Math.max(m, w.zIndex), 60);

        if (existing) {
          return prev.map((w) =>
            w.id === existing.id
              ? { ...w, minimized: false, zIndex: maxZ + 1 }
              : w
          );
        }

        const cfg = WINDOW_CONFIG[key];
        return [
          ...prev,
          {
            id: createId(),
            key,
            title: cfg.title,
            x: cfg.defaultPosition.x,
            y: cfg.defaultPosition.y,
            width: cfg.defaultSize.width,
            height: cfg.defaultSize.height,
            minimized: false,
            zIndex: maxZ + 1,
          },
        ];
      });
    },
    []
  );

  const value = useMemo<FloatingWindowsContextValue>(
    () => ({ windows, openWindow, closeWindow, bringToFront, updateWindow, isOpen }),
    [windows, openWindow, closeWindow, bringToFront, updateWindow, isOpen]
  );

  return (
    <FloatingWindowsContext.Provider value={value}>{children}</FloatingWindowsContext.Provider>
  );
};

export const useFloatingWindows = () => {
  const ctx = useContext(FloatingWindowsContext);
  if (!ctx) throw new Error("useFloatingWindows must be used within FloatingWindowsProvider");
  return ctx;
};
