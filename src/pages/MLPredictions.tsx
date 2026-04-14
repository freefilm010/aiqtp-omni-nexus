import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PredictionDashboard from "@/components/ml/PredictionDashboard";
import ModelTrainer from "@/components/ml/ModelTrainer";
import SignalFeed from "@/components/ml/SignalFeed";
import FeatureImportance from "@/components/ml/FeatureImportance";

const MLPredictions = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-3xl font-bold">ML Prediction Models</h1>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            Price predictions • Neural networks, LSTM, ensemble models
          </p>
        </div>

        <Tabs defaultValue="predictions" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="predictions" className="text-[10px] sm:text-sm px-1 sm:px-3">Predictions</TabsTrigger>
            <TabsTrigger value="signals" className="text-[10px] sm:text-sm px-1 sm:px-3">Signals</TabsTrigger>
            <TabsTrigger value="trainer" className="text-[10px] sm:text-sm px-1 sm:px-3">Trainer</TabsTrigger>
            <TabsTrigger value="features" className="text-[10px] sm:text-sm px-1 sm:px-3">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions">
            <PredictionDashboard />
          </TabsContent>

          <TabsContent value="signals">
            <SignalFeed />
          </TabsContent>

          <TabsContent value="trainer">
            <ModelTrainer />
          </TabsContent>

          <TabsContent value="features">
            <FeatureImportance />
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default MLPredictions;
