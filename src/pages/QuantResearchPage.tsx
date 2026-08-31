import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, FlaskConical, RefreshCw } from "lucide-react";

type Factor = { name: string; ic: number; samples: number; t_stat: number };
type Signal = { symbol: string; price: number; score: number };
type Res = {
  ok: boolean;
  reason?: string;
  as_of?: string;
  universe?: string[];
  observations?: number;
  horizon_bars?: number;
  factors?: Factor[];
  signals?: Signal[];
  source?: string;
};

const QuantResearchPage = () => {
  const [res, setRes] = useState<Res | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("qlib-factors", {
      body: { interval: "1d", horizon: 5, lookback: 365 },
    });
    setRes(error ? { ok: false, reason: error.message } : (data as Res));
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold font-mono">Quant Factor Research</h1>
            <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
              Qlib-style Alpha158 factor mining on live exchange candles. Ranked by information coefficient.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} /> Rerun
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Mining factors on real OHLCV…
          </div>
        ) : !res?.ok ? (
          <p className="text-sm text-destructive">{res?.reason ?? "Research run failed"}</p>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <FlaskConical className="h-4 w-4" /> Run summary
                </CardTitle>
                <CardDescription className="text-xs">
                  {res.universe?.length} symbols · {res.observations?.toLocaleString()} observations ·{" "}
                  {res.horizon_bars}-bar forward return · {res.source}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-1.5">
                {res.universe?.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] font-mono">
                    {s}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Factor leaderboard (IC)</CardTitle>
                  <CardDescription className="text-xs">
                    Spearman rank correlation of factor vs forward return. |IC| &gt; 0.03 is tradeable.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {res.factors?.map((f) => (
                    <div key={f.name} className="flex items-center justify-between border-b border-border/50 py-1.5">
                      <span className="text-xs font-mono">{f.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-muted-foreground">t={f.t_stat}</span>
                        <span
                          className={`text-xs font-mono ${f.ic >= 0 ? "text-emerald-400" : "text-destructive"}`}
                        >
                          {f.ic >= 0 ? "+" : ""}
                          {f.ic.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Composite cross-sectional signal</CardTitle>
                  <CardDescription className="text-xs">
                    IC-weighted z-score of the top 6 factors, computed on the latest bar.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {res.signals?.map((s, i) => (
                    <div key={s.symbol} className="flex items-center justify-between border-b border-border/50 py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground w-4">{i + 1}</span>
                        <span className="text-xs font-mono">{s.symbol}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ${s.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <span className={`text-xs font-mono ${s.score >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                        {s.score >= 0 ? "+" : ""}
                        {s.score.toFixed(3)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default QuantResearchPage;
