import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HeatMap from "@/components/trading/HeatMap";
import LevelIIOrderBook from "@/components/trading/LevelIIOrderBook";
import SmartOrders from "@/components/trading/SmartOrders";
import PatternRecognition from "@/components/trading/PatternRecognition";
import AdvancedCharts from "@/components/trading/AdvancedCharts";
import { 
  LayoutGrid, 
  Layers, 
  Zap, 
  Eye, 
  BarChart3
} from "lucide-react";

const AdvancedTrading = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">Advanced Trading</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Level II Data • Smart Orders • Pattern Recognition
          </p>
        </div>

        <Tabs defaultValue="charts" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="charts" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              Charts
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
              Heat
            </TabsTrigger>
            <TabsTrigger value="level2" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <Layers className="h-3 w-3 sm:h-4 sm:w-4" />
              L2
            </TabsTrigger>
            <TabsTrigger value="smart" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <Zap className="h-3 w-3 sm:h-4 sm:w-4" />
              Smart
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-0.5 sm:gap-2 text-[9px] sm:text-sm px-1 py-1.5">
              <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
              Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="charts">
            <AdvancedCharts />
          </TabsContent>
          <TabsContent value="heatmap">
            <HeatMap />
          </TabsContent>
          <TabsContent value="level2">
            <LevelIIOrderBook />
          </TabsContent>
          <TabsContent value="smart">
            <SmartOrders />
          </TabsContent>
          <TabsContent value="patterns">
            <PatternRecognition />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default AdvancedTrading;
