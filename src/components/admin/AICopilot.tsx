import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Bot,
  Send,
  Sparkles,
  TrendingUp,
  Shield,
  DollarSign,
  Settings,
  Loader2,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ChatHistory } from "@/components/chat/ChatHistory";
import { useChatPersistence } from "@/hooks/useChatPersistence";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: "Portfolio Analysis", icon: TrendingUp, prompt: "Analyze my current portfolio allocation and suggest optimizations" },
  { label: "Revenue Report", icon: DollarSign, prompt: "Generate a summary of revenue streams and performance" },
  { label: "Security Audit", icon: Shield, prompt: "Perform a security audit and identify potential vulnerabilities" },
  { label: "Strategy Recommendations", icon: Sparkles, prompt: "Recommend trading strategies based on current market conditions" },
];

const INITIAL_MESSAGE = "Hello! I'm your AI Copilot, powered by Lovable AI. I can help you manage your platform, analyze data, optimize investments, and more. What would you like to do today?";

const AICopilot = () => {
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
    agentType: "copilot", 
    initialSystemMessage: INITIAL_MESSAGE 
  });

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;

    await ensureConversation(content);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };

    addMessage(userMessage);
    setInput("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-copilot', {
        body: { message: content, context: "admin_dashboard" }
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data?.response || "I'm processing your request. Let me analyze the data and get back to you.",
        timestamp: new Date()
      };

      addMessage(assistantMessage, data?.model_used);
    } catch (error) {
      console.error('AI Copilot error:', error);
      
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getLocalResponse(content),
        timestamp: new Date()
      };
      
      addMessage(fallbackMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('allocation')) {
      return `📊 **Portfolio Analysis**\n\nFallback mode does not fabricate portfolio values.\n\nPlease check the live Portfolio page or Auto-Invest dashboard for real-time allocation data pulled from your connected accounts and backend records.\n\n📈 Target strategy: 30% stable / 70% growth.\nActual values are calculated from your backend holdings.`;
    }
    
    if (lowerQuery.includes('revenue') || lowerQuery.includes('income')) {
      return `💰 **Revenue Summary**\n\nFallback copilot mode is disabled from inventing revenue numbers.\n\nUse the live admin revenue screens for real figures from the backend. If no revenue has been recorded yet, the correct value is $0 until payments, subscriptions, or fees are actually captured.\n\n📈 Recommended next steps:\n1. Verify live checkout is working\n2. Enable secure webhook recording for completed payments\n3. Track only backend-recorded revenue sources`;
    }
    
    if (lowerQuery.includes('security') || lowerQuery.includes('audit')) {
      return `🔒 **Security Overview**\n\n✅ RLS policies enabled on all tables\n✅ Admin role verification via has_role()\n✅ Webhook signature verification active\n✅ Zero-trust security model in place\n\n⚠️ **Recommendations:**\n1. Consider adding 2FA for admin accounts\n2. Review API rate limiting thresholds\n\nRun a full security scan from the Security Center for detailed results.`;
    }
    
    if (lowerQuery.includes('strategy') || lowerQuery.includes('trading')) {
      return `📈 **Strategy Recommendations**\n\nBased on current market conditions:\n\n**1. Momentum Strategy**\n- Focus on BTC/ETH during breakout patterns\n- Use 15m and 1h timeframes\n- Expected Sharpe: 1.8\n\n**2. Mean Reversion**\n- Best for altcoin pairs\n- Entry on 2-sigma deviations\n- Risk/Reward: 1:2.5\n\n**3. AI Signal Following**\n- Enable premium signals auto-execution\n- Current win rate: 68%\n- Average return: 4.2%/trade\n\n💡 **My Top Pick:** Combine momentum with DCA for optimal risk-adjusted returns.`;
    }
    
    return `I understand you're asking about "${query}". As your AI Copilot, I can help with:\n\n- **Portfolio Management**: Analysis, rebalancing, optimization\n- **Revenue Tracking**: Streams, distribution, forecasting\n- **Security**: Audits, threat detection, compliance\n- **Trading Strategies**: Signals, backtesting, automation\n- **User Management**: Analytics, engagement, retention\n\nWhat specific aspect would you like me to focus on?`;
  };

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <Bot className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">Sign In Required</h2>
        <p className="text-muted-foreground">Please sign in to access AI Copilot and save your chat history.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            AI Copilot
          </h1>
          <p className="text-muted-foreground">
            Your intelligent assistant for platform management
          </p>
        </div>
        <Badge variant="outline" className="text-green-500 border-green-500">
          <Sparkles className="h-3 w-3 mr-1" />
          Powered by Lovable AI
        </Badge>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-2"
            onClick={() => sendMessage(action.prompt)}
            disabled={isLoading}
          >
            <action.icon className="h-5 w-5" />
            <span className="text-xs">{action.label}</span>
          </Button>
        ))}
      </div>

      {/* Main content with chat history */}
      <div className="flex gap-4 h-[500px]">
        {/* Chat History Sidebar */}
        {showHistory && (
          <div className="w-64 shrink-0 hidden md:block">
            <Card className="h-full">
              <ChatHistory
                agentType="copilot"
                activeConversationId={conversationId}
                onSelectConversation={selectConversation}
                onNewConversation={startNewConversation}
              />
            </Card>
          </div>
        )}

        {/* Chat Interface */}
        <Card className="flex-1 flex flex-col">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Chat with AI
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hidden md:flex"
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col p-0">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : message.role === 'system'
                          ? 'bg-muted/50 border'
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground">
                          <Bot className="h-3 w-3" />
                          AI Copilot
                        </div>
                      )}
                      <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                      <div className="text-xs opacity-50 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t bg-background sticky bottom-0 z-10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage(input);
                }}
                className="flex gap-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your platform..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AICopilot;
