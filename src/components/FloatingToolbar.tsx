import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Calendar,
  LayoutGrid,
  TrendingUp,
  Newspaper,
  BellRing,
  BarChart3,
  Activity,
  Atom,
  Layers,
  Globe,
  ChevronRight,
  ChevronLeft,
  Search,
  Zap,
  LineChart,
  Target,
  Shield,
  BookOpen,
  Crosshair,
  Cpu,
  FlaskConical,
  ShoppingCart,
  Wallet,
  DollarSign,
  ExternalLink,
  Grip,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ToolItem {
  id: string;
  name: string;
  icon: any;
  path: string;
  description: string;
  category: string;
  badge?: string;
}

const ALL_TOOLS: ToolItem[] = [
  // Trading
  { id: 'heatmap', name: 'Heat Map', icon: LayoutGrid, path: '/advanced-trading', description: 'Market heat visualization', category: 'Trading', badge: 'Live' },
  { id: 'calendar', name: 'Economic Calendar', icon: Calendar, path: '/calendar', description: 'Global events & data releases', category: 'Trading' },
  { id: 'watchlist', name: 'Watchlist', icon: TrendingUp, path: '/watchlist', description: 'Track your favorite assets', category: 'Trading' },
  { id: 'screener', name: 'Screener', icon: Search, path: '/screener', description: 'Find trading opportunities', category: 'Trading' },
  { id: 'orderbook', name: 'Level II Data', icon: Layers, path: '/advanced-trading', description: 'Order book depth', category: 'Trading' },
  { id: 'charts', name: 'Advanced Charts', icon: LineChart, path: '/advanced-trading', description: 'Technical analysis', category: 'Trading' },
  { id: 'patterns', name: 'Pattern Recognition', icon: Activity, path: '/advanced-trading', description: 'AI pattern detection', category: 'Trading' },
  { id: 'smartorders', name: 'Smart Orders', icon: Target, path: '/advanced-trading', description: 'TWAP, VWAP, Iceberg', category: 'Trading' },
  
  // Intelligence
  { id: 'news', name: 'News Feed', icon: Newspaper, path: '/news', description: 'Real-time market news', category: 'Intel' },
  { id: 'alerts', name: 'Alerts', icon: BellRing, path: '/alerts', description: 'Price & event alerts', category: 'Intel', badge: 'New' },
  { id: 'intel', name: 'Market Intelligence', icon: Globe, path: '/intelligence', description: 'Options flow, on-chain', category: 'Intel' },
  { id: 'defi', name: 'DeFi Sniper', icon: Crosshair, path: '/defi-sniper', description: 'New token launches', category: 'Intel' },
  
  // AI & Quantum
  { id: 'qaqi', name: 'QAQI Agent', icon: Atom, path: '/qaqi', description: 'Quantum AI assistant', category: 'AI', badge: 'Quantum' },
  { id: 'ml', name: 'ML Predictions', icon: Cpu, path: '/ml-predictions', description: 'AI price forecasts', category: 'AI' },
  { id: 'quantum', name: 'Quantum Lab', icon: FlaskConical, path: '/quantum-lab', description: 'Quantum research', category: 'AI' },
  
  // Strategy
  { id: 'strategies', name: 'Strategy Lab', icon: Target, path: '/strategy-lab', description: 'Build & backtest', category: 'Strategy' },
  { id: 'marketplace', name: 'Marketplace', icon: ShoppingCart, path: '/marketplace', description: 'Rent strategies', category: 'Strategy' },
  { id: 'risk', name: 'Risk Manager', icon: Shield, path: '/risk', description: 'Portfolio risk analysis', category: 'Strategy' },
  
  // Portfolio
  { id: 'portfolio', name: 'Portfolio', icon: BarChart3, path: '/portfolio', description: 'Holdings & performance', category: 'Portfolio' },
  { id: 'vault', name: 'Lightning Vault', icon: Zap, path: '/vault', description: 'Instant settlements', category: 'Portfolio' },
  { id: 'analytics', name: 'Analytics', icon: Activity, path: '/analytics', description: 'Deep analysis tools', category: 'Portfolio' },
  
  // Learn
  { id: 'education', name: 'Education', icon: BookOpen, path: '/education', description: 'Tutorials & guides', category: 'Learn' },
];

// Quick access tools shown in collapsed bar
const QUICK_ACCESS_IDS = ['heatmap', 'calendar', 'watchlist', 'screener', 'news', 'alerts', 'qaqi'];

const FloatingToolbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [position, setPosition] = useState<'right' | 'left'>('right');
  
  // Hide on auth page
  if (location.pathname === '/auth') return null;

  const quickTools = ALL_TOOLS.filter(t => QUICK_ACCESS_IDS.includes(t.id));
  const categories = [...new Set(ALL_TOOLS.map(t => t.category))];

  if (isHidden) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className={cn(
                "fixed bottom-4 z-50 rounded-full shadow-lg bg-background/95 backdrop-blur border-2",
                position === 'right' ? 'right-4' : 'left-4'
              )}
              onClick={() => setIsHidden(false)}
            >
              <Grip className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={position === 'right' ? 'left' : 'right'}>
            Show Tools
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <div
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-50 flex items-center gap-1",
          position === 'right' ? 'right-2' : 'left-2'
        )}
      >
        {/* Toggle position button */}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 opacity-50 hover:opacity-100"
          onClick={() => setPosition(p => p === 'right' ? 'left' : 'right')}
        >
          {position === 'right' ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </Button>

        {/* Main toolbar */}
        <div className="bg-background/95 backdrop-blur border-2 rounded-2xl shadow-2xl p-2 flex flex-col gap-1">
          {/* Header with close */}
          <div className="flex items-center justify-between px-1 pb-1 border-b border-border/50">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">Tools</span>
            <Button
              size="icon"
              variant="ghost"
              className="h-5 w-5"
              onClick={() => setIsHidden(true)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Quick access tools */}
          {quickTools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant={location.pathname === tool.path ? 'default' : 'ghost'}
                  className="h-10 w-10 relative"
                  onClick={() => navigate(tool.path)}
                >
                  <tool.icon className="h-5 w-5" />
                  {tool.badge && (
                    <span className="absolute -top-1 -right-1 bg-primary text-[8px] text-primary-foreground px-1 rounded-full">
                      {tool.badge}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side={position === 'right' ? 'left' : 'right'}>
                <div>
                  <p className="font-semibold">{tool.name}</p>
                  <p className="text-xs text-muted-foreground">{tool.description}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}

          {/* Separator */}
          <div className="h-px bg-border/50 my-1" />

          {/* All tools sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="h-10 w-10">
                <Grip className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side={position} className="w-[400px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  All Platform Tools
                </SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                {categories.map(category => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">{category}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_TOOLS.filter(t => t.category === category).map(tool => (
                        <Button
                          key={tool.id}
                          variant={location.pathname === tool.path ? 'default' : 'outline'}
                          className="h-auto py-3 px-3 flex flex-col items-start gap-1 justify-start"
                          onClick={() => navigate(tool.path)}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <tool.icon className="h-4 w-4 flex-shrink-0" />
                            <span className="text-sm font-medium truncate">{tool.name}</span>
                            {tool.badge && (
                              <Badge variant="secondary" className="ml-auto text-[10px] px-1">
                                {tool.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground text-left line-clamp-1">
                            {tool.description}
                          </p>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Quick Links
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => navigate('/cockpit')}>
                    Trading Cockpit
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => navigate('/exchange')}>
                    Exchange Hub
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => navigate('/derivatives')}>
                    Derivatives
                  </Button>
                  <Button variant="ghost" size="sm" className="justify-start" onClick={() => navigate('/social')}>
                    Copy Trading
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default FloatingToolbar;
