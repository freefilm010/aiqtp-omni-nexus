import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Rocket,
  TrendingUp,
  AlertTriangle,
  Zap,
  Eye,
  Target,
  Activity,
  Bot,
  Flame,
  Crown,
  ArrowUpRight,
  ChevronRight,
  Sparkles,
  BarChart2
} from "lucide-react";
import { Link } from "react-router-dom";

// Combined AI Screener: Best of Tickeron + AInvest + TrendSpider
// Magic Signals + Pattern Detection + ML Predictions

interface ScreenerResult {
  id: string;
  symbol: string;
  name: string;
  type: 'crypto' | 'stock' | 'forex';
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number;
  patterns: string[];
  triggers: string[];
  priceTarget: number;
  currentPrice: number;
  change24h: number;
  volume24h: number;
  aiScore: number;
  isHot?: boolean;
  category?: string;
}

const UltimateAIScreener = () => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [results, setResults] = useState<ScreenerResult[]>([
    {
      id: '1',
      symbol: 'SOL',
      name: 'Solana',
      type: 'crypto',
      signal: 'strong_buy',
      confidence: 94,
      patterns: ['Bull Flag', 'Golden Cross'],
      triggers: ['Whale Accumulation', 'DeFi TVL Surge', 'RSI Bullish Divergence'],
      priceTarget: 245.00,
      currentPrice: 189.34,
      change24h: 5.23,
      volume24h: 3240000000,
      aiScore: 96,
      isHot: true,
      category: 'defi'
    },
    {
      id: '2',
      symbol: 'NVDA',
      name: 'NVIDIA',
      type: 'stock',
      signal: 'strong_buy',
      confidence: 91,
      patterns: ['Ascending Triangle', 'Cup & Handle'],
      triggers: ['AI Chip Demand', 'Earnings Beat', 'Institutional Buying'],
      priceTarget: 165.00,
      currentPrice: 142.50,
      change24h: 3.21,
      volume24h: 45000000,
      aiScore: 94,
      isHot: true,
      category: 'tech'
    },
    {
      id: '3',
      symbol: 'BTC',
      name: 'Bitcoin',
      type: 'crypto',
      signal: 'buy',
      confidence: 87,
      patterns: ['Higher Low Formation'],
      triggers: ['ETF Inflows', 'Halving Effect'],
      priceTarget: 115000,
      currentPrice: 97234,
      change24h: 2.34,
      volume24h: 28500000000,
      aiScore: 89,
      category: 'blue_chip'
    },
    {
      id: '4',
      symbol: 'PEPE',
      name: 'Pepe',
      type: 'crypto',
      signal: 'buy',
      confidence: 72,
      patterns: ['Breakout'],
      triggers: ['Social Volume Spike', 'Whale Buy'],
      priceTarget: 0.000025,
      currentPrice: 0.000018,
      change24h: 15.67,
      volume24h: 890000000,
      aiScore: 78,
      isHot: true,
      category: 'meme'
    },
    {
      id: '5',
      symbol: 'XRP',
      name: 'Ripple',
      type: 'crypto',
      signal: 'sell',
      confidence: 68,
      patterns: ['Head & Shoulders'],
      triggers: ['Overbought RSI', 'Resistance Rejection'],
      priceTarget: 1.85,
      currentPrice: 2.34,
      change24h: -3.45,
      volume24h: 1200000000,
      aiScore: 45,
      category: 'blue_chip'
    },
  ]);

  const categories = [
    { id: 'all', label: 'All Signals', icon: Activity },
    { id: 'blue_chip', label: 'Blue Chips', icon: Crown },
    { id: 'defi', label: 'DeFi', icon: Zap },
    { id: 'meme', label: 'Meme Coins', icon: Flame },
    { id: 'tech', label: 'Tech Stocks', icon: BarChart2 },
  ];

  const filteredResults = activeCategory === 'all' 
    ? results 
    : results.filter(r => r.category === activeCategory);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'strong_buy': return { bg: 'bg-[hsl(162,91%,32%,0.2)]', text: 'text-[hsl(162,91%,32%)]', label: 'STRONG BUY' };
      case 'buy': return { bg: 'bg-[hsl(162,91%,32%,0.15)]', text: 'text-[hsl(162,91%,32%)]', label: 'BUY' };
      case 'hold': return { bg: 'bg-[hsl(43,96%,56%,0.15)]', text: 'text-[hsl(43,96%,56%)]', label: 'HOLD' };
      case 'sell': return { bg: 'bg-[hsl(355,88%,58%,0.15)]', text: 'text-[hsl(355,88%,58%)]', label: 'SELL' };
      case 'strong_sell': return { bg: 'bg-[hsl(355,88%,58%,0.2)]', text: 'text-[hsl(355,88%,58%)]', label: 'STRONG SELL' };
      default: return { bg: 'bg-[hsl(222,14%,20%)]', text: 'text-muted-foreground', label: 'NEUTRAL' };
    }
  };

  const getAIScoreColor = (score: number) => {
    if (score >= 80) return 'text-[hsl(162,91%,32%)]';
    if (score >= 60) return 'text-[hsl(43,96%,56%)]';
    return 'text-[hsl(355,88%,58%)]';
  };

  const calculateUpside = (current: number, target: number) => {
    return ((target - current) / current * 100).toFixed(1);
  };

  return (
    <Card className="p-5 bg-[hsl(223,18%,9%)] border-[hsl(222,14%,17%)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[hsl(270,91%,65%,0.2)] to-[hsl(162,91%,32%,0.1)]">
            <Bot className="w-5 h-5 text-[hsl(270,91%,65%)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-foreground">AI Screener™</h3>
              <Badge className="bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)] text-[9px]">
                <Sparkles className="w-3 h-3 mr-1" />
                ML-POWERED
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground">Pattern + Signal + Sentiment fusion</p>
          </div>
        </div>
        <Link to="/screener">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground">
            Full Screener <ChevronRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.id
                  ? 'bg-[hsl(270,91%,65%,0.15)] text-[hsl(270,91%,65%)] border border-[hsl(270,91%,65%,0.3)]'
                  : 'bg-[hsl(223,18%,12%)] text-muted-foreground hover:text-foreground border border-transparent'
              }`}
            >
              <Icon className="w-3 h-3" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Results Grid */}
      <div className="space-y-3">
        {filteredResults.map((result) => {
          const signalStyle = getSignalColor(result.signal);
          const upside = calculateUpside(result.currentPrice, result.priceTarget);
          
          return (
            <div 
              key={result.id}
              className={`relative p-4 rounded-xl bg-[hsl(223,18%,7%)] border border-[hsl(222,14%,15%)] hover:border-[hsl(222,14%,25%)] transition-all ${
                result.isHot ? 'ring-1 ring-[hsl(355,88%,58%,0.2)]' : ''
              }`}
            >
              {/* Hot Badge */}
              {result.isHot && (
                <div className="absolute top-2 right-2">
                  <Badge className="bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)] text-[8px] animate-pulse">
                    <Flame className="w-2.5 h-2.5 mr-0.5" />
                    HOT
                  </Badge>
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* Symbol & Signal */}
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-[hsl(223,18%,15%)] flex items-center justify-center">
                    <span className="font-mono text-sm font-bold text-foreground">{result.symbol}</span>
                  </div>
                  <Badge className={`text-[8px] font-bold ${signalStyle.bg} ${signalStyle.text}`}>
                    {signalStyle.label}
                  </Badge>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-foreground">{result.name}</span>
                    <Badge className="text-[8px] bg-[hsl(222,14%,20%)] text-muted-foreground uppercase">
                      {result.type}
                    </Badge>
                  </div>

                  {/* Patterns & Triggers */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {result.patterns.map((pattern, i) => (
                      <Badge key={i} className="text-[8px] bg-[hsl(224,100%,58%,0.1)] text-[hsl(224,100%,58%)]">
                        {pattern}
                      </Badge>
                    ))}
                    {result.triggers.slice(0, 2).map((trigger, i) => (
                      <Badge key={i} className="text-[8px] bg-[hsl(43,96%,56%,0.1)] text-[hsl(43,96%,56%)]">
                        {trigger}
                      </Badge>
                    ))}
                    {result.triggers.length > 2 && (
                      <Badge className="text-[8px] bg-[hsl(222,14%,20%)] text-muted-foreground">
                        +{result.triggers.length - 2} more
                      </Badge>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <div className="font-mono text-sm font-bold text-foreground">
                        ${result.currentPrice < 1 ? result.currentPrice.toFixed(6) : result.currentPrice.toLocaleString()}
                      </div>
                      <div className="text-[8px] text-muted-foreground">Current</div>
                    </div>
                    <div>
                      <div className={`font-mono text-sm font-bold ${result.change24h >= 0 ? 'text-[hsl(162,91%,32%)]' : 'text-[hsl(355,88%,58%)]'}`}>
                        {result.change24h >= 0 ? '+' : ''}{result.change24h}%
                      </div>
                      <div className="text-[8px] text-muted-foreground">24h Change</div>
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold text-[hsl(162,91%,32%)]">
                        +{upside}%
                      </div>
                      <div className="text-[8px] text-muted-foreground">Upside</div>
                    </div>
                    <div>
                      <div className={`font-mono text-sm font-bold ${getAIScoreColor(result.aiScore)}`}>
                        {result.aiScore}
                      </div>
                      <div className="text-[8px] text-muted-foreground">AI Score</div>
                    </div>
                  </div>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3 text-[hsl(162,91%,32%)]" />
                      <span className="font-mono text-xs text-[hsl(162,91%,32%)] font-bold">
                        ${result.priceTarget < 1 ? result.priceTarget.toFixed(6) : result.priceTarget.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[9px] text-muted-foreground">Target</div>
                  </div>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Activity className="w-3 h-3" />
                    {result.confidence}% conf.
                  </div>
                  <Button 
                    size="sm" 
                    className="h-7 px-3 text-[10px] bg-[hsl(270,91%,65%)] hover:bg-[hsl(270,91%,70%)] text-white"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    Analyze
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-[hsl(222,14%,15%)]">
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-[hsl(162,91%,32%)]">23</div>
          <div className="text-[9px] text-muted-foreground uppercase">Strong Buys</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-[hsl(43,96%,56%)]">47</div>
          <div className="text-[9px] text-muted-foreground uppercase">Buy Signals</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-[hsl(355,88%,58%)]">12</div>
          <div className="text-[9px] text-muted-foreground uppercase">Sell Signals</div>
        </div>
        <div className="text-center">
          <div className="font-mono text-lg font-bold text-[hsl(270,91%,65%)]">87%</div>
          <div className="text-[9px] text-muted-foreground uppercase">Avg Accuracy</div>
        </div>
      </div>
    </Card>
  );
};

export default UltimateAIScreener;
