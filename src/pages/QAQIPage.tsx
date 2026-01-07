import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import QAQIAgent from "@/components/qaqi/QAQIAgent";
import AIQTPAgent from "@/components/qaqi/AIQTPAgent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Atom, Bot, Zap, Cpu } from "lucide-react";

const QAQIPage = () => {
  const [activeAgent, setActiveAgent] = useState<"qaqi" | "aiqtp">("qaqi");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 pt-24">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">AI Agents</h1>
                <span className="px-2 py-1 text-xs font-mono bg-purple-500/20 text-purple-500 rounded">
                  AUTONOMOUS // OMEGA
                </span>
              </div>
              <p className="text-muted-foreground">
                Quantum & Classical AI Agents • Deep Learning • Pattern Recognition • Autonomous Execution
              </p>
            </div>
            
            {/* Agent Switcher */}
            <Tabs value={activeAgent} onValueChange={(v) => setActiveAgent(v as "qaqi" | "aiqtp")} className="w-full md:w-auto">
              <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
                <TabsTrigger value="qaqi" className="flex items-center gap-2">
                  <Atom className="w-4 h-4 text-purple-500" />
                  <span className="hidden sm:inline">QAQI</span>
                  <Badge variant="outline" className="ml-1 text-[10px] bg-purple-500/10 text-purple-500 border-purple-500/30">
                    Quantum
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="aiqtp" className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-500" />
                  <span className="hidden sm:inline">AIQTP</span>
                  <Badge variant="outline" className="ml-1 text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/30">
                    Classical
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Agent Description Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div 
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                activeAgent === "qaqi" 
                  ? "border-purple-500/50 bg-purple-500/5" 
                  : "border-muted hover:border-muted-foreground/30"
              }`}
              onClick={() => setActiveAgent("qaqi")}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Atom className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">QAQI Agent</h3>
                  <p className="text-xs text-muted-foreground">Quantum Artificial Qubit Intelligent Agent</p>
                </div>
                {activeAgent === "qaqi" && (
                  <Zap className="w-4 h-4 text-purple-500 ml-auto" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Full autonomy over $QTC development, QuWallet operations, IP registry, revenue automation, and self-enhancement capabilities.
              </p>
            </div>
            
            <div 
              className={`p-4 rounded-lg border transition-all cursor-pointer ${
                activeAgent === "aiqtp" 
                  ? "border-blue-500/50 bg-blue-500/5" 
                  : "border-muted hover:border-muted-foreground/30"
              }`}
              onClick={() => setActiveAgent("aiqtp")}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AIQTP Agent</h3>
                  <p className="text-xs text-muted-foreground">AI Quant Trading Platform Agent</p>
                </div>
                {activeAgent === "aiqtp" && (
                  <Cpu className="w-4 h-4 text-blue-500 ml-auto" />
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Classical AI powered by advanced ML for market analysis, fraud detection, trading strategies, and document generation.
              </p>
            </div>
          </div>
        </div>
        
        {/* Agent Content */}
        {activeAgent === "qaqi" ? <QAQIAgent /> : <AIQTPAgent />}
      </main>
      <Footer />
    </div>
  );
};

export default QAQIPage;
