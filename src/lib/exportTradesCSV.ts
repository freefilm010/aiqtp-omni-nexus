/**
 * FIFO Tax Export — fee + slippage aware.
 * Generates CSV with lot-level cost basis, proceeds, fees, and PnL.
 */
import type { TradeLog } from "@/lib/data/types";

interface Lot {
  qty: number;
  price: number; // effective price
  date: string;
}

export function exportTradesCSV(trades: TradeLog[]) {
  const lotsMap = new Map<string, Lot[]>();
  const rows: string[] = [
    "Symbol,Date Acquired,Date Sold,Quantity,Cost Basis (USD),Proceeds (USD),Fees (USD),Gain/Loss (USD)",
  ];

  const chrono = [...trades].reverse();

  for (const t of chrono) {
    const symbol = t.symbol.replace(/\/.*$/, "").toUpperCase();
    const qty = Math.abs(t.quantity);
    const price = t.price;
    const fee = t.fee ?? 0;
    const slippagePct = t.slippagePct ?? 0;
    const isBuy = t.side === "buy";

    if (!lotsMap.has(symbol)) lotsMap.set(symbol, []);
    const lots = lotsMap.get(symbol)!;

    if (isBuy) {
      const effectivePrice = price * (1 + slippagePct) + (qty > 0 ? fee / qty : 0);
      lots.push({ qty, price: effectivePrice, date: t.createdAt });
    } else {
      const effectivePrice = price * (1 - slippagePct);
      let sellQty = qty;
      let feeApplied = false;

      while (sellQty > 0 && lots.length > 0) {
        const lot = lots[0];
        const used = Math.min(lot.qty, sellQty);
        const costBasis = used * lot.price;
        const sellFee = !feeApplied ? fee : 0;
        feeApplied = true;
        const proceeds = used * effectivePrice - sellFee;
        const pnl = proceeds - costBasis;

        rows.push(
          [
            symbol,
            lot.date.split("T")[0],
            t.createdAt.split("T")[0],
            used.toFixed(6),
            costBasis.toFixed(2),
            proceeds.toFixed(2),
            sellFee.toFixed(2),
            pnl.toFixed(2),
          ].join(",")
        );

        lot.qty -= used;
        sellQty -= used;
        if (lot.qty <= 0) lots.shift();
      }
    }
  }

  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tax-report-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
