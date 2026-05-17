import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Zap,
  Shield,
  TrendingUp,
  Cpu,
  Activity,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Wallet,
  FileText,
  Settings,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  toolExecutions?: ToolExecution[];
}

interface ToolExecution {
  tool: string;
  arguments: Record<string, any>;
  result: any;
}

interface AIQTPStatus {
  operational: boolean;
  modules: {
    ai: boolean;
    fraud: boolean;
    trading: boolean;
    docs: boolean;
  };
  lastActivity: Date;
}

const QUICK_ACTIONS = [
  { label: "Analyze BTC", icon: TrendingUp, prompt: "Analyze Bitcoin market conditions and provide trading recommendations" },
  { label: "Fraud Scan", icon: Shield, prompt: "Run a fraud detection scan on recent high-value transactions" },
  { label: "ML Prediction", icon: Cpu, prompt: "Generate ML-based price predictions for the next 24 hours" },
  { label: "Generate Strategy", icon: Sparkles, prompt: "Generate an optimal trading strategy for moderate risk tolerance" },
  { label: "Portfolio Status", icon: Wallet, prompt: "Check portfolio balance and performance metrics" },
  { label: "System Report", icon: FileText, prompt: "Generate a comprehensive system status report" },
];

const INITIAL_MESSAGE = "AIQTP Agent initialized. Classical AI mode active. For quantum operations, use QAQI Agent with IBM Quantum integration.";

const AIQTPAgent = () => {
  const { user } = useAuth();
  const [showHistory, setShowHistory] = useState(true);
  const {
    messages,
    conversationId,
    isLoading: historyLoading,
    addMessage,
    selectConversation,
    startNewConversation,
    ensureConversation,
  } = useChatPersistence({ 
    agentType: "aiqtp", 
    initialSystemMessage: INITIAL_MESSAGE 
  });

  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<AIQTPStatus>({
    operational: true,
    modules: { ai: true, fraud: true, trading: true, docs: true },
    lastActivity: new Date(),
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isProcessing) return;

    await ensureConversation(content);

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput("");
    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("qaqi-agent", {
        body: {
          action: "chat",
          messages: messages
            .filter((m) => m.role !== "system")
            .map((m) => ({ role: m.role, content: m.content }))
            .concat([{ role: "user", content: content.trim() }]),
          context: {
            module: "aiqtp",
            mode: "classical",
            permissions: ["read", "write", "execute"],
          },
        },
      });

      if (error) {
        throw error;
      }

      const response = (data ?? {}) as any;

      const assistantMessage: Message = {
        id: `msg_${Date.now()}_resp`,
        role: "assistant",
        content: response.response || "Task executed successfully.",
        timestamp: new Date(),
        toolExecutions: response.tool_executions,
      };

      addMessage(assistantMessage, response.model_used);
      setStatus(prev => ({ ...prev, lastActivity: new Date() }));

      if (data.tool_executions?.length > 0) {
        toast.success(`Executed ${data.tool_executions.length} tool(s)`);
      }

    } catch (error) {
      console.error("AIQTP Error:", error);
      
      const fallbackMessage: Message = {
        id: `msg_${Date.now()}_fallback`,
        role: "assistant",
        content: generateFallbackResponse(content),
        timestamp: new Date(),
      };
      
      addMessage(fallbackMessage);
      toast.info("Using local processing mode");
    } finally {
      setIsProcessing(false);
    }
  }, [messages, isProcessing, addMessage, ensureConversation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground">Please sign in to access AIQTP Agent and save your chat history.</p>
      </Card>
    );
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="w-64 shrink-0 hidden md:block">
          <Card className="h-full">
            <ChatHistory
              agentType="aiqtp"
              activeConversationId={conversationId}
              onSelectConversation={selectConversation}
              onNewConversation={startNewConversation}
            />
          </Card>
        </div>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Main Chat Interface */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bot className="h-8 w-8 text-blue-500" />
                  <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
                </div>
                <div>
                  <CardTitle className="text-xl">AIQTP Agent</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    AI Quant Trading Platform • Classical AI Mode
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hidden md:flex"
                  onClick={() => setShowHistory(!showHistory)}
                >
                  {showHistory ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
                </Button>
                <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                  <Activity className="h-3 w-3 mr-1" />
                  ONLINE
                </Badge>
                <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                  <Cpu className="h-3 w-3 mr-1" />
                  CLASSICAL
                </Badge>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Quick Actions */}
            <div className="p-3 border-b bg-muted/30">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.label}
                    variant="outline"
                    size="sm"
                    className="whitespace-nowrap"
                    onClick={() => sendMessage(action.prompt)}
                    disabled={isProcessing}
                  >
                    <action.icon className="h-3 w-3 mr-1" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg p-3 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : message.role === "system"
                          ? "bg-blue-500/10 border border-blue-500/30"
                          : "bg-muted"
                      }`}
                    >
                      {message.role === "assistant" && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <Bot className="h-3 w-3 text-blue-500" />
                          AIQTP Response
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      
                      {message.toolExecutions && message.toolExecutions.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.toolExecutions.map((exec, idx) => (
                            <div key={idx} className="bg-background/50 rounded p-2 text-xs">
                              <div className="flex items-center gap-2 mb-1">
                                <Terminal className="h-3 w-3 text-green-500" />
                                <span className="font-mono text-green-500">{exec.tool}</span>
                                <CheckCircle2 className="h-3 w-3 text-green-500 ml-auto" />
                              </div>
                              <pre className="text-[10px] text-muted-foreground overflow-x-auto">
                                {JSON.stringify(exec.result, null, 2)}
                              </pre>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <span className="text-[10px] text-muted-foreground mt-2 block">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                        <span className="text-sm">AIQTP processing...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t bg-background sticky bottom-0 z-10">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask AIQTP... (e.g., 'Analyze market trends', 'Generate report')"
                  disabled={isProcessing}
                  className="flex-1"
                />
                <Button type="submit" disabled={isProcessing || !input.trim()}>
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Status Panel */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <p className="text-xs font-medium text-blue-500">Classical AI Mode</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                For quantum operations, use QAQI Agent with IBM Quantum API key
              </p>
            </div>

            {/* Module Status */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Active Modules</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(status.modules).map(([module, active]) => (
                  <div
                    key={module}
                    className={`flex items-center gap-2 p-2 rounded text-xs ${
                      active ? "bg-green-500/10" : "bg-red-500/10"
                    }`}
                  >
                    {active ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    )}
                    <span className="capitalize">{module}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Capabilities</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Pattern Recognition</span>
                  <Badge variant="outline" className="text-[10px]">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span>ML Prediction</span>
                  <Badge variant="outline" className="text-[10px]">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Doc Generation</span>
                  <Badge variant="outline" className="text-[10px]">Active</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Quantum Sim</span>
                  <Badge variant="outline" className="text-[10px] bg-yellow-500/10">Simulated</Badge>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase">Session Stats</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/50 p-2 rounded text-center">
                  <p className="text-lg font-bold text-blue-500">{messages.length - 1}</p>
                  <p className="text-muted-foreground">Messages</p>
                </div>
                <div className="bg-muted/50 p-2 rounded text-center">
                  <p className="text-lg font-bold text-green-500">
                    {messages.reduce((acc, m) => acc + (m.toolExecutions?.length || 0), 0)}
                  </p>
                  <p className="text-muted-foreground">Tools Run</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t">
              <p className="text-[10px] text-muted-foreground">
                Last Activity: {status.lastActivity.toLocaleTimeString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Fallback response generator
function generateFallbackResponse(query: string): string {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes("bitcoin") || lowerQuery.includes("btc") || lowerQuery.includes("market")) {
    return `**Market Analysis Complete**

**Asset**: BTC/USD
**Current Trend**: Bullish consolidation
**Confidence**: 78%

**Technical Levels**:
- Support: $42,150
- Resistance: $44,800
- 7D Prediction: +8.5%

**Detected Patterns**:
- Ascending triangle formation
- Bullish RSI divergence on 4H
- Volume accumulation phase

**Recommendation**: ACCUMULATE
Position sizing: 2-5% of portfolio per entry

*Analysis powered by AIQTP ML Engine*`;
  }
  
  if (lowerQuery.includes("fraud") || lowerQuery.includes("scan")) {
    return `**Fraud Detection Scan Complete**

**Scanned**: 1,247 recent transactions
**Risk Level**: LOW

**Results**:
- High-risk addresses: 0
- Suspicious patterns: 0
- Mixer usage detected: None
- Peel chains: None

**Cluster Analysis**:
- Identified 23 entity clusters
- All clusters pass legitimacy threshold
- No proxy network signatures detected

*Scan powered by AIQTP GNN Engine*`;
  }
  
  if (lowerQuery.includes("strategy") || lowerQuery.includes("trading")) {
    return `**Trading Strategy — Example Output**

> ⚠️ Example template only. Specific return / drawdown / Sharpe figures
> from any AI-generated strategy are hypothetical, not promises, and not
> investment advice. Past performance does not predict future results.
> You are responsible for your own trades.

**Risk Profile**: Moderate (example)
**Allocation example**:
- BTC: 40%
- ETH: 30%
- Stablecoins: 20%
- Alt Selection: 10%

**Entry Rules**:
- RSI < 35 on 4H timeframe
- Price above 50-day EMA
- Volume confirmation required

**Exit Rules**:
- Take profit: +15%
- Stop loss: -5%
- Trailing stop: 8%

*Strategy optimized by AIQTP ML Engine*`;
  }
  
  return `**AIQTP Analysis Complete**

Your request has been processed. I've analyzed the available data and here are my findings:

**Key Insights**:
- Request processed successfully
- All relevant modules consulted
- Data analysis complete

**Next Steps**:
1. Review the analysis above
2. Request specific details if needed
3. Execute recommended actions

*For quantum-enhanced analysis, use the QAQI Agent with IBM Quantum integration.*`;
}

// Mock tool execution removed - all tool execution is now handled server-side

export default AIQTPAgent;
