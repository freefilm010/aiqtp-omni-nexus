import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sparkles,
  Plus,
  TrendingUp,
  Gift,
  Trophy,
  Building2,
  ChartBar,
  Zap,
  Target,
  DollarSign,
  Activity,
  Brain,
  LineChart,
  Shield,
  X,
  Search,
  Mic,
  Play
} from "lucide-react";

interface ScreenerCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
}

interface QuickAction {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  bgColor: string;
}

const categories: ScreenerCategory[] = [
  { id: 'for-you', name: 'For you', icon: <Sparkles className="h-4 w-4" />, color: 'bg-primary text-primary-foreground' },
  { id: 'pattern', name: 'Pattern Recognition', icon: <ChartBar className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'signals', name: 'Trade Signals', icon: <Zap className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'price-actions', name: 'Price Actions', icon: <TrendingUp className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'next-gen', name: 'Next-Gen Tech Leaders', icon: <Brain className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'high-dividend', name: 'High Dividend Stocks', icon: <DollarSign className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'steady', name: 'Steady Performers', icon: <Shield className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'wall-street', name: 'Wall Street Picks', icon: <Building2 className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'financial', name: 'Financial Health', icon: <Activity className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'undervalued', name: 'Undervalued Opportunities', icon: <Target className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
  { id: 'ai-insights', name: 'AI Insights', icon: <Sparkles className="h-4 w-4" />, color: 'bg-secondary text-secondary-foreground' },
];

const quickActions: QuickAction[] = [
  { id: 'magic', name: 'Magic Day Trading', icon: <TrendingUp className="h-8 w-8" />, description: 'AI-powered day trading signals', bgColor: 'bg-emerald-900' },
  { id: 'offers', name: '50% off', icon: <Gift className="h-8 w-8" />, description: 'Premium features discount', bgColor: 'bg-indigo-900' },
  { id: 'social', name: 'Social Trader', icon: <Trophy className="h-8 w-8" />, description: 'Follow top traders', bgColor: 'bg-purple-900' },
  { id: 'fed', name: 'Fed Watching', icon: <Building2 className="h-8 w-8" />, description: 'Federal Reserve insights', bgColor: 'bg-slate-800' },
];

const AIScreener = () => {
  const [query, setQuery] = useState("Show stocks with rising volume and bullish signals in the last week.");
  const [selectedCategory, setSelectedCategory] = useState('for-you');
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const handleRunScreener = () => {
    setIsRunning(true);
    // Simulate AI processing
    setTimeout(() => setIsRunning(false), 2000);
  };

  const startVoiceInput = () => {
    setIsListening(true);
    // Voice recognition would be implemented here
    setTimeout(() => setIsListening(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* AI Query Input */}
      <Card className="border-primary/30 bg-gradient-to-br from-background to-primary/5">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-foreground text-lg">
              {query}
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => toast.info("Advanced filters coming soon!")}
                aria-label="Open advanced filters"
              >
                <Plus className="h-4 w-4" />
                Filters
              </Button>
              <Button 
                className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                onClick={handleRunScreener}
                disabled={isRunning}
                aria-label={isRunning ? "Screener is running" : "Run AI screener"}
              >
                <Sparkles className="h-4 w-4" />
                {isRunning ? 'Running...' : 'Run Screener'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Tiles */}
      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-4">
          {quickActions.map((action) => (
            <Card 
              key={action.id}
              className={`flex-shrink-0 w-32 cursor-pointer hover:scale-105 transition-transform ${action.bgColor} border-0`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center text-white">
                <div className="p-3 rounded-xl bg-white/10 mb-2">
                  {action.icon}
                </div>
                <span className="text-sm font-medium">{action.name}</span>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Category Chips */}
      <div className="flex items-center gap-2">
        <ScrollArea className="flex-1">
          <div className="flex gap-2 pb-2">
            {categories.slice(0, 4).map((cat) => (
              <Badge 
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                className="cursor-pointer whitespace-nowrap px-4 py-2 text-sm"
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Badge>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        
        <Sheet open={showCategorySheet} onOpenChange={setShowCategorySheet}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <ChartBar className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader className="flex flex-row items-center justify-between">
              <SheetTitle>Category</SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowCategorySheet(false)}>
                <X className="h-5 w-5" />
              </Button>
            </SheetHeader>
            <div className="flex flex-wrap gap-3 mt-6">
              {categories.map((cat) => (
                <Badge 
                  key={cat.id}
                  variant={selectedCategory === cat.id ? 'default' : 'secondary'}
                  className="cursor-pointer px-4 py-2 text-sm"
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setShowCategorySheet(false);
                  }}
                >
                  {cat.name}
                </Badge>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Pattern Recognition Card (Featured) */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              Pattern Recognition
              <ChartBar className="h-4 w-4 text-muted-foreground" />
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {/* Heatmap Visualization */}
          <div className="grid grid-cols-12 gap-0.5 mb-4">
            {Array.from({ length: 96 }).map((_, i) => {
              const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500', 'bg-purple-500'];
              const randomColor = colors[Math.floor(Math.random() * colors.length)];
              const opacity = ['opacity-40', 'opacity-60', 'opacity-80', 'opacity-100'][Math.floor(Math.random() * 4)];
              return (
                <div 
                  key={i} 
                  className={`h-6 rounded-sm ${randomColor} ${opacity}`}
                />
              );
            })}
          </div>
          <p className="text-foreground mb-2">
            Identify penny stocks with strong volume and upward momentum...
          </p>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">10</span>
            <span className="text-muted-foreground">Symbols</span>
          </div>
        </CardContent>
      </Card>

      {/* AI Chat Input */}
      <Card className="fixed bottom-20 left-4 right-4 md:relative md:bottom-auto md:left-auto md:right-auto">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Ask me anything or hold to speak"
              className="flex-1 border-0 bg-transparent focus-visible:ring-0"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button variant="ghost" size="icon">
              <Plus className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className={isListening ? 'text-red-500 animate-pulse' : ''}
              onClick={startVoiceInput}
            >
              <Mic className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIScreener;
