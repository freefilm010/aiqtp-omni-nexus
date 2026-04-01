/**
 * PnL Event Stream — lightweight pub/sub for real-time PnL updates.
 * Used by the PnL engine to broadcast changes to any subscriber (UI, logging, alerts).
 */

export interface PnLEvent {
  symbol: string;
  unrealizedPnL: number;
  realizedPnL: number;
  totalValue: number;
  timestamp: number;
}

export interface PnLTotalsEvent {
  totalValue: number;
  totalUnrealized: number;
  totalRealized: number;
  totalFees: number;
  timestamp: number;
}

type Listener<T> = (event: T) => void;

class PnLEventStream {
  private assetListeners: Set<Listener<PnLEvent>> = new Set();
  private totalsListeners: Set<Listener<PnLTotalsEvent>> = new Set();

  emitAssetUpdate(event: PnLEvent) {
    this.assetListeners.forEach((cb) => cb(event));
  }

  emitTotalsUpdate(event: PnLTotalsEvent) {
    this.totalsListeners.forEach((cb) => cb(event));
  }

  onAssetUpdate(cb: Listener<PnLEvent>): () => void {
    this.assetListeners.add(cb);
    return () => this.assetListeners.delete(cb);
  }

  onTotalsUpdate(cb: Listener<PnLTotalsEvent>): () => void {
    this.totalsListeners.add(cb);
    return () => this.totalsListeners.delete(cb);
  }
}

/** Singleton stream instance */
export const pnlStream = new PnLEventStream();
