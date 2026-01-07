import { lazy, Suspense, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Card, CardContent } from "@/components/ui/card";
import { 
  LayoutGrid, 
  Code, 
  Trophy,
  Monitor,
  Lock
} from "lucide-react";

const WorkspaceManager = lazy(() => import("@/components/workspace/WorkspaceManager"));
const ScriptEditor = lazy(() => import("@/components/scripting/ScriptEditor"));
const CompetitiveAnalysis = lazy(() => import("@/components/competitive/CompetitiveAnalysis"));

const TabLoader = () => (
  <div className="flex items-center justify-center h-[400px]">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const TradingCockpit = () => {
  const [activeTab, setActiveTab] = useState("workspace");
  const { isAdmin, loading } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20">
              <Monitor className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Trading Cockpit</h1>
          </div>
          <p className="text-muted-foreground">
            Multi-window workspace • Custom scripting • Beat the titans • Your 9-screen command center
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="workspace" className="gap-2">
              <LayoutGrid className="h-4 w-4" />
              Multi-Window
            </TabsTrigger>
            <TabsTrigger value="scripting" className="gap-2">
              <Code className="h-4 w-4" />
              QuantScript
            </TabsTrigger>
            <TabsTrigger value="competitive" className="gap-2">
              <Trophy className="h-4 w-4" />
              vs Competitors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workspace">
            <Suspense fallback={<TabLoader />}>
              <WorkspaceManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="scripting">
            <Suspense fallback={<TabLoader />}>
              <ScriptEditor />
            </Suspense>
          </TabsContent>

          <TabsContent value="competitive">
            {isAdmin ? (
              <Suspense fallback={<TabLoader />}>
                <CompetitiveAnalysis />
              </Suspense>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">Admin Access Required</h3>
                  <p className="text-muted-foreground">Competitive analysis is restricted to administrators.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
};

export default TradingCockpit;
