import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Coins,
  Target,
  Bot,
  Clock
} from "lucide-react";

// iOS Dynamic Island-inspired notification component
// Live Activities for real-time trade updates

interface Notification {
  id: string;
  type: 'trade_executed' | 'price_alert' | 'signal' | 'system' | 'whale_alert';
  title: string;
  message: string;
  asset?: string;
  value?: string;
  change?: number;
  timestamp: Date;
  isLive?: boolean;
}

const DynamicIslandNotifications = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeNotification, setActiveNotification] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'trade_executed',
      title: 'Trade Executed',
      message: 'BUY 0.5 BTC @ $97,234',
      asset: 'BTC',
      value: '+$48,617',
      timestamp: new Date(),
      isLive: true
    },
    {
      id: '2',
      type: 'price_alert',
      title: 'Price Alert',
      message: 'ETH crossed $3,500 resistance',
      asset: 'ETH',
      change: 2.34,
      timestamp: new Date(Date.now() - 60000)
    },
    {
      id: '3',
      type: 'signal',
      title: 'AI Signal',
      message: 'STRONG BUY signal for SOL',
      asset: 'SOL',
      change: 5.67,
      timestamp: new Date(Date.now() - 120000)
    },
    {
      id: '4',
      type: 'whale_alert',
      title: 'Whale Alert',
      message: '2,500 BTC moved from Binance',
      value: '$243M',
      timestamp: new Date(Date.now() - 180000)
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNotification(prev => (prev + 1) % notifications.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [notifications.length]);

  // Only auto-expand on first load, not on every notification change
  // This prevents the "jumping" effect from constant expansion/collapse

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade_executed': return <CheckCircle2 className="w-4 h-4 text-[hsl(162,91%,32%)]" />;
      case 'price_alert': return <TrendingUp className="w-4 h-4 text-[hsl(43,96%,56%)]" />;
      case 'signal': return <Bot className="w-4 h-4 text-[hsl(270,91%,65%)]" />;
      case 'whale_alert': return <Coins className="w-4 h-4 text-[hsl(224,100%,58%)]" />;
      default: return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'trade_executed': return 'from-[hsl(162,91%,32%,0.2)] to-[hsl(162,91%,32%,0.05)]';
      case 'price_alert': return 'from-[hsl(43,96%,56%,0.2)] to-[hsl(43,96%,56%,0.05)]';
      case 'signal': return 'from-[hsl(270,91%,65%,0.2)] to-[hsl(270,91%,65%,0.05)]';
      case 'whale_alert': return 'from-[hsl(224,100%,58%,0.2)] to-[hsl(224,100%,58%,0.05)]';
      default: return 'from-[hsl(222,14%,20%)] to-[hsl(222,14%,15%)]';
    }
  };

  const currentNotification = notifications[activeNotification];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      {/* Dynamic Island Container */}
      <div 
        className={`
          relative overflow-hidden cursor-pointer
          transition-all duration-500 ease-out
          ${isExpanded 
            ? 'w-[360px] h-auto rounded-3xl' 
            : 'w-[200px] h-[36px] rounded-full'
          }
        `}
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          background: 'linear-gradient(180deg, hsl(223,18%,12%) 0%, hsl(223,18%,8%) 100%)',
          border: '1px solid hsl(222,14%,20%)',
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05) inset'
        }}
      >
        {/* Collapsed State */}
        {!isExpanded && (
          <div className="flex items-center justify-between px-4 h-full">
            <div className="flex items-center gap-2">
              {getNotificationIcon(currentNotification.type)}
              <span className="font-mono text-[11px] text-foreground font-medium truncate max-w-[100px]">
                {currentNotification.title}
              </span>
            </div>
            {currentNotification.isLive && (
              <div className="w-2 h-2 rounded-full bg-[hsl(162,91%,32%)] animate-pulse" />
            )}
          </div>
        )}

        {/* Expanded State */}
        {isExpanded && (
          <div className={`p-4 bg-gradient-to-br ${getNotificationColor(currentNotification.type)}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[hsl(223,18%,15%)]">
                  {getNotificationIcon(currentNotification.type)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-foreground">{currentNotification.title}</span>
                    {currentNotification.isLive && (
                      <Badge className="bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)] text-[8px]">
                        LIVE
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Just now</span>
                  </div>
                </div>
              </div>
              
              {currentNotification.asset && (
                <Badge className="bg-[hsl(222,14%,20%)] text-foreground font-mono text-[10px]">
                  {currentNotification.asset}
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="space-y-2">
              <p className="text-sm text-foreground/90">{currentNotification.message}</p>
              
              {(currentNotification.value || currentNotification.change !== undefined) && (
                <div className="flex items-center gap-4">
                  {currentNotification.value && (
                    <div className="flex items-center gap-1">
                      <ArrowUpRight className="w-4 h-4 text-[hsl(162,91%,32%)]" />
                      <span className="font-mono text-lg font-bold text-[hsl(162,91%,32%)]">
                        {currentNotification.value}
                      </span>
                    </div>
                  )}
                  {currentNotification.change !== undefined && (
                    <Badge className={`text-xs ${currentNotification.change >= 0 ? 'bg-[hsl(162,91%,32%,0.15)] text-[hsl(162,91%,32%)]' : 'bg-[hsl(355,88%,58%,0.15)] text-[hsl(355,88%,58%)]'}`}>
                      {currentNotification.change >= 0 ? '+' : ''}{currentNotification.change}%
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-1.5 mt-4">
              {notifications.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveNotification(i);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    i === activeNotification 
                      ? 'w-4 bg-foreground' 
                      : 'bg-[hsl(222,14%,30%)] hover:bg-[hsl(222,14%,40%)]'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Shimmer Effect */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
            animation: 'shimmer 2s infinite'
          }}
        />
      </div>
    </div>
  );
};

export default DynamicIslandNotifications;
