import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Sparkles,
  Zap,
  Target,
  LineChart,
  ThumbsUp,
  Eye,
  Bell,
  Grid3X3,
  Radar,
  MessageCircle,
  Mic,
  Plus,
  ArrowUpDown,
  GripVertical,
  ChevronRight,
  Bot
} from "lucide-react";

interface AIFeature {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  isPro?: boolean;
}

const aiFeatures: AIFeature[] = [
  { id: 'quick-insights', name: 'Quick Insights', icon: <Zap className="h-5 w-5" />, color: 'text-yellow-500', description: 'Instant market analysis' },
  { id: 'trade-decision', name: 'Trade Decision', icon: <Target className="h-5 w-5" />, color: 'text-orange-500', description: 'AI-powered trade recommendations' },
  { id: 'price-forecast', name: 'Price Forecast', icon: <LineChart className="h-5 w-5" />, color: 'text-blue-500', description: 'Predictive price modeling' },
  { id: 'top-picks', name: 'Top Stock Picks', icon: <ThumbsUp className="h-5 w-5" />, color: 'text-green-500', description: 'Curated investment opportunities' },
  { id: 'visualization', name: 'Visualization', icon: <Eye className="h-5 w-5" />, color: 'text-purple-500', description: 'Interactive charts and data' },
  { id: 'alert', name: 'Alert', icon: <Bell className="h-5 w-5" />, color: 'text-red-500', description: 'Custom price and news alerts' },
  { id: 'pattern', name: 'Pattern Screening', icon: <Grid3X3 className="h-5 w-5" />, color: 'text-cyan-500', description: 'Technical pattern detection' },
  { id: 'circle', name: 'Circle Analyze', icon: <Radar className="h-5 w-5" />, color: 'text-emerald-500', description: 'Peer and sector analysis' },
  { id: 'feedback', name: 'Feedback', icon: <MessageCircle className="h-5 w-5" />, color: 'text-pink-500', description: 'Share your thoughts' },
];

const quickPrompts = [
  { id: 'auto', name: 'Auto', icon: <ArrowUpDown className="h-4 w-4" /> },
  { id: 'insights', name: 'Quick Insights', icon: <Zap className="h-4 w-4" /> },
  { id: 'trade', name: 'Trade Dec', icon: <Target className="h-4 w-4" /> },
  { id: 'forecast', name: 'Price Forecast', icon: <LineChart className="h-4 w-4" /> },
  { id: 'picks', name: 'Top Stock Picks', icon: <ThumbsUp className="h-4 w-4" /> },
  { id: 'visual', name: 'Visualization', icon: <Eye className="h-4 w-4" /> },
];

const AIAssistantHub = () => {
  const [query, setQuery] = useState("");
  const [selectedPrompt, setSelectedPrompt] = useState('auto');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [featureOrder, setFeatureOrder] = useState(aiFeatures.map(f => f.id));
  const [isListening, setIsListening] = useState(false);

  const orderedFeatures = featureOrder.map(id => aiFeatures.find(f => f.id === id)!);

  const startVoiceInput = () => {
    setIsListening(true);
    setTimeout(() => setIsListening(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* AI Avatar Header */}
      <div className="text-center space-y-4">
        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
          <Bot className="h-10 w-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
            Aime
            <Badge className="bg-gradient-to-r from-blue-500 to-purple-500">Pro</Badge>
          </h2>
          <p className="text-muted-foreground">Your AI Trading Assistant</p>
        </div>
      </div>

      {/* Year in Review Card */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <div className="bg-gradient-to-br from-orange-500 via-pink-500 to-purple-600 p-8 text-white text-center">
              <div className="relative z-10">
                <p className="text-5xl font-bold mb-2">2025</p>
                <h3 className="text-xl font-semibold">Moments with Aime</h3>
                <p className="text-sm opacity-80 mt-2">
                  Relive your year of smart investments and standout moments.
                </p>
                <Button className="mt-4 bg-blue-500 hover:bg-blue-600">
                  Get started
                </Button>
              </div>
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-4 left-4 w-16 h-32 border border-white/30 rounded" />
                <div className="absolute top-8 right-8 w-24 h-16 border border-white/30 rounded" />
                <div className="absolute bottom-8 left-1/4 w-20 h-20 border border-white/30 rounded" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Prompt Chips */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {quickPrompts.map((prompt) => (
            <Badge
              key={prompt.id}
              variant={selectedPrompt === prompt.id ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap px-4 py-2 gap-2"
              onClick={() => setSelectedPrompt(prompt.id)}
            >
              {prompt.icon}
              {prompt.name}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* AI Features List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">AI Features</CardTitle>
          <Sheet open={showSortSheet} onOpenChange={setShowSortSheet}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[70vh]">
              <SheetHeader>
                <SheetTitle>Sort Features</SheetTitle>
              </SheetHeader>
              <div className="space-y-2 mt-4">
                {orderedFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center gap-3 p-3 bg-secondary rounded-lg"
                  >
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span className={feature.color}>{feature.icon}</span>
                    <span className="flex-1">{feature.name}</span>
                    <Button variant="ghost" size="icon">
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </CardHeader>
        <CardContent className="space-y-1">
          {orderedFeatures.map((feature) => (
            <div
              key={feature.id}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors cursor-pointer"
            >
              <span className={feature.color}>{feature.icon}</span>
              <span className="flex-1 font-medium">{feature.name}</span>
              {feature.isPro && (
                <Badge variant="secondary" className="text-xs">Pro</Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chat Input */}
      <Card className="sticky bottom-4">
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

export default AIAssistantHub;
