/**
 * Verified Ledger — strictly read-only view of the user's holdings + trade logs
 * straight from the database. No speculation, no derived/synthetic rows.
 * CSV export is a client-side dump of exactly what the page shows.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ShieldCheck, AlertCircle } from "lucide-react";
import Header from "@/components/Header";

interface Holding {
  id: string;
  symbol: string;
  name: string | null;
  quantity: number;
  value_usd: number;
  allocation_percent: number;
  updated_at: string;
}

interface TradeLog {
  id: string;
  symbol: string | null;
  side: string | null;
  action: string | null;
  price: number | null;
  quantity: number | null;
  fee: number | null;
  status: string | null;
  created_at: string;
}

const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });

const toCsv = (rows: Record<string, unknown>[]): string => {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
};

const downloadCsv = (filename: string, csv: string) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const VerifiedLedger = () => {
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [trades, setTrades] = useState<TradeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [h, t] = await Promise.all([
        supabase
          .from("portfolio_holdings")
          .select("id,symbol,name,quantity,value_usd,allocation_percent,updated_at")
          .eq("user_id", user.id)
          .order("value_usd", { ascending: false, nullsFirst: false }),
        supabase
          .from("trade_logs")
          .select("id,symbol,side,action,price,quantity,fee,status,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1000),
      ]);
      if (cancelled) return;
      if (h.error) setError(h.error.message);
      if (t.error) setError(t.error.message);
      setHoldings((h.data ?? []) as Holding[]);
      setTrades((t.data ?? []) as TradeLog[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const totals = useMemo(() => {
    const sum = holdings.reduce((acc, r) => acc + (Number(r.value_usd) || 0), 0);
    return { totalUsd: sum, holdingsCount: holdings.length, tradesCount: trades.length };
  }, [holdings, trades]);

  if (!user) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-12">
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Please sign in to view your verified ledger.
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Verified Ledger
            </h1>
            <p className="text-sm text-muted-foreground">
              Read-only. Direct from the database. No estimates, no fills, no synthetic rows.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={holdings.length === 0}
              onClick={() => downloadCsv(`holdings_${user.id}.csv`, toCsv(holdings as unknown as Record<string, unknown>[]))}
            >
              <Download className="h-4 w-4 mr-2" /> Holdings CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={trades.length === 0}
              onClick={() => downloadCsv(`trades_${user.id}.csv`, toCsv(trades as unknown as Record<string, unknown>[]))}
            >
              <Download className="h-4 w-4 mr-2" /> Trades CSV
            </Button>
          </div>
        </header>

        {error && (
          <Card className="border-destructive/40">
            <CardContent className="p-4 flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" /> {error}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Verified portfolio total</p>
              <p className="text-xl font-bold">{fmtUsd(totals.totalUsd)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Holdings rows</p>
              <p className="text-xl font-bold">{totals.holdingsCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">Trade log rows</p>
              <p className="text-xl font-bold">{totals.tradesCount}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Holdings (portfolio_holdings)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : holdings.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No holdings recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 px-2">Symbol</th>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-right py-2 px-2">Quantity</th>
                    <th className="text-right py-2 px-2">Value (USD)</th>
                    <th className="text-right py-2 px-2">Allocation</th>
                    <th className="text-left py-2 px-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.id} className="border-b border-border/40">
                      <td className="py-2 px-2 font-medium">
                        <Badge variant="outline">{h.symbol}</Badge>
                      </td>
                      <td className="py-2 px-2">{h.name ?? "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {Number(h.quantity).toLocaleString("en-US", { maximumFractionDigits: 8 })}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">{fmtUsd(Number(h.value_usd) || 0)}</td>
                      <td className="py-2 px-2 text-right tabular-nums">{Number(h.allocation_percent).toFixed(2)}%</td>
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {new Date(h.updated_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Trade Logs (trade_logs)</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading…</p>
            ) : trades.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">No trades recorded.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground border-b">
                  <tr>
                    <th className="text-left py-2 px-2">When</th>
                    <th className="text-left py-2 px-2">Symbol</th>
                    <th className="text-left py-2 px-2">Side</th>
                    <th className="text-left py-2 px-2">Action</th>
                    <th className="text-right py-2 px-2">Qty</th>
                    <th className="text-right py-2 px-2">Price</th>
                    <th className="text-right py-2 px-2">Fee</th>
                    <th className="text-left py-2 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((t) => (
                    <tr key={t.id} className="border-b border-border/40">
                      <td className="py-2 px-2 text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString()}
                      </td>
                      <td className="py-2 px-2">{t.symbol ?? "—"}</td>
                      <td className="py-2 px-2">{t.side ?? "—"}</td>
                      <td className="py-2 px-2">{t.action ?? "—"}</td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {t.quantity != null ? Number(t.quantity).toLocaleString() : "—"}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {t.price != null ? fmtUsd(Number(t.price)) : "—"}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {t.fee != null ? fmtUsd(Number(t.fee)) : "—"}
                      </td>
                      <td className="py-2 px-2">{t.status ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground text-center pt-2">
          This page does not modify, infer, or estimate any values. It only renders rows that physically exist in your database.
        </p>
      </main>
    </div>
  );
};

export default VerifiedLedger;
