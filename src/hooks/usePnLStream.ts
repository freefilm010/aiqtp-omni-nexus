/**
 * usePnLStream — subscribes to the in-app PnL event stream for live UI updates.
 * Uses the singleton pnlStream (no WebSocket server needed).
 */
import { useEffect, useState } from "react";
import { pnlStream, type PnLEvent, type PnLTotalsEvent } from "@/lib/pnlStream";

export function usePnLAssetStream() {
  const [latestEvent, setLatestEvent] = useState<PnLEvent | null>(null);
  const [events, setEvents] = useState<PnLEvent[]>([]);

  useEffect(() => {
    const unsub = pnlStream.onAssetUpdate((e) => {
      setLatestEvent(e);
      setEvents((prev) => {
        const updated = prev.filter((p) => p.symbol !== e.symbol);
        updated.push(e);
        return updated;
      });
    });
    return unsub;
  }, []);

  return { latestEvent, events };
}

export function usePnLTotalsStream() {
  const [totals, setTotals] = useState<PnLTotalsEvent | null>(null);

  useEffect(() => {
    const unsub = pnlStream.onTotalsUpdate(setTotals);
    return unsub;
  }, []);

  return totals;
}
