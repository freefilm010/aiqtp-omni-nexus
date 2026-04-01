/**
 * Tax Report Generator — lot-level CSV export from RealizedEvents.
 * Includes holding period, short/long-term classification, and IRS-ready columns.
 */
import type { RealizedEvent } from "@/lib/taxLots";

function formatDate(iso: string): string {
  return iso.split("T")[0];
}

export function generateTaxReportCSV(events: RealizedEvent[]): string {
  const headers = [
    "Lot ID",
    "Symbol",
    "Quantity",
    "Date Acquired",
    "Date Sold",
    "Cost Basis (USD)",
    "Proceeds (USD)",
    "Gain/Loss (USD)",
    "Holding Days",
    "Term",
  ];

  const rows = events.map((e) => [
    e.lotId,
    e.symbol,
    e.qty.toFixed(6),
    formatDate(e.buyDate),
    formatDate(e.sellDate),
    e.costBasisUsd.toFixed(2),
    e.proceedsUsd.toFixed(2),
    e.gainLossUsd.toFixed(2),
    e.holdingDays.toString(),
    e.isLongTerm ? "Long-Term" : "Short-Term",
  ]);

  return [headers, ...rows].map((r) => r.join(",")).join("\n");
}

export function downloadTaxReport(events: RealizedEvent[]) {
  const csv = generateTaxReportCSV(events);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `tax-report-lots-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
