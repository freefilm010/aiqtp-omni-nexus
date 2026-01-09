import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  CreditCard,
  Shield,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  Activity,
  Users,
  FileText,
  Zap,
  Wallet,
  RefreshCw,
  BookOpen,
  Coins,
  Trophy,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  section?: string;
}

const navItems: NavItem[] = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Financials", href: "/admin/financials", icon: DollarSign },
  { title: "Revenue", href: "/admin/revenue", icon: TrendingUp },
  { title: "Treasury Wallets", href: "/admin/treasury", icon: Wallet },
  { title: "Profit Automation", href: "/admin/profit-automation", icon: RefreshCw },
  { title: "Investments", href: "/admin/investments", icon: TrendingUp },
  { title: "Operators", href: "/admin/operators", icon: Building2, section: "Growth" },
  { title: "Token Factory", href: "/admin/tokens", icon: Coins },
  { title: "Contests & Airdrops", href: "/admin/contests", icon: Trophy },
  { title: "Influencers", href: "/admin/influencers", icon: Users },
  { title: "Chat Management", href: "/admin/chats", icon: Bot },
  { title: "Payments", href: "/admin/payments", icon: CreditCard },
  { title: "Automation", href: "/admin/automation", icon: Zap },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Security", href: "/admin/security", icon: Shield },
  { title: "AI Copilot", href: "/admin/copilot", icon: Bot },
  { title: "Documentation", href: "/admin/documentation", icon: BookOpen },
  { title: "Logs", href: "/admin/logs", icon: FileText },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin Console</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className={cn(collapsed && "mx-auto")}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-border">
        {!collapsed && (
          <div className="text-xs text-muted-foreground">
            <p>AIQTP Admin v1.0</p>
            <p className="flex items-center gap-1 mt-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              System Online
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdminSidebar;
