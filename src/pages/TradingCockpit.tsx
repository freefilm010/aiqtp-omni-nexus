import { lazy, Suspense, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { 
  LayoutGrid, 
  Code, 
  Trophy,
  Monitor
} from "lucide-react";

const WorkspaceManager = lazy(() => import("@/components/workspace/WorkspaceManager"));
const ScriptEditor = lazy(() => import("@/components/scripting/ScriptEditor"));
const CompetitiveAnalysis = lazy(() => import("@/components/competitive/CompetitiveAnalysis"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-[300px] sm:h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const TradingCockpit = () => {
  const [activeTab, setActiveTab] = useState("workspace");
  const { isAdmin } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pt-20 sm:pt-24">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Monitor className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <h1 className="text-xl sm:text-3xl font-bold">Trading Cockpit</h1>
          </div>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Multi-window workspace • Custom scripting • Command center
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className={`grid w-full max-w-lg ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="workspace" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Multi-Window
            </TabsTrigger>
            <TabsTrigger value="scripting" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <Code className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              QuantScript
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="competitive" className="gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Compete
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="workspace">
            <Suspense fallback={<TabLoader />}><WorkspaceManager /></Suspense>
          </TabsContent>
          <TabsContent value="scripting">
            <Suspense fallback={<TabLoader />}><ScriptEditor /></Suspense>
          </TabsContent>
          {isAdmin && (
            <TabsContent value="competitive">
              <Suspense fallback={<TabLoader />}><CompetitiveAnalysis /></Suspense>
            </TabsContent>
          )}
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TradingCockpit;
