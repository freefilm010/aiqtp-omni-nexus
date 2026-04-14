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
import StrategyComparison from "@/components/strategy/StrategyComparison";
import StrategyTemplates from "@/components/strategy/StrategyTemplates";
import { Code2, BookOpen, FlaskConical, Play, History, Award, Trophy, ArrowUpDown, Package } from "lucide-react";

const FreqtradeStudio = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold text-foreground">Strategy Studio</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Build, backtest, graduate & deploy strategies
          </p>
        </div>

        <Tabs defaultValue="templates" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5 sm:grid-cols-9 border border-border bg-card h-auto">
            <TabsTrigger value="templates" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
              Board
            </TabsTrigger>
            <TabsTrigger value="compare" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <ArrowUpDown className="h-3 w-3 sm:h-4 sm:w-4" />
              Compare
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <Code2 className="h-3 w-3 sm:h-4 sm:w-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="backtest" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <FlaskConical className="h-3 w-3 sm:h-4 sm:w-4" />
              Backtest
            </TabsTrigger>
            <TabsTrigger value="indicators" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5 hidden sm:flex">
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
              Indicators
            </TabsTrigger>
            <TabsTrigger value="graduation" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5 hidden sm:flex">
              <Award className="h-3 w-3 sm:h-4 sm:w-4" />
              Graduation
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5 hidden sm:flex">
              <Play className="h-3 w-3 sm:h-4 sm:w-4" />
              Live
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5 hidden sm:flex">
              <History className="h-3 w-3 sm:h-4 sm:w-4" />
              Legacy
            </TabsTrigger>
          </TabsList>

          {/* Second row for mobile */}
          <TabsList className="grid w-full grid-cols-4 sm:hidden border border-border bg-card h-auto">
            <TabsTrigger value="indicators" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <BookOpen className="h-3 w-3" />
              Indicators
            </TabsTrigger>
            <TabsTrigger value="graduation" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <Award className="h-3 w-3" />
              Graduate
            </TabsTrigger>
            <TabsTrigger value="live" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <Play className="h-3 w-3" />
              Live
            </TabsTrigger>
            <TabsTrigger value="legacy" className="flex items-center gap-0.5 text-[9px] px-1 py-1.5">
              <History className="h-3 w-3" />
              Legacy
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <StrategyTemplates />
          </TabsContent>

          <TabsContent value="leaderboard">
            <AIAgentLeaderboard />
          </TabsContent>

          <TabsContent value="compare">
            <StrategyComparison />
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
