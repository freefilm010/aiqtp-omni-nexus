/**
 * Market Microstructure Engine
 * Full limit order book with price-time priority matching.
 */

export type OrderSide = "bid" | "ask";
export type OrderStatus = "open" | "filled" | "partial" | "cancelled";

export interface LimitOrder {
  id: string;
  price: number;
  size: number;
  filledSize: number;
  side: OrderSide;
  timestamp: number;
  status: OrderStatus;
}

export interface Trade {
  price: number;
  size: number;
  bidOrderId: string;
  askOrderId: string;
  timestamp: number;
}

export interface BookSnapshot {
  bids: { price: number; totalSize: number; orderCount: number }[];
  asks: { price: number; totalSize: number; orderCount: number }[];
  spread: number;
  midPrice: number;
}

export class MicrostructureBook {
  private bids: LimitOrder[] = [];
  private asks: LimitOrder[] = [];
  private trades: Trade[] = [];

  /** Add a limit order and attempt to match. */
  submit(order: Omit<LimitOrder, "filledSize" | "status">): Trade[] {
    const lo: LimitOrder = { ...order, filledSize: 0, status: "open" };
    const executions = this.tryMatch(lo);

    if (lo.size - lo.filledSize > 0) {
      lo.status = lo.filledSize > 0 ? "partial" : "open";
      const book = lo.side === "bid" ? this.bids : this.asks;
      book.push(lo);
      this.sortBook(lo.side);
    } else {
      lo.status = "filled";
    }

    return executions;
  }

  cancel(orderId: string): boolean {
    for (const book of [this.bids, this.asks]) {
      const idx = book.findIndex((o) => o.id === orderId);
      if (idx !== -1) {
        book[idx].status = "cancelled";
        book.splice(idx, 1);
        return true;
      }
    }
    return false;
  }

  /** Price-time priority matching. */
  private tryMatch(incoming: LimitOrder): Trade[] {
    const trades: Trade[] = [];
    const opposite = incoming.side === "bid" ? this.asks : this.bids;

    while (opposite.length > 0 && incoming.filledSize < incoming.size) {
      const best = opposite[0];

      const canMatch =
        incoming.side === "bid"
          ? incoming.price >= best.price
          : incoming.price <= best.price;

      if (!canMatch) break;

      const remaining = incoming.size - incoming.filledSize;
      const bestRemaining = best.size - best.filledSize;
      const fillQty = Math.min(remaining, bestRemaining);

      // Passive side determines price (maker gets their price)
      const fillPrice = best.price;

      const trade: Trade = {
        price: fillPrice,
        size: fillQty,
        bidOrderId: incoming.side === "bid" ? incoming.id : best.id,
        askOrderId: incoming.side === "ask" ? incoming.id : best.id,
        timestamp: Math.max(incoming.timestamp, best.timestamp),
      };

      trades.push(trade);
      this.trades.push(trade);

      incoming.filledSize += fillQty;
      best.filledSize += fillQty;

      if (best.filledSize >= best.size) {
        best.status = "filled";
        opposite.shift();
      } else {
        best.status = "partial";
      }
    }

    return trades;
  }

  private sortBook(side: OrderSide): void {
    const book = side === "bid" ? this.bids : this.asks;
    book.sort((a, b) =>
      side === "bid"
        ? b.price - a.price || a.timestamp - b.timestamp
        : a.price - b.price || a.timestamp - b.timestamp
    );
  }

  snapshot(depth: number = 10): BookSnapshot {
    const aggregate = (orders: LimitOrder[], max: number) => {
      const levels = new Map<number, { totalSize: number; orderCount: number }>();
      for (const o of orders) {
        const rem = o.size - o.filledSize;
        if (rem <= 0) continue;
        const existing = levels.get(o.price) ?? { totalSize: 0, orderCount: 0 };
        existing.totalSize += rem;
        existing.orderCount++;
        levels.set(o.price, existing);
      }
      return [...levels.entries()]
        .map(([price, data]) => ({ price, ...data }))
        .slice(0, max);
    };

    const bidLevels = aggregate(this.bids, depth);
    const askLevels = aggregate(this.asks, depth);

    const bestBid = bidLevels[0]?.price ?? 0;
    const bestAsk = askLevels[0]?.price ?? Infinity;

    return {
      bids: bidLevels,
      asks: askLevels,
      spread: bestAsk - bestBid,
      midPrice: (bestBid + bestAsk) / 2,
    };
  }

  get tradeHistory(): Trade[] {
    return this.trades;
  }

  get orderCount(): { bids: number; asks: number } {
    return { bids: this.bids.length, asks: this.asks.length };
  }
}
