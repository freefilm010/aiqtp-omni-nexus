import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RiskAnalyticsPanel from "@/components/engines/RiskAnalyticsPanel";
import OptionsPricerPanel from "@/components/engines/OptionsPricerPanel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PIPELINE: { name: string; status: "live" | "wiring" | "backlog"; note: string }[] = [
  { name: "Risk Analytics (VaR/CVaR/Stress)", status: "live", note: "Launched on this page" },
  { name: "Options Pricer & Greeks", status: "live", note: "Launched on this page" },
  { name: "Volatility Surface", status: "wiring", note: "Needs an options-chain feed" },
  { name: "Regime Detection (HMM/KMeans)", status: "wiring", note: "Needs longer recorded history" },
  { name: "Chart Pattern Recognition", status: "wiring", note: "Needs OHLCV series wired to charts" },
  { name: "Backtest Replay Engine", status: "wiring", note: "Needs strategy selector UI" },
  { name: "Cross-Exchange Arbitrage", status: "wiring", note: "Needs 2+ authenticated venue feeds" },
  { name: "HFT Fill Simulator", status: "wiring", note: "Needs live order-book depth" },
  { name: "Signal / Automation Engine", status: "backlog", note: "Requires broker keys in backend vault" },
  { name: "Execution Planner", status: "backlog", note: "Requires broker keys in backend vault" },
  { name: "Autonomous Fund Manager", status: "backlog", note: "Requires broker keys + capital gate" },
  { name: "Macro Engine", status: "backlog", note: "Requires macro data provider" },
  { name: "Market Surveillance / Forensics", status: "backlog", note: "Admin console surface pending" },
  { name: "Evolution / RL Agents", status: "backlog", note: "Requires compute worker" },
  { name: "Multiverse & Transcendence Sims", status: "backlog", note: "Research tier, unscheduled" },
];

const badgeFor = (s: string) =>
  s === "live" ? "default" : s === "wiring" ? "secondary" : "outline";

const QuantEnginesPage = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 space-y-6">
      <div>
        <h1 className="text-xl sm:text-3xl font-bold">Quant Engine Suite</h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Institutional analytics engines and their live launch status.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RiskAnalyticsPanel />
        <OptionsPricerPanel />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Engine Launch Pipeline</CardTitle>
          <CardDescription className="text-xs">
            Honest status of every engine module in the codebase. No engine is listed live until it renders real data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {PIPELINE.map((e) => (
            <div key={e.name} className="flex items-center justify-between gap-3 border-b border-border/50 py-1.5">
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{e.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{e.note}</p>
              </div>
              <Badge variant={badgeFor(e.status) as "default" | "secondary" | "outline"} className="text-[10px] shrink-0">
                {e.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
    <Footer />
  </div>
);

export default QuantEnginesPage;
