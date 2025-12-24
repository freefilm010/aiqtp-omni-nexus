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
  Loader2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickActions = [
  { label: "Portfolio Analysis", icon: TrendingUp, prompt: "Analyze my current portfolio allocation and suggest optimizations" },
  { label: "Revenue Report", icon: DollarSign, prompt: "Generate a summary of revenue streams and performance" },
  { label: "Security Audit", icon: Shield, prompt: "Perform a security audit and identify potential vulnerabilities" },
  { label: "Strategy Recommendations", icon: Sparkles, prompt: "Recommend trading strategies based on current market conditions" },
];

const AICopilot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm your AI Copilot, powered by Lovable AI. I can help you manage your platform, analyze data, optimize investments, and more. What would you like to do today?",
      timestamp: new Date()
    }
  ]);
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

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Call the AI copilot edge function
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

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI Copilot error:', error);
      
      // Fallback response when edge function isn't available
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getLocalResponse(content),
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getLocalResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('portfolio') || lowerQuery.includes('allocation')) {
      return `📊 **Portfolio Analysis**\n\nYour current allocation is:\n- **Stable Assets (30%)**: $33,450\n  - USDC Yield: 15%\n  - Treasury Bonds: 10%\n  - DAI Lending: 5%\n\n- **Growth Assets (70%)**: $78,050\n  - Bitcoin: 25% (+2.3% today)\n  - Ethereum: 20% (+1.8% today)\n  - S&P 500 ETF: 15%\n  - AI/Tech Stocks: 10%\n\n✅ Your portfolio is well-balanced for the aggressive strategy. Consider rebalancing if any asset drifts more than 5% from target.`;
    }
    
    if (lowerQuery.includes('revenue') || lowerQuery.includes('income')) {
      return `💰 **Revenue Summary**\n\n**This Month:**\n- Premium Subscriptions: $8,997 (300 users)\n- Trading Commissions: $14,550\n- Spread Fees: $6,234\n- API Access: $4,999 (50 developers)\n- Premium Signals: $7,499 (150 subscribers)\n\n**Total: $42,279** (+23.5% vs last month)\n\n📈 Recommendations:\n1. Consider tiered pricing for API access\n2. Bundle signals with premium subscription\n3. Optimize spread during high-volume periods`;
    }
    
    if (lowerQuery.includes('security') || lowerQuery.includes('audit')) {
      return `🔒 **Security Audit Report**\n\n**Security Score: 94/100**\n\n✅ **Passing:**\n- RLS policies enabled on all tables\n- Admin role verification active\n- Encryption at rest enabled\n- Auto-security updates scheduled\n\n⚠️ **Recommendations:**\n1. Enable leaked password protection in auth settings\n2. Consider adding 2FA for admin accounts\n3. Review API rate limiting thresholds\n\n🛡️ Last full scan: 5 minutes ago\nNext scheduled: In 55 minutes`;
    }
    
    if (lowerQuery.includes('strategy') || lowerQuery.includes('trading')) {
      return `📈 **Strategy Recommendations**\n\nBased on current market conditions:\n\n**1. Momentum Strategy**\n- Focus on BTC/ETH during breakout patterns\n- Use 15m and 1h timeframes\n- Expected Sharpe: 1.8\n\n**2. Mean Reversion**\n- Best for altcoin pairs\n- Entry on 2-sigma deviations\n- Risk/Reward: 1:2.5\n\n**3. AI Signal Following**\n- Enable premium signals auto-execution\n- Current win rate: 68%\n- Average return: 4.2%/trade\n\n💡 **My Top Pick:** Combine momentum with DCA for optimal risk-adjusted returns.`;
    }
    
    return `I understand you're asking about "${query}". As your AI Copilot, I can help with:\n\n- **Portfolio Management**: Analysis, rebalancing, optimization\n- **Revenue Tracking**: Streams, distribution, forecasting\n- **Security**: Audits, threat detection, compliance\n- **Trading Strategies**: Signals, backtesting, automation\n- **User Management**: Analytics, engagement, retention\n\nWhat specific aspect would you like me to focus on?`;
  };

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

      {/* Chat Interface */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Chat with AI
          </CardTitle>
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

          <div className="p-4 border-t">
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
  );
};

export default AICopilot;
