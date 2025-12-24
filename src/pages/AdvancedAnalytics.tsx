import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PortfolioOptimizer from "@/components/analytics/PortfolioOptimizer";
import SignalMonitor from "@/components/analytics/SignalMonitor";
import MLTrainingInterface from "@/components/analytics/MLTrainingInterface";
import ComputerVisionLab from "@/components/analytics/ComputerVisionLab";
import RiskAnalytics from "@/components/analytics/RiskAnalytics";
import SentimentAnalysis from "@/components/analytics/SentimentAnalysis";
import QuantResearch from "@/components/analytics/QuantResearch";
import AutomationHub from "@/components/analytics/AutomationHub";
import { 
  Brain, 
  LineChart, 
  Zap, 
  Eye, 
  Shield, 
  MessageSquare, 
  FlaskConical,
  Workflow
} from "lucide-react";

const AdvancedAnalytics = () => {
  const [activeTab, setActiveTab] = useState("portfolio");

  const tabs = [
    { id: "portfolio", label: "Portfolio Optimizer", icon: LineChart },
    { id: "signals", label: "Signal Monitor", icon: Zap },
    { id: "ml", label: "ML Training", icon: Brain },
    { id: "vision", label: "Computer Vision", icon: Eye },
    { id: "risk", label: "Risk Analytics", icon: Shield },
    { id: "sentiment", label: "Sentiment Analysis", icon: MessageSquare },
    { id: "quant", label: "Quant Research", icon: FlaskConical },
    { id: "automation", label: "Automation Hub", icon: Workflow },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Advanced Analytics Platform
          </h1>
          <p className="text-muted-foreground text-lg">
            Comprehensive AI-powered trading analytics, optimization, and automation
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-8 gap-2 h-auto p-2 bg-secondary/50">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-xs font-medium">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="portfolio" className="space-y-6">
            <PortfolioOptimizer />
          </TabsContent>

          <TabsContent value="signals" className="space-y-6">
            <SignalMonitor />
          </TabsContent>

          <TabsContent value="ml" className="space-y-6">
            <MLTrainingInterface />
          </TabsContent>

          <TabsContent value="vision" className="space-y-6">
            <ComputerVisionLab />
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <RiskAnalytics />
          </TabsContent>

          <TabsContent value="sentiment" className="space-y-6">
            <SentimentAnalysis />
          </TabsContent>

          <TabsContent value="quant" className="space-y-6">
            <QuantResearch />
          </TabsContent>

          <TabsContent value="automation" className="space-y-6">
            <AutomationHub />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdvancedAnalytics;
