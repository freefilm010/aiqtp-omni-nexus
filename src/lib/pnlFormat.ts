/** PnL formatting + color helpers using design system tokens */

export function formatPnL(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}$${value.toFixed(2)}`;
}

export function formatPnLPercent(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

/** Returns Tailwind class using semantic tokens for PnL coloring */
export function pnlColorClass(value: number): string {
  if (value > 0) return "text-emerald-500 dark:text-emerald-400";
  if (value < 0) return "text-destructive";
  return "text-muted-foreground";
}
