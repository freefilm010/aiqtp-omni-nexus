import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VolSurface, type VolPoint } from "@/lib/derivatives/volSurface";
import { Loader2 } from "lucide-react";

const MATURITIES = [
  { label: "1W", years: 7 / 365, window: 7 },
  { label: "1M", years: 30 / 365, window: 30 },
  { label: "3M", years: 90 / 365, window: 90 },
  { label: "6M", years: 180 / 365, window: 180 },
];
const MONEYNESS = [0.8, 0.9, 1.0, 1.1, 1.2];

const stdev = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = a.reduce((x, y) => x + y, 0) / a.length;
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

const VolSurfacePanel = () => {
  const [closes, setCloses] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit=365")
      .then((r) => {
        if (!r.ok) throw new Error(`klines ${r.status}`);
        return r.json();
      })
      .then((rows: unknown[][]) => alive && setCloses(rows.map((r) => Number(r[4]))))
      .catch((e) => alive && setError(e instanceof Error ? e.message : String(e)));
    return () => {
      alive = false;
    };
  }, []);

  const model = useMemo(() => {
    if (!closes || closes.length < 200) return null;
    const spot = closes[closes.length - 1];
    const rets = closes.slice(1).map((c, i) => Math.log(c / closes[i]));

    // Realized vol term structure from real daily log returns.
    const termVol: Record<string, number> = {};
    for (const m of MATURITIES) {
      termVol[m.label] = stdev(rets.slice(-m.window)) * Math.sqrt(365);
    }
    // Empirical skew: downside vs upside realized vol drives the moneyness smile.
    const down = stdev(rets.filter((r) => r < 0)) * Math.sqrt(365);
    const up = stdev(rets.filter((r) => r > 0)) * Math.sqrt(365);
    const skew = down - up;

    const points: VolPoint[] = [];
    for (const m of MATURITIES) {
      for (const k of MONEYNESS) {
        const smile = skew * (1 - k) + 0.5 * Math.abs(1 - k) * termVol[m.label];
        points.push({
          strike: Number((spot * k).toFixed(2)),
          maturity: m.years,
          iv: Math.max(0.01, termVol[m.label] + smile),
        });
      }
    }

    const surface = new VolSurface(points);
    return { spot, skew, termVol, surface };
  }, [closes]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Volatility Surface</CardTitle>
        <CardDescription className="text-xs">
          Realized-vol surface built from 365 days of real BTC returns, bilinearly interpolated across
          strike × maturity. Labeled realized (not implied) — no options feed is connected.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-xs text-destructive">{error}</p>
        ) : !model ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Building surface…
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] text-muted-foreground font-mono">
              spot ${model.spot.toLocaleString(undefined, { maximumFractionDigits: 2 })} · skew{" "}
              {(model.skew * 100).toFixed(2)} vol pts
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr className="text-muted-foreground">
                    <th className="text-left font-normal py-1">Moneyness</th>
                    {MATURITIES.map((m) => (
                      <th key={m.label} className="text-right font-normal py-1">
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MONEYNESS.map((k) => (
                    <tr key={k} className="border-t border-border/50">
                      <td className="py-1">{(k * 100).toFixed(0)}%</td>
                      {MATURITIES.map((m) => (
                        <td key={m.label} className="text-right py-1">
                          {(model.surface.getIV(model.spot * k, m.years) * 100).toFixed(1)}%
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VolSurfacePanel;
