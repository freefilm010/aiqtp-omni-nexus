import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Shield,
  Brain,
  Globe,
  DollarSign,
  Clock,
  Users,
  Cpu,
  BarChart3,
  Layers,
  Code,
  Smartphone
} from "lucide-react";

interface FeatureComparison {
  feature: string;
  category: string;
  us: 'yes' | 'no' | 'partial' | 'superior';
  bloomberg: 'yes' | 'no' | 'partial';
  thinkorswim: 'yes' | 'no' | 'partial';
  tradingview: 'yes' | 'no' | 'partial';
  aladdin: 'yes' | 'no' | 'partial';
  importance: 'critical' | 'high' | 'medium' | 'low';
}

const FEATURE_COMPARISONS: FeatureComparison[] = [
  // Charting & Visualization
  { feature: 'Multi-timeframe Charts', category: 'Charting', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'partial', importance: 'critical' },
  { feature: 'Custom Indicators (100+)', category: 'Charting', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'no', importance: 'high' },
  { feature: 'Drawing Tools', category: 'Charting', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'partial', importance: 'high' },
  { feature: 'Multi-Monitor Support', category: 'Charting', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'partial', aladdin: 'yes', importance: 'critical' },
  { feature: '3D Visualization', category: 'Charting', us: 'partial', bloomberg: 'yes', thinkorswim: 'no', tradingview: 'no', aladdin: 'yes', importance: 'low' },
  
  // Data & Intelligence
  { feature: 'Real-time Level II', category: 'Data', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'partial', aladdin: 'yes', importance: 'critical' },
  { feature: 'Options Flow', category: 'Data', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'partial', aladdin: 'yes', importance: 'high' },
  { feature: 'Institutional Filings (13F)', category: 'Data', us: 'yes', bloomberg: 'yes', thinkorswim: 'partial', tradingview: 'no', aladdin: 'yes', importance: 'high' },
  { feature: 'On-Chain Analytics', category: 'Data', us: 'superior', bloomberg: 'partial', thinkorswim: 'no', tradingview: 'partial', aladdin: 'no', importance: 'high' },
  { feature: 'Social Sentiment', category: 'Data', us: 'yes', bloomberg: 'yes', thinkorswim: 'no', tradingview: 'partial', aladdin: 'partial', importance: 'medium' },
  { feature: 'Politician Trading Tracker', category: 'Data', us: 'superior', bloomberg: 'partial', thinkorswim: 'no', tradingview: 'no', aladdin: 'no', importance: 'medium' },
  
  // AI & Machine Learning
  { feature: 'AI Pattern Recognition', category: 'AI', us: 'yes', bloomberg: 'yes', thinkorswim: 'partial', tradingview: 'partial', aladdin: 'yes', importance: 'high' },
  { feature: 'ML Price Prediction', category: 'AI', us: 'yes', bloomberg: 'yes', thinkorswim: 'no', tradingview: 'no', aladdin: 'yes', importance: 'high' },
  { feature: 'Quantum Computing', category: 'AI', us: 'superior', bloomberg: 'partial', thinkorswim: 'no', tradingview: 'no', aladdin: 'partial', importance: 'medium' },
  { feature: 'AI Trading Copilot', category: 'AI', us: 'yes', bloomberg: 'yes', thinkorswim: 'no', tradingview: 'partial', aladdin: 'yes', importance: 'high' },
  { feature: 'Fraud Detection AI', category: 'AI', us: 'superior', bloomberg: 'yes', thinkorswim: 'no', tradingview: 'no', aladdin: 'yes', importance: 'critical' },
  
  // Trading & Execution
  { feature: 'Multi-Exchange', category: 'Trading', us: 'yes', bloomberg: 'yes', thinkorswim: 'partial', tradingview: 'partial', aladdin: 'yes', importance: 'critical' },
  { feature: 'Smart Order Routing', category: 'Trading', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'no', aladdin: 'yes', importance: 'critical' },
  { feature: 'Algo Trading', category: 'Trading', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'partial', aladdin: 'yes', importance: 'high' },
  { feature: 'Copy Trading', category: 'Trading', us: 'yes', bloomberg: 'no', thinkorswim: 'no', tradingview: 'yes', aladdin: 'no', importance: 'medium' },
  { feature: 'DeFi Integration', category: 'Trading', us: 'superior', bloomberg: 'no', thinkorswim: 'no', tradingview: 'no', aladdin: 'no', importance: 'high' },
  
  // Scripting & Customization
  { feature: 'Custom Scripts', category: 'Scripting', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'yes', importance: 'high' },
  { feature: 'Strategy Marketplace', category: 'Scripting', us: 'yes', bloomberg: 'partial', thinkorswim: 'no', tradingview: 'yes', aladdin: 'no', importance: 'medium' },
  { feature: 'Backtesting Engine', category: 'Scripting', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'yes', importance: 'critical' },
  { feature: 'Strategy Validation', category: 'Scripting', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'yes', importance: 'high' },
  
  // Risk & Portfolio
  { feature: 'Real-time Risk Analytics', category: 'Risk', us: 'yes', bloomberg: 'yes', thinkorswim: 'partial', tradingview: 'partial', aladdin: 'yes', importance: 'critical' },
  { feature: 'VaR Calculation', category: 'Risk', us: 'yes', bloomberg: 'yes', thinkorswim: 'no', tradingview: 'no', aladdin: 'yes', importance: 'high' },
  { feature: 'Stress Testing', category: 'Risk', us: 'yes', bloomberg: 'yes', thinkorswim: 'partial', tradingview: 'no', aladdin: 'yes', importance: 'high' },
  { feature: 'Portfolio Optimization', category: 'Risk', us: 'yes', bloomberg: 'yes', thinkorswim: 'partial', tradingview: 'no', aladdin: 'yes', importance: 'high' },
  
  // Security
  { feature: 'Post-Quantum Crypto', category: 'Security', us: 'superior', bloomberg: 'no', thinkorswim: 'no', tradingview: 'no', aladdin: 'partial', importance: 'critical' },
  { feature: 'Zero-Knowledge Proofs', category: 'Security', us: 'yes', bloomberg: 'no', thinkorswim: 'no', tradingview: 'no', aladdin: 'no', importance: 'medium' },
  { feature: 'Multi-Sig Wallets', category: 'Security', us: 'yes', bloomberg: 'no', thinkorswim: 'no', tradingview: 'no', aladdin: 'partial', importance: 'high' },
  
  // Platform & Access
  { feature: 'Web Platform', category: 'Platform', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'yes', importance: 'critical' },
  { feature: 'Mobile App', category: 'Platform', us: 'partial', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'yes', importance: 'high' },
  { feature: 'API Access', category: 'Platform', us: 'yes', bloomberg: 'yes', thinkorswim: 'yes', tradingview: 'yes', aladdin: 'yes', importance: 'critical' },
  { feature: 'Offline Mode', category: 'Platform', us: 'no', bloomberg: 'yes', thinkorswim: 'partial', tradingview: 'no', aladdin: 'yes', importance: 'low' },
];

const COMPETITOR_INFO = {
  bloomberg: {
    name: 'Bloomberg Terminal',
    price: '$24,000/year',
    users: '325,000+',
    strength: 'News, Fixed Income',
    weakness: 'Crypto, DeFi',
  },
  thinkorswim: {
    name: 'TD Thinkorswim',
    price: 'Free (with account)',
    users: '2M+',
    strength: 'Options, Retail',
    weakness: 'Institutional, Crypto',
  },
  tradingview: {
    name: 'TradingView',
    price: '$0-600/year',
    users: '50M+',
    strength: 'Social, Charting',
    weakness: 'Execution, Risk',
  },
  aladdin: {
    name: 'BlackRock Aladdin',
    price: 'Enterprise',
    users: '55,000+',
    strength: 'Risk, Scale',
    weakness: 'Retail, Crypto',
  },
};

const ROADMAP_ITEMS = [
  { feature: 'Mobile Trading App (iOS/Android)', priority: 'P0', status: 'In Progress', eta: 'Q1 2025' },
  { feature: 'Voice Trading Commands', priority: 'P1', status: 'Planned', eta: 'Q2 2025' },
  { feature: 'AR/VR Trading Floor', priority: 'P2', status: 'Research', eta: 'Q4 2025' },
  { feature: 'Cross-Chain DEX Aggregator', priority: 'P0', status: 'In Progress', eta: 'Q1 2025' },
  { feature: 'Institutional Prime Brokerage', priority: 'P1', status: 'Planned', eta: 'Q2 2025' },
  { feature: 'Quantum-Resistant Ledger', priority: 'P1', status: 'In Progress', eta: 'Q1 2025' },
];

const CompetitiveAnalysis = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', ...new Set(FEATURE_COMPARISONS.map(f => f.category))];

  const filteredFeatures = selectedCategory === 'all' 
    ? FEATURE_COMPARISONS 
    : FEATURE_COMPARISONS.filter(f => f.category === selectedCategory);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'yes': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'superior': return <Trophy className="h-4 w-4 text-amber-500" />;
      case 'partial': return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case 'no': return <XCircle className="h-4 w-4 text-red-500/50" />;
      default: return null;
    }
  };

  // Calculate scores
  const calculateScore = (competitor: 'us' | 'bloomberg' | 'thinkorswim' | 'tradingview' | 'aladdin') => {
    let score = 0;
    FEATURE_COMPARISONS.forEach(f => {
      const weight = f.importance === 'critical' ? 3 : f.importance === 'high' ? 2 : f.importance === 'medium' ? 1 : 0.5;
      const value = f[competitor];
      if (value === 'yes') score += weight * 1;
      else if (value === 'superior') score += weight * 1.5;
      else if (value === 'partial') score += weight * 0.5;
    });
    return score;
  };

  const scores = {
    us: calculateScore('us'),
    bloomberg: calculateScore('bloomberg'),
    thinkorswim: calculateScore('thinkorswim'),
    tradingview: calculateScore('tradingview'),
    aladdin: calculateScore('aladdin'),
  };

  const maxScore = Math.max(...Object.values(scores));

  // Count our advantages
  const advantages = FEATURE_COMPARISONS.filter(f => f.us === 'superior').length;
  const gaps = FEATURE_COMPARISONS.filter(f => f.us === 'no' || f.us === 'partial').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/20">
                <Trophy className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{advantages}</p>
                <p className="text-sm text-muted-foreground">Superior Features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-amber-500/20">
                <Target className="h-6 w-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{gaps}</p>
                <p className="text-sm text-muted-foreground">Gaps to Close</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-primary/20">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{Math.round((scores.us / maxScore) * 100)}%</p>
                <p className="text-sm text-muted-foreground">Market Parity</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Zap className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">#1</p>
                <p className="text-sm text-muted-foreground">in Crypto/DeFi</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comparison">Feature Comparison</TabsTrigger>
          <TabsTrigger value="scores">Competitive Scores</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="competitors">Competitor Profiles</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Feature-by-Feature Comparison</CardTitle>
                <div className="flex gap-2">
                  {categories.map(cat => (
                    <Button
                      key={cat}
                      variant={selectedCategory === cat ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedCategory(cat)}
                      className="capitalize"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Feature</th>
                      <th className="text-center p-2 font-medium text-primary">Us</th>
                      <th className="text-center p-2 font-medium">Bloomberg</th>
                      <th className="text-center p-2 font-medium">ToS</th>
                      <th className="text-center p-2 font-medium">TradingView</th>
                      <th className="text-center p-2 font-medium">Aladdin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFeatures.map((f, i) => (
                      <tr key={i} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <span>{f.feature}</span>
                            <Badge variant="outline" className="text-xs">
                              {f.importance}
                            </Badge>
                          </div>
                        </td>
                        <td className="text-center p-2">{getStatusIcon(f.us)}</td>
                        <td className="text-center p-2">{getStatusIcon(f.bloomberg)}</td>
                        <td className="text-center p-2">{getStatusIcon(f.thinkorswim)}</td>
                        <td className="text-center p-2">{getStatusIcon(f.tradingview)}</td>
                        <td className="text-center p-2">{getStatusIcon(f.aladdin)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scores">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Scoring</CardTitle>
              <CardDescription>
                Weighted score based on feature importance (Critical=3x, High=2x, Medium=1x)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(scores).map(([key, score]) => (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium capitalize ${key === 'us' ? 'text-primary' : ''}`}>
                      {key === 'us' ? '🏆 Our Platform' : COMPETITOR_INFO[key as keyof typeof COMPETITOR_INFO]?.name || key}
                    </span>
                    <span className="font-bold">{score.toFixed(1)}</span>
                  </div>
                  <Progress 
                    value={(score / maxScore) * 100} 
                    className={key === 'us' ? '[&>div]:bg-primary' : ''}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap">
          <Card>
            <CardHeader>
              <CardTitle>Competitive Roadmap</CardTitle>
              <CardDescription>
                Features in development to achieve and maintain market leadership
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ROADMAP_ITEMS.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Badge variant={item.priority === 'P0' ? 'default' : item.priority === 'P1' ? 'secondary' : 'outline'}>
                        {item.priority}
                      </Badge>
                      <div>
                        <p className="font-medium">{item.feature}</p>
                        <p className="text-sm text-muted-foreground">{item.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{item.eta}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="competitors">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(COMPETITOR_INFO).map(([key, info]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {info.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Price</p>
                      <p className="font-medium">{info.price}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Users</p>
                      <p className="font-medium">{info.users}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Strength</p>
                    <Badge variant="outline" className="text-green-500">{info.strength}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Weakness</p>
                    <Badge variant="outline" className="text-red-500">{info.weakness}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompetitiveAnalysis;
