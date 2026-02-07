import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import TradingViewChart from "./TradingViewChart";
import {
  Activity,
  Target,
  GitBranch,
  Waves,
} from "lucide-react";

const INDICATORS = [
  { id: "sma", name: "SMA (20)", category: "Trend", enabled: true, color: "#f59e0b" },
  { id: "ema", name: "EMA (12)", category: "Trend", enabled: false, color: "#10b981" },
  { id: "ema26", name: "EMA (26)", category: "Trend", enabled: false, color: "#ef4444" },
  { id: "bb", name: "Bollinger Bands", category: "Volatility", enabled: true, color: "#8b5cf6" },
  { id: "rsi", name: "RSI (14)", category: "Momentum", enabled: false, color: "#06b6d4" },
  { id: "macd", name: "MACD", category: "Momentum", enabled: false, color: "#ec4899" },
  { id: "stoch", name: "Stochastic", category: "Momentum", enabled: false, color: "#f97316" },
  { id: "atr", name: "ATR (14)", category: "Volatility", enabled: false, color: "#84cc16" },
  { id: "volume", name: "Volume", category: "Volume", enabled: true, color: "#64748b" },
  { id: "vwap", name: "VWAP", category: "Volume", enabled: false, color: "#a855f7" },
  { id: "ichimoku", name: "Ichimoku Cloud", category: "Trend", enabled: false, color: "#14b8a6" },
  { id: "pivot", name: "Pivot Points", category: "Support/Resistance", enabled: false, color: "#f43f5e" },
  { id: "obv", name: "OBV", category: "Volume", enabled: false, color: "#0ea5e9" },
  { id: "supertrend", name: "SuperTrend", category: "Trend", enabled: false, color: "#22c55e" },
  { id: "adx", name: "ADX (14)", category: "Trend", enabled: false, color: "#eab308" },
];

const indicatorCategories = [...new Set(INDICATORS.map((i) => i.category))];

const AdvancedCharts = () => {
  const [activeIndicators, setActiveIndicators] = useState(
    INDICATORS.filter((i) => i.enabled).map((i) => i.id)
  );

  const toggleIndicator = (id: string) => {
    setActiveIndicators((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Main Chart - Now using TradingView lightweight-charts */}
        <div className="lg:col-span-4">
          <TradingViewChart height={550} />
        </div>

        {/* Indicators Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Indicators
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="p-4 space-y-4">
                {indicatorCategories.map((category) => (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-2">
                      {category === "Trend" && <GitBranch className="h-3 w-3 text-muted-foreground" />}
                      {category === "Momentum" && <Waves className="h-3 w-3 text-muted-foreground" />}
                      {category === "Support/Resistance" && <Target className="h-3 w-3 text-muted-foreground" />}
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {category}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {INDICATORS.filter((i) => i.category === category).map((indicator) => (
                        <Button
                          key={indicator.id}
                          variant={activeIndicators.includes(indicator.id) ? "secondary" : "ghost"}
                          size="sm"
                          className="w-full justify-start text-xs h-8"
                          onClick={() => toggleIndicator(indicator.id)}
                        >
                          <div
                            className="w-2 h-2 rounded-full mr-2"
                            style={{ backgroundColor: indicator.color }}
                          />
                          {indicator.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Market Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">24h High</div>
            <div className="text-lg font-bold font-mono">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">24h Low</div>
            <div className="text-lg font-bold font-mono">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">24h Volume</div>
            <div className="text-lg font-bold font-mono">--</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground mb-1">Market Cap</div>
            <div className="text-lg font-bold font-mono">--</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedCharts;
