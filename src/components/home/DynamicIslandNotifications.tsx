import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { 
  TrendingUp, 
  Bell,
  CheckCircle2,
  Bot,
  Coins,
  Clock,
  ArrowUpRight
} from "lucide-react";

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setActiveNotification(prev => (prev + 1) % notifications.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const mapped: Notification[] = (data || []).map(n => ({
        id: n.id,
        type: n.notification_type as Notification['type'],
        title: n.title,
        message: n.message,
        asset: n.asset || undefined,
        value: n.value || undefined,
        change: n.change_percent ? Number(n.change_percent) : undefined,
        timestamp: new Date(n.created_at),
        isLive: n.is_live
      }));

      setNotifications(mapped);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

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

  // Don't render if no notifications or loading
  if (loading || notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[activeNotification];

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
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