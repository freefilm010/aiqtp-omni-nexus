import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StrategyBuilder from "@/components/strategy/StrategyBuilder";
import IndicatorLibrary from "@/components/strategy/IndicatorLibrary";
import StrategyBacktest from "@/components/strategy/StrategyBacktest";
import LiveStrategies from "@/components/strategy/LiveStrategies";
import BacktestPanel from "@/components/research/BacktestPanel";
import GraduationPipeline from "@/components/strategy/GraduationPipeline";
import AIAgentLeaderboard from "@/components/trading/AIAgentLeaderboard";
import { Code2, BookOpen, FlaskConical, Play, History, Award, Trophy } from "lucide-react";

const FreqtradeStudio = () => {
  return (
    <div className="min-h-screen bg-[hsl(225,20%,6%)]">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Strategy Studio</h1>
          <p className="text-muted-foreground mt-1">
            Build, backtest, graduate and deploy trading strategies • 92% profitability standard
          </p>
        </div>

        <Tabs defaultValue="leaderboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-[hsl(223,18%,9%)] border border-[hsl(222,14%,17%)]">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2 data-[state=active]:bg-[hsl(224,100%,58%,0.15)] data-[state=active]:text-[hsl(224,100%,58%)]">
              <Trophy className="h-4 w-4" />
              Leaderboard
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="indicators" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Indicators
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Backtest
            </TabsTrigger>
            <TabsTrigger value="graduation" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Graduation
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Legacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            <AIAgentLeaderboard />
          </TabsContent>

          <TabsContent value="builder">
            <StrategyBuilder />
          </TabsContent>

          <TabsContent value="indicators">
            <IndicatorLibrary />
          </TabsContent>

          <TabsContent value="backtest">
            <StrategyBacktest />
          </TabsContent>

          <TabsContent value="graduation">
            <GraduationPipeline />
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
