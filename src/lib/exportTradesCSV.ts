/**
 * FIFO Tax Export — generates a CSV of realized trade events
 * with lot-level cost basis, proceeds, and PnL.
 */

interface Trade {
  symbol: string;
  side: string;
  quantity: number;
  price: number;
  createdAt: string;
}

interface Lot {
  qty: number;
  price: number;
  date: string;
}

export function exportTradesCSV(trades: Trade[]) {
  const lotsMap = new Map<string, Lot[]>();
  const rows: string[] = [
    "Symbol,Date Acquired,Date Sold,Quantity,Cost Basis (USD),Proceeds (USD),Gain/Loss (USD)",
  ];

  // Process chronologically
  const chrono = [...trades].reverse();

  for (const t of chrono) {
    const symbol = t.symbol.replace(/\/.*$/, "").toUpperCase();
    const qty = Math.abs(t.quantity);
    const price = t.price;
    const isBuy = t.side === "buy";

    if (!lotsMap.has(symbol)) lotsMap.set(symbol, []);
    const lots = lotsMap.get(symbol)!;

    if (isBuy) {
      lots.push({ qty, price, date: t.createdAt });
    } else {
      let sellQty = qty;
      while (sellQty > 0 && lots.length > 0) {
        const lot = lots[0];
        const used = Math.min(lot.qty, sellQty);
        const costBasis = used * lot.price;
        const proceeds = used * price;
        const pnl = proceeds - costBasis;

        rows.push(
          [
            symbol,
            lot.date.split("T")[0],
            t.createdAt.split("T")[0],
            used.toFixed(6),
            costBasis.toFixed(2),
            proceeds.toFixed(2),
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
