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
        <div className="mb-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">AI Agents</h1>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                Quantum & Classical AI • Autonomous Execution
              </p>
            </div>
            <span className="px-2 py-1 text-[10px] font-mono bg-purple-500/20 text-purple-500 rounded shrink-0">
              OMEGA
            </span>
          </div>
          
          {/* Agent Switcher - compact on mobile */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setActiveAgent("qaqi")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                activeAgent === "qaqi" 
                  ? "border-purple-500/50 bg-purple-500/5" 
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Atom className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">QAQI</p>
                <p className="text-[10px] text-muted-foreground truncate">Quantum Agent</p>
              </div>
            </button>
            
            <button
              onClick={() => setActiveAgent("aiqtp")}
              className={`flex items-center gap-2 p-3 rounded-lg border transition-all text-left ${
                activeAgent === "aiqtp" 
                  ? "border-blue-500/50 bg-blue-500/5" 
                  : "border-muted hover:border-muted-foreground/30"
              }`}
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Bot className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">AIQTP</p>
                <p className="text-[10px] text-muted-foreground truncate">Classical Agent</p>
              </div>
            </button>
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
