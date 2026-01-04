import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StrategyBuilder from "@/components/strategy/StrategyBuilder";
import IndicatorLibrary from "@/components/strategy/IndicatorLibrary";
import StrategyBacktest from "@/components/strategy/StrategyBacktest";
import LiveStrategies from "@/components/strategy/LiveStrategies";
import BacktestPanel from "@/components/research/BacktestPanel";

const FreqtradeStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Strategy Studio</h1>
          <p className="text-muted-foreground mt-1">
            Build, backtest, and deploy trading strategies • Inspired by Freqtrade architecture
          </p>
        </div>

        <Tabs defaultValue="builder" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="builder">Strategy Builder</TabsTrigger>
            <TabsTrigger value="indicators">Indicator Library</TabsTrigger>
            <TabsTrigger value="backtest">Advanced Backtest</TabsTrigger>
            <TabsTrigger value="live">Live Strategies</TabsTrigger>
            <TabsTrigger value="legacy">Legacy Backtest</TabsTrigger>
          </TabsList>

          <TabsContent value="builder">
            <StrategyBuilder />
          </TabsContent>

          <TabsContent value="indicators">
            <IndicatorLibrary />
          </TabsContent>

          <TabsContent value="backtest">
            <StrategyBacktest />
          </TabsContent>

          <TabsContent value="live">
            <LiveStrategies />
          </TabsContent>

          <TabsContent value="legacy">
            <BacktestPanel />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default FreqtradeStudio;
