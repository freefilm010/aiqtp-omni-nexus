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
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Advanced Trading Terminal</h1>
          <p className="text-muted-foreground mt-1">
            Institutional-grade tools • Level II Data • Smart Orders • Pattern Recognition
          </p>
        </div>

        <Tabs defaultValue="charts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="charts" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Charts & Studies
            </TabsTrigger>
            <TabsTrigger value="heatmap" className="flex items-center gap-2">
              <LayoutGrid className="h-4 w-4" />
              Heat Maps
            </TabsTrigger>
            <TabsTrigger value="level2" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Level II
            </TabsTrigger>
            <TabsTrigger value="smart" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Smart Orders
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
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
