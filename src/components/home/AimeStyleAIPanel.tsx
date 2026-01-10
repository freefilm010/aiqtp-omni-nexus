import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Brain,
  Zap,
  Search,
  ChevronRight,
  Volume2,
  MessageSquare,
  Activity,
  Target,
  BarChart2,
  ArrowUpRight,
  Star,
  Crown
} from "lucide-react";
import { Link } from "react-router-dom";

// AInvest-inspired "Aime" AI Quick Actions + Magic Signals
// Combined with Microsoft Copilot UX patterns

interface MagicSignal {
  type: 'buy' | 'sell' | 'alert';
  asset: string;
  confidence: number;
  reason: string;
  priceTarget?: string;
  stopLoss?: string;
  timestamp: Date;
}

const AimeStyleAIPanel = () => {
  const [activeTab, setActiveTab] = useState<'signals' | 'research' | 'portfolio'>('signals');
  const [isTyping, setIsTyping] = useState(false);
  const [currentSignalIndex, setCurrentSignalIndex] = useState(0);

  // AInvest-style Magic Signals
  const magicSignals: MagicSignal[] = [
    { 
      type: 'buy', 
      asset: 'BTC', 
      confidence: 94, 
      reason: 'Bullish divergence on RSI + whale accumulation detected',
      priceTarget: '$105,000',
      stopLoss: '$92,500',
      timestamp: new Date()
    },
    { 
      type: 'sell', 
      asset: 'DOGE', 
      confidence: 87, 
      reason: 'Overbought RSI(14) at 78 + declining volume',
      priceTarget: '$0.32',
      stopLoss: '$0.42',
      timestamp: new Date()
    },
    { 
      type: 'alert', 
      asset: 'ETH', 
      confidence: 91, 
      reason: 'Breaking out of 30-day consolidation pattern',
      timestamp: new Date()
    },
    { 
      type: 'buy', 
      asset: 'SOL', 
      confidence: 89, 
      reason: 'Smart money inflow + DeFi TVL surge',
      priceTarget: '$220',
      stopLoss: '$175',
      timestamp: new Date()
    },
  ];

  // AInvest-style Quick Prompts (Aime AI copilot)
  const quickPrompts = [
    { icon: TrendingUp, label: "Top Gainers", query: "Show me today's top performing crypto" },
    { icon: Brain, label: "Deep Research", query: "Analyze BTC for the next 30 days" },
    { icon: Target, label: "Entry Points", query: "Best entry points for ETH right now" },
    { icon: AlertTriangle, label: "Risk Check", query: "Analyze my portfolio risk exposure" },
    { icon: BarChart2, label: "Sector Analysis", query: "Which crypto sectors are trending?" },
    { icon: Zap, label: "Quick Trade", query: "Execute my top AI signal" },
  ];

  // Thematic Screeners (AInvest-inspired)
  const thematicScreeners = [
    { name: "Congress Trades", description: "Tracks politician investments", color: "gold", count: 23 },
    { name: "Meme Momentum", description: "Top viral tokens", color: "purple", count: 47 },
    { name: "Fed Sensitive", description: "Rate-sensitive assets", color: "blue", count: 18 },
    { name: "Whale Moves", description: "Large holder activity", color: "green", count: 156 },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSignalIndex(prev => (prev + 1) % magicSignals.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getSignalColor = (type: string) => {
    switch (type) {
      case 'buy': return 'hsl(162, 91%, 32%)';
      case 'sell': return 'hsl(355, 88%, 58%)';
      case 'alert': return 'hsl(43, 96%, 56%)';
      default: return 'hsl(224, 100%, 58%)';
    }
  };

  const getSignalBgColor = (type: string) => {
    switch (type) {
      case 'buy': return 'bg-[hsl(162,91%,32%,0.1)]';
      case 'sell': return 'bg-[hsl(355,88%,58%,0.1)]';
      case 'alert': return 'bg-[hsl(43,96%,56%,0.1)]';
      default: return 'bg-[hsl(224,100%,58%,0.1)]';
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Copilot Header - Microsoft Copilot + AInvest Aime hybrid */}
      <Card className="relative overflow-hidden p-6 bg-gradient-to-br from-[hsl(223,18%,9%)] to-[hsl(223,18%,7%)] border-[hsl(270,91%,65%,0.3)]">
        {/* Mesh Gradient Background */}
        <div className="absolute inset-0 bg-mesh-card opacity-30 pointer-events-none" />
        
        <div className="relative flex items-start gap-4">
          {/* AI Avatar - AInvest style */}
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(270,91%,65%)] to-[hsl(224,100%,58%)] flex items-center justify-center shadow-lg"
              style={{ boxShadow: '0 0 30px hsl(270,91%,65%,0.3)' }}>
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[hsl(162,91%,32%)] border-2 border-[hsl(223,18%,9%)] flex items-center justify-center">
              <Activity className="w-3 h-3 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-foreground">QAQI™ AI Assistant</h3>
              <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[9px]">ONLINE</Badge>
              <Badge className="bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)] text-[9px]">QUANTUM-ENHANCED</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Your personal AI trading mentor. Ask me anything about markets, trades, or get instant analysis.
            </p>
            
            {/* Copilot-style Quick Input */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(223,18%,12%)] border border-[hsl(222,14%,20%)] group focus-within:border-[hsl(270,91%,65%,0.5)] transition-colors">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Ask QAQI™ anything... (e.g., 'Analyze BTC trend')"
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              <Button size="sm" className="h-7 px-3 bg-gradient-to-r from-[hsl(270,91%,65%)] to-[hsl(224,100%,58%)] hover:opacity-90 text-white text-xs">
                <MessageSquare className="w-3 h-3 mr-1" />
                Ask
              </Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                <Volume2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Quick Prompts Grid - AInvest style */}
        <div className="relative grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
          {quickPrompts.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button 
                key={prompt.label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[hsl(223,18%,11%)] border border-[hsl(222,14%,18%)] hover:border-[hsl(270,91%,65%,0.4)] hover:bg-[hsl(223,18%,14%)] transition-all group"
              >
                <Icon className="w-4 h-4 text-muted-foreground group-hover:text-[hsl(270,91%,65%)] transition-colors" />
                <span className="font-mono text-[9px] text-muted-foreground group-hover:text-foreground transition-colors">{prompt.label}</span>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Magic Signals Section - AInvest inspired */}
      <Card className="p-5 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[hsl(43,96%,56%,0.15)]">
              <Sparkles className="w-4 h-4 text-[hsl(43,96%,56%)]" />
            </div>
            <h3 className="font-bold text-foreground">Magic Signals™</h3>
            <Badge className="bg-[hsl(43,96%,56%,0.15)] text-[hsl(43,96%,56%)] text-[9px]">AI-POWERED</Badge>
          </div>
          <Link to="/ml-predictions">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
              View All <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Featured Signal - Large Display */}
        <div className={`relative p-4 rounded-xl ${getSignalBgColor(magicSignals[currentSignalIndex].type)} border border-[${getSignalColor(magicSignals[currentSignalIndex].type)}20] mb-4 transition-all duration-500`}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge 
                className="text-[10px] font-bold uppercase"
                style={{ 
                  backgroundColor: `${getSignalColor(magicSignals[currentSignalIndex].type)}20`,
                  color: getSignalColor(magicSignals[currentSignalIndex].type)
                }}
              >
                {magicSignals[currentSignalIndex].type}
              </Badge>
              <span className="font-mono text-lg font-bold text-foreground">{magicSignals[currentSignalIndex].asset}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: getSignalColor(magicSignals[currentSignalIndex].type) }} />
              <span className="font-mono text-xs font-bold" style={{ color: getSignalColor(magicSignals[currentSignalIndex].type) }}>
                {magicSignals[currentSignalIndex].confidence}% confidence
              </span>
            </div>
          </div>
          
          <p className="text-sm text-foreground/80 mb-3">{magicSignals[currentSignalIndex].reason}</p>
          
          {magicSignals[currentSignalIndex].priceTarget && (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-[hsl(162,91%,32%)]" />
                <span className="text-muted-foreground">Target:</span>
                <span className="text-[hsl(162,91%,32%)] font-bold">{magicSignals[currentSignalIndex].priceTarget}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[hsl(355,88%,58%)]" />
                <span className="text-muted-foreground">Stop:</span>
                <span className="text-[hsl(355,88%,58%)] font-bold">{magicSignals[currentSignalIndex].stopLoss}</span>
              </div>
            </div>
          )}

          {/* Signal Progress Indicator */}
          <div className="flex gap-1 mt-4">
            {magicSignals.map((_, i) => (
              <div 
                key={i}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === currentSignalIndex ? 'bg-[hsl(270,91%,65%)]' : 'bg-[hsl(222,14%,20%)]'}`}
              />
            ))}
          </div>
        </div>

        {/* Signal List */}
        <div className="space-y-2">
          {magicSignals.slice(0, 3).map((signal, i) => (
            <div 
              key={i}
              className={`flex items-center justify-between p-3 rounded-lg bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)] hover:border-[hsl(222,14%,25%)] transition-colors cursor-pointer ${i === currentSignalIndex ? 'ring-1 ring-[hsl(270,91%,65%,0.3)]' : ''}`}
              onClick={() => setCurrentSignalIndex(i)}
            >
              <div className="flex items-center gap-3">
                <Badge 
                  className="text-[8px] font-bold w-10 justify-center"
                  style={{ 
                    backgroundColor: `${getSignalColor(signal.type)}20`,
                    color: getSignalColor(signal.type)
                  }}
                >
                  {signal.type.toUpperCase()}
                </Badge>
                <span className="font-mono text-sm font-bold text-foreground">{signal.asset}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{signal.reason}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold" style={{ color: getSignalColor(signal.type) }}>
                  {signal.confidence}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Thematic Screeners - AInvest Congress/Meme/Fed screeners */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {thematicScreeners.map((screener) => {
          const colorMap: Record<string, string> = {
            gold: 'hsl(43,96%,56%)',
            purple: 'hsl(270,91%,65%)',
            blue: 'hsl(224,100%,58%)',
            green: 'hsl(162,91%,32%)',
          };
          const bgColorMap: Record<string, string> = {
            gold: 'bg-[hsl(43,96%,56%,0.1)]',
            purple: 'bg-[hsl(270,91%,65%,0.1)]',
            blue: 'bg-[hsl(224,100%,58%,0.1)]',
            green: 'bg-[hsl(162,91%,32%,0.1)]',
          };
          
          return (
            <Card 
              key={screener.name}
              className={`p-4 ${bgColorMap[screener.color]} border-[${colorMap[screener.color]}30] hover:border-[${colorMap[screener.color]}50] transition-all cursor-pointer group`}
              style={{ borderColor: `${colorMap[screener.color]}30` }}
            >
              <div className="flex items-center justify-between mb-2">
                <Crown className="w-4 h-4" style={{ color: colorMap[screener.color] }} />
                <Badge className="text-[8px]" style={{ backgroundColor: `${colorMap[screener.color]}20`, color: colorMap[screener.color] }}>
                  {screener.count} signals
                </Badge>
              </div>
              <h4 className="font-bold text-sm text-foreground group-hover:text-white transition-colors">{screener.name}</h4>
              <p className="text-[10px] text-muted-foreground">{screener.description}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default AimeStyleAIPanel;
