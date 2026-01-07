import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Calculator, BookOpen, AlertTriangle, LineChart, DollarSign } from "lucide-react";

interface CDSData {
  name: string;
  ticker: string;
  spread: number;
  change: number;
  rating: string;
  maturity: string;
  notional: string;
}

const mockCDSData: CDSData[] = [
  { name: "Goldman Sachs", ticker: "GS", spread: 45.2, change: -2.3, rating: "A+", maturity: "5Y", notional: "$10M" },
  { name: "JPMorgan Chase", ticker: "JPM", spread: 38.5, change: 1.2, rating: "A+", maturity: "5Y", notional: "$10M" },
  { name: "Bank of America", ticker: "BAC", spread: 52.1, change: -0.8, rating: "A-", maturity: "5Y", notional: "$10M" },
  { name: "Citigroup", ticker: "C", spread: 58.3, change: 3.5, rating: "BBB+", maturity: "5Y", notional: "$10M" },
  { name: "Morgan Stanley", ticker: "MS", spread: 48.7, change: -1.1, rating: "A", maturity: "5Y", notional: "$10M" },
  { name: "Tesla", ticker: "TSLA", spread: 125.4, change: 8.2, rating: "BB+", maturity: "5Y", notional: "$5M" },
  { name: "Apple", ticker: "AAPL", spread: 22.1, change: -0.5, rating: "AA+", maturity: "5Y", notional: "$10M" },
  { name: "Microsoft", ticker: "MSFT", spread: 18.3, change: 0.2, rating: "AAA", maturity: "5Y", notional: "$10M" },
];

const bloombergCommands = [
  { category: "Single Name", commands: ["CDSW - CDS valuation", "CDS - Single name lookup", "CDTK - CDS ticker lookup", "QCDS - Quick CDS valuation"] },
  { category: "Index", commands: ["CDSI - Credit index lookup", "CDX - Credit index monitors", "CDIA - Credit index analysis", "MEMC - Credit index members"] },
  { category: "Structured", commands: ["CDST - Synthetic CDO tranche", "CDOT - Credit index tranche", "CDSO - CDS swaption valuation", "CIX - Custom index"] },
  { category: "Market Overview", commands: ["GCDS - Historical CDS comparison", "CMOV - CDS biggest movers", "WCDS - World CDS pricing", "CEHA - CDS scenario analysis"] },
];

const CreditDerivatives = () => {
  const [notional, setNotional] = useState("10000000");
  const [spread, setSpread] = useState("50");
  const [recovery, setRecovery] = useState("40");
  const [maturity, setMaturity] = useState("5");

  const calculatePremium = () => {
    const n = parseFloat(notional);
    const s = parseFloat(spread) / 10000; // Convert bps to decimal
    const m = parseFloat(maturity);
    return (n * s * m).toFixed(2);
  };

  const calculatePV01 = () => {
    const n = parseFloat(notional);
    const m = parseFloat(maturity);
    return ((n * m) / 10000).toFixed(2);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="monitor" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitor">CDS Monitor</TabsTrigger>
          <TabsTrigger value="calculator">Valuation</TabsTrigger>
          <TabsTrigger value="indices">Credit Indices</TabsTrigger>
          <TabsTrigger value="reference">Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="monitor">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5 text-primary" />
                CDS Spread Monitor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Ticker</th>
                      <th className="text-right p-2">Spread (bps)</th>
                      <th className="text-right p-2">Change</th>
                      <th className="text-center p-2">Rating</th>
                      <th className="text-center p-2">Maturity</th>
                      <th className="text-right p-2">Notional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCDSData.map((cds) => (
                      <tr key={cds.ticker} className="border-b hover:bg-accent/50">
                        <td className="p-2 font-medium">{cds.name}</td>
                        <td className="p-2 text-muted-foreground">{cds.ticker}</td>
                        <td className="p-2 text-right font-mono">{cds.spread.toFixed(1)}</td>
                        <td className={`p-2 text-right font-mono ${cds.change >= 0 ? "text-destructive" : "text-green-500"}`}>
                          {cds.change >= 0 ? "+" : ""}{cds.change.toFixed(1)}
                        </td>
                        <td className="p-2 text-center">
                          <Badge variant="outline">{cds.rating}</Badge>
                        </td>
                        <td className="p-2 text-center">{cds.maturity}</td>
                        <td className="p-2 text-right">{cds.notional}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calculator">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  CDS Valuation Calculator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Notional Amount ($)</label>
                  <Input
                    type="number"
                    value={notional}
                    onChange={(e) => setNotional(e.target.value)}
                    placeholder="10,000,000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">CDS Spread (bps)</label>
                  <Input
                    type="number"
                    value={spread}
                    onChange={(e) => setSpread(e.target.value)}
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Recovery Rate (%)</label>
                  <Input
                    type="number"
                    value={recovery}
                    onChange={(e) => setRecovery(e.target.value)}
                    placeholder="40"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Maturity (years)</label>
                  <Input
                    type="number"
                    value={maturity}
                    onChange={(e) => setMaturity(e.target.value)}
                    placeholder="5"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Valuation Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">Total Premium</p>
                  <p className="text-2xl font-bold">${parseFloat(calculatePremium()).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">PV01 (Dollar Duration)</p>
                  <p className="text-2xl font-bold">${parseFloat(calculatePV01()).toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">Annual Premium</p>
                  <p className="text-2xl font-bold">
                    ${(parseFloat(calculatePremium()) / parseFloat(maturity)).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-accent/50">
                  <p className="text-sm text-muted-foreground">Credit Event Payout</p>
                  <p className="text-2xl font-bold">
                    ${(parseFloat(notional) * (1 - parseFloat(recovery) / 100)).toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="indices">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>CDX North America</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>CDX.NA.IG Series 42</span>
                    <span className="font-mono">52.5 bps</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>CDX.NA.HY Series 42</span>
                    <span className="font-mono">325.2 bps</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>CDX.NA.IG 5Y</span>
                    <span className="font-mono">48.3 bps</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>CDX.NA.IG 10Y</span>
                    <span className="font-mono">72.1 bps</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>iTraxx Europe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>iTraxx Europe Main Series 41</span>
                    <span className="font-mono">58.7 bps</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>iTraxx Europe Crossover</span>
                    <span className="font-mono">298.5 bps</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>iTraxx Europe Senior Financials</span>
                    <span className="font-mono">62.4 bps</span>
                  </div>
                  <div className="flex justify-between p-3 rounded bg-accent/50">
                    <span>iTraxx Europe Sub Financials</span>
                    <span className="font-mono">118.9 bps</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reference">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Bloomberg Terminal Commands Reference
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {bloombergCommands.map((section) => (
                  <div key={section.category}>
                    <h3 className="font-semibold mb-3">{section.category}</h3>
                    <div className="space-y-2">
                      {section.commands.map((cmd) => (
                        <div key={cmd} className="p-2 rounded bg-accent/50 font-mono text-sm">
                          {cmd}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreditDerivatives;
