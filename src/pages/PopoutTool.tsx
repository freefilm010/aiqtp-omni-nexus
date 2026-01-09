import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, X } from "lucide-react";

import EconomicCalendar from "@/components/trading/EconomicCalendar";
import HeatMap from "@/components/trading/HeatMap";
import Watchlist from "@/components/trading/Watchlist";
import AIScreener from "@/components/screener/AIScreener";
import CryptoScreener from "@/components/screener/CryptoScreener";
import TokenCreator from "@/components/token/TokenCreator";
import NFTCreator from "@/components/nft/NFTCreator";

type ToolKey =
  | "calendar"
  | "heatmap"
  | "watchlist"
  | "screener"
  | "token-creator"
  | "nft-creator";

const TOOL_META: Record<ToolKey, { title: string; fullPath: string }> = {
  calendar: { title: "Economic Calendar", fullPath: "/calendar" },
  heatmap: { title: "Heat Map", fullPath: "/advanced-trading" },
  watchlist: { title: "Watchlist", fullPath: "/watchlist" },
  screener: { title: "Screener", fullPath: "/screener" },
  "token-creator": { title: "Token Creator", fullPath: "/token-launchpad" },
  "nft-creator": { title: "NFT Creator", fullPath: "/nft-studio" },
};

const PopoutTool = () => {
  const params = useParams();
  const tool = (params.tool as ToolKey | undefined) ?? "calendar";
  const meta = TOOL_META[tool] ?? TOOL_META.calendar;

  useEffect(() => {
    document.title = `${meta.title} — Pop-out`;
  }, [meta.title]);

  const content = useMemo(() => {
    switch (tool) {
      case "calendar":
        return <EconomicCalendar />;
      case "heatmap":
        return <HeatMap />;
      case "watchlist":
        return <Watchlist />;
      case "token-creator":
        return <TokenCreator />;
      case "nft-creator":
        return <NFTCreator />;
      case "screener":
        return (
          <Tabs defaultValue="ai" className="space-y-4">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="ai">AI Screener</TabsTrigger>
              <TabsTrigger value="standard">Screener</TabsTrigger>
            </TabsList>
            <TabsContent value="ai">
              <AIScreener />
            </TabsContent>
            <TabsContent value="standard">
              <CryptoScreener />
            </TabsContent>
          </Tabs>
        );
      default:
        return null;
    }
  }, [tool]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-12 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold truncate">{meta.title}</h1>
            <p className="text-[11px] text-muted-foreground truncate">
              Pop-out window (move this browser window to another monitor)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to={meta.fullPath}>
                <ExternalLink className="h-4 w-4" />
                Full Page
              </Link>
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="gap-2"
              onClick={() => window.close()}
              aria-label="Close pop-out"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-4">
        {content}
      </main>
    </div>
  );
};

export default PopoutTool;
