import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useTheme, ThemeType } from "@/contexts/ThemeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import MobileMenu from "@/components/MobileMenu";
import { 
  Menu, 
  X, 
  Zap, 
  ChevronDown, 
  Globe,
  User,
  Settings,
  Brain,
  LogOut,
  BarChart3,
  Target,
  ShoppingCart,
  Activity,
  Crosshair,
  Bot,
  Atom,
  Shield,
  Cpu,
  TrendingUp,
  Layers,
  BookOpen,
  Newspaper,
  Calendar,
  LineChart,
  FlaskConical,
  BellRing,
  Palette,
  Monitor,
  LayoutGrid,
  DollarSign,
  Music,
  Trophy,
  Percent,
  ExternalLink,
  Coins,
  Home,
  Plug,
  Gift,
  Wallet
} from "lucide-react";

const AdminAccountItem = ({ onNavigate }: { onNavigate: () => void }) => {
  const { isAdmin } = useAdminAuth();

  if (!isAdmin) return null;

  return (
    <DropdownMenuItem onClick={onNavigate}>
      <Shield className="mr-2 h-4 w-4" />
      Admin
    </DropdownMenuItem>
  );
};

const AdminWalletMenuItems = () => {
  const { isAdmin } = useAdminAuth();

  if (!isAdmin) return null;

  return (
    <>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">Admin Only</DropdownMenuLabel>
      <DropdownMenuItem asChild>
        <Link to="/admin" className="flex items-center w-full">
          <Shield className="mr-2 h-4 w-4" />
          Admin Dashboard
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/admin/apex" className="flex items-center w-full">
          <Target className="mr-2 h-4 w-4" />
          Apex Prop Trading
        </Link>
      </DropdownMenuItem>
    </>
  );
};

const AdminMobileMenuItems = ({ onClose }: { onClose: () => void }) => {
  const { isAdmin } = useAdminAuth();

  if (!isAdmin) return null;

  return (
    <>
      <Link
        to="/admin"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-foreground text-sm"
        onClick={onClose}
      >
        <Shield className="h-4 w-4" />
        Admin Dashboard
      </Link>
      <Link
        to="/admin/apex"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent text-foreground text-sm"
        onClick={onClose}
      >
        <Target className="h-4 w-4" />
        Apex Prop Trading
      </Link>
    </>
  );
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const openPopout = (tool: string) => {
    window.open(`/popout/${tool}`, "_blank", "noopener,noreferrer");
  };

  const themeOptions: { id: ThemeType; name: string }[] = [
    { id: "default", name: "Professional" },
    { id: "hacker", name: "Hacker" },
    { id: "matrix", name: "Matrix" },
    { id: "cyberpunk", name: "Cyberpunk" },
    { id: "terminal", name: "Terminal" },
    { id: "bloomberg", name: "Bloomberg" },
    { id: "midnight", name: "Midnight" },
    { id: "neon", name: "Neon" },
  ];

  // Comprehensive navigation data
  const tradingLinks = [
    { to: "/trading", label: "Trading Dashboard", icon: Activity },
    { to: "/advanced-trading", label: "Advanced Trading", icon: LineChart },
    { to: "/exchange", label: "Exchange Hub", icon: Globe },
    { to: "/dex", label: "DEX", icon: Coins },
    { to: "/trading-bots", label: "Trading Bots", icon: Bot },
    { to: "/defi-sniper", label: "DeFi Sniper", icon: Crosshair },
    { to: "/screener", label: "Crypto Screener", icon: TrendingUp },
    { to: "/derivatives", label: "Derivatives", icon: Layers },
    { to: "/cockpit", label: "Trading Cockpit", icon: LayoutGrid },
    { to: "/social", label: "Copy Trading", icon: Activity },
    { to: "/vault", label: "Lightning Vault", icon: Zap },
    { to: "/portfolio", label: "Portfolio", icon: BarChart3 },
    { to: "/watchlist", label: "Watchlist", icon: TrendingUp },
  ];

  const agentLinks = [
    { to: "/hivemind", label: "HiveMind Swarm", icon: Brain },
    { to: "/quantclaw", label: "QuantClaw", icon: Bot },
    { to: "/qaqi", label: "QAQI™ Agent", icon: Atom },
    { to: "/ai-assistant", label: "AI Assistant", icon: Bot },
  ];

  const aiQuantumLinks = [
    { to: "/ai-lab", label: "AI Research Lab", icon: Brain },
    { to: "/ml-predictions", label: "ML Predictions", icon: Cpu },
    { to: "/quantum-lab", label: "Quantum Lab", icon: FlaskConical },
    { to: "/titan-codex", label: "Titan Codex™", icon: Shield },
    { to: "/intelligence", label: "Market Intelligence", icon: Brain },
  ];

  const strategyLinks = [
    { to: "/strategy-studio", label: "Strategy Studio", icon: Target },
    { to: "/strategy-lab", label: "Strategy Lab", icon: FlaskConical },
    { to: "/marketplace", label: "Strategy Marketplace", icon: ShoppingCart },
    { to: "/strategy-nft", label: "Strategy NFT Market", icon: ShoppingCart },
    { to: "/risk", label: "Risk Management", icon: Shield },
  ];

  const assetLinks = [
    { to: "/quwallet", label: "QuWallet", icon: Wallet },
    { to: "/staking", label: "Staking", icon: Coins },
    { to: "/nft-studio", label: "NFT Studio", icon: Layers },
    { to: "/token-launchpad", label: "Token Launchpad", icon: Zap },
    { to: "/faucet", label: "Crypto Faucet", icon: Crosshair },
    { to: "/connectors", label: "Connectors", icon: Plug },
    { to: "/data-ecosystem", label: "Data Ecosystem", icon: Layers },
  ];

  const infoLinks = [
    { to: "/news", label: "News Feed", icon: Newspaper },
    { to: "/calendar", label: "Economic Calendar", icon: Calendar },
    { to: "/alerts", label: "Market Alerts", icon: BellRing },
    { to: "/education", label: "Education Library", icon: BookOpen },
    { to: "/analytics", label: "Advanced Analytics", icon: BarChart3 },
  ];

  const moreLinks = [
    { to: "/stats", label: "⚔️ Stats Arena", icon: Trophy },
    { to: "/rewards", label: "🏆 Rewards Store", icon: Gift },
    { to: "/giveaway", label: "🎁 $2M Giveaway", icon: Gift },
    { to: "/media", label: "Media Hub", icon: Music },
    { to: "/revenue", label: "Revenue Center", icon: Coins },
    { to: "/pricing", label: "Pricing", icon: DollarSign },
    { to: "/fees", label: "Platform Fees", icon: Percent },
    { to: "/achievements", label: "Achievements", icon: Trophy },
    { to: "/institutional", label: "Institutional Services", icon: Shield },
    { to: "/settings/accessibility", label: "Accessibility", icon: Settings },
    { to: "/legal", label: "Legal & Disclaimers", icon: Shield },
  ];

  const popoutLinks = [
    { tool: "heatmap", label: "Pop-out Heat Map" },
    { tool: "calendar", label: "Pop-out Calendar" },
    { tool: "watchlist", label: "Pop-out Watchlist" },
    { tool: "screener", label: "Pop-out Screener" },
    { tool: "token-creator", label: "Pop-out Token Creator" },
    { tool: "nft-creator", label: "Pop-out NFT Creator" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-gold rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-gold-foreground font-bold" />
            </div>
            <div>
              <div className="text-xl font-bold text-foreground">AIQTP™</div>
              <div className="text-xs text-muted-foreground">AI Quantum Trading Portal</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            {/* Home Link */}
            <Link to="/" className="text-foreground hover:text-gold cursor-pointer transition-smooth flex items-center gap-1">
              <Home className="w-4 h-4" />
              Home
            </Link>

            {/* Assets & Wallets Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth font-medium">
                <Wallet className="w-4 h-4" />
                <span>Assets & Wallets</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link to="/wallet-assets" className="flex items-center w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    Wallet & Funding
                  </Link>
                </DropdownMenuItem>
                <AdminWalletMenuItems />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Trading Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>Trading</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-96 overflow-y-auto">
                {tradingLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center w-full">
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Agents Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>Agents</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {agentLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center w-full">
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* AI & Quantum Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>AI & Quantum</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {aiQuantumLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center w-full">
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Strategies Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>Strategies</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {strategyLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center w-full">
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Assets Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>Assets</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {assetLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center w-full">
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Info Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>Info</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {infoLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild>
                    <Link to={link.to} className="flex items-center w-full">
                      <link.icon className="mr-2 h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Dropdown with Popouts & Theme */}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>More</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Pages</DropdownMenuLabel>
                {moreLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild className="text-sm">
                    <Link to={link.to} className="flex items-center w-full">
                      <link.icon className="mr-2 h-3.5 w-3.5" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuLabel>Multi-Monitor Popouts</DropdownMenuLabel>
                {popoutLinks.map((link) => (
                  <DropdownMenuItem key={link.tool} onClick={() => openPopout(link.tool)} className="text-sm">
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    {link.label}
                  </DropdownMenuItem>
                ))}

                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="text-sm">
                    <Palette className="mr-2 h-3.5 w-3.5" />
                    Theme
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {themeOptions.map((t) => (
                      <DropdownMenuItem 
                        key={t.id} 
                        onClick={() => setTheme(t.id)}
                        className={`text-sm ${theme === t.id ? "bg-accent" : ""}`}
                      >
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              Global Access
            </Badge>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {user.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline text-sm">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/achievements')}>
                    <Trophy className="mr-2 h-4 w-4 text-amber-500" />
                    Achievements
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wallet-assets')}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Assets & Wallets
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/portfolio')}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Portfolio
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/trading')}>
                    <Activity className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <AdminAccountItem onNavigate={() => navigate('/admin')} />
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="premium" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-foreground hover:text-gold transition-smooth"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <MobileMenu 
            user={user}
            signOut={signOut}
            onClose={() => setIsMenuOpen(false)}
            openPopout={openPopout}
            tradingLinks={tradingLinks}
            agentLinks={agentLinks}
            aiQuantumLinks={aiQuantumLinks}
            strategyLinks={strategyLinks}
            assetLinks={assetLinks}
            infoLinks={infoLinks}
            moreLinks={moreLinks}
            popoutLinks={popoutLinks}
          />
        )}
      </div>
    </header>
  );
};

export default Header;