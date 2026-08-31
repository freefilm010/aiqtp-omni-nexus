import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { blackScholes, greeks, type BSInput, type OptionType } from "@/lib/derivatives/optionsPricer";

export default function OptionsPricerPanel() {
  const { getPrice, isFresh } = useMarketPrices();
  const spotLive = getPrice?.("BTC")?.priceNumeric ?? 0;

  const [type, setType] = useState<OptionType>("call");
  const [strike, setStrike] = useState("");
  const [days, setDays] = useState("30");
  const [vol, setVol] = useState("60");
  const [rate, setRate] = useState("4.5");

  const K = Number(strike) || spotLive;
  const input: BSInput = useMemo(
    () => ({
      S: spotLive,
      K,
      r: (Number(rate) || 0) / 100,
      t: (Number(days) || 0) / 365,
      sigma: (Number(vol) || 0) / 100,
    }),
    [spotLive, K, rate, days, vol],
  );

  const ready = spotLive > 0 && input.sigma > 0 && input.t > 0;
  const price = ready ? blackScholes(input, type) : 0;
  const g = ready ? greeks(input, type) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Options Pricer &amp; Greeks</CardTitle>
        <CardDescription className="text-xs">
          Black-Scholes on the live BTC spot {isFresh ? "(live feed)" : "(feed stale — values held)"}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={type} onValueChange={(v) => setType(v as OptionType)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="call">Call</TabsTrigger>
            <TabsTrigger value="put">Put</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <Label className="text-[10px]">Spot (live)</Label>
            <Input readOnly value={spotLive ? spotLive.toFixed(2) : "—"} className="font-mono text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Strike</Label>
            <Input value={strike} placeholder={spotLive ? spotLive.toFixed(0) : "0"} onChange={(e) => setStrike(e.target.value)} className="font-mono text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Days to expiry</Label>
            <Input value={days} onChange={(e) => setDays(e.target.value)} className="font-mono text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">IV %</Label>
            <Input value={vol} onChange={(e) => setVol(e.target.value)} className="font-mono text-xs" />
          </div>
          <div>
            <Label className="text-[10px]">Rate %</Label>
            <Input value={rate} onChange={(e) => setRate(e.target.value)} className="font-mono text-xs" />
          </div>
        </div>

        {!ready ? (
          <p className="text-xs text-muted-foreground">Awaiting a live spot price and valid inputs.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="rounded-md border border-primary/40 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Theoretical Price</p>
              <p className="text-sm font-mono">${price.toFixed(2)}</p>
            </div>
            {g && Object.entries(g).map(([k, v]) => (
              <div key={k} className="rounded-md border border-border p-2">
                <p className="text-[10px] uppercase text-muted-foreground">{k}</p>
                <p className="text-sm font-mono">{v.toFixed(4)}</p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
