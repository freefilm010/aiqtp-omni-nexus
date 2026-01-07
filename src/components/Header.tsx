import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  BellRing
} from "lucide-react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

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
              <div className="text-xl font-bold text-foreground">AIQTP</div>
              <div className="text-xs text-muted-foreground">Global Marketplace</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>Markets</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/trading')}>
                  <Activity className="mr-2 h-4 w-4" />
                  Trading Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/advanced-trading')}>
                  <LineChart className="mr-2 h-4 w-4" />
                  Advanced Trading
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/exchange')}>
                  <Globe className="mr-2 h-4 w-4" />
                  Exchange Hub
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/defi-sniper')}>
                  <Crosshair className="mr-2 h-4 w-4" />
                  DeFi Sniper
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/screener')}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Crypto Screener
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/derivatives')}>
                  <Layers className="mr-2 h-4 w-4" />
                  Derivatives
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>AI & Quantum</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/qaqi')}>
                  <Atom className="mr-2 h-4 w-4 text-purple-500" />
                  QAQI Agent (Quantum)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/ai-lab')}>
                  <Brain className="mr-2 h-4 w-4" />
                  AI Research Lab
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/ml-predictions')}>
                  <Cpu className="mr-2 h-4 w-4" />
                  ML Predictions
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/quantum-lab')}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Quantum Lab
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/titan-codex')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Titan Codex
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>Strategies</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/strategy-studio')}>
                  <Target className="mr-2 h-4 w-4" />
                  Strategy Studio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/strategy-lab')}>
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Strategy Lab
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/marketplace')}>
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Marketplace
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/risk')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Risk Management
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center space-x-1 text-foreground hover:text-gold cursor-pointer transition-smooth">
                <span>More</span>
                <ChevronDown className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => navigate('/vault')}>
                  <Zap className="mr-2 h-4 w-4 text-gold" />
                  Lightning Vault
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/nft-studio')}>
                  <Layers className="mr-2 h-4 w-4" />
                  NFT Studio
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/token-launchpad')}>
                  <Zap className="mr-2 h-4 w-4" />
                  Token Launchpad
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/education')}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Education
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/news')}>
                  <Newspaper className="mr-2 h-4 w-4" />
                  News Feed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/calendar')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Economic Calendar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/alerts')}>
                  <BellRing className="mr-2 h-4 w-4 text-red-500" />
                  Alerts Feed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/analytics" className="text-foreground hover:text-gold cursor-pointer transition-smooth">
              Analytics
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Badge variant="outline" className="text-xs">
              <Globe className="w-3 h-3 mr-1" />
              200+ Countries
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
                  <DropdownMenuItem onClick={() => navigate('/trading')}>
                    <User className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
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
          <div className="md:hidden py-4 border-t border-white/20">
            <nav className="space-y-2">
              <div className="text-xs text-muted-foreground uppercase px-3 py-1">Markets</div>
              <Link to="/trading" className="block px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                Trading Dashboard
              </Link>
              <Link to="/advanced-trading" className="block px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                Advanced Trading
              </Link>
              <Link to="/exchange" className="block px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                Exchange Hub
              </Link>
              
              <div className="text-xs text-muted-foreground uppercase px-3 py-1 pt-3">AI & Quantum</div>
              <Link to="/qaqi" className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                <Atom className="w-4 h-4 text-purple-500" />
                QAQI Agent
              </Link>
              <Link to="/ai-lab" className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                <Brain className="w-4 h-4" />
                AI Research Lab
              </Link>
              <Link to="/ml-predictions" className="block px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                ML Predictions
              </Link>
              
              <div className="text-xs text-muted-foreground uppercase px-3 py-1 pt-3">Tools</div>
              <Link to="/vault" className="flex items-center gap-2 px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                <Zap className="w-4 h-4 text-gold" />
                Lightning Vault
              </Link>
              <Link to="/analytics" className="block px-3 py-2 text-foreground hover:text-gold hover:bg-muted/50 rounded transition-smooth">
                Analytics
              </Link>
              
              <div className="pt-4 space-y-3 border-t border-white/10">
                {user ? (
                  <>
                    <div className="text-sm text-muted-foreground px-3 py-2">
                      {user.email}
                    </div>
                    <Button 
                      variant="ghost" 
                      onClick={signOut} 
                      className="w-full justify-start text-foreground hover:text-gold"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link to="/auth" className="block">
                      <Button variant="ghost" className="w-full justify-start">
                        <User className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/auth" className="block">
                      <Button variant="premium" className="w-full">
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;